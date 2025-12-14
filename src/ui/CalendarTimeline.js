/**
 * CalendarTimeline - Interactive timeline scrubber using space.js Interface
 * Navigate through past, present, and future calendar events
 *
 * Features:
 * - Timeline visualization with current time marker
 * - Drag-to-scrub time navigation
 * - Zoom controls (hour/day/week/month view)
 * - Event indicators on timeline
 * - Quick jump to now/today
 *
 * Usage:
 *   const timeline = new CalendarTimeline(eventManager);
 *   timeline.onTimeChange(date => {
 *     // Handle time change
 *   });
 */

import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';

export class CalendarTimeline extends Interface {
  constructor(eventManager) {
    super('.calendar-timeline');

    this.eventManager = eventManager;
    this.currentDate = new Date();
    this.viewMode = 'day'; // 'hour', 'day', 'week', 'month'
    this.isDragging = false;
    this.timeChangeCallbacks = [];

    // Timeline bounds
    this.startDate = null;
    this.endDate = null;

    this.init();
    this.setupEventListeners();
  }

  init() {
    // Main container - fixed position at bottom
    this.css({
      position: 'fixed',
      bottom: 40,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: 1200,
      height: 120,
      background: 'rgba(6, 6, 6, 0.90)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '20px',
      zIndex: 150,  // REDUCED: Dont block Space.js
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
      fontFamily: 'var(--ui-font-family)',
      color: 'var(--ui-color)'
    });

    this.initControls();
    this.initTimelineBar();
    this.initTimeLabels();
    this.updateTimeline();
  }

  /**
   * Initialize control buttons
   */
  initControls() {
    this.controlsContainer = new Interface('.timeline-controls');

    this.controlsContainer.css({
      display: 'flex',
      gap: 12,
      marginBottom: 16,
      justifyContent: 'space-between',
      alignItems: 'center'
    });

    // Left controls: View mode buttons
    const viewModeContainer = new Interface('.view-mode-container');
    viewModeContainer.css({
      display: 'flex',
      gap: 8
    });

    const viewModes = [
      { label: 'HOUR', value: 'hour' },
      { label: 'DAY', value: 'day' },
      { label: 'WEEK', value: 'week' },
      { label: 'MONTH', value: 'month' }
    ];

    this.viewModeButtons = {};

    viewModes.forEach(mode => {
      const button = this.createButton(mode.label, mode.value === this.viewMode);
      button.element.addEventListener('click', () => {
        this.setViewMode(mode.value);
      });
      viewModeContainer.add(button);
      this.viewModeButtons[mode.value] = button;
    });

    // Right controls: Navigation buttons
    const navContainer = new Interface('.nav-container');
    navContainer.css({
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    });

    // Previous period
    this.prevButton = this.createButton('◀', false);
    this.prevButton.element.addEventListener('click', () => {
      this.navigatePrevious();
    });
    navContainer.add(this.prevButton);

    // Jump to now
    this.nowButton = this.createButton('NOW', false);
    this.nowButton.element.addEventListener('click', () => {
      this.jumpToNow();
    });
    navContainer.add(this.nowButton);

    // Next period
    this.nextButton = this.createButton('▶', false);
    this.nextButton.element.addEventListener('click', () => {
      this.navigateNext();
    });
    navContainer.add(this.nextButton);

    this.controlsContainer.add(viewModeContainer);
    this.controlsContainer.add(navContainer);
    this.add(this.controlsContainer);
  }

  /**
   * Create button with space.js styling
   */
  createButton(label, active = false) {
    const button = new Interface('.timeline-button');

    button.css({
      padding: '6px 12px',
      background: active ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '4px',
      fontSize: '10px',
      letterSpacing: '1px',
      cursor: 'pointer',
      color: 'var(--ui-color)',
      opacity: active ? 1 : 0.6,
      transition: 'all 0.2s ease',
      textTransform: 'uppercase',
      fontFamily: 'var(--ui-font-family)'
    });

    button.text(label);

    // Hover effect
    button.element.addEventListener('mouseenter', () => {
      button.css({ opacity: 1, background: 'rgba(255, 255, 255, 0.1)' });
    });

    button.element.addEventListener('mouseleave', () => {
      if (!active) {
        button.css({ opacity: 0.6, background: 'rgba(255, 255, 255, 0.03)' });
      }
    });

    return button;
  }

