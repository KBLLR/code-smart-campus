# Future Feature: Sun Glare & Bloom Effects

---

## Title
`Lens Glare, Bloom, & Chromatic Aberration (Sun Glow Effects)`

## Context & Motivation
- **Problem**: The sun is currently rendered as a simple light source. Adding bloom/glare makes the scene feel more photorealistic, especially at sunrise/sunset.
- **Who benefits**:
  - Users doing temporal studies (dawn/dusk light quality).
  - Presentations / immersive campus tours.
  - Scientific visualization (atmospheric light scattering).

## Desired Outcome
- Success looks like:
  - Sun produces visible bloom halo when in viewport.
  - Bloom intensity increases as sun approaches horizon (Rayleigh scattering effect).
  - Chromatic aberration subtle; no color fringing at extreme angles.
- Metrics:
  - Bloom renders without FPS impact (< 5 ms per frame on Metal).
  - No visual artifacts when sun behind geometry.
  - Smooth transition on/off as sun moves in/out of viewport.

## Requirements & Constraints

### Must
- Implement bloom via post-processing.
- Bloom intensity tied to sun altitude (lower = more intense).
- No rendering bloat for non-glare features.

### Should
- Support chromatic aberration (realistic lens artifact).
- Optional lens flares (dynamic rays) for wow-factor.
- Configurable intensity slider in UI.

### Won't
- Simulate realistic camera lens distortion (too niche).
- Bake lens glare offline (real-time is more flexible).
- Support multiple light glare (just sun for now).

### Constraints
- **Performance**: Bloom is expensive; use MRT (multi-render-target) or ping-pong approach.
- **Mobile**: Disable by default; opt-in via "High Quality" mode.
- **Compatibility**: Requires WebGL2 or WebGPU (no WebGL1).

## Technical Sketch

1. **Pipeline**:
   - Render scene to HDR render target.
   - Extract bright pixels (> threshold) → downsampled bloom texture.
   - Blur bloom horizontally + vertically (separable blur).
   - Composite bloom back to main render (additive blend).
   - Optional: apply chromatic aberration post-process.

2. **Data**:
   - Sun position & intensity (from `SunController`).
   - Sun altitude → bloom intensity curve (linear or exp).
   - Bloom radius, threshold, intensity configurable.

3. **Integration**:
   - Extend `src/world/postprocessing/` with `BloomPass.js`.
   - Bind to `SunController.sunAltitude` property.
   - Add UI control in geospatial panel.

4. **Modules touched**:
   - `src/world/postprocessing/BloomPass.js` (new)
   - `src/shaders/bloom-*.glsl` (new; threshold, blur, composite)
   - `src/world/managers/GeospatialManager.js` (wire bloom pass)
   - `src/ui/components/GeospatialPanel.js` (bloom intensity slider)

## Dependencies
- Post-processing framework (already in monorepo; verify WebGL2+ support).
- three.js example code for bloom (reference).
- Sunrise/sunset reference imagery for tuning.

## Risks & Open Questions

- **Risk**: Bloom pass expensive on Intel/mobile; may need to disable at runtime.
- **Risk**: Chromatic aberration can cause nausea in VR; skip if Smart Campus adds VR later.
- **Question**: Should bloom color shift (orange at sunset) or stay white? Color shift is more realistic.
- **Question**: Separate bloom pass or baked into renderer? Separate is cleaner but slower.

## Integration Plan

1. **Phase 1**: Basic bloom (white halo).
2. **Phase 2**: Bloom color (warm at dawn/dusk).
3. **Phase 3**: Chromatic aberration + lens rays (optional wow-factor).
4. **Rollout**: Feature flag "Enable Bloom"; default on for Metal, off for WebGL.
5. **Docs**: Explain performance implications; link to bloom reference materials.

## Status
- **Current state**: `idea`
- **Last reviewed**: `2025-11-10`
- **Unblocked**: Can start anytime; no upstream dependencies.
- **Task ID**: `GEO-702`
