# UIL GUI Integration Project

Modernise the Smart Campus 3D experience controls by migrating from Tweakpane to the [UIL library](https://github.com/lo-th/uil), tailoring its 3D-ready widgets (see [uil_3d demo](https://lo-th.github.io/uil/examples/uil_3d.html)) for sensors, room layers, camera bookmarks, and future telemetry surfaces. This project owns the strategy, implementation, and documentation for the transition.

## Objectives
- Remove Tweakpane dependencies and associated styling/scripts across the repo.
- Stand up a reusable UIL controller layer that:
  - Adjusts scene/environment settings (camera, lighting, HDRI, sun/moon, post FX).
  - Surfaces HA-driven toggles (room isolation, sensor categories, HUD filters).
  - Exposes room-level actions (select/focus, bookmarks, saved presets).
  - Mirrors the UIL 3D demo layout with multi-sided panels (navigation on the left, lighting/post FX on the right, sensor + room controls on additional rails) so the campus scene gains purpose-built controls on at least three sides of the model.
- Keep the control layer ready for the WebGPU + TSL renderer upgrades (FE-108/WebGPU project) so we can swap renderers without rewriting panel bindings.
- Deliver a pattern for registering controls by module (e.g., navigation, lighting, HUD) so other teams can extend the UI without editing core wiring.

## Success Criteria
1. Tweakpane is fully removed from the bundle, with no dangling imports or CSS.
2. The UIL layer loads with the 3D scene, matches the current design language, and supports keyboard/touch.
3. At least one HA-driven controller (e.g., occupancy highlight toggle) is backed by live data.
4. Documentation covers how to register controllers, theme UIL, and debug states.

## Dependencies
- 3D Experience project (scene instrumentation, RoomSelectionController).
- WebGPU renderer initiative (ensure control wiring matches updated rendering pipeline).
- Home Assistant connectivity (for live sensor inputs).

## Stakeholders
- Codex (orchestrator / implementation)
- UI/Scene teams (consumers of the control APIs)
- Data pipeline team (HA events feeding control state)

## References / Research
- UIL repo: https://github.com/lo-th/uil
- UIL 3D demo: https://lo-th.github.io/uil/examples/uil_3d.html
- Existing Tweakpane usage: `src/debug/`, `Setup.js`, `scene.js`

## Workflow Expectations
- Every task must start with a quick web search on the relevant UIL topic (e.g., “UIL custom themes”, “UIL WebGL integration”) and log the findings/links in `tasks.md`.
- Session logs live under `agents-docs/projects/uil-gui-integration/sessions/`; create one before committing code changes tied to this project.
- Coordinate breaking changes (e.g., removing Tweakpane) with the 3D Experience project to avoid regressions.