  /**
   * Initialize timeline bar (interactive scrubber)
   */
  initTimelineBar() {
    this.timelineBar = new Interface('.timeline-bar');

    this.timelineBar.css({
      position: 'relative',
      width: '100%',
      height: 30,
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '4px',
      cursor: 'pointer',
      overflow: 'hidden',
      marginBottom: 8
    });

    // Current time indicator (vertical line)
    this.currentTimeIndicator = new Interface('.current-time-indicator');
    this.currentTimeIndicator.css({
      position: 'absolute',
      top: 0,
      left: '50%',
      width: 2,
      height: '100%',
      background: 'rgba(255, 100, 100, 0.8)',
      boxShadow: '0 0 8px rgba(255, 100, 100, 0.6)',
      zIndex: 10,
      pointerEvents: 'none'
    });

    // Scrubber handle
    this.scrubberHandle = new Interface('.scrubber-handle');
    this.scrubberHandle.css({
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 12,
      height: 12,
      background: 'rgba(255, 255, 255, 0.9)',
      border: '2px solid rgba(6, 6, 6, 0.9)',
      borderRadius: '50%',
      cursor: 'grab',
      zIndex: 20,
      transition: 'transform 0.2s ease'
    });

    // Event markers container
    this.eventMarkersContainer = new Interface('.event-markers');
    this.eventMarkersContainer.css({
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none'
    });

    this.timelineBar.add(this.eventMarkersContainer);
    this.timelineBar.add(this.currentTimeIndicator);
    this.timelineBar.add(this.scrubberHandle);
    this.add(this.timelineBar);
  }

  /**
   * Initialize time labels (start, current, end)
   */
  initTimeLabels() {
    this.timeLabelsContainer = new Interface('.time-labels');

    this.timeLabelsContainer.css({
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '10px',
      opacity: 0.6,
      letterSpacing: '0.5px'
    });

    this.startLabel = new Interface('.start-label');
    this.centerLabel = new Interface('.center-label');
    this.endLabel = new Interface('.end-label');

    this.centerLabel.css({ textAlign: 'center' });
    this.endLabel.css({ textAlign: 'right' });

    this.timeLabelsContainer.add(this.startLabel);
    this.timeLabelsContainer.add(this.centerLabel);
    this.timeLabelsContainer.add(this.endLabel);
    this.add(this.timeLabelsContainer);
  }

