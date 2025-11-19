# Scene System Implementation Tasks

**Status:** Toon shader fixed, scene system audited
**Priority:** Critical render loop integration required
**See Also:** `SCENE_ARCHITECTURE_AUDIT.md` for detailed analysis

---

## Phase 1: Critical Render Loop Integration (IMMEDIATE)

### Task 1.1: Fix Animation Loop ⏱️ 30 min

**File:** `src/main.js:1702`

**Current Code:**
```javascript
function loop() {
  requestAnimationFrame(loop);
  setup.update?.();
  setup.stats?.update();

  // ... label updates ...

  if (postProcessor) {
    postProcessor.render();
  } else if (setup.re && scene && setup.cam) {
    setup.re.render(scene, setup.cam);  // ❌ Only renders legacy scene!
  }
}
```

**Required Changes:**
```javascript
function loop() {
  requestAnimationFrame(loop);

  // Calculate delta time
  const deltaTime = clock.getDelta();

  // Update existing systems
  setup.update?.();
  setup.stats?.update();

  // Update scene factory if active
  if (window.sceneFactory) {
    window.sceneFactory.update(deltaTime);
  }

  // Update labels/HUD
  if (labelManager?.useSprites) {
    const activeCamera = window.sceneFactory?.getActive()?.camera || setup.cam;
    labelManager.updateLabelPositions(activeCamera);
  }
  hudManager?.update(window.sceneFactory?.getActive()?.camera || setup.cam);

  // Render: priority to scene factory if active, else legacy
  if (window.sceneFactory && window.sceneFactory.getActive()) {
    // Use scene factory render (handles active scene's camera)
    window.sceneFactory.render();
  } else if (postProcessor) {
    // Legacy postprocessing
    postProcessor.render();
  } else if (setup.re && scene && setup.cam) {
    // Legacy direct render
    setup.re.render(scene, setup.cam);
  }
}
```

**Additional Required:**
Add clock instance at top of main.js:
```javascript
const clock = new THREE.Clock();
```

**Validation:**
- [ ] SceneFactory scenes render when active
- [ ] Legacy scene renders when no scene active
- [ ] No visual flickering during scene switch
- [ ] Frame rate stable (60fps target)

---

### Task 1.2: Test Scene Rendering ⏱️ 15 min

**Steps:**
1. Run dev server
2. Open browser console
3. Click "Geospatial" in scene switcher
   - ✅ Should see campus floor + rooms
   - ✅ Should see sun/moon lights
   - ✅ Console: "[GeospatialScene] Activated"
4. Click "Backdrop"
   - ✅ Should see darker aesthetic with area light
   - ✅ Console: "[BackdropScene] Activated"
5. Click "Projector"
   - ✅ Should see white canvas rooms with spotlight
   - ✅ Should see spotlight cone helper
   - ✅ Console: "[ProjectorLightScene] Activated"

**Troubleshooting:**
- If scenes still blank → check console for init errors
- If camera wrong → scenes might be creating separate cameras (see Phase 2.1)
- If performance issues → check delta time calculation

---

### Task 1.3: Window Resize Integration ⏱️ 10 min

**File:** `src/main.js` (resize handler)

**Find existing:**
```javascript
window.addEventListener('resize', () => {
  // ... existing resize logic ...
});
```

**Add:**
```javascript
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Existing resize logic...
  setup.re.setSize(width, height);
  setup.cam.aspect = width / height;
  setup.cam.updateProjectionMatrix();

  // NEW: Resize scene factory
  if (window.sceneFactory) {
    window.sceneFactory.onWindowResize(width, height);
  }
});
```

**Validation:**
- [ ] Resize browser window → no scene distortion
- [ ] Scene camera aspect updates correctly

---

## Phase 2: Camera & Controls Integration (HIGH PRIORITY)

### Task 2.1: Decide Camera Strategy ⏱️ 1 hour

**Problem:** Each scene creates its own camera from SceneConfig, but OrbitControls use `setup.cam`.

**Option A: Shared Camera (Recommended)**
- Scenes use `setup.cam` instead of creating new cameras
- Minimal code changes
- Controls work immediately

