# HADS-R02: Device Mobility & Entity Binding Architecture

**Task:** Map HA entities to room/floor geometry with support for device relocation.

**Status:** Research Phase
**Date:** 2025-11-12
**Author:** Claude Code

---

## Executive Summary

The campus visualization needs to support **two classes of entities:**

1. **Fixed Entities** — Sensors permanently mounted in rooms (temperature, humidity, CO2 sensors embedded in walls)
2. **Mobile Entities** — Devices that can be moved between rooms (portable sensors, projectors, mobile occupancy trackers)

### The Problem

Naive entity-to-location binding breaks when devices move:
- Entity ID: `sensor.room_101_temperature` suggests "Room 101" as source of truth
- But if a device is physically moved to Room 102, the entity ID becomes stale/misleading
- Scenes must know which room a device is **actually in**, not where its ID says it is

### The Solution (Hybrid Approach)

1. **Entity Registry** — Declare each entity's "home" location (from entity ID or friendly_name)
2. **Location Tracker** — Separate "current location" from "home location" (via HA attributes or separate tracking)
3. **Scene Binding** — Always use current location, fall back to home location if not available
4. **Mobility Log** — Optional: Log device movements for analytics/debugging

---

## Current Campus Setup

### Fixed Locations (30 rooms)

From `rooms_personalities.json`, the campus has 30 distinct rooms grouped by category:

| Category | Rooms | Example Entities |
|----------|-------|---|
| **Elemental Forces** | 2 | hydrogen, dark-matter |
| **Community Hubs** | 6 | cantina, alexandria (library), makers-space, hive, jungle, babylon |
| **Mythos & Media** | 4 | pluto-family-room, artemis-desk, aang, pandora |
| **Data Core** | 3 | b.19, b.18, b.17 |
| **Innovation & Discovery** | 4 | otter-space, cape-canaveral, houston, tetandris |
| **Conceptual Realms** | 8 | hans-zimmer, mf-room, w(room), after, present, b4, peace, muted |
| **Creative Core** | 3 | a.26, a.25, a.23 |

**Key Insight:** Rooms have both technical IDs (a.1, b.19, etc.) and human-friendly names. HA entities will reference one or both.

### Existing HA Entity Patterns (from SVG annotations)

From `src/data/assets/fully_annotated_floorplan.svg`, detected sensor types:

```
B10 (MF Room):
  - B10, Last illumination state, Occupancy

B12 (Hans Zimmer):
  - B12, B12 Humidity, B12 Temperature, Last illumination state, Occupancy

B3 (Peace):
  - B3, Humidity, Last illumination state, Occupancy, PM2.5, Temperature, VOC index

Cantina (Kitchen):
  - bottles, pfand, Humidity, Temperature
```

**Pattern:** Entity names use room ID or friendly name as prefix + sensor type as suffix.

---

## Entity Binding Strategies

### Strategy A: Convention-Based (High Confidence)

**Assumption:** Entity name encodes location via convention.

**Naming Conventions:**
```
sensor.{room_id}_{metric}           // e.g., sensor.b3_temperature
sensor.{room_friendly_name}_{metric} // e.g., sensor.peace_temperature
sensor_{room_id}                    // e.g., sensor_b3
{metric}_{room_id}                  // e.g., temperature_peace
```

**Pros:**
- Declarative, requires no config file
- Fast to implement
- Works for fixed entities

**Cons:**
- Brittle if naming convention changes
- Doesn't support mobile entities
- Assumes entity creator followed convention

**Usage:**
```typescript
// Extract room ID from entity ID
function extractRoomId(entityId: string): string | null {
  const matches = entityId.match(/sensor\.(\w+?)_/);
  return matches ? matches[1] : null;
}

const roomId = extractRoomId('sensor.b3_temperature'); // 'b3'
const location = locationRegistry.getById(roomId);
```

---

### Strategy B: Registry-Based (Explicit Mapping)

**Approach:** Maintain a config file mapping entities to locations.

**Config Structure:**
```json
{
  "fixed_entities": [
    {
      "entity_id": "sensor.b3_temperature",
      "location_id": "b.3",
      "location_name": "Peace",
      "device_type": "temperature_sensor",
      "mount_location": "wall_north",
      "notes": "Permanently mounted sensor"
    }
  ],
  "mobile_entities": [
    {
      "entity_id": "sensor.portable_co2_01",
      "home_location_id": "a.1",
      "current_location_id": "a.1",
      "device_type": "portable_co2",
      "location_tracker": "HA_attribute:current_room",
      "notes": "Can be moved between rooms"
    }
  ]
}
```

**Pros:**
- Explicit, no magic naming
- Supports mobile entities via `current_location_id`
- Works across naming convention changes
- Auditable, versionable in git

**Cons:**
- Extra maintenance overhead
- Must be kept in sync with HA
- Drift risk (entity deleted, mapping stale)

