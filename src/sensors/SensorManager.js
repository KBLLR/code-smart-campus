import classroomsWithSensors from '../data/classrooms/classrooms-with-sensors.js';
import { SensorConfig } from '../config/SensorConfig.js';

/**
 * SensorManager - Central hub for all sensor data
 * Manages sensor readings from multiple sources (HA, APIs, mock)
 */

export class SensorManager {
  constructor() {
    // Sensor data: roomId -> sensorType -> { value, unit, status, timestamp, source }
    this.sensorData = new Map();

    // Registered connectors
    this.connectors = new Map();

    // Update listeners: callback functions to notify when data changes
    this.listeners = new Set();
    this.rawListeners = new Set();

    // Sensor metadata
    this.sensorMeta = this._initSensorMeta();

    // Discovered sensors (not yet mapped to rooms): entityId -> { friendlyName, state, unit, attributes }
    this.discoveredSensors = new Map();

    // Entity mappings: entityId -> { roomId, sensorType }
    this.entityMappings = new Map();
  }

  /**
   * Initialize sensor metadata (labels, units, thresholds)
   */
  _initSensorMeta() {
    return {
      temperature: {
        label: 'Temperature',
        unit: '°C',
        icon: 'temperature',
        thresholds: { warning: 26, alert: 28, min: 16 },
      },
      occupancy: {
        label: 'Occupancy',
        unit: 'people',
        icon: 'occupancy',
        thresholds: { warning: 0.7, alert: 0.9 }, // % of capacity
      },
      humidity: {
        label: 'Humidity',
        unit: '%',
        icon: 'humidity',
        thresholds: { warning: 60, alert: 70, min: 30 },
      },
      light: {
        label: 'Light Level',
        unit: 'lux',
        icon: 'light',
        thresholds: { min: 300, warning: 200 },
      },
      co2: {
        label: 'CO₂ Level',
        unit: 'ppm',
        icon: 'co2',
        thresholds: { warning: 1000, alert: 1500 },
      },
      energy: {
        label: 'Energy Usage',
        unit: 'kW',
        icon: 'energy',
        thresholds: { warning: 3, alert: 5 },
      },
      motion: {
        label: 'Motion',
        unit: '',
        icon: 'motion',
        values: ['Clear', 'Detected'],
      },
    };
  }

  /**
   * Register a connector (HA, Calendar, etc.)
   */
  registerConnector(name, connector) {
    this.connectors.set(name, connector);
    console.log(`[SensorManager] Registered connector: ${name}`);

    // Listen to sensor discovery
    connector.on('sensorDiscovered', (sensor) => {
      this.discoveredSensors.set(sensor.entityId, sensor);
      console.log(`[SensorManager] Discovered sensor: ${sensor.friendlyName}`);
    });

    // Listen to state changes
    connector.on('stateChanged', (data) => {
      // Update discovered sensors list
      const existing = this.discoveredSensors.get(data.entityId);
      if (existing) {
        existing.state = data.state;
        existing.unit = data.unit;
      }

      // Check if this entity is mapped to a room
      const mapping = this.entityMappings.get(data.entityId);
      if (mapping) {
        const value = this._parseValue(data.state, mapping.sensorType);
        this.updateSensor(
          mapping.roomId,
          mapping.sensorType,
          value,
          name
        );
      }

      // Notify raw listeners (for SensorSyncService)
      this._notifyRawListeners(data);
    });
  }

  /**
   * Get specific connector by name
   */
  getConnector(name) {
    return this.connectors.get(name);
  }

  /**
   * Map an entity to a room and sensor type
   */
  mapEntityToRoom(entityId, roomId, sensorType) {
    this.entityMappings.set(entityId, { roomId, sensorType });

    // If we have data for this entity, update the sensor immediately
    const sensor = this.discoveredSensors.get(entityId);
    if (sensor) {
      const value = this._parseValue(sensor.state, sensorType);
      this.updateSensor(roomId, sensorType, value, 'HomeAssistant');
    }

    console.log(`[SensorManager] Mapped ${entityId} → ${roomId}/${sensorType}`);
  }

