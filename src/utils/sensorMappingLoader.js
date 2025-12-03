/**
 * Sensor Mapping Loader
 * Loads sensors-mapping.json and applies mappings to SensorManager
 * Enables telemetry for all configured rooms
 */

import sensorMappingData from '@/data/sensors/sensors-mapping.json';

/**
 * Load and apply sensor mappings to SensorManager
 * @param {SensorManager} sensorManager - The sensor manager instance
 * @returns {Promise<Object>} Statistics about loaded mappings
 */
export async function loadSensorMappings(sensorManager) {
  console.log('[SensorMappingLoader] Loading sensor mappings...');

  const stats = {
    totalRooms: 0,
    totalSensors: 0,
    mappedSensors: 0,
    roomsWithTelemetry: [],
    sensorTypes: new Set(),
    errors: []
  };

  try {
    const { rooms } = sensorMappingData;

    if (!rooms || !Array.isArray(rooms)) {
      throw new Error('Invalid sensor mapping data: missing rooms array');
    }

    stats.totalRooms = rooms.length;

    // Apply mappings for each room
    for (const room of rooms) {
      const { id: roomId, name: roomName, sensors } = room;

      if (!sensors || !Array.isArray(sensors)) {
        console.warn(`[SensorMappingLoader] Room ${roomId} has no sensors array`);
        continue;
      }

      let roomMappedCount = 0;

      for (const sensor of sensors) {
        const { entityId, type: sensorType } = sensor;

        if (!entityId || !sensorType) {
          stats.errors.push(`Missing entityId or type for sensor in room ${roomId}`);
          continue;
        }

        stats.totalSensors++;
        stats.sensorTypes.add(sensorType);

        try {
          // Map entity to room in sensor manager
          sensorManager.mapEntityToRoom(entityId, roomId, sensorType);
          stats.mappedSensors++;
          roomMappedCount++;
        } catch (error) {
          stats.errors.push(`Failed to map ${entityId} to ${roomId}: ${error.message}`);
        }
      }

      if (roomMappedCount > 0) {
        stats.roomsWithTelemetry.push({
          id: roomId,
          name: roomName,
          sensorCount: roomMappedCount
        });
      }
    }

    // Log results
    console.log(`[SensorMappingLoader] ✓ Loaded ${stats.mappedSensors}/${stats.totalSensors} sensor mappings`);
    console.log(`[SensorMappingLoader] ✓ Telemetry enabled for ${stats.roomsWithTelemetry.length}/${stats.totalRooms} rooms`);

    if (stats.errors.length > 0) {
      console.warn(`[SensorMappingLoader] ${stats.errors.length} errors encountered:`, stats.errors);
    }

    // Log rooms with telemetry
    console.table(stats.roomsWithTelemetry);

    // Log sensor types
    console.log('[SensorMappingLoader] Sensor types:', Array.from(stats.sensorTypes).sort());

  } catch (error) {
    console.error('[SensorMappingLoader] Failed to load sensor mappings:', error);
    stats.errors.push(error.message);
  }

  return stats;
}

/**
 * Get room IDs from sensor mapping data
 * @returns {Array<string>} List of room IDs with telemetry configured
 */
export function getRoomsWithTelemetry() {
  try {
    const { rooms } = sensorMappingData;
    return rooms
      .filter(room => room.sensors && room.sensors.length > 0)
      .map(room => ({
        id: room.id,
        name: room.name,
        category: room.category,
        sensorCount: room.sensors.length
      }));
  } catch (error) {
    console.error('[SensorMappingLoader] Failed to get rooms with telemetry:', error);
    return [];
  }
}

/**
 * Get sensor entities for a specific room
 * @param {string} roomId - The room ID
 * @returns {Array<Object>} List of sensor entities for the room
 */
