# Task Ledger — 3D Experience

Keep the table sorted by priority (top = highest). Reference session logs when moving cards between sections.

## Backlog
| ID    | Title                                   | Description                                                                 | Priority | Owner | Notes |
|-------|-----------------------------------------|-----------------------------------------------------------------------------|----------|-------|-------|
| FE-101 | Sun & Moon System                      | Extend lighting with animated sun/moon controllers and sky gradients.      | High     |      | Split into FE-101a/b/c for execution. |
| FE-101a | Solar Telemetry Ingest                | Normalize HA `sun.sun` stream, interpolate gaps, expose easing API.        | High     |      | Feed SunController with smooth azimuth/elevation. |
| FE-101c | Moon Companion                        | Introduce MoonController with phase-based lighting + night HDRI swaps.     | Medium   |      | Needs moon ephemeris (pipeline FF-001) + HA `sensor.moon` fallback. |
| FE-102 | Material & Post FX Pass                | Introduce PBR-ish materials, AO, bloom tuning, and fog depth cues.         | High     |      | Spec: `materials-pass.md`; bloom pipeline live, capture QA + screenshots next. |
| FE-103 | CSS HUD Labels                         | Replace Three.js text sprites with screen-space HUD cards & interactions.  | High     |      | Spec: `css-hud-plan.md`; build anchors + HUD manager next. |
| FE-104 | Raycast Selection & Camera Focus       | Implement room/sensor picking, focus transitions, and highlight outlines.  | Medium   |      | Requires selection manager + outlines. |
| FE-105 | Layer Visualisation Framework          | Build API to toggle heatmaps, energy flows, anomalies with smooth blending.| Medium   |      | Hook into LabelLayoutManager + materials. |
| FE-106 | Saved Scene Presets                    | Snapshot layout/layer/camera combos for rapid context switching.           | Low      |      | Store presets in config with UI controls. |
| FE-107 | Navigation & Orbit Enhancements        | Add camera bookmarks, keyboard shortcuts, and refined orbit damping.       | High     |      | Build on existing Setup/controls; coordinate with UI shell. |

## In Progress
| ID | Title | Started (YYYY-MM-DD) | Owner | Notes |
|----|-------|----------------------|-------|-------|
| FE-101a | Solar Telemetry Ingest | 2025-11-03 | | Smoothing + fallback complete; validate against live HA feed. |
| FE-101b | Sun Path & Sky Dome | 2025-11-03 | | Sky dome + arc controls in Tweakpane; awaiting palette tuning with telemetry. |
| FE-101c | Moon Companion | 2025-11-03 | | Moon controller implementation underway (astro util + lighting). |
| FE-107 | Navigation & Orbit Enhancements | 2025-11-03 | | Bookmark API, keyboard nav, focus/fly-to implemented; QA pending. |
| FE-102 | Material & Post FX Pass | 2025-11-03 | | Sky/material audit underway; target palette + PBR plan next. |

## Review / QA
| ID | Title | PR / Branch | Reviewer | Notes |
|----|-------|--------------|----------|-------|

## Done
| ID | Title | Completed (YYYY-MM-DD) | Outcome |
|----|-------|------------------------|---------|