  /**
   * Get specific sensor by ID
   */
  getSensor(entityId) {
    return this.discoveredSensors.get(entityId);
  }

  /**
   * Get all discovered sensors (for UI display)
   */
  getDiscoveredSensors() {
    return Array.from(this.discoveredSensors.values());
  }

  /**
   * Export discovered sensors to JSON
   */
  exportSensorsToJSON() {
    const sensors = this.getDiscoveredSensors();
    return JSON.stringify(sensors, null, 2);
  }

  /**
   * Analyze sensors and suggest grouping patterns
   */
  analyzeSensorGroupings() {
    const sensors = this.getDiscoveredSensors();
    const analysis = {
      totalSensors: sensors.length,
      byDomain: {},
      byUnit: {},
      byDeviceClass: {},
      byArea: {},
      byNamePattern: {},
      suggestedRoomMappings: [],
      ungroupedSensors: [],
    };

    // Group by domain
    sensors.forEach(sensor => {
      const domain = sensor.domain || 'unknown';
      if (!analysis.byDomain[domain]) {
        analysis.byDomain[domain] = [];
      }
      analysis.byDomain[domain].push(sensor.entityId);
    });

    // Group by unit of measurement
    sensors.forEach(sensor => {
      const unit = sensor.unit || 'no_unit';
      if (!analysis.byUnit[unit]) {
        analysis.byUnit[unit] = [];
      }
      analysis.byUnit[unit].push(sensor.entityId);
    });

    // Group by device class (if available)
    sensors.forEach(sensor => {
      const deviceClass = sensor.attributes?.device_class || 'unknown';
      if (!analysis.byDeviceClass[deviceClass]) {
        analysis.byDeviceClass[deviceClass] = [];
      }
      analysis.byDeviceClass[deviceClass].push(sensor.entityId);
    });

    // Group by area (if available from attributes)
    sensors.forEach(sensor => {
      const area = sensor.attributes?.area_id ||
        sensor.attributes?.area_name ||
        this._extractAreaFromName(sensor.friendlyName) ||
        'unassigned';
      if (!analysis.byArea[area]) {
        analysis.byArea[area] = [];
      }
      analysis.byArea[area].push({
        entityId: sensor.entityId,
        friendlyName: sensor.friendlyName,
        type: this._detectSensorType(sensor),
      });
    });

    // Suggest room mappings based on patterns
    Object.entries(analysis.byArea).forEach(([area, areaSensors]) => {
      if (area !== 'unassigned') {
        const mappings = areaSensors.map(sensor => ({
          entityId: sensor.entityId,
          suggestedRoom: this._suggestRoomId(area),
          suggestedSensorType: sensor.type,
          confidence: this._calculateConfidence(sensor),
        }));
        analysis.suggestedRoomMappings.push({
          area,
          mappings,
        });
      } else {
        analysis.ungroupedSensors = areaSensors;
      }
    });

    return analysis;
  }

