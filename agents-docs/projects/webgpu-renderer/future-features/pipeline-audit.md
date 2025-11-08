# WebGPU Pipeline Audit — 2025-11-07

## Current Renderer Stack (WebGL)
- `src/Setup.js`
  - Instantiates `THREE.WebGLRenderer` (antialias=true, alpha).
  - Enables PCFSoft shadows, ACESFilmic tone mapping, SRGB color space.
  - Depends on WebGL-specific features: shadow maps, render targets (`PMREMGenerator`, `HDRLoader`) baked for WebGL.
  - Orbits rely on DOM canvas element; stats overlay uses `StatsGLPanel` tied to WebGL context.
- `src/postprocessing/PostProcessor.js`
  - Uses `EffectComposer`, `RenderPass`, `UnrealBloomPass`, `OutputPass` (all WebGL only).
  - Rendering path toggles bloom per frame; no WebGPU equivalent yet.
- `scene/userData`
  - `sunDebug`, `postFX` objects expect the WebGL renderer to exist (e.g., `postFX.captureSnapshot` grabs `renderer.domElement`).
- HUD / overlays
  - CSS HUD + label managers depend on current camera/renderer sizing but should be renderer-agnostic if callbacks exist.

## Toolchain / Build Constraints
- Bundler: Vite + ES modules with root `tsconfig.json` extending `src/tsconfig`.
- TS config enforces `moduleResolution: "bundler"` and uses `@` aliases spanning the entire repo. No dedicated `three/webgpu` path mapping yet.
- ESLint/Biome currently warn on `@tailwind` directives; no specific lint settings for TSL yet.
- Post-processing + stats libs are imported from `three/examples`, which do not have WebGPU counterparts.

## Identified Gaps
1. **Renderer instantiation**
   - `Setup` only toggles `usingWebGPU` boolean; actual renderer is always WebGL.
   - Need to import `WebGPURenderer` (or `THREE.WebGPURenderer` via `three/webgpu`) and guard features (setPixelRatio, setSize, PMREM).
2. **PostFX**
   - EffectComposer stack must be replaced. Options: custom TSL bloom, `webgpu-post-processing` experiments, or node-based passes.
3. **Materials / TSL**
   - Rooms currently use standard `MeshStandardMaterial` from material registry. TSL node graph required for WebGPU shading + advanced gradients.
4. **Stats / Debug**
   - `StatsGLPanel` uses WebGL inspector overlays; need a WebGPU-friendly perf HUD or fallback to `stats.js`.
5. **Snapshot / Exports**
   - `postFX.captureSnapshot` relies on `renderer.domElement.toDataURL`. WebGPU requires copying from `WebGPUCanvasContext`.
6. **Mesh exporters**
   - `three/examples/jsm/exporters/STLExporter` expects WebGL geometry; likely OK but confirm compatibility with WebGPU buffers.
7. **Env / HDR**
   - `HDRLoader` + `PMREMGenerator` must target WebGPU textures; requires Three.js WebGPU pipeline (supported but double-check API changes).
8. **Tooling**
   - Type checking must allow imports from `three/webgpu`, `three/tsl`. Need Vite alias or explicit `optimizeDeps.include`.

## Proposed Next Steps
1. WR-002 — update toolchain to compile `three/webgpu` modules (tsconfig paths, Vite optimizeDeps, ESLint allowances).
2. WR-003 — add experimental `WebGPURenderer` instantiation under feature flag:
   - Feature gate via env (e.g., `import.meta.env.VITE_WEBGPU_ENABLED`).
   - Provide fallback to WebGL if `navigator.gpu` unavailable.
   - Abstract `renderer` interactions (setSize, setPixelRatio, read pixels).
3. WR-006 — research TSL room shaders:
   - Start with gradient background example (Ready Player Me style) using `screenUV`, `mix`, `vec3`.
   - Build node graphs for occupancy-based emissive trims.
4. WR-004 — evaluate node-based bloom/tonemapping replacements (TSL or `postprocessing` WebGPU branch).
5. WR-007 — note WebGPU compute potential; coordinate with data-pipeline to identify ML workloads (occupancy prediction, pathing) that could run on GPU.

## Open Questions
- Do we need dual-renderer support during migration, or can we branch WebGPU-only once chunking + HUD parity confirmed?
- How will UIL canvas panels behave when the renderer swap occurs (any reliance on WebGL state)?
- What ML workloads justify compute shader investment (classification, sensor fusion)? Need product direction.

_Last updated: 2025-11-07 (Codex)._
