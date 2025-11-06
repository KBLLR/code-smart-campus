# Sun & Lunar Lighting Overview

_Last updated: 2025-11-03_

## Current Capabilities
- **Sun telemetry smoothing** (`SunTelemetry`) ingests Home Assistant `sun.sun` states, fills gaps with interpolation, and feeds the scene without jitter.
- **Sky dome shader** (`SunSkyDome`) now blends dawn/day/dusk/night palettes with adaptive glow/fog tint driven by sun elevation; colours remain tweakable via “🌞 Sun Visuals”.
- **Sun path arc** (`SunPathArc`) visualises the recent trajectory with configurable colour/opacity so users can see how the sun has moved.
- **Moon companion** (`MoonController`) positions a directional light and sprite using on-device ephemeris (SunCalc-derived math) with Home Assistant phase data when available.
- **HDR environment loading** now uses `RGBELoader` + PMREM so reflections stay consistent with the sky palette while keeping the dome visible.

## Configuration & Debugging
- Shared coordinates load from `SITE_COORDINATES` (ENV override: `VITE_SITE_LAT`, `VITE_SITE_LNG`).
- `scene.userData.sunDebug` exposes palette + opacity controls; the Debugger panel provides colour pickers and reset.
- `scene.userData.moonDebug` exposes a simple `update` hook for manual recalculations and grants access to the underlying controller.

## Pending Enhancements
- **Palette tuning**: capture real sunrise/sunset telemetry to finalise colour and opacity defaults across all four slots.
- **Solar path markers (FF-001)**: awaiting the daily solar event feed (DP-106) built from HA sensors like `sensor.sun_next_dawn/dusk/noon/setting`.
- **Moon path visualisation** (future): optional debug overlays mirroring the sun arc for night sessions.
- **Night HDRI swap**: introduce sky texture transitions in tandem with moon altitude/illumination data.

## Related Tasks
- `FE-101a` – Solar Telemetry Ingest (stabilised; monitoring in production still required).
- `FE-101b` – Sun Path & Sky Dome (in progress, tuning phase).
- `FE-101c` – Moon Companion (implementation underway).
- `DP-106` – Solar Event Feed (data pipeline backlog item feeding FF-001).
