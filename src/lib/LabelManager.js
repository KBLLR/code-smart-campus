// src/lib/LabelManager.js
import * as THREE from "three";
import { createLabel } from "@ui/createLabel.js";

export class LabelManager {
  constructor(scene, registry, roomRegistry, options = {}) {
    if (!(scene instanceof THREE.Scene)) {
      console.error("LabelManager: Invalid scene object provided.");
      this.scene = new THREE.Scene(); // Fallback to avoid errors, but indicates a problem
    } else {
      this.scene = scene;
    }
    this.registry = registry || {}; // Use defaults if registries are missing
    this.roomRegistry = roomRegistry || {};
    this.useSprites = options.useSprites ?? false;
    this.labels = {}; // Sprite-based labels retained for legacy layout flows (optional)
    this.anchors = {}; // Lightweight objects for CSS HUD

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
        const anchor = new THREE.Object3D();
        anchor.position.set(...roomData.center);
        anchor.userData = {
          registry: data,
          room: roomId,
          entityId,
          hudOffset: data?.hudOffset ?? 12,
        };

        if (this.useSprites) {
          const label = createLabel(data.label, entityId);
          label.position.set(...roomData.center);
          label.userData = {
            ...label.userData,
            registry: data,
            room: roomId,
            entityId,
            intensity: 0,
          };
          this.scene.add(label);
          this.labels[entityId] = label;
        }
        this.scene.add(anchor);
        this.anchors[entityId] = anchor;
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
    const anchor = this.anchors[entityId];

    if (this.useSprites && label) {
      if (!label.userData) label.userData = {};
      if (!label.userData.registry) label.userData.registry = {};
      label.userData.registry.value = value;
      if (typeof label.updateText === "function") {
        const displayText = `${label.userData.registry.label || entityId}: ${value}`;
        label.updateText(displayText);
      }
    }

    if (anchor) {
      if (!anchor.userData) anchor.userData = {};
      if (!anchor.userData.registry) anchor.userData.registry = {};
      anchor.userData.registry.value = value;
    }
  }

  getLabels() {
    return this.useSprites ? this.labels : this.anchors;
  }

  getAnchors() {
    return this.anchors;
  }

  getAnchor(entityId) {
    return this.anchors[entityId] || null;
  }

  // Method to update label positions, e.g., to face camera (if using Sprites)
  updateLabelPositions(camera) {
    if (!this.useSprites) return;
    Object.values(this.labels).forEach((label) => {
      // Logic depends on label type (Sprite, CSS2DObject, etc.)
      // Example for simple sprites needing scaling:
      const scale = label.position.distanceTo(camera.position) / 10;
      label.scale.set(scale, scale, scale);
    });
  }

  dispose() {
    if (this.useSprites) {
      Object.values(this.labels).forEach((label) => {
        this.scene.remove(label);
        label.traverse((child) => {
          if (child.material) {
            Object.values(child.material).forEach((prop) => {
              if (prop instanceof THREE.Texture) {
                prop.dispose();
              }
            });
            child.material.dispose();
          }
          if (child.geometry) child.geometry.dispose();
        });
        if (label.material) label.material.dispose();
        if (label.geometry) label.geometry.dispose();
      });
    }
    Object.values(this.anchors).forEach((anchor) => {
      this.scene.remove(anchor);
    });
    this.labels = {};
    this.anchors = {};
    console.log("[LabelManager] Disposed all labels.");
  }
}
