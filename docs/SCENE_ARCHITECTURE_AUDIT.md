# Scene Architecture Audit & Critical Issues

**Date:** 2025-11-19
**Issue:** Scene views (Geospatial, Projector, Backdrop) not rendering
**Root Cause:** Scene system not integrated into main render loop

---

## Executive Summary

The Smart Campus project has **two conflicting rendering pipelines** that are not properly integrated:

1. **Legacy Pipeline** (src/scene.js + src/main.js)
2. **New Scene System** (shared/engine + shared/scenes)

**Critical Issue:** The new scene system is initialized but **never rendered**, causing all three scene views to appear blank.

---

## Architecture Overview

### Three Scene Views

| Scene | Purpose | Material Style | Lighting |
|-------|---------|----------------|----------|
| **Geospatial** | Production campus view with realistic sun/moon/atmosphere | TSL gradient shaders | Sun/Moon directional lights + atmosphere |
| **Backdrop** | Stylized WebGPU aesthetic (inspired by three.js backdrop example) | High-quality PBR, tone mapping | Area lights, warm ambient |
| **Projector** | Projection-ready white canvas | White matte materials | Configurable spotlight with shadows |

### Common Architecture

All three scenes share:
- **CampusAssetLoader**: Loads Floor + SVG-extruded rooms (RoundedBoxGeometry)
- **Material Registry**: Centralized material management
- **Scene Factory**: Singleton scene switcher with lifecycle management
- **SceneBase**: Abstract base class with standardized init/activate/dispose lifecycle

---

## Critical Issues Found

### 1. 🔴 **CRITICAL: Scenes Not Rendering**

**Location:** `src/main.js:1702` (animation loop)

**Problem:**
```javascript
function loop() {
  requestAnimationFrame(loop);
  setup.update?.();
  setup.stats?.update();

  // ... label/HUD updates ...

  // ❌ ONLY renders the legacy scene from scene.js
  if (postProcessor) {
    postProcessor.render();
  } else if (setup.re && scene && setup.cam) {
    setup.re.render(scene, setup.cam);  // ← Only renders scene.js, NOT SceneFactory scenes!
  }
}
```

**Impact:** The SceneFactory's active scene (Geospatial/Backdrop/Projector) is **initialized but never rendered**.

**Fix Required:**
```javascript
function loop() {
  requestAnimationFrame(loop);

  // Update
  setup.update?.();
  setup.stats?.update();

  // Update scene factory if active
  if (window.sceneFactory) {
    const deltaTime = clock.getDelta();
    window.sceneFactory.update(deltaTime);
  }

  // Render active scene from factory OR fallback to legacy scene
  if (window.sceneFactory && window.sceneFactory.getActive()) {
    window.sceneFactory.render();  // ← Render scene factory's active scene
  } else if (postProcessor) {
    postProcessor.render();
  } else if (setup.re && scene && setup.cam) {
    setup.re.render(scene, setup.cam);  // Legacy fallback
  }
}
```

---

### 2. ⚠️ **Toon Shader TSL Syntax Error**

**Location:** `src/three/materials/ToonShaderMaterial.js:114-118`

**Problem:**
- Used `viewDirection` which doesn't exist as a direct TSL import
- Caused shader compilation errors in WebGPU renderer

**Status:** ✅ **FIXED**
- Replaced with `normalView.z` based fresnel approximation
- Removed unused imports (`abs`, `max`, `viewDirection`)

---

### 3. ⚠️ **Material System Inconsistency**

**Problem:** Two material creation paths:
1. **Legacy**: `RoundedBlockGenerator.js` creates "roomToon" materials directly
2. **Scene System**: `CampusAssetLoader.ts` creates "roomBase" materials

**Impact:** Inconsistent material application between legacy and scene views

**Recommendation:**
- Make CampusAssetLoader accept `materialType` parameter
- Allow scenes to specify which material preset they want
- Or: scenes replace materials after loading (current approach)

