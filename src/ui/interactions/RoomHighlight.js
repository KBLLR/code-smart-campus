/**
 * RoomHighlight.js - Visual feedback for selected/hovered rooms
 *
 * Provides visual highlighting for rooms when picked via raycasting.
 * Integrates with the picking service for HADS-R09.
 */

import * as THREE from 'three';

let highlightedMesh = null;
let originalMaterial = null;
let highlightMaterial = null;
const highlightColor = new THREE.Color(0x0ea5e9); // Sky blue
const highlightEmissiveIntensity = 0.4;

/**
 * Apply highlight effect to a room mesh
 * @param {THREE.Mesh} mesh - The room mesh to highlight
 */
export function applyHighlightToMesh(mesh) {
  if (!mesh) return;

  // Clear previous highlight
  clearHighlight();

  // Store original material
  highlightedMesh = mesh;
  originalMaterial = mesh.material;

  // Create highlight material based on original
  if (originalMaterial instanceof THREE.MeshStandardMaterial) {
    highlightMaterial = new THREE.MeshStandardMaterial({
      color: originalMaterial.color || 0xffffff,
      emissive: highlightColor,
      emissiveIntensity: highlightEmissiveIntensity,
      metalness: originalMaterial.metalness || 0,
      roughness: originalMaterial.roughness || 0.5,
    });
  } else if (originalMaterial instanceof THREE.MeshBasicMaterial) {
    highlightMaterial = new THREE.MeshBasicMaterial({
      color: originalMaterial.color || 0xffffff,
      emissive: highlightColor,
      emissiveIntensity: highlightEmissiveIntensity,
    });
  } else {
    // Fallback for other material types
    highlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: highlightColor,
      emissiveIntensity: highlightEmissiveIntensity,
    });
  }

  // Apply highlight material
  mesh.material = highlightMaterial;
  mesh.material.needsUpdate = true;

  // Slightly increase scale for visual feedback
  mesh.userData._originalScale = mesh.scale.clone();
  mesh.scale.multiplyScalar(1.02);
}

/**
 * Highlight a room by mesh reference
 * Used when you already have the mesh object
 * @param {THREE.Mesh} mesh - The room mesh
 */
export function highlightRoomMesh(mesh) {
  if (mesh instanceof THREE.Mesh) {
    applyHighlightToMesh(mesh);
  }
}

/**
 * Highlight a room by searching in a scene
 * @param {THREE.Scene} scene - The scene to search
 * @param {string} roomId - The room ID to highlight
 */
export function highlightRoomById(scene, roomId) {
  // Search through scene for room mesh with matching roomId
  let found = false;

  scene.traverse((obj) => {
    if (found) return;

    if (obj instanceof THREE.Mesh && obj.userData?.roomId === roomId) {
      applyHighlightToMesh(obj);
      found = true;
    }
  });

  if (!found) {
    console.warn(`[RoomHighlight] Room ${roomId} not found in scene`);
  }
}

/**
 * Clear the current highlight
 */
export function clearHighlight() {
  if (highlightedMesh && originalMaterial) {
    // Restore original material
    highlightedMesh.material = originalMaterial;
    highlightedMesh.material.needsUpdate = true;

    // Restore original scale
    if (highlightedMesh.userData._originalScale) {
      highlightedMesh.scale.copy(highlightedMesh.userData._originalScale);
      delete highlightedMesh.userData._originalScale;
    } else {
      highlightedMesh.scale.multiplyScalar(1 / 1.02);
    }

    // Cleanup
    if (highlightMaterial) {
      highlightMaterial.dispose();
      highlightMaterial = null;
    }

    highlightedMesh = null;
    originalMaterial = null;
  }
}

/**
 * Get the currently highlighted mesh
 * @returns {THREE.Mesh|null} The highlighted mesh or null
 */
export function getHighlightedMesh() {
  return highlightedMesh;
}

/**
 * Check if a room is currently highlighted
 * @param {string} roomId - The room ID to check
 * @returns {boolean} True if the room is highlighted
 */
export function isRoomHighlighted(roomId) {
  return highlightedMesh?.userData?.roomId === roomId;
}

/**
 * Cleanup highlight resources
 */
export function disposeHighlight() {
  clearHighlight();
  if (highlightMaterial) {
    highlightMaterial.dispose();
    highlightMaterial = null;
  }
}
