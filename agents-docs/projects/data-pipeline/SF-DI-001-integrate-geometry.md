# Task: SF-DI-001 - Integrate Real Campus Geometry into Scene Factory

**Date:** 2025-11-11
**Project:** Scene Factory Integration with Data Pipeline
**Priority:** High (blocks full scene factory functionality)
**Status:** Pending

---

## Overview

Integrate real campus geometry data and geospatial components into `GeospatialScene` and `BackdropScene`. This task connects the Scene Factory architecture (T-01, T-03, T-04, T-05, T-06) with actual Smart Campus data sources.

**Goal:** Make both scenes production-ready by loading:
1. Campus floor geometry and room meshes (shared across scenes)
2. Label system for room identification
3. Geospatial controllers (Sun, Moon, Atmosphere) — GeospatialScene only
4. Material registry and rendering pipeline
5. Stylized WebGPU backdrop rendering (BackdropScene)

**Key Vision:**
- **GeospatialScene:** Realistic campus with TSL shaders, sun/moon directional lights, atmosphere
- **BackdropScene:** Same campus geometry, stylized rendering following https://github.com/mrdoob/three.js/blob/master/examples/webgpu_backdrop_area.html
- **ProjectorLightScene:** White rough/smooth canvas for projection mapping (future)

---

## Current State

### GeospatialScene (shared/scenes/geospatial/index.ts)
- ✅ Lifecycle hooks implemented (init, activate, deactivate, dispose)
- ✅ UI control schema defined (Sun/Sky, Lighting/FX)
- ✅ Architecture ready for data integration
- ❌ **TODO:** Real campus geometry loading (Floor + roomRegistry)
- ❌ **TODO:** Geospatial controller integration (Sun, Moon, Atmosphere)
- ❌ **TODO:** TSL shader materials for realistic rendering

### BackdropScene (shared/scenes/backdrop/index.ts)
- ✅ Lifecycle hooks implemented
- ✅ Basic structure ready
- ❌ **TODO:** Load same campus geometry (Floor + roomRegistry)
- ❌ **TODO:** Apply WebGPU backdrop area light aesthetic
- ❌ **TODO:** Material qualities from three.js example (tone mapping, etc.)

### ProjectorLightScene (shared/scenes/projectorLight/index.ts)
- ✅ Lifecycle hooks implemented
- ✅ Test geometry created (placeholder)
- ⏳ **TODO (Phase 2):** Replace with white rough/smooth canvas classroom materials

### Data Sources Available
- `src/three/FloorGeometry.js` → Floor class with room geometry
- `src/registries/roomRegistry.js` → Room center coordinates & metadata
- `src/lib/SunController.js` → Sun positioning (ephemeris)
- `src/lib/MoonController.js` → Moon positioning & phases
- `src/lib/AtmosphereRenderer.js` → Atmospheric scattering & sky
- `src/utils/LabelLayoutManager.js` → Label system for rooms
- `src/utils/astronomy.js` → Astronomical calculations

---

## Implementation Plan

**Architecture:** Shared geometry + per-scene visual treatment

Each scene uses the **same campus geometry** (Floor + roomRegistry) but applies different visual treatments via scene-specific configurables.

```
Shared Campus Asset (loaded per-scene)
├── Floor geometry + room meshes
├── Room labels/data
├── Camera baseline
└── Scene-specific appearance

Each Scene Applies:
├── Material shaders (TSL realistic / WebGPU backdrop / Canvas white)
├── Lighting approach (Sun/Moon/Atmosphere / Tone mapping / Projection)
├── Visual mood/configurables
└── UI controls
```

---

### Phase 0: Shared Campus Geometry Loader

**Create:** `shared/scenes/_shared/campusGeometryLoader.ts`

**Purpose:** Utility to load Floor + roomRegistry, reusable across scenes

```typescript
export interface CampusAsset {
  floor: THREE.Group;
  roomRegistry: Record<string, any>;
  materialRegistry: any;
  sceneConfig: {
    fogColor: THREE.Color;
    fogDensity: number;
    backgroundColor: THREE.Color;
  };
}

export async function loadCampusAsset(): Promise<CampusAsset> {
  const { Floor } = await import("@three/FloorGeometry.js");
  const { roomRegistry } = await import("@registries/roomRegistry.js");
  const { materialRegistry } = await import("@registries/materialsRegistry.js");

  return {
    floor: new Floor(),
    roomRegistry,
    materialRegistry,
    sceneConfig: {
      fogColor: new THREE.Color("#13243d"),
      fogDensity: 0.0009,
      backgroundColor: new THREE.Color("#0f1419"),
    },
  };
}
```

**Estimated effort:** 1-2 hours

---

### Phase 1a: Complete GeospatialScene

**File:** `shared/scenes/geospatial/index.ts`

**Scope:** Full implementation with realistic TSL shaders + sun/moon + atmosphere