export function getSensorsForRoom(roomId) {
  try {
    const { rooms } = sensorMappingData;
    const room = rooms.find(r => r.id === roomId);

    if (!room || !room.sensors) {
      return [];
    }

    return room.sensors.map(sensor => ({
      entityId: sensor.entityId,
      friendlyName: sensor.friendlyName,
      type: sensor.type,
      unit: sensor.unit
    }));
  } catch (error) {
    console.error(`[SensorMappingLoader] Failed to get sensors for room ${roomId}:`, error);
    return [];
  }
}

/**
 * Get sensor mapping statistics
 * @returns {Object} Statistics about sensor mappings
 */
export function getSensorMappingStats() {
  try {
    const { rooms } = sensorMappingData;

    const stats = {
      totalRooms: rooms.length,
      totalSensors: 0,
      sensorsByType: {},
      sensorsByRoom: {},
      roomsByCategory: {}
    };

    rooms.forEach(room => {
      const sensorCount = room.sensors?.length || 0;
      stats.totalSensors += sensorCount;

      // Count by room
      stats.sensorsByRoom[room.id] = sensorCount;

      // Count by category
      if (!stats.roomsByCategory[room.category]) {
        stats.roomsByCategory[room.category] = 0;
      }
      stats.roomsByCategory[room.category]++;

      // Count by sensor type
      room.sensors?.forEach(sensor => {
        if (!stats.sensorsByType[sensor.type]) {
          stats.sensorsByType[sensor.type] = 0;
        }
        stats.sensorsByType[sensor.type]++;
      });
    });

    return stats;
  } catch (error) {
    console.error('[SensorMappingLoader] Failed to get sensor mapping stats:', error);
    return null;
  }
}

/**
 * Validate sensor mappings against discovered sensors
 * @param {SensorManager} sensorManager - The sensor manager instance
 * @returns {Object} Validation results
 */
export function validateSensorMappings(sensorManager) {
  const results = {
    valid: [],
    missing: [],
    extra: []
  };

  try {
    const { rooms } = sensorMappingData;
    const discoveredSensors = new Set(
      sensorManager.getDiscoveredSensors().map(s => s.entityId)
    );

    // Check if mapped sensors exist in discovered sensors
    rooms.forEach(room => {
      room.sensors?.forEach(sensor => {
        if (discoveredSensors.has(sensor.entityId)) {
          results.valid.push({
            roomId: room.id,
            entityId: sensor.entityId,
            type: sensor.type
          });
        } else {
          results.missing.push({
            roomId: room.id,
            entityId: sensor.entityId,
            type: sensor.type,
            reason: 'Not found in Home Assistant'
          });
        }
      });
    });

    // Check for discovered sensors not in mapping
    discoveredSensors.forEach(entityId => {
      const isMapped = rooms.some(room =>
        room.sensors?.some(s => s.entityId === entityId)
      );

      if (!isMapped) {
        results.extra.push({
          entityId,
          reason: 'Discovered but not mapped to any room'
        });
      }
    });

    console.log('[SensorMappingLoader] Validation results:');
    console.log(`  ✓ Valid: ${results.valid.length}`);
    console.log(`  ⚠ Missing: ${results.missing.length}`);
    console.log(`  ℹ Extra: ${results.extra.length}`);

  } catch (error) {
    console.error('[SensorMappingLoader] Failed to validate sensor mappings:', error);
  }

  return results;
}

/**
 * Export sensor mappings to JSON for debugging
 * @returns {string} JSON string of sensor mappings
 */
export function exportSensorMappings() {
  return JSON.stringify(sensorMappingData, null, 2);
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  window.sensorMappingUtils = {
    getRoomsWithTelemetry,
    getSensorsForRoom,
    getSensorMappingStats,
    validateSensorMappings,
    exportSensorMappings
  };

  console.log('[SensorMappingLoader] Utilities available:');
  console.log('  window.sensorMappingUtils.getRoomsWithTelemetry()');
  console.log('  window.sensorMappingUtils.getSensorsForRoom(roomId)');
  console.log('  window.sensorMappingUtils.getSensorMappingStats()');
  console.log('  window.sensorMappingUtils.validateSensorMappings(sensorManager)');
  console.log('  window.sensorMappingUtils.exportSensorMappings()');
}
