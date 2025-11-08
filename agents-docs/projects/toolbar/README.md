# Toolbar Experience Project

Design and implement a reusable toolbar system that anchors every campus view (3D scene, dashboards, detail pages) with consistent controls, state indicators, and user affordances.

## Why This Matters
- Stakeholders need a single entry point for navigation, filters, and live HA status instead of scattered buttons.
- Future agents (UIL, Pages, Room Views) can plug features into the toolbar rather than rebuilding bespoke headers.

## Scope
1. **Layout & Architecture**
   - Responsive toolbar shell that slots into Vite views without fighting existing HUD/sensor panels.
   - Left cluster for view breadcrumbs + page title, center for contextual filters/status, right cluster for avatar/actions.
2. **State & Data Wiring**
   - Hook into HA connection state, sensor summaries, and room-selection events.
   - Provide an action bus so other modules can register buttons, toggles, or dropdowns.
3. **Interaction Patterns**
   - Support mouse, touch, and keyboard focus.
   - Integrate UIL/WebGPU constraints (no Tweakpane).

## Success Criteria
- Toolbar renders on the 3D campus view and sensors page with identical markup/styles.
- Displays live HA connection capsule, selected room summary, and avatar menu.
- Exposes a documented API for other projects (room-views, UIL GUI, data pipeline) to inject actions.

## Stakeholders & Partners
- **3D Experience** — needs toolbar hooks for camera + room selection.
- **Data Pipeline / Home Assistant** — supplies connection + sensor status.
- **UIL GUI Integration** — may surface advanced controls inside toolbar flyouts.

## Dependencies
- Home Assistant client for connection + user identity.
- Design tokens from `src/styles/main.css` and sensor page hero.

## Working Agreements
- Every task must begin with a quick web/knowledge search; record keywords/links inside `tasks.md`.
- Each session logged under `sessions/` before committing code.