  /**
   * Extract area/room from sensor name
   */
  _extractAreaFromName(name) {
    // Common patterns: "Living Room Temperature", "Kitchen Humidity", etc.
    const lowerName = name.toLowerCase();

    // Room patterns
    const roomPatterns = [
      /(\w+\s+room)/i,
      /(kitchen)/i,
      /(bathroom)/i,
      /(bedroom)/i,
      /(office)/i,
      /(garage)/i,
      /(hallway)/i,
      /(living\s+room)/i,
      /(dining\s+room)/i,
      /(lab)/i,
      /(classroom)/i,
      /(studio)/i,
      /(gym)/i,
      /(library)/i,
      /(cafeteria)/i,
      /(auditorium)/i,
    ];

    for (const pattern of roomPatterns) {
      const match = lowerName.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Detect sensor type from entity and attributes
   */
  _detectSensorType(sensor) {
    const entityId = sensor.entityId.toLowerCase();
    const deviceClass = sensor.attributes?.device_class;
    const unit = sensor.unit;

    // Check device class first
    if (deviceClass) {
      const typeMap = {
        'temperature': 'temperature',
        'humidity': 'humidity',
        'illuminance': 'light',
        'motion': 'motion',
        'occupancy': 'occupancy',
        'energy': 'energy',
        'power': 'energy',
        'carbon_dioxide': 'co2',
      };
      if (typeMap[deviceClass]) return typeMap[deviceClass];
    }

    // Check domains
    if (sensor.domain === 'sun') return 'celestial';
    if (entityId.includes('moon')) return 'celestial';
    if (entityId.includes('sun_next')) return 'celestial';

    // Check by unit
    if (unit) {
      if (unit === '°C' || unit === '°F') return 'temperature';
      if (unit === '%') {
        // Disambiguate Humidity vs Battery based on Entity ID
        if (entityId.includes('battery')) return 'battery';
        // Default to humidity if unsure, but usually humidity
        return 'humidity';
      }
      if (unit === 'lux' || unit === 'lx') return 'illuminance';
      if (unit === 'ppm') return 'co2';
      if (unit === 'kW' || unit === 'W') return 'power';
    }

    // Check by entity ID keywords
    if (entityId.includes('temp')) return 'temperature';
    if (entityId.includes('humidity') || entityId.includes('humid')) return 'humidity';
    if (entityId.includes('light') || entityId.includes('illuminance')) return 'illuminance';
    if (entityId.includes('motion') || entityId.includes('occupancy')) return 'occupancy';
    if (entityId.includes('co2') || entityId.includes('carbon')) return 'co2';
    if (entityId.includes('pm2_5') || entityId.includes('pm25')) return 'pm25';
    if (entityId.includes('voc')) return 'voc';
    if (entityId.includes('energy') || entityId.includes('power')) return 'power';
    if (entityId.includes('people') || entityId.includes('count')) return 'occupancy';
    if (entityId.includes('battery') || entityId.includes('bat')) return 'battery';
    if (entityId.includes('printer') || entityId.includes('octoprint')) return 'equipment';
    if (entityId.includes('job') || entityId.includes('tool')) return 'equipment';

    return 'unknown';
  }

  /**
   * Suggest room ID from area name
   */
  _suggestRoomId(area) {
    const lowerArea = area.toLowerCase().replace(/\s+/g, '');

    // Direct mappings
    const mappings = {
      'livingroom': 'a1',
      'kitchen': 'cafeteria',
      'bedroom': 'a2',
      'bathroom': 'a3',
      'office': 'office',
      'lab': 'laba',
      'classroom': 'a1',
      'studio': 'a4',
      'gym': 'gym',
      'library': 'library',
      'cafeteria': 'cafeteria',
      'auditorium': 'auditorium',
    };

    return mappings[lowerArea] || lowerArea;
  }

  /**
   * Calculate confidence level for mapping suggestion
   */
  _calculateConfidence(sensor) {
    let confidence = 0;

    // Has device class
    if (sensor.attributes?.device_class) confidence += 40;

    // Has unit
    if (sensor.unit && sensor.unit !== '') confidence += 20;

    // Has area in name
    if (this._extractAreaFromName(sensor.friendlyName)) confidence += 30;

    // Type detected
    if (this._detectSensorType(sensor) !== 'unknown') confidence += 10;

    return Math.min(confidence, 100);
  }

  /**
   * Parse sensor value based on type
   */
  _parseValue(state, sensorType) {
    if (sensorType === 'motion') {
      return state === 'on' ? 'Detected' : 'Clear';
    }

    const numValue = parseFloat(state);
    return isNaN(numValue) ? state : numValue;
  }

  /**
   * Update sensor reading
   */
  updateSensor(roomId, sensorType, value, source = 'unknown') {
    if (!this.sensorData.has(roomId)) {
      this.sensorData.set(roomId, new Map());
    }

    const meta = this.sensorMeta[sensorType];
    if (!meta) {
      console.warn(`[SensorManager] Unknown sensor type: ${sensorType}`);
      return;
    }

    const status = this._calculateStatus(sensorType, value, meta);

    const sensorReading = {
      value,
      unit: meta.unit,
      status,
      statusText: this._getStatusText(status),
      timestamp: Date.now(),
      source,
    };

    this.sensorData.get(roomId).set(sensorType, sensorReading);

    // Notify listeners
    this._notifyListeners({
      roomId,
      sensorType,
      reading: sensorReading,
    });

    console.log(`[SensorManager] Updated ${roomId}/${sensorType}: ${value}${meta.unit} (${source})`);
  }

  /**
   * Get sensor reading
   */
  getSensor(roomId, sensorType) {
    return this.sensorData.get(roomId)?.get(sensorType) || null;
  }

  /**
   * Get all sensors for a room
   */
  getRoomSensors(roomId) {
    const roomData = this.sensorData.get(roomId);
    if (!roomData) return {};

    const sensors = {};
    roomData.forEach((reading, sensorType) => {
      sensors[sensorType] = reading;
    });
    return sensors;
  }

  /**
   * Calculate sensor status based on thresholds
   */
  _calculateStatus(sensorType, value, meta) {
    if (sensorType === 'motion') {
      return value === 'Detected' ? 'active' : 'normal';
    }

    if (typeof value !== 'number') return 'unknown';

    const { thresholds } = meta;
    if (!thresholds) return 'normal';

    // Check for alerts
    if (thresholds.alert && value >= thresholds.alert) return 'alert';
    if (thresholds.min && value <= thresholds.min) return 'alert';

    // Check for warnings
    if (thresholds.warning && value >= thresholds.warning) return 'warning';

    return 'normal';
  }

  /**
   * Get status text
   */
  _getStatusText(status) {
    const statusMap = {
      normal: 'Normal',
      warning: 'Warning',
      alert: 'Alert',
      active: 'Active',
      unknown: 'Unknown',
    };
    return statusMap[status] || 'Unknown';
  }

  /**
   * Get sensor metadata
   */
  getSensorMeta(sensorType) {
    return this.sensorMeta[sensorType] || null;
  }

  /**
   * Subscribe to sensor updates
   */
  on(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  _notifyListeners(data) {
    this.listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error('[SensorManager] Listener error:', error);
      }
    });
  }

