/**
 * RoomMeshGenerator - Creates invisible room mesh shells for picking
 *
 * Generates BoxGeometry meshes for each room in the registry with:
 * - userData.roomId for raycaster identification
 * - Position from room center coordinates or generated synthetic position
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
    // Fall back to roomRegistry keys
    roomIds = Object.keys(roomRegistry);
    console.log(`[RoomMeshGenerator] Using ${roomIds.length} rooms from roomRegistry`);
  }

  // Collect available coordinates from roomRegistry
  const availableCoordinates = [];
  Object.entries(roomRegistry).forEach(([key, value]) => {
    if (value.center) {
      availableCoordinates.push(value.center);
    }
  });
  console.log(`[RoomMeshGenerator] Found ${availableCoordinates.length} coordinates in roomRegistry`);

  // Create meshes from room IDs
  let coordinateIndex = 0;
  roomIds.forEach((roomId, idx) => {
    let center = null;

    // Try to find center coordinates in roomRegistry
    // First check roomRegistry with exact key
    if (roomRegistry[roomId]?.center) {
      center = roomRegistry[roomId].center;
    }
    // Try common variations (b.3 -> b3)
    else if (roomRegistry[roomId.replace(/\./g, '')]?.center) {
      center = roomRegistry[roomId.replace(/\./g, '')].center;
    }
    // Try search through roomRegistry
    else {
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

    // If no coordinates found, generate synthetic position in a grid
    if (!center) {
      // Create a grid of positions spread across the campus
      const gridSize = Math.ceil(Math.sqrt(roomIds.length));
      const spacing = 30;
      const row = Math.floor(idx / gridSize);
      const col = idx % gridSize;
      const x = col * spacing - (gridSize * spacing) / 2;
      const y = 20; // Height
      const z = row * spacing - (gridSize * spacing) / 2;
      center = [x, y, z];
      console.log(`[RoomMeshGenerator] Generated synthetic coordinates for ${roomId}: [${x}, ${y}, ${z}]`);
    }

    // Box dimensions (approximate classroom size in meters)
    const width = 10;
    const height = 3;
    const depth = 10;

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geometry, invisibleMaterial);

    // Position from registry center or synthetic
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
