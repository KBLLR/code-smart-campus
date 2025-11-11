# Session: HomeAssistant Data Sync — Entity Binding & Device Mobility Research

**Date:** 2025-11-12
**Duration:** Research continuation
**Models consulted:** claude-haiku-4-5-20251001
**Session Type:** Data extraction + Architecture design

---

## Objectives

1. **Extract fixed locations** from campus (rooms, classrooms, zones)
2. **Understand entity naming** from HA SVG floorplan annotations
3. **Design entity binding** that supports **device mobility** (key insight from David)
4. **Map 3 scene types** to same HA entities (geospatial, projector, backdrop)
5. **Propose robust architecture** for phase 1 (fixed) and phase 2 (mobile)

---

## Key Insight: Device Mobility

David's comment changed the architecture: **Classrooms are fixed, but devices can move.**

### The Problem

Naive binding:
```
entity_id: sensor.b3_temperature
→ "temperature in room B.3 (Peace)"
```

But if the sensor is physically moved to room B.5 (Present):
```
entity_id: sensor.b3_temperature  (still says B.3)
current_location: room B.5 (where it actually is)
→ Scene sees contradiction
```

### The Solution (Hybrid Binding)

**Fixed Entities** (80% of devices):
- Entity name encodes location (convention-based)
- Location is permanent

**Mobile Entities** (20% of devices):
- Separate "home" vs. "current" location
- Track via HA attributes or webhook

---

## Deliverables

### 1. Room/Location Extraction
**Script:** `scripts/map-entity-locations.mjs`

**Output:** 30 rooms extracted from `rooms_personalities.json`

```json
{
  "id": "b.3",
  "name": "Peace",
  "category": "Conceptual Realms",
  "icon": "🕊️",
  "potentialSensors": ["humidity", "illumination", "occupancy", "temperature"]
}
```

**Location Breakdown:**
- **Elemental Forces** (2 rooms): hydrogen, dark-matter
- **Community Hubs** (6): cantina, alexandria, makers-space, hive, jungle, babylon
- **Mythos & Media** (4): pluto, artemis, aang, pandora
- **Data Core** (3): b.19, b.18, b.17
- **Innovation & Discovery** (4): otter-space, cape-canaveral, houston, tetandris
- **Conceptual Realms** (8): hans-zimmer, mf-room, w(room), after, present, b4, peace, muted
- **Creative Core** (3): a.26, a.25, a.23

### 2. Entity Binding Architecture
**Document:** `research/HADS-R02-DEVICE-MOBILITY-ARCHITECTURE.md`

**Three Binding Strategies:**

| Strategy | Approach | Pros | Cons |
|----------|----------|------|------|
| **A: Convention** | Entity name encodes location (`sensor.b3_temp`) | Fast, declarative | Brittle, no mobile |
| **B: Registry** | Config file maps entities → locations | Explicit, flexible | Overhead, drift risk |
| **C: Hybrid** ⭐ | Convention + registry + HA attributes | Best of both | Complex logic |

### 3. Device Mobility Tracking
**Three Options:**

1. **HA Native** (WiFi/ZigBee tracking)
   - Device updates `zone.device_location` automatically
   - Real-time, automatic

2. **Manual Webhook** (air-gapped devices)
   - Admin updates location via UI/API
   - Explicit, requires discipline

3. **QR Code Scanning** (physical tagging)
   - Scan QR when device moves
   - Goof-proof, creates audit trail

### 4. Implementation Roadmap

**Phase 1: Fixed Entities (MVP)**
- Convention-based binding
- No mobile support
- Build registry, test on 20-30 entities

**Phase 2: Mobile Entities (Post-MVP)**
- Registry layer for mobile devices
- HA attribute tracking
- Webhook fallback

**Phase 3: Robust Handling (Future)**
- QR code integration
- Analytics dashboard
- Migration tooling

---

## Research Findings

### Current HA Setup (from SVG annotations)

Rooms have sensors for:
- **Common:** temperature, humidity, occupancy, illumination
- **Special:** CO2 (hubs), PM2.5, VOC index, air quality

**Entity Naming Pattern (observed):**
```
sensor.{room_id}_{metric}              // sensor.b3_temperature
sensor.{room_name}_{metric}            // sensor.peace_temperature
{metric}_{room_id}                     // illumination_b3
light.{room}                           // light.cantina
binary_sensor.{room}_occupancy         // binary_sensor.peace_occupancy
```

### Room ID Mapping

| Room ID | Friendly Name | Category |
|---------|---------------|----------|
| a.1 | Babylon | Community Hub |
| a.3 | Hive | Community Hub |
| b.3 | Peace | Conceptual Realm |
| b.5 | Present | Conceptual Realm |
| b.7 | W(room) | Conceptual Realm |
| kitchen | Cantina | Community Hub |
| library | Alexandria | Community Hub |

---

## Scripts Created

### 1. `map-entity-locations.mjs`
Extracts room roster from `rooms_personalities.json` with inferred sensor types.

**Output:**
- `research/ENTITY-LOCATIONS.json` (30 locations)
- `research/LOCATIONS-BY-CATEGORY.json` (grouped by type)

