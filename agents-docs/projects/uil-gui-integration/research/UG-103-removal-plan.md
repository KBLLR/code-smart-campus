# UG-103 — Tweakpane Removal Plan

> Research/reference: current code base (`src/main.js`, `src/debug/Debugger*.js`, `src/Setup.js`), UIL scaffold, no external web search available.

## 1. Current Tweakpane Touchpoints

| Area | File(s) | Purpose | Replacement target |
|------|---------|---------|---------------------|
| Debugger UI | `src/debug/Debugger.js`, `src/debug/DebuggerB.js` | Object picker, orbit controls, FPS graph, sun visual tuning, misc toggles | Convert folders into UIL descriptors (Navigation/Sun modules). FPS graph can move to StatsGL. Remove DebuggerB entirely. |
| Setup shortcuts | `src/Setup.js` | Currently imports `Pane` but unused (legacy). | Safe to delete import + any leftover Pane code when confirmed. |
| Global debug settings | `src/main.js` | Maintains `debugSettings` object, `toggleDebugUI`, keyboard toggles for Tweakpane. | Replace with UIL visibility toggles or remove entirely if debugger becomes optional. |
| CSS remnants | `.tp-dfwv` selectors (styles/main.css) | Ensures Tweakpane panel clickable. | Remove once Tweakpane DOM gone. |

## 2. Removal Steps
Status: ✅ Phase 1 (UIL debugger controls + dependency removal) completed 2025-11-07. Remaining work noted below.

1. **Debugger refactor**
   - Build UIL descriptors equivalent to each Tweakpane folder: object picker (list), orbit controls (sliders/buttons), sun visuals (already in `SunSkyControls`), misc toggles.
   - Introduce a `DebuggerService` that registers these modules with UIL and wires event listeners (e.g., room mesh selection).
   - Remove `Debugger.js` Pane instance once feature parity achieved; keep selection/highlight logic.

2. **Keyboard toggles & state**
   - Replace `toggleDebugUI` with UIL visibility flags (e.g., `uilController.setVisible(false)` or CSS class on root).
   - Update keyboard shortcuts (e.g., `D`) to hide/show UIL panel rather than collapsed Tweakpane.

3. **Dependencies & CSS**
   - Remove `tweakpane` and `@tweakpane/plugin-essentials` from `package.json` once debugger no longer references them.
   - Delete `.tp-dfwv` selectors and any Tweakpane-specific styling.

4. **Cleanup**
   - Ensure no lingering `Pane` imports (search entire repo).
   - Document in README/tasks that UIL is the sole control surface; note compatibility considerations for WebGPU/TSL.

## 3. Risks / Considerations
- Object picker: UIL list may need virtualization if many meshes; consider lazy filters.
- FPS monitoring: StatsGL panel already available; confirm coverage before removing Tweakpane graph.
- Keyboard toggles: Need to ensure accessibility (focus outlines) when hiding/showing UIL panels.

## 4. Next Actions
- Draft `DebuggerControls` module that mirrors existing pane functionality.
- Plan package cleanup PR once code migration is ready (maybe separate commit to reduce risk).
