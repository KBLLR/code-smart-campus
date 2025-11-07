# Task Ledger — UIL GUI Integration

Track all work for this project here. Keep the table **sorted by priority** (top = highest). Every task must include a short summary of the prerequisite web search (links or keywords) in its Description or Notes column so future agents know which references were consulted.

## Backlog
| ID | Title | Description | Priority | Owner | Notes |
|----|-------|-------------|----------|-------|-------|
| UG-101 | UIL capability audit | (Search: “UIL custom panels”, “UIL import ES modules”) Inventory UIL components (ranges, folders, colour pickers) and determine theming needs vs. current UI shell. | High | Codex | Capture findings + theming plan. |
| UG-102 | Control schema design | (Search: “UIL dynamic controllers”, “UIL data binding three.js”) Define how modules register controls (JSON schema or builder API) and map to UIL widgets. | High | Codex | Blocks migration work. |
| UG-103 | Tweakpane removal plan | (Search: “replace tweakpane with UIL”, “UIL tree panels”) Catalogue all Tweakpane usages (Setup, Debugger, scene) and outline staged removal strategy. | High | Codex | Coordinate with 3d-experience project. |
| UG-104 | UIL integration MVP | Implement UIL loader + base panels (navigation, lighting, post FX) and ship feature parity with existing Tweakpane config. | High |  | Requires UG-101/102 complete. |
| UG-105 | Sensor-driven controls | Wire UIL toggles/sliders to HA data (e.g., occupancy heatmap, labels). Ensure state stays in sync when HA updates. | Medium |  | Depends on data pipeline events. |
| UG-106 | Accessibility & input polish | Ensure UIL overlay matches keyboard/touch expectations, respects focus trapping, and adopts current theming. | Medium |  | Work with UI/UX. |
| UG-107 | UIL control inventory & scene mapping | (Search: “UIL widgets list”, “UIL 3d controls examples”) Enumerate every UIL control type (sliders, joysticks, color pickers, graph, tree) and propose how each can drive Three.js navigation, sensors, or room interactions. | Medium | Codex | Feed output into UG-102 schema + UG-104 implementation. |

## In Progress
| ID | Title | Started (YYYY-MM-DD) | Owner | Notes |
|----|-------|----------------------|-------|-------|
| UG-102 | Control schema design | 2025-11-07 | Codex | Uses UG-107 research; schema documented in `research/UG-102-schema-proposal.md`. |
| UG-103 | Tweakpane removal plan | 2025-11-07 | Codex | Active audit in `research/UG-103-removal-plan.md`; blocking full migration. |
| UG-104 | UIL integration MVP | 2025-11-07 | Codex | Navigation + Lighting/Sun modules stacked on left rail; in-canvas panels prototyped (placement still WIP). |
| UG-107 | UIL control inventory & scene mapping | 2025-11-07 | Codex | Research limited to existing UIL docs bundled in repo + prior references (no live web). |

## Review / QA
| ID | Title | PR / Branch | Reviewer | Notes |
|----|-------|--------------|----------|-------|

## Done
| ID | Title | Completed (YYYY-MM-DD) | Outcome |
|----|-------|------------------------|---------|
