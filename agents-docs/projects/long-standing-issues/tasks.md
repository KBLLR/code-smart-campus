# Task Ledger

Track every task for this project here. Keep the table sorted by priority (top = highest). Move items between sections as they progress.

## Backlog
| ID | Title | Description | Priority | Owner | Notes |
|----|-------|-------------|----------|-------|-------|
| LD-101 | Core lint cleanup | Resolve `no-unused-vars` / legacy helpers blocking `npm run lint` (DataPipeline, main, sensors) so CI can re-enable linting. | High | Codex | Includes deleting unused functions or wiring them properly. |
| LD-102 | UIL vendor lint strategy | Decide how to handle `src/vendor/uil.module.js` (global ignore vs per-rule disable) so lint stops flagging 40+ issues on every run. | High | Codex | Coordinate with UIL GUI project. |
| LD-103 | Renderer capability flags | Ensure we expose capability metadata (`scene.userData.capabilities`) so UI checks don’t rely on ad-hoc conditions. | Medium | Codex | Follow-up to current renderer-aware split. |

## In Progress
| ID | Title | Started | Owner | Notes |
|----|-------|---------|-------|-------|

## Review / QA
| ID | Title | PR / Branch | Reviewer | Notes |
|----|-------|-------------|----------|-------|

## Done
| ID | Title | Completed | Outcome |
|----|-------|-----------|---------|

> Add or remove columns as needed, but keep the structure predictable so others can grok status fast.