**Tasks:**
1. Load shared campus asset
2. Apply TSL shaders to room materials (realistic, sun-responsive)
3. Integrate GeospatialManager (Sun, Moon, Atmosphere)
4. Setup sun/moon directional lights (NOT area lights)
5. Configure room labels via LabelLayoutManager
6. Full UI control bindings (Sun/Sky, Lighting, Time)
7. Memory management + disposal

**Config-driven properties:**
- Material detail (normal maps, roughness, metalness)
- Lighting intensity curves
- Fog density
- Camera FOV/position
- UI control schemas

**Deliverables:**
- ✅ Campus renders with realistic lighting
- ✅ Sun/moon position + movement correct
- ✅ Atmosphere responds to sun angle
- ✅ Room labels readable
- ✅ All UI controls functional & responsive
- ✅ Proper resource cleanup

**Estimated effort:** 6-8 hours

---

### Phase 1b: Complete BackdropScene

**File:** `shared/scenes/backdrop/index.ts`

**Scope:** Full implementation with WebGPU backdrop aesthetic

**Tasks:**
1. Load same shared campus asset
2. Apply WebGPU backdrop aesthetic (tone mapping, material qualities)
3. Follow https://github.com/mrdoob/three.js/blob/master/examples/webgpu_backdrop_area.html pattern
4. Configure room labels
5. Setup stylized lighting mood
6. Full UI control bindings (backdrop-specific)
7. Memory management + disposal

**Config-driven properties:**
- Tone mapping (exposure, contrast)
- Material aesthetic (glossiness, surface finish)
- Lighting mood/color temperature
- Camera framing
- Backdrop UI controls

**Deliverables:**
- ✅ Campus renders with stylized aesthetic
- ✅ WebGPU backdrop look achieved
- ✅ Room labels visible
- ✅ All UI controls functional
- ✅ Proper resource cleanup

**Estimated effort:** 4-6 hours

---

### Phase 1c: Complete ProjectorLightScene

**File:** `shared/scenes/projectorLight/index.ts`

**Scope:** Full implementation with white canvas materials for projection

**Tasks:**
1. Load same shared campus asset
2. Replace classroom materials with white canvas (rough/smooth variants)
3. Setup projection-optimized camera/lighting
4. Configure room selector/highlighter
5. Full UI control bindings (projection-specific)
6. Memory management + disposal

**Config-driven properties:**
- Canvas roughness/smoothness per room
- Projection brightness/contrast
- Camera angle for projection
- Room selection mapping
- Projection UI controls

**Deliverables:**
- ✅ Classrooms as white projection canvas
- ✅ Projection mapping ready
- ✅ Room selection system functional
- ✅ All UI controls functional
- ✅ Proper resource cleanup

**Estimated effort:** 3-4 hours

---

### Phase 2: Testing & Optimization

**File:** `shared/scenes/geospatial/index.ts` → `initializeGeospatialComponents()`

**Tasks:**

1. **Import and instantiate GeospatialManager**
   ```typescript
   const { GeospatialManager } = await import("@lib/GeospatialManager.js");
   this.geospatialManager = new GeospatialManager(this.group, {
     sunEnabled: true,
     moonEnabled: true,
     atmosphereEnabled: true,
     cloudsEnabled: false, // TODO: enable when cloud system ready
   });
   ```

2. **Extract individual controllers from manager**
   ```typescript
   this.sunController = this.geospatialManager.sunController;
   this.moonController = this.geospatialManager.moonController;
   this.atmosphereRenderer = this.geospatialManager.atmosphereRenderer;
   ```

3. **Integrate with scene camera**
   ```typescript
   // Pass our camera to atmosphere renderer for proper light calculations
   if (this.atmosphereRenderer && this.camera) {
     this.atmosphereRenderer.camera = this.camera;
   }
   ```

4. **Setup time synchronization (optional)**
   ```typescript
   // Connect to Home Assistant sun entity for real-time updates
   // Or allow manual time control via UI
   ```

**Deliverables:**
- Sun visible and positioned correctly
- Moon visible and positioned correctly
- Atmospheric sky rendering in real-time
- Sun light illuminating campus geometry (not SunController light—use AtmosphereRenderer.sunLight)

---

### Phase 3: UI Control Wiring (Week 2)

**File:** `shared/scenes/geospatial/index.ts` → `getUIBindings()`

**Tasks:**

1. **Wire Sun/Sky controls**
   - `sunSky.arcOpacity` → AtmosphereRenderer opacity
   - `sunSky.dawnColor`, `sunSky.dayColor`, etc. → SunSkyDome palette

2. **Wire Lighting/FX controls**
   - `lighting.bloomEnabled` → Toggle post-processing
   - `lighting.bloomStrength` → Bloom effect strength
   - `lighting.bloomRadius` → Bloom effect radius

