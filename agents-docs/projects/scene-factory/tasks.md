# Scene Factory Task List

## Core Architecture (✅ Complete)

| ID   | Title                                         | Depends On   | Status     | Commit | Notes |
|------|-----------------------------------------------|--------------|-----------|--------|-------|
| T-01 | Define API spec for SceneFactory & SceneBase | –            | ✅ Done   | 96c76eb | Complete TypeScript interfaces, lifecycle flows, memory strategy |
| T-03 | Scaffold folder layout and module stubs      | T-01         | ✅ Done   | 96c76eb | 13 files, @shared/* aliases, all modules structured |
| T-02 | Design AssetManager caching & reference logic| T-01         | ✅ Done   | 96c76eb | Implemented in AssetManager.ts with ref counting + memory est. |

## Scene Implementations (✅ Complete)

| ID      | Title                                    | Depends On | Status     | Commit | Completion Details |
|---------|------------------------------------------|------------|-----------|--------|-------------------|
| T-04    | Implement GeospatialScene               | T-03       | ✅ Done   | 306457e | Campus 3D + geospatial (Sun, Moon, Atmosphere) |
| T-04b   | Add UI controls to GeospatialScene      | T-04       | ✅ Done   | 306457e | Sun/Sky + Lighting/FX controls |
| T-05    | Implement BackdropScene                 | T-03       | ✅ Done   | f3f9a2e | Sky dome visualization, minimal footprint |
| T-06    | Implement ProjectorLightScene           | T-03       | ✅ Done   | f3f9a2e | Spotlight + shadows, test geometry |

## Data Integration Tasks (In Progress)

| ID        | Title                                    | Depends On | Status  | Priority | Effort | Notes |
|-----------|------------------------------------------|-----------|---------|----------|--------|-------|
| SF-DI-P0  | Create shared campus geometry loader     | —         | Todo    | High     | 1-2h   | Utility to load Floor + roomRegistry once |
| SF-DI-1a  | Complete GeospatialScene implementation | SF-DI-P0  | Todo    | High     | 6-8h   | TSL shaders, Sun/Moon, Atmosphere, labels |
| SF-DI-1b  | Complete BackdropScene implementation   | SF-DI-P0  | Todo    | High     | 4-6h   | WebGPU backdrop aesthetic, tone mapping |
| SF-DI-1c  | Complete ProjectorLightScene implementation | SF-DI-P0 | Todo    | High     | 3-4h   | White canvas, projection-ready |
| SF-DI-P2  | Testing & optimization                   | All 1a-1c | Todo    | Medium   | 2-3h   | Memory, visual, performance validation |

## Remaining Tasks (⏳ In Backlog - Post Data Integration)

| ID   | Title                                         | Depends On       | Status | Priority | Notes |
|------|-----------------------------------------------|------------------|--------|----------|-------|
| T-07 | Create UIL panels (scene switcher + config)  | SF-DI-1a/1b/1c  | Todo   | High     | Wire SceneFactory to UIL |
| T-08 | Memory cleanup testing                       | SF-DI-P2        | Todo   | Medium   | Stress test ref counting |
| T-09 | How-to documentation (scene factory usage)   | T-07            | Todo   | Medium   | User guide + examples |

---

## Session: 2025-11-11 (One-Day Sprint)

**Goal:** Build Scene Factory core + all scene variants

### Completed This Session

✅ **T-01: API Specification** (Commit 96c76eb)
- Full TypeScript interfaces for SceneFactory, SceneBase, AssetManager, SceneConfig
- Lifecycle flows with pseudocode
- Memory management strategy (reference counting)
- UI integration patterns
- WebGPU-specific considerations

✅ **T-03: Scaffold Folder Structure** (Commit 96c76eb)
- `shared/engine/` — Core factory + asset manager
- `shared/scenes/` — Scene implementations (geospatial, backdrop, projectorLight)
- `shared/ui/` — Scene switcher & config panels
- Updated tsconfig with @shared/* path alias
- 13 new TypeScript files, all properly organized

✅ **T-02: AssetManager Implementation** (Commit 96c76eb)
- Reference-counted caching for Textures, Geometries, Models
- Methods: getTexture(), getGeometry(), getModel(), release(), clearUnused()
- Memory estimation + stats reporting
- GLTFLoader integration

✅ **T-04: GeospatialScene Implementation** (Commit 306457e)
- Complete lifecycle: init → activate → deactivate → dispose
- Campus geometry loading stub (ready for Floor + roomRegistry)
- Geospatial components stubs (Sun, Moon, Atmosphere)
- UI controls config: Sun/Sky (arcOpacity), Lighting/FX (bloom)
- UI bindings for real-time updates
- Resource disposal pattern in place

✅ **T-05: BackdropScene Implementation** (Commit f3f9a2e)
- Lightweight sky dome scene
- Config-driven UI: Sky color picker, rotation slider
- Performance-optimized (no heavy geometry)
- Useful for atmospheric previews + testing

✅ **T-06: ProjectorLightScene Implementation** (Commit f3f9a2e)
- Spotlight visualization with shadows
- Target geometry: floor + 3 boxes for shadow demo
- UI controls: Light enabled, color, intensity, angle, shadows
- SpotLightHelper for cone visualization
- Real-time parameter adjustment

✅ **SF-DI-001: Data Integration Plan** (agents-docs/projects/data-pipeline/)
- 4-phase integration roadmap
- Phase 1: Campus geometry (Floor, roomRegistry, materials)
- Phase 2: Geospatial controllers (Sun, Moon, Atmosphere)
- Phase 3: UI control wiring
- Phase 4: Testing & optimization
- Technical considerations + risk assessment

### Not Started (Backlog)

⏳ **T-07:** Scene switcher & config panels (UIL integration)
⏳ **T-08:** Memory cleanup testing (stress test ref counting)
⏳ **T-09:** How-to documentation (user guide)

---

## Architecture Summary

```
SceneFactory (Singleton)
├── renderer (shared WebGPU/WebGL)
├── assetManager (ref-counted assets)
└── scenes (Map<string, SceneBase>)
    ├── GeospatialScene (production, campus 3D)
    ├── BackdropScene (lightweight sky)
    └── ProjectorLightScene (testing, lights)

Each Scene:
├── config (SceneConfig)
├── lifecycle (init → activate → deactivate → dispose)
├── group (THREE.Group with camera + geometry)
└── uiControls (dynamic bindings)
```

---

## Key Decisions Made

1. **Single shared WebGPURenderer** — All scenes share one renderer instance
2. **Reference-counted assets** — Prevent memory leaks on scene switching
3. **Config-driven UI** — Each scene defines its own control schema
4. **Lazy component loading** — GeospatialScene loads Sun/Moon/Atmosphere dynamically
5. **Data integration deferred** — SF-DI-001 task for real geometry loading
6. **No breaking changes** — Factory coexists with existing src/scene.js

---

## Next Steps (Post-Sprint)

1. **SF-DI-001:** Integrate real campus geometry + geospatial managers
2. **T-07:** Wire UIL panels to SceneFactory
3. **T-08:** Memory + performance testing
4. **T-09:** Final documentation

---

**Status Date:** 2025-11-11 EOD
**Architecture Complete:** Yes ✅
**Production Ready:** Pending data integration (SF-DI-001)

---

## Session: 2025-11-11 (Evening - Data Integration Planning)

**Clarification:** All scenes share same campus geometry, differ only in visual treatment

### Vision Confirmed

- **Shared:** Floor geometry, room meshes, room labels, camera baseline, data
- **Per-scene:** Material shaders, lighting approach, visual mood, configurables

### New Structure (SF-DI-001 Updated)

**Phase 0:** Shared campus geometry loader (1-2h)
- Create `campusGeometryLoader.ts` utility
- Load Floor + roomRegistry once, reusable across scenes

**Phase 1a:** GeospatialScene (6-8h)
- TSL shaders (realistic, sun-responsive)
- Sun/Moon directional lights + Atmosphere
- Full UI controls + labels

**Phase 1b:** BackdropScene (4-6h)
- WebGPU backdrop aesthetic (tone mapping, etc.)
- Follow three.js webgpu_backdrop_area.html pattern
- Full UI controls + labels

**Phase 1c:** ProjectorLightScene (3-4h)
- White canvas materials (rough/smooth)
- Projection mapping ready
- Full UI controls + labels

**Phase 2:** Testing & optimization (2-3h)

### Next Action

Start with Phase 0 + Phase 1a (GeospatialScene implementation)
