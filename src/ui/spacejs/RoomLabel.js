/**
 * RoomLabel - Space.js native implementation
 * Uses actual Space.js Point, Line, and Panel components
 */

import * as THREE from 'three';
import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';
import { Panel } from '@alienkitty/space.js/src/panels/Panel.js';
import { PanelItem } from '@alienkitty/space.js/src/panels/PanelItem.js';
import { Line } from '@alienkitty/space.js/src/ui/Line.js';
import { getRoomPersonality } from '../../rooms/roomsMetadata.js';
import { getIcon } from '../icons.js';

export class RoomLabel extends Interface {
  constructor(room, camera, sensorManager) {
    super('.point');

    this.room = room;
    this.camera = camera;
    this.sensorManager = sensorManager;

    // Screen position (3D -> 2D projection)
    this.screenPosition = new THREE.Vector2();

    // States
    this.isHovered = false;
    this.isExpanded = false;

    this.init();
    this.initViews();
  }

  init() {
    // Position absolute for screen space
    this.css({
      position: 'absolute',
      pointerEvents: 'auto',
      webkitUserSelect: 'none',
      userSelect: 'none',
      opacity: 0
    });
  }

  initViews() {
    // Line from room to label
    this.line = new Line();
    this.add(this.line);

    // Info container
    this.info = new Interface('.info');
    this.info.css({
      position: 'absolute',
      left: 10,
      top: -15,
      pointerEvents: 'none'
    });
    this.add(this.info);

    // Container for label content
    this.container = new Interface('.container');
    this.container.css({
      position: 'relative',
      cursor: 'pointer',
      zIndex: 1,
      pointerEvents: 'auto'
    });
    this.info.add(this.container);

    // Room name
    this.nameEl = new Interface('.name');
    this.nameEl.css({
      fontFamily: 'var(--ui-name-font-family)',
      fontWeight: 'var(--ui-name-font-weight)',
      fontSize: 'var(--ui-name-font-size)',
      lineHeight: 'var(--ui-name-line-height)',
      letterSpacing: 'var(--ui-name-letter-spacing)',
      whiteSpace: 'nowrap'
    });
    this.nameEl.html(this.room.name);
    this.container.add(this.nameEl);

    // Room type/description
    this.typeEl = new Interface('.type');
    this.typeEl.css({
      fontSize: 'var(--ui-secondary-font-size)',
      letterSpacing: 'var(--ui-secondary-letter-spacing)',
      paddingBottom: 3,
      opacity: 0.7
    });
    this.typeEl.html(this.room.metadata.description || 'Room');
    this.container.add(this.typeEl);

    // Panel for expanded state
    this.panel = new Panel();
    this._buildPanel();
    this.info.add(this.panel);

    // Click to expand
    this.container.element.addEventListener('click', () => {
      if (!this.isExpanded) {
        this.expand();
      }
    });
  }

