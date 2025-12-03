/**
 * RoomLabelManager - Space.js UI integration for rooms
 * Uses Tracker, Point, Line, and Panel from Space.js
 */

import * as THREE from 'three';
import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';
import { Stage } from '@alienkitty/space.js/src/utils/Stage.js';
import { RoomPoint } from './RoomPoint.js';

export class RoomLabelManager extends Interface {
  constructor(roomManager, camera, sensorManager) {
    super('.trackers');

    this.roomManager = roomManager;
    this.camera = camera;
    this.sensorManager = sensorManager;

    // Screen space trackers
    this.roomPoints = new Map(); // roomId -> RoomPoint
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredRoom = null;

    // Initialize Stage (required for Space.js)
    if (!Stage.root) {
      Stage.root = document.querySelector(':root');
      Stage.rootStyle = getComputedStyle(Stage.root);
    }

    this.init();
    this.initPoints();
    this.addListeners();
  }

  init() {
    this.css({
      position: 'fixed',
      left: 0,
      top: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 10
    });

    // Append to body
    document.body.appendChild(this.element);
  }

  initPoints() {
    // Create a Point for each room
    this.roomManager.rooms.forEach((room, roomId) => {
      const point = new RoomPoint(room, this.camera, this.sensorManager);
      this.add(point);
      this.roomPoints.set(roomId, point);
    });

    console.log(`[RoomLabelManager] Created ${this.roomPoints.size} room points`);
  }

  addListeners() {
    window.addEventListener('mousemove', (e) => this._onMouseMove(e));
    window.addEventListener('click', (e) => this._onClick(e));
  }

  removeListeners() {
    window.removeEventListener('mousemove', (e) => this._onMouseMove(e));
    window.removeEventListener('click', (e) => this._onClick(e));
  }

  _onMouseMove(event) {
    // Update mouse position (-1 to +1 normalized)
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycast to detect hovered room
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Get all room meshes
    const roomMeshes = [];
    this.roomManager.rooms.forEach(room => {
      if (room.mesh) {
        roomMeshes.push(room.mesh);
      }
    });

    const intersects = this.raycaster.intersectObjects(roomMeshes, true);

    if (intersects.length > 0) {
      // Find which room was hit
      let hitRoom = null;
      for (const intersect of intersects) {
        // Walk up the parent chain to find the room
        let obj = intersect.object;
        while (obj) {
          const room = this.roomManager.getRoomByMesh(obj);
          if (room) {
            hitRoom = room;
            break;
          }
          obj = obj.parent;
        }
        if (hitRoom) break;
      }

      if (hitRoom && (!this.hoveredRoom || hitRoom.id !== this.hoveredRoom.id)) {
        // Hide previous point
        if (this.hoveredRoom) {
          const prevPoint = this.roomPoints.get(this.hoveredRoom.id);
          prevPoint?.hideLabel();
        }

        // Show new point
        this.hoveredRoom = hitRoom;
        const point = this.roomPoints.get(hitRoom.id);
        point?.showLabel();
      }
    } else {
      // No room hovered
      if (this.hoveredRoom) {
        const point = this.roomPoints.get(this.hoveredRoom.id);
        point?.hideLabel();
        this.hoveredRoom = null;
      }
    }
  }

  _onClick(event) {
    // Let Point handle clicks
    const target = event.target;
    if (target.closest('.point') || target.closest('.panel')) {
      return;
    }
  }

  /**
   * Update all points (call in RAF loop)
   */
  update() {
    this.roomPoints.forEach(point => point.update());
  }

  /**
   * Expand a specific room's panel programmatically
   */
  expandRoom(roomId) {
    const point = this.roomPoints.get(roomId);
    if (point) {
      point.showLabel();
      point.expand();
    }
  }

  /**
   * Collapse all panels
   */
  collapseAll() {
    this.roomPoints.forEach(point => {
      if (point.isExpanded) {
        point.collapse();
      }
    });
  }

  /**
   * Cleanup
   */
  dispose() {
    this.removeListeners();
    this.roomPoints.forEach(point => point.dispose());
    this.roomPoints.clear();
    this.element?.remove();
    console.log('[RoomLabelManager] Disposed');
  }
}
