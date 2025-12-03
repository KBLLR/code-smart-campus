# Telemetry System

Comprehensive sensor telemetry system for real-time room monitoring and environmental data tracking.

## Overview

The telemetry system connects to Home Assistant via WebSocket, discovers sensors, and maps them to rooms based on the configuration in `sensors-mapping.json`. This enables real-time monitoring of temperature, humidity, CO2, occupancy, and other environmental metrics across the campus.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Home Assistant (WebSocket)                                 │
│  • Temperature sensors                                      │
│  • Humidity sensors                                         │
│  • CO2 sensors                                             │
│  • Occupancy sensors                                        │
│  • Motion sensors                                           │
│  • Energy meters                                            │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  HomeAssistantConnector                                     │
│  • WebSocket connection                                     │
│  • Entity discovery                                         │
│  • Real-time state updates                                  │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  SensorManager                                              │
│  • Entity storage                                           │
│  • Sensor metadata                                          │
│  • Update listeners                                         │
│  • Entity → Room mappings                                   │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  SensorMappingLoader (sensors-mapping.json)                 │
│  • 20 rooms configured                                      │
│  • 100+ sensor entity mappings                              │
│  • Sensor type classification                               │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  SensorSyncService                                          │
│  • Live data sync to ClassroomRegistry                      │
│  • Historical data tracking                                 │
│  • Threshold-based status determination                     │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  ClassroomRegistry → UI Components                          │
│  • RoomDetailView                                           │
│  • CampusMetrics                                            │
│  • RoomHoverPanel                                           │
│  • Sensor visualizations                                    │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. SensorManager (`src/sensors/SensorManager.js`)

Central hub for all sensor data management.

**Features:**
- Entity storage and mapping
- Connector registration (Home Assistant, APIs, etc.)
- Update listeners for real-time data
- Sensor metadata (labels, units, thresholds, icons)
- Discovery and analysis utilities

**API:**
```javascript
// Register connector
sensorManager.registerConnector('HomeAssistant', connector);

// Map entity to room
sensorManager.mapEntityToRoom('sensor.makerspace_temperature', 'makerspace', 'temperature');

// Get discovered sensors
const sensors = sensorManager.getDiscoveredSensors();

// Update sensor data
sensorManager.updateSensor('makerspace', 'temperature', 22.5, 'HomeAssistant');

// Listen to updates
sensorManager.onUpdate((roomId, sensorType, data) => {
  console.log(`${roomId}/${sensorType}: ${data.value}${data.unit}`);
});
```

### 2. SensorMappingLoader (`src/utils/sensorMappingLoader.js`)

Loads and applies sensor mappings from configuration file.

**Features:**
- Automatic mapping application at startup
- Validation against discovered sensors
- Statistics and reporting
- Room telemetry inventory

**API:**
```javascript
import { loadSensorMappings, validateSensorMappings, getRoomsWithTelemetry } from '@/utils/sensorMappingLoader.js';

// Load mappings (automatically called at app startup)
const stats = await loadSensorMappings(sensorManager);

// Get rooms with telemetry enabled
const rooms = getRoomsWithTelemetry();

// Validate mappings
const validation = validateSensorMappings(sensorManager);

// Available in browser console:
window.sensorMappingUtils.getRoomsWithTelemetry();
window.sensorMappingUtils.getSensorsForRoom('makerspace');
window.sensorMappingUtils.getSensorMappingStats();
```

### 3. HomeAssistantConnector (`src/connectors/HomeAssistantConnector.js`)

WebSocket connection to Home Assistant for real-time sensor discovery and updates.

**Features:**
- WebSocket authentication
- Entity auto-discovery
- Real-time state change events
- Connection management (reconnect on disconnect)

**Configuration:**
```javascript
// Environment variables
VITE_CLOUD_WS=wss://your-instance.ui.nabu.casa/api/websocket
VITE_CLOUD_TOKEN=your_long_lived_access_token
```

### 4. SensorSyncService (`src/services/SensorSyncService.js`)

Bridges SensorManager with ClassroomRegistry for live data sync.

**Features:**
- Event-driven updates
- Historical data tracking (last 100 readings per sensor)
- Threshold-based status determination
- Bulk sync on initialization

