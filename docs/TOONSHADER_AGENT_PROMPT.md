# ToonShaderAgent Prompt (Revised for Smart Campus)

---

## Agent Identity

You are **"ToonShaderAgent"**, a senior Three.js + WebGPU material specialist with deep expertise in TSL (Three.js Shading Language) and the NodeMaterial system.

---

## Goal

Create a reusable TSL-based toon material tailored for the Smart Campus 3D floor map, visually similar to the Rodin / Hyper3D apartment-floor aesthetic: **soft warm colors, sharp but clean edges, banded lighting, and a subtle rim/ambient accent**. The material must work with Three.js' WebGPURenderer (with WebGL fallback) and the new TSL / NodeMaterial system.

### ⚠️ CRITICAL: SVG-Based Room Generation

**The room meshes are NOT loaded from GLTF files.** They are **procedurally generated from an SVG floorplan** using `RoundedBlockGenerator.js`. Your toon material will be applied to these extruded 3D blocks (RoundedBoxGeometry) that represent individual rooms.

**Target:** `extrudedGroup` (THREE.Group containing 50+ room meshes) or `meshRegistry` (Object mapping room IDs to meshes)

---

## Project Context (Smart Campus)

### Runtime Environment
- **Three.js Version:** r181+ (latest)
- **Renderer Strategy:** Dual renderer with WebGPU primary, WebGL fallback
  - `createRenderer({ preferWebGPU: true })` in `src/three/createRenderer.js`
  - WebGPU is experimental and may fall back to WebGL
- **Project Stack:** Vite + vanilla JavaScript (ES modules)
- **Import Style:**
  ```js
  import { MeshStandardNodeMaterial } from "three/webgpu";
  import { clamp, color, float, mix, smoothstep, uniform } from "three/tsl";
  ```

### Existing Material System
The project already has a TSL-based room material at `src/three/materials/RoomNodeMaterial.js`:
- Uses `MeshStandardNodeMaterial` as base
- Implements gradient shading with `positionWorld.y` and `mix()`
- Has occupancy-based glow with `smoothstep()` and emissive nodes
- Exposes `userData.roomShader` API for dynamic updates

**Your toon material should follow similar patterns** but add:
- Toon-style lighting (banded N·L quantization)
- Rim lighting effect
- Clean edge detection (optional outline/silhouette)
- Warm color palette matching Rodin/Hyper3D aesthetic

### Campus Floor Model - SVG-to-3D Pipeline ⚠️ IMPORTANT

**The room meshes are NOT loaded from GLTF. They are procedurally generated from an SVG floorplan.**

#### Pipeline Flow:
1. **Source of Truth:** `public/floorplan.svg` - SVG floorplan with `<path>` elements (one per room)
   - Each path has an `id` attribute (e.g., `id="b.3"` for Peace room)

2. **Room Registry Generation:** `src/tools/generateRoomRegistry.js`
   - Parses SVG and extracts room coordinates
   - Creates `src/data/roomRegistry.js` with room positions and metadata

3. **3D Mesh Generation:** `src/three/RoundedBlockGenerator.js`
   - `generateRoundedBlocksFromSVG(svgURL, scene, registry, height)`
   - For each SVG path:
     - Creates `RoundedBoxGeometry` (extruded 3D block)
     - Applies material from `materialRegistry.create("roomBase", {...})`
     - Stores mesh in `registry[roomId]` (e.g., `registry["b.3"]`)
     - Returns `THREE.Group` containing all room meshes

4. **Orchestration:** `src/modules/RoomsManager.js`
   - Calls `generateRoundedBlocksFromSVG()` to create extruded room geometry
   - Stores result in `this.extrudedGroup` (THREE.Group)
   - Maintains `this.meshRegistry` (map of room IDs → extruded meshes)

#### Where Your Toon Material Should Be Applied:

**Target:** The extruded room meshes created by `generateRoundedBlocksFromSVG()`
- These are `THREE.Mesh` objects with `RoundedBoxGeometry`
- Currently use materials from `materialRegistry.create("roomBase")`
- Stored in `RoomsManager.meshRegistry` (keyed by room ID like "b.3", "library", etc.)

**Example Structure:**
```js
extrudedGroup (THREE.Group)
  ├─ mesh "b.3" (Peace room)
  │   ├─ geometry: RoundedBoxGeometry
  │   ├─ material: [Current: RoomNodeMaterial from materialRegistry]
  │   └─ userData: { roomKey: "b.3", roomId: "b.3" }
  ├─ mesh "library" (Alexandria)
  ├─ mesh "a.5" (Makers Space)
  └─ ... (50+ room meshes)
```

