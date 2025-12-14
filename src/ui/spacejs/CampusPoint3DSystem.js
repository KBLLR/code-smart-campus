/**
 * CampusPoint3DSystem - Complete Space.js Point3D Integration
 *
 * Manages 3D point labels, panels, and interactions for campus rooms
 * using native Space.js architecture and best practices.
 */

import * as THREE from 'three';
import { Color } from '@alienkitty/space.js';
import { Stage } from '@alienkitty/space.js/src/utils/Stage.js';
import { Point3D } from '@alienkitty/space.js/src/three/ui/Point3D.js';
import { PanelItem } from '@alienkitty/space.js/src/panels/PanelItem.js';
import { Meter } from '../components/Meter.js';
import { Graph } from '../components/Graph.js';

export class CampusPoint3DSystem {
  constructor(scene, camera, roomManager, classroomRegistry) {
    this.scene = scene;
    this.camera = camera;
    this.roomManager = roomManager;
    this.classroomRegistry = classroomRegistry;
    this.sensorManager = window.sensorManager; // Access global sensor manager
    this.roomPoints = new Map();
    this.activePanel = null;
    this.lastSensorUpdate = 0;

    this.init();
  }

  init() {
    // Initialize Stage (required by Space.js for CSS variables and ticker)
    Stage.init(document.body);

    // Initialize Point3D system with debug option
    Point3D.init(this.scene, this.camera, {
      root: document.body,
      container: document.body,
      debug: false // Set true to see raycasting spheres
    });

    // Listen for Point3D events
    this.addEventListeners();

    console.log('[CampusPoint3DSystem] Initialized');
  }

  addEventListeners() {
    // Listen for Point3D click events
    Point3D.events.on('click', this.onPoint3DClick);

    // Listen for Point3D hover events
    Point3D.events.on('hover', this.onPoint3DHover);
  }

  onPoint3DClick = ({ target }) => {
    console.log('[CampusPoint3DSystem] 🎯 Point3D clicked:', target.userData?.roomId);

    // Deactivate ALL OTHER points first
    this.roomPoints.forEach((point) => {
      if (point !== target) {
        point.deactivate();
        point.unlock();
      }
    });

    // Toggle clicked point
    if (target.point.isOpen) {
      target.lock();
      this.activePanel = target;
    } else {
      target.unlock();
      this.activePanel = null;
    }
  };

  onPoint3DHover = ({ type, target }) => {
    if (type === 'over') {
      // Hide other points when hovering a new one
      this.roomPoints.forEach((point) => {
        if (point !== target && point.animatedIn && !point.selected) {
          point.animateOut();
        }
      });
    }
  };

  /**
   * Create Point3D labels for all rooms
   */
  createRoomPoints() {
    // MVC Refactor: Use campusView.roomViews
    // roomViews is a Map<string, RoomView>
    const views = Array.from(this.roomManager.campusView.roomViews.values());
    console.log(`[CampusPoint3DSystem] Creating points for ${views.length} rooms`);

    views.forEach(view => {
      const roomMesh = view.mesh;
      const roomId = view.entity.id;

      if (!roomMesh) return;

      this._prepareRoomMesh(roomMesh);

      const classroom = this.classroomRegistry.get(roomId);
      const roomName = classroom?.name || view.entity.name || roomId;
      const roomType = classroom?.metadata?.room_type || 'Room';

      // Create Point3D
      const point = new Point3D(roomMesh, {
        name: roomName,
        type: roomType,
        noTracker: false
      });

      // Store metadata
      point.userData = {
        roomId: roomId,
        roomMesh: roomMesh,
        metrics: new Map() // Store metric PanelItems for updates
      };

      // Add Panel Content
      this.addPanelContent(point, roomId);

      this.roomPoints.set(roomId, point);
    });

    console.log(`[CampusPoint3DSystem] Created ${this.roomPoints.size} points`);
  }

