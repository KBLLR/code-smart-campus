/**
 * RoomAvailabilityPanel - Room availability checker using space.js Panel
 * Displays room status, current/upcoming events, and booking information
 *
 * Features:
 * - Real-time availability status
 * - Current event display
 * - Upcoming events list
 * - Time until next event
 * - Quick booking interface (future)
 *
 * Usage:
 *   const panel = new RoomAvailabilityPanel(roomId, eventManager);
 *   panel.show();
 */

import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';
import { Panel } from '@alienkitty/space.js/src/panels/Panel.js';
import { PanelItem } from '@alienkitty/space.js/src/panels/PanelItem.js';

export class RoomAvailabilityPanel extends Interface {
  constructor(roomId, roomName, eventManager) {
    super('.room-availability-panel');

    this.roomId = roomId;
    this.roomName = roomName || roomId;
    this.eventManager = eventManager;
    this.currentEvents = [];
    this.upcomingEvents = [];
    this.updateInterval = null;

    this.init();
    this.updateAvailability();
  }

  init() {
    // Main container - glassmorphism panel
    this.css({
      position: 'fixed',
      top: '50%',
      right: 40,
      transform: 'translateY(-50%)',
      width: 380,
      maxHeight: '80vh',
      background: 'rgba(6, 6, 6, 0.90)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '24px',
      zIndex: 1800,
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
      display: 'none',
      overflowY: 'auto',
      fontFamily: 'var(--ui-font-family)',
      color: 'var(--ui-color)'
    });

    // Custom scrollbar
    this.element.style.cssText += `
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
    `;

    this.initHeader();
    this.initStatusSection();
    this.initCurrentEventSection();
    this.initUpcomingEventsSection();
    this.initCloseButton();
  }

  /**
   * Initialize header with room name
   */
  initHeader() {
    this.header = new Interface('.panel-header');

    this.header.css({
      marginBottom: 20,
      paddingBottom: 16,
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    });

    // Room name
    this.roomNameLabel = new Interface('.room-name');
    this.roomNameLabel.css({
      fontSize: 'var(--ui-title-font-size)',
      fontWeight: '500',
      letterSpacing: 'var(--ui-title-letter-spacing)',
      textTransform: 'uppercase',
      marginBottom: 8
    });
    this.roomNameLabel.text(this.roomName);

    // Subtitle
    this.subtitle = new Interface('.subtitle');
    this.subtitle.css({
      fontSize: '11px',
      opacity: 0.5,
      letterSpacing: '0.5px'
    });
    this.subtitle.text('ROOM AVAILABILITY');

    this.header.add(this.roomNameLabel);
    this.header.add(this.subtitle);
    this.add(this.header);
  }

  /**
   * Initialize availability status section
   */
  initStatusSection() {
    this.statusSection = new Interface('.status-section');

    this.statusSection.css({
      marginBottom: 24,
      padding: '16px',
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.05)'
    });

    // Status indicator
    this.statusIndicator = new Interface('.status-indicator');
    this.statusIndicator.css({
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12
    });

    // Status dot
    this.statusDot = new Interface('.status-dot');
    this.statusDot.css({
      width: 12,
      height: 12,
      borderRadius: '50%',
      background: 'rgba(100, 255, 150, 0.9)',
      boxShadow: '0 0 8px rgba(100, 255, 150, 0.6)'
    });

    // Status text
    this.statusText = new Interface('.status-text');
    this.statusText.css({
      fontSize: '14px',
      fontWeight: '500',
      letterSpacing: '1px',
      textTransform: 'uppercase'
    });
    this.statusText.text('AVAILABLE');

    this.statusIndicator.add(this.statusDot);
    this.statusIndicator.add(this.statusText);

    // Time info
    this.timeInfo = new Interface('.time-info');
    this.timeInfo.css({
      fontSize: '12px',
      opacity: 0.7,
      lineHeight: '1.6'
    });
    this.timeInfo.text('No events scheduled');

