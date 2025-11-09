import * as THREE from "three";

/** @typedef {import("@/types/uil.js").UILController} UILController */

function createHighlight(scene) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const edges = new THREE.EdgesGeometry(geometry);
  const material = new THREE.LineBasicMaterial({
    color: 0xffcc00,
    linewidth: 2,
    transparent: true,
    opacity: 0.95,
    depthTest: false,
  });
  const highlight = new THREE.LineSegments(edges, material);
  highlight.visible = false;
  highlight.renderOrder = 999;
  scene.add(highlight);
  geometry.dispose();
  return highlight;
}

function updateHighlightMesh(highlight, mesh) {
  if (!highlight || !mesh) return;
  mesh.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(mesh);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  highlight.scale.copy(size);
  highlight.position.copy(center);
  highlight.visible = true;
}

function focusMesh(setup, mesh) {
  if (!setup?.focusOnPoint || !mesh) return;
  const point = new THREE.Vector3();
  mesh.getWorldPosition(point);
  setup.focusOnPoint(point, 0.8);
}

/**
 * Register debugger controls (room picker + highlight/focus) with UIL.
 * @param {{ controller: UILController, roomMeshes: Record<string,THREE.Object3D>, setup: import("@/Setup.js").default, scene: THREE.Scene, extraEntries?: Array<{ id: string, label: string, object: THREE.Object3D, highlightable?: boolean }> }} params
 */
export async function registerDebuggerControls({
  controller,
  roomMeshes,
  setup,
  scene,
  extraEntries = [],
}) {
  if (!controller || !roomMeshes || !scene) return;

  const highlight = createHighlight(scene);
  const selectionEntries = [];
  Object.entries(roomMeshes).forEach(([id, mesh]) => {
    if (mesh && (mesh.isMesh || mesh.isGroup)) {
      selectionEntries.push({
        id,
        label: mesh.name || id,
        object: mesh,
        highlightable: true,
      });
    }
  });
  extraEntries?.forEach?.((entry) => {
    if (entry?.id && entry.object) {
      selectionEntries.push({
        id: entry.id,
        label: entry.label || entry.id,
        object: entry.object,
        highlightable: Boolean(entry.highlightable),
      });
    }
  });
  if (!selectionEntries.length) return;

  const selectionMap = new Map();
  const options = selectionEntries.map((entry) => {
    selectionMap.set(entry.id, entry);
    return { label: entry.label, value: entry.id };
  });
  let selectedId = options[0].value;

  const updateSelection = (id) => {
    selectedId = id;
    const entry = selectionMap.get(id);
    if (entry?.highlightable && entry.object) {
      updateHighlightMesh(highlight, entry.object);
    } else {
      highlight.visible = false;
    }
  };

  const moduleRecord = await controller.registerModule({
    id: "debug",
    label: "Debugger",
    open: false,
    controls: [
      {
        id: "perfSummary",
        label: "Performance",
        type: "text",
        default: "FPS -- / ms --",
        params: { w: 240 },
      },
      {
        id: "perfGraph",
        label: "Frame Graph",
        type: "graph",
        default: [0, 0],
        params: {
          w: 240,
          h: 120,
          multiplicator: 120,
          precision: 1,
          autoWidth: false,
          line: true,
        },
      },
      {
        id: "roomPicker",
        label: "Room",
        type: "list",
        options: options.reduce((acc, option) => {
          acc[option.label] = option.value;
          return acc;
        }, {}),
        default: selectedId,
        onChange: (value) => updateSelection(value),
      },
      {
        id: "highlightToggle",
        label: "Show Highlight",
        type: "bool",
        default: true,
        onChange: (value) => {
          const entry = selectionMap.get(selectedId);
          highlight.visible =
            value && Boolean(entry?.highlightable && entry.object);
        },
      },
      {
        id: "focusRoom",
        label: "Focus Camera",
        type: "button",
        onChange: () => {
          const entry = selectionMap.get(selectedId);
          focusMesh(setup, entry?.object);
        },
      },
      {
        id: "resetSelection",
        label: "Reset Selection",
        type: "button",
        onChange: () => {
          updateSelection(options[0].value);
          const defaultEntry = selectionMap.get(options[0].value);
          focusMesh(setup, defaultEntry?.object);
        },
      },
    ],
  });

  if (moduleRecord?.controls) {
    const perfState =
      scene.userData.performance ||
      {
        fps: 0,
        ms: 0,
        frames: 0,
        lastStamp: performance?.now?.() ?? Date.now(),
        lastFpsStamp: performance?.now?.() ?? Date.now(),
      };

    const perfTextHandle = moduleRecord.controls.get("perfSummary")?.handle;
    const perfGraphHandle = moduleRecord.controls.get("perfGraph")?.handle;

    perfState.handles = {
      text: perfTextHandle,
      graph: perfGraphHandle,
    };
    perfState.tick = (delta = 0) => {
      const now = performance?.now?.() ?? Date.now();
      perfState.frames += 1;
      perfState.ms = delta;
      if (now - perfState.lastFpsStamp >= 1000) {
        perfState.fps =
          (perfState.frames * 1000) / (now - perfState.lastFpsStamp || 1);
        perfState.frames = 0;
        perfState.lastFpsStamp = now;
      }
      const summary = `FPS ${perfState.fps.toFixed(0)} / ${perfState.ms.toFixed(1)}ms`;
      perfTextHandle?.setValue(summary, { silent: true });
      perfGraphHandle?.setValue?.(
        [Math.min(120, perfState.fps), Math.min(60, perfState.ms)],
        { silent: true },
      );
    };
    scene.userData.performance = perfState;
  }

  // Initial selection highlight
  updateSelection(selectedId);
}
