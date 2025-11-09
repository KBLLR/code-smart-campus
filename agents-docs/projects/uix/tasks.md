# Task Ledger

Track every task for this project here. Keep the table sorted by priority (top = highest). Move items between sections as they progress.

## Backlog
| ID | Title | Description | Priority | Owner | Notes |
|----|-------|-------------|----------|-------|-------|
| UX-101 | Toolbar patterns research | (Search: \"application toolbar component\", \"three.js hud toolbar\") Compile references for multi-panel toolbars that mix status chips + avatars; capture layout + accessibility takeaways. | High | Codex | Outputs design references + constraints. |
| UX-102 | API & data contract | (Search: \"toolbar action registry\", \"UI command bus architecture\") Define how views register actions/status data, including schemas for HA connection capsules and room summaries. | High | Codex | Blocks implementation. |
| UX-104 | Avatar & action menu | (Search: \"toolbar avatar dropdown ux\", \"status menu accessibility\") Implement avatar chip with user menu + quick settings, wired into HA auth + UIL hooks. | Medium |  | Requires UX-102 contract. |
| UX-105 | Integration rollout | (Search: \"shared toolbar multi page integration\") Mount toolbar on 3D scene + sensors page, ensuring no overlap with HUD panels. | Medium |  | After UX-103 baseline. |
| UX-106 | Tab polish & telemetry | Hook tabbed toolbar into sensors dashboard + history capsules (lazy load summaries, state badges) so each tab reflects live data. | Medium | Codex | Follow-up to UX-103 implementation. |
| UX-107 | Header nav rail | Build the top-row header bar (icon nav, separators, page indicators) with responsive spacing and keyboard support. | High | Codex | Drives page switching UX. |
| UX-108 | Info/actions two-column page | Implement the page interior (30% info column with eyebrow/title/subtitle/description + 70% action grid) so every tab clearly explains its controls. | High | Codex | Depends on UX-107 nav wiring. |
| UX-109 | Footer & motion polish | Define the footer row plus slide animations (open/close easing, spacing, padding) for a premium touch/desktop experience. | Medium | Codex | Requires UX-107/108 base layout. |

## In Progress
| ID | Title | Started | Owner | Notes |
|----|-------|---------|-------|-------|

## Review / QA
| ID | Title | PR / Branch | Reviewer | Notes |
|----|-------|-------------|----------|-------|

## Done
| ID | Title | Completed | Outcome |
|----|-------|-----------|---------|
| UX-103 | Layout + style prototype | 2025-11-08 | Replaced the legacy icon strip with a draggable bottom sheet, tabbed sections, and lazy-built content groups (layouts, sensors, views, tools, export). |

> Add or remove columns as needed, but keep the structure predictable so others can grok status fast.
