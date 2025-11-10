# QA Checklist — Geospatial Module

> Duplicate this file per QA run and attach to the session log / PR summary.

## Metadata
- **Build / Commit**: `<hash>`
- **Environment**: `<local / staging / prod>`
- **Tester**: `<name>`
- **Date**: `<YYYY-MM-DD>`
- **Session Log**: `docs/projects/geospatial/sessions/<session-id>`

## Pre-flight
- [ ] `pnpm install`
- [ ] `pnpm run build`
- [ ] `pnpm run lint`
- [ ] Session log created (`docs/projects/geospatial/sessions/`)
- [ ] three-geospatial packages installed (@geospatial/atmosphere, @geospatial/clouds, @geospatial/effects)

## Critical Paths

### 1. Sun Controller & Positioning
- [ ] Sun appears in sky on scene load
- [ ] Time slider updates sun position smoothly (1 hour = visible arc)
- [ ] Sun moves East → West correctly per latitude
- [ ] Shadow cast from sun updates dynamically per position
- [ ] No console errors during sun movement
- [ ] Material illumination responds to sun angle (metallic/roughness)

### 2. Moon Controller & Phases
- [ ] Moon appears in sky opposite sun (roughly)
- [ ] Moon phase displays correctly (full → waning → new)
- [ ] Moon illumination synchronized to sun position
- [ ] No console errors or geometry clipping

### 3. Atmosphere Rendering
- [ ] Sky gradient renders on load (horizon → zenith)
- [ ] Atmosphere color updates per sun position:
  - [ ] Blue at noon
  - [ ] Orange/red at sunrise/sunset
  - [ ] Dark blue/black at night
- [ ] Precomputed LUT (lookup table) loads without stutter
- [ ] No WebGL compatibility issues (fallback shaders work)
- [ ] Smooth transition during day/night cycle (no color banding)

### 4. Cloud System
- [ ] Clouds render in viewport
- [ ] Cloud coverage slider adjusts opacity (0–100%)
- [ ] Cloud color responds to sun lighting (dawn/dusk golden, night darker)
- [ ] Cloud performance stable (target 60 FPS on Metal/WebGL)
- [ ] Volumetric rendering doesn't block orbit controls

### 5. UI Integration
- [ ] Time/date slider panel appears (glassy theme consistent)
- [ ] Cloud coverage control accessible and responsive
- [ ] Nighttime mode indicator (if implemented)
- [ ] No UI overlap with existing HUD elements
- [ ] Toolbar filter system unaffected

### 6. Three.js Integration
- [ ] Existing directional/point lights don't conflict with SunController light
- [ ] Camera orbit/zoom/pan still responsive
- [ ] Campus geometry renders with correct sun shadows
- [ ] No memory leaks (check DevTools after 5 min continuous use)

## Performance Baselines

- [ ] **Metal (M3 Max)**: Stable 60 FPS, atmosphere LUT gen < 500ms
- [ ] **WebGL (Intel/Fallback)**: Stable 30+ FPS, no stutter during sun movement
- [ ] **Mobile (if available)**: Acceptable perf; document trade-offs
- [ ] **GPU Memory**: No unexpected spike (verify via DevTools)

## Visual Checks
- [ ] Atmosphere gradient matches reference photography
- [ ] Cloud shadows cast correctly when sun low on horizon
- [ ] Night mode starfield (if implemented) visible and not jarring
- [ ] No color quantization or shader compilation artifacts
- [ ] Glassy UI panels have consistent contrast

## Regression / Smoke Notes
- [ ] Existing 3D campus scene still renders identically (no regressions)
- [ ] HA WS connection unaffected by new managers
- [ ] Export (GLB/STL) still functional
-

## Platform-Specific Checklist

### macOS / Metal
- [ ] LUT compiles via Metal/MPS acceleration
- [ ] No shader compilation warnings in console

### WebGL Fallback
- [ ] Atmosphere renders (fallback shader path)
- [ ] No "Unsupported WebGL extension" errors

### Future: WebGPU
- [ ] (Deferred) WebGPU path initializes without errors (when available)

## Follow-up Issues
- [ ] Issues logged in `docs/projects/geospatial/tasks.md` (IDs: GEO-### …)

## Sign-off
- ✅ / ⚠️ / ❌  — *Tester signature*
- **Notes**:
