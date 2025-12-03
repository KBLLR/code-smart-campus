/**
 * PanelDocker - Draggable panel system for sensors and data
 * TODO: Full implementation with dragging, multiple panels, sensor integration
 */

export class PanelDocker {
  constructor(options = {}) {
    this.options = options;
    this.container = null;
    this._init();
  }

  _init() {
    // Create panel docker container (hidden by default)
    this.container = document.createElement('div');
    this.container.className = 'panel-shell';
    this.container.id = 'panel-shell';

    // For now, just create an empty docker
    // Will be populated with sensor panels later
    console.log('[PanelDocker] Initialized (stub)');
  }

  dispose() {
    this.container?.remove();
  }
}
