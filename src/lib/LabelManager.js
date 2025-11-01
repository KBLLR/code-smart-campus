// src/lib/LabelManager.js
import * as THREE from "three";
import { createLabel } from "@ui/createLabel.js";

export class LabelManager {
  constructor(scene, registry, roomRegistry) {
    if (!(scene instanceof THREE.Scene)) {
      console.error("LabelManager: Invalid scene object provided.");
      this.scene = new THREE.Scene(); // Fallback to avoid errors, but indicates a problem
    } else {
      this.scene = scene;
    }
    this.registry = registry || {}; // Use defaults if registries are missing
    this.roomRegistry = roomRegistry || {};
    this.labels = {}; // Initialize labels object

    // Simple check if registries seem valid
    if (Object.keys(this.registry).length === 0) {
      console.warn("[LabelManager] Initialized with an empty label registry.");
    }
    if (Object.keys(this.roomRegistry).length === 0) {
      console.warn("[LabelManager] Initialized with an empty room registry.");
    }
  }

  injectLabels() {
    let injectedCount = 0;
    // Clear existing labels before injecting new ones, if necessary
    this.dispose();

    Object.entries(this.registry).forEach(([entityId, data]) => {
      // Basic validation of data structure
      if (!data || !data.room || !data.label) {
        console.warn(
          `[LabelManager] Skipping ${entityId}: Missing required data (room or label).`,
          data,
        );
        return;
      }

      const roomId = data.room?.toLowerCase();
      const roomData = this.roomRegistry[roomId];

      // Check if room exists and has center coordinates
      if (
        !roomData ||
        !roomData.center ||
        !Array.isArray(roomData.center) ||
        roomData.center.length !== 3
      ) {
        console.warn(
          `[LabelManager] Skipping ${entityId}: Room '${roomId}' not found in roomRegistry or missing valid center coordinates.`,
        );
        return;
      }

      try {
        const label = createLabel(data.label, true, entityId); // Assuming createLabel works
        label.position.set(...roomData.center); // Use spread operator for coordinates

        // Ensure userData exists and store relevant info
        label.userData = {
          ...label.userData, // Preserve existing userData if any
          registry: data,
          room: roomId,
          entityId: entityId, // Store original entityId for reference
          intensity: 0, // Default intensity
        };

        this.scene.add(label);
        this.labels[entityId] = label; // Store label keyed by entityId
        injectedCount++;
      } catch (error) {
        console.error(
          `[LabelManager] Error creating or adding label for ${entityId}:`,
          error,
        );
      }
    });

    console.info(`✅ Injected ${injectedCount} labels into the scene.`);
  }

  updateLabel(entityId, value) {
    const label = this.labels[entityId];
    if (!label) {
      // console.warn(`[LabelManager] Attempted to update non-existent label: ${entityId}`);
      return; // Exit if label doesn't exist
    }

    // Ensure userData and registry sub-object exist
    if (!label.userData) label.userData = {};
    if (!label.userData.registry) label.userData.registry = {};

    // Store the latest value
    label.userData.registry.value = value;

    // Check if the label object has an 'updateText' method (duck typing)
    if (typeof label.updateText === "function") {
      // Construct the text to display (e.g., "Friendly Name: Value")
      const displayText = `${label.userData.registry.label || entityId}: ${value}`;
      label.updateText(displayText);
    } else {
      // console.warn(`[LabelManager] Label for ${entityId} does not have an updateText method.`);
      // Fallback: try updating textContent if it's a simple text mesh/sprite?
      // if (label.element) label.element.textContent = displayText; // Example for CSS2DObject
    }
  }

  getLabels() {
    return this.labels; // Return the internal labels object
  }

  // Method to update label positions, e.g., to face camera (if using Sprites)
  updateLabelPositions(camera) {
    Object.values(this.labels).forEach((label) => {
      // Logic depends on label type (Sprite, CSS2DObject, etc.)
      // Example for simple sprites needing scaling:
      const scale = label.position.distanceTo(camera.position) / 10;
      label.scale.set(scale, scale, scale);
    });
  }

  dispose() {
    Object.values(this.labels).forEach((label) => {
      this.scene.remove(label); // Remove from scene first
      // Dispose geometries and materials if they exist directly on children
      label.traverse((child) => {
        if (child.material) {
          // Dispose textures if material has them
          Object.values(child.material).forEach((prop) => {
            if (prop instanceof THREE.Texture) {
              prop.dispose();
            }
          });
          child.material.dispose();
        }
        if (child.geometry) child.geometry.dispose();
      });
      // Specific disposal if label itself has geometry/material (e.g., Sprite)
      if (label.material) label.material.dispose();
      if (label.geometry) label.geometry.dispose();
    });
    this.labels = {}; // Clear the internal registry
    console.log("[LabelManager] Disposed all labels.");
  }
}
