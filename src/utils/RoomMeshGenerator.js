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

  // Statistics for debugging
  let foundCount = 0;
  let syntheticCount = 0;

  // Create meshes from room IDs
  roomIds.forEach((roomId, idx) => {
    let center = null;

    // Direct lookup in roomRegistry (IDs now match exactly)
    if (roomRegistry[roomId]?.center) {
      center = roomRegistry[roomId].center;
      foundCount++;
    } else {
      // Only generate synthetic position if room genuinely not in registry
      const gridSize = Math.ceil(Math.sqrt(roomIds.length));
      const spacing = 30;
      const row = Math.floor(idx / gridSize);
      const col = idx % gridSize;
      const x = col * spacing - (gridSize * spacing) / 2;
      const y = 20; // Height
      const z = row * spacing - (gridSize * spacing) / 2;
      center = [x, y, z];
      syntheticCount++;
      console.warn(`[RoomMeshGenerator] No coordinates for "${roomId}" - using synthetic position [${x.toFixed(1)}, ${y}, ${z.toFixed(1)}]`);
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

  console.log(`[RoomMeshGenerator] Created ${roomMeshes.length} room meshes: ${foundCount} with floor plan coordinates, ${syntheticCount} with synthetic positions`);

  if (syntheticCount > 0) {
    console.warn(`[RoomMeshGenerator] ⚠️  ${syntheticCount} room(s) missing from floor plan SVG. Add them to public/floorplan.svg for accurate positioning.`);
  }

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
