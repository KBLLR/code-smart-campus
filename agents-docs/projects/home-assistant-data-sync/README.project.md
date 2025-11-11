# HomeAssistant Data Sync & Integration Layer

**Purpose:** Build a robust, scene-agnostic data synchronization layer that bridges campus telemetry from Home Assistant into the 3D visualization, independent of which visual treatment (geospatial, projector, backdrop) is active.

## Core Challenge

The 3D scene system (`scene-factory` branch) provides multiple visual treatments for the same campus geometry:
- **Geospatial** — accurate floor plans with real coordinates
- **Projector** — stylized visual layout
- **Backdrop** — atmospheric visualization

Regardless of which scene is active, the underlying **campus data** (temperature, occupancy, lights, HVAC, etc.) must sync in real-time from Home Assistant and bind correctly to the spatial entities (rooms, floors, devices) in the visualization.

## Scope

### In Scope
- **Data source abstraction** — Generalize HA connectivity to support REST, WebSocket, and fallback modes
- **Entity mapping** — Map HA entities (sensor.room_temp, light.hallway) to spatial game objects without scene coupling
- **Live sync pipeline** — State change propagation from HA → data store → UI bindings across all scene variations
- **Robustness:** reconnection, error recovery, offline graceful degradation
- **Documentation** — How other projects (scene factory, pages, UI) consume campus data safely

### Out of Scope
- Scene UI/rendering (that's `scene-factory`)
- Data modelling / transformation for analytics (that's `data-pipeline`)
- Page-level presentation logic (that's `pages-integration`)
- HA infrastructure (tunnel, tokens, authentication)

## Key Architecture Questions

1. **Entity Binding:** How do we map HA entity IDs to spatial objects across different scenes?
2. **Observer Pattern:** Should scenes pull campus data on demand, or subscribe to a centralized event bus?
3. **State Persistence:** Where does the "current state" live? In-memory store? Indexed DB? CloudSync?
4. **Offline Mode:** If HA goes down, do scenes show stale data or gracefully degrade?
5. **Type Safety:** How do we type room/device bindings so scenes can't accidentally request non-existent entities?

## Getting Started

1. **Review current code:**
   - `src/HomeAssistantSocket.js` — WebSocket client
   - `src/haState.js` — State store (basic)
   - `src/ha.js` — Entry point usage
   - `agents-docs/projects/home-assistant/` — Infrastructure project (tunnel, tokens)

2. **Understand scene structure:**
   - `shared/ui/SceneManager.ts` — Scene coordination
   - `shared/engine/SceneFactory.ts` — Scene instantiation
   - `feature/scene-backdrop`, `feature/scene-projector` branches

3. **Start with research tasks** below to assess current state and design the abstraction.

## Directory Layout

- `tasks.md` — Canonical backlog (what to do)
- `sessions/` — Per-session research logs and implementation notes
- `future-features/` — Parking lot for post-MVP improvements (caching, offline, sync strategies)

## Success Criteria (MVP)

- ✅ HA data syncs into a centralized, typed store
- ✅ Scenes can request campus entities without knowing the underlying HA API
- ✅ Live state updates propagate to all active scene bindings
- ✅ All three scene types (geospatial, projector, backdrop) render with live data
- ✅ Reconnection + error handling prevent UI crashes
- ✅ Zero scene-specific logic in the HA integration layer
