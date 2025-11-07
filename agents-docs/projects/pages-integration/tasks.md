# Task Ledger

Track every task for this project here. Keep the table sorted by priority (top = highest). Move items between sections as they progress.

## Backlog
| ID | Title | Description | Priority | Owner | Notes |
|----|-------|-------------|----------|-------|-------|
| PG-001 | Asset & dependency audit | Catalogue the legacy HTML assets, SVG references, and JS bridges; document gaps vs current scene data. | High | Codex | Deliver findings in `sessions/` + attach to project doc. **(In progress)** |
| PG-002 | Vite entrypoint strategy | Decide between multi-page build or router-based approach; update `vite.config.js` and project docs. | High | Codex | Coordinate with WebGPU migration to avoid conflicts. **(In progress)** |
| PG-003 | Floorplan page refactor | Rebuild `interactive_floorplan.html` as a modern view with shared styles and dynamic room data. | High | UI Agent | Requires registry + label overlays. |
| PG-004 | Sensor dashboard page | Port `sensors.html` to a reactive dashboard consuming Home Assistant state. | High | UI Agent | Align card styles with panel shell; leverage `DataPipeline`. |
| PG-005 | Shared layout kit | Extract typography, spacing, and icon usage into reusable CSS/TS modules for pages. | Medium | | Must follow `@styles/main.css` conventions. |
| PG-006 | QA playbook | Define smoke tests and accessibility checks for each standalone page. | Medium | Claude QA | Link to QA template. |

## In Progress
| ID | Title | Started | Owner | Notes |
|----|-------|---------|-------|-------|
| PG-001 | Asset & dependency audit | 2025-11-06 | Codex | Legacy HTML reviewed; sensors page migration underway. |
| PG-002 | Vite entrypoint strategy | 2025-11-06 | Codex | Multi-page build configured (index + sensors). |
| PG-004 | Sensor dashboard page | 2025-11-06 | Codex | New `/sensors.html` dashboard scaffolded using DataPipeline. |

## Review / QA
| ID | Title | PR / Branch | Reviewer | Notes |
|----|-------|-------------|----------|-------|

## Done
| ID | Title | Completed | Outcome |
|----|-------|-----------|---------|

> Add or remove columns as needed, but keep the structure predictable so others can grok status fast.
