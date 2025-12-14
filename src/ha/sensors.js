
/**
 * src/ha/sensors.js
 * 
 * Helper utilities for parsing Home Assistant entities.
 */

import { getEntity } from './entityCache.js';

export function getNumericSensor(entityId) {
  const entity = getEntity(entityId);
  if (!entity) return null;

  const value = parseFloat(entity.state);
  const unit = entity.attributes.unit_of_measurement || null;
  
  if (Number.isNaN(value)) {
    // Some sensors might be 'unavailable' or 'unknown'
    return null; 
  }

  return { value, unit, raw: entity };
}

export function getBooleanSensor(entityId) {
  const entity = getEntity(entityId);
  if (!entity) return null;

  const s = entity.state;
  // Common boolean states
  const value = s === 'on' || s === 'home' || s === 'open' || s === 'detected' || s === 'active';
  
  return { value, raw: entity };
}

/**
 * Get normalized room summary using room configuration mapping.
 * @param {Object} roomConfig - Part of roomEntities.json for a specific room
 */
export function getRoomSensorSummary(roomConfig) {
  if (!roomConfig) return {};

  const summary = {};

  if (roomConfig.temperature) {
    summary.temp = getNumericSensor(roomConfig.temperature);
  }
  if (roomConfig.co2) {
    summary.co2 = getNumericSensor(roomConfig.co2);
  }
  if (roomConfig.occupancy) {
    summary.occupied = getBooleanSensor(roomConfig.occupancy);
  }
  if (roomConfig.humidity) {
    summary.humidity = getNumericSensor(roomConfig.humidity);
  }
  
  // Checking lighting (aggregating if array)
  if (roomConfig.lighting) {
    const lights = Array.isArray(roomConfig.lighting) ? roomConfig.lighting : [roomConfig.lighting];
    // Check if ANY light is on
    let anyOn = false;
    for (const lid of lights) {
      const s = getBooleanSensor(lid);
      if (s && s.value) {
        anyOn = true;
        break;
      }
    }
    summary.lightsOn = anyOn;
  }

  return summary;
}
