# WR-014 — WebGPU Screen Atrezzo Notes

## Purpose
- Replace the legacy ProjectorLight-based “projector” with a decorative WebGPU screen plane.
- Ensure the screen is visible on scene load in WebGPU mode and controllable via UIL/debugger.

## Implementation Highlights
1. **Scene Bootstrap**
   - `bootstrapScreen(target?)` instantiates `WebGPUScreen` during setup.
   - Stores the instance under `scene.userData.screen` and updates capability flags (`screen.supported`, `screen.mode`).
   - Reacts to `roundedRoomsGroup` ready events to retarget the screen center.
2. **WebGPUScreen Class**
   - `src/three/WebGPUScreen.js` renders the grid texture as a `PlaneGeometry` with transparent material.
   - Configurable position and aspect ratio presets (`1:1`, `16:9`, `9:16`, `3:2`, `2:3`).
   - Methods: `setEnabled`, `setRatioPreset`, `setPosition`, `updateTarget`, `dispose`.
3. **Debugger & UIL Controls**
   - Debugger uses `extraEntries` to list the screen mesh in the selection dropdown.
   - `registerScreenControls` (UIL module) exposes visibility toggle, ratio list, and joystick-based position.
   - `screen-ready` event keeps the module in sync with runtime state.

## Usage Notes
- Screen is “atrezzo”: it exists for ambience and future projection experiments (WR-008/WR-009).
- Tie future content swaps (videos, texture atlas) into `WebGPUScreen` by adding texture assignment helpers.
- When WR-010 lands, repurpose the controls to include media selectors + tone adjustments.

## Follow-ups
- Port WR-008/WR-009 descriptions to “screen” terminology.
- Consider animation hooks (fade in/out) tied to slider state for better presentation.
