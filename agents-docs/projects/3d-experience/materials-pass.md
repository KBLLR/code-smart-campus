# FE-102 — Material & Post FX Pass Plan

_Last reviewed: 2025-11-03_

## Current Audit
- **Sky dome** blends a single day/night gradient; no distinct dawn/dusk hues or star layer.
- **Room/floor materials** default to plain `MeshStandardMaterial` colours with minimal roughness/metalness variation and no environment map or AO.
- **Scene lighting** relies on sun/moon directional lights plus a flat ambient light (`0xffffff`, intensity `0.25`); no fill lights or tone mapping adjustments.
- **Post FX**: Bloom/fog hooks exist but are disabled or use defaults; depth cues are limited.

## Palette Schedule Targets
Define four key slots that the telemetry layer can blend between:

| Slot  | Elevation Hint                    | Top Color | Horizon Color | Glow | Notes |
|-------|----------------------------------|-----------|---------------|------|-------|
| Dawn  | `-6° → +5°`                      | `#2a3561` | `#ff9d6c`     | `#ffb266` | Warm horizon with cool zenith; light haze. |
| Day   | `> +5°`                          | `#5b8fd8` | `#f2d0a7`     | `#ffd9a3` | Current palette kept for clear daylight. |
| Dusk  | `+5° → -6°`                      | `#1c2b4f` | `#ff7b89`     | `#ff9f8a` | Pink/rose gradient with softer glow. |
| Night | `< -6°`                          | `#050b1f` | `#12213f`     | `#a8c5ff` | Subtle blue glow to keep silhouettes visible; enable star sprinkle. |

Telemetry mapping: compute blend weights from sun elevation and optionally cloudiness once the data project exposes it.

## Shared Material Registry
Create a central registry (e.g. `src/materials/registry.js`) exporting lazily-instantiated materials:

| Key            | Use Case                            | Base           | Rough | Metal | Extras |
|----------------|-------------------------------------|----------------|-------|-------|--------|
| `roomBase`     | Default rooms                       | `#243649`      | 0.55  | 0.15  | AO map slot, vertex colours for heatmaps. |
| `roomHighlight`| Hover/selection overlay             | emissive tint  | 0.35  | 0.05  | Uses additive emissive + outline pass tie-in. |
| `floorPlate`   | Site floor plane                    | blended tex    | 0.65  | 0.05  | Hook to repeating terrazzo texture + lightmap. |
| `glassShell`   | Atriums/windows                     | `MeshPhysical` | 0.15  | 0.9   | Transmission 0.4, thickness 0.3. |
| `metalTrim`    | Railings/equipment                  | `#6b7280`      | 0.4   | 0.6   | Environment map enabled. |
| `sensorNode`   | Sensor glyphs / gizmos              | `#38bdf8`      | 0.2   | 0.4   | Animated emissive pulse. |

Loader responsibilities:
1. Preload HDR environment (`public/textures/env/studio.hdr`) using `RGBELoader`.
2. Attach shared `aoMap`, `normalMap`, or `roughnessMap` placeholders for future upgrades.
3. Expose a helper to update colours per layer (e.g. occupancy heatmap) without re-instantiating materials.

## Lighting & Post FX Targets
- Introduce a low-intensity hemispheric fill light keyed to the sky palette.
- Enable fog (`EXP2`, density `0.0012`) blended with sky colours for depth.
- Bring Bloom composer online with conservative threshold (`1.1`) so emissive elements pop without washing the scene.
- Evaluate Filmic tone mapping + sRGB output to harmonise HDR environment with WebGL renderer defaults.

## Implementation Checklist
- [x] Update `SunSkyDome` to blend across the four palette stops and expose `setPaletteSlot()` for Tweakpane.
- [x] Create `materials/registry.js` + utility to bind registry to rooms/floor during scene bootstrap.
- [x] Wire fog, environment, and light adjustments in `scene.js`.
- [x] Document controls in Debugger (palette slot bindings shipped; bloom toggles live under “✨ Post FX”).
- [ ] QA with live telemetry, capture screenshots for UI team (`qa/bloom-qa-playbook.md`).

Related tasks: `FE-102`, `FE-101b`, `FE-103`.