**Run:** `node scripts/map-entity-locations.mjs`

### 2. `fetch-ha-entities.mjs`
Queries HA for all entities, analyzes naming patterns, matches to locations.

**Output:**
- `research/HA-ENTITIES-RAW.json` (all entities)
- `research/ENTITY-LOCATION-MAPPING.json` (matched entities)

**Run:** `node scripts/fetch-ha-entities.mjs`
**Status:** Needs valid HA token (expired in dev environment)

---

## Architecture Decision: Hybrid Binding

### Recommended for MVP

```typescript
interface EntityLocation {
  entityId: string;
  currentLocationId: string;
  homeLocationId: string;
  source: 'convention' | 'registry' | 'attribute' | 'unmapped';
  confidence: 'high' | 'medium' | 'low';
}

function resolveEntityLocation(
  entityId: string,
  convention: ConventionMatcher,
  registry: BindingRegistry,
  haEntity: HAState,
): EntityLocation {
  // Try convention first
  const byConvention = convention.match(entityId);
  if (byConvention) return { currentLocationId: byConvention, source: 'convention' };

  // Try registry
  const byRegistry = registry.lookup(entityId);
  if (byRegistry) return { ...byRegistry, source: 'registry' };

  // Try HA attributes
  const byAttribute = haEntity.attributes?.location;
  if (byAttribute) return { currentLocationId: byAttribute, source: 'attribute' };

  // Mark as unmapped
  return { currentLocationId: undefined, source: 'unmapped' };
}
```

### Why Hybrid?

1. **Declarative for 80%:** Most entities follow naming convention, no config needed
2. **Flexible for 20%:** Exceptions use explicit registry
3. **Supports Mobility:** HA attributes override for device location changes
4. **Graceful Degradation:** Unmapped entities marked clearly, don't crash scenes

---

## Open Questions for Next Agent

### Q1: Entity Naming Consistency
**Assumption:** Most entities follow convention `sensor.{room}_{metric}`.
**To Validate:** Fetch actual HA, measure convention match rate.
**If <80% match:** Prioritize registry approach earlier.

### Q2: Mobile Device Frequency
**Assumption:** Only 20% of devices are mobile (portable sensors).
**To Validate:** Interview scene branches, check device inventory.
**If >50% mobile:** Implement Phase 2 earlier.

### Q3: Cross-Scene Entity Requirements
**Assumption:** All three scenes (geospatial, projector, backdrop) need same entities.
**To Validate (HADS-R08):** Check if scene types diverge on entity needs.
**If divergent:** Design per-scene filtering layer.

### Q4: Real-Time Device Movement
**Assumption:** Devices move between scenes, not during rendering.
**To Validate:** Check typical scene duration and device movement frequency.
**If high frequency:** Implement event-driven location sync.

---

## Next Actions (Ordered)

1. **HADS-R07** — Stress test WebSocket reconnection
   - Run socket 10+ times, verify state consistency
   - Identify memory leaks in subscription cleanup

2. **HADS-R08** — Interview scene branches
   - What entities does geospatial scene need?
   - What entities does projector scene need?
   - What entities does backdrop scene need?
   - Are requirements identical?

3. **HADS-R03** — Observer pattern design
   - Pull vs. push trade-offs
   - Event bus architecture
   - TypeScript contracts between scenes and data layer

4. **Start Phase 1 Implementation**
   - Build fixed-entity binding registry
   - Create convention matcher + registry fallback
   - Write tests against real HA data
   - Integrate with SceneManager

---

## Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| HA entity naming varies widely | Hybrid approach with registry fallback |
| Device moves mid-session | Poll location attributes every N seconds |
| Too many unmapped entities | Define fallback strategy (use home location, log warning) |
| Convention logic too complex | Keep simple regex-based, add registry before code golf |
| Scene-specific data needs diverge | Design filtering layer per scene type |

---

## Files Created This Session

```
agents-docs/projects/home-assistant-data-sync/
  research/
    ✅ ENTITY-LOCATIONS.json (30 locations)
    ✅ LOCATIONS-BY-CATEGORY.json (grouped)
    ✅ HADS-R02-DEVICE-MOBILITY-ARCHITECTURE.md (comprehensive)

scripts/
  ✅ map-entity-locations.mjs (extract rooms)
  ✅ fetch-ha-entities.mjs (query HA & match)
```

---

## Session Signature

> Extracted 30 campus locations, designed hybrid entity binding for fixed + mobile devices, proposed 3-phase implementation plan. Device mobility changes architecture—must separate "home location" from "current location." Convention-based binding works for 80%, registry fallback for exceptions. Ready for phase 1 MVP.

**Confidence:** High on architecture, medium on entity naming (depends on HA data validation)

---

## Related Documents

- `research/HADS-R02-DEVICE-MOBILITY-ARCHITECTURE.md` — Full architecture design
- `research/ENTITY-LOCATIONS.json` — Room roster
- `tasks.md` — Updated task ledger with HADS-R02 progress
- `../home-assistant/` — Infrastructure project (tunnels, tokens)
