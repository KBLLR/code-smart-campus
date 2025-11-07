# Task Ledger

Track every task for this project here. Keep the table sorted by priority (top = highest). Move items between sections as they progress.

## Backlog
| ID | Title | Description | Priority | Owner | Notes |
|----|-------|-------------|----------|-------|-------|
| RV-001 | Persona data ingestion | Load room/personality JSON mappings and expose helper API for room view. | High | Codex | Source: `rooms_personalities.json`, `personalities.json`. |
| RV-002 | Room view shell component | Build the split layout (avatar left, chat/actions right) with placeholder character art. | High | UI Agent | Reusable modal/panel summoned from raycast selection. |
| RV-003 | Chat interaction stub | Implement first-person greeting + action shortcuts per room, plus chat input stub. | High | | Integrate with DataPipeline hooks for stats. |
| RV-004 | Room-trigger wiring | Trigger room view when a room is selected via raycaster; pass persona + sensor snapshot. | High | | Depends on `RoomSelectionController`. |
| RV-005 | Voice & personality settings | Surface voice/personality metadata and prep hooks for TTS/voice playback. | Medium | | Reference persona JSON. |
| RV-006 | QA & accessibility checklist | Define a11y guidelines (focus trap, keyboard nav) and smoke tests for room popover. | Medium | QA | |

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
