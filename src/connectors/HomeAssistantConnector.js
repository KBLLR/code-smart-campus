/**
 * HomeAssistantConnector - Real-time sensor data from Home Assistant
 * Uses WebSocket for live updates
 */

import { BaseConnector } from './BaseConnector.js';

export class HomeAssistantConnector extends BaseConnector {
  constructor(config = {}) {
    super('HomeAssistant', {
      url: config.url || import.meta.env.VITE_HA_URL || 'ws://localhost:8123',
      token: config.token || import.meta.env.VITE_HA_TOKEN,
      reconnectDelay: config.reconnectDelay || 5000,
      ...config,
    });

    this.ws = null;
    this.messageId = 1;
    this.pendingMessages = new Map(); // messageId -> { resolve, reject }
    this.subscriptions = new Map(); // subscriptionId -> callback
    this.entityMap = new Map(); // HA entity_id -> { roomId, sensorType }
    this.reconnectTimer = null;
  }

  /**
   * Start connection to Home Assistant
   */
  async start() {
    if (this.isConnected) {
      console.log('[HomeAssistant] Already connected');
      return;
    }

    console.log(`[HomeAssistant] Connecting to ${this.config.url}...`);

    try {
      await this._connect();
      await this._authenticate();
      await this._subscribeToStateChanges();

      // Auto-discover sensors from Home Assistant
      await this._discoverSensors();

      this.isConnected = true;
      this.emit('connected');
      console.log('[HomeAssistant] ✓ Connected and authenticated');
    } catch (error) {
      console.error('[HomeAssistant] Connection failed:', error);
      this.emit('error', error);
      this._scheduleReconnect();
    }
  }

  /**
   * Stop connection
   */
  async stop() {
    console.log('[HomeAssistant] Disconnecting...');

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.emit('disconnected');
  }

  /**
   * Map Home Assistant entity to room sensor
   * Example: mapEntity('sensor.room_a1_temperature', 'a1', 'temperature')
   */
  mapEntity(entityId, roomId, sensorType) {
    this.entityMap.set(entityId, { roomId, sensorType });
    console.log(`[HomeAssistant] Mapped ${entityId} → ${roomId}/${sensorType}`);
  }

  /**
   * Bulk map entities from config
   */
  mapEntities(mappings) {
    Object.entries(mappings).forEach(([entityId, mapping]) => {
      this.mapEntity(entityId, mapping.roomId, mapping.sensorType);
    });
  }

  /**
   * Call Home Assistant service (turn on/off, etc.)
   */
  async callService(domain, service, serviceData = {}) {
    if (!this.isConnected) {
      throw new Error('Not connected to Home Assistant');
    }

    return this._sendMessage({
      type: 'call_service',
      domain,
      service,
      service_data: serviceData,
    });
  }

  /**
   * Get current state of an entity
   */
  async getState(entityId) {
    if (!this.isConnected) {
      throw new Error('Not connected to Home Assistant');
    }

    const states = await this._sendMessage({
      type: 'get_states',
    });

    return states.find((s) => s.entity_id === entityId) || null;
  }

  // ========================================
  // Private Methods
  // ========================================