**Implementation:**
```javascript
// In SceneBase.ts:setupCamera()
protected setupCamera(cameraConfig: CameraConfig): void {
  // Check if external camera provided (e.g., setup.cam)
  if ((window as any).setup?.cam) {
    this.camera = (window as any).setup.cam;
    console.log(`[${this.sceneKey}] Using shared camera`);
    return;
  }

  // Fallback: create scene-specific camera
  // ... existing camera creation code ...
}
```

**Option B: Per-Scene Cameras**
- Keep scene cameras separate
- Update OrbitControls target on scene switch

**Implementation:**
```javascript
// In SceneSwitcher or SceneManager
async switchScene(sceneKey) {
  await this.sceneFactory.activate(sceneKey);

  const activeScene = this.sceneFactory.getActive();
  if (activeScene && activeScene.camera) {
    // Update orbit controls to use scene camera
    if (window.orbitControls) {
      window.orbitControls.object = activeScene.camera;
    }
  }
}
```

**Decision Required:** Choose Option A or B based on:
- Do scenes need different camera positions/FOV?
- Should camera state persist when switching scenes?
- How important is OrbitControls compatibility?

---

### Task 2.2: Implement Camera Integration ⏱️ 30 min

**Based on Option A (Shared Camera):**

1. Modify `SceneBase.ts:setupCamera()` (see Option A code above)
2. Test all three scenes use same camera
3. Verify OrbitControls work in all scenes

**Based on Option B (Per-Scene Cameras):**

1. Update `SceneFactory.ts:activate()` to switch controls
2. Store camera state before scene switch (optional)
3. Test controls work in all scenes

---

## Phase 3: Picking & Interaction Integration (HIGH PRIORITY)

### Task 3.1: Update Picking to Use Active Scene ⏱️ 1 hour

**File:** `src/main.js` (picking integration section around line 1629)

**Current:**
```javascript
function setupPickingIntegration(canvas, camera, scene, roomsManager) {
  // ... raycaster setup ...
  const raycaster = new THREE.Raycaster();

  canvas.addEventListener('pointermove', (event) => {
    // ... calculate mouse position ...
    raycaster.setFromCamera(mouse, camera);

    // ❌ Only checks legacy scene
    const intersects = raycaster.intersectObjects(scene.children, true);
    // ...
  });
}
```

**Updated:**
```javascript
function setupPickingIntegration(canvas, camera, scene, roomsManager) {
  const raycaster = new THREE.Raycaster();

  canvas.addEventListener('pointermove', (event) => {
    // Calculate mouse position
    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    // Get active camera and scene
    const activeScene = window.sceneFactory?.getActive();
    const targetCamera = activeScene?.camera || camera;
    const targetGroup = activeScene?.group || scene;

    raycaster.setFromCamera(mouse, targetCamera);

    // Check active scene's objects
    const intersects = raycaster.intersectObjects(targetGroup.children, true);

    // Find room mesh
    let roomMesh = null;
    for (const intersect of intersects) {
      if (intersect.object.userData?.roomKey) {
        roomMesh = intersect.object;
        break;
      }
    }

    // Handle highlighting
    if (roomMesh) {
      const roomKey = roomMesh.userData.roomKey;
      if (currentlyHighlightedRoom !== roomKey) {
        // Clear previous highlight
        if (currentlyHighlightedRoom && roomsManager) {
          roomsManager.highlightRoom(currentlyHighlightedRoom, false);
        }

        // Apply new highlight
        if (roomsManager) {
          roomsManager.highlightRoom(roomKey, true);
        }
        currentlyHighlightedRoom = roomKey;
      }
    } else {
      // Clear highlight when not over room
      if (currentlyHighlightedRoom && roomsManager) {
        roomsManager.highlightRoom(currentlyHighlightedRoom, false);
        currentlyHighlightedRoom = null;
      }
    }
  });
}
```

**Validation:**
- [ ] Hover over room in Geospatial scene → highlights
- [ ] Hover over room in Backdrop scene → highlights
- [ ] Hover over room in Projector scene → highlights
- [ ] Switch scenes → picking still works

---

### Task 3.2: Update RoomsManager Integration ⏱️ 30 min

**Problem:** RoomsManager operates on legacy room meshes, but scenes create their own meshes via CampusAssetLoader.

**Options:**