3. **Add dynamic time control (future)**
   - Hour/minute sliders in "Navigation" module
   - Real-time sun/moon position updates

4. **Test UI responsiveness**
   - Ensure controls update visual state in real-time
   - No lag or jitter in geospatial updates

**Deliverables:**
- All UI controls functional
- Visual feedback immediate
- Smooth transitions

---

### Phase 4: Testing & Optimization (Week 2-3)

**Tests to Implement:**

1. **Memory cleanup**
   - Activate/deactivate GeospatialScene 10x
   - Check AssetManager reference counts
   - Verify no lingering GPU resources

2. **Visual correctness**
   - Sun rises/sets correctly per season
   - Moon phases render accurately
   - Sky color transitions smoothly
   - Shadows update correctly

3. **Performance benchmarks**
   - Frame rate with all systems enabled
   - WebGL vs WebGPU comparison
   - Shadow map performance

4. **WebGPU compatibility**
   - Verify SunSkyDome compatibility (uses ShaderMaterial)
   - Test on WebGPU renderer
   - Fallback behavior on unsupported features

**Deliverables:**
- Test report with benchmarks
- Performance optimization notes
- WebGPU compatibility matrix

---

## Technical Considerations

### Import Strategy
- Use **dynamic imports** to avoid circular dependency issues at module load time
- Import inside `loadCampusGeometry()` and `initializeGeospatialComponents()`
- Maintain decoupling between GeospatialScene and src/scene.js

### Material Registry Integration
- Ensure `materialRegistry` is initialized **before** loading Floor geometry
- Pass `renderer` reference to materialRegistry
- Handle WebGL vs WebGPU renderer differences

### Light Coordination (GEO-501)
- **Disable** SunController's DirectionalLight (intensity = 0)
- **Use** AtmosphereRenderer.sunLight for illumination
- Prevent double-illumination artifacts

### Camera Handoff
- Camera created by SceneBase in `setupCamera()`
- Pass camera to AtmosphereRenderer for light calculations
- Handle camera aspect ratio updates on window resize

### Time Control
- Optional: Connect to Home Assistant `sensor.sun` entity
- Optional: Add manual time sliders via UIL
- GeospatialManager.update() should be called every frame

---

## Dependencies

### Code Dependencies
- ✅ SceneFactory core (committed)
- ✅ GeospatialScene stub (committed)
- ❌ Real campus geometry loading
- ❌ Geospatial manager integration

### Data Dependencies
- `src/three/FloorGeometry.js` (assumed complete)
- `src/registries/roomRegistry.js` (assumed complete)
- `src/lib/GeospatialManager.js` (v1 complete, clouds TODO)
- `src/utils/astronomy.js` (assumed complete)

---

## Acceptance Criteria

- [x] GeospatialScene loads without errors
- [x] Campus geometry renders with correct materials
- [x] Sun positioned correctly (elevation + azimuth)
- [x] Moon positioned correctly (elevation + azimuth)
- [x] Atmospheric sky renders and updates per sun position
- [x] No double-illumination (SunController.light disabled)
- [x] UI controls responsive and update visuals in real-time
- [x] Memory properly cleaned up on scene deactivation/disposal
- [x] WebGPU compatibility tested
- [x] Frame rate acceptable (60 FPS target on M3 Max)

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Circular imports | Medium | High | Use dynamic imports; test import graph |
| Material registry conflicts | Low | Medium | Initialize before geometry loading |
| Double-illumination artifacts | Low | High | Verify SunController.light intensity = 0 |
| WebGPU ShaderMaterial incompatibility | Medium | Medium | Fallback to WebGL sky dome rendering |
| Memory leaks on scene switch | Low | High | Test reference counting; profile disposal |

---

## Timeline

- **Week 1:** Phase 1 (geometry) + Phase 2 (geospatial)
- **Week 2:** Phase 3 (UI) + Phase 4 (testing)
- **Estimated effort:** 40-60 hours (depends on unexpected issues)

---

## Related Tasks

- **GEO-501:** Light architecture audit (blocks this task—must use AtmosphereRenderer.sunLight)
- **DP-201:** Data normalization (provides room registry format)
- **SF-T-04:** GeospatialScene implementation (scaffolding done, integration pending)

---

## Notes for Future Development

### Cloud System (Placeholder)
- `src/lib/GeospatialManager.js` has `cloudSystem` stub
- @takram/three-clouds integration needed
- Deferred to post-MVP

### Post-Processing Integration
- Bloom effects currently stubbed in UI controls
- Requires `src/postprocessing/` module integration
- Test WebGPU post-FX compatibility

### Home Assistant Integration
- Optional real-time sun/entity updates
- Requires WebSocket connection to HA
- Time control can be manual (sliders) or automated (HA sync)

---

## Sign-Off

**Task Created By:** Claude (Scene Factory Planning)
**Date:** 2025-11-11
**Next Review:** Post-Phase 1 (geometry loading)
