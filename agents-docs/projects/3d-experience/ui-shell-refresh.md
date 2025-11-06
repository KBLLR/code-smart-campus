# FE-108 — UI Shell Refresh Plan

_Draft – 2025-11-04_

## Why This Matters
- The current `panel-shell` / `hui-panel` stack blocks pointer events over the canvas, breaking orbit navigation and obscuring HUD labels.
- Legacy Tweakpane instances still mount (thin bar top-right) creating visual clutter and confusing state.
- Sensor dashboard markup no longer matches the latest `SensorDashboard` component styles, producing an off-theme white column.
- As we transition to CSS HUD controls and UIL debug panels, the surrounding UI shell needs to declutter so 3D interactions stay primary.

## Goals
1. Restore unobstructed camera/orbit controls while keeping utility panels accessible.
2. Harmonise dashboard + modal styling with the “glass” theme.
3. Retire residual Tweakpane UI in favour of the upcoming UIL surface.
4. Ensure HUD labels render by default (no modal prerequisite) and align visually with the rest of the shell.

## Current Audit
- `panel-shell` is rendered as a full-width column (`#content-area`) with 100+ Home Assistant cards; CSS forces pointer events so orbit controls cannot capture drag/zoom.
- `hud-root` renders underneath because the shell has `z-index: 2` and pointer events; the only visible labels are inside the modal invoked by toolbar “Labels”.
- `sensor-dashboard` DOM uses `.sensor-dashboard__category` markup but the stylesheet expects the newer `.sensor-dashboard__container` wrapper and `.sensor-dashboard__entry` rows.
- `Debugger` still instantiates Tweakpane (`Pane`), producing a collapsed strip even if HUD toggles are hidden.

## Proposed Execution
### Phase 1 — Interaction Unblock (FE-108a)
- Collapse or hide `panel-shell` by default; expose a floating toggle (existing `floating-btn`) to open it as overlay.
- Update stylesheet so `panel-shell` is off-canvas until explicitly opened; ensure pointer events default to `none` for the shell when hidden.
- Make `hud-root` top-most overlay with pointer events for labels only.
- Trim the number of HA summary cards surfaced at once (first 10 + “View All” CTA) so the overlay stays readable.

### Phase 2 — Dashboard Alignment (FE-108b)
- Update `SensorDashboard` to render a `.sensor-dashboard__container` wrapper and list entries that match the glass theme.
- Style categories with chips/badges consistent with HUD colours.
- Provide API to collapse/expand categories to avoid long scroll.

### Phase 3 — Debug Surface Transition (FE-108c)
- Temporarily hide Tweakpane pane via CSS or dispose call, pending UIL migration.
- When FE-120 lands, remove `Debugger.js` entirely and mount UIL surface in the same slot.

### Phase 4 — HUD Default Visibility (FE-103 follow-up)
- Hydrate `CSSHudManager` immediately after label injection; ensure HUD labels mount even with `panel-shell` closed.
- Provide toolbar actions (chips/search) that filter label DOM instead of enabling the modal list.

## Deliverables
- PR updating shell layout (`index.html`, `src/styles/main.css`), `SensorDashboard`, and `main.js` bootstrap.
- Documentation entry in `docs/projects/3d-experience/tasks.md` (FE-108) plus QA checklist.
- Screen capture showing unobstructed orbit + HUD visible, dashboard docked to right-hand side.
- Follow-up issue linking to FE-120 once Tweakpane removal blocked on UIL branch.

## Risks & Mitigations
- **Large DOM mutations** could cause layout flashes: use `prefers-reduced-motion` and fade transitions.
- **Accessibility**: ensure toggles preserve keyboard focus when panel-shell opens/closes.
- **Telemetry density**: keep the dashboard capped (e.g., top N per category) to avoid scroll performance hits.

## Status
- ✅ Phase 1 (Interaction Unblock) — panel shell hidden by default, orbit controls restored, Tweakpane hidden (2025-11-04).
- ⏳ Phase 2 (Dashboard Alignment) — styling updates underway alongside HUD pass.
- ⏳ Phase 3 (Debug Surface Transition) — blocked on FE-120 UIL migration branch.
- ⏳ Phase 4 (HUD Default Visibility/Search) — coordinated with FE-103.

## Related Tracks
- FE-103 (HUD polish & interactions)
- FE-107 (Navigation & orbit experience)
- FE-120 (UIL control surface migration)
