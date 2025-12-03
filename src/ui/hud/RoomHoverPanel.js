/**
 * RoomHoverPanel - Space.js Styled Hover Panel for Rooms
 * Displays room information when hovering over 3D geometries
 */

import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';

export class RoomHoverPanel extends Interface {
  constructor(classroomRegistry) {
    super('.room-hover-panel');

    this.classroomRegistry = classroomRegistry;
    this.currentRoom = null;
    this.visible = false;

    this.init();
    this.initViews();
  }

  init() {
    this.css({
      position: 'fixed',
      zIndex: 2000,
      pointerEvents: 'none',
      opacity: 0,
      transform: 'translateY(10px)',
      transition: 'opacity 300ms ease-out, transform 300ms ease-out',
      webkitUserSelect: 'none',
      userSelect: 'none'
    });

    // CRITICAL: Add the panel to the DOM!
    document.body.appendChild(this.element);
  }

  initViews() {
    // Container with glassmorphism
    this.container = new Interface('.container');
    this.container.css({
      background: 'rgba(6, 6, 6, 0.85)',
      backdropFilter: 'blur(20px)',
      webkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '16px',
      minWidth: '280px',
      maxWidth: '320px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
    });
    this.add(this.container);

    // Room Name (Header)
    this.roomName = new Interface('.room-name');
    this.roomName.css({
      fontFamily: 'var(--ui-font-family)',
      fontSize: '13px',
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: 'var(--ui-color)',
      marginBottom: '12px',
      opacity: 0.9
    });
    this.container.add(this.roomName);

    // Metrics Container
    this.metricsContainer = new Interface('.metrics');
    this.metricsContainer.css({
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginBottom: '12px'
    });
    this.container.add(this.metricsContainer);

    // Agent Info
    this.agentInfo = new Interface('.agent-info');
    this.agentInfo.css({
      fontFamily: 'var(--ui-font-family)',
      fontSize: '10px',
      letterSpacing: 0.5,
      color: 'var(--ui-color)',
      opacity: 0.5,
      fontStyle: 'italic',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      paddingTop: '8px',
      marginTop: '4px'
    });
    this.container.add(this.agentInfo);
  }

  createMetricRow(label, value, status = 'normal') {
    const row = new Interface('.metric-row');
    row.css({
      display: 'flex',
      justifyContent: 'space-between',
      fontFamily: 'var(--ui-font-family)',
      fontSize: '11px',
      letterSpacing: 0.5
    });

    const labelEl = new Interface('.label');
    labelEl.css({
      color: 'var(--ui-color)',
      opacity: 0.5,
      textTransform: 'uppercase'
    });
    labelEl.text(label);
    row.add(labelEl);

    const valueEl = new Interface('.value');
    const color = status === 'warning' ? 'var(--ui-color-range-4)' :
      status === 'good' ? 'var(--ui-color-range-3)' :
        'var(--ui-color)';
    valueEl.css({
      color,
      opacity: 0.7,
      fontWeight: '500'
    });
    valueEl.text(value);
    row.add(valueEl);

    return row;
  }

  show(roomId, mouseX, mouseY) {
    // Case-insensitive lookup
    const normalizedId = Object.keys(this.classroomRegistry).find(key =>
      key.toLowerCase() === roomId.toLowerCase()
    );
    const classroom = normalizedId ? this.classroomRegistry[normalizedId] : null;

    this.currentRoom = roomId;

    // If no data, hide panel (cleaner UI)
    if (!classroom) {
      this.hide();
      return;
    }

    // Update room name
    this.roomName.text(classroom.name);

    // Clear previous metrics
    this.metricsContainer.children.forEach(child => child.destroy());
    this.metricsContainer.children = [];

    // Add metrics
    const occupancy = classroom.getSensor('occupancy');
    if (occupancy) {
      const occupancyStatus = occupancy.current_value > classroom.metadata.capacity * 0.8 ? 'warning' : 'normal';
      const occupancyRow = this.createMetricRow(
        'Occupancy',
        `${occupancy.current_value}/${classroom.metadata.capacity}`,
        occupancyStatus
      );
      this.metricsContainer.add(occupancyRow);
    }

    const temperature = classroom.getSensor('temperature');
    if (temperature && temperature.current_value) {
      const tempStatus = temperature.current_value > 24 || temperature.current_value < 18 ? 'warning' : 'good';
      const tempRow = this.createMetricRow(
        'Temperature',
        `${temperature.current_value.toFixed(1)}°C`,
        tempStatus
      );
      this.metricsContainer.add(tempRow);
    }

    const co2 = classroom.getSensor('co2');
    if (co2 && co2.current_value) {
      const co2Status = co2.current_value > 1000 ? 'warning' : 'good';
      const co2Row = this.createMetricRow(
        'CO₂',
        `${co2.current_value}ppm`,
        co2Status
      );
      this.metricsContainer.add(co2Row);
    }

    // Show current event if any
    if (classroom.events.current) {
      const eventRow = this.createMetricRow(
        'Event',
        classroom.events.current.title
      );
      this.metricsContainer.add(eventRow);
    }

    // Update agent info
    if (classroom.agent?.personality) {
      this.agentInfo.html(`Agent: ${classroom.agent.personality.name}`);
    } else {
      this.agentInfo.html(''); // Clear if no agent
    }

    // Position and show panel
    this._positionPanel(mouseX, mouseY);
  }

  _positionPanel(mouseX, mouseY) {
    // Position panel near cursor (with bounds checking)
    const padding = 20;
    const panelWidth = 320;
    const panelHeight = 200; // Approximate

    let x = mouseX + padding;
    let y = mouseY + padding;

    // Keep panel within viewport
    if (x + panelWidth > window.innerWidth) {
      x = mouseX - panelWidth - padding;
    }
    if (y + panelHeight > window.innerHeight) {
      y = mouseY - panelHeight - padding;
    }

    this.css({
      left: `${x}px`,
      top: `${y}px`
    });

    // Animate in
    if (!this.visible) {
      this.visible = true;
      this.css({
        opacity: 1,
        transform: 'translateY(0)'
      });
    }
  }

  hide() {
    if (!this.visible) return;

    this.visible = false;
    this.currentRoom = null;

    this.css({
      opacity: 0,
      transform: 'translateY(10px)'
    });
  }

  destroy() {
    this.hide();
    super.destroy();
  }
}
