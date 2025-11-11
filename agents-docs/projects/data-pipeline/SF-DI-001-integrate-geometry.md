# Task: SF-DI-001 - Integrate Real Campus Geometry into Scene Factory

**Date:** 2025-11-11
**Project:** Scene Factory Integration with Data Pipeline
**Priority:** High (blocks full scene factory functionality)
**Status:** Pending

---

## Overview

Integrate real campus geometry data and geospatial components into the `GeospatialScene` stub. This task connects the Scene Factory architecture (T-01, T-03, T-04) with actual Smart Campus data sources.

**Goal:** Make `GeospatialScene` production-ready by loading:
1. Campus floor geometry and room meshes
2. Label system for room identification
3. Geospatial controllers (Sun, Moon, Atmosphere)
4. Material registry and rendering pipeline

---

## Current State

### GeospatialScene (shared/scenes/geospatial/index.ts)
- ✅ Lifecycle hooks implemented (init, activate, deactivate, dispose)
- ✅ UI control schema defined (Sun/Sky, Lighting/FX)
- ✅ Architecture ready for data integration
- ❌ **TODO:** Real campus geometry loading
- ❌ **TODO:** Geospatial controller integration

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

### Phase 1: Campus Geometry Loading (Week 1)

**File:** `shared/scenes/geospatial/index.ts` → `loadCampusGeometry()`

**Tasks:**

1. **Import Floor geometry**
   ```typescript
   // Dynamic import to avoid circular dependencies
   const { Floor } = await import("@three/FloorGeometry.js");
   this.floor = new Floor();
   this.campusGeometryGroup.add(this.floor.mesh);
   ```

2. **Load room registry and attach to scene**
   ```typescript
   const { roomRegistry } = await import("@registries/roomRegistry.js");
   // Iterate roomRegistry and add room meshes to campusGeometryGroup
   // Store reference to roomRegistry in this.roomRegistry for later use
   ```

3. **Initialize material registry**
   ```typescript
   const { materialRegistry } = await import("@registries/materialsRegistry.js");
   // Initialize with renderer and assets
   materialRegistry.init({ renderer: this.renderer });
   this.materialRegistry = materialRegistry;
   ```

4. **Attach scene FOG and appearance**
   ```typescript
   // Copy fog/background from src/scene.js
   const fogColor = new THREE.Color("#13243d");
   const tempScene = new THREE.Scene();
   tempScene.fog = new THREE.FogExp2(fogColor, 0.0009);
   tempScene.background = new THREE.Color("#0f1419");
   ```

**Deliverables:**
- Campus geometry visible in GeospatialScene
- Rooms render with proper materials
- No broken imports or circular dependencies

---

### Phase 2: Geospatial Controller Integration (Week 1-2)

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
