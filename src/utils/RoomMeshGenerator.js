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
 * @param {Array|Object} entityLocations - Room metadata (array or object)
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

  // If entityLocations is an array, use it as the primary source of rooms
  // Otherwise fall back to roomRegistry
  let roomIds = [];
  let entityMap = {};

  if (Array.isArray(entityLocations)) {
    // Build map from entity array
    entityLocations.forEach(entity => {
      roomIds.push(entity.id);
      entityMap[entity.id] = entity;
    });
    console.log(`[RoomMeshGenerator] Using ${roomIds.length} rooms from entityLocations array`);
  } else if (entityLocations && typeof entityLocations === 'object') {
    // entityLocations is a plain object
    roomIds = Object.keys(entityLocations);
    entityMap = entityLocations;
    console.log(`[RoomMeshGenerator] Using ${roomIds.length} rooms from entityLocations object`);
  } else {
    // Fall back to roomRegistry keys (less ideal, but works for debugging)
    roomIds = Object.keys(roomRegistry);
    console.log(`[RoomMeshGenerator] Using ${roomIds.length} rooms from roomRegistry`);
  }

  // Create meshes from room IDs
  roomIds.forEach(roomId => {
    // Try to find center coordinates in roomRegistry
    let center = null;

    // First check roomRegistry with exact key
    if (roomRegistry[roomId]?.center) {
      center = roomRegistry[roomId].center;
    }
    // Try common variations (b.3 -> b3)
    else if (roomRegistry[roomId.replace(/\./g, '')]?.center) {
      center = roomRegistry[roomId.replace(/\./g, '')].center;
    }
    // Try other common patterns
    else {
      // Search through roomRegistry for any matching key
      for (const [key, value] of Object.entries(roomRegistry)) {
        if (value.center && (
          key.toLowerCase() === roomId.toLowerCase() ||
          key.replace(/\./g, '').toLowerCase() === roomId.replace(/\./g, '').toLowerCase()
        )) {
          center = value.center;
          break;
        }
      }
    }

    // Skip if no coordinates found
    if (!center) {
      console.warn(`[RoomMeshGenerator] No coordinates found for room: ${roomId}, skipping`);
      return;
    }

    // Box dimensions (approximate classroom size in meters)
    const width = 10;
    const height = 3;
    const depth = 10;

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geometry, invisibleMaterial);

    // Position from registry center
    mesh.position.set(...center);

    // Store metadata for picking/display
    mesh.userData.roomId = roomId;

    // Add metadata from entity locations if provided
    if (entityMap[roomId]) {
      const entity = entityMap[roomId];
      mesh.userData.displayName = entity.name;
      mesh.userData.icon = entity.icon;
      mesh.userData.category = entity.category;
      mesh.userData.potentialSensors = entity.potentialSensors;
    }

    // Don't add to scene yet - caller will do that
    // scene.add(mesh);
    roomMeshes.push(mesh);
  });

  console.log(`[RoomMeshGenerator] Created ${roomMeshes.length} room meshes out of ${roomIds.length} requested`);
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
