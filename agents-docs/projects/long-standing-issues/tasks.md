# Task Ledger

Track every task for this project here. Keep the table sorted by priority (top = highest). Move items between sections as they progress.

## Backlog
| ID | Title | Description | Priority | Owner | Notes |
|----|-------|-------------|----------|-------|-------|

## In Progress
| ID | Title | Started | Owner | Notes |
|----|-------|---------|-------|-------|

## Review / QA
| ID | Title | PR / Branch | Reviewer | Notes |
|----|-------|-------------|----------|-------|

## Done
| ID | Title | Completed | Outcome |
|----|-------|-----------|---------|
| LD-101 | Core lint cleanup | 2025-11-08 | Removed unused vars/imports across pipeline, entry, sensors, UIL modules; `pnpm run lint` now passes cleanly. |
| LD-102 | UIL vendor lint strategy | 2025-11-08 | Dropped vendored UIL file entirely, switched docs + controller to npm `uil`, and lint no longer sees third-party code. |
| LD-103 | Renderer capability flags | 2025-11-08 | Added `@config/capabilities` helper so scene + UI derive a single capability snapshot (renderer/postFX/projector/HUD) instead of ad-hoc checks. |

> Add or remove columns as needed, but keep the structure predictable so others can grok status fast.
