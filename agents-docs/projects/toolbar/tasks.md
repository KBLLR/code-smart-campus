# Task Ledger

Track every task for this project here. Keep the table sorted by priority (top = highest). Move items between sections as they progress.

## Backlog
| ID | Title | Description | Priority | Owner | Notes |
|----|-------|-------------|----------|-------|-------|
| TB-101 | Toolbar patterns research | (Search: \"application toolbar component\", \"three.js hud toolbar\") Compile references for multi-panel toolbars that mix status chips + avatars; capture layout + accessibility takeaways. | High | Codex | Outputs design references + constraints. |
| TB-102 | API & data contract | (Search: \"toolbar action registry\", \"UI command bus architecture\") Define how views register actions/status data, including schemas for HA connection capsules and room summaries. | High | Codex | Blocks implementation. |
| TB-103 | Layout + style prototype | (Search: \"glassmorphism toolbar css\", \"responsive toolbar flex patterns\") Build shared component (`ToolbarShell`) with left/mid/right slots matching sensors hero aesthetics. | High | Codex | Depends on TB-101/102. |
| TB-104 | Avatar & action menu | (Search: \"toolbar avatar dropdown ux\", \"status menu accessibility\") Implement avatar chip with user menu + quick settings, wired into HA auth + UIL hooks. | Medium |  | Requires TB-102 contract. |
| TB-105 | Integration rollout | (Search: \"shared toolbar multi page integration\") Mount toolbar on 3D scene + sensors page, ensuring no overlap with HUD panels. | Medium |  | After TB-103 baseline. |

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