---

### 4. ℹ️ **Scene Factory Not in Render Loop**

**Location:** `src/main.js:469-491` (SceneManager initialization)

**Current State:**
```javascript
whenReady("roundedRoomsGroup", async () => {
  const sceneManager = await SceneManager.initialize(canvas, setup.re);
  window.sceneFactory = sceneManager.getSceneFactory();
  window.sceneManager = sceneManager;

  // Scene switcher UI is wired
  sceneSwitcher.sceneFactory = sceneManager.getSceneFactory();
  // ... but scenes are never rendered in loop()!
});
```

**Issue:** SceneManager initializes successfully, but scenes remain invisible because they're not rendered.

---

## Detailed Scene Breakdown

### Geospatial Scene

**File:** `shared/scenes/geospatial/index.ts`

**Features:**
- ✅ Campus geometry (Floor + rooms from SVG)
- ✅ TSL-based gradient materials
- ✅ Sun/Moon directional lights
- ⚠️ GeospatialManager (optional, may not be implemented)
- ⚠️ Atmosphere rendering (optional)
- ✅ Room labels (via LabelLayoutManager)

**Build Pipeline:**
1. Initialize material registry
2. Load campus geometry via CampusAssetLoader
3. Setup sun/moon directional lights
4. Initialize geospatial components (if available)
5. Setup room labels
6. Configure fog/appearance

**Status:** ⚠️ **Code complete, but not rendering** (needs loop integration)

---

### Backdrop Scene

**File:** `shared/scenes/backdrop/index.ts`

**Features:**
- ✅ Campus geometry (same as Geospatial)
- ✅ Stylized backdrop aesthetic (inspired by three.js webgpu_backdrop_area.html)
- ✅ Area light (RectAreaLight) for soft illumination
- ✅ Tone mapping config (exposure, contrast, glossiness)
- ✅ Adjustable lighting mood (intensity, warmth)

**Build Pipeline:**
1. Initialize material registry
2. Load campus geometry
3. Setup area light aesthetic
4. Configure darker fog/background

**Aesthetic Notes:**
- Darker fog: `#0f0f0f` vs Geospatial `#13243d`
- Higher fog density: `0.0015` vs `0.0009`
- Soft area lighting for WebGPU backdrop look

**Status:** ⚠️ **Code complete, but not rendering** (needs loop integration)

---

### Projector Light Scene

**File:** `shared/scenes/projectorLight/index.ts`

**Features:**
- ✅ Campus geometry (same base)
- ✅ White canvas materials (matte, projection-ready)
- ✅ Configurable SpotLight (projector simulation)
- ✅ High-quality shadow mapping (4096x4096)
- ✅ Light cone helper visualization
- ✅ Physical projector body mesh

**Build Pipeline:**
1. Initialize material registry
2. Load campus geometry
3. Replace all room materials with white canvas (`MeshStandardMaterial` with `color: 0xffffff`)
4. Setup projector spotlight with shadows
5. Create light cone helper

**Projector Config:**
- Intensity: 200
- Angle: π/3 (60°)
- Shadow map: 4096x4096
- Position: (0, 80, 50)

**Status:** ⚠️ **Code complete, but not rendering** (needs loop integration)

---

## Shared Components

### Campus Asset Loader

**File:** `shared/scenes/_shared/CampusAssetLoader.ts`

**Purpose:** Modular geometry pipeline extracted from main.js

**Pipeline:**
1. Create floor (PlaneGeometry with floorPlate material)
2. Load SVG floorplan
3. Extract shapes → RoundedBoxGeometry
4. Apply materials (currently "roomBase" hardcoded)
5. Apply SVG transforms (scale 0.1, rotate Y π, center)

**Returns:** CampusAsset object with:
- `floorMesh`: THREE.Mesh
- `roomGroup`: THREE.Group (50+ room meshes)
- `roomMeshes`: Map<string, THREE.Mesh>
- `roomRegistry`: Room metadata
- `sceneConfig`: Fog/background colors
- `dispose()`: Cleanup method

