# FE-120 — UIL Control Surface Migration

_Draft – 2025-11-04_

## Goals
- Replace the current Tweakpane-based debugger panels with a UIL-driven control surface that feels closer to the 3D playground showcased in [UIL’s examples](https://lo-th.github.io/uil/examples/uil_3d.html).
- Consolidate camera, lighting, sensor, and layout toggles into a single dockable UI that supports both mouse and touch interactions.
- Provide a modular API so future feature teams can contribute additional folders without touching the core debugger code.

## Library Integration
- Ship UIL as an ESM-friendly bundle under `src/vendor/uil/`. (The upstream repo exposes a `build/uil.js` UMD; we can wrap it in a simple export until npm access is confirmed.)
- Lazy-load the library from `debug/UilPanel.js` so that the main scene boot path stays lean.
- Expose a factory `createUIL()` that returns the global `UIL.Gui` instance and registers shared themes (dark base, accent colours pulled from `styles/main.css` CSS variables).

## Proposed Architecture
```
src/debug/
 ├─ DebugSurface.js        (entry point replacing Debugger.js)
 ├─ panels/
 │   ├─ cameraPanel.js     (bookmarks, orbit controls, fly-to)
 │   ├─ lightingPanel.js   (sun palette, moon toggles, fog)
 │   ├─ postFxPanel.js     (bloom, capture helpers)
 │   ├─ sensorsPanel.js    (label refresh, HUD filters)
 │   └─ infoPanel.js       (selection info, history manager hooks)
 └─ uil/
     ├─ createUIL.js
     └─ themes.js
```

### Core Concepts
1. **DebugSurface**  
   - Orchestrates UIL creation, manages panel registration, and exposes `show()/hide()` plus `dispose()`.  
   - Listens to keyboard shortcut `R` (parity with old debugger) and toggles visibility via CSS class, not DOM removal.

2. **Panel Modules**  
   - Each panel exports `{ title, order, create(gui, context) }`.  
   - `context` holds references to `scene`, `setup`, `labelManager`, `hudManager`, `postFX`, and a tiny event emitter (`emit('focus-room', id)`).
   - Panels add UIL folders, wires callbacks, and returns an optional `dispose` hook for cleanup.

3. **Event Bridge**  
   - DebugSurface re-emits panel events to the scene helpers (`scene.userData.cameraDebug`, `scene.userData.hud.manager`, etc.).  
   - History Manager updates stream through a lightweight adapter that keeps UIL “list” widgets in sync.

4. **Styling**  
   - UIL ships with its own DOM; we’ll override themes via `styles/debug.css` to match our HUD (semi-opaque background, small corner radius).  
   - `UIL.Gui` is positioned beside the viewport (right edge) with collapse/expand chevrons; on mobile it becomes a bottom sheet.

## Migration Steps
1. **Branch Setup**  
   - Create `feat/ui-uil-gui` branch (ensure `.git/refs/heads` permissions allow branch creation in the CLI sandbox).  
   - Copy UIL build into `src/vendor/uil/uil.js` and add a barrel that re-exports `UIL`.

2. **Scaffold DebugSurface**  
   - New module instantiates UIL, registers shared state, and replaces Tweakpane bindings for camera, sun, post FX, and history.  
   - Wire keyboard toggles in `main.js` to activate the new surface.

3. **Panel Port**  
   - Port orbit/camera controls first (feature parity baseline).  
   - Re-implement sun/post FX palette controls, using colour pickers and slider widgets provided by UIL.  
   - Add a sensors panel that surfaces HUD filters (future tie-in to CSS HUD interactions).

4. **Remove Tweakpane**  
   - Delete `Debugger.js` + `DebuggerB.js`, drop Tweakpane dependencies from `package.json`, clean supporting CSS or helper code.  
   - Update `Setup.js` and other modules to stop importing Tweakpane.

5. **QA & Docs**  
   - Update keyboard shortcuts doc in `docs/projects/3d-experience/sessions/` log.  
   - Capture before/after screenshots for design review.  
   - Write migration notes in `docs/projects/3d-experience/tasks.md` (move FE-107/FE-103 sub-items if applicable).

## Open Questions
- Should UIL live-data widgets (graphs, spectrum) get bundled now or deferred until we hook actual telemetry streams?
- How much of the HUD management should be user-facing (e.g., layout presets) vs. developer-only toggles?
- Do we keep keyboard shortcuts for individual controls (auto-rotate, bookmark) once the new UI ships, or route everything through UIL?

---
**Next Actions**
- [ ] Vendor UIL library under `src/vendor/uil/`.  
- [ ] Implement `DebugSurface.js` skeleton with UIL bootstrapping and camera panel parity.  
- [ ] Remove Tweakpane imports and replace debugger wiring in `main.js`.  
- [ ] QA pass to ensure toggle parity before expanding to sensor-specific panels.
