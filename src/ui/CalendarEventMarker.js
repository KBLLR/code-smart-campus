/**
 * CalendarEventMarker - 3D event visualization using space.js Point3D
 * Displays calendar events attached to room blocks with glassmorphism panels
 *
 * Usage:
 *   const marker = new CalendarEventMarker(scene, camera, roomMesh, eventData);
 *   marker.show();
 */

import { Point3D } from '@alienkitty/space.js/src/three/ui/Point3D.js';
import { PanelItem } from '@alienkitty/space.js/src/panels/PanelItem.js';
import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';

export class CalendarEventMarker {
  /**
   * @param {THREE.Scene} scene - Three.js scene
   * @param {THREE.Camera} camera - Three.js camera
   * @param {THREE.Mesh} roomMesh - Room mesh to attach marker to
   * @param {object} event - Event object from ICSParser
   */
  constructor(scene, camera, roomMesh, event) {
    this.scene = scene;
    this.camera = camera;
    this.roomMesh = roomMesh;
    this.event = event;

    // Event type classification
    this.eventType = this.classifyEventType(event);

    // Create Point3D marker
    this.point = new Point3D(roomMesh, {
      name: event.summary || 'Untitled Event',
      type: this.getEventTypeLabel(),
      noTracker: false // Enable screen-space tracking
    });

    // Initialize panel
    this.initPanel();

    // Set marker color based on event type
    this.updateMarkerColor();
  }

  /**
   * Classify event type from summary/categories
   */
  classifyEventType(event) {
    const summary = (event.summary || '').toLowerCase();
    const categories = (event.categories || []).map(c => c.toLowerCase());

    // Check categories first
    if (categories.includes('class') || categories.includes('lecture')) {
      return 'class';
    }
    if (categories.includes('workshop')) {
      return 'workshop';
    }
    if (categories.includes('meeting')) {
      return 'meeting';
    }
    if (categories.includes('event')) {
      return 'event';
    }

    // Fallback to summary keywords
    if (summary.includes('class') || summary.includes('lecture') || summary.includes('cs ') || summary.includes('lab')) {
      return 'class';
    }
    if (summary.includes('workshop') || summary.includes('tutorial')) {
      return 'workshop';
    }
    if (summary.includes('meeting') || summary.includes('standup') || summary.includes('sync')) {
      return 'meeting';
    }

    return 'event'; // Default
  }

  /**
   * Get display label for event type
   */
  getEventTypeLabel() {
    const labels = {
      class: 'CLASS',
      workshop: 'WORKSHOP',
      meeting: 'MEETING',
      event: 'EVENT'
    };
    return labels[this.eventType] || 'EVENT';
  }

  /**
   * Get color for event type
   */
  getEventTypeColor() {
    const colors = {
      class: 'rgba(100, 150, 255, 0.9)',    // Blue - academic
      workshop: 'rgba(150, 100, 255, 0.9)',  // Purple - learning
      meeting: 'rgba(255, 150, 100, 0.9)',   // Orange - collaboration
      event: 'rgba(100, 255, 150, 0.9)'      // Green - general
    };
    return colors[this.eventType] || colors.event;
  }

  /**
   * Initialize glassmorphism panel with event details
   */
  initPanel() {
    // Create panel container
    this.panel = new Interface('.event-panel');

    this.panel.css({
      background: 'rgba(6, 6, 6, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${this.getEventTypeColor()}`,
      borderRadius: '8px',
      padding: '16px',
      minWidth: 250,
      maxWidth: 350,
      fontFamily: 'var(--ui-font-family)',
      fontSize: 'var(--ui-font-size)',
      color: 'var(--ui-color)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
      pointerEvents: 'auto',
      userSelect: 'text'
    });

    // Event header
    const header = new PanelItem();
    header.css({
      fontSize: 'var(--ui-title-font-size)',
      fontWeight: '500',
      letterSpacing: 'var(--ui-title-letter-spacing)',
      marginBottom: '12px',
      paddingBottom: '8px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      color: this.getEventTypeColor()
    });
    header.text(this.event.summary || 'Untitled Event');
    this.panel.add(header);

    // Time information
    if (this.event.start && this.event.end) {
      const timeItem = this.createInfoItem('Time', this.formatTimeRange());
      this.panel.add(timeItem);
    }

    // Location
    if (this.event.location) {
      const locationItem = this.createInfoItem('Location', this.event.location);
      this.panel.add(locationItem);
    }

    // Organizer
    if (this.event.organizer) {
      const organizerItem = this.createInfoItem('Organizer', this.event.organizer.name);
      this.panel.add(organizerItem);
    }

    // Attendees count
    if (this.event.attendees && this.event.attendees.length > 0) {
      const attendeesItem = this.createInfoItem('Attendees', `${this.event.attendees.length} participant${this.event.attendees.length !== 1 ? 's' : ''}`);
      this.panel.add(attendeesItem);
    }

    // Status
    if (this.event.status && this.event.status !== 'confirmed') {
      const statusItem = this.createInfoItem('Status', this.event.status.toUpperCase());
      statusItem.css({ color: this.getStatusColor() });
      this.panel.add(statusItem);
    }

    // Description (truncated)
    if (this.event.description) {
      const desc = this.event.description.length > 150
        ? this.event.description.substring(0, 150) + '...'
        : this.event.description;
      const descItem = this.createInfoItem('Description', desc);
      descItem.css({
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        opacity: 0.7,
        fontSize: '11px',
        lineHeight: '1.6'
      });
      this.panel.add(descItem);
    }

    // Recurrence indicator
    if (this.event.recurrence) {
      const recurrenceItem = this.createInfoItem('Recurrence', this.formatRecurrence());
      recurrenceItem.css({ opacity: 0.6, fontSize: '11px' });
      this.panel.add(recurrenceItem);
    }

    // Attach panel to point
    this.point.add(this.panel);
  }

