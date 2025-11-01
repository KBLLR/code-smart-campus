// src/debug/debugState.js
export const debugState = {
  target: null, // Currently selected mesh
  registry: {}, // Will be set to your roomMeshes or other mesh dictionary
  wireframe: false,
  opacity: 0.9,
  scale: { x: 1, y: 1, z: 1 },
  rotation: { x: 0, y: 0, z: 0 },
  position: { x: 0, y: 0, z: 0 },
};