**Usage:**
```typescript
interface EntityBinding {
  entityId: string;
  homeLocationId: string;
  currentLocationId?: string; // For mobile entities
  type: 'fixed' | 'mobile';
}

const binding = entityRegistry.get('sensor.portable_co2_01');
const effectiveLocation = binding.currentLocationId || binding.homeLocationId;
```

---

### Strategy C: Hybrid (Recommended for MVP)

**Approach:** Prefer convention, fall back to registry, support dynamic tracking.

**Algorithm:**
```
1. Query HA entity by ID
2. Try to extract location from entity name using convention
   → If found, use convention binding
   → If not found, continue to step 3
3. Look up entity in explicit binding registry
   → If found, use registry binding (with current_location override)
   → If not found, continue to step 4
4. Check HA entity attributes for location hint
   → If entity has `location` or `room` attribute, use that
   → Otherwise, mark entity as "unmapped"
```

**Pros:**
- Declarative for most entities (convention)
- Flexible for exceptions (registry)
- Supports device mobility (attributes)
- Progressive enhancement

**Cons:**
- Complexity in binding logic
- Multiple sources of truth (risky)

**Code Sketch:**
```typescript
type LocationBindingSource = 'convention' | 'registry' | 'attribute' | 'unmapped';

interface EntityLocation {
  entityId: string;
  currentLocationId: string;
  homeLocationId: string;
  source: LocationBindingSource;
  confidence: 'high' | 'medium' | 'low';
}

function resolveEntityLocation(
  entityId: string,
  convention: ConventionMatcher,
  registry: BindingRegistry,
  haEntity: HAState,
): EntityLocation {
  // Try convention
  const byConvention = convention.match(entityId);
  if (byConvention) {
    return {
      entityId,
      currentLocationId: byConvention,
      homeLocationId: byConvention,
      source: 'convention',
      confidence: 'high',
    };
  }

  // Try registry
  const byRegistry = registry.lookup(entityId);
  if (byRegistry) {
    return {
      entityId,
      currentLocationId: byRegistry.currentLocationId || byRegistry.homeLocationId,
      homeLocationId: byRegistry.homeLocationId,
      source: 'registry',
      confidence: byRegistry.currentLocationId ? 'high' : 'medium',
    };
  }

  // Try HA attributes
  const byAttribute = haEntity.attributes?.location || haEntity.attributes?.room;
  if (byAttribute) {
    return {
      entityId,
      currentLocationId: resolveLocationIdFromString(byAttribute),
      homeLocationId: byConvention || byRegistry?.homeLocationId,
      source: 'attribute',
      confidence: 'medium',
    };
  }

  // Give up
  return {
    entityId,
    currentLocationId: undefined,
    homeLocationId: undefined,
    source: 'unmapped',
    confidence: 'low',
  };
}
```

---

## Device Mobility: Implementation Details

### Fixed Entities
- **Binding:** Convention-based (entity ID encodes location)
- **Binding Lifetime:** Permanent (entity ID never changes)
- **Update Frequency:** On first load only

**Examples:**
- `sensor.b3_temperature` → always in room B.3 (Peace)
- `sensor.cantina_humidity` → always in Cantina

### Mobile Entities
- **Binding:** Registry + HA attributes
- **Binding Lifetime:** Mutable (device can move)
- **Update Frequency:** Polling or event-driven (when device moves)

**Movement Tracking Options:**

#### Option 1: HA Native (Recommended for WiFi/ZigBee devices)
- Device supports WiFi triangulation or ZigBee device tracking
- HA `device_tracker` entity updates when device moves
- Bind via `zone.currently_in` or `location` attribute

**Pros:** Real-time, automatic, no manual config
**Cons:** Requires device to have location tech

**Example:**
```json
{
  "entity_id": "sensor.portable_co2_01",
  "device_type": "portable_co2",
  "location_source": "zone.sensor_co2_01_location",
  "current_location": "zone.a1_babylon",  // Read from HA zone entity
  "fallback": "a.1"
}
```

#### Option 2: Manual Webhook (For air-gapped devices)
- Admin manually updates device location via UI or webhook
- Campus system stores "last known location" in separate HA input_select or database
- Scenes read from this input_select when rendering

**Pros:** Works for any device, explicit
**Cons:** Manual, error-prone, requires discipline

**Example:**
```json
{
  "entity_id": "sensor.portable_co2_01",
  "location_input": "input_select.portable_co2_01_location",
  "current_location": "a.1",
  "last_update": "2025-11-12T10:30:00Z"
}
```

#### Option 3: QR Code / Physical Tagging
- Device has QR code label
- When moved, admin scans QR and updates location
- Integrates with webhook option above

**Pros:** Goof-proof, creates audit trail
**Cons:** Requires discipline

---

## Implementation Phases

### Phase 1: Fixed Entities Only (Current MVP)
- Extract locations via convention (entity name contains room ID)
- No mobile entity support
- Build conventional binding registry
- Test on 20-30 HA entities