**Issue:** Material type is hardcoded as "roomBase" (line 185)

**Recommendation:** Add `materialType` parameter:
```typescript
interface CampusAssetLoaderConfig {
  // ... existing fields ...
  materialType?: string;  // "roomBase" | "roomToon" | "custom"
}
```

---

### Scene Factory

**File:** `shared/engine/SceneFactory.ts`

**Architecture:** Singleton factory pattern

**Features:**
- ✅ Scene registration by key
- ✅ Lifecycle management (init → activate → deactivate → dispose)
- ✅ Shared renderer & AssetManager
- ✅ Window resize handling
- ✅ Custom event dispatch

**Lifecycle:**
```
register("geospatial", geospatialScene)
  ↓
activate("geospatial")
  → deactivate previous scene
  → dispose previous scene
  → init new scene (if needed)
  → activate new scene
  → dispatch "scene-activated" event
```

**Missing:** Integration into main render loop!

---

### Scene Base (Abstract)

**File:** `shared/engine/SceneBase.ts`

**Responsibilities:**
- Setup camera from config
- Setup lights from config
- Load environment maps
- Call subclass `build()` method
- Register/unregister UI controls
- Handle window resize

**Lifecycle Hooks:**
- `build()`: Build scene geometry (async)
- `onActivate()`: Called when scene becomes active
- `onDeactivate()`: Called when scene is switched away
- `onDispose()`: Cleanup resources (async)
- `onUpdate(deltaTime)`: Per-frame update
- `onResize(width, height)`: Handle window resize

**All THREE.js objects** are children of `this.group` (THREE.Group), which is added/removed from renderer as a unit.

---

## Rendering Pipeline Comparison

### Legacy Pipeline (Currently Active)

```
main.js:loop()
  ↓
scene.js (THREE.Scene with room meshes)
  ↓
setup.re.render(scene, setup.cam)
```

**Features:**
- ✅ Works with existing HUD, labels, picking
- ✅ Integrated with postprocessing (WebGL only)
- ✅ Supports SVGCoordinateDebugger
- ✅ RoomsManager orchestration

---

### Scene Factory Pipeline (Not Active)

```
main.js:loop()
  ↓
sceneFactory.update(deltaTime)  ← NOT CALLED!
sceneFactory.render()            ← NOT CALLED!
  ↓
activeScene.group (THREE.Group)
  ↓
setup.re.render(activeScene.group, activeScene.camera)
```

**Issues:**
- ❌ `update()` never called → scenes don't animate
- ❌ `render()` never called → scenes invisible
- ❌ Uses separate camera from `setup.cam` → controls don't work
- ❌ No HUD/label integration
- ❌ No picking integration
- ❌ No postprocessing integration

---

## Commonalities Between Scenes

All three scenes share:

1. **Geometry Source**: SVG floorplan (`/floorplan.svg`)
2. **Mesh Type**: RoundedBoxGeometry (extruded 3D blocks)
3. **Floor**: PlaneGeometry with floorPlate material
4. **Material Registry**: Centralized material system
5. **Lifecycle**: SceneBase abstract class
6. **Coordinate System**: SVG → World transform (scale 0.1, rotate Y π)

**Differences:**

| Aspect | Geospatial | Backdrop | Projector |
|--------|------------|----------|-----------|
| **Materials** | TSL gradient | PBR (tone mapped) | White canvas |
| **Lighting** | Sun/Moon directional | Area light + ambient | Spotlight + ambient |
| **Atmosphere** | Geospatial manager | None | None |
| **Shadows** | Yes (sun) | No | Yes (projector) |
| **Post FX** | Bloom | Tone mapping | Shadows only |

---

## Implementation Tasks

### Phase 1: Critical Fixes (Immediate)

