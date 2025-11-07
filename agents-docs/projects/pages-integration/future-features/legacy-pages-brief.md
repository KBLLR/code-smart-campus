# Legacy Pages Snapshot

_Last updated: 2025-11-06_

## Interactive Floorplan (`src/data/assets/interactive_floorplan.html`)
- Embeds `annotated_floorplan.svg` via `<object>` tag with fixed `1627px` height and no dynamic data.
- Inline CSS duplicates basic resets (Arial font, grey background) and sets a wide container (`max-width: 2025px`).
- No scripts are executed; page assumes static SVG tooling supplies annotations.
- Migration needs:
  - Swap inline styles for shared layout tokens (`main.css`).
  - Replace `<object>` with an importable SVG or canvas overlay tied to the room registry.
  - Expose route-level data to highlight rooms/sensors consistent with the 3D HUD.

## Sensors Dashboard (`src/data/assets/sensors.html`)
- Static HTML cards (`.room-card`) per room, each using placeholder spans with IDs for temperature/humidity/occupancy.
- Imports `ha-dashboard-bridge.js` dynamically using `<script type="module">` but assumes relative path execution outside Vite.
- Includes global `window.refreshDashboardUI` binding and manual button to trigger updates.
- Migration needs:
  - Convert to a reactive component (e.g., vanilla JS modules, lit, or lightweight framework) that subscribes to HA state manager.
  - Align card styling with panel shell tokens and iconography.
  - Wrap refresh logic in the shared coordinator instead of using `window` globals.

## Shared Considerations
- Both pages rely on legacy static hosting; Vite build must expose them either via multipage outputs or app router.
- Accessibility, i18n, and responsive behaviour are currently absent; new pages should meet the same standards as the 3D shell.
- Ensure registry generation runs before each build so pages and 3D scene read a consistent dataset.
