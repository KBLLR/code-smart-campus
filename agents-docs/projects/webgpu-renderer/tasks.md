# Task Ledger

Track every task for this project here. Keep the table sorted by priority (top = highest). Move items between sections as they progress.

## Backlog
| ID | Title | Description | Priority | Owner | Notes |
|----|-------|-------------|----------|-------|-------|
| WR-001 | Render pipeline audit | Inventory every renderer dependency (postFX, materials, HUD) and flag WebGPU blockers. | High | Codex | Initial findings captured in `future-features/pipeline-audit.md` (2025-11-07). |
| WR-002 | Toolchain readiness | Configure Vite/ESLint/TypeScript to compile `three/webgpu` entrypoints and TSL syntax. | High | Codex | Remove WebGL assumptions; ensure build ships WebGPU only. |
| WR-003 | WebGPU bootstrap | Replace the WebGLRenderer instantiation with WebGPURenderer + minimal scene render loop. | High | | Validate controls, resize, stats on WebGPU path. |
| WR-012 | WebGPU fundamentals research | (Search: "what is WebGPU", "WebGPU vs WebGL performance", "WebGPU security sandbox") Produce a concise brief covering what WebGPU is, which problems it solves (performance, compute, portability), and how those answers shape our campus renderer roadmap. | High | Codex | Capture findings in `research/WR-012-webgpu-overview.md` with sources + implications. |
| WR-013 | TSL & Three materials research | (Search: "three tsl node material guide", "three r181 materials webgpu limitations") Document the current Three r181 material/TSL landscape, outlining capabilities, efficiency trade-offs, and limitations we must respect when targeting WebGPU. | High | Codex | Focus on room materials + projector pipelines; summarize in `research/WR-013-tsl-materials.md`. |
| WR-004 | Post-processing strategy | Evaluate replacements for EffectComposer bloom + tone mapping on WebGPU. | Medium | | Compare `postprocessing` WebGPU branch vs custom nodes. |
| WR-005 | QA/perf checklist | Draft validation plan covering FPS, memory, HDR correctness across major devices. | Medium | Claude QA | Align with campus perf targets. |
| WR-006 | Room TSL shader research | (Search: "three tsl room material", "webgpu tsl shading nodes") Prototype TSL shaders for campus rooms (gradient trims, sensor overlays) and document best practices. | Medium | Codex | Required for future room-highlighting + ML overlays. |
| WR-007 | WebGPU ML staging | (Search: "webgpu ml pipeline", "three webgpu compute shader tutorial") Outline how the renderer can host lightweight ML inference (e.g. occupancy prediction) using WebGPU compute nodes. | Medium | Codex | Capture in future-features doc. |
| WR-008 | WebGPU projector mapping | (Search: "interactive video projection mapping three.js", "three webgpu projector light") Build a projector system inspired by [Codrops](https://tympanus.net/codrops/2025/08/28/interactive-video-projection-mapping-with-three-js/), [CodeSandbox multiple grids](https://codesandbox.io/p/sandbox/05-multiple-grids-xyyvcm), and the official [Three WebGPU projector example](https://threejs.org/examples/webgpu_lights_projector.html) to overlay media/sensor data onto campus geometry. | Medium | Codex | Requires WebGPU-only node materials + projector falloff controls. |
| WR-009 | Projector media modules (image/video/procedural) | (Search: "texture atlas projection mapping webgpu", "video texture projector three.js") Build three projector content modules: atlas-driven images (using `public/textureAtlas.webp`), video playback, and procedural patterns. Each should expose resolution/aspect/format controls and share a common API for swapping sources at runtime. | Medium | Codex | Depends on WR-008 base projector. |
| WR-010 | Projector parameter API | (Search: "projector light penumbra three.js", "webgpu projector controls") Surface projector controls (intensity, penumbra, angle, distance, aspect) via a config API/UIL module so QA can tweak beams without code changes. | Medium | Codex | Builds on WR-008 infrastructure. |
| WR-011 | WebGPU UIL separation | Introduce a WebGPU-specific UIL panel that only registers WebGPU-ready modules (projector, WebGPU nav/node tools) and skip legacy WebGL controls. Coordinate with FE-113. | High | Codex | Prevents half-working controls when WebGPU renderer is active. |
| WR-014 | Projector bootstrap & debugger wiring | Instantiate `WebGPUProjector` as part of core scene setup, expose capability flags immediately, and add debugger/UIL controls so the projector is visible and tweakable from the start. | High | Codex | Builds on WR-008/WR-010 foundation. |

## In Progress
| ID | Title | Started | Owner | Notes |
|----|-------|---------|-------|-------|
| WR-003 | WebGPU bootstrap | 2025-11-07 | Codex | Renderer factory + env flag landed; WebGPU instantiation guarded by `VITE_WEBGPU_MODE`. |
| WR-006 | Room TSL shader research | 2025-11-07 | Codex | First pass node material (`src/three/materials/RoomNodeMaterial.js`) now powers rooms when WebGPU is enabled. Research log in `research/WR-006-room-tsl.md`. |
| WR-008 | WebGPU projector mapping | 2025-11-07 | Codex | `WebGPUProjector` now instantiates a `ProjectorLight` + grid texture when WebGPU is enabled; hooked up after `roundedRoomsGroup` resolves. |
| WR-011 | WebGPU UIL separation | 2025-11-07 | Codex | WebGL controls gated off when WebGPU is active; dedicated WebGPU module surface next. |

## Review / QA
| ID | Title | PR / Branch | Reviewer | Notes |
|----|-------|-------------|----------|-------|

## Done
| ID | Title | Completed | Outcome |
|----|-------|-----------|---------|
| WR-012 | WebGPU fundamentals research | 2025-11-08 | Added `research/WR-012-webgpu-overview.md` covering API scope, benefits, and migration implications. |
| WR-013 | TSL & Three materials research | 2025-11-08 | Captured TSL/node-material compatibility notes in `research/WR-013-tsl-materials.md` for WebGPU readiness. |
| WR-014 | Projector bootstrap & debugger wiring | 2025-11-08 | Projector now initializes with the scene, sets capability flags, and appears in debugger/UIL selections immediately. |

> Add or remove columns as needed, but keep the structure predictable so others can grok status fast.
