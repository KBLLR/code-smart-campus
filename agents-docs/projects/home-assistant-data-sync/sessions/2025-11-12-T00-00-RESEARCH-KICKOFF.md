# Session: HomeAssistant Data Sync — Research Kickoff

**Date:** 2025-11-12
**Duration:** Initialization + Research Planning
**Models consulted:** claude-haiku-4-5-20251001
**Session Type:** Research & Architecture Review

---

## Objectives

1. **Understand the current state** of HA integration code (what works, what's fragile).
2. **Map the data flow** from Home Assistant → 3D scene across geospatial/projector/backdrop variants.
3. **Identify architectural gaps** that prevent robust, scene-agnostic data sync.
4. **Propose a design** for entity binding, state management, and observer patterns.
5. **Create research tasks** that unblock the implementation phase.

---

## Background

The smart campus visualization system has three visual treatments for the same campus geometry:
- **Geospatial** — Accurate coordinates, floor plans (main branch)
- **Projector** — Stylized layout for projection systems (feature/scene-projector branch)
- **Backdrop** — Atmospheric visualization (feature/scene-backdrop branch)

Regardless of which scene is active, **live campus data** (temperature, occupancy, lighting, HVAC status) must sync from Home Assistant (HA) and bind to spatial entities without hard-coupling to any specific visual treatment.

**Current state:** HA integration exists (`HomeAssistantSocket.js`, `haState.js`) but appears to be:
- Tightly coupled to the main scene rendering pipeline
- Missing scene-agnostic abstractions
- Lacking robust error handling and reconnection logic
- Not designed for multi-scene consumption

**Goal:** Build a data sync layer that can support all three scenes (and future variants) independently.

---

## Current Code Audit (HADS-R01)

### Existing Code Paths

#### 1. `src/HomeAssistantSocket.js` (125 LOC)
**Purpose:** WebSocket client for HA state streaming.

**Strengths:**
- Handles auth, reconnection with exponential backoff
- Subscribes to `state_changed` events
- Command abstraction (`sendCommand`) for flexibility
- Manual event subscriptions via `subscribe(eventType, callback)`

**Weaknesses:**
- No request/response tracking (command IDs created but responses never matched)
- Subscriptions map is never cleaned up → potential memory leak
- No validation of incoming messages (assumes well-formed HA responses)
- Silent failures if socket not ready (`console.warn` instead of throwing/callback)
- No configurable reconnection limits (could reconnect infinitely)

#### 2. `src/haState.js` (112 LOC)
**Purpose:** Centralized state store for HA entities.

**Strengths:**
- Simple lookup maps (by entity_id, friendly_name)
- Handles partial updates via `Object.assign`
- Logs entity count on init

**Weaknesses:**
- No event emitters for state changes (consumers must poll or use socket callbacks)
- Friendly name map collision not handled properly (last-write-wins)
- No type information (all objects are `any`)
- No validation that entity structure matches HA schema
- Not reactive (no automatic UI binding triggers)

#### 3. `src/ha.js` (usage pattern)
**Purpose:** Entry point / initialization.

**Observations:**
- Sets up socket + state listeners
- Calls `onStateUpdate` callback for each entity change
- No error boundary or degradation path
- Tightly bound to main.js initialization

#### 4. `src/HomeAssistantSocket.js` — Integration in `src/main.js`
**Observations:**
- HA init happens early, blocks scene setup if HA unavailable
- No fallback if HA can't be reached
- All downstream code assumes HA is always available

---

## Key Findings

### 1. Coupling Issues
- HA initialization is **synchronous** in the main app boot sequence → if HA is unavailable, entire app hangs.
- There's no abstraction layer between "HA API" and "scene data consumers".
- Scenes can't opt in/out of campus data gracefully.

### 2. State Management Gaps
- No observable/reactive state updates → scenes that want live data must poll or use raw socket callbacks.
- Friendly name collisions unhandled.
- No schema validation or type safety.

### 3. Error Resilience
- WebSocket reconnection works but has no limits.
- No circuit breaker pattern (infinite reconnect attempts could hammer server).
- Malformed messages silently fail.
- No offline mode or fallback data.

### 4. Scalability Concerns
- All subscriptions stored in a single map → hard to track which scene/component needs what data.
- No way to unsubscribe cleanly from HA events.
- No batching or throttling of state updates.

### 5. Multi-Scene Binding Unknown
- No clear mapping from HA entity IDs (e.g., `sensor.room_101_temp`) to spatial objects in each scene.
- Unclear how projector/backdrop branches consume campus data.
- No entity binding registry.

---

## Architecture Questions (HADS-R03, HADS-R06)

### Question 1: Entity Binding
**Problem:** How do we map `sensor.room_101_temperature` to a room object in the scene?

**Options:**
- **A) Convention-based:** Entity ID structure matches scene geometry (e.g., `sensor.{room_id}_{metric}`).
  - Pro: Declarative, no extra config
  - Con: Brittle if HA naming changes

