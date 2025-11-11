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

## Remaining Tasks (⏳ In Backlog)

| ID   | Title                                         | Depends On   | Status | Priority | Notes |
|------|-----------------------------------------------|--------------|--------|----------|-------|
| T-07 | Create UI panels for scene switching & config | T-01         | Todo   | High     | Scene switcher + config panels (stubs exist) |
| T-08 | Implement disposal/memory cleanup testing     | T-02, T-04    | Todo   | Medium   | Stress test, ref counting validation |
| T-09 | Write documentation: how-to-use scene factory | T-03         | Todo   | Medium   | User guide + integration examples |
| SF-DI-001 | Integrate real campus geometry data      | T-04, T-05, T-06 | Todo | High     | Load Floor, roomRegistry, geospatial managers |

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
