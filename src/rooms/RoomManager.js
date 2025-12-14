/**
 * RoomManager - Manages room interactions, metadata, and state
 * Uses unified_rooms_data.js as the single source of truth.
 * 
 * REFACTORED: Now acts as the Bridge/Controller between Data and 3D Views.
 */

import * as THREE from 'three';
import { unifiedRooms } from '../data/personalities/unified_rooms_data.js';
import { CampusView } from '../3d/views/CampusView.js';

export class RoomManager {
  constructor(scene, campusModel) {
    this.scene = scene; // Kept for reference
    this.campusModel = campusModel; // Store for init

    // Initialize CampusView with the model
    this.campusView = new CampusView(campusModel);

    // Index mappings
    this.roomIdMap = new Map(); // normalizedId -> canonicalId
    this.buttons = new Map();   // id -> buttonMesh

    this._init();
  }

  /**
   * Initialize rooms with unified data
   */
  _init() {
    console.log('[RoomManager] Initializing rooms with Unified Data...');

    // 1. Index Unified Data
    const dataMap = new Map();
    unifiedRooms.forEach(roomData => {
      const cleanId = this._normalizeId(roomData.id);
      if (cleanId) dataMap.set(cleanId, roomData);
      if (!roomData.id && roomData.roomData.name) {
        dataMap.set(this._normalizeId(roomData.roomData.name), roomData);
      }
    });

    // 2. Process Rooms from GLB via CampusView
    const roomsList = this.campusModel.rooms || [];

    roomsList.forEach((roomMeshObj) => {
      const glbId = this._normalizeId(roomMeshObj.id);

      // Data Matching Logic
      let data = dataMap.get(glbId);
      if (!data) {
        if (glbId === 'labmakerspace') data = dataMap.get('labmakerspace');
        if (glbId === 'terracehydrogen') data = dataMap.get('hydrogen');
        if (glbId === 'terraceoxygen') data = dataMap.get('oxygen');
      }

      if (!data) {
        console.warn(`[RoomManager] No data found for GLB room: ${glbId}`);
        return;
      }

      const canonicalId = data.id || glbId;

      // Create View & Entity
      this.campusView.addRoomView(canonicalId, roomMeshObj.mesh, data);
    });

    // 3. Init Buttons
    const buttonsList = this.campusModel.buttons || [];
    buttonsList.forEach(btn => {
      this.buttons.set(btn.id, btn);
      // Ensure userdata set for InputManager
      btn.mesh.userData.isButton = true;
      btn.mesh.userData.buttonId = btn.id;
    });

    console.log(`[RoomManager] ✓ Initialized ${this.campusView.roomViews.size} room views`);
  }

  update(dt) {
    // Delegate visual updates to View
    this.campusView.update(dt);
  }

  // ========================================================
  // INTERACTION ADAPTERS (For InputManager / CampusApp)
  // ========================================================

  getInteractableMeshes() {
    // Combine Rooms and Buttons
    const roomMeshes = this.campusView.getAllMeshes();
    const btnMeshes = Array.from(this.buttons.values()).map(b => b.mesh);
    return [...roomMeshes, ...btnMeshes];
  }

  getRoomFromIntersect(intersect) {
    if (!intersect || !intersect.object) return null;
    const mesh = intersect.object;

    // 1. Direct userData (fastest)
    if (mesh.userData && mesh.userData.roomId) {
      const view = this.campusView.getRoomView(mesh.userData.roomId);
      if (view) return { id: view.entity.id, data: view.entity.data };
    }

    // 2. Parent traversal (if mesh is part of group)
    // view.mesh should match
    // we can optimize later
    return null;
  }

  getButtonFromIntersect(intersect) {
    if (!intersect || !intersect.object) return null;
    // Buttons aren't in strict MVC View yet, simplified handling
    const mesh = intersect.object;
    if (mesh.userData && mesh.userData.isButton) {
      return this.buttons.get(mesh.userData.buttonId) || { mesh };
    }
    return null;
  }

  // ========================================================
  // STATE MANAGEMENT (Controller Logic)
  // ========================================================

  highlightRoom(roomId, active = true, isPersistent = false) {
    const view = this.campusView.getRoomView(roomId);
    if (!view) return;

    if (isPersistent) {
      view.entity.setSelected(active);
    } else {
      view.entity.setHovered(active);
    }

    // View updates itself in its update() or we force it?
    // RoomView.update() checks entity state.
    // But we can also force an update for responsiveness.
    view._updateAppearance();
  }

  highlightByUsage(usageQuery) {
    if (!usageQuery) return;
    const query = usageQuery.toLowerCase();

    this.campusView.roomViews.forEach(view => {
      const use = (view.entity.data.roomData.use || '').toLowerCase();
      if (use.includes(query) || query.includes(use)) {
        this.highlightRoom(view.entity.id, true, true);
      } else {
        this.highlightRoom(view.entity.id, false, true);
      }
    });
  }

  clearAllHighlights() {
    this.campusView.roomViews.forEach(view => {
      this.highlightRoom(view.entity.id, false, true);
    });
  }

  clearHighlight() {
    this.campusView.roomViews.forEach(view => {
      if (view.entity.isHovered) {
        this.highlightRoom(view.entity.id, false, false);
      }
    });
  }

  // Helpers
  _normalizeId(id) {
    if (!id) return '';
    return id.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  dispose() {
    this.campusView = null;
    this.buttons.clear();
  }
}

