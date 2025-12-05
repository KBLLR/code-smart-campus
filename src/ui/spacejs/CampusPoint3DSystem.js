/**
 * CampusPoint3DSystem - Complete Space.js Point3D Integration
 *
 * Manages 3D point labels, panels, and interactions for campus rooms
 * using native Space.js architecture and best practices.
 *
 * Architecture:
 * - Point3D (Three.js Group) → raycasting mesh at geometry center
 * - Line → from geometry center to label
 * - Tracker → corner brackets around geometry
 * - Point → label with name/type
 * - PointInfo → container with panel
 * - Panel → sensor data, agent info, "Enter Room" button
 */

import * as THREE from 'three';
import { Color } from '@alienkitty/space.js';
import { Stage } from '@alienkitty/space.js/src/utils/Stage.js';
import { Point3D } from '@alienkitty/space.js/src/three/ui/Point3D.js';
import { PanelItem } from '@alienkitty/space.js/src/panels/PanelItem.js';

export class CampusPoint3DSystem {
  constructor(scene, camera, roomManager, classroomRegistry) {
    this.scene = scene;
    this.camera = camera;
    this.roomManager = roomManager;
    this.classroomRegistry = classroomRegistry;
    this.roomPoints = new Map();
    this.activePanel = null;

    this.init();
  }

  init() {
    // Initialize Stage (required by Space.js for CSS variables and ticker)
    Stage.init(document.body);

    // Initialize Point3D system
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
    console.log('[CampusPoint3DSystem] Point3D clicked:', target.userData?.roomId);

    // Hide all other points and deactivate them
    this.roomPoints.forEach((point) => {
      if (point !== target && point.animatedIn) {
        point.animateOut(true);
        point.deactivate();
      }
    });

    // Point3D already toggles panel visibility internally; lock/unlock to prevent dragging
    if (target.point.isOpen || target.selected) {
      target.lock();
      this.activePanel = target;
    } else {
      target.unlock();
      if (this.activePanel === target) {
        this.activePanel = null;
      }
    }
  };

  onPoint3DHover = ({ type, target }) => {
    if (type === 'over') {
      console.log('[CampusPoint3DSystem] Hovering room:', target.userData?.roomId);

      // Hide other points when hovering a new one (only show one at a time)
      this.roomPoints.forEach((point) => {
        if (point !== target && point.animatedIn && !point.selected) {
          point.animateOut();
        }
      });
    }
  };

  /**
   * Create Point3D labels for all rooms with proper geometry center calculation
   */
  createRoomPoints() {
    const rooms = Array.from(this.roomManager.rooms.values());

    console.log(`[CampusPoint3DSystem] Creating points for ${rooms.length} rooms`);

    rooms.forEach(room => {
      if (!room.mesh) {
        console.warn(`[CampusPoint3DSystem] Room ${room.id} has no mesh, skipping`);
        return;
      }

      // Ensure geometry uses a centroid-based bounding sphere so Space.js aligns labels correctly
      this._prepareRoomMesh(room.mesh);

      const classroom = this.classroomRegistry.get(room.id);
      const roomName = classroom?.name || room.name || room.id;
      const roomType = classroom?.metadata?.room_type || classroom?.type || 'classroom';

      // Use original room mesh directly - Point3D handles positioning
      // Point3D will calculate bounding sphere and position automatically
      const point = new Point3D(room.mesh, {
        name: roomName,
        type: roomType,
        noTracker: false // Show corner brackets
      });

      // Store room reference
      point.userData = {
        roomId: room.id,
        roomMesh: room.mesh,
        metrics: new Map()
      };

      // Add panel content
      if (classroom) {
        this.addPanelContent(point, classroom, room.id);
      } else {
        // Minimal panel for rooms without data
        const emptyItem = new PanelItem({ type: 'content' });
        emptyItem.container.html('<div style="opacity:0.65;font-size:10px;padding:6px 0;">No sensor data available</div>');
        point.panel.add(emptyItem);
      }

      this.roomPoints.set(room.id, point);
    });

    console.log(`[CampusPoint3DSystem] Created ${this.roomPoints.size} points`);
  }