**Option A: Single RoomsManager Instance**
- Update RoomsManager to work with active scene's room meshes
- Get meshes from `sceneFactory.getActive().getRoomMeshes()`

**Option B: Per-Scene RoomsManager**
- Each scene creates its own RoomsManager
- Scene switch updates global roomsManager reference

**Recommended:** Option A (simpler)

**Implementation:**
```javascript
// Modify roomsManager.highlightRoom() to check scene system first
class RoomsManager {
  highlightRoom(roomKey, highlighted) {
    // Try to get room mesh from active scene
    const activeScene = window.sceneFactory?.getActive();
    let roomMesh = null;

    if (activeScene?.getRoomMeshes) {
      roomMesh = activeScene.getRoomMeshes().get(roomKey);
    }

    // Fallback to legacy room meshes
    if (!roomMesh) {
      roomMesh = this.roomMeshes.get(roomKey);
    }

    if (roomMesh) {
      // Apply highlight material
      // ... existing highlight logic ...
    }
  }
}
```

---

## Phase 4: Label & HUD Integration (MEDIUM PRIORITY)

### Task 4.1: Update Labels for Active Scene ⏱️ 45 min

**File:** `src/utils/LabelLayoutManager.js`

**Current:**
```javascript
constructor(group, registryRef = {}, roomRegistry = {}) {
  this.group = group;  // ❌ Hardcoded to legacy scene group
  this.roomRegistry = roomRegistry;
}
```

**Updated:**
```javascript
updateLabelPositions(camera) {
  // Get room meshes from active scene OR legacy
  const activeScene = window.sceneFactory?.getActive();
  const roomMeshes = activeScene?.getRoomMeshes() || this.roomMeshes;

  roomMeshes.forEach((mesh, roomKey) => {
    const label = this.labels.get(roomKey);
    if (label && mesh.visible) {
      // Update label position from mesh
      const worldPos = new THREE.Vector3();
      mesh.getWorldPosition(worldPos);
      // ... update label CSS/sprite position ...
    }
  });
}
```

**Validation:**
- [ ] Labels appear in Geospatial scene
- [ ] Labels hidden/shown correctly in other scenes
- [ ] Labels follow room positions when camera moves

---

### Task 4.2: HUD Camera Sync ⏱️ 15 min

**File:** `src/ui/managers/HudManager.js`

**Update:**
```javascript
update(camera) {
  // Use active scene camera if available
  const activeScene = window.sceneFactory?.getActive();
  const targetCamera = activeScene?.camera || camera;

  // ... update HUD with targetCamera ...
}
```

---

## Phase 5: Material System Improvements (MEDIUM PRIORITY)

### Task 5.1: Parameterize CampusAssetLoader Materials ⏱️ 30 min

**File:** `shared/scenes/_shared/CampusAssetLoader.ts`

**Current:**
```typescript
// Line 185 - hardcoded "roomBase"
const material = this.materialRegistry.create("roomBase", {
  color: colorHex,
  // ...
});
```

**Updated:**
```typescript
export interface CampusAssetLoaderConfig {
  svgURL?: string;
  floorWidth?: number;
  floorHeight?: number;
  floorColor?: number;
  roomHeight?: number;
  fogColor?: string;
  fogDensity?: number;
  backgroundColor?: string;
  materialType?: string;  // NEW: "roomBase" | "roomToon" | custom
  materialOverrides?: Record<string, any>;  // NEW: per-material overrides
}

const DEFAULT_CONFIG: Required<CampusAssetLoaderConfig> = {
  // ... existing defaults ...
  materialType: "roomBase",
  materialOverrides: {},
};

// In loadRoomsFromSVG():
const material = this.materialRegistry.create(
  this.config.materialType,  // Use config instead of hardcoded
  {
    color: colorHex,
    ...this.config.materialOverrides,  // Allow overrides
    roomKey: normId || rawId || null,
  }
);
```

**Update Scenes:**
```typescript
// GeospatialScene
this.campusAsset = await loadCampusAsset(this.materialRegistry, {
  fogColor: "#13243d",
  materialType: "roomBase",  // Gradient shader
});

// BackdropScene
this.campusAsset = await loadCampusAsset(this.materialRegistry, {
  fogColor: "#0f0f0f",
  materialType: "roomBase",  // Can switch to "roomToon" later
});

// ProjectorLightScene
this.campusAsset = await loadCampusAsset(this.materialRegistry, {
  materialType: "canvas",  // Then replace with white in applyCanvasMaterials()
});
```

