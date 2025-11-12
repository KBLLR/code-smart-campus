/**
 * RoomMeshGenerator - Creates invisible room mesh shells for picking
 *
 * Generates BoxGeometry meshes positioned at roomRegistry coordinates.
 * Fails hard if any room is missing from roomRegistry - no synthetic positions.
 *
 * Source of truth: roomRegistry (generated from SVG floorplan)
 *
 * IMPORTANT: Must match RoundedBlockGenerator's 180° Y-rotation transform
 */

import * as THREE from 'three';

/**
 * Create invisible room mesh shells for raycasting
 *
 * @param {Object} roomRegistry - Map of room data with center coordinates
 * @param {Array} entityLocations - Room metadata array from entityLocations.json
 * @returns {{ meshes: THREE.Mesh[], group: THREE.Group }} Object containing meshes array and parent group
 * @throws {Error} If any room ID is missing from roomRegistry
 */
export function createRoomMeshes(roomRegistry, entityLocations = null) {
  const meshes = [];
  const missing = [];

  // Use shared invisible material for all room meshes
  const invisibleMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    colorWrite: false, // Don't write to color buffer
  });

  // Get room IDs to process
  let roomIds = [];
  let entityMap = {};

  if (Array.isArray(entityLocations)) {
    // Primary source: entityLocations array
    entityLocations.forEach(entity => {
      roomIds.push(entity.id);
      entityMap[entity.id] = entity;
    });
    console.log(`[RoomMeshGenerator] Creating meshes for ${roomIds.length} rooms from entityLocations`);
  } else if (entityLocations && typeof entityLocations === 'object') {
    // Fallback: entityLocations object
    roomIds = Object.keys(entityLocations);
    entityMap = entityLocations;
    console.log(`[RoomMeshGenerator] Creating meshes for ${roomIds.length} rooms from entityLocations object`);
  } else {
    // Last resort: use roomRegistry keys (not recommended)
    roomIds = Object.keys(roomRegistry);
    console.log(`[RoomMeshGenerator] Creating meshes for ${roomIds.length} rooms from roomRegistry`);
  }

  // Create meshes - fail hard if any coordinate is missing
  roomIds.forEach((roomId) => {
    const entry = roomRegistry[roomId];

    if (!entry || !entry.center) {
      missing.push(roomId);
      return; // Continue collecting all missing rooms before failing
    }

    const [x, y, z] = entry.center;

    // Box dimensions (approximate room size in meters)
    const width = 20;   // 20m wide
    const height = 10;  // 10m tall (picking shell)
    const depth = 20;   // 20m deep

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geometry, invisibleMaterial);

    // Position from registry
    mesh.position.set(x, y, z);

    // Store metadata for picking
    mesh.userData.roomId = roomId;
    mesh.userData.roomName = entry.name;
    mesh.userData.roomCategory = entry.category;

    // Merge in entity metadata if available
    if (entityMap[roomId]) {
      const entity = entityMap[roomId];
      mesh.userData.displayName = entity.name || entry.name;
      mesh.userData.icon = entity.icon;
      mesh.userData.category = entity.category || entry.category;
      mesh.userData.potentialSensors = entity.potentialSensors;
    }

    meshes.push(mesh);
  });

  // Fail hard if any rooms are missing
  if (missing.length > 0) {
    console.error("\n❌ [RoomMeshGenerator] Missing room coordinates:");
    missing.forEach((id) => console.error(`   - "${id}"`));
    console.error(`\nThese ${missing.length} room(s) are in entityLocations.json but not in roomRegistry.`);
    console.error("Fix: Ensure public/floorplan.svg has <path> elements with matching IDs,");
    console.error("then regenerate with: node src/tools/generateRoomRegistry.js\n");

    throw new Error(
      `[RoomMeshGenerator] ${missing.length} room(s) missing from roomRegistry. ` +
      `Cannot create picking meshes. Fix SVG or entityLocations.json`
    );
  }

  // CRITICAL: Wrap meshes in group with 180° Y-rotation to match RoundedBlockGenerator
  // This ensures picking meshes align with extruded geometry
  const pickingGroup = new THREE.Group();
  pickingGroup.name = 'PickingMeshesGroup';
  pickingGroup.rotation.y = Math.PI; // Match RoundedBlockGenerator's flip
  meshes.forEach(mesh => pickingGroup.add(mesh));

  console.log(`[RoomMeshGenerator] ✅ Created ${meshes.length} room meshes with real floor plan coordinates`);
  console.log(`[RoomMeshGenerator] Applied 180° Y-rotation to match extruded geometry`);

  // Return both group (to add to scene) and meshes array (for PickingService)
  return { meshes, group: pickingGroup };
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
