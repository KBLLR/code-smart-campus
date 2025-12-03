import { downloadJSON } from '../utils/downloadHelper.js';

/**
 * SensorSyncService - Syncs live Home Assistant sensor data to classrooms
 * Bridges SensorManager (live HA data) with ClassroomRegistry (classroom models)
 */
export class SensorSyncService {
  constructor(sensorManager, classroomRegistry) {
    this.sensorManager = sensorManager;
    this.classroomRegistry = classroomRegistry;
    this.unsubscribe = null;
    this.history = new Map(); // entityId -> array of historical values
    this.maxHistoryLength = 100; // Keep last 100 readings per sensor

    console.log('[SensorSyncService] Initialized');
  }

  /**
   * Start syncing sensor data (Event-driven)
   */
  start() {
    if (this.unsubscribe) {
      return;
    }

    // Initial sync of all currently discovered sensors
    this.syncAll();

    // Subscribe to real-time updates
    this.unsubscribe = this.sensorManager.onRawUpdate((data) => {
      this._handleSensorUpdate(data);
    });

    console.log('[SensorSyncService] Started real-time syncing');
  }

  /**
   * Stop syncing
   */
  stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    console.log('[SensorSyncService] Stopped');
  }

  /**
   * Sync all discovered sensors to classrooms (One-off)
   */
  syncAll() {
    const sensors = this.sensorManager.getDiscoveredSensors();
    let synced = 0;

    sensors.forEach(sensor => {
      if (this._syncSensor(sensor)) {
        synced++;
      }
    });

    if (synced > 0) {
      console.log(`[SensorSyncService] Initial sync: ${synced} sensors mapped`);
    }
  }

  /**
   * Handle single sensor update
   */
  _handleSensorUpdate(data) {
    this._syncSensor(data);
  }

  /**
   * Sync a single sensor to registry
   * Returns true if mapped
   */
  _syncSensor(sensorData) {
    const { entityId, state, unit } = sensorData;

    // Parse numeric value
    let value = parseFloat(state);
    if (isNaN(value)) {
      if (state === 'on' || state === 'true') value = 1;
      else if (state === 'off' || state === 'false') value = 0;
      else value = state;
    }

    const status = this._determineStatus(entityId, value);

    // Update classroom registry
    const classroom = this.classroomRegistry.updateSensorByEntity(entityId, value, status);

    if (classroom) {
      // Add to history
      this._addToHistory(entityId, {
        timestamp: Date.now(),
        value,
        status,
        unit
      });
      return true;
    }
    return false;
  }

  /**
   * Determine sensor status based on thresholds
   */
  _determineStatus(entityId, value) {
    // Temperature thresholds
    if (entityId.includes('temperature')) {
      if (value < 18 || value > 26) return 'warning';
      if (value >= 20 && value <= 24) return 'optimal';
      return 'ok';
    }

    // CO2 thresholds
    if (entityId.includes('co2')) {
      if (value > 1000) return 'warning';
      if (value > 800) return 'caution';
      return 'ok';
    }

    // Humidity thresholds
    if (entityId.includes('humidity')) {
      if (value < 30 || value > 60) return 'warning';
      if (value >= 40 && value <= 50) return 'optimal';
      return 'ok';
    }

    // Default
    return 'ok';
  }

  /**
   * Add reading to history
   */
  _addToHistory(entityId, reading) {
    if (!this.history.has(entityId)) {
      this.history.set(entityId, []);
    }

    const history = this.history.get(entityId);
    history.push(reading);

    // Keep only last N readings
    if (history.length > this.maxHistoryLength) {
      history.shift();
    }
  }

  /**
   * Get history for an entity
   */
  getHistory(entityId, limit = null) {
    const history = this.history.get(entityId) || [];
    if (limit) {
      return history.slice(-limit);
    }
    return [...history];
  }

  /**
   * Get all history
   */
  getAllHistory() {
    const result = {};
    for (const [entityId, history] of this.history.entries()) {
      result[entityId] = [...history];
    }
    return result;
  }

  /**
   * Export history to JSON file (Saved to server)
   */
  async exportHistory() {
    const data = this.getAllHistory();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `sensor-history-${timestamp}.json`;

    try {
      const response = await fetch('/api/save-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename, data }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`[SensorSyncService] History saved to server: ${result.filename}`);
      } else {
        console.error('[SensorSyncService] Failed to save history to server:', response.statusText);
        // Fallback to download if server fails
        downloadJSON(data, filename);
      }
    } catch (error) {
      console.error('[SensorSyncService] Error saving history:', error);
      // Fallback to download
      downloadJSON(data, filename);
    }
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.history.clear();
    console.log('[SensorSyncService] History cleared');
  }

  /**
   * Get sync statistics
   */
  getStats() {
    const sensors = this.sensorManager.getDiscoveredSensors();
    const classrooms = this.classroomRegistry.getAll();

    let totalSensors = 0;
    let mappedSensors = 0;

    classrooms.forEach(classroom => {
      const classroomSensors = classroom.sensors || [];
      totalSensors += classroomSensors.length;
      mappedSensors += classroomSensors.filter(s => s.entity_id).length;
    });

    return {
      discoveredSensors: sensors.length,
      totalClassroomSensors: totalSensors,
      mappedSensors,
      unmappedSensors: totalSensors - mappedSensors,
      historyEntities: this.history.size,
      isSyncing: !!this.unsubscribe
    };
  }

  /**
   * Dispose
   */
  dispose() {
    this.stop();
    this.history.clear();
    console.log('[SensorSyncService] Disposed');
  }
}
