/**
 * Point3DManager - Proper Space.js Point3D Integration
 * Uses the actual Space.js Point3D system for room labels and panels
 */

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
      const roomName = classroom?.name || room.name;
      const roomType = classroom?.metadata?.room_type || 'Room';

      // Create Point3D for this room (includes Line, Tracker, Reticle, Point automatically)
      const point = new Point3D(room.mesh, {
        name: roomName,
        type: roomType,
        noTracker: false // Show corner brackets
      });

      // Add panel items if we have classroom data
      if (classroom) {
        this.addPanelItems(point, classroom);
      } else {
        // Add minimal info for rooms without data
        point.panel.add(new PanelItem({
          type: 'content',
          text: 'No sensor data available'
        }));
      }

      // Add click handler to panel to open detail view
      point.panel.element.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onPanelClick(room.id);
      });

      // Make panel clickable
      point.panel.element.style.cursor = 'pointer';
      point.panel.element.style.pointerEvents = 'auto';

      this.roomPoints.set(room.id, point);
    });

    console.log(`[Point3DManager] Created ${this.roomPoints.size} room points`);
  }

  addPanelItems(point, classroom) {
    const { panel } = point;

    // Spacer
    panel.add(new PanelItem({ type: 'spacer' }));

    // Divider
    panel.add(new PanelItem({ type: 'divider' }));

    // Occupancy
    const occupancySensor = classroom.getSensor('occupancy');
    if (occupancySensor) {
      panel.add(new PanelItem({
        type: 'content',
        text: `<div style="display:flex;justify-content:space-between">
          <span style="opacity:0.5">OCCUPANCY</span>
          <span>${occupancySensor.current_value}/${classroom.metadata.capacity}</span>
        </div>`
      }));
    }

    // Temperature
    const tempSensor = classroom.getSensor('temperature');
    if (tempSensor && tempSensor.current_value) {
      panel.add(new PanelItem({
        type: 'content',
        text: `<div style="display:flex;justify-content:space-between">
          <span style="opacity:0.5">TEMPERATURE</span>
          <span>${tempSensor.current_value.toFixed(1)}°C</span>
        </div>`
      }));
    }

    // CO2
    const co2Sensor = classroom.getSensor('co2');
    if (co2Sensor && co2Sensor.current_value) {
      panel.add(new PanelItem({
        type: 'content',
        text: `<div style="display:flex;justify-content:space-between">
          <span style="opacity:0.5">CO₂</span>
          <span>${co2Sensor.current_value}ppm</span>
        </div>`
      }));
    }

    // Divider
    panel.add(new PanelItem({ type: 'divider' }));

    // Agent info
    if (classroom.agent?.personality) {
      panel.add(new PanelItem({
        type: 'content',
        text: `<div style="opacity:0.5;font-style:italic">
          Agent: ${classroom.agent.personality.name}
        </div>`
      }));
    }

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

  onPanelClick(roomId) {
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
    // Clean up Point3D system
    this.roomPoints.forEach(point => {
      Point3D.remove(point);
    });
    this.roomPoints.clear();

    console.log('[Point3DManager] Disposed');
  }
}