  /**
   * Setup event listeners for dragging and interaction
   */
  setupEventListeners() {
    const barElement = this.timelineBar.element;
    const handleElement = this.scrubberHandle.element;

    // Mouse down on handle
    handleElement.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.isDragging = true;
      handleElement.style.cursor = 'grabbing';
      handleElement.style.transform = 'translate(-50%, -50%) scale(1.2)';
    });

    // Mouse move on document (for dragging)
    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;

      const rect = barElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));

      this.updateScrubberPosition(percentage);
      this.updateCurrentDateFromPosition(percentage);
    });

    // Mouse up
    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        handleElement.style.cursor = 'grab';
        handleElement.style.transform = 'translate(-50%, -50%) scale(1)';
      }
    });

    // Click on timeline bar (jump to position)
    barElement.addEventListener('click', (e) => {
      if (e.target === handleElement) return;

      const rect = barElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;

      this.updateScrubberPosition(percentage);
      this.updateCurrentDateFromPosition(percentage);
    });
  }

  /**
   * Set view mode (hour/day/week/month)
   */
  setViewMode(mode) {
    this.viewMode = mode;

    // Update button states
    Object.entries(this.viewModeButtons).forEach(([modeKey, button]) => {
      const isActive = modeKey === mode;
      button.css({
        background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
        opacity: isActive ? 1 : 0.6
      });
    });

    this.updateTimeline();
  }

  /**
   * Calculate time range based on view mode
   */
  calculateTimeRange() {
    const now = this.currentDate;
    let start, end;

    switch (this.viewMode) {
      case 'hour':
        start = new Date(now);
        start.setMinutes(0, 0, 0);
        end = new Date(start);
        end.setHours(start.getHours() + 1);
        break;

      case 'day':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 1);
        break;

      case 'week':
        start = new Date(now);
        start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 7);
        break;

      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
    }

    this.startDate = start;
    this.endDate = end;
  }

  /**
   * Update timeline visualization
   */
  updateTimeline() {
    this.calculateTimeRange();
    this.updateTimeLabels();
    this.updateEventMarkers();
    this.updateCurrentTimeIndicatorPosition();
  }

  /**
   * Update time labels
   */
  updateTimeLabels() {
    const formatDate = (date) => {
      switch (this.viewMode) {
        case 'hour':
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        case 'day':
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        case 'week':
        case 'month':
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    };

    this.startLabel.text(formatDate(this.startDate));
    this.centerLabel.text(formatDate(this.currentDate));
    this.endLabel.text(formatDate(this.endDate));
  }

  /**
   * Update event markers on timeline
   */
  updateEventMarkers() {
    // Clear existing markers
    this.eventMarkersContainer.element.innerHTML = '';

    if (!this.eventManager) return;

    // Get all events in current time range
    const events = this.eventManager.markers
      .map(marker => marker.event)
      .filter(event => {
        return event.start >= this.startDate && event.start <= this.endDate;
      });

    // Create marker for each event
    events.forEach(event => {
      const position = this.getTimelinePosition(event.start);
      const marker = this.createEventMarker(event, position);
      this.eventMarkersContainer.add(marker);
    });
  }

  /**
   * Create event marker on timeline
   */
  createEventMarker(event, position) {
    const marker = new Interface('.event-marker');

    // Determine color based on event type
    const typeColors = {
      class: 'rgba(100, 150, 255, 0.9)',
      workshop: 'rgba(150, 100, 255, 0.9)',
      meeting: 'rgba(255, 150, 100, 0.9)',
      event: 'rgba(100, 255, 150, 0.9)'
    };

    const eventType = this.classifyEventType(event);
    const color = typeColors[eventType] || typeColors.event;

    marker.css({
      position: 'absolute',
      left: `${position * 100}%`,
      top: '50%',
      transform: 'translate(-50%, -50%)',
      width: 6,
      height: 6,
      background: color,
      borderRadius: '50%',
      boxShadow: `0 0 4px ${color}`,
      pointerEvents: 'auto',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    });

    // Tooltip on hover
    marker.element.addEventListener('mouseenter', () => {
      marker.css({
        width: 10,
        height: 10,
        boxShadow: `0 0 8px ${color}`
      });
      // Could show tooltip here
    });

    marker.element.addEventListener('mouseleave', () => {
      marker.css({
        width: 6,
        height: 6,
        boxShadow: `0 0 4px ${color}`
      });
    });

    return marker;
  }

  /**
   * Classify event type (same logic as CalendarEventMarker)
   */
  classifyEventType(event) {
    const summary = (event.summary || '').toLowerCase();
    const categories = (event.categories || []).map(c => c.toLowerCase());

    if (categories.includes('class') || summary.includes('class') || summary.includes('lecture')) {
      return 'class';
    }
    if (categories.includes('workshop') || summary.includes('workshop')) {
      return 'workshop';
    }
    if (categories.includes('meeting') || summary.includes('meeting')) {
      return 'meeting';
    }
    return 'event';
  }

  /**
   * Get timeline position (0-1) for a given date
   */
  getTimelinePosition(date) {
    const timeRange = this.endDate - this.startDate;
    const timeOffset = date - this.startDate;
    return Math.max(0, Math.min(1, timeOffset / timeRange));
  }

  /**
   * Update current time indicator position
   */
  updateCurrentTimeIndicatorPosition() {
    const now = new Date();
    const position = this.getTimelinePosition(now);

    this.currentTimeIndicator.css({
      left: `${position * 100}%`
    });

    // Hide if outside visible range
    if (position < 0 || position > 1) {
      this.currentTimeIndicator.css({ opacity: 0 });
    } else {
      this.currentTimeIndicator.css({ opacity: 0.8 });
    }
  }

  /**
   * Update scrubber handle position
   */
  updateScrubberPosition(percentage) {
    this.scrubberHandle.css({
      left: `${percentage * 100}%`
    });
  }

  /**
   * Update current date based on scrubber position
   */
  updateCurrentDateFromPosition(percentage) {
    const timeRange = this.endDate - this.startDate;
    const newTime = this.startDate.getTime() + (timeRange * percentage);
    this.currentDate = new Date(newTime);

    this.updateTimeLabels();
    this.notifyTimeChange();
  }

  /**
   * Navigate to previous period
   */
  navigatePrevious() {
    const offset = this.getNavigationOffset();
    this.currentDate = new Date(this.currentDate.getTime() - offset);
    this.updateTimeline();
    this.notifyTimeChange();
  }

  /**
   * Navigate to next period
   */
  navigateNext() {
    const offset = this.getNavigationOffset();
    this.currentDate = new Date(this.currentDate.getTime() + offset);
    this.updateTimeline();
    this.notifyTimeChange();
  }

  /**
   * Jump to current time
   */
  jumpToNow() {
    this.currentDate = new Date();
    this.updateTimeline();
    this.updateScrubberPosition(0.5); // Center scrubber
    this.notifyTimeChange();
  }

  /**
   * Get navigation offset based on view mode
   */
  getNavigationOffset() {
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;

    switch (this.viewMode) {
      case 'hour': return hour;
      case 'day': return day;
      case 'week': return 7 * day;
      case 'month': return 30 * day;
      default: return day;
    }
  }

  /**
   * Register time change callback
   */
  onTimeChange(callback) {
    this.timeChangeCallbacks.push(callback);
  }

  /**
   * Notify all time change callbacks
   */
  notifyTimeChange() {
    this.timeChangeCallbacks.forEach(callback => {
      callback(this.currentDate);
    });
  }

  /**
   * Start auto-update (refresh current time indicator)
   */
  startAutoUpdate(intervalMs = 60000) { // Default: 1 minute
    this.stopAutoUpdate();

    this.updateInterval = setInterval(() => {
      this.updateCurrentTimeIndicatorPosition();
      this.updateEventMarkers();
    }, intervalMs);

    console.log(`[CalendarTimeline] Auto-update started (${intervalMs}ms interval)`);
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
   * Show timeline
   */
  show() {
    this.css({
      display: 'block',
      opacity: 0,
      transform: 'translateX(-50%) translateY(20px)'
    });

    this.clearTween().tween({
      opacity: 1,
      transform: 'translateX(-50%) translateY(0)'
    }, 400, 'easeOutCubic');
  }

  /**
   * Hide timeline
   */
  hide() {
    this.clearTween().tween({
      opacity: 0,
      transform: 'translateX(-50%) translateY(20px)'
    }, 300, 'easeInCubic', 0, () => {
      this.css({ display: 'none' });
    });
  }

  /**
   * Toggle timeline visibility
   */
  toggle() {
    if (this.element.style.display === 'none') {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Get current selected date
   */
  getCurrentDate() {
    return this.currentDate;
  }

  /**
   * Set current date programmatically
   */
  setCurrentDate(date) {
    this.currentDate = new Date(date);
    this.updateTimeline();
    this.notifyTimeChange();
  }
}
