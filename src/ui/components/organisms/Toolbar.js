// src/ui/components/organisms/Toolbar.js
// Lightweight toolbar that wires layout controls, sensor category toggles, camera views, and export helpers.

import {
  labelCategories,
  cleanedLabelRegistry,
} from "@data/labelCollections.js";
import { sanitizeLabelRegistry } from "@utils/labelRegistryUtils.js";
import { MeshExporter } from "@utils/MeshExporter.js";
import { showLabelInfoModal } from "@molecules/LabelModal.js";

const LAYOUT_OPTIONS = [
  { key: "svg-aligned", icon: "floorplan.svg", label: "Floorplan" },
  { key: "clustered", icon: "layout-dashboard.svg", label: "Cluster" },
  { key: "grid", icon: "grid.svg", label: "Grid" },
  { key: "manual", icon: "pointer-code.svg", label: "Manual" },
];

const VIEW_OPTIONS = [
  { key: "default", icon: "perspective-view.svg", label: "Default" },
  { key: "iso", icon: "view-360-number.svg", label: "Isometric" },
  { key: "top", icon: "orthogonal-view.svg", label: "Top" },
  { key: "front", icon: "presentation.svg", label: "Front" },
  { key: "side", icon: "aligned.svg", label: "Side" },
];

const TOOL_ACTIONS = [
  {
    key: "list-labels",
    icon: "info.svg",
    label: "Labels",
    handler: () => showLabelInfoModal(),
  },
  {
    key: "toggle-uil",
    icon: "toggle-left.svg",
    label: "Debugger",
    isToggle: true,
    getState: (toolbar) => toolbar?.uilPanel?.isVisible?.() ?? true,
    handler: (toolbar, nextState) => toolbar?.toggleUILPanel(nextState),
  },
];

const EXPORT_ACTIONS = [
  {
    key: "export-gltf",
    icon: "badge-3d.svg",
    label: "GLB",
    handler(exporter, target) {
      if (!target) return console.warn("[Toolbar] No export target defined.");
      exporter.exportGLTF(target, "scene-export.glb", true);
    },
  },
  {
    key: "export-stl",
    icon: "view-360-arrow.svg",
    label: "STL",
    handler(exporter, target) {
      if (!target) return console.warn("[Toolbar] No export target defined.");
      exporter.exportSTL(target, "scene-export.stl", true);
    },
  },
];

export class Toolbar {
  constructor({
    rootSelector = "#toolbar-root",
    categories = labelCategories,
    layoutManager,
    labelManager,
    setupInstance,
    exportTarget = null,
    uilPanel = null,
  } = {}) {
    this.root =
      typeof rootSelector === "string"
        ? document.querySelector(rootSelector)
        : rootSelector;

    if (!this.root) {
      this.root = document.createElement("header");
      this.root.id = "toolbar-root";
      document.body.appendChild(this.root);
    }

    this.root.classList.add("toolbar", "toolbar__container", "theme-scifi-glass");

    this.categories = categories ?? labelCategories;
    this.layoutManager = layoutManager ?? null;
    this.labelManager = labelManager ?? null;
    this.setup = setupInstance ?? null;
    this.exportTarget = exportTarget;
    this.exporter = new MeshExporter();
    this.uilPanel = uilPanel;
    this.toolStates = new Map();

    this.activeLayout = "svg-aligned";
    this.activeCategories = new Set(
      (this.categories || []).map((category) => category.key),
    );

    // If a label manager was provided, make sure the layout manager sees the same registry.
    if (this.layoutManager && this.labelManager) {
      this.layoutManager.labels = this.labelManager.getLabels();
    }

    this.render();
  }

  render() {
    this.root.innerHTML = "";

    const fragment = document.createDocumentFragment();

    fragment.appendChild(this.buildGroup("Layouts", LAYOUT_OPTIONS, (option) =>
      this.handleLayoutChange(option.key),
    ));

    fragment.appendChild(this.createSeparator());

    fragment.appendChild(
      this.buildCategoryGroup(this.categories || [], (category, active) =>
        this.handleCategoryToggle(category.key, active),
      ),
    );

    fragment.appendChild(this.createSeparator());

    fragment.appendChild(this.buildGroup("Views", VIEW_OPTIONS, (option) =>
      this.handleViewChange(option.key),
    ));

    fragment.appendChild(this.createSeparator());

    fragment.appendChild(
      this.buildGroup("Tools", TOOL_ACTIONS, (action, state) =>
        action.handler?.(this, state),
      ),
    );

    fragment.appendChild(this.createSeparator());

    fragment.appendChild(
      this.buildGroup("Export", EXPORT_ACTIONS, (action) =>
        action.handler?.(this.exporter, this.exportTarget),
      ),
    );

    this.root.appendChild(fragment);
    this.syncInitialStates();
  }

  createSeparator() {
    const span = document.createElement("span");
    span.className = "toolbar__separator";
    span.textContent = "|";
    span.setAttribute("aria-hidden", "true");
    return span;
  }

