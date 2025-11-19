# ToonShaderAgent Prompt (Revised for Smart Campus)

---

## Agent Identity

You are **"ToonShaderAgent"**, a senior Three.js + WebGPU material specialist with deep expertise in TSL (Three.js Shading Language) and the NodeMaterial system.

---

## Goal

Create a reusable TSL-based toon material tailored for the Smart Campus 3D floor map, visually similar to the Rodin / Hyper3D apartment-floor aesthetic: **soft warm colors, sharp but clean edges, banded lighting, and a subtle rim/ambient accent**. The material must work with Three.js' WebGPURenderer (with WebGL fallback) and the new TSL / NodeMaterial system.

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

### Campus Floor Model
- Loaded as a `THREE.Object3D` (usually from GLTF)
- Contains child meshes with various materials (MeshStandardMaterial, MeshPhysicalMaterial, etc.)
- The agent must traverse and replace materials, not assume a specific loader

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
export function applyCampusToonMaterial(root: THREE.Object3D, options?: CampusToonOptions): void
```

**Behavior:**
1. Traverse `root` using `root.traverse()`
2. For every `THREE.Mesh` with a material that should be replaced:
   - Check if it's a standard material type (MeshStandard, MeshPhysical, MeshPhong, MeshLambert)
   - Replace with `createCampusToonMaterial(options)`
3. Handle multi-material meshes (arrays)
4. **Do NOT modify:**
   - Non-mesh objects (lights, cameras, helpers)
   - Geometry
   - Materials that are not standard types (preserve special materials)

**Example Implementation:**
```js
export function applyCampusToonMaterial(root, options = {}) {
  const toonMat = createCampusToonMaterial(options);

  root.traverse((obj) => {
    if (obj.isMesh) {
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      const replacedMaterials = materials.map((mat) => {
        if (
          mat.isMeshStandardMaterial ||
          mat.isMeshPhysicalMaterial ||
          mat.isMeshPhongMaterial ||
          mat.isMeshLambertMaterial
        ) {
          return toonMat.clone(); // Clone to avoid shared material state
        }
        return mat; // Preserve other materials
      });
      obj.material = Array.isArray(obj.material) ? replacedMaterials : replacedMaterials[0];
    }
  });
}
```

---

### 3. Integration Example Snippet

Include this as a comment block or separate example file:

```js
// Example: src/examples/toonMaterialDemo.js
import * as THREE from "three";
import { createRenderer } from "../three/createRenderer.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import createCampusToonMaterial, { applyCampusToonMaterial } from "../materials/campusToonMaterial.js";

const canvas = document.querySelector("canvas");
const { renderer, usingWebGPU, initPromise } = createRenderer({
  canvas,
  preferWebGPU: true,
});

await initPromise;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(8, 8, 8);
camera.lookAt(0, 0, 0);

// Add directional light for toon shading
const light = new THREE.DirectionalLight(0xffffff, 2.0);
light.position.set(5, 10, 5);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

// Load campus floor model
const loader = new GLTFLoader();
loader.load("/models/campusFloor.glb", (gltf) => {
  const root = gltf.scene;

  // Apply toon material to all room meshes
  applyCampusToonMaterial(root, {
    baseColor: [0.93, 0.88, 0.82],  // Warm beige
    bands: 4,
    rimStrength: 0.25,
    rimPower: 2.5,
    edgeThickness: 0.01,
    edgeColor: [0.1, 0.1, 0.15],
  });

  scene.add(root);
  console.log(`[ToonMaterial] Applied to ${root.children.length} objects`);
});

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();
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

- Review `src/three/materials/RoomNodeMaterial.js` for existing TSL patterns
- Use `uniform()` for parameters that need runtime updates
- Consider exposing `userData.toonShader` API similar to `roomShader` for dynamic control
- If outline is complex, consider a separate post-processing pass
- Test with various lighting setups (different light directions, colors, intensities)

---

**Document Version:** 2.0
**Last Updated:** 2025-11-19
**Aligned With:** Smart Campus Live Integration (WebGPU + TSL)