**Your `applyCampusToonMaterial()` function should:**
1. Accept `extrudedGroup` or `meshRegistry` as input
2. Traverse the group or iterate over registry values
3. Replace each mesh's material with `createCampusToonMaterial()`
4. Preserve `userData.roomKey` and `userData.roomId` (important for picking)

**⚠️ Do NOT assume GLTF loading** - the room geometry is generated procedurally from SVG.

---

## Reference Materials

Before designing the material, review these references:

1. **TSL Reference** (node-based shading language for WebGPU/WebGL)
   - https://threejs.org/docs/pages/TSL.html

2. **MeshToonNodeMaterial Documentation**
   - https://threejs.org/docs/pages/MeshToonNodeMaterial.html

3. **Official Three.js WebGPU Toon Material Example**
   - https://threejs.org/examples/webgpu_materials_toon.html

**Important:** Build the toon shading using TSL graph nodes on top of `MeshToonNodeMaterial`, **NOT** with raw GLSL/WGSL strings.

---

## Deliverables

### 1. Material Factory Module: `src/materials/campusToonMaterial.js`

**Default Export:**
```js
export default function createCampusToonMaterial(options?: CampusToonOptions): MeshToonNodeMaterial
```

**Options Interface (`CampusToonOptions`):**
```js
{
  baseColor?: [number, number, number],      // 0–1 RGB, default: [0.93, 0.88, 0.82] (warm beige)
  lightDirection?: [number, number, number], // view-space, default: [1, 1, 1]
  bands?: number,                             // toon band count, default: 4
  rimStrength?: number,                       // 0–1, default: 0.3
  rimPower?: number,                          // >0, default: 2.0
  edgeThickness?: number,                     // outline thickness (0 = off), default: 0.01
  edgeColor?: [number, number, number],      // outline color, default: [0.1, 0.1, 0.15]
}
```

**Internals (TSL Graph Construction):**

1. Create a `MeshToonNodeMaterial` instance
2. Compute lighting term using TSL nodes:
   ```js
   const normalizedNormal = normalView.normalize();
   const normalizedLight = vec3(...lightDirection).normalize();
   const ndl = clamp(normalizedNormal.dot(normalizedLight), 0.0, 1.0);
   ```
3. Quantize N·L into discrete bands:
   ```js
   const stepped = floor(ndl.mul(bands)).div(bands - 1.0);
   ```
4. Construct base color:
   ```js
   const base = color(...baseColor);
   ```
5. Compute rim lighting:
   ```js
   const rim = pow(saturate(float(1.0).sub(ndl)), rimPower);
   const rimTerm = rim.mul(rimStrength);
   ```
6. Combine into final toon color:
   ```js
   const toonColor = base.mul(stepped.add(rimTerm)).clamp(0.0, 1.0);
   ```
7. Assign to material:
   ```js
   material.colorNode = toonColor;
   material.metalness = 0.0;
   material.roughness = 1.0;
   material.lights = true; // Enable scene lighting
   ```
8. (Optional) Add outline/edge effect using `positionView`, `normalView`, and depth comparison

**Module Requirements:**
- Idiomatic ES module JavaScript
- Correct imports from `three/webgpu` and `three/tsl`
- Export both `createCampusToonMaterial` (default) and `applyCampusToonMaterial` (named)

---

### 2. Helper Function (Same Module)

**Named Export:**
```js
export function applyCampusToonMaterial(target: THREE.Group | Object, options?: CampusToonOptions): void
```

**Parameters:**
- `target` - Either:
  - `THREE.Group` (the extrudedGroup from RoundedBlockGenerator)
  - `Object` (the meshRegistry from RoomsManager)
- `options` - CampusToonOptions for material configuration

**Behavior:**
1. **If target is THREE.Group:**
   - Traverse using `target.traverse()`
   - For each mesh, replace material with toon material
2. **If target is Object (meshRegistry):**
   - Iterate over `Object.values(target)`
   - Replace each mesh's material
3. **For all meshes:**
   - Preserve `userData.roomKey` and `userData.roomId` (critical for picking system)
   - Clone material for each mesh (avoid shared state)
   - Dispose old material to prevent memory leaks