- **B) Registry-based:** Maintain a config file mapping HA entities to scene objects.
  - Pro: Flexible, decoupled
  - Con: Extra maintenance, potential for drift

- **C) Query API:** Scenes ask for "all temperature sensors in rooms" and bind dynamically.
  - Pro: Scene-agnostic, flexible
  - Con: Performance overhead if many queries

**Recommendation:** Hybrid approach—prefer convention, fall back to registry, support dynamic queries for complex cases.

### Question 2: State Observation Pattern
**Problem:** Should scenes pull data on-demand or subscribe to a centralized event bus?

**Options:**
- **A) Pull (Query on demand):** Scene asks "give me temp for room 101", gets current state from store.
  - Pro: Simple, no boilerplate, low memory overhead
  - Con: UI won't auto-update unless scene polls

- **B) Push (Event bus):** HA emits event "room_101_temp changed to 22C", scenes that subscribed react.
  - Pro: Reactive, real-time
  - Con: More boilerplate, potential memory leaks

- **C) Hybrid:** Store provides both pull and push APIs.
  - Pro: Flexible for different use cases
  - Con: More code to maintain

**Recommendation:** Hybrid with a preference for push (event bus) for performance-critical bindings and pull for one-off queries.

### Question 3: State Storage
**Problem:** Where should campus state live?

**Options:**
- **A) Volatile memory only:** `haState.js` in-memory store, lost on page refresh.
  - Pro: Simple, fast
  - Con: No offline resilience, no cross-tab sync

- **B) IndexedDB with in-memory cache:** Persist to IDB, keep hot copy in memory.
  - Pro: Offline support, cross-tab sync, fast reads
  - Con: More code, IDB has quota/latency

- **C) Service Worker + sync:** Background sync from HA, push updates to all tabs.
  - Pro: Robust offline, true real-time
  - Con: Complex, not needed for MVP

**Recommendation:** Start with volatile memory (A) for MVP, plan for IndexedDB (B) in phase 2.

---

## Research Tasks (Mapped to HADS-*)

| ID | Task | Impact |
|----|------|--------|
| HADS-R01 | ✅ Audit current HA integration code | Done (above). Document fragility. |
| HADS-R02 | Map HA entities to room/floor geometry | Unblock entity binding abstraction. |
| HADS-R03 | Design scene-agnostic observer pattern | Unblock state sync architecture. |
| HADS-R04 | Evaluate state storage options | Unblock offline resilience planning. |
| HADS-R05 | Document error scenarios & recovery | Unblock reliability runbook. |
| HADS-R06 | Type-safe entity binding proposal | Unblock TypeScript architecture. |
| HADS-R07 | Test current WebSocket reconnection | Validate existing code stability. |
| HADS-R08 | Assess geospatial/projector/backdrop data needs | Ensure abstraction covers all scenes. |

---

## Next Actions

1. **Next agent:** Start with **HADS-R02** (map entities to geometry).
   - Interview each scene type (geosp., proj., backdrop).
   - Collect list of HA entities each needs.
   - Document mapping strategy.

2. **Then HADS-R03** (observer pattern) in parallel.
   - Propose event bus vs. pull trade-offs.
   - Draft TypeScript interfaces for scene ↔ data layer contracts.

3. **Then HADS-R07** (test WebSocket).
   - Stress test current reconnection logic.
   - Identify failure modes that need fixing.

4. **Document findings** in a follow-up session log for architecture design phase.

---

## Open Questions for David

1. **Scene data needs:** Are the three scenes (geospatial, projector, backdrop) all consuming the same campus entities, or do they have different data requirements?
2. **Offline priority:** Is offline support (stale data display) important for MVP, or can we assume HA is always available?
3. **Real-time latency:** What's the acceptable latency for state updates (milliseconds)? Affects caching/batching strategy.
4. **Entity namespace:** Is HA entity naming stable (e.g., `sensor.room_*_temperature`), or can it vary per installation?

---

## Session Signature

> Audited current HA integration for fragility, identified coupling and state management gaps. Mapped 8 research tasks to unblock architecture design. Ready for entity mapping + observer pattern phases.

**Confidence:** High that existing code has issues; medium on proposed solutions (need R02–R03 feedback to validate).

---

## Artifacts

- `agents-docs/projects/home-assistant-data-sync/README.project.md` — Project charter
- `agents-docs/projects/home-assistant-data-sync/tasks.md` — Research task backlog
- This session log
