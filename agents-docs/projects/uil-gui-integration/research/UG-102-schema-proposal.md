# UG-102 — UIL Control Schema Proposal

> Research sources: UIL npm package (`import("uil")`), existing Tweakpane wiring (`src/debug/Debugger.js`, `src/main.js`), and the UG-107 control inventory doc. Live web search unavailable; leveraging in-repo docs + prior knowledge.

## 1. Goals
- Provide a declarative way for modules (Navigation, Lighting, Sensors, PostFX) to register UIL controls without importing the vendor module directly.
- Support bidirectional binding: UIL control updates scene state, and scene/HA updates reflect back in the UI.
- Keep descriptors serializable (plain JSON-friendly objects) to enable future remote configs.

## 2. Core Concepts
### 2.1 UILController (runtime service)
Located at `src/ui/UILController.js`, responsible for:
- Lazy-loading `UIL.Gui` from the npm package (`import("uil")`).
- Creating the root panel(s) and handling layout (tabs or stacked folders).
- Registering module descriptors and instantiating controls via builder functions.
- Exposing an event bus so modules subscribe to control changes.
- Updating controls programmatically when external state changes (`updateControl`).

### 2.2 Module Descriptor Shape
```ts
interface UILModuleDescriptor {
  id: string;                // e.g., "navigation", "lighting"
  label?: string;            // Display name for folder/tab
  layout?: "folder" | "tab"; // Default = folder
  order?: number;            // Sorting priority
  controls: UILControlDescriptor[];
}

interface UILControlDescriptor {
  id: string;                  // unique within module
  type: UILControlType;        // "number" | "bool" | "color" | ...
  label?: string;
  default?: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[] | { label: string; value: any }[]; // for lists/selectors
  joystick?: "2d" | "x" | "y"; // specialized metadata
  folder?: string;             // optional sub-group inside module folder
  bindings?: {
    get?: () => any;           // optional initial value hook
    set?: (value: any) => void; // called when user changes control
  };
  onChange?: (value: any, context: UILContext) => void; // alternative to bindings.set
  onUpdate?: (controlApi) => void; // subscribe to external events
  visibleWhen?: () => boolean;  // conditional display (e.g., only show when sensor selected)
  help?: string;                // tooltip / description
}
```

`UILControlType` enumerates the widgets listed in UG-107 (number, bool, color, list, button, joystick, pad, graph, string, knob, progress, selector).

### 2.3 Control API passed to Modules
When a module registers, UILController returns handles so modules can push updates without DOM knowledge:
```ts
interface UILControlHandle {
  id: string;
  setValue: (value: any, options?: { silent?: boolean }) => void;
  getValue: () => any;
  enable: () => void;
  disable: () => void;
  destroy: () => void;
}
```

### 2.4 Event Propagation
- User interaction → control `onChange` → module binding `set` → module updates scene/state.
- External update (e.g., HA event) → module calls `handle.setValue(newValue, { silent: true })` to update UI without triggering `onChange`.
- UILController also emits global events (`uil:change`, `uil:module-ready`) for debugging/logging.

## 3. Folder / Tab Layout Strategy
- Default root: vertical stack of folders pinned right side (matching UIL 3D demo). Each module descriptor becomes a folder.
- Optional tabs: if a module sets `layout: "tab"`, UILController groups those modules inside a tabbed panel (useful for splitting “Operator” vs “Debug”).
- Sub-folders: controls can specify `folder: "Camera"` to create nested sections inside the module folder.

## 4. Initialization Flow
1. `UILController.init({ mount: HTMLElement, theme: UILThemeOptions })` — loads vendor module, injects CSS, prepares root UI.
2. Feature modules call `UILController.registerModule(descriptor)` during their setup (e.g., after Setup.js config loads).
3. UILController instantiates controls sequentially, applying defaults or `bindings.get()` values.
4. When navigation occurs (e.g., new room selected), modules call `UILController.updateControl(moduleId, controlId, value)`.
5. `UILController.dispose()` cleans up when tearing down the scene or swapping views.

## 5. Theming Hooks
Expose theme options to align with existing HUD:
```ts
interface UILThemeOptions {
  accentColor?: string; // e.g., cyan
  background?: string;  // rgba glass
  borderColor?: string;
  fontFamily?: string;
}
```
These map to CSS variables injected via `UILController.applyTheme()`.

## 6. Migration Notes
- `src/debug/Debugger.js` becomes a thin adapter that registers its folders via the schema, easing removal once UIL fully replaces Tweakpane.
- `Setup.js` should no longer instantiate Tweakpane; instead, modules (navigation, lighting) register controls inside their init functions.
- Schema supports lazy modules: e.g., Sensors panel registers only after HA data pipeline connects, using `visibleWhen` for stateful controls.

## 7. Next Steps
1. Implement `src/ui/UILController.js` scaffolding with init/register/update/dispose using this schema.
2. Build first module descriptor (`NavigationControls`) covering camera distance, auto-rotate toggles, bookmark list.
3. Draft migration plan (UG-103) mapping each Tweakpane folder to a UIL descriptor section.
4. Coordinate with UX on theme + placement; update schema if additional layout metadata is required.
