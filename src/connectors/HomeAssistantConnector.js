/**
 * HomeAssistantConnector - Real-time sensor data from Home Assistant
 * Uses the core src/ha module.
 */

import { BaseConnector } from './BaseConnector.js';
import { startHaStreaming, onSensorUpdate } from '../ha/haBus.js';
import { callService } from '../ha/restClient.js';
import { getEntity, getAllEntities } from '../ha/entityCache.js';
import { haConfig } from '../ha/config.js';

export class HomeAssistantConnector extends BaseConnector {
  constructor(config = {}) {
    super('HomeAssistant', {
      url: haConfig.wsUrl,
      token: haConfig.token,
      ...config,
    });

    this.isConnected = false;
  }

  /**
   * Start connection to Home Assistant via generic layer
   */
  async start() {
    console.log('[HomeAssistant] Connecting via src/ha module...');
    try {
      // Start the core streaming (WS connect + Cache init)
      await startHaStreaming();
      
      this.isConnected = true;
      this.emit('connected');

      // Hook into the bus events
      onSensorUpdate((event) => {
         // Transform to what SensorManager expects
         const { entityId, newState } = event;
         if (!newState) return;
         
         const attributes = newState.attributes || {};
         
         this.emit('stateChanged', {
           entityId,
           state: newState.state,
           unit: attributes.unit_of_measurement || '',
           friendlyName: attributes.friendly_name || entityId,
           attributes: attributes
         });
      });

      // Discovery: initial cache scan
      this._discoverSensors();
      
    } catch (e) {
      console.error('[HomeAssistant] Connection failed:', e);
      this.emit('error', e);
    }
  }

  async stop() {
    // Core layer doesn't support 'stop' yet, but we can stop emitting events
    console.log('[HomeAssistant] Stop called (noop for core layer)');
    this.isConnected = false;
    this.emit('disconnected');
  }

  /**
   * Auto-discover sensors from Cache
   */
  _discoverSensors() {
    const all = getAllEntities();
    console.log(`[HomeAssistant] Discovering sensors from cache (${all.length} entities)...`);
    
    let count = 0;
    all.forEach(entity => {
      if (entity.entity_id.startsWith('sensor.') || entity.entity_id.startsWith('binary_sensor.')) {
         this.emit('sensorDiscovered', {
            entityId: entity.entity_id,
            friendlyName: entity.attributes?.friendly_name || entity.entity_id,
            state: entity.state,
            unit: entity.attributes?.unit_of_measurement || '',
            attributes: entity.attributes,
            domain: entity.entity_id.split('.')[0]
         });
         count++;
      }
    });
    console.log(`[HomeAssistant] Discovered ${count} sensors.`);
  }

  /**
   * Call Home Assistant service
   */
  async callService(domain, service, serviceData = {}) {
    return await callService(domain, service, serviceData);
  }

  /**
   * Get current state of an entity
   */
  async getState(entityId) {
    return getEntity(entityId);
  }
}