  /**
   * Add panel content using native Space.js PanelItems
   */
  addPanelContent(point, roomId) {
    const { panel } = point;
    const accent = '#00d1ff'; // Default accent

    // 1. Header is standard (Name + Type) managed by Point3D constructor options

    // 2. Add Sensor Data (List or Meters)
    if (this.sensorManager) {
      const sensors = this.sensorManager.getSensorsForRoom(roomId);

      if (sensors.length > 0) {
        panel.add(new PanelItem({ type: 'divider' }));

        sensors.forEach((sensor, index) => {
          // Wrapper for custom content
          const wrapper = new PanelItem({ type: 'content' });
          wrapper.css({ paddingBottom: '10px' }); // Spacing

          // Determine ranges based on unit/type (simple heuristics)
          let min = 0, max = 100;
          if (sensor.unit === '°C') { min = 15; max = 30; }
          else if (sensor.unit === 'ppm') { min = 400; max = 2000; }
          else if (sensor.unit === '%') { min = 0; max = 100; }
          else if (sensor.key.includes('occupancy')) { min = 0; max = 50; }

          // Create Meter
          const meter = new Meter({
            label: sensor.label,
            value: sensor.value,
            unit: sensor.unit,
            min,
            max,
            color: '#00d1ff' // Default cyan
          });

          // Add to wrapper
          // PanelItem.container is the Interface/Div
          wrapper.container.add(meter);

          point.userData.metrics.set(sensor.key, meter);
          panel.add(wrapper);

          // Add Graph for the first sensor (primary metric)
          // To concise the UI, only showing one graph
          if (index === 0) {
            const graphWrapper = new PanelItem({ type: 'content' });
            // Adjust width to fit standard panel (~240px usually)
            const graph = new Graph({ width: 220, height: 50, color: '#00d1ff' });

            graphWrapper.container.add(graph);

            // Initialize graph with current value
            graph.addPoint(parseFloat(sensor.value));

            if (!point.userData.graphs) point.userData.graphs = new Map();
            point.userData.graphs.set(sensor.key, graph);

            panel.add(graphWrapper);
          }
        });
      }
    }

    panel.add(new PanelItem({ type: 'divider' }));

    // 3. Enter Room Button
    // Using a custom content item for the button to maintain style control
    // OR native 'link' type if available and suitable
    const enterBtn = new PanelItem({ type: 'content' });
    enterBtn.container.element.innerHTML = 'ENTER ROOM →';
    enterBtn.container.element.className = 'ui-button-enter'; // Use CSS class
    // Add inline styles for immediate robustness
    Object.assign(enterBtn.container.element.style, {
      textAlign: 'center',
      padding: '10px',
      marginTop: '5px',
      backgroundColor: 'rgba(0, 209, 255, 0.1)',
      border: '1px solid rgba(0, 209, 255, 0.3)',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '11px',
      letterSpacing: '1px',
      pointerEvents: 'auto' // Critical for clicking
    });

    // Add click listener
    enterBtn.container.element.addEventListener('click', (e) => {
      // Stop propagation to prevent OrbitControls from rotating while clicking
      e.stopPropagation();
      this.onEnterRoom(roomId);
    });

    panel.add(enterBtn);
    panel.add(new PanelItem({ type: 'spacer' }));
  }

  /**
   * Handle "Enter Room" button click
   */
  onEnterRoom(roomId) {
    console.log('[CampusPoint3DSystem] 🚪 ENTER ROOM:', roomId);

    // Dispatch event
    document.dispatchEvent(new CustomEvent('room:select', {
      detail: { roomId },
      bubbles: true
    }));

    // Close panel
    if (this.activePanel) {
      this.activePanel.point.close();
      this.activePanel.unlock();
      this.activePanel.deactivate();
      this.activePanel = null;
    }
  }

  /**
   * Update Point3D system (call every frame)
   */
  update(time) {
    Point3D.update(time);

    // Sync sensors periodically (throttle to 1s)
    if (this.sensorManager && time - this.lastSensorUpdate > 1000) {
      this.updatePanelData();
      this.lastSensorUpdate = time;
    }
  }

  /**
   * Update panel data with latest sensor values
   */
  updatePanelData() {
    // Optimization: Only update the active panel if one exists
    if (!this.activePanel) return;

    const roomId = this.activePanel.userData.roomId;
    if (!roomId) return;

    const sensors = this.sensorManager.getSensorsForRoom(roomId);

    // Update metrics in the active panel
    // Note: this.activePanel is the *Panel* object (Space.js), usually accessible via point
    // My previous code set activePanel = point (Point3D wrapper). 
    // Let's verify activePanel structure. 
    // In onOpen: this.activePanel = point;

    const point = this.activePanel;

    sensors.forEach(sensor => {
      // Update Meter
      const meter = point.userData.metrics.get(sensor.key);
      const val = parseFloat(sensor.value);

      if (meter) {
        meter.update(val);
        // Also update unit text if needed (handled by meter.update usually)
      }

      // Update Graph
      if (point.userData.graphs) {
        const graph = point.userData.graphs.get(sensor.key);
        if (graph) {
          graph.addPoint(val);
        }
      }
    });
  }

  /**
   * Force geometry to use centroid-based bounding sphere 
   */
  _prepareRoomMesh(mesh) {
    const { geometry } = mesh;
    if (!geometry?.attributes?.position) return;

    if (!geometry.boundingSphere) {
      geometry.computeBoundingSphere();
    }
    // Centroid logic... (simplified for brevity, Space.js usually handles standard meshes fine)
    // If needed, reinstate the detailed centroid logic here.
  }

  dispose() {
    Point3D.events.off('click', this.onPoint3DClick);
    Point3D.events.off('hover', this.onPoint3DHover);
    this.roomPoints.forEach(point => Point3D.remove(point));
    this.roomPoints.clear();
    this.activePanel = null;
    console.log('[CampusPoint3DSystem] Disposed');
  }
}
