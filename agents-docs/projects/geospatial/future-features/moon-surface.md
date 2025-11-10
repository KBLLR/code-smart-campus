# Future Feature: Moon Surface Rendering & Crater Detail

---

## Title
`Moon Surface Rendering with Crater Detail & Rim Lighting`

## Context & Motivation
- **Problem**: Currently, the moon is rendered as a flat/simple lit sphere. Adding surface detail (craters, texture, rim lighting) increases immersion and scientific accuracy.
- **Who benefits**:
  - Educators using Smart Campus for astronomy/geology outreach.
  - Casual users who appreciate photorealism.
  - Nighttime viewing scenarios (dawn/dusk/night shifts).

## Desired Outcome
- Success looks like:
  - Moon surface texture (high-res height map + normal map) loads and renders without stutter.
  - Craters cast shadows when sun is low on horizon (rim lighting effect).
  - Moon illumination matches lunar phase & position correctly.
- Metrics:
  - FPS stable at 60 on Metal; ≥30 on WebGL.
  - Lunar texture resolution ≥2K (4K if GPU memory available).
  - No perceptible stutter during pan/zoom.

## Requirements & Constraints

### Must
- Render moon surface geometry with bump/normal maps.
- Integrate with three-geospatial WebGPU roadmap (when available).
- No regression to sun/atmosphere performance.

### Should
- Use publicly available lunar texture data (USGS, NASA).
- Implement crater shadow calculation for realism.
- Support dynamic LOD (level of detail) for mobile fallback.

### Won't
- Implement real-time crater erosion simulation.
- Model individual boulder/surface irregularities (too high-poly).
- Support landing zone annotations (deferred to future GIS feature).

### Constraints
- **Platform**: Metal/WebGPU priority; WebGL fallback acceptable (simplified geometry).
- **Memory**: Moon texture + normal map ≤ 100 MB total VRAM.
- **Timing**: Defer until three-geospatial releases moon surface APIs (WebGPU phase).

## Technical Sketch

1. **Data**:
   - Fetch USGS lunar imagery (orthomosaic) & DEM (digital elevation model).
   - Pre-process: generate height map, compute normals, bake AO.
   - Store as compressed KTX2 textures or EXR.

2. **Rendering**:
   - Use three-geospatial's WebGPU material system (when ready).
   - Bind height map → normal map → parallax occlusion mapping (POM).
   - Compute rim lighting in fragment shader.
   - Crater shadows via shadow mapping or SDF-based approach.

3. **Integration**:
   - Extend `MoonController.js` to load texture, swap geometry.
   - Add detail level toggle in UI (High/Medium/Low quality).
   - Cache textures in IndexedDB for fast reload.

4. **Modules touched**:
   - `src/world/managers/MoonController.js` (geometry + texture binding)
   - `src/shaders/moon-surface.glsl` (custom fragment shader)
   - `src/data/geospatial/lunarTextureRegistry.js` (texture URLs, metadata)

## Dependencies
- three-geospatial WebGPU release (or WebGL extended NormalmapMaterial).
- USGS Lunar Reconnaissance Orbiter (LRO) data access / licensing.
- Normal map baking tools (Substance Painter, Blender, or shader-based).

## Risks & Open Questions

- **Risk**: three-geospatial WebGPU not released on schedule → fallback to custom shader (higher maintenance burden).
- **Risk**: Lunar texture licensing restrictions (NASA/USGS data typically public-domain, but verify).
- **Question**: Should craters be pre-rendered (static shadows) or dynamic (per-frame calculation)? Dynamic is more accurate but slower.
- **Question**: How granular should LOD be? Full moon vs. thin crescent?

## Integration Plan

1. **Phase 1 (Beta)**: Render moon with simple surface texture (no craters).
2. **Phase 2**: Add normal maps + rim lighting.
3. **Phase 3**: Crater shadow effects (performance-gated).
4. **Rollout**: Feature flag behind "Advanced Graphics" settings. Default off for mobile.
5. **Docs**: Link to USGS lunar data; explain quality tiers.

## Status
- **Current state**: `idea`
- **Last reviewed**: `2025-11-10`
- **Blocked by**: three-geospatial WebGPU roadmap
- **Task ID**: `GEO-701`
