
/**
 * src/ha/haBus.js
 * 
 * Internal Event Bus for Home Assistant integration.
 * Bridges raw WS events to refined app events (sensor_update, room_sensor_update).
 */

import { initEntityCache, getEntity } from './entityCache.js';
import { subscribeEvents } from './wsClient.js';
import { getRoomEntityConfig, getAllMappedRooms } from './roomMapping.js';
import { getNumericSensor, getBooleanSensor } from './sensors.js';

// Simple Event Emitter implementation (or could use 'mitt' or Node 'events' if available)
class EventEmitter {
  constructor() {
    this.listeners = {};
  }
  on(event, cb) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  }
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}

const bus = new EventEmitter();

let initialized = false;

// Reverse mapping: Entity ID -> List of Room IDs that use it
// Optimized for quick lookup on update
const entityToRoomMap = new Map();

function buildReverseMap() {
  getAllMappedRooms().forEach(roomId => {
    const cfg = getRoomEntityConfig(roomId);
    if (!cfg) return;
    
    // Add all values from cfg to map
    Object.values(cfg).forEach(val => {
      if (Array.isArray(val)) {
        val.forEach(eid => mapEntityToRoom(eid, roomId));
      } else if (typeof val === 'string') {
        mapEntityToRoom(val, roomId);
      }
    });
  });
}

function mapEntityToRoom(entityId, roomId) {
  if (!entityToRoomMap.has(entityId)) {
    entityToRoomMap.set(entityId, new Set());
  }
  entityToRoomMap.get(entityId).add(roomId);
}

/**
 * Start streaming HA data.
 * 1. Init Cache (fetches snapshot)
 * 2. Start WS subscription
 * 3. Fan out events
 */
export async function startHaStreaming() {
  if (initialized) return;
  initialized = true;

  buildReverseMap();

  await initEntityCache();

  // Listen to state_changed events via WS
  // NOTE: initEntityCache already calls connect() and subscribes to state_changed for itself.
  // We can add another listener or rely on shared bus. wsClient supports multiple listeners.
  subscribeEvents('state_changed', handleStateChanged);
  console.log('[HA Bus] Streaming started.');
}

function handleStateChanged(event) {
  const { entity_id, new_state, old_state } = event.data;

  // 1. Emit generic sensor update
  bus.emit('sensor_update', {
    entityId: entity_id,
    domain: entity_id.split('.')[0],
    oldState: old_state,
    newState: new_state
  });

  // 2. Derive room updates
  if (entityToRoomMap.has(entity_id)) {
    const roomIds = entityToRoomMap.get(entity_id);
    roomIds.forEach(roomId => {
      emitRoomUpdate(roomId, entity_id, new_state);
    });
  }
}

function emitRoomUpdate(roomId, entityId, newState) {
  // Determine "kind" based on room config
  const cfg = getRoomEntityConfig(roomId);
  let kind = 'generic';
  
  if (cfg.temperature === entityId) kind = 'temperature';
  else if (cfg.co2 === entityId) kind = 'co2';
  else if (cfg.occupancy === entityId) kind = 'occupancy';
  else if (cfg.humidity === entityId) kind = 'humidity';
  else if (Array.isArray(cfg.lighting) && cfg.lighting.includes(entityId)) kind = 'lighting';
  else if (cfg.lighting === entityId) kind = 'lighting';

  // Parse value
  // We re-use sensor helpers but we might need just the value from newState directly
  // or construct a mock entity object if helpers require it. 
  // Helpers expect "raw" entity object. newState IS the raw entity object.
  let value = null;
  let unit = null;

  if (kind === 'temperature' || kind === 'co2' || kind === 'humidity') {
    const parsed = getNumericSensor(entityId); // cached state is updated synchronously? 
    // Wait. entityCache listener runs in parallel. 
    // It's safer to use `newState` passed in.
    if (newState) {
       value = parseFloat(newState.state);
       unit = newState.attributes.unit_of_measurement;
    }
  } else if (kind === 'occupancy' || kind === 'lighting') {
    if (newState) {
       value = (newState.state === 'on' || newState.state === 'home' || newState.state === 'open');
    }
  }

  bus.emit('room_sensor_update', {
    roomId,
    entityId,
    kind,
    value,
    unit
  });
}

export function onSensorUpdate(handler) {
  bus.on('sensor_update', handler);
}

export function onRoomSensorUpdate(handler) {
  bus.on('room_sensor_update', handler);
}