- [x] **Fix toon shader TSL syntax** (`ToonShaderMaterial.js`)
- [ ] **Integrate SceneFactory into render loop** (`main.js:1702`)
  - Add `sceneFactory.update(deltaTime)` before render
  - Add `sceneFactory.render()` with conditional logic
  - Add fallback to legacy scene when no scene active
- [ ] **Test all three scenes render correctly**
  - Switch to Geospatial → verify sun/moon/rooms render
  - Switch to Backdrop → verify area light aesthetic
  - Switch to Projector → verify white canvas + spotlight

### Phase 2: Integration (High Priority)

- [ ] **Camera integration**
  - Scene cameras should use `setup.cam` instead of creating new cameras
  - Or: sync scene camera position with `setup.cam`
- [ ] **Controls integration**
  - OrbitControls should work with scene cameras
  - Or: scenes use shared camera
- [ ] **HUD/Label integration**
  - Labels should update for active scene's room meshes
  - Or: disable labels when scene system is active
- [ ] **Picking integration**
  - Picking should work with scene system's room meshes
  - Update `RoomSelectionController` to use active scene's meshes

### Phase 3: Material System (Medium Priority)

- [ ] **CampusAssetLoader material parameterization**
  - Add `materialType` config parameter
  - Allow scenes to specify "roomBase" vs "roomToon" vs custom
- [ ] **Material switching API**
  - Add method to swap materials on loaded scene
  - Support dynamic material changes (Geospatial → toon)

### Phase 4: Polish (Low Priority)

- [ ] **Scene transition effects**
  - Fade in/out between scenes
  - Loading indicators
- [ ] **UI control binding**
  - Wire scene-specific controls to UIL panel
  - Show/hide controls based on active scene
- [ ] **Performance optimization**
  - Shared geometry between scenes (don't reload SVG 3x)
  - Material caching
  - Dispose inactive scenes to free memory

---

## Recommendations

### Immediate Actions

1. **Fix render loop** - This is blocking everything
2. **Test scene switching** - Verify all three scenes work
3. **Choose camera strategy** - Shared vs per-scene cameras

### Architecture Decisions

**Option A: Dual System (Recommended for now)**
- Keep legacy system as default
- Scene system as optional alternative
- User chooses which to use via SceneSwitcher

**Option B: Migrate to Scene System**
- Remove legacy scene.js
- Make Geospatial the new default
- Update all integrations (HUD, picking, labels)

**Option C: Hybrid**
- Legacy system renders main scene
- Scene system renders to offscreen canvas
- Composite both (complex, not recommended)

### Testing Checklist

After fixing render loop, verify:

- [ ] Default view (legacy) works
- [ ] Geospatial scene renders with sun/moon
- [ ] Backdrop scene renders with area light aesthetic
- [ ] Projector scene renders with white canvas + spotlight
- [ ] Scene switching is smooth (no flickering)
- [ ] Camera/controls work in all scenes
- [ ] HUD/labels update correctly (or disabled)
- [ ] Picking works in all scenes (or disabled)
- [ ] Performance is acceptable (60fps with 50+ rooms)

---

## Conclusion

The Smart Campus scene system is **architecturally sound but not operational** due to missing render loop integration. The fix is straightforward (5-10 lines of code), but requires careful testing to ensure:

1. Scene rendering works correctly
2. No interference with legacy system
3. Proper camera/control integration
4. HUD/picking/label compatibility

Once the render loop is fixed, all three scenes should be immediately functional, as their build pipelines are complete and correct.

**Priority:** 🔴 **CRITICAL** - Without render loop integration, the entire scene system is non-functional.

---

**Next Steps:**
1. Apply render loop fix to `main.js`
2. Test all three scenes
3. Document camera integration strategy
4. Plan HUD/picking migration

**Estimated Time:** 1-2 hours for basic integration, 4-8 hours for full integration with HUD/picking/labels.
