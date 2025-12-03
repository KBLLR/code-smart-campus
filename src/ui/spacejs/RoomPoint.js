/**
 * RoomPoint - Space.js Point implementation for rooms
 * Displays hover label with SVG line connecting to 3D geometry
 */

import * as THREE from 'three';
import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';
import { Panel } from '@alienkitty/space.js/src/panels/Panel.js';
import { PanelItem } from '@alienkitty/space.js/src/panels/PanelItem.js';
import { Line } from '@alienkitty/space.js/src/ui/Line.js';
import { Vector2 } from '@alienkitty/space.js/src/math/Vector2.js';
import { getRoomPersonality } from '../../rooms/roomsMetadata.js';
import { getIcon } from '../icons.js';

export class RoomPoint extends Interface {
  constructor(room, camera, sensorManager) {
    super('.point');

    this.room = room;
    this.camera = camera;
    this.sensorManager = sensorManager;

    // Screen positions (Space.js Vector2)
    this.position = new Vector2();
    this.origin = new Vector2();
    this.originPosition = new Vector2();
    this.target = new Vector2();
    this.lerpSpeed = 0.07;

    // States
    this.isOpen = false;
    this.isHovered = false;

    this.init();
    this.initViews();
  }

  init() {
    this.invisible();
    this.css({
      position: 'absolute',
      pointerEvents: 'auto',
      webkitUserSelect: 'none',
      userSelect: 'none'
    });
  }

  initViews() {
    // SVG Line from 3D point to label
    this.line = new Line();
    this.add(this.line);

    // Info container (the label that appears on hover)
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
      lineHeight: 18,
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
      if (!this.isOpen) {
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
    if (!this.isHovered && !this.isOpen) return;

    // Project 3D position to screen space
    const vector = this.room.position.clone();
    vector.project(this.camera);

    // Check if behind camera
    if (vector.z > 1) {
      this.hideLabel();
      return;
    }

    // Convert to screen coordinates
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (vector.y * -0.5 + 0.5) * window.innerHeight;

    this.target.set(x, y);

    // Lerp position for smooth movement
    this.position.lerp(this.target, this.lerpSpeed);
    this.originPosition.addVectors(this.origin, this.position);

    // Update position
    this.css({
      left: Math.round(this.originPosition.x),
      top: Math.round(this.originPosition.y)
    });
  }

  /**
   * Show label on hover
   */
  showLabel() {
    if (this.isOpen) return;

    this.isHovered = true;
    this.animateIn();
  }

  /**
   * Hide label
   */
  hideLabel() {
    if (this.isOpen) return;

    this.isHovered = false;
    this.animateOut();
  }

  /**
   * Expand into full panel
   */
  expand() {
    this.info.css({ pointerEvents: 'auto' });
    this.info.clearTween().tween({ left: 48, opacity: 1 }, 400, 'easeOutCubic');

    this.panel.animateIn();
    this.panel.activate();

    this.isOpen = true;
  }

  /**
   * Collapse panel
   */
  collapse() {
    this.info.css({ pointerEvents: 'none' });
    this.info.clearTween().tween({ left: 10, opacity: 1 }, 400, 'easeInCubic', 200);

    this.panel.animateOut();
    this.panel.deactivate();

    this.isOpen = false;
  }

  /**
   * Animate in
   */
  animateIn() {
    this.visible();
    this.clearTween().css({ opacity: 1 });
    this.info.clearTween().css({ opacity: 0 }).tween({ left: 10, opacity: 1 }, 400, 'easeOutCubic', 200);
  }

  /**
   * Animate out
   */
  animateOut() {
    this.info.clearTween().tween({ opacity: 0 }, 500, 'easeInCubic', 200, () => {
      if (!this.isHovered && !this.isOpen) {
        this.invisible();
      }
    });
  }

  /**
   * Cleanup
   */
  dispose() {
    return this.destroy();
  }

  // Expose isExpanded for manager
  get isExpanded() {
    return this.isOpen;
  }
}