  /**
   * Create info item (label + value)
   */
  createInfoItem(label, value) {
    const item = new Interface('.info-item');

    item.css({
      marginBottom: '8px',
      lineHeight: '1.5'
    });

    const labelSpan = document.createElement('span');
    labelSpan.textContent = label + ': ';
    labelSpan.style.cssText = `
      opacity: 0.5;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 1px;
    `;

    const valueSpan = document.createElement('span');
    valueSpan.textContent = value;
    valueSpan.style.cssText = `
      opacity: 0.9;
    `;

    item.element.appendChild(labelSpan);
    item.element.appendChild(valueSpan);

    return item;
  }

  /**
   * Format time range for display
   */
  formatTimeRange() {
    const startTime = this.event.start.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const endTime = this.event.end.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const startDate = this.event.start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    // Check if multi-day event
    const isMultiDay = this.event.start.toDateString() !== this.event.end.toDateString();

    if (isMultiDay) {
      const endDate = this.event.end.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      return `${startDate} ${startTime} - ${endDate} ${endTime}`;
    }

    return `${startDate} ${startTime} - ${endTime}`;
  }

  /**
   * Format recurrence rule for display
   */
  formatRecurrence() {
    const rule = this.event.recurrence;

    if (rule.frequency) {
      let text = rule.frequency.toUpperCase();

      if (rule.interval && rule.interval > 1) {
        text = `Every ${rule.interval} ${rule.frequency}`;
      }

      if (rule.byDay && rule.byDay.length > 0) {
        text += ` on ${rule.byDay.join(', ')}`;
      }

      if (rule.until) {
        const untilDate = rule.until.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        text += ` until ${untilDate}`;
      } else if (rule.count) {
        text += ` (${rule.count} times)`;
      }

      return text;
    }

    return 'Repeating';
  }

  /**
   * Get status color
   */
  getStatusColor() {
    const colors = {
      confirmed: 'rgba(100, 255, 150, 0.9)',
      tentative: 'rgba(255, 200, 100, 0.9)',
      cancelled: 'rgba(255, 100, 100, 0.9)'
    };
    return colors[this.event.status] || colors.confirmed;
  }

  /**
   * Update marker visual appearance
   */
  updateMarkerColor() {
    // This can be enhanced to modify the Point3D marker's appearance
    // For now, the border color on the panel provides visual distinction
  }

  /**
   * Check if event is currently happening
   */
  isCurrentEvent() {
    const now = new Date();
    return this.event.start <= now && this.event.end >= now;
  }

  /**
   * Check if event is upcoming (within next N hours)
   */
  isUpcomingEvent(hours = 2) {
    const now = new Date();
    const future = new Date(now.getTime() + hours * 60 * 60 * 1000);
    return this.event.start >= now && this.event.start <= future;
  }

  /**
   * Check if event is in the past
   */
  isPastEvent() {
    const now = new Date();
    return this.event.end < now;
  }

  /**
   * Get event time status
   */
  getTimeStatus() {
    if (this.isCurrentEvent()) return 'current';
    if (this.isUpcomingEvent()) return 'upcoming';
    if (this.isPastEvent()) return 'past';
    return 'future';
  }

