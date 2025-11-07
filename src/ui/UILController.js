// src/ui/UILController.js
// Thin wrapper around the vendored UIL module so feature teams can describe
// their controls declaratively without touching the vendor code directly.

/**
 * @typedef {Object} UILModuleDescriptor
 * @property {string} id
 * @property {string} [label]
 * @property {boolean} [open]
 * @property {Array<UILControlDescriptor>} [controls]
 */

/**
 * @typedef {Object} UILControlDescriptor
 * @property {string} id
 * @property {string} [label]
 * @property {'number'|'slide'|'bool'|'color'|'list'|'selector'|'button'} [type]
 * @property {any} [default]
 * @property {number} [min]
 * @property {number} [max]
 * @property {number} [step]
 * @property {number} [precision]
 * @property {Array<any>} [options]
 * @property {{ get?: () => any, set?: (value:any) => void }} [bindings]
 * @property {(value:any, ctx:{moduleId:string, controlId:string, handle:any}) => void} [onChange]
 */

export class UILController {
  constructor() {
    this.options = { width: 280, theme: {} };
    this.modules = new Map(); // moduleId -> { descriptor, folder, controls: Map }
    this.controlIndex = new Map(); // `${moduleId}.${controlId}` -> controlHandle
    this.gui = null;
    this.UIL = null;
    this.mount = null;
    this.initialising = null;
  }

  /**
   * Lazy-initialise UIL GUI.
   * @param {{ mount?: HTMLElement | null, width?: number, theme?: Record<string,string> }} [opts]
   */
  async init(opts = {}) {
    if (this.gui) return this.gui;
    if (this.initialising) return this.initialising;

    this.options = { ...this.options, ...opts };
    this.mount = this.options.mount || document.body;

    this.initialising = import("@/vendor/uil.module.js")
      .then((module) => {
        this.UIL = module.UIL || module.default || module;
        if (!this.UIL) throw new Error("[UILController] Failed to load UIL module.");
        this.gui = new this.UIL.Gui({
          width: this.options.width,
          css: "uil-js",
          bg: "none",
          parent: this.mount,
        });
        this.applyTheme(this.options.theme || {});
        return this.gui;
      })
      .finally(() => {
        this.initialising = null;
      });

    return this.initialising;
  }

  /**
   * Apply CSS variables exposed by UIL for theming.
   * @param {Record<string,string>} theme
   */
  applyTheme(theme = {}) {
    if (!theme || !Object.keys(theme).length) return;
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--uil-${key}`, value);
    });
  }

  /**
   * Register a module descriptor. Folders are created lazily once init resolves.
   * @param {UILModuleDescriptor} descriptor
   */
  async registerModule(descriptor) {
    if (!descriptor?.id) throw new Error("[UILController] module requires an id");
    await this.init();

    if (this.modules.has(descriptor.id)) {
      console.warn(`[UILController] Module '${descriptor.id}' already registered. Skipping.`);
      return this.modules.get(descriptor.id);
    }

    const folder = this.gui.add("group", {
      name: descriptor.label || descriptor.id,
      open: descriptor.open !== false,
    });
    const record = {
      descriptor,
      folder,
      controls: new Map(),
    };
    this.modules.set(descriptor.id, record);

    (descriptor.controls || []).forEach((control) => {
      this.#createControl(record, control);
    });

    return record;
  }

  /**
   * Update a control programmatically.
   * @param {string} moduleId
   * @param {string} controlId
   * @param {any} value
   * @param {{ silent?: boolean }} [options]
   */
  updateControl(moduleId, controlId, value, options = {}) {
    const key = `${moduleId}.${controlId}`;
    const handle = this.controlIndex.get(key);
    if (!handle) {
      console.warn(`[UILController] Control '${key}' not found.`);
      return;
    }
    handle.setValue(value, options);
  }

  /**
   * Destroy UIL GUI and clear references.
   */
  dispose() {
    this.modules.clear();
    this.controlIndex.clear();
    if (this.gui?.clear) this.gui.clear();
    this.gui = null;
    this.UIL = null;
    this.mount = null;
  }

  /**
   * Internal: instantiate a control inside a module folder.
   * @param {{ descriptor: UILModuleDescriptor, folder: any, controls: Map<string, any> }} record
   * @param {UILControlDescriptor} control
   */
  #createControl(record, control) {
    const moduleId = record.descriptor.id;
    const controlId = control.id;
    const key = `${moduleId}.${controlId}`;
    const type = control.type || "number";

    const params = {
      name: control.label || control.id,
      ...(control.params || {}),
    };

    let pane;
    switch (type) {
      case "bool":
        pane = record.folder.add("bool", {
          ...params,
          value: control.default ?? false,
        });
        break;
      case "color":
        pane = record.folder.add("color", {
          ...params,
          value: control.default ?? "#ffffff",
        });
        break;
      case "list":
      case "selector":
        pane = record.folder.add("list", {
          ...params,
          list: control.options || [],
          value: control.default,
        });
        break;
      case "joystick":
        pane = record.folder.add("joystick", {
          ...params,
          value: control.default ?? { x: 0, y: 0 },
        });
        break;
      case "knob":
        pane = record.folder.add("knob", {
          ...params,
          min: control.min ?? 0,
          max: control.max ?? 1,
          step: control.step ?? 0.01,
          value: control.default ?? 0,
        });
        break;
      case "button":
        pane = record.folder.add("button", params);
        if (control.onChange) {
          pane.onChange(() => control.onChange?.(null, { moduleId, controlId }));
        }
        break;
      default:
        pane = record.folder.add("slide", {
          ...params,
          min: control.min ?? 0,
          max: control.max ?? 1,
          step: control.step ?? 0.01,
          precision: control.precision ?? 2,
          value: control.default ?? control.min ?? 0,
        });
        break;
    }

    if (!pane) return;

    const handle = {
      id: controlId,
      setValue: (value, { silent } = {}) => {
        if (value === undefined) return;
        if (pane.setValue) pane.setValue(value, silent);
      },
      getValue: () => {
        if (pane.getValue) return pane.getValue();
        return control.default;
      },
      enable: () => pane.enable?.(),
      disable: () => pane.disable?.(),
      destroy: () => pane.remove?.(),
    };

    if (control.onChange && pane.onChange) {
      pane.onChange((value) => {
        control.onChange?.(value, { moduleId, controlId, handle });
      });
    }

    if (control.bindings?.set) {
      pane.onChange?.((value) => control.bindings.set?.(value));
    }

    if (control.bindings?.get) {
      const initial = control.bindings.get();
      if (initial !== undefined) handle.setValue(initial, { silent: true });
    }

    record.controls.set(controlId, { control, pane, handle });
    this.controlIndex.set(key, handle);
  }
}

export const uilController = new UILController();
