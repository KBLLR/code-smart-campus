# Task Ledger — UIL GUI Integration

Track all work for this project here. Keep the table **sorted by priority** (top = highest). Every task must include a short summary of the prerequisite web search (links or keywords) in its Description or Notes column so future agents know which references were consulted.

## Backlog
| ID | Title | Description | Priority | Owner | Notes |
|----|-------|-------------|----------|-------|-------|
| UG-101 | UIL capability audit | (Search: “UIL custom panels”, “UIL import ES modules”) Inventory UIL components (ranges, folders, colour pickers) and determine theming needs vs. current UI shell. | High | Codex | Capture findings + theming plan. |
| UG-102 | Control schema design | (Search: “UIL dynamic controllers”, “UIL data binding three.js”) Define how modules register controls (JSON schema or builder API) and map to UIL widgets. | High | Codex | Blocks migration work. |
| UG-103 | Tweakpane removal plan | (Search: “replace tweakpane with UIL”, “UIL tree panels”) Catalogue all Tweakpane usages (Setup, Debugger, scene) and outline staged removal strategy. | High | Codex | Coordinate with 3d-experience project. |
| UG-104 | UIL integration MVP | Implement UIL loader + base panels (navigation, lighting, post FX) and ship feature parity with existing Tweakpane config. | High | Codex | WebGPU projector panel now always visible (joystick + knobs) and logs readiness; still need lighting/sensor modules once separation lands. (Search: “UIL canvas panels three.js placement”, “UIL joystick three.js raycast”). |
| UG-105 | Sensor-driven controls | Wire UIL toggles/sliders to HA data (e.g., occupancy heatmap, labels). Ensure state stays in sync when HA updates. | Medium |  | Depends on data pipeline events. |
| UG-106 | Accessibility & input polish | Ensure UIL overlay matches keyboard/touch expectations, respects focus trapping, and adopts current theming. | Medium |  | Work with UI/UX. |
| UG-107 | UIL control inventory & scene mapping | (Search: “UIL widgets list”, “UIL 3d controls examples”) Enumerate every UIL control type (sliders, joysticks, color pickers, graph, tree) and propose how each can drive Three.js navigation, sensors, or room interactions. | Medium | Codex | Feed output into UG-102 schema + UG-104 implementation. |
| UG-108 | WebGPU toggle control | (Search: “UIL toggle example”, “three renderer switch ui”) Add a debugger toggle that flips `VITE_WEBGPU_MODE` (or runtime flag) so testers can switch renderers without editing `.env`. Integrate with renderer diagnostics panel. | High | Codex | Blocks QA on WebGPU experiments. |
| UG-109 | UIL graph replacements | (Search: “UIL custom graph module”, “uil fps example”) Embed custom fps + graph widgets (per https://lo-th.github.io/uil/index.html) to replace stats-gl overlay and keep HUD consistent. | High | Codex | Aligns with new UIL-first CLIs. |
| UG-110 | Bloom knob row layout | (Search: “UIL row layout”, “UIL knobs grid”) Rework bloom strength/radius/threshold controls into a single horizontal row of knobs so the lighting module mirrors the reference layout. | Medium | Codex | Enhances ergonomics. |
| UG-111 | Draggable debugger & toolbar toggle | (Search: “UIL draggable panel”, “UIL close button example”) Make the UIL debugger stack draggable and expose its visibility via a toolbar icon toggle. Ensure pointer capture works with OrbitControls. | Medium | Codex | Improves usability + binds to hero toolbar action. |

## In Progress
| ID | Title | Started (YYYY-MM-DD) | Owner | Notes |
|----|-------|----------------------|-------|-------|
| UG-102 | Control schema design | 2025-11-07 | Codex | Uses UG-107 research; schema documented in `research/UG-102-schema-proposal.md`. |
| UG-103 | Tweakpane removal plan | 2025-11-07 | Codex | Active audit in `research/UG-103-removal-plan.md`; blocking full migration. |
| UG-104 | UIL integration MVP | 2025-11-07 | Codex | Projector module now loads unconditionally with joystick + knob UX; WebGPU vs WebGL separation tracked under FE-113/WR-011. |
| UG-107 | UIL control inventory & scene mapping | 2025-11-07 | Codex | Research limited to existing UIL docs bundled in repo + prior references (no live web). |

## Review / QA
| ID | Title | PR / Branch | Reviewer | Notes |
|----|-------|--------------|----------|-------|

## Done
| ID | Title | Completed (YYYY-MM-DD) | Outcome |
|----|-------|------------------------|---------|