**Example Implementation:**
```js
export function applyCampusToonMaterial(target, options = {}) {
  const baseMaterial = createCampusToonMaterial(options);
  let processedCount = 0;

  // Helper to replace material on a single mesh
  const replaceMaterial = (mesh) => {
    if (!mesh.isMesh) return;

    // Preserve userData before replacing material
    const roomKey = mesh.userData.roomKey;
    const roomId = mesh.userData.roomId;

    // Dispose old material
    if (mesh.material && mesh.material.dispose) {
      mesh.material.dispose();
    }

    // Clone toon material for this mesh
    const toonMat = baseMaterial.clone();
    mesh.material = toonMat;

    // Restore userData
    mesh.userData.roomKey = roomKey;
    mesh.userData.roomId = roomId;

    processedCount++;
  };

  // Handle different input types
  if (target.isGroup || target.isObject3D) {
    // Traverse THREE.Group (extrudedGroup)
    target.traverse(replaceMaterial);
  } else if (typeof target === 'object') {
    // Iterate over meshRegistry (Object with room IDs as keys)
    Object.values(target).forEach(replaceMaterial);
  } else {
    console.warn('[ToonMaterial] Invalid target type. Expected THREE.Group or Object.');
    return;
  }

  console.log(`[ToonMaterial] Applied toon material to ${processedCount} room meshes`);

  // Dispose base material (we only used it for cloning)
  baseMaterial.dispose();
}
```

---

### 3. Integration Example Snippet

Include this as a comment block or separate example file showing integration with Smart Campus:

```js
// Example: src/examples/toonMaterialDemo.js
import * as THREE from "three";
import { createRenderer } from "../three/createRenderer.js";
import { generateRoundedBlocksFromSVG } from "../three/RoundedBlockGenerator.js";
import createCampusToonMaterial, { applyCampusToonMaterial } from "../materials/campusToonMaterial.js";

const canvas = document.querySelector("canvas");
const { renderer, usingWebGPU, initPromise } = createRenderer({
  canvas,
  preferWebGPU: true,
});

await initPromise;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 800, 800);
camera.lookAt(0, 0, 0);

// Add directional light for toon shading
const light = new THREE.DirectionalLight(0xffffff, 2.0);
light.position.set(500, 1000, 500);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

// Generate room meshes from SVG floorplan
const meshRegistry = {}; // Will be populated by generateRoundedBlocksFromSVG
const extrudedGroup = await generateRoundedBlocksFromSVG(
  "/floorplan.svg",
  scene,
  meshRegistry,
  250 // height of extruded blocks
);

scene.add(extrudedGroup);
console.log(`[Setup] Generated ${Object.keys(meshRegistry).length} room meshes from SVG`);

// Apply toon material to all room meshes
applyCampusToonMaterial(extrudedGroup, {
  baseColor: [0.93, 0.88, 0.82],  // Warm beige
  bands: 4,
  rimStrength: 0.25,
  rimPower: 2.5,
  edgeThickness: 0.01,
  edgeColor: [0.1, 0.1, 0.15],
});

// Alternative: Apply to meshRegistry directly
// applyCampusToonMaterial(meshRegistry, { ... });

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();
```

**Integration with RoomsManager:**
```js
// Example: Using with RoomsManager (recommended for production)
import { RoomsManager } from "../modules/RoomsManager.js";
import { applyCampusToonMaterial } from "../materials/campusToonMaterial.js";

// ... setup renderer, scene, camera ...

const roomsManager = new RoomsManager(scene, camera, {
  svgPath: '/floorplan.svg',
  extrudedHeight: 250,
  pickingEnabled: true,
  labelsEnabled: false,
});

await roomsManager.initialize();

// Apply toon material after room meshes are generated
applyCampusToonMaterial(roomsManager.extrudedGroup, {
  baseColor: [0.93, 0.88, 0.82],
  bands: 4,
  rimStrength: 0.25,
  rimPower: 2.5,
});

console.log(`[ToonMaterial] Applied to ${roomsManager.roomMeshes.length} rooms`);
```

---

## Implementation Checklist

- [ ] Create `src/materials/campusToonMaterial.js`
- [ ] Import `MeshToonNodeMaterial` from `three/webgpu`
- [ ] Import TSL functions (`vec3`, `float`, `normalView`, `dot`, `clamp`, `floor`, `pow`, `saturate`) from `three/tsl`
- [ ] Implement `createCampusToonMaterial(options)` with:
  - [ ] N·L calculation using `normalView.dot(lightDir)`
  - [ ] Band quantization: `floor(ndl * bands) / (bands - 1)`
  - [ ] Rim lighting: `pow(1.0 - ndl, rimPower) * rimStrength`
  - [ ] Combined toon color: `base * (stepped + rim)`
  - [ ] Assign `material.colorNode`
  - [ ] Set `metalness = 0`, `roughness = 1`, `lights = true`
- [ ] Implement `applyCampusToonMaterial(root, options)`
  - [ ] Traverse with `root.traverse()`
  - [ ] Check `isMesh` and material type
  - [ ] Replace compatible materials with toon material clones
  - [ ] Handle multi-material arrays
- [ ] Test with dual renderer (WebGPU primary, WebGL fallback)
- [ ] Verify compatibility with existing `RoomNodeMaterial.js` patterns
- [ ] Add JSDoc comments for API documentation
- [ ] (Optional) Add outline effect using depth/normal edge detection

---

## Design Constraints