  /**
   * Connect WebSocket
   */
  _connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          console.log('[HomeAssistant] WebSocket opened');
        };

        this.ws.onmessage = (event) => {
          this._handleMessage(JSON.parse(event.data));
        };

        this.ws.onerror = (error) => {
          console.error('[HomeAssistant] WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[HomeAssistant] WebSocket closed');
          this.isConnected = false;
          this.emit('disconnected');
          this._scheduleReconnect();
        };

        // Wait for auth_required message
        const authHandler = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.type === 'auth_required') {
            this.ws.removeEventListener('message', authHandler);
            resolve();
          }
        };
        this.ws.addEventListener('message', authHandler);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Authenticate with Home Assistant
   */
  _authenticate() {
    return new Promise((resolve, reject) => {
      if (!this.config.token) {
        reject(new Error('No authentication token provided'));
        return;
      }

      const authHandler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'auth_ok') {
          this.ws.removeEventListener('message', authHandler);
          resolve();
        } else if (msg.type === 'auth_invalid') {
          this.ws.removeEventListener('message', authHandler);
          reject(new Error('Authentication failed'));
        }
      };

      this.ws.addEventListener('message', authHandler);

      this.ws.send(
        JSON.stringify({
          type: 'auth',
          access_token: this.config.token,
        })
      );
    });
  }

  /**
   * Subscribe to state changes
   */
  async _subscribeToStateChanges() {
    const response = await this._sendMessage({
      type: 'subscribe_events',
      event_type: 'state_changed',
    });

    console.log('[HomeAssistant] Subscribed to state changes');
    return response;
  }

  /**
   * Auto-discover all sensors from Home Assistant
   * Fetches all entities and makes them available
   */
  async _discoverSensors() {
    console.log('[HomeAssistant] Discovering sensors...');

    // Get all states from Home Assistant
    const states = await this._sendMessage({
      type: 'get_states',
    });

    let discovered = 0;

    // Store all sensor entities
    states.forEach(entity => {
      const entityId = entity.entity_id;

      // Only process actual sensor entities
      if (entityId.startsWith('sensor.') || entityId.startsWith('binary_sensor.')) {
        // Get human-friendly name or use entity_id
        const friendlyName = entity.attributes?.friendly_name || entityId;
        const state = entity.state;
        const unit = entity.attributes?.unit_of_measurement || '';

        discovered++;

        // Emit the sensor for discovery
        this.emit('sensorDiscovered', {
          entityId,
          friendlyName,
          state,
          unit,
          attributes: entity.attributes,
          domain: entityId.split('.')[0],
        });

        console.log(`[HomeAssistant] ✓ Discovered: ${friendlyName} (${entityId}) = ${state}${unit}`);
      }
    });

    console.log(`[HomeAssistant] ✓ Discovered ${discovered} sensors`);
  }

  /**
   * Send message and wait for response
   */
  _sendMessage(message) {
    return new Promise((resolve, reject) => {
      const id = this.messageId++;
      const msg = { id, ...message };

      this.pendingMessages.set(id, { resolve, reject });

      this.ws.send(JSON.stringify(msg));

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingMessages.has(id)) {
          this.pendingMessages.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  _handleMessage(msg) {
    // Handle responses to sent messages
    if (msg.id && this.pendingMessages.has(msg.id)) {
      const { resolve, reject } = this.pendingMessages.get(msg.id);
      this.pendingMessages.delete(msg.id);

      if (msg.success === false) {
        reject(new Error(msg.error?.message || 'Request failed'));
      } else {
        resolve(msg.result);
      }
      return;
    }

    // Handle events (state changes)
    if (msg.type === 'event' && msg.event) {
      this._handleEvent(msg.event);
    }
  }

  /**
   * Handle state change event
   */
  _handleEvent(event) {
    if (event.event_type !== 'state_changed') return;

    const { entity_id, new_state } = event.data;
    if (!new_state) return;

    // Only emit for sensor entities
    if (!entity_id.startsWith('sensor.') && !entity_id.startsWith('binary_sensor.')) {
      return;
    }

    // Emit raw state change - let SensorManager handle mapping
    this.emit('stateChanged', {
      entityId: entity_id,
      state: new_state.state,
      unit: new_state.attributes?.unit_of_measurement || '',
      friendlyName: new_state.attributes?.friendly_name || entity_id,
      attributes: new_state.attributes,
    });
  }

  /**
   * Parse state value based on sensor type
   */
  _parseStateValue(state, sensorType) {
    if (sensorType === 'motion') {
      return state === 'on' ? 'Detected' : 'Clear';
    }

    const numValue = parseFloat(state);
    return isNaN(numValue) ? state : numValue;
  }

  /**
   * Schedule reconnection
   */
  _scheduleReconnect() {
    if (this.reconnectTimer) return;

    console.log(`[HomeAssistant] Reconnecting in ${this.config.reconnectDelay}ms...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.start();
    }, this.config.reconnectDelay);
  }
}
