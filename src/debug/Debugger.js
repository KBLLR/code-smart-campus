// --- START OF FILE src/debug/Debugger.js (Corrected and Complete) ---

import * as THREE from "three";
import { Pane } from "tweakpane";
import * as EssentialsPlugin from "@tweakpane/plugin-essentials";
import historyManager from "@data/modules/HistoryManager.js";

export class Debugger {
  // Constructor accepts scene, camera, orbitControls, and the debugSettings state object
  constructor(scene, camera, orbitControls, debugSettingsRef) {
    // --- Validation ---
    if (!(scene instanceof THREE.Scene))
      throw new Error("Debugger: scene must be a THREE.Scene instance");
    if (!(camera instanceof THREE.Camera))
      throw new Error("Debugger: camera must be a THREE.Camera instance");
    if (!orbitControls || typeof orbitControls.update !== "function")
      throw new Error("Debugger: Valid orbitControls instance is required.");
    if (!debugSettingsRef || typeof debugSettingsRef !== "object")
      throw new Error("Debugger: debugSettingsRef object is required.");

    this.scene = scene;
    this.camera = camera;
    this.orbitControls = orbitControls; // Store controls instance
    this.debugSettings = debugSettingsRef; // Store reference to settings object from main.js
    this.orbitControlsDefaults = {}; // Initialize object to store default values

    // --- Initialize Tweakpane ---
    this.pane = new Pane({ title: "🛠 Debugger" });
    this.pane.registerPlugin(EssentialsPlugin); // Register essentials plugin

    // --- Internal State ---
    this.params = { selectedObject: null }; // For object picker binding
    this.objectPickerBinding = null;
    this.currentObject = null;

    // --- Setup Debug Elements ---
    // 1. FPS Graph
    const fpsGraph = this.pane.addBlade({
      view: "fpsgraph",
      label: "FPS",
      lineCount: 2,
    });
    this.updateFpsGraph = () => fpsGraph.begin();
    this.endFpsGraph = () => fpsGraph.end();

    // 2. Highlight Box for selected objects
    this.createHighlightBox();

    // 3. Object Picker (Initial for general scene meshes)
    this.addObjectPicker();

    // --- FIX: Call the methods to add Tweakpane folders ---
    this.addOrbitControlsDebug(); // Call the function to add orbit controls folder
    this.addSunVisualDebug(); // Sun visuals tuning
    this.addPostFXDebug(); // Post-processing controls
    this.addOtherDebugOptions(); // Call the function to add other options folder

    // --- END FIX ---

    // 4. Info Overlay (shows selected object name/UUID)
    this.addInfoOverlay();

    console.log("🧩 Debugger initialized with Tweakpane panels.");
  }

  // --- Expose Tweakpane DOM element for visibility toggling ---
  get domElement() {
    // Find the outermost Tweakpane container element
    return this.pane.element?.closest(".tp-dfwv");
  }

  /** Creates the yellow highlight box */
  createHighlightBox() {
    const geometry = new THREE.BoxGeometry(1, 1, 1); // Start with unit size
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({
      color: 0xffcc00,
      depthTest: false,
      depthWrite: false,
    }); // Disable depth test to always show
    this.highlight = new THREE.LineSegments(edges, material);
    this.highlight.renderOrder = 999; // Render on top
    this.highlight.visible = false;
    this.scene.add(this.highlight);
    // Dispose base geometry immediately as EdgesGeometry creates its own
    geometry.dispose();
  }

  /** Creates the info overlay div */
  addInfoOverlay() {
    this.info = document.createElement("div");
    this.info.id = "debugger-info-overlay"; // Add ID for easier selection/styling
    this.info.style.cssText = `
      position: fixed; bottom: 20px; left: 20px;
      background: rgba(0,0,0,0.7); color: white;
      padding: 6px 10px; border-radius: 4px;
      font-family: monospace; font-size: 11px;
      z-index: 10001; /* Above stats/tweakpane */
      pointer-events: none; /* Allow clicks through */
      max-width: 300px; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis;
    `;
    this.info.textContent = "ℹ️ Debugger Active (No Selection)";
    document.body.appendChild(this.info);
  }

