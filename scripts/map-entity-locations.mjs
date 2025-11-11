#!/usr/bin/env node

/**
 * Entity Location Mapping Script
 *
 * Purpose: Extract room identifiers from personalities.json, cross-reference with
 * SVG floorplan annotations, and prepare for HA entity matching.
 *
 * Outputs:
 * - agents-docs/projects/home-assistant-data-sync/research/ENTITY-LOCATIONS.json
 * - agents-docs/projects/home-assistant-data-sync/research/LOCATIONS-BY-CATEGORY.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Load room personalities
const personalitiesPath = path.join(rootDir, 'src/data/mappings/rooms_personalities.json');
const personalities = JSON.parse(fs.readFileSync(personalitiesPath, 'utf8'));

// Build location index from personalities
const locations = [];
const locationsByCategory = {};

personalities.forEach(room => {
  const location = {
    id: room.id,
    name: room['room-name'],
    category: room['room-category'],
    avatar: room['room-avatar'],
    icon: room.icon,
    // Potential sensor types based on personality name and annotations
    potentialSensors: inferSensorTypes(room),
  };

  locations.push(location);

  if (!locationsByCategory[location.category]) {
    locationsByCategory[location.category] = [];
  }
  locationsByCategory[location.category].push(location);
});

console.log(`✓ Extracted ${locations.length} locations from personalities.json`);
console.log(`✓ Grouped by ${Object.keys(locationsByCategory).length} categories\n`);

// Output results
const researchDir = path.join(rootDir, 'agents-docs/projects/home-assistant-data-sync/research');
if (!fs.existsSync(researchDir)) {
  fs.mkdirSync(researchDir, { recursive: true });
}

fs.writeFileSync(
  path.join(researchDir, 'ENTITY-LOCATIONS.json'),
  JSON.stringify(locations, null, 2)
);
console.log(`→ Saved ${locations.length} locations to research/ENTITY-LOCATIONS.json`);

fs.writeFileSync(
  path.join(researchDir, 'LOCATIONS-BY-CATEGORY.json'),
  JSON.stringify(locationsByCategory, null, 2)
);
console.log(`→ Saved category index to research/LOCATIONS-BY-CATEGORY.json`);

// Print summary by category
console.log('\n📍 Locations by Category:\n');
Object.entries(locationsByCategory).forEach(([category, rooms]) => {
  console.log(`  ${category} (${rooms.length})`);
  rooms.forEach(r => {
    console.log(`    • ${r.id}: ${r.name} [${r.potentialSensors.join(', ')}]`);
  });
});

/**
 * Infer likely sensor types based on room name and category.
 * This is a heuristic; actual HA entities will come from fetching.
 */
function inferSensorTypes(room) {
  const sensors = new Set();
  const name = room['room-name'].toLowerCase();
  const category = room['room-category'].toLowerCase();

  // Common sensors present in most rooms (from SVG annotations)
  sensors.add('occupancy');
  sensors.add('temperature');
  sensors.add('humidity');
  sensors.add('illumination');

  // Category-specific sensors
  if (category.includes('hub') || category.includes('community')) {
    sensors.add('co2');
    sensors.add('air_quality');
  }
  if (name.includes('data') || name.includes('server') || name.includes('core')) {
    sensors.add('power');
    sensors.add('cpu_usage');
  }
  if (name.includes('kitchen') || name.includes('cantina')) {
    sensors.add('co2');
    sensors.add('humidity');
  }

  return Array.from(sensors).sort();
}
