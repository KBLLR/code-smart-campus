/**
 * Point3DManager - Proper Space.js Point3D Integration
 * Uses the actual Space.js Point3D system for room labels and panels
 */

import * as THREE from 'three';
import { Stage } from '@alienkitty/space.js/src/utils/Stage.js';
import { Point3D } from '@alienkitty/space.js/src/three/ui/Point3D.js';
import { PanelItem } from '@alienkitty/space.js/src/panels/PanelItem.js';

export class Point3DManager {
  constructor(roomManager, camera, classroomRegistry) {
    this.roomManager = roomManager;
    this.camera = camera;
    this.classroomRegistry = classroomRegistry;
    this.roomPoints = new Map();

    this.init();
  }

  init() {
    // Initialize Stage first (required by Space.js for CSS variables and ticker)
    Stage.init(document.body);

    // Initialize Point3D system once
    Point3D.init(this.roomManager.scene, this.camera, {
      root: document.body,
      container: document.body
    });

    console.log('[Point3DManager] Point3D system initialized');
  }

  createRoomPoints() {
    // Get rooms from the Map
    const rooms = Array.from(this.roomManager.rooms.values());

    rooms.forEach(room => {
      if (!room.mesh) return;

      // Get classroom data if available
      const classroom = this.classroomRegistry.get(room.id);
      const roomName = classroom?.name || room.name || room.id;
      const roomType = classroom?.metadata?.room_type || classroom?.type || 'classroom';

      // Calculate geometry center of mass for line origin
      const boundingBox = new THREE.Box3().setFromObject(room.mesh);
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);

      // Create a small invisible object at the center of mass
      const centerPoint = new THREE.Object3D();
      centerPoint.position.copy(center);
      centerPoint.name = `${room.id}_center`;

      // Add to scene (find scene root)
      let sceneRoot = room.mesh;
      while (sceneRoot.parent && sceneRoot.parent.type !== 'Scene') {
        sceneRoot = sceneRoot.parent;
      }
      if (sceneRoot.parent) {
        sceneRoot.parent.add(centerPoint);
      } else {
        // If no scene parent found, add to roomManager scene
        this.roomManager.scene.add(centerPoint);
      }

      // Create Point3D using center point (includes Line, Tracker, Reticle, Point automatically)
      const point = new Point3D(centerPoint, {
        name: roomName,
        type: roomType,
        noTracker: false // Show corner brackets
      });

      // Store reference to the actual room mesh for click detection
      point.userData = {
        roomId: room.id,
        roomMesh: room.mesh,
        centerPoint: centerPoint
      };

      // Add panel items if we have classroom data
      if (classroom) {
        this.addPanelItems(point, classroom, room.id);
      } else {
        // Add minimal info for rooms without data
        point.panel.add(new PanelItem({
          type: 'content',
          text: 'No sensor data available'
        }));
      }

      this.roomPoints.set(room.id, point);
    });

