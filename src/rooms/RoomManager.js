/**
 * RoomManager - Manages room interactions, metadata, and state
 * Each room has: name, icon, personality, sensors, connectors
 */

import * as THREE from 'three';
import { roomsMetadata } from './roomsMetadata.js';
import roomsData from '../data/classrooms/rooms.js';

export class RoomManager {
  constructor(scene, campusModel) {
    this.scene = scene;
    this.campusModel = campusModel;

    // Room meshes from GLB
    this.rooms = new Map(); // id -> { id, name, mesh, metadata }

    // Interaction state
    this.highlightedRoom = null;
    this.selectedRoom = null;

    // Raycaster for picking
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this._init();
  }

  /**
   * Initialize rooms with metadata
   */
  _init() {
    console.log('[RoomManager] Initializing rooms...');

    // Create a lookup map from the authoritative rooms.js
    // We map both the ID and normalized ID to the room data for easier lookup
    const roomsDataMap = new Map();
    roomsData.forEach(room => {
      if (room.id) {
        // Handle comma-separated IDs like "A11, A12"
        const ids = room.id.split(',').map(id => id.trim());
        ids.forEach(id => {
          roomsDataMap.set(this._normalizeRoomId(id), room);
        });
      } else {
        // Handle rooms without ID by name (fallback)
        roomsDataMap.set(this._normalizeRoomId(room.name), room);
      }
    });

    this.campusModel.rooms.forEach((room) => {
      const normalizedId = this._normalizeRoomId(room.id);

      // 1. Get authoritative data from rooms.js
      const authoritativeData = roomsDataMap.get(normalizedId);

      // 2. Get visualization metadata (icons, personality) from roomsMetadata.js
      const vizMetadata = roomsMetadata[normalizedId] || roomsMetadata[room.id] || {
        icon: '📦',
        personality: 'neutral',
        description: 'Unknown room',
        color: '#94a3b8',
      };

      // 3. Merge data
      const metadata = {
        ...vizMetadata,
        // Override description if we have specific usage info
        description: authoritativeData ? `${authoritativeData.name} - ${authoritativeData.use}` : vizMetadata.description,
        area: authoritativeData?.area || 'Unknown',
        use: authoritativeData?.use || 'Unknown'
      };

      this.rooms.set(normalizedId, {
        id: normalizedId,
        originalId: room.id, // Keep original ID just in case
        // Use name from rooms.js if available, otherwise format the ID
        name: authoritativeData ? authoritativeData.name : this._formatRoomName(room.name || room.id),
        mesh: room.mesh,
        position: room.mesh.position, // Add position for label placement
        metadata,
        state: {
          highlighted: false,
          selected: false,
          occupied: false,
          temperature: null,
          sensors: [],
        },
      });
    });

    console.log(`[RoomManager] ✓ Initialized ${this.rooms.size} rooms`);
  }

  /**
   * Get room at pointer position (for click/hover)
   */
  getRoomAtPointer(event, camera) {
    // Update pointer position
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycast
    this.raycaster.setFromCamera(this.pointer, camera);

    const roomMeshes = Array.from(this.rooms.values()).map((r) => r.mesh);
    const intersects = this.raycaster.intersectObjects(roomMeshes, true);

    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      const roomId = mesh.userData.roomId;
      return this.rooms.get(roomId) || null;
    }

    return null;
  }

  /**
   * Select a room
   */
  selectRoom(roomId) {
    // Clear previous selection
    if (this.selectedRoom) {
      this.selectedRoom.state.selected = false;
      this._updateRoomAppearance(this.selectedRoom);
    }

    // Select new room
    const room = this.rooms.get(roomId);
    if (room) {
      room.state.selected = true;
      this.selectedRoom = room;
      this._updateRoomAppearance(room);
      console.log('[RoomManager] Selected:', room.metadata);
    }
  }

  /**
   * Highlight a room on hover
   */
  highlightRoom(roomId) {
    if (this.highlightedRoom?.id === roomId) return;

    // Clear previous highlight
    if (this.highlightedRoom && !this.highlightedRoom.state.selected) {
      this.highlightedRoom.state.highlighted = false;
      this._updateRoomAppearance(this.highlightedRoom);
    }

    // Highlight new room
    const room = this.rooms.get(roomId);
    if (room && !room.state.selected) {
      room.state.highlighted = true;
      this.highlightedRoom = room;
      this._updateRoomAppearance(room);
    }
  }

  /**
   * Clear highlight
   */
  clearHighlight() {
    if (this.highlightedRoom && !this.highlightedRoom.state.selected) {
      this.highlightedRoom.state.highlighted = false;
      this._updateRoomAppearance(this.highlightedRoom);
      this.highlightedRoom = null;
    }
  }

  /**
   * Update room sensor data (from connectors)
   */
  updateRoomSensor(roomId, sensorType, value) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.state[sensorType] = value;
      console.log(`[RoomManager] ${room.name} ${sensorType}:`, value);
    }
  }

  /**
   * Get room by mesh (for raycasting)
   */
  getRoomByMesh(mesh) {
    // Check if mesh has roomId in userData
    if (mesh.userData?.roomId) {
      return this.rooms.get(mesh.userData.roomId);
    }

    // Otherwise search through all rooms
    for (const room of this.rooms.values()) {
      if (room.mesh === mesh || room.mesh.children.includes(mesh)) {
        return room;
      }
    }

    return null;
  }

  /**
   * Get all rooms as array
   */
  getRooms() {
    return Array.from(this.rooms.values());
  }

  /**
   * Update room appearance based on state
   */
  _updateRoomAppearance(room) {
    if (!room.mesh.material) return;

    const material = room.mesh.material;
    const baseColor = new THREE.Color(room.metadata.color);

    if (room.state.selected) {
      material.emissive = baseColor;
      material.emissiveIntensity = 0.5;
    } else if (room.state.highlighted) {
      material.emissive = baseColor;
      material.emissiveIntensity = 0.2;
    } else {
      material.emissive = new THREE.Color(0x000000);
      material.emissiveIntensity = 0;
    }
  }

  /**
   * Update loop
   */
  update(delta) {
    // Room animations, state updates, etc.
  }

  /**
   * Format room name from ID (e.g. "restroomsexits01" -> "Restrooms Exits 01")
   */
  _formatRoomName(name) {
    if (!name) return 'Unknown Room';

    // Replace underscores/dashes with spaces
    let formatted = name.replace(/[_-]/g, ' ');

    // Insert space before numbers if missing (e.g. "room01" -> "room 01")
    formatted = formatted.replace(/([a-zA-Z])(\d)/g, '$1 $2');

    // Capitalize words
    return formatted.replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Normalize room ID to standard format (lowercase, alphanumeric only)
   * e.g. "A.11" -> "a11", "Restrooms-Exits-01" -> "restroomsexits01"
   */
  _normalizeRoomId(id) {
    if (!id) return 'unknown';
    return id.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  /**
   * Cleanup
   */
  dispose() {
    this.rooms.clear();
    this.highlightedRoom = null;
    this.selectedRoom = null;
  }
}
