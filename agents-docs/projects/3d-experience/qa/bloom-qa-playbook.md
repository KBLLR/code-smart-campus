# Bloom QA Playbook (FE-102)

_Draft – 2025-11-03_

## Goals
- Capture reference frames with bloom **on/off** for design review.
- Validate palette & fog response during real sunrise/sunset telemetry.
- Record any perf impact (FPS + frame time) when bloom is enabled.

## Prereqs
- `npm run dev` with the campus scene reachable in a Chromium-based browser.
- Access to Home Assistant live data (sunrise/sunset windows recommended).
- Tweakpane Debugger enabled (`R` toggle) to reach the “✨ Post FX” folder.

## Capture Steps
1. Position the camera on the target view (Toolbar bookmark or manual orbit).
2. Open browser DevTools console and run:

   ```js
   // Bloom ON capture
   scene.userData.postFX.captureSnapshot({
     bloomEnabled: true,
     download: true,
     filename: "campus-bloom-on.png",
   });

   // Bloom OFF capture
   scene.userData.postFX.captureSnapshot({
     bloomEnabled: false,
     download: true,
     filename: "campus-bloom-off.png",
   });
   ```

3. Repeat for each lighting slot (dawn/day/dusk/night). Note the Home Assistant timestamps.

## Visual Checklist
- Bloom adds subtle glow to emissive labels and sensor nodes without blowing out the floor.
- Fog colour tracks the sky palette (warmer at dawn/dusk, cooler at night).
- Materials still read with depth (no plastic washes).

## Telemetry QA
- Log sun elevation, azimuth, and palette slot during each capture.
- For sunrise/sunset, verify the gradient transitions over ~10 minutes.

## Performance Notes
- Record FPS and frame-time with and without bloom (`console.table(scene.userData.cameraDebug.getState())` for control limits).
- Flag any drop >15% and note device specs.

## Deliverables
- `docs/projects/3d-experience/qa/screenshots/` – store PNGs with naming `YYYYMMDD_slot_bloom-{on|off}.png`.
- Append findings to the latest session log or create a dedicated QA note.