**Files:**
- `shared/services/entity-binding-registry.ts` — Registry and convention matcher
- `shared/services/ha-entity-resolver.ts` — Binding resolution logic
- `agents-docs/projects/home-assistant-data-sync/research/FIXED-ENTITY-BINDINGS.json` — Convention mapping

### Phase 2: Mobile Entity Support (Post-MVP)
- Add registry layer for mobile entities
- Implement HA attribute location tracking (Option 1)
- Manual webhook fallback (Option 2)
- Mobility audit log (for debugging)

**Files:**
- `agents-docs/projects/home-assistant-data-sync/research/MOBILE-ENTITY-BINDINGS.json` — Mobile entity config
- `src/services/device-mobility-tracker.ts` — Track movement events
- `shared/services/location-sync.ts` — Subscribe to location changes

### Phase 3: Robust Handling (Future)
- QR code scanning (Option 3)
- Analytics dashboard (where are devices, movement patterns)
- Conflict resolution (entity says room A, attribute says room B)
- Migration tooling (rename entities without breaking bindings)

---

## Open Questions & Assumptions

### Q1: Entity Naming Convention
**Assumption:** Most HA entities follow pattern `{domain}.{room_id}_{metric}` or similar.
**To Validate (HADS-R07):** Fetch actual HA entities, verify naming pattern consistency.
**Action:** If convention fails for >20% of entities, switch to Phase 2 (registry) earlier.

### Q2: Mobile Device Inventory
**Assumption:** Only portable CO2/temperature sensors are mobile; most devices are fixed.
**To Validate (HADS-R08):** Interview scene branches to understand device requirements.
**Action:** If device mobility is common, prioritize Phase 2.

### Q3: HA Update Mechanism
**Assumption:** HA entities are static for a session; devices don't move mid-scene.
**To Validate:** Do scenes run for minutes or hours? Do users move projectors during demo?
**Action:** If high mobility, implement real-time location polling or event subscription.

### Q4: Cross-Scene Entity Consistency
**Assumption:** Geospatial, projector, and backdrop scenes all consume the same HA entities.
**To Validate (HADS-R08):** Check if each scene type needs different entity subsets.
**Action:** If scenes diverge, design entity filtering per scene type.

---

## Testing Strategy (HADS-R07)

### Test 1: Convention Extraction
```typescript
it('extracts room ID from entity name', () => {
  const cases = [
    { input: 'sensor.b3_temperature', expected: 'b.3' },
    { input: 'sensor.peace_humidity', expected: 'b.3' },
    { input: 'sensor.cantina_co2', expected: 'kitchen' },
  ];
  // Should match at least 80% of real entities
});
```

### Test 2: Registry Fallback
```typescript
it('falls back to registry when convention fails', () => {
  const unmapped = 'sensor.weird_entity_name_001';
  const binding = registryLookup(unmapped);
  expect(binding).toBeDefined();
});
```

### Test 3: Mobile Entity Tracking
```typescript
it('reads current location from HA attribute', () => {
  const entity = { entity_id: 'sensor.portable_co2_01', attributes: { location: 'a.1' } };
  const location = resolveCurrentLocation(entity);
  expect(location).toBe('a.1');
});
```

### Test 4: Cross-Location Consistency
```typescript
it('all three scenes report same entity location', () => {
  const entityId = 'sensor.b3_temperature';
  const geoLocation = geospatialScene.getEntityLocation(entityId);
  const projectorLocation = projectorScene.getEntityLocation(entityId);
  const backdropLocation = backdropScene.getEntityLocation(entityId);
  expect(geoLocation).toBe(projectorLocation);
  expect(projectorLocation).toBe(backdropLocation);
});
```

---

## Deliverables

1. ✅ **ENTITY-LOCATIONS.json** — 30-room roster with potential sensor types
2. ✅ **ENTITY-LOCATION-MAPPING.json** — Matched HA entities to rooms (pending HA access)
3. **FIXED-ENTITY-BINDINGS.json** — Convention-based registry for Phase 1
4. **MOBILE-ENTITY-BINDINGS.json** — Registry for mobile entities (Phase 2)
5. **entity-binding-registry.ts** — TypeScript module for binding resolution
6. **Test suite** — Unit tests for all binding strategies

---

## References

- `agents-docs/projects/home-assistant-data-sync/research/ENTITY-LOCATIONS.json`
- `src/data/mappings/rooms_personalities.json` (room roster)
- `src/data/assets/fully_annotated_floorplan.svg` (sensor annotations)
- `src/HomeAssistantSocket.js` (current HA integration)
- `shared/ui/SceneManager.ts` (scene coordination)

---

## Next Steps (for Next Agent)

1. **HADS-R07:** Stress test WebSocket reconnection (websocket stability)
2. **HADS-R08:** Interview scene branches for entity needs (geospatial/projector/backdrop data requirements)
3. **HADS-R03:** Design observer pattern (how scenes subscribe to location changes)
4. **Start Phase 1:** Build fixed-entity binding registry and test on real HA data