  buildGroup(title, options, onSelect) {
    const group = document.createElement("div");
    group.className = "toolbar__group";
    group.dataset.role = title.toLowerCase();

    options.forEach((option) => {
      const button = this.createToolbarButton(option);
      button.addEventListener("click", () => {
        if (option.isToggle) {
          const nextState = !button.classList.contains("active");
          button.classList.toggle("active", nextState);
          button.setAttribute("aria-pressed", String(nextState));
          this.toolStates.set(option.key, nextState);
          onSelect(option, nextState, button);
        } else {
          onSelect(option, button);
        }
      });
      group.appendChild(button);
    });

    return group;
  }

  buildCategoryGroup(categories, onToggle) {
    const group = document.createElement("div");
    group.className = "toolbar__group toolbar__group--categories";

    categories.forEach((category) => {
      const button = this.createToolbarButton({
        key: category.key,
        icon: `${category.icon}.svg`,
        label: `${category.label}`,
        count: category.count,
        isToggle: true,
      });
      button.classList.add("toolbar__button--chip");
      button.dataset.category = category.key;
      button.addEventListener("click", () => {
        const nextState = !button.classList.contains("active");
        button.classList.toggle("active", nextState);
        button.setAttribute("aria-pressed", String(nextState));
        onToggle(category, nextState);
      });
      group.appendChild(button);
    });

    return group;
  }

  createToolbarButton(option) {
    const { key, icon, label, count, isToggle = false } = option;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "toolbar__button";
    if (isToggle) {
      button.classList.add("toolbar__button--toggle");
      const initialState =
        (typeof option.getState === "function"
          ? option.getState(this)
          : this.toolStates.get(key)) ?? true;
      button.setAttribute("aria-pressed", String(initialState));
      button.classList.toggle("active", initialState);
      this.toolStates.set(key, initialState);
    }
    button.dataset.key = key;
    button.title = label;
    button.setAttribute("aria-label", label);

    if (icon) {
      const iconEl = document.createElement("img");
      iconEl.src = icon.startsWith("/") ? icon : `/icons/${icon}`;
      iconEl.alt = "";
      iconEl.width = 20;
      iconEl.height = 20;
      iconEl.className = "toolbar__button-icon";
      button.appendChild(iconEl);
    }

    const textEl = document.createElement("span");
    textEl.className = "toolbar__button-text";
    textEl.textContent = label;
    button.appendChild(textEl);

    if (typeof count === "number") {
      const badge = document.createElement("span");
      badge.className = "toolbar__button-badge";
      badge.textContent = String(count);
      button.appendChild(badge);
    }

    return button;
  }

  syncInitialStates() {
    // Apply initial layout button state
    const layoutButton = this.root.querySelector(
      `.toolbar__group[data-role="layouts"] button[data-key="${this.activeLayout}"]`,
    );
    if (layoutButton) {
      this.setActiveButton(layoutButton);
    }
  }

  setActiveButton(button) {
    const group = button.closest(".toolbar__group");
    if (!group) return;
    group.querySelectorAll("button").forEach((btn) => {
      btn.classList.toggle("active", btn === button);
      btn.setAttribute("aria-pressed", String(btn === button));
    });
  }

  handleLayoutChange(layoutKey) {
    this.activeLayout = layoutKey;
    const button = this.root.querySelector(
      `.toolbar__group[data-role="layouts"] button[data-key="${layoutKey}"]`,
    );
    if (button) this.setActiveButton(button);
    if (this.layoutManager?.setMode) {
      this.layoutManager.setMode(layoutKey);
    }
  }

  handleViewChange(viewKey) {
    const button = this.root.querySelector(
      `.toolbar__group[data-role="views"] button[data-key="${viewKey}"]`,
    );
    if (button) this.setActiveButton(button);
    if (this.setup?.setCameraView) {
      this.setup.setCameraView(viewKey);
    }
  }

  handleCategoryToggle(categoryKey, active) {
    if (active) {
      this.activeCategories.add(categoryKey);
    } else {
      this.activeCategories.delete(categoryKey);
    }

    if (this.layoutManager?.toggleGroupVisibility) {
      this.layoutManager.toggleGroupVisibility(categoryKey, active);
    } else if (this.labelManager) {
      const labels = this.labelManager.getLabels();
      Object.values(labels).forEach((label) => {
        const labelCategory = label.userData?.registry?.category;
        if (labelCategory === categoryKey) {
          label.visible = active;
        }
      });
    }
  }

  refreshCategoryCounts() {
    const { registry, categories } = sanitizeLabelRegistry(cleanedLabelRegistry);
    categories.forEach((category) => {
      const button = this.root.querySelector(
        `.toolbar__group--categories button[data-category="${category.key}"]`,
      );
      if (button) {
        const badge =
          button.querySelector(".toolbar__button-badge") ||
          button.appendChild(document.createElement("span"));
        badge.className = "toolbar__button-badge";
        badge.textContent = String(category.count);
      }
    });
    return registry;
  }

  toggleUILPanel(nextState) {
    if (!this.uilPanel) return;
    if (typeof nextState !== "boolean") {
      nextState = !this.uilPanel.isVisible?.();
    }
    this.uilPanel.setVisible?.(nextState);
  }
}
