// src/debug/Debugger.js
// Installation: npm install @tweakpane/plugin-essentials

import * as THREE from "three";
import { Pane } from "tweakpane";
import * as EssentialsPlugin from "@tweakpane/plugin-essentials";
import historyManager from "@data/modules/HistoryManager.js";

export class Debugger {
  constructor(scene, camera, orbitControls, debugSettings) {
    if (!(scene instanceof THREE.Scene)) {
      throw new Error("Debugger: scene must be a THREE.Scene instance");
    }
    if (!(camera instanceof THREE.Camera)) {
      throw new Error("Debugger: camera must be a THREE.Camera instance");
    }
    this.scene = scene;
    this.camera = camera;
    this.orbitControls = orbitControls;
    this.debugSettings = debugSettings;

    // Initialize Tweakpane with EssentialsPlugin
    this.pane = new Pane({
      title: "🛠 Debugger",
      plugins: [EssentialsPlugin],
    });

    // State parameters
    this.params = { selectedObject: null };

    // Create helper visuals and UI
    this.createHighlightBox();
    this.addObjectPicker();
    this.addOrbitControlsDebug();
    this.addOtherDebugOptions();
    this.addInfoOverlay();

    console.log("🧩 Debugger initialized.");
  }

  createHighlightBox() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({ color: 0xffcc00 });
    this.highlight = new THREE.LineSegments(edges, material);
    this.highlight.visible = false;
    this.scene.add(this.highlight);
  }

  addObjectPicker() {
    const meshOptions = {};
    this.scene.traverse((obj) => {
      if (obj.isMesh) {
        const key = obj.name || obj.uuid;
        meshOptions[key] = obj.uuid;
      }
    });
    if (!Object.keys(meshOptions).length) {
      console.warn("Debugger: No mesh objects to pick.");
      return;
    }
    this.params.selectedObject = Object.values(meshOptions)[0];
    const folder = this.pane.addFolder({ title: "🎯 Pick Object" });
    folder
      .addInput(this.params, "selectedObject", {
        label: "Select",
        options: meshOptions,
      })
      .on("change", (ev) => {
        const obj = this.scene.getObjectByProperty("uuid", ev.value);
        if (obj) {
          this.selectObject(obj);
        }
      });
  }

  addOrbitControlsDebug() {
    if (!this.orbitControls) return;
    const folder = this.pane.addFolder({ title: "🕹️ Orbit Controls" });
    const ctrl = this.orbitControls;
    const defaults = {
      enableDamping: ctrl.enableDamping,
      dampingFactor: ctrl.dampingFactor,
      enablePan: ctrl.enablePan,
      enableZoom: ctrl.enableZoom,
      enableRotate: ctrl.enableRotate,
      minDistance: ctrl.minDistance,
      maxDistance: ctrl.maxDistance,
      minPolarAngle: ctrl.minPolarAngle,
      maxPolarAngle: ctrl.maxPolarAngle,
    };
    folder.addInput(ctrl, "enableDamping", { label: "Enable Damping" });
    folder.addInput(ctrl, "dampingFactor", {
      label: "Damping Factor",
      min: 0,
      max: 0.2,
      step: 0.005,
    });
    folder.addInput(ctrl, "enablePan", { label: "Enable Pan" });
    folder.addInput(ctrl, "enableZoom", { label: "Enable Zoom" });
    folder.addInput(ctrl, "enableRotate", { label: "Enable Rotate" });
    folder.addInput(ctrl, "minDistance", {
      label: "Min Distance",
      min: 1,
      max: 100,
      step: 1,
    });
    folder.addInput(ctrl, "maxDistance", {
      label: "Max Distance",
      min: 100,
      max: 1000,
      step: 10,
    });
    folder.addInput(ctrl, "minPolarAngle", {
      label: "Min Polar Angle",
      min: 0,
      max: Math.PI,
      step: 0.01,
    });
    folder.addInput(ctrl, "maxPolarAngle", {
      label: "Max Polar Angle",
      min: 0,
      max: Math.PI,
      step: 0.01,
    });
    folder.addButton({ title: "Reset Controls" }).on("click", () => {
      console.log("Resetting OrbitControls...");
      Object.assign(ctrl, defaults);
      this.pane.refresh();
    });
  }

  addOtherDebugOptions() {
    const folder = this.pane.addFolder({ title: "⚙️ Other Options" });
    if (this.debugSettings) {
      folder.addInput(this.debugSettings, "enableLabelUpdates", {
        label: "Update Labels",
      });
    }
    folder.addMonitor(historyManager, "generalHistory", {
      label: "Gen History",
      view: "list",
      formatter: (v) => (Array.isArray(v) ? v.length : v),
    });
    folder.addButton({ title: "Clear History" }).on("click", () => {
      historyManager.clearAllHistory();
    });
  }

  addInfoOverlay() {
    this.info = document.createElement("div");
    Object.assign(this.info.style, {
      position: "fixed",
      bottom: "20px",
      left: "20px",
      background: "rgba(0,0,0,0.6)",
      padding: "8px 12px",
      fontFamily: "monospace",
      fontSize: "12px",
      borderRadius: "8px",
      color: "white",
      zIndex: "9999",
    });
    this.info.textContent = "ℹ️ No object selected";
    document.body.appendChild(this.info);
  }

  selectObject(object) {
    this.currentObject = object;
    this.updateHighlight(object);
    this.updateInfo(object);
  }

  selectObjectById(uuid) {
    const obj = this.scene.getObjectByProperty("uuid", uuid);
    if (obj && obj.isMesh) {
      this.params.selectedObject = uuid;
      this.pane.refresh();
      this.selectObject(obj);
    }
  }

  updateHighlight(object) {
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    this.highlight.scale.copy(size);
    this.highlight.position.copy(center);
    this.highlight.visible = true;
  }

  updateInfo(object) {
    if (this.info) {
      this.info.textContent = `🔍 ${object.name || object.uuid}`;
    }
  }

  updateObjectPickerOptions(roomMeshesMap) {
    if (!roomMeshesMap || typeof roomMeshesMap !== "object") return;
    const opts = {};
    Object.entries(roomMeshesMap).forEach(([id, { name, mesh }]) => {
      if (mesh && mesh.isMesh) {
        opts[name || id] = mesh.uuid;
      }
    });
    if (this.objectPickerBinding) {
      this.objectPickerBinding.dispose();
    }
    const folder = this.pane.addFolder({ title: "🧱 Rooms" });
    this.params.selectedObject = Object.values(opts)[0];
    folder
      .addInput(this.params, "selectedObject", {
        label: "Select Room",
        options: opts,
      })
      .on("change", (ev) => {
        const obj = this.scene.getObjectByProperty("uuid", ev.value);
        if (obj) this.selectObject(obj);
      });
    this.pane.refresh();
  }

  dispose() {
    this.pane.dispose();
    if (this.highlight) {
      this.highlight.geometry.dispose();
      this.highlight.material.dispose();
      this.scene.remove(this.highlight);
    }
    if (this.info) {
      this.info.remove();
    }
    console.log("Debugger disposed.");
  }
}
