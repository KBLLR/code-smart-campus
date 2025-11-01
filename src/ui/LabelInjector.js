// src/utils/LabelInjector.js
import { createLabel } from "@ui/createLabel.js";

export function injectLabels({ scene, labels, labelRegistry, roomRegistry }) {
  Object.entries(labelRegistry).forEach(([entityId, entry]) => {
    const roomKey = entry.room?.toLowerCase();
    const room = roomRegistry[roomKey];

    if (!room?.center) {
      console.warn(`[Labels] Skipping ${entityId}: missing center`);
      return;
    }

    const labelObj = createLabel(entry.label, true, entityId);
    labelObj.position.set(...room.center);
    labelObj.userData = {
      ...entry,
      room: roomKey,
      sprite: labelObj.children[0],
      intensity: 0,
    };

    labels[entityId] = labelObj;
    scene.add(labelObj);
  });

  console.log(`✅ ${Object.keys(labels).length} labels injected into scene.`);
}

export function reinjectLabels(newRegistry) {
  // Clear current labels
  Object.values(window.labels).forEach((label) => {
    window.scene.remove(label);
  });
  Object.keys(window.labels).forEach((key) => delete window.labels[key]);

  // Inject new ones
  injectLabels({
    scene: window.scene,
    labels: window.labels,
    labelRegistry: newRegistry,
    roomRegistry: window.roomMeshes, // or `@data/roomRegistry.js` if unchanged
  });
}