  /**
   * Update marker visibility based on time status
   */
  updateTimeStatus() {
    const status = this.getTimeStatus();

    switch (status) {
      case 'current':
        // Highlight current events
        this.panel.css({
          border: `2px solid ${this.getEventTypeColor()}`,
          boxShadow: `0 0 20px ${this.getEventTypeColor()}`
        });
        break;

      case 'upcoming':
        // Normal visibility
        this.panel.css({ opacity: 1 });
        break;

      case 'past':
        // Fade out past events
        this.panel.css({ opacity: 0.4 });
        break;

      case 'future':
        // Slightly transparent
        this.panel.css({ opacity: 0.7 });
        break;
    }
  }

  /**
   * Show marker
   */
  show() {
    this.point.visible = true;
    this.updateTimeStatus();
  }

  /**
   * Hide marker
   */
  hide() {
    this.point.visible = false;
  }

  /**
   * Toggle marker visibility
   */
  toggle() {
    this.point.visible = !this.point.visible;
  }

  /**
   * Remove marker from scene
   */
  destroy() {
    if (this.point) {
      this.point.remove();
      this.point = null;
    }
    if (this.panel) {
      this.panel = null;
    }
  }

  /**
   * Update marker position (if room mesh changes)
   */
  updatePosition() {
    if (this.point) {
      this.point.updatePosition();
    }
  }
}

/**
 * CalendarEventManager - Manages multiple calendar event markers
 * Handles loading, filtering, and batch operations on event markers
 */
export class CalendarEventManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.markers = [];
    this.roomMeshMap = new Map(); // roomId -> THREE.Mesh
    this.updateInterval = null;
  }

  /**
   * Register room mesh for event attachment
   */
  registerRoomMesh(roomId, mesh) {
    this.roomMeshMap.set(roomId, mesh);
  }

  /**
   * Create markers from event data
   * @param {Array} events - Array of parsed ICS events
   */
  createMarkersFromEvents(events) {
    events.forEach(event => {
      // Find room mesh by location
      const roomMesh = this.findRoomMeshByLocation(event.location);

      if (roomMesh) {
        const marker = new CalendarEventMarker(
          this.scene,
          this.camera,
          roomMesh,
          event
        );

        this.markers.push(marker);
        marker.show();
      } else {
        console.warn(`[CalendarEventManager] No room mesh found for location: ${event.location}`);
      }
    });

    console.log(`[CalendarEventManager] Created ${this.markers.length} event markers`);
  }

  /**
   * Find room mesh by location string
   */
  findRoomMeshByLocation(location) {
    if (!location) return null;

    // Try exact match first
    if (this.roomMeshMap.has(location)) {
      return this.roomMeshMap.get(location);
    }

    // Try partial match (e.g., "Room A.5" matches "A.5")
    const normalized = location.toLowerCase().replace(/[^a-z0-9.]/g, '');

    for (const [roomId, mesh] of this.roomMeshMap.entries()) {
      const roomIdNormalized = roomId.toLowerCase().replace(/[^a-z0-9.]/g, '');
      if (normalized.includes(roomIdNormalized) || roomIdNormalized.includes(normalized)) {
        return mesh;
      }
    }

    return null;
  }

  /**
   * Filter markers by time status
   */
  filterByTimeStatus(status) {
    return this.markers.filter(marker => marker.getTimeStatus() === status);
  }

  /**
   * Filter markers by event type
   */
  filterByEventType(type) {
    return this.markers.filter(marker => marker.eventType === type);
  }

  /**
   * Show only specific markers
   */
  showOnly(markersToShow) {
    this.markers.forEach(marker => {
      if (markersToShow.includes(marker)) {
        marker.show();
      } else {
        marker.hide();
      }
    });
  }

  /**
   * Show all markers
   */
  showAll() {
    this.markers.forEach(marker => marker.show());
  }

  /**
   * Hide all markers
   */
  hideAll() {
    this.markers.forEach(marker => marker.hide());
  }

  /**
   * Clear all markers
   */
  clearAll() {
    this.markers.forEach(marker => marker.destroy());
    this.markers = [];
  }

  /**
   * Start auto-update (refresh time status periodically)
   */
  startAutoUpdate(intervalMs = 60000) { // Default: 1 minute
    this.stopAutoUpdate();

    this.updateInterval = setInterval(() => {
      this.markers.forEach(marker => marker.updateTimeStatus());
    }, intervalMs);

    console.log(`[CalendarEventManager] Auto-update started (${intervalMs}ms interval)`);
  }

  /**
   * Stop auto-update
   */
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      total: this.markers.length,
      current: this.filterByTimeStatus('current').length,
      upcoming: this.filterByTimeStatus('upcoming').length,
      past: this.filterByTimeStatus('past').length,
      future: this.filterByTimeStatus('future').length,
      byType: {
        class: this.filterByEventType('class').length,
        workshop: this.filterByEventType('workshop').length,
        meeting: this.filterByEventType('meeting').length,
        event: this.filterByEventType('event').length
      }
    };
  }
}