**Validation:**
- [ ] Geospatial uses gradient materials
- [ ] Can switch Geospatial to toon via config change
- [ ] Projector still applies white canvas correctly

---

### Task 5.2: Add Material Switching API ⏱️ 45 min

**File:** Create `shared/scenes/_shared/MaterialSwitcher.ts`

**Purpose:** Allow runtime material changes on loaded scenes

**API:**
```typescript
export class MaterialSwitcher {
  /**
   * Replace all room materials in a scene
   */
  static replaceRoomMaterials(
    scene: SceneBase,
    materialType: string,
    materialRegistry: any,
    overrides: Record<string, any> = {}
  ): void {
    const roomMeshes = scene.getRoomMeshes();
    if (!roomMeshes) return;

    roomMeshes.forEach((mesh, roomKey) => {
      const oldMaterial = mesh.material;
      const colorHex = mesh.userData?.colorHex || "#2dd4bf";

      const newMaterial = materialRegistry.create(materialType, {
        color: colorHex,
        roomKey,
        ...overrides,
      });

      mesh.material = newMaterial;

      // Dispose old material
      if (oldMaterial instanceof THREE.Material) {
        oldMaterial.dispose();
      }
    });

    console.log(`[MaterialSwitcher] Replaced ${roomMeshes.size} materials with "${materialType}"`);
  }
}
```

**Usage:**
```typescript
// In UI or console:
import { MaterialSwitcher } from "@scenes/_shared/MaterialSwitcher";

const geospatialScene = sceneFactory.getScene("geospatial");
MaterialSwitcher.replaceRoomMaterials(
  geospatialScene,
  "roomToon",  // Switch from gradient to toon!
  materialRegistry,
  { toonSteps: 4, rimPower: 0.8 }
);
```

---

## Phase 6: Polish & UX (LOW PRIORITY)

### Task 6.1: Scene Transition Effects ⏱️ 1 hour

**Goal:** Smooth fade between scenes

**Implementation:**
```typescript
// In SceneFactory.ts:activate()
async activate(sceneKey: string): Promise<void> {
  const nextScene = this.scenes.get(sceneKey);
  if (!nextScene) throw new Error(`Scene "${sceneKey}" not registered`);

  // Fade out current scene
  if (this.activeScene) {
    await this.fadeOut(this.activeScene);
    this.activeScene.deactivate();
    await this.activeScene.dispose();
  }

  // Initialize and fade in new scene
  if (!nextScene.isInitialized) {
    await nextScene.init(this._renderer, this._assetManager);
  }

  nextScene.activate();
  this.activeScene = nextScene;
  await this.fadeIn(nextScene);

  this.onSceneActivated(sceneKey);
}

private async fadeOut(scene: SceneBase, duration = 300): Promise<void> {
  return new Promise(resolve => {
    const start = performance.now();
    const animate = () => {
      const elapsed = performance.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      scene.group.traverse(obj => {
        if (obj instanceof THREE.Mesh && obj.material) {
          (obj.material as any).opacity = 1 - progress;
        }
      });
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    };
    animate();
  });
}

private async fadeIn(scene: SceneBase, duration = 300): Promise<void> {
  // Similar to fadeOut but reverse
}
```

---

### Task 6.2: Loading Indicators ⏱️ 30 min

**Goal:** Show spinner while scene initializes

**Implementation:**
```javascript
// In SceneSwitcher.js
async switchScene(sceneKey) {
  try {
    // Show loading overlay
    this.showLoadingOverlay(sceneKey);

    this.activeScene = sceneKey;

    // Update UI
    this.updateButtons();

    // Activate scene
    if (this.sceneFactory) {
      await this.sceneFactory.activate(sceneKey);
    }

    // Hide loading overlay
    this.hideLoadingOverlay();

    console.log(`[SceneSwitcher] Switched to: ${sceneKey}`);
  } catch (err) {
    this.hideLoadingOverlay();
    this.showError(err);
  }
}

showLoadingOverlay(sceneKey) {
  const overlay = document.createElement('div');
  overlay.id = 'scene-loading-overlay';
  overlay.innerHTML = `
    <div class="spinner"></div>
    <div class="message">Loading ${sceneKey}...</div>
  `;
  document.body.appendChild(overlay);
}

hideLoadingOverlay() {
  const overlay = document.getElementById('scene-loading-overlay');
  if (overlay) overlay.remove();
}
```

