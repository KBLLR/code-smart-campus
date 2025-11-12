/**
 * RoomMeshGenerator - Creates invisible room mesh shells for picking
 *
 * Generates BoxGeometry meshes for each room in the registry with:
 * - userData.roomId for raycaster identification
 * - Position from room center coordinates
 * - Invisible material (for picking, not rendering)
 */

import * as THREE from 'three';

/**
 * Create invisible room mesh shells for picking
 * @param {Object} roomRegistry - Map of room data with center coordinates
 * @param {Object} entityLocations - Map of room metadata (name, icon, category)
 * @returns {THREE.Mesh[]} Array of room mesh shells
 */
export function createRoomMeshes(roomRegistry, entityLocations = null) {
  const roomMeshes = [];

  // Use a shared invisible material for all room meshes
  const invisibleMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    colorWrite: false, // Don't write to color buffer
  });

  // Create meshes from room registry
  Object.entries(roomRegistry).forEach(([key, roomData]) => {
    if (!roomData.center) return; // Skip rooms without position data

    // Box dimensions (approximate classroom size in meters)
    const width = 10;
    const height = 3;
    const depth = 10;

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geometry, invisibleMaterial);

    // Position from registry center
    mesh.position.set(...roomData.center);

    // Store metadata for picking/display
    mesh.userData.roomId = key;
    mesh.userData.roomName = roomData.name;

    // Optional: Add metadata from entity locations if provided
    if (entityLocations && entityLocations[key]) {
      const entity = entityLocations[key];
      mesh.userData.displayName = entity.name;
      mesh.userData.icon = entity.icon;
      mesh.userData.category = entity.category;
      mesh.userData.potentialSensors = entity.potentialSensors;
    }

    // Don't add to scene yet - caller will do that
    // scene.add(mesh);
    roomMeshes.push(mesh);
  });

  return roomMeshes;
}

/**
 * Dispose all room mesh resources
 * @param {THREE.Mesh[]} roomMeshes - Array of room meshes to dispose
 */
export function disposeRoomMeshes(roomMeshes) {
  roomMeshes.forEach((mesh) => {
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) mesh.material.dispose();
  });
}
