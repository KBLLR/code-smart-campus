# DP-101 – Telemetry Normalisation Notes

_Draft – 2025-11-06_

## 1. Current Data Flow Snapshot
- **Ingress**  
  - `createHomeAssistantSocket` (duplicated in `src/HomeAssistantSocket.js` and `src/network/HomeAssistantSocket.js`) authenticates and subscribes to `state_changed`.  
  - Initial state dump is passed to `setHaStates` (duplicated in `src/haState.js` and `src/home_assistant/haState.js`) where it is stored verbatim.
  - `handleEntityUpdate` updates the UI + `historyManager` directly from raw HA payloads (no type coercion).
- **Registries**  
  - `generateRoomRegistry`: parses `public/floorplan.svg`, emits lowercase keys (e.g., `a.6`, but also opaque `vector_3`).  
  - `generateLabelRegistry`: fetches `/api/states`, then uses `fuzzyRoomMatch` substring heuristics to attach rooms to entities; outputs ad-hoc metadata (category, priority, icon).
- **Consumers**  
  - Scene HUD (`LabelManager` + `CSSHudManager`) and `SensorDashboard` rely on `cleanedLabelRegistry`.  
  - Panel shell and history use the raw HA objects managed by `haState`.  
  - Legacy HTML dashboards expect a missing `ha-dashboard-bridge.js`, indicating no shared access layer.
- **Static Dumps**  
  - `src/data/static/*` contains entity manifests, room positions, and hard-coded sensor readings that are currently unused but could inform canonical mapping.

## 2. Pain Points Identified
1. **Module drift**: Websocket and state store exist twice with slight differences; difficult to centralise logic or extend instrumentation.
2. **No canonical schema**: Downstream code reads directly from raw HA fields (`state`, `attributes.unit_of_measurement`, etc.), making it hard to reason about units, categories, or numeric values.
3. **Room mapping is heuristic**: `fuzzyRoomMatch` infers locations via string matching, resulting in many skipped entities (as seen in runtime logs).
4. **Room registry ambiguity**: Parser emits non-semantic keys unless the SVG IDs are curated; aliasing currently guesses by splitting on punctuation.
5. **History is volatile**: `HistoryManager` persists to `localStorage` only; the pipeline lacks durable storage or retention policies.
6. **Tooling gaps**: Legacy pages and potential AI consumers lack a supported way to query the latest telemetry or metadata.

## 3. Proposed Normalised Entity Schema
```ts
type NormalisedEntity = {
  entityId: string;          // e.g. "sensor.a6_temperature"
  domain: string;            // e.g. "sensor"
  deviceClass?: string;      // e.g. "temperature"
  state: string;             // raw state
  numericValue?: number;     // parsed if unit + device class imply numeric
  unit?: string;             // canonical unit (°C, %, lux, etc.)
  friendlyName?: string;
  lastChanged?: string;      // ISO timestamp
  lastUpdated?: string;      // ISO timestamp
  attributes: Record<string, unknown>; // untouched HA attributes for reference
  roomId?: string;           // canonical room key (matches room registry)
  category?: string;         // UI grouping (environment, occupancy, etc.)
  priority?: number;         // ordering hint
  icon?: string;             // icon token for HUD/dashboard
  tags?: string[];           // free-form labels (e.g. ["battery", "critical"])
  source: "ws" | "rest" | "synthetic";
};
```

### Room Metadata
```ts
type RoomMeta = {
  roomId: string;            // canonical slug (kitchen, a6, makerspace)
  title: string;             // human-readable name
  aliases: string[];         // string variants for mapping
  center: [number, number, number]; // 3D coordinates from floorplan
  area?: string;             // optional area/zone grouping
  floor?: string;            // optional floor number
};
```

## 4. Normalisation Pipeline (Draft)
1. **Ingress layer**  
   - Unify socket + state store into a single `DataPipeline` module.  
   - On initial dump, convert each HA object into `NormalisedEntity` and populate maps (by `entityId`, by `roomId`, by `domain`).  
   - Stream updates through the same normaliser before emitting events to consumers.
2. **Room resolver**  
   - Replace `fuzzyRoomMatch` with a maintained mapping file (JSON/YAML) combining SVG IDs, human names, and HA area hints.  
   - Add validation step: fail generation if a referenced room is missing in `roomRegistry`.
3. **Registry builder**  
   - Generate `labelRegistry` from normalised data rather than raw HA fetch.  
   - Persist canonical metadata (category, icon, priority) alongside per-entity overrides.
4. **History & snapshots**  
   - Move session history out of `localStorage` into a pluggable storage layer (initially file-based JSON, later cloud/DB).  
   - Support periodic snapshot export to feed analytics/AI consumers.
5. **Access patterns**  
   - Expose selectors (`getByRoom`, `getByCategory`, `searchByTag`) for UIs and future agents.  
   - Provide a lightweight HTTP or worker-based interface so legacy pages can consume the same data without direct HA access.

## 5. Open Questions
- Does the campus HA install expose `area_id` or device registry metadata we can leverage instead of manual mapping?
- Should numeric normalisation handle unit conversion (e.g. Fahrenheit → Celsius) or assume HA returns SI units?
- What retention window is required for historical analytics (hours, days, weeks)?
- Where should the authoritative mapping between rooms, sensors, and labels live (Git-tracked JSON vs external service)?

## 6. Immediate Next Steps
1. ✅ Clean up duplicate modules and scaffold a `DataPipeline` service that wraps socket + state store (2025-11-06).  
2. ✅ Author a room mapping manifest (`src/data/mappings/roomEntityMapping.js`) and wire it into the normaliser (2025-11-06).  
3. Implement a first-pass normaliser that emits `NormalisedEntity` objects and adjusts HUD/dashboard consumers to read from it.  
4. Define validation scripts (lint) to ensure every entity in the mapping resolves to a room center.

> Keep this document updated as DP-101 progresses. Once the schema stabilises, promote it to a formal ADR or project spec.