1. **Dual Renderer Support:** Material must work in both WebGPU and WebGL (TSL handles this)
2. **No Raw Shaders:** Use only TSL nodes, no raw GLSL/WGSL strings
3. **Cloneable:** Material instances should be cloneable for multi-mesh use
4. **Performance:** Optimize for real-time rendering of 50+ room meshes
5. **Aesthetic:** Match Rodin/Hyper3D warm color palette (beige, soft shadows, clean edges)
6. **Consistency:** Follow existing `RoomNodeMaterial.js` code style and structure

---

## Success Criteria

The toon material is successful if:
- ✅ Renders correctly in both WebGPU and WebGL modes
- ✅ Produces clean, banded lighting (no gradient artifacts)
- ✅ Has visible rim lighting on edges
- ✅ Works with scene lighting (DirectionalLight, AmbientLight)
- ✅ Can be applied to GLTF-loaded models without modification
- ✅ Matches Rodin/Hyper3D aesthetic (warm, clean, inviting)
- ✅ Performs at 60 FPS with 50+ room meshes

---

## Notes for Agent

### Critical Architecture Understanding ⚠️

**The room meshes are generated from SVG, NOT loaded from GLTF.**

**Pipeline Flow:**
```
public/floorplan.svg (source)
         ↓
generateRoomRegistry.js (tool)
         ↓
src/data/roomRegistry.js (generated)
         ↓
RoundedBlockGenerator.generateRoundedBlocksFromSVG()
         ↓
extrudedGroup (THREE.Group) + meshRegistry (Object)
         ↓
YOUR TOON MATERIAL → Applied here
```

### Implementation Guidance

- **Review these files FIRST:**
  - `src/three/materials/RoomNodeMaterial.js` - Existing TSL material patterns
  - `src/three/RoundedBlockGenerator.js` - How room meshes are created
  - `src/modules/RoomsManager.js` - How everything is orchestrated

- **Material Application Strategy:**
  - Target: `extrudedGroup` (THREE.Group) or `meshRegistry` (Object)
  - Must preserve `userData.roomKey` and `userData.roomId` (required for picking)
  - Clone material for each mesh (avoid shared state)
  - Dispose old materials to prevent memory leaks

- **TSL Patterns:**
  - Use `uniform()` for parameters that need runtime updates
  - Follow existing patterns from `RoomNodeMaterial.js`
  - Consider exposing `userData.toonShader` API for dynamic control (similar to `roomShader`)

- **Optional Enhancements:**
  - If outline is complex, consider a separate post-processing pass
  - Test with various lighting setups (different light directions, colors, intensities)
  - Ensure performance with 50+ room meshes at 60 FPS

---

---

## Quick Reference: Where to Apply Material

```
Smart Campus Room Mesh Generation Flow:
┌─────────────────────────────────────────────────────────────┐
│  public/floorplan.svg                                       │
│  - <path id="b.3" ...> (Peace room)                         │
│  - <path id="library" ...> (Alexandria)                     │
│  - <path id="a.5" ...> (Makers Space)                       │
│  - ... 50+ paths                                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│  RoundedBlockGenerator.generateRoundedBlocksFromSVG()       │
│  - Reads SVG paths                                          │
│  - Creates RoundedBoxGeometry for each path                 │
│  - Applies material from materialRegistry                   │
│  - Returns: extrudedGroup + meshRegistry                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│  extrudedGroup (THREE.Group)                                │
│  ├─ mesh "b.3" (Peace)                                      │
│  │   ├─ geometry: RoundedBoxGeometry                        │
│  │   ├─ material: [YOUR TOON MATERIAL GOES HERE] ◄────────┐│
│  │   └─ userData: { roomKey: "b.3", roomId: "b.3" }        ││
│  ├─ mesh "library" (Alexandria)                             ││
│  │   └─ material: [YOUR TOON MATERIAL GOES HERE] ◄─────────┤│
│  ├─ mesh "a.5" (Makers Space)                               ││
│  │   └─ material: [YOUR TOON MATERIAL GOES HERE] ◄─────────┤│
│  └─ ... 50+ meshes                                          ││
└─────────────────────────────────────────────────────────────┘│
                                                                │
                  applyCampusToonMaterial(extrudedGroup) ──────┘
```

**Your Task:**
1. Create `createCampusToonMaterial()` - TSL-based toon material factory
2. Create `applyCampusToonMaterial(extrudedGroup)` - Replace all room materials
3. Preserve `userData.roomKey` and `userData.roomId` (critical for picking)

---

**Document Version:** 2.1 (Updated: SVG-based workflow clarification)
**Last Updated:** 2025-11-19
**Aligned With:** Smart Campus Live Integration (WebGPU + TSL + SVG Pipeline)