**Status Determination:**
- **Temperature:** `optimal` (20-24°C), `ok` (18-26°C), `warning` (<18 or >26°C)
- **CO2:** `ok` (<800ppm), `caution` (800-1000ppm), `warning` (>1000ppm)
- **Humidity:** `optimal` (40-50%), `ok` (30-60%), `warning` (<30 or >60%)

## Sensor Configuration

### sensors-mapping.json Structure

```json
{
  "rooms": [
    {
      "id": "makerspace",
      "name": "Makers Space",
      "category": "Lab",
      "sensors": [
        {
          "entityId": "binary_sensor.makerspace_occupancy_occupancy",
          "friendlyName": "MakerSpace Occupancy",
          "type": "occupancy"
        },
        {
          "entityId": "sensor.aq_sensor_temperature",
          "friendlyName": "MakerSpace Temperature",
          "type": "temperature",
          "unit": "°C"
        },
        {
          "entityId": "sensor.aq_sensor_humidity",
          "friendlyName": "MakerSpace Humidity",
          "type": "humidity",
          "unit": "%"
        },
        {
          "entityId": "sensor.aq_sensor_voc_index",
          "friendlyName": "MakerSpace VOC index",
          "type": "aqi"
        }
      ]
    }
  ]
}
```

### Supported Sensor Types

| Type | Label | Unit | Thresholds |
|------|-------|------|------------|
| `temperature` | Temperature | °C | Warning: <18 or >26, Optimal: 20-24 |
| `humidity` | Humidity | % | Warning: <30 or >60, Optimal: 40-50 |
| `co2` | CO₂ Level | ppm | Warning: >1000, Alert: >1500 |
| `occupancy` | Occupancy | people | Warning: >70% capacity, Alert: >90% |
| `light` | Light Level | lux | Min: 300, Warning: <200 |
| `energy` | Energy Usage | kW | Warning: >3, Alert: >5 |
| `motion` | Motion | - | Values: Clear, Detected |
| `pm25` | PM2.5 | μg/m³ | Air quality particulate matter |
| `aqi` | Air Quality Index | - | VOC and air quality composite |
| `battery` | Battery Level | % | Device battery status |

## Room Telemetry Status

### Currently Configured (20 Rooms)

Based on `sensors-mapping.json` (1,301 lines):

1. **makerspace** - Makers Space (Lab)
   - Occupancy, Temperature, Humidity, PM2.5, VOC, OctoPrint sensors

2. **library** - Library (Study)
   - Temperature, Humidity, Occupancy

3. **peace_room** - Peace Room (Meeting)
   - Temperature, Humidity, Occupancy

4. **a05** - Room A.5 (Classroom)
   - Temperature, Humidity, CO2, Occupancy

5. **b07** - Room B.7 (Classroom)
   - Temperature, Humidity, CO2, Occupancy

6. **a11** - Room A.11 (Classroom)
   - Temperature, Humidity, CO2, Occupancy

7. **entrance** - Entrance Hall
   - Motion, Light levels

8. **corridor_a** - Corridor A
   - Motion, Light levels

9. **corridor_b** - Corridor B
   - Motion, Light levels

10. **cafeteria** - Cafeteria
    - Temperature, Humidity, Occupancy

...and 10 more rooms with various sensor configurations.

### Rooms Without Telemetry

All rooms visible in the 3D campus that are not in the list above currently have **no sensor data** configured. To enable telemetry for additional rooms:

1. Ensure sensors exist in Home Assistant
2. Add room configuration to `sensors-mapping.json`
3. Restart the application (or reload mappings)

## Initialization Flow

1. **App Start** → `CampusApp.init()`
2. **Sensor System Setup** → `_setupSensorSystem()`
3. **Create SensorManager** → Central data hub
4. **Register HomeAssistantConnector** → WebSocket connection
5. **Start Connectors** → `sensorManager.startAll()`
6. **Discover Sensors** → Auto-discover all HA entities (2 seconds delay)
7. **Load Mappings** → `loadSensorMappings(sensorManager)`
8. **Validate Mappings** → `validateSensorMappings(sensorManager)`
9. **Start Sync Service** → `sensorSyncService.start()`
10. **Telemetry Active** ✓

## Console Utilities

The telemetry system exposes several utilities to the browser console:

### SensorManager Commands