  /**
   * Add panel content following Space.js patterns
   */
  addPanelContent(point, classroom, roomId) {
    const { panel } = point;
    const accent = new Color(classroom.metadata?.color || '#00d1ff');
    const accentHex = `#${accent.getHexString()}`;

    // Header
    const header = new PanelItem({ type: 'content' });
    header.container.html(`
      <div style="display:flex;flex-direction:column;gap:4px">
        <div style="font-family:var(--ui-name-font-family);font-weight:700;font-size:12px;letter-spacing:1px;text-transform:uppercase;">
          ${classroom.name}
        </div>
        <div style="font-size:10px;opacity:0.65;letter-spacing:0.6px;">${classroom?.metadata?.room_type || classroom.type || 'Room'}</div>
      </div>
    `);
    panel.add(header);

    panel.add(new PanelItem({ type: 'divider' }));

    // Agent personality
    if (classroom.agent?.personality) {
      const agentItem = new PanelItem({ type: 'content' });
      agentItem.container.html(`
        <div style="opacity:0.8;font-size:10px;">
          <div style="font-weight:700;font-size:11px;margin-bottom:4px;letter-spacing:0.8px;">${classroom.agent.personality.name}</div>
          <div style="opacity:0.7;line-height:14px;">${classroom.agent.personality.expertise}</div>
        </div>
      `);
      panel.add(agentItem);
      panel.add(new PanelItem({ type: 'divider' }));
    }

    // Sensor metrics
    const sensors = this.getSensorData(classroom, accentHex);

    if (sensors.length > 0) {
      sensors.forEach(sensor => {
        const metric = new PanelItem({ type: 'content', name: sensor.key });
        const metricRow = document.createElement('div');
        metricRow.className = 'campus-metric-row';
        metricRow.style.display = 'flex';
        metricRow.style.justifyContent = 'space-between';
        metricRow.style.alignItems = 'center';
        metricRow.style.margin = '4px 0';
        metricRow.style.fontSize = '10px';
        metricRow.innerHTML = `
          <span style="opacity:0.55;text-transform:uppercase;letter-spacing:0.6px">${sensor.label}</span>
          <span class="metric-value" style="font-family:var(--ui-font-family);font-weight:700;color:${sensor.color};">${sensor.value}</span>
        `;
        metric.container.element.appendChild(metricRow);
        const valueEl = metricRow.querySelector('.metric-value');
        if (valueEl) {
          point.userData.metrics.set(sensor.key, { el: valueEl, color: sensor.color });
        }
        panel.add(metric);
      });

      panel.add(new PanelItem({ type: 'divider' }));
    }

    // "Enter Room" button
    const enterButton = new PanelItem({ type: 'content' });
    enterButton.container.html(`
      <div class="campus-enter-room-btn" style="
        text-align:center;
        padding:8px 12px;
        background:rgba(${Math.round(accent.r * 255)}, ${Math.round(accent.g * 255)}, ${Math.round(accent.b * 255)}, 0.12);
        border:1px solid rgba(${Math.round(accent.r * 255)}, ${Math.round(accent.g * 255)}, ${Math.round(accent.b * 255)}, 0.45);
        border-radius:4px;
        cursor:pointer;
        font-size:10px;
        font-family:var(--ui-font-family);
        font-weight:700;
        letter-spacing:1.4px;
        text-transform:uppercase;
        transition:all 0.2s ease;
      ">
        Enter Room →
      </div>
    `);
    panel.add(enterButton);

    // Add enter room button interaction
    requestAnimationFrame(() => {
      const btnElement = panel.element.querySelector('.campus-enter-room-btn');
      if (!btnElement) return;

      btnElement.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onEnterRoom(roomId);
      });

      btnElement.addEventListener('mouseenter', () => {
        btnElement.style.background = `rgba(${Math.round(accent.r * 255)}, ${Math.round(accent.g * 255)}, ${Math.round(accent.b * 255)}, 0.26)`;
        btnElement.style.borderColor = `rgba(${Math.round(accent.r * 255)}, ${Math.round(accent.g * 255)}, ${Math.round(accent.b * 255)}, 0.75)`;
        btnElement.style.transform = 'scale(1.05)';
      });

      btnElement.addEventListener('mouseleave', () => {
        btnElement.style.background = `rgba(${Math.round(accent.r * 255)}, ${Math.round(accent.g * 255)}, ${Math.round(accent.b * 255)}, 0.12)`;
        btnElement.style.borderColor = `rgba(${Math.round(accent.r * 255)}, ${Math.round(accent.g * 255)}, ${Math.round(accent.b * 255)}, 0.45)`;
        btnElement.style.transform = 'scale(1)';
      });
    });

    panel.add(new PanelItem({ type: 'spacer' }));

    point.userData.accentHex = accentHex;
  }

  /**
   * Extract sensor data for display
   */
  getSensorData(classroom, accentHex) {
    const sensors = [];
    const defaultColor = accentHex;

    const statusColor = (status) => {
      if (status === 'warning') return '#f59e0b';
      if (status === 'error' || status === 'critical') return '#ef4444';
      if (status === 'alert') return '#e11d48';
      return defaultColor;
    };

    // Occupancy
    const occupancy = classroom.getSensor('occupancy');
    if (occupancy) {
      sensors.push({
        key: 'occupancy',
        label: 'Occupancy',
        value: `${occupancy.current_value}/${classroom.metadata?.capacity || '?'}`,
        status: occupancy.status || 'ok',
        color: statusColor(occupancy.status)
      });
    }

    // Temperature
    const temp = classroom.getSensor('temperature');
    if (temp?.current_value != null) {
      sensors.push({
        key: 'temperature',
        label: 'Temperature',
        value: `${temp.current_value.toFixed(1)}°C`,
        status: temp.status || 'ok',
        color: statusColor(temp.status)
      });
    }

    // Humidity
    const humidity = classroom.getSensor('humidity');
    if (humidity?.current_value != null) {
      sensors.push({
        key: 'humidity',
        label: 'Humidity',
        value: `${humidity.current_value.toFixed(0)}%`,
        status: humidity.status || 'ok',
        color: statusColor(humidity.status)
      });
    }

    // CO2
    const co2 = classroom.getSensor('co2');
    if (co2?.current_value != null) {
      sensors.push({
        key: 'co2',
        label: 'CO₂',
        value: `${co2.current_value}ppm`,
        status: co2.status || 'ok',
        color: statusColor(co2.status)
      });
    }

    // PM2.5
    const pm25 = classroom.getSensor('pm25');
    if (pm25?.current_value != null) {
      sensors.push({
        key: 'pm25',
        label: 'PM2.5',
        value: `${pm25.current_value.toFixed(1)}μg/m³`,
        status: pm25.status || 'ok',
        color: statusColor(pm25.status)
      });
    }

    return sensors;
  }

  /**
   * Handle "Enter Room" button click
   */
  onEnterRoom(roomId) {
    console.log('[CampusPoint3DSystem] Entering room:', roomId);

    // Dispatch event for RoomDetailView
    const event = new CustomEvent('room:select', {
      detail: { roomId },
      bubbles: true
    });
    document.dispatchEvent(event);

    // Close panel after selecting room
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
    // Point3D.update handles raycasting, positioning, animations
    Point3D.update(time);

    // Keep panel metrics in sync with latest sensor values
    this.updatePanelData();
  }

  /**
   * Update panel data with latest sensor values
   */
  updatePanelData() {
    this.roomPoints.forEach((point, roomId) => {
      const classroom = this.classroomRegistry.get(roomId);
      if (!classroom || !point.userData?.metrics) return;

      const sensors = this.getSensorData(classroom, point.userData.accentHex || '#00d1ff');
      sensors.forEach(sensor => {
        const metric = point.userData.metrics.get(sensor.key);
        if (metric?.el) {
          metric.el.textContent = sensor.value;
          metric.el.style.color = sensor.color;
        }
      });
    });
  }

  /**
   * Force geometry to use centroid-based bounding sphere for accurate label placement
   */
  _prepareRoomMesh(mesh) {
    const { geometry } = mesh;
    if (!geometry?.attributes?.position) return;

    const position = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    const center = new THREE.Vector3();

    for (let i = 0; i < position.count; i += 1) {
      vertex.fromBufferAttribute(position, i);
      center.add(vertex);
    }

    center.divideScalar(position.count || 1);

    let radius = 0;
    for (let i = 0; i < position.count; i += 1) {
      vertex.fromBufferAttribute(position, i);
      radius = Math.max(radius, vertex.distanceTo(center));
    }

    if (!radius || Number.isNaN(radius)) {
      geometry.computeBoundingSphere();
      radius = geometry.boundingSphere?.radius || 1;
    }

    geometry.boundingSphere = new THREE.Sphere(center, radius);
    geometry.computeBoundingBox();

    mesh.userData.pointCenter = center.clone();
    mesh.userData.pointRadius = radius;
  }

  /**
   * Clean up resources
   */
  dispose() {
    // Remove event listeners
    Point3D.events.off('click', this.onPoint3DClick);
    Point3D.events.off('hover', this.onPoint3DHover);

    // Remove all points
    this.roomPoints.forEach(point => {
      Point3D.remove(point);
    });

    this.roomPoints.clear();
    this.activePanel = null;

    console.log('[CampusPoint3DSystem] Disposed');
  }
}