  _buildPanel() {
    // Personality section
    const personality = getRoomPersonality(this.room.id);

    const personalityItem = new PanelItem({
      type: 'content'
    });
    personalityItem.container.html(`
      <div style="padding: 8px 0;">
        <div style="font-weight: 600; margin-bottom: 4px;">Personality: ${personality.name}</div>
        <div style="font-size: 10px; opacity: 0.8; margin-bottom: 8px;">${personality.expertise}</div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <span style="font-size: 9px; padding: 2px 6px; background: rgba(255,255,255,0.1); border-radius: 3px;">O: ${personality.ffm.O.toFixed(1)}</span>
          <span style="font-size: 9px; padding: 2px 6px; background: rgba(255,255,255,0.1); border-radius: 3px;">C: ${personality.ffm.C.toFixed(1)}</span>
          <span style="font-size: 9px; padding: 2px 6px; background: rgba(255,255,255,0.1); border-radius: 3px;">E: ${personality.ffm.E.toFixed(1)}</span>
          <span style="font-size: 9px; padding: 2px 6px; background: rgba(255,255,255,0.1); border-radius: 3px;">A: ${personality.ffm.A.toFixed(1)}</span>
          <span style="font-size: 9px; padding: 2px 6px; background: rgba(255,255,255,0.1); border-radius: 3px;">N: ${personality.ffm.N.toFixed(1)}</span>
        </div>
      </div>
    `);
    this.panel.add(personalityItem);

    this.panel.add(new PanelItem({ type: 'divider' }));

    // Sensors section
    this._addSensorItems();

    this.panel.add(new PanelItem({ type: 'divider' }));

    // Room info
    const infoItem = new PanelItem({
      type: 'content'
    });
    infoItem.container.html(this._getRoomInfoHTML());
    this.panel.add(infoItem);

    // Close button
    const closeItem = new PanelItem({
      type: 'content'
    });
    closeItem.container.html(`
      <button class="panel-close" style="
        width: 100%;
        padding: 8px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        color: var(--ui-color);
        cursor: pointer;
        font-family: var(--ui-font-family);
        font-size: var(--ui-font-size);
      ">Close</button>
    `);
    closeItem.container.element.querySelector('.panel-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.collapse();
    });
    this.panel.add(closeItem);
  }

  _addSensorItems() {
    const sensors = this.room.metadata?.sensors || [];

    if (sensors.length === 0) {
      const noSensorsItem = new PanelItem({
        type: 'content'
      });
      noSensorsItem.container.html('<div style="padding: 8px; opacity: 0.5; font-style: italic;">No sensors configured</div>');
      this.panel.add(noSensorsItem);
      return;
    }

    sensors.forEach(sensorType => {
      const sensorReading = this.sensorManager.getSensor(this.room.id, sensorType);
      const sensorMeta = this.sensorManager.getSensorMeta(sensorType);

      if (!sensorMeta) return;

      const value = sensorReading ?
        `${sensorReading.value} ${sensorReading.unit}` :
        'No data';

      const status = sensorReading ? sensorReading.status : 'unknown';
      const statusColors = {
        ok: 'var(--ui-color-range-3)',
        warning: 'var(--ui-color-range-4)',
        error: 'var(--ui-color-range-1)',
        unknown: 'var(--ui-secondary-color)'
      };

      const sensorItem = new PanelItem({
        type: 'content'
      });
      sensorItem.container.html(`
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0;">
          <div style="display: flex; align-items: center; gap: 6px;">
            ${getIcon(sensorType, 'icon-sm')}
            <span>${sensorMeta.label}</span>
          </div>
          <div style="font-weight: 600; color: ${statusColors[status]};">${value}</div>
        </div>
      `);
      this.panel.add(sensorItem);
    });
  }

  _getRoomInfoHTML() {
    const metadata = this.room.metadata;
    const features = metadata.features && metadata.features.length > 0 ?
      metadata.features.join(', ') : 'None';

    return `
      <div style="padding: 8px 0;">
        ${metadata.capacity ? `
          <div style="display: flex; justify-content: space-between; padding: 4px 0;">
            <span style="opacity: 0.7;">Capacity</span>
            <span>${metadata.capacity} people</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; padding: 4px 0;">
          <span style="opacity: 0.7;">Features</span>
          <span>${features}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
          <span style="opacity: 0.7;">Color</span>
          <span style="display: flex; align-items: center; gap: 6px;">
            <span style="display: inline-block; width: 12px; height: 12px; background-color: ${metadata.color}; border: 1px solid rgba(255,255,255,0.2); border-radius: 2px;"></span>
            ${metadata.color}
          </span>
        </div>
      </div>
    `;
  }

  /**
   * Update screen position and line (call in RAF loop)
   */
  update() {
    if (!this.isHovered && !this.isExpanded) return;

    // Project 3D position to screen space
    const vector = this.room.position.clone();
    vector.project(this.camera);

    // Convert to screen coordinates
    this.screenPosition.x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    this.screenPosition.y = (vector.y * -0.5 + 0.5) * window.innerHeight;

    // Check if room is behind camera
    if (vector.z > 1) {
      this.hide();
      return;
    }

    // Update position
    this.css({
      left: Math.round(this.screenPosition.x),
      top: Math.round(this.screenPosition.y)
    });

    // Update line to connect to label
    if (this.line) {
      this.line.update();
    }
  }

  /**
   * Show label on hover
   */
  showLabel() {
    if (this.isExpanded) return;

    this.isHovered = true;
    this.animateIn();
  }

  /**
   * Hide label on hover out
   */
  hideLabel() {
    if (this.isExpanded) return;

    this.isHovered = false;
    this.animateOut();
  }

  /**
   * Expand label into full panel
   */
  expand() {
    this.isExpanded = true;

    // Slide info to the right
    this.info.clearTween().tween({ left: 48, opacity: 1 }, 400, 'easeOutCubic');

    // Show panel
    this.panel.animateIn();
    this.panel.activate();
  }

  /**
   * Collapse panel back to label
   */
  collapse() {
    this.isExpanded = false;

    // Slide info back
    this.info.clearTween().tween({ left: 10, opacity: 1 }, 400, 'easeInCubic', 200);

    // Hide panel
    this.panel.animateOut();
    this.panel.deactivate();
  }

  /**
   * Hide everything
   */
  hide() {
    this.isHovered = false;
    this.isExpanded = false;
    this.css({ opacity: 0 });
  }

  /**
   * Animate in
   */
  animateIn() {
    this.clearTween().css({ opacity: 0 }).tween({ opacity: 1 }, 400, 'easeOutCubic', 200);
  }

  /**
   * Animate out
   */
  animateOut() {
    this.clearTween().tween({ opacity: 0 }, 500, 'easeInCubic', 200);
  }

  /**
   * Cleanup
   */
  dispose() {
    return this.destroy();
  }
}
