
/**
 * src/ha/roomMapping.js
 * 
 * Maps Smart Campus rooms (referenced by ID) to their HA entities.
 */

import roomEntities from './roomEntities.json';
import { getRoomSensorSummary } from './sensors.js';

export function getRoomEntityConfig(roomId) {
  return roomEntities[roomId] || null;
}

export function getAllMappedRooms() {
  return Object.keys(roomEntities);
}

export function getRoomStatus(roomId) {
  const cfg = getRoomEntityConfig(roomId);
  if (!cfg) return null;
  
  return getRoomSensorSummary(cfg);
}