  /** Adds the initial Tweakpane folder for picking any mesh in the scene */
  addObjectPicker() {
    const meshOptions = { None: null }; // Start with a 'None' option
    let firstMeshUUID = null;

    this.scene.traverse((obj) => {
      if (obj.isMesh && obj !== this.highlight) {
        // Exclude the highlight box itself
        const key = obj.name
          ? `${obj.name} (${obj.uuid.substring(0, 4)})`
          : obj.uuid;
        meshOptions[key] = obj.uuid;
        if (!firstMeshUUID) firstMeshUUID = obj.uuid; // Capture first valid mesh
      }
    });

    if (Object.keys(meshOptions).length <= 1) {
      // Only 'None' option
      console.warn("Debugger: No pickable mesh objects found in the scene.");
      // Maybe don't add the folder if there's nothing to pick?
      return;
    }

    // Default selection to 'None' or the first mesh found
    this.params.selectedObject = firstMeshUUID; // Or set to null to default to 'None'

    const folder = this.pane.addFolder({ title: "🎯 Pick Scene Object" });
    this.objectPickerBinding = folder.addBinding(
      this.params,
      "selectedObject",
      {
        label: "Select",
        options: meshOptions,
      },
    );

    this.objectPickerBinding.on("change", (ev) => {
      if (ev.value) {
        // If a valid UUID is selected
        const selected = this.scene.getObjectByProperty("uuid", ev.value);
        if (selected) this.selectObject(selected);
      } else {
        // 'None' selected
        this.deselectObject();
      }
    });

    // Initial selection if a default UUID was set
    if (this.params.selectedObject) {
      const initialObject = this.scene.getObjectByProperty(
        "uuid",
        this.params.selectedObject,
      );
      if (initialObject) this.selectObject(initialObject);
    } else {
      this.deselectObject();
    }
  }

  /** Updates the picker options specifically for room meshes */
  updateObjectPickerOptions(roomMeshesMap) {
    console.log(
      "[Debugger] Updating object picker options with room meshes map...",
    );
    if (!roomMeshesMap || typeof roomMeshesMap !== "object") {
      console.warn("[Debugger] Invalid roomMeshesMap provided.");
      return;
    }
    const options = {
      // Add a "None" option
      None: null,
    };
    let firstMeshUUID = null;
    Object.entries(roomMeshesMap).forEach(([id, mesh]) => {
      // Expects { id: mesh } format now
      if (mesh && (mesh.isMesh || mesh.isGroup)) {
        // Allow picking groups too
        const displayName = mesh.name || id;
        options[displayName] = mesh.uuid;
        if (!firstMeshUUID) firstMeshUUID = mesh.uuid; // Store the first valid UUID
      }
    });

    // Dispose of the old binding *before* adding the new folder/binding
    if (
      this.objectPickerBinding &&
      this.objectPickerBinding.element?.parentElement
    ) {
      try {
        this.objectPickerBinding.dispose();
      } catch { /* Ignored error during dispose */ } // Dispose safely
      this.objectPickerBinding = null; // Clear reference
    }

    if (Object.keys(options).length <= 1) {
      // Only has "None" option
      console.warn("[Debugger] No valid room meshes found to populate picker.");
      return; // Don't add the folder if no rooms
    }

    // Consider adding to a specific folder or replacing the initial picker
    const folder = this.pane.addFolder({ title: "🧱 Rooms", expanded: true });

    // Set default selection to the first room found, or None
    this.params.selectedObject = firstMeshUUID;

    this.objectPickerBinding = folder.addBinding(
      this.params,
      "selectedObject",
      {
        label: "Select Room",
        options,
      },
    );

    this.objectPickerBinding.on("change", (ev) => {
      const selected = ev.value
        ? this.scene.getObjectByProperty("uuid", ev.value)
        : null;
      this.selectObject(selected); // Update selection based on change
    });

    // Manually trigger selection logic for the initial value
    this.selectObject(
      this.scene.getObjectByProperty("uuid", this.params.selectedObject),
    );

    this.pane.refresh();
  }