```javascript
// Access sensor manager
window.sensorManager

// Get all discovered sensors
window.sensorsData

// Get sensor analysis
window.sensorsAnalysis

// Map entity to room manually
window.sensorManager.mapEntityToRoom(entityId, roomId, sensorType)

// Download sensor data
window.downloadSensorsJSON()
window.downloadSensorsYAML()
window.downloadAnalysisJSON()
window.downloadAnalysisYAML()
window.downloadSensorHistory()
```

### SensorMapping Utilities

```javascript
// Get rooms with telemetry
window.sensorMappingUtils.getRoomsWithTelemetry()

// Get sensors for specific room
window.sensorMappingUtils.getSensorsForRoom('makerspace')

// Get mapping statistics
window.sensorMappingUtils.getSensorMappingStats()

// Validate mappings
window.sensorMappingUtils.validateSensorMappings(window.sensorManager)

// Export mapping configuration
window.sensorMappingUtils.exportSensorMappings()
```

### SensorSyncService Commands

```javascript
// Access sync service
window.sensorSyncService

// Export sensor history
window.sensorSyncService.exportHistory()

// Get history for entity
window.sensorSyncService.getHistory('sensor.makerspace_temperature')
```

## Adding New Sensors

### 1. Add Sensor to Home Assistant

Ensure the sensor exists in Home Assistant and is reporting data.

### 2. Update sensors-mapping.json

```json
{
  "id": "new_room",
  "name": "New Room Name",
  "category": "Classroom",
  "sensors": [
    {
      "entityId": "sensor.new_room_temperature",
      "friendlyName": "New Room Temperature",
      "type": "temperature",
      "unit": "°C"
    }
  ]
}
```

### 3. Restart Application

The sensor mappings are loaded at startup. Alternatively, manually load mappings:

```javascript
const { loadSensorMappings } = await import('./src/utils/sensorMappingLoader.js');
await loadSensorMappings(window.sensorManager);
```

## Troubleshooting

### No Sensor Data Displayed

**Check:**
1. Home Assistant connection status
   ```javascript
   window.sensorManager.connectors.get('HomeAssistant')
   ```

2. Discovered sensors count
   ```javascript
   window.sensorsData.length
   ```

3. Mapping validation
   ```javascript
   window.sensorMappingUtils.validateSensorMappings(window.sensorManager)
   ```

4. Environment variables
   - `VITE_CLOUD_WS` or `VITE_LOCAL_WS` must be set
   - `VITE_CLOUD_TOKEN` or `VITE_HA_TOKEN` must be valid

### Sensors Not Mapped to Rooms

**Check:**
1. Entity ID matches exactly in `sensors-mapping.json`
2. Room ID exists in room registry
3. Sensor type is valid (see supported sensor types above)

**View unmapped sensors:**
```javascript
const validation = window.sensorMappingUtils.validateSensorMappings(window.sensorManager);
console.log('Extra sensors (not mapped):', validation.extra);
```

### Connection Issues

**WebSocket connection refused:**
- Check Home Assistant is running and accessible
- Verify WebSocket URL in `.env` (cloud or local)
- Test connection: `wss://your-instance.ui.nabu.casa/api/websocket`
- Ensure long-lived access token is valid

**Sensors not updating in real-time:**
- Check WebSocket connection status
- Verify `SensorSyncService` is started
- Check browser console for errors

## Performance Considerations

- **100+ sensors** updating in real-time
- **WebSocket** reduces polling overhead
- **Event-driven** updates minimize processing
- **History limited** to last 100 readings per sensor (configurable)
- **Throttling** recommended for UI updates (use debounce)

## Future Enhancements

### Phase 3 (Analytics Dashboard)
- Room utilization statistics from occupancy sensors
- Sensor correlation matrix (temperature vs. CO2, etc.)
- Anomaly detection (unusual sensor readings)
- Predictive insights with ML

### Advanced Features
- Custom sensor thresholds per room
- Sensor calibration utilities
- Alert system for threshold breaches
- Mobile push notifications
- Historical data export to CSV/JSON
- Sensor health monitoring (last seen, battery level)

## Related Documentation

- **FOCUS.md** - Project roadmap and priorities
- **CLAUDE.md** - Development guidelines
- **src/sensors/SensorManager.js** - Core sensor management
- **src/connectors/HomeAssistantConnector.js** - HA integration
- **src/data/sensors/sensors-mapping.json** - Sensor configuration (1,301 lines)

---

**Status:** ✓ Telemetry enabled for 20 rooms with 100+ sensors
**Last Updated:** 2025-12-03
