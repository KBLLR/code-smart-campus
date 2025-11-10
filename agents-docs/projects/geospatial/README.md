# Geospatial — Smart Campus 3D Integration

Implement **realistic geospatial rendering** for the Smart Campus 3D experience, integrating sun, moon, atmospheric, and cloud systems via the **[three-geospatial](https://github.com/takram-design-engineering/three-geospatial)** pipeline.

## Project Snapshot

- **Variant**: `SEMI` (semi-autonomous; human review on architectural decisions)
- **Owner**: David Caballero (KBLLR)
- **Intent**: Add photorealistic sun, moon, atmosphere, and cloud systems to the Smart Campus 3D world, respecting location data and real-time constraints.

## Vision & Scope

### What We're Building
A geospatial rendering module that:
1. **Sun & Moon**: Accurate celestial positioning via time/location (lat/lon).
2. **Atmosphere**: Precomputed atmospheric scattering for realistic sky gradients.
3. **Clouds**: Volumetric cloud rendering synchronized to room/sensor data.
4. **Lighting**: Dynamic material illumination responsive to sun position.

### Why It Matters
- Grounds the 3D campus in **realistic environmental context**.
- Enables **temporal storytelling** (dawn, dusk, night shifts).
- Provides **visual feedback** for occupancy patterns tied to daylight/conditions.

### Success Criteria
- [ ] Three-geospatial integrated as a dependency.
- [ ] Sun/moon controllers expose lat/lon/time and update scene lighting.
- [ ] Atmosphere shader renders without WebGL compatibility issues.
- [ ] Cloud system updates per sensor data (humidity, weather integration planned).
- [ ] No performance regression on Intel/mobile (GPU offload via WebGPU fallback).
- [ ] QA pass: sun moves smoothly; no console errors; responsive UI updates.

## Folder Structure

- `README.md` — This file; project charter, scope, success criteria.
- `tasks.yaml` — Backlog & active work (source of truth).
- `tasks.md` — Generated ledger (auto-exported; do not edit).
- `sessions/` — Session logs (one per work block; trace decisions).
- `qa/` — QA checklists (link to PRs).
- `future-features/` — Deferred specs (moon surface, lens glare, etc.).

## Integration Points

### Monorepo Path
```
src/
  world/
    managers/
      GeospatialManager.js       ← Orchestrates sun, moon, atmosphere
      SunController.js            ← Time/location bindings
      MoonController.js           ← Lunar positioning
      AtmosphereRenderer.js       ← Sky + scattering LUT
      CloudSystem.js              ← Volumetric + sensor sync
  data/
    geospatial/
      locationConfig.js           ← Campus lat/lon/timezone
      celestialEphemeris.js       ← Sun/moon calculations
```

### Dependencies
- **three-geospatial** (npm): `@takram/three-atmosphere` (v0.15.1), `@takram/three-clouds` (v0.5.2), `@takram/three-geospatial` (v0.5.1)
- **astronomy-engine**: Celestial ephemeris (bundled w/ @takram/three-atmosphere).
- **suncalc**: Already in monorepo; fallback for sun calculations.
- **Three.js**: v0.181.0+ (already in monorepo).
- **Home Assistant WS**: Real-time weather, condition updates (future).

## Getting Started

### Setup
1. Install three-geospatial packages:
   ```bash
   pnpm add @takram/three-atmosphere @takram/three-clouds @takram/three-geospatial
   ```
2. Create `src/world/managers/GeospatialManager.js` (see tasks for init tasks).
3. Create `src/data/geospatial/locationConfig.js` with campus coordinates.

### Workflow
1. For each work session, create a session log:
   ```bash
   pnpm run new:session "objective here"
   ```
2. Update `tasks.yaml` with completed/discovered tasks.
3. Before commit, verify:
   ```bash
   pnpm run lint
   pnpm run check
   ```
4. Push to feature branch; link session ID in PR.

## Architecture Decisions

### Why three-geospatial?
- **Modular**: Pick only atmosphere/clouds/effects we need.
- **Maintained**: Active development roadmap (WebGPU, moon surface, lens glare).
- **Proven**: Used in production geospatial XR/VR experiences.

### Sun/Moon Positioning
- Time & location → astronomy calculations → update Three.js lights.
- Initial: Manual time slider; future: sync to device time / Home Assistant.

### Atmospheric Rendering
- **Strategy**: Precomputed LUT (lookup table) for fast runtime.
- **Fallback**: WebGL shaders if WebGPU unavailable.
- **Constraint**: LUT generation may be heavy; cache & optimize per platform.

## Stakeholders & Review

- **Owner**: David Caballero
- **Reviewers**:
  - Architecture: Jules (code implementation lead)
  - Design/UX: [TBD based on UI integration]
  - Performance: [GPU/Metal specialist if available]

## Dependencies & Blockers

- [ ] Three-geospatial npm availability (check npm registry).
- [ ] Campus lat/lon/timezone data (confirm in existing config).
- [ ] Three.js light architecture review (ensure custom lights don't conflict).
- [ ] WebGPU fallback strategy (defer if WebGL-only for now).

## Best Practices

- **Docs-first**: Write session logs *before* committing code.
- **Modular commits**: One feature per PR (sun → atmosphere → clouds).
- **Research trail**: Link three-geospatial docs and web resources in tasks.
- **QA**: Attach checklist to PR; link to session log.

> **Tip:** The three-geospatial monorepo is your reference. Clone it locally or review examples in their docs/ folder to unblock implementation questions.