  /** Selects an object, updates highlight and info */
  selectObject(object) {
    if (!object || !object.isObject3D) {
      console.warn("Debugger: Invalid object passed to selectObject.");
      this.deselectObject();
      return;
    }
    this.currentObject = object;
    this.updateHighlight(object);
    this.updateInfo(object);
    console.log(`[Debugger] Selected: ${object.name || object.uuid}`);
  }

  /** Clears the current selection */
  deselectObject() {
    this.currentObject = null;
    this.highlight.visible = false; // Hide highlight
    if (this.info) this.info.textContent = "ℹ️ Debugger Active (No Selection)"; // Update info overlay
    // Reset the picker value to 'None' if it exists
    if (Object.prototype.hasOwnProperty.call(this.params, "selectedObject")) {
      this.params.selectedObject = null;
    }
    this.pane?.refresh(); // Refresh pane to reflect deselection if needed
    console.log("[Debugger] Deselected object.");
  }

  /** Updates the highlight box to match the selected object */
  updateHighlight(object) {
    if (!object || !this.highlight) return;
    try {
      // Ensure the object's matrices are up-to-date for accurate bounding box
      object.updateWorldMatrix(true, false);
      const box = new THREE.Box3().setFromObject(object, true); // Use precise bounding box

      if (box.isEmpty()) {
        console.warn(
          `Debugger: Bounding box for ${object.name || object.uuid} is empty.`,
        );
        this.highlight.visible = false;
        return;
      }

      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      // Handle zero-sized dimensions to avoid visual glitches
      const minSize = 0.1; // Smallest visible size
      size.x = Math.max(size.x, minSize);
      size.y = Math.max(size.y, minSize);
      size.z = Math.max(size.z, minSize);

      this.highlight.scale.copy(size);
      this.highlight.position.copy(center);
      this.highlight.rotation.set(0, 0, 0); // Reset rotation, rely on object's world matrix
      this.highlight.quaternion.copy(
        object.getWorldQuaternion(new THREE.Quaternion()),
      ); // Match world rotation

      this.highlight.visible = true;
    } catch (error) {
      console.error("Debugger: Error updating highlight box:", error);
      this.highlight.visible = false;
    }
  }

  /** Updates the info overlay text */
  updateInfo(object) {
    if (!this.info || !object) return;
    // Provide more info: Name, Type, UUID snippet
    const type = object.type || "Object3D";
    const name = object.name || "(No Name)";
    const uuidSnippet = object.uuid.substring(0, 8);
    this.info.textContent = `🔍 ${name} [${type}] (${uuidSnippet})`;
    this.info.title = `UUID: ${object.uuid}`; // Show full UUID on hover
  }

  /** Adds the OrbitControls debug folder to Tweakpane */
  addOrbitControlsDebug() {
    // Ensure controls exist before adding folder
    if (!this.orbitControls) return;

    const folder = this.pane.addFolder({ title: "🕹️ Orbit Controls" });
    const params = this.orbitControlsDefaults; // Store defaults here

    // Properties to debug
    const propsToDebug = [
      { prop: "enableDamping", label: "Damping" },
      { prop: "dampingFactor", label: "Factor", min: 0, max: 0.2, step: 0.005 },
      { prop: "enablePan", label: "Pan" },
      { prop: "enableZoom", label: "Zoom" },
      { prop: "enableRotate", label: "Rotate" },
      { prop: "minDistance", label: "Min Dist", min: 1, max: 100, step: 1 },
      { prop: "maxDistance", label: "Max Dist", min: 100, max: 1000, step: 10 },
      {
        prop: "minPolarAngle",
        label: "Min Polar",
        min: 0,
        max: Math.PI,
        step: 0.01,
        format: (v) => v.toFixed(2),
      },
      {
        prop: "maxPolarAngle",
        label: "Max Polar",
        min: 0,
        max: Math.PI,
        step: 0.01,
        format: (v) => v.toFixed(2),
      },
      { prop: "panSpeed", label: "Pan Speed", min: 0, max: 5, step: 0.1 },
      { prop: "rotateSpeed", label: "Rotate Speed", min: 0, max: 5, step: 0.1 },
      { prop: "zoomSpeed", label: "Zoom Speed", min: 0, max: 5, step: 0.1 },
    ];

    propsToDebug.forEach((item) => {
      if (Object.prototype.hasOwnProperty.call(this.orbitControls, item.prop)) {
        params[item.prop] = this.orbitControls[item.prop]; // Store default
        folder.addBinding(this.orbitControls, item.prop, { ...item }); // Add binding
      } else {
        console.warn(`Debugger: OrbitControls missing property '${item.prop}'`);
      }
    });

    // Reset button
    folder.addButton({ title: "Reset Controls" }).on("click", () => {
      console.log("Resetting OrbitControls to defaults...");
      Object.keys(params).forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(this.orbitControls, key)) {
          this.orbitControls[key] = params[key];
        }
      });
      this.pane.refresh(); // Refresh pane to show reset values
      this.orbitControls.update(); // Needed if damping is on/target changed etc.
    });

    const cameraDebug = this.scene?.userData?.cameraDebug;
    if (cameraDebug) {
      const state = cameraDebug.getState();
      const orbitParams = {
        autoRotate: state.autoRotate.enabled,
        autoRotateSpeed: state.autoRotate.speedDeg,
        bookmarkName: "",
      };

      folder
        .addBinding(orbitParams, "autoRotate", { label: "Auto Rotate" })
        .on("change", (ev) => cameraDebug.setAutoRotate(ev.value, true));

      folder
        .addBinding(orbitParams, "autoRotateSpeed", {
          label: "Rotate °/s",
          min: 0,
          max: 60,
          step: 0.5,
        })
        .on("change", (ev) => cameraDebug.setAutoRotateSpeed(ev.value));

      folder.addBinding(orbitParams, "bookmarkName", { label: "Bookmark" });

      folder.addButton({ title: "Save Bookmark" }).on("click", () => {
        if (orbitParams.bookmarkName) {
          cameraDebug.saveBookmark(orbitParams.bookmarkName);
          orbitParams.bookmarkName = "";
          folder.refresh();
        }
      });

      folder.addButton({ title: "Go Bookmark" }).on("click", () => {
        if (orbitParams.bookmarkName) {
          cameraDebug.goToBookmark(orbitParams.bookmarkName);
        }
      });

      folder.addButton({ title: "List Bookmarks" }).on("click", () => {
        console.table(cameraDebug.listBookmarks());
      });
    }
  }

  addSunVisualDebug() {
    const sunDebug = this.scene?.userData?.sunDebug;
    if (!sunDebug) return;

    const folder = this.pane.addFolder({
      title: "🌞 Sun Visuals",
      expanded: false,
    });
    const palette = sunDebug.config.palette;

    const slotMeta = [
      { key: "dawn", label: "🌅 Dawn" },
      { key: "day", label: "☀️ Day" },
      { key: "dusk", label: "🌇 Dusk" },
      { key: "night", label: "🌙 Night" },
    ];

    slotMeta.forEach(({ key, label }) => {
      const slot = palette?.[key];
      if (!slot) return;
      const slotFolder = folder.addFolder({
        title: label,
        expanded: key === "day",
      });
      slotFolder
        .addBinding(slot, "top", { label: "Zenith", view: "color" })
        .on("change", () => sunDebug.apply());
      slotFolder
        .addBinding(slot, "horizon", { label: "Horizon", view: "color" })
        .on("change", () => sunDebug.apply());
      slotFolder
        .addBinding(slot, "glow", { label: "Glow", view: "color" })
        .on("change", () => sunDebug.apply());
    });

    folder
      .addBinding(sunDebug.config, "arcColor", {
        label: "Arc Color",
        view: "color",
      })
      .on("change", () => sunDebug.apply());

    folder
      .addBinding(sunDebug.config, "arcOpacity", {
        label: "Arc Opacity",
        min: 0,
        max: 1,
        step: 0.01,
      })
      .on("change", () => sunDebug.apply());

    folder.addButton({ title: "Reset" }).on("click", () => {
      sunDebug.reset();
      sunDebug.apply();
      folder.refresh();
    });
  }

  addPostFXDebug() {
    const postFX = this.scene?.userData?.postFX;
    if (!postFX || !postFX.config) return;

    const folder = this.pane.addFolder({
      title: "✨ Post FX",
      expanded: false,
    });

    folder
      .addBinding(postFX.config, "enabled", { label: "Enabled" })
      .on("change", (ev) => postFX.setEnabled(ev.value));

    folder
      .addBinding(postFX.config, "bloomStrength", {
        label: "Bloom Strength",
        min: 0,
        max: 2,
        step: 0.01,
      })
      .on("change", (ev) =>
        postFX.setBloomSettings({ strength: ev.value }),
      );

    folder
      .addBinding(postFX.config, "bloomRadius", {
        label: "Bloom Radius",
        min: 0,
        max: 1.5,
        step: 0.01,
      })
      .on("change", (ev) => postFX.setBloomSettings({ radius: ev.value }));

    folder
      .addBinding(postFX.config, "bloomThreshold", {
        label: "Bloom Threshold",
        min: 0,
        max: 1,
        step: 0.01,
      })
      .on("change", (ev) =>
        postFX.setBloomSettings({ threshold: ev.value }),
      );
  }

  /** Adds other debug options folder */
  addOtherDebugOptions() {
    const folder = this.pane.addFolder({
      title: "⚙️ Other Options",
      expanded: false,
    }); // Start collapsed
    // Toggle for Label Updates (using the referenced debugSettings object)
    if (
      this.debugSettings &&
      Object.prototype.hasOwnProperty.call(this.debugSettings, "enableLabelUpdates")
    ) {
      folder.addBinding(this.debugSettings, "enableLabelUpdates", {
        label: "Update Labels",
      });
    } else {
      console.warn(
        "Debugger: debugSettings missing 'enableLabelUpdates' property.",
      );
    }

    // Monitor history size (check if historyManager is available)
    if (historyManager && historyManager.generalHistory) {
      folder.addMonitor(historyManager, "generalHistory", {
        label: "Gen History",
        count: true,
      });
    } else {
      console.warn(
        "Debugger: historyManager or generalHistory not available for monitoring.",
      );
    }

    // Button to clear history
    if (
      historyManager &&
      typeof historyManager.clearAllHistory === "function"
    ) {
      folder
        .addButton({ title: "Clear History" })
        .on("click", () => historyManager.clearAllHistory());
    }
  }

  /** Cleans up resources */
  dispose() {
    this.pane?.dispose();
    this.highlight?.geometry?.dispose();
    this.highlight?.material?.dispose();
    if (this.highlight && this.scene) this.scene.remove(this.highlight);
    this.info?.remove();
    console.log("Debugger disposed.");
    // Nullify references
    this.pane = null;
    this.highlight = null;
    this.info = null;
    this.scene = null;
    this.camera = null;
    this.orbitControls = null;
    this.debugSettings = null;
    this.currentObject = null;
  }
}

// --- END OF FILE src/debug/Debugger.js (Corrected and Complete) ---
