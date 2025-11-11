#!/usr/bin/env node

/**
 * Fetch Home Assistant Entities & Analyze Naming Patterns
 *
 * Purpose: Query actual HA instance for all entities, extract naming patterns,
 * and prepare for entity-to-location mapping.
 *
 * Usage: node scripts/fetch-ha-entities.mjs [--filter="sensor|light|climate"]
 *
 * Outputs:
 * - agents-docs/projects/home-assistant-data-sync/research/HA-ENTITIES-RAW.json
 * - agents-docs/projects/home-assistant-data-sync/research/ENTITY-NAMING-PATTERNS.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Parse arguments
const args = process.argv.slice(2);
const filterArg = args.find(a => a.startsWith('--filter='))?.split('=')[1];

// Load HA config
const haUrl = process.env.VITE_CLOUD_REST || 'https://rehvwt2m9uw7pkdyqcuta2lmai6wgzei.ui.nabu.casa/api';
const haToken = process.env.VITE_CLOUD_TOKEN;

if (!haToken) {
  console.error('❌ VITE_CLOUD_TOKEN not set in .env');
  process.exit(1);
}

console.log(`🔗 Connecting to Home Assistant...`);
console.log(`   URL: ${haUrl}`);

try {
  // Fetch states (all entities)
  const response = await fetch(`${haUrl}/states`, {
    headers: {
      'Authorization': `Bearer ${haToken}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const entities = await response.json();

  console.log(`✓ Fetched ${entities.length} entities from HA\n`);

  // Analyze and group entities
  const grouped = groupEntitiesByDomain(entities);
  const patterns = analyzeNamingPatterns(entities, filterArg);

  // Save raw data
  const researchDir = path.join(rootDir, 'agents-docs/projects/home-assistant-data-sync/research');
  if (!fs.existsSync(researchDir)) {
    fs.mkdirSync(researchDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(researchDir, 'HA-ENTITIES-RAW.json'),
    JSON.stringify(entities, null, 2)
  );
  console.log(`→ Saved ${entities.length} raw entities to HA-ENTITIES-RAW.json`);

  // Print analysis
  console.log('\n📊 Entity Breakdown by Domain:\n');
  Object.entries(grouped).forEach(([domain, list]) => {
    console.log(`  ${domain}: ${list.length} entities`);
    if (list.length <= 5) {
      list.forEach(e => console.log(`    • ${e.entity_id}`));
    } else {
      console.log(`    • ${list.slice(0, 3).map(e => e.entity_id).join(', ')}, ... (+${list.length - 3})`);
    }
  });

  // Print naming patterns
  console.log('\n🔍 Naming Pattern Analysis:\n');
  console.log(`Total entities: ${entities.length}`);
  console.log(`Domains: ${Object.keys(grouped).join(', ')}`);

  const patternSummary = patterns.map(p =>
    `  ${p.pattern}: ${p.count} matches`
  ).join('\n');
  console.log(`\nLocation patterns found:\n${patternSummary}`);

  // Try to match entities to locations
  const locations = JSON.parse(
    fs.readFileSync(path.join(researchDir, 'ENTITY-LOCATIONS.json'), 'utf8')
  );

  const mapped = matchEntitiesToLocations(entities, locations);
  console.log(`\n✨ Entity-Location Matches: ${mapped.length}/${entities.length} entities matched`);

  // Save mapping results
  fs.writeFileSync(
    path.join(researchDir, 'ENTITY-LOCATION-MAPPING.json'),
    JSON.stringify(mapped, null, 2)
  );

} catch (error) {
  console.error(`❌ Error fetching entities:`, error.message);
  process.exit(1);
}

/**
 * Group entities by domain
 */
function groupEntitiesByDomain(entities) {
  const grouped = {};
  entities.forEach(e => {
    const domain = e.entity_id.split('.')[0];
    if (!grouped[domain]) grouped[domain] = [];
    grouped[domain].push(e);
  });
  return grouped;
}

/**
 * Analyze naming patterns for location identifiers
 */
function analyzeNamingPatterns(entities, filter) {
  const sensorEntities = filter
    ? entities.filter(e => e.entity_id.startsWith(filter))
    : entities.filter(e => e.entity_id.startsWith('sensor'));

  const patterns = {};

  sensorEntities.forEach(e => {
    const parts = e.entity_id.split('_');
    // Extract location clues (usually first significant word after domain)
    const locationClue = parts.slice(1, -1).join('_');
    if (locationClue) {
      patterns[locationClue] = (patterns[locationClue] || 0) + 1;
    }
  });

  // Sort by frequency
  return Object.entries(patterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([pattern, count]) => ({ pattern, count }));
}

/**
 * Try to match entities to locations based on naming conventions
 */
function matchEntitiesToLocations(entities, locations) {
  const mapped = [];
  const locationIds = new Set(locations.map(l => l.id));

  entities.forEach(entity => {
    const parts = entity.entity_id.split('_');
    const potentialLocationId = parts.slice(1, -1).join('_');

    // Check if entity name contains any location ID
    locations.forEach(location => {
      if (
        entity.entity_id.includes(location.id) ||
        entity.friendly_name?.toLowerCase().includes(location.name.toLowerCase())
      ) {
        mapped.push({
          entityId: entity.entity_id,
          friendlyName: entity.friendly_name || entity.entity_id,
          state: entity.state,
          domain: entity.entity_id.split('.')[0],
          locationId: location.id,
          locationName: location.name,
          confidence: entity.entity_id.includes(location.id) ? 'high' : 'medium',
        });
      }
    });
  });

  return mapped;
}