  /**
   * Subscribe to raw sensor updates (unmapped)
   */
  onRawUpdate(callback) {
    this.rawListeners.add(callback);
    return () => this.rawListeners.delete(callback);
  }

  /**
   * Notify raw listeners
   */
  _notifyRawListeners(data) {
    this.rawListeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error('[SensorManager] Raw listener error:', error);
      }
    });
  }

  /**
   * Load sensor mappings from JSON
   */
  async loadMappings() {
    try {
      console.log('[SensorManager] Loading sensor mappings...');
      const response = await fetch('/api/sensors/mapping');
      if (!response.ok) throw new Error('Failed to load mappings');

      const data = await response.json();

      if (data.rooms) {
        Object.entries(data.rooms).forEach(([roomId, roomData]) => {
          if (roomData.sensors) {
            roomData.sensors.forEach(sensor => {
              this.mapEntityToRoom(sensor.entityId, roomId, sensor.type);
            });
          }
        });
        console.log(`[SensorManager] Loaded mappings for ${Object.keys(data.rooms).length} rooms`);
      }
    } catch (error) {
      console.warn('[SensorManager] Could not load sensor mappings:', error);
    }
  }

  /**
   * Load sensor mappings from static data (classrooms-with-sensors.js)
   */
  loadMappingsFromStaticData() {
    console.log('[SensorManager] Loading static sensor mappings...');
    classroomsWithSensors.forEach(room => {
      if (room.sensors) {
        room.sensors.forEach(sensor => {
          if (sensor.entity_id) {
            this.mapEntityToRoom(sensor.entity_id, room.id, sensor.type);
          }
        });
      }
    });
    console.log(`[SensorManager] Loaded static mappings for ${classroomsWithSensors.length} rooms`);
  }

  /**
   * Start all connectors
   */
  async startAll() {
    console.log('[SensorManager] Starting all connectors...');

    // Load mappings first
    this.loadMappingsFromStaticData();
    await this.loadMappings();

    const promises = Array.from(this.connectors.values()).map((connector) =>
      connector.start?.()
    );
    await Promise.all(promises);
    console.log('[SensorManager] ✓ All connectors started');
  }

  /**
   * Stop all connectors
   */
  async stopAll() {
    console.log('[SensorManager] Stopping all connectors...');
    const promises = Array.from(this.connectors.values()).map((connector) =>
      connector.stop?.()
    );
    await Promise.all(promises);
    console.log('[SensorManager] ✓ All connectors stopped');
  }

  /**
   * Cleanup
   */
  // ...
  dispose() {
    this.stopAll();
    this.sensorData.clear();
    this.listeners.clear();
    this.rawListeners.clear();
    this.connectors.clear();
  }

  // ============================================
  // UI Helpers (Formatted for Space.js Panels)
  // ============================================

  /**
   * Get formatted sensor data for a specific room
   * @param {string} roomId 
   * @returns {Array} Array of sensor objects ready for display
   */
  getSensorsForRoom(roomId) {
    const sensors = [];

    // 1. Get sensors from static mapping
    const mappedEntityIds = SensorConfig.mappings[roomId] || [];

    mappedEntityIds.forEach(entityId => {
      // Find the sensor in discovered sensors or entity mappings
      // We need to find the Type. 
      // Check if we have it in discoveredSensors
      const sensor = this.discoveredSensors.get(entityId);

      if (sensor) {
        const type = this._detectSensorType(sensor); // Use existing helper
        const config = SensorConfig.get(type);

        // Parse value
        const rawVal = parseFloat(sensor.state);
        const val = isNaN(rawVal) ? sensor.state : rawVal;

        // Determine status manually or via helper
        // We can mock status or use existing _calculateStatus logic if we had metadata for this specific instance
        // For now, simple format

        sensors.push({
          key: entityId, // Unique Key
          label: config.label === 'Sensor' ? sensor.friendlyName : config.label, // Use friendly name if specific, or generic label + override
          // Actually better: Use Friendly Name always if available, fallback to Config Label
          label: sensor.attributes?.friendly_name || config.label,
          value: config.format(val),
          unit: sensor.unit || config.unit,
          color: config.color(val),
          icon: config.icon,
          status: 'normal' // default
        });
      }
    });

    // 2. Also include any legacy mapped sensors (from this.sensorData)
    // allowing hybrid approach if some are dynamic
    const roomSensors = this.getRoomSensors(roomId);
    Object.entries(roomSensors).forEach(([type, reading]) => {
      // Avoid duplicates if already added via mapping
      // Logic: if we implemented mapping, we likely prefer that. 
      // But let's keep this for backward compatibility with 'create_unified_data' flows if any.
    });

    return sensors;
  }

  /**
   * Get all sensors that are NOT mapped to any room
   * Grouped and formatted for a general "Campus" panel
   */
  getUngroupedSensorsFormatted() {
    const allSensors = Array.from(this.discoveredSensors.values());
    const mappedIds = new Set();

    // Collect all mapped entity IDs
    this.entityMappings.forEach((mapping, entityId) => {
      mappedIds.add(entityId);
    });

    return allSensors
      .filter(s => !mappedIds.has(s.entityId))
      .map(sensor => {
        const typeKey = this._detectSensorType(sensor);
        const config = SensorConfig.get(typeKey);

        // Parse value safely
        const rawVal = parseFloat(sensor.state);
        const val = isNaN(rawVal) ? sensor.state : rawVal;

        return {
          key: sensor.entityId,
          label: sensor.attributes?.friendly_name || sensor.entityId,
          value: config.format(val),
          unit: sensor.unit || config.unit,
          color: config.color(val),
          icon: config.icon
        };
      });
  }
}