    this.statusSection.add(this.statusIndicator);
    this.statusSection.add(this.timeInfo);
    this.add(this.statusSection);
  }

  /**
   * Initialize current event section
   */
  initCurrentEventSection() {
    this.currentEventSection = new Interface('.current-event-section');

    this.currentEventSection.css({
      marginBottom: 24
    });

    // Section header
    this.currentEventHeader = new Interface('.section-header');
    this.currentEventHeader.css({
      fontSize: '11px',
      letterSpacing: '1px',
      textTransform: 'uppercase',
      opacity: 0.5,
      marginBottom: 12
    });
    this.currentEventHeader.text('CURRENT EVENT');

    // Event container
    this.currentEventContainer = new Interface('.current-event-container');

    this.currentEventSection.add(this.currentEventHeader);
    this.currentEventSection.add(this.currentEventContainer);
    this.add(this.currentEventSection);
  }

  /**
   * Initialize upcoming events section
   */
  initUpcomingEventsSection() {
    this.upcomingEventsSection = new Interface('.upcoming-events-section');

    // Section header
    this.upcomingEventsHeader = new Interface('.section-header');
    this.upcomingEventsHeader.css({
      fontSize: '11px',
      letterSpacing: '1px',
      textTransform: 'uppercase',
      opacity: 0.5,
      marginBottom: 12
    });
    this.upcomingEventsHeader.text('UPCOMING EVENTS');

    // Events list container
    this.upcomingEventsContainer = new Interface('.upcoming-events-container');
    this.upcomingEventsContainer.css({
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    });

    this.upcomingEventsSection.add(this.upcomingEventsHeader);
    this.upcomingEventsSection.add(this.upcomingEventsContainer);
    this.add(this.upcomingEventsSection);
  }

  /**
   * Initialize close button
   */
  initCloseButton() {
    this.closeButton = new Interface('.close-button');

    this.closeButton.css({
      position: 'absolute',
      top: 20,
      right: 20,
      cursor: 'pointer',
      fontSize: '11px',
      letterSpacing: '1px',
      opacity: 0.5,
      transition: 'opacity 0.2s ease',
      padding: '4px 8px',
      textTransform: 'uppercase'
    });

    this.closeButton.text('✕ CLOSE');

    this.closeButton.element.addEventListener('click', () => {
      this.hide();
    });

    this.closeButton.element.addEventListener('mouseenter', () => {
      this.closeButton.css({ opacity: 1 });
    });

    this.closeButton.element.addEventListener('mouseleave', () => {
      this.closeButton.css({ opacity: 0.5 });
    });

    this.add(this.closeButton);
  }

  /**
   * Update availability status and events
   */
  updateAvailability() {
    if (!this.eventManager) {
      this.setStatus('unknown', 'No event data available');
      return;
    }

    // Get events for this room
    const roomEvents = this.getRoomEvents();

    // Find current events
    this.currentEvents = roomEvents.filter(event => this.isCurrentEvent(event));

    // Find upcoming events (next 24 hours)
    this.upcomingEvents = roomEvents
      .filter(event => this.isUpcomingEvent(event, 24))
      .sort((a, b) => a.start - b.start)
      .slice(0, 5); // Limit to 5 upcoming events

    // Update UI based on availability
    if (this.currentEvents.length > 0) {
      this.setOccupied();
    } else if (this.upcomingEvents.length > 0) {
      this.setAvailableUntil();
    } else {
      this.setAvailable();
    }

    this.renderCurrentEvent();
    this.renderUpcomingEvents();
  }

  /**
   * Get events for this room
   */
  getRoomEvents() {
    if (!this.eventManager || !this.eventManager.markers) {
      return [];
    }

    return this.eventManager.markers
      .map(marker => marker.event)
      .filter(event => {
        const location = (event.location || '').toLowerCase();
        const roomId = this.roomId.toLowerCase();
        const roomName = this.roomName.toLowerCase();

        return location.includes(roomId) || location.includes(roomName);
      });
  }

  /**
   * Check if event is currently happening
   */
  isCurrentEvent(event) {
    const now = new Date();
    return event.start <= now && event.end >= now;
  }

  /**
   * Check if event is upcoming (within next N hours)
   */
  isUpcomingEvent(event, hours = 24) {
    const now = new Date();
    const future = new Date(now.getTime() + hours * 60 * 60 * 1000);
    return event.start >= now && event.start <= future;
  }

  /**
   * Set status: occupied
   */
  setOccupied() {
    const currentEvent = this.currentEvents[0];
    const endTime = currentEvent.end;
    const now = new Date();
    const minutesRemaining = Math.floor((endTime - now) / (1000 * 60));

    this.setStatus('occupied', `Occupied until ${this.formatTime(endTime)} (${minutesRemaining} min remaining)`, 'rgba(255, 100, 100, 0.9)');
  }

  /**
   * Set status: available until next event
   */
  setAvailableUntil() {
    const nextEvent = this.upcomingEvents[0];
    const startTime = nextEvent.start;
    const now = new Date();
    const minutesUntil = Math.floor((startTime - now) / (1000 * 60));

    if (minutesUntil < 60) {
      this.setStatus('available', `Available for ${minutesUntil} minutes`, 'rgba(255, 200, 100, 0.9)');
    } else {
      const hours = Math.floor(minutesUntil / 60);
      this.setStatus('available', `Available until ${this.formatTime(startTime)} (${hours}h ${minutesUntil % 60}m)`, 'rgba(100, 255, 150, 0.9)');
    }
  }

  /**
   * Set status: available (no upcoming events)
   */
  setAvailable() {
    this.setStatus('available', 'No events scheduled today', 'rgba(100, 255, 150, 0.9)');
  }

  /**
   * Set status display
   */
  setStatus(status, message, color = 'rgba(100, 255, 150, 0.9)') {
    // Update status text
    const statusLabels = {
      available: 'AVAILABLE',
      occupied: 'OCCUPIED',
      unknown: 'UNKNOWN'
    };

    this.statusText.text(statusLabels[status] || status.toUpperCase());

    // Update status dot color
    this.statusDot.css({
      background: color,
      boxShadow: `0 0 8px ${color}`
    });

    // Update time info
    this.timeInfo.text(message);

    // Update section border color
    this.statusSection.css({
      border: `1px solid ${color.replace('0.9', '0.3')}`
    });
  }

  /**
   * Render current event
   */
  renderCurrentEvent() {
    // Clear container
    this.currentEventContainer.element.innerHTML = '';

    if (this.currentEvents.length === 0) {
      const noEvent = new Interface('.no-event');
      noEvent.css({
        fontSize: '12px',
        opacity: 0.4,
        fontStyle: 'italic'
      });
      noEvent.text('No event currently');
      this.currentEventContainer.add(noEvent);
      return;
    }

    const event = this.currentEvents[0];
    const eventCard = this.createEventCard(event, true);
    this.currentEventContainer.add(eventCard);
  }

  /**
   * Render upcoming events
   */
  renderUpcomingEvents() {
    // Clear container
    this.upcomingEventsContainer.element.innerHTML = '';

    if (this.upcomingEvents.length === 0) {
      const noEvents = new Interface('.no-events');
      noEvents.css({
        fontSize: '12px',
        opacity: 0.4,
        fontStyle: 'italic'
      });
      noEvents.text('No upcoming events');
      this.upcomingEventsContainer.add(noEvents);
      return;
    }

    this.upcomingEvents.forEach(event => {
      const eventCard = this.createEventCard(event, false);
      this.upcomingEventsContainer.add(eventCard);
    });
  }

  /**
   * Create event card
   */
  createEventCard(event, isCurrent = false) {
    const card = new Interface('.event-card');

    card.css({
      padding: '12px',
      background: isCurrent ? 'rgba(255, 100, 100, 0.1)' : 'rgba(255, 255, 255, 0.03)',
      border: isCurrent ? '1px solid rgba(255, 100, 100, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '6px',
      fontSize: '12px',
      lineHeight: '1.6'
    });

    // Event title
    const title = new Interface('.event-title');
    title.css({
      fontWeight: '500',
      marginBottom: 6,
      fontSize: '13px'
    });
    title.text(event.summary || 'Untitled Event');

    // Time range
    const timeRange = new Interface('.event-time');
    timeRange.css({
      opacity: 0.7,
      fontSize: '11px',
      marginBottom: 4
    });
    timeRange.text(`${this.formatTime(event.start)} - ${this.formatTime(event.end)}`);

    // Additional info
    const info = new Interface('.event-info');
    info.css({
      opacity: 0.5,
      fontSize: '10px'
    });

    const infoText = [];
    if (event.organizer) {
      infoText.push(event.organizer.name);
    }
    if (event.attendees && event.attendees.length > 0) {
      infoText.push(`${event.attendees.length} attendee${event.attendees.length !== 1 ? 's' : ''}`);
    }
    info.text(infoText.join(' • '));

    card.add(title);
    card.add(timeRange);
    if (infoText.length > 0) {
      card.add(info);
    }

    return card;
  }

  /**
   * Format time for display
   */
  formatTime(date) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  /**
   * Start auto-update
   */
  startAutoUpdate(intervalMs = 30000) { // Default: 30 seconds
    this.stopAutoUpdate();

    this.updateInterval = setInterval(() => {
      this.updateAvailability();
    }, intervalMs);

    console.log(`[RoomAvailabilityPanel] Auto-update started for ${this.roomId} (${intervalMs}ms interval)`);
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
   * Show panel
   */
  show() {
    this.updateAvailability();
    this.startAutoUpdate();

    this.css({
      display: 'block',
      opacity: 0,
      transform: 'translateY(-50%) translateX(20px)'
    });

    this.clearTween().tween({
      opacity: 1,
      transform: 'translateY(-50%) translateX(0)'
    }, 400, 'easeOutCubic');
  }

  /**
   * Hide panel
   */
  hide() {
    this.stopAutoUpdate();

    this.clearTween().tween({
      opacity: 0,
      transform: 'translateY(-50%) translateX(20px)'
    }, 300, 'easeInCubic', 0, () => {
      this.css({ display: 'none' });
    });
  }

  /**
   * Toggle panel visibility
   */
  toggle() {
    if (this.element.style.display === 'none') {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Refresh data
   */
  refresh() {
    this.updateAvailability();
  }
}

/**
 * RoomAvailabilityPanelManager - Manage panels for multiple rooms
 */
export class RoomAvailabilityPanelManager {
  constructor(eventManager) {
    this.eventManager = eventManager;
    this.panels = new Map(); // roomId -> RoomAvailabilityPanel
    this.currentPanel = null;
  }

  /**
   * Create or get panel for room
   */
  getPanelForRoom(roomId, roomName) {
    if (!this.panels.has(roomId)) {
      const panel = new RoomAvailabilityPanel(roomId, roomName, this.eventManager);
      this.panels.set(roomId, panel);
    }

    return this.panels.get(roomId);
  }

  /**
   * Show panel for room
   */
  showRoomPanel(roomId, roomName) {
    // Hide current panel if different room
    if (this.currentPanel && this.currentPanel.roomId !== roomId) {
      this.currentPanel.hide();
    }

    const panel = this.getPanelForRoom(roomId, roomName);
    panel.show();
    this.currentPanel = panel;
  }

  /**
   * Hide current panel
   */
  hideCurrentPanel() {
    if (this.currentPanel) {
      this.currentPanel.hide();
      this.currentPanel = null;
    }
  }

  /**
   * Refresh all panels
   */
  refreshAll() {
    this.panels.forEach(panel => {
      if (panel.element.style.display !== 'none') {
        panel.refresh();
      }
    });
  }

  /**
   * Clear all panels
   */
  clearAll() {
    this.panels.forEach(panel => {
      panel.stopAutoUpdate();
    });
    this.panels.clear();
    this.currentPanel = null;
  }
}