    console.log(`[Point3DManager] Created ${this.roomPoints.size} room points`);
  }

  addPanelItems(point, classroom, roomId) {
    const { panel } = point;

    // Spacer
    panel.add(new PanelItem({ type: 'spacer' }));

    // Divider
    panel.add(new PanelItem({ type: 'divider' }));

    // Agent info (at top)
    if (classroom.agent?.personality) {
      panel.add(new PanelItem({
        type: 'content',
        text: `<div style="opacity:0.7;font-size:11px;margin-bottom:8px">
          <strong>${classroom.agent.personality.name}</strong>
        </div>`
      }));
    }

    // Sensor data section
    const sensors = [];

    // Occupancy
    const occupancySensor = classroom.getSensor('occupancy');
    if (occupancySensor) {
      sensors.push({
        label: 'OCCUPANCY',
        value: `${occupancySensor.current_value}/${classroom.metadata.capacity || '?'}`
      });
    }

    // Temperature
    const tempSensor = classroom.getSensor('temperature');
    if (tempSensor && tempSensor.current_value != null) {
      sensors.push({
        label: 'TEMPERATURE',
        value: `${tempSensor.current_value.toFixed(1)}°C`
      });
    }

    // Humidity
    const humiditySensor = classroom.getSensor('humidity');
    if (humiditySensor && humiditySensor.current_value != null) {
      sensors.push({
        label: 'HUMIDITY',
        value: `${humiditySensor.current_value.toFixed(0)}%`
      });
    }

    // CO2
    const co2Sensor = classroom.getSensor('co2');
    if (co2Sensor && co2Sensor.current_value != null) {
      sensors.push({
        label: 'CO₂',
        value: `${co2Sensor.current_value}ppm`
      });
    }

    // PM2.5
    const pm25Sensor = classroom.getSensor('pm25');
    if (pm25Sensor && pm25Sensor.current_value != null) {
      sensors.push({
        label: 'PM2.5',
        value: `${pm25Sensor.current_value.toFixed(1)}μg/m³`
      });
    }

    // Add all sensor items
    sensors.forEach(sensor => {
      panel.add(new PanelItem({
        type: 'content',
        text: `<div style="display:flex;justify-content:space-between;margin:4px 0">
          <span style="opacity:0.5;font-size:9px">${sensor.label}</span>
          <span style="font-size:10px">${sensor.value}</span>
        </div>`
      }));
    });

    // Divider
    panel.add(new PanelItem({ type: 'divider' }));

    // "Enter Room" button
    const enterButton = new PanelItem({
      type: 'content',
      text: `<div style="
        text-align:center;
        padding:8px 12px;
        background:rgba(0,209,255,0.1);
        border:1px solid rgba(0,209,255,0.3);
        border-radius:4px;
        cursor:pointer;
        font-size:10px;
        font-weight:bold;
        letter-spacing:1px;
        transition:all 0.2s ease;
      " class="enter-room-btn">
        ENTER ROOM →
      </div>`
    });
    panel.add(enterButton);

    // Add click handler to "Enter Room" button
    setTimeout(() => {
      const btnElement = panel.element.querySelector('.enter-room-btn');
      if (btnElement) {
        btnElement.addEventListener('click', (e) => {
          e.stopPropagation();
          this.onEnterRoom(roomId);
        });

        btnElement.addEventListener('mouseenter', () => {
          btnElement.style.background = 'rgba(0,209,255,0.3)';
          btnElement.style.borderColor = 'rgba(0,209,255,0.6)';
          btnElement.style.transform = 'scale(1.05)';
        });

        btnElement.addEventListener('mouseleave', () => {
          btnElement.style.background = 'rgba(0,209,255,0.1)';
          btnElement.style.borderColor = 'rgba(0,209,255,0.3)';
          btnElement.style.transform = 'scale(1)';
        });
      }
    }, 100);

    // Spacer
    panel.add(new PanelItem({ type: 'spacer' }));
  }

  update(time) {
    // Call Point3D static update (handles raycasting, positioning, animations)
    Point3D.update(time);

    // Update panel data for rooms with live sensors
    this.updatePanelData();
  }

  updatePanelData() {
    // Update panel values with latest sensor data (called periodically)
    this.roomPoints.forEach((point, roomId) => {
      const classroom = this.classroomRegistry.get(roomId);
      if (!classroom) return;

      // Update occupancy value if sensor exists
      const occupancySensor = classroom.getSensor('occupancy');
      if (occupancySensor) {
        point.panel.setPanelValue('occupancy',
          `${occupancySensor.current_value}/${classroom.metadata.capacity}`);
      }
    });
  }

  onEnterRoom(roomId) {
    // Dispatch event to open detail view with graphs and full data
    const event = new CustomEvent('room:select', {
      detail: { roomId },
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  animateIn() {
    // Animate all points in
    this.roomPoints.forEach(point => {
      point.animateIn();
    });
  }

  animateOut() {
    // Animate all points out
    this.roomPoints.forEach(point => {
      point.animateOut();
    });
  }

  dispose() {
    // Clean up Point3D system and center points
    this.roomPoints.forEach(point => {
      // Remove center point from scene
      if (point.userData?.centerPoint) {
        point.userData.centerPoint.parent?.remove(point.userData.centerPoint);
      }
      Point3D.remove(point);
    });
    this.roomPoints.clear();

    console.log('[Point3DManager] Disposed');
  }
}
