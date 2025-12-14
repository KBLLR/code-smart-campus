
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SENSORS_MAPPING_PATH = path.resolve(__dirname, '../data/sensors/sensors-mapping.json');
const ROOM_ENTITIES_PATH = path.resolve(__dirname, '../ha/roomEntities.json');

async function main() {
  try {
    // 1. Read files
    console.log('Reading files...');
    const sensorsMappingRaw = await fs.readFile(SENSORS_MAPPING_PATH, 'utf-8');
    const existingEntitiesRaw = await fs.readFile(ROOM_ENTITIES_PATH, 'utf-8');

    const sensorsMapping = JSON.parse(sensorsMappingRaw);
    const existingEntities = JSON.parse(existingEntitiesRaw);

    const newEntities = { ...existingEntities };

    // 2. Helper to process a room list
    const processRooms = (roomsList) => {
      for (const room of roomsList) {
        const roomId = room.id;
        if (!roomId) continue;

        // Init or preserve existing
        if (!newEntities[roomId]) {
          newEntities[roomId] = {};
        }
        
        // Map sensors
        const sensors = room.sensors || [];
        
        // -- Temperature --
        const tempSensor = sensors.find(s => s.type === 'temperature');
        if (tempSensor) newEntities[roomId].temperature = tempSensor.entityId;

        // -- Humidity --
        const humSensor = sensors.find(s => s.type === 'humidity');
        if (humSensor) newEntities[roomId].humidity = humSensor.entityId;

        // -- CO2 / AQI --
        const co2Sensor = sensors.find(s => s.type === 'co2' || s.type === 'aqi' || s.type === 'pm25');
        if (co2Sensor) {
            // prioritize co2 if strictly labeled, else take what's there
            if (!newEntities[roomId].co2 || co2Sensor.type === 'co2') {
                newEntities[roomId].co2 = co2Sensor.entityId;
            }
        }

        // -- Occupancy --
        const occSensor = sensors.find(s => s.type === 'occupancy');
        if (occSensor) newEntities[roomId].occupancy = occSensor.entityId;

        // Note: 'lighting' comes from 'light.' entities which are NOT in sensors-mapping.json
        // So we do not overwrite 'lighting' if it exists.
        // We could look for 'enum' sensors that imply light state, but those are sensors, not controls.
        // For now, we only populate sensors.
      }
    };

    // 3. Process all categories
    if (sensorsMapping.rooms) processRooms(sensorsMapping.rooms);
    if (sensorsMapping.phoneBooths) processRooms(sensorsMapping.phoneBooths);
    
    // Process labArea if it's treated as a room
    if (sensorsMapping.labArea) {
        // Lab area is a single object, wrap in array
         processRooms([{ 
             id: 'lab_area', // normalized id? 
             ...sensorsMapping.labArea 
         }]);
    }

    // 4. Sort keys for stable JSON
    const sortedKeys = Object.keys(newEntities).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const sortedEntities = {};
    for (const key of sortedKeys) {
      sortedEntities[key] = newEntities[key];
    }

    // 5. Write result
    console.log(`Writing ${sortedKeys.length} rooms to ${ROOM_ENTITIES_PATH}...`);
    await fs.writeFile(ROOM_ENTITIES_PATH, JSON.stringify(sortedEntities, null, 2));
    console.log('Done.');

  } catch (error) {
    console.error('Error generating room entities:', error);
    process.exit(1);
  }
}

main();
