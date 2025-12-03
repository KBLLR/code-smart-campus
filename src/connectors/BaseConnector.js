/**
 * BaseConnector - Base class for all data connectors
 * Provides event emitter pattern and common functionality
 */

export class BaseConnector {
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
    this.listeners = new Map(); // event -> Set(callbacks)
    this.isConnected = false;
  }

  /**
   * Start the connector (override in subclass)
   */
  async start() {
    throw new Error('start() must be implemented by subclass');
  }

  /**
   * Stop the connector (override in subclass)
   */
  async stop() {
    this.isConnected = false;
  }

  /**
   * Subscribe to events
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from events
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;

    callbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[${this.name}] Event '${event}' callback error:`, error);
      }
    });
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      name: this.name,
      connected: this.isConnected,
      config: this.config,
    };
  }

  /**
   * Cleanup
   */
  dispose() {
    this.stop();
    this.listeners.clear();
  }
}