---

### Task 6.3: UI Control Binding ⏱️ 2 hours

**Goal:** Wire scene-specific controls to UI panel (lil-gui or custom)

**Steps:**
1. Create UIControlManager
2. Read scene's `config.uiControls`
3. Generate UI panels dynamically
4. Bind to scene's `getUIBindings()`
5. Show/hide controls based on active scene

**Out of scope for initial implementation** - focus on core rendering first.

---

## Phase 7: Performance Optimization (FUTURE)

### Task 7.1: Shared Geometry Between Scenes

**Problem:** Currently each scene loads SVG separately (3x duplicate loading)

**Solution:**
- Cache CampusAsset in AssetManager
- Scenes clone meshes instead of reloading
- Share geometries, clone materials

**Estimated Savings:** ~60% reduction in memory, ~80% reduction in SVG load time

---

### Task 7.2: Dispose Inactive Scenes

**Problem:** All scenes stay in memory even when not active

**Solution:**
```typescript
// In SceneFactory
async activate(sceneKey: string): Promise<void> {
  // ...

  // Dispose previous scene (free memory)
  if (this.activeScene) {
    this.activeScene.deactivate();
    await this.activeScene.dispose();

    // Remove from memory (optional, loses initialized state)
    this.activeScene.isInitialized = false;
  }

  // ...
}
```

**Trade-off:** Faster scene switches vs lower memory usage

---

## Summary Timeline

| Phase | Tasks | Est. Time | Priority |
|-------|-------|-----------|----------|
| **Phase 1** | Render loop integration | 1 hour | 🔴 CRITICAL |
| **Phase 2** | Camera & controls | 1.5 hours | 🟠 HIGH |
| **Phase 3** | Picking & interaction | 1.5 hours | 🟠 HIGH |
| **Phase 4** | Labels & HUD | 1 hour | 🟡 MEDIUM |
| **Phase 5** | Material improvements | 1.5 hours | 🟡 MEDIUM |
| **Phase 6** | Polish & UX | 3.5 hours | 🟢 LOW |
| **Phase 7** | Performance | 2 hours | 🟢 FUTURE |
| **TOTAL** | | **~12 hours** | |

**Minimum Viable:** Phase 1 only (1 hour) → scenes render correctly
**Full Integration:** Phases 1-4 (5 hours) → fully functional scene system
**Production Ready:** Phases 1-6 (9 hours) → polished UX with all features

---

## Testing Strategy

After each phase, run this checklist:

### Core Rendering
- [ ] Geospatial scene visible
- [ ] Backdrop scene visible
- [ ] Projector scene visible
- [ ] Scene switcher buttons work
- [ ] Console shows no errors

### Camera & Controls
- [ ] OrbitControls work in all scenes
- [ ] Camera position consistent when switching
- [ ] No jarring camera jumps

### Interaction
- [ ] Room picking works in all scenes
- [ ] Room highlighting works
- [ ] Sensor panel appears on click
- [ ] No duplicate event listeners

### Visual Quality
- [ ] No z-fighting or rendering artifacts
- [ ] Materials render correctly (toon, gradient, white canvas)
- [ ] Lighting appears as intended
- [ ] Shadows visible where expected

### Performance
- [ ] 60fps maintained with 50+ rooms
- [ ] No memory leaks on scene switch
- [ ] Scene initialization < 2 seconds

---

## Next Actions

1. **Immediate (today):** Implement Phase 1 (render loop integration)
2. **Short-term (this week):** Complete Phases 2-3 (camera + picking)
3. **Medium-term (next week):** Complete Phase 4-5 (labels + materials)
4. **Long-term (future):** Polish and optimization (Phases 6-7)

**Success Criteria:** All three scenes render and are interactive with proper camera/picking integration.
