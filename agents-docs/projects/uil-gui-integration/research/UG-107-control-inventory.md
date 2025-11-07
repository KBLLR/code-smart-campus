# UG-107 — UIL Control Inventory & Scene Mapping

> Research sources: existing UIL demo (`src/vendor/uil.module.js` + https://lo-th.github.io/uil/examples/uil_3d.html) and prior experience; live web search is currently unavailable in this environment.

## 1. Control Palette

| UIL Widget (constructor key) | Interaction Pattern | Notes from UIL demo / source | Potential Campus Mapping |
| --- | --- | --- | --- |
| `number` / `slide` | Horizontal slider with numeric display | Supports ranges, step, precision | Camera FOV, orbit speeds, HDR exposure, sensor thresholds |
| `bool` | Toggle switch | Binary on/off with label | Layer visibility (rooms, sensors), auto-rotate, HUD enable |
| `color` | Color picker (wheel + RGBA) | Emits hex/string/array | Fog color, gradient stops, label accents |
| `list` | Dropdown selector | Accepts array of options, can be searchable | Room presets, HA entities, camera bookmarks |
| `button` | Momentary action | Can style as text or icon | Focus selected room, export STL, reset camera |
| `joystick` | 2D pad returning -1..1 | Demo uses it for rotation; good for analog controls | Fine-grained camera pan, sun azimuth/elevation scrubber |
| `pad` | 2D absolute pad (0..1) | Similar to joystick but absolute coords | Teleport target selection, HUD anchor positions |
| `graph` | Oscilloscope-style plot | Real-time value display | Sensor trend preview (temperature, occupancy) |
| `string` / `text` | Input box | Supports placeholders and validation | Filter rooms by name, label overrides |
| `knob` | Circular dial | Continuous 0..1 range | Audio levels in makerspace, sun intensity |
| `progress` | Read-only bar | Visual status | Connection health, data refresh cycle |
| `joystickH` / `joystickV` | One-axis analog pads | Variation on joystick | Elevator-style vertical control, timeline scrub |
| `selector` | Multi-toggle chips | Allows multi-state selection | Sensor category filter (environment/people/etc.) |
| `folder` | Collapsible grouping | Nest controls hierarchically | Modules: Navigation, Lighting, Sensors, Post FX |
| `tab` | Horizontal tabs | Switch between panels | Contexts (Campus / Sensors / Debug) |

## 2. Mapping Ideas

### Navigation & Camera
- Use **joystick** for manual orbit/pan when orbit controls are locked (mobile-friendly). Pair with `number` sliders for zoom/FOV.
- `list` for camera bookmarks (`Top`, `Iso`, `North Wing`). Buttons for “Save Bookmark” and “Go To”.
- `bool` toggles for auto-rotate + bounds clamp; `knob` for rotation speed.

### Lighting & Environment
- `color` and `number` to edit gradient stops/fog density (replacing current Tweakpane palette). `selector` to pick day/night preset.
- `joystick` (polar) to scrub sun azimuth/elevation; `pad` for HDR skybox offset.

### Sensors & Rooms
- `list` tied to HA entity registry for jumping to a sensor; `graph` to preview last n readings from the data pipeline.
- `selector` for sensor categories (Scheduling / Occupancy / Misc). Each selection toggles HUD layer + sensor dashboard sync.
- `progress` bars for occupancy percentage per floor; `color` for heatmap palette adjustments.

### Utilities & Debug
- `button` actions for exporting STL, clearing highlights, triggering diagnostics.
- `string` inputs for filtering rooms (hook into LabelManager search when FF-002 lands).
- `tab` to separate “Operator” vs “Debug” layouts.

## 3. Notes / Considerations
- UIL supports custom theming by overriding CSS variables in `uil.css`; need to align with HUD glass aesthetic (dark background, cyan accents).
- Vendor bundle (`src/vendor/uil.module.js`) exports `UIL.Gui`. We can build a wrapper module (e.g., `src/ui/UILController.js`) to abstract registration so modules don't import the vendor directly.
- Some UIL widgets (graph, joystick) depend on RAF; ensure they pause when the panel is hidden to save perf.
- Accessibility: UIL focus handling is custom—will need to add ARIA labels mirroring our existing toolbar semantics.

## 4. Next Steps
- UG-102: Define a JSON / builder schema mapping (e.g., `{ module: "lighting", controls: [{ type: "color", id: "fogColor", onChange: ... }] }`) using the inventory above.
- UG-103: Document every Tweakpane instantiation and map each folder to a replacement UIL folder.
- UX sync: confirm whether UIL should render left or right side, and how it coexists with the existing toolbar.
