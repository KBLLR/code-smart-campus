// src/ui/components/organisms/Toolbar.js
// Sliding bottom panel with tabbed sections for layouts, sensors, views, tools, and exports.

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

const TAB_CONFIG = [
  {
    id: "layouts",
    label: "Layouts",
    icon: "floorplan.svg",
    eyebrow: "Spatial presets",
    title: "Layout Modes",
    subtitle: "Arrange how rooms and sensors cluster on the floor plan.",
    description:
      "Choose how rooms and sensor labels are grouped. Each mode highlights different navigation patterns across the campus.",
    pages: { current: 1, total: 1 },
    builder(toolbar, meta) {
      return toolbar.buildLayoutsTab(meta);
    },
  },
  {
    id: "sensors",
    label: "Sensors",
    icon: "occupancy.svg",
    eyebrow: "Sensor labels",
    title: "Sensor Categories",
    subtitle: "Toggle label groups and surface only what matters.",
    description:
      "Enable or hide sensor categories to keep the HUD focused on the data you need during walkthroughs.",
    pages: { current: 1, total: 1 },
    builder(toolbar, meta) {
      return toolbar.buildSensorsTab(meta);
    },
  },
  {
    id: "views",
    label: "Views",
    icon: "perspective-view.svg",
    eyebrow: "Camera presets",
    title: "Camera Views",
    subtitle: "Jump to saved perspectives for quick inspection.",
    description:
      "Quickly reposition the camera to curated bookmarks for orientation, daylight checks, or demo storytelling.",
    pages: { current: 1, total: 1 },
    builder(toolbar, meta) {
      return toolbar.buildViewsTab(meta);
    },
  },
  {
    id: "tools",
    label: "Tools",
    icon: "info.svg",
    eyebrow: "Utilities",
    title: "Scene Tools",
    subtitle: "Debugger toggles, label info, and future add-ons.",
    description:
      "Access debugging aids, label summaries, and other utilities that support ops and QA workflows.",
    pages: { current: 1, total: 1 },
    builder(toolbar, meta) {
      return toolbar.buildToolsTab(meta);
    },
  },
  {
    id: "export",
    label: "Export",
    icon: "badge-3d.svg",
    eyebrow: "Shareables",
    title: "Export Scene",
    subtitle: "Download GLB or STL snapshots of the current model.",
    description:
      "Capture the campus model for sharing or archival purposes. Choose the format that fits your downstream tools.",
    pages: { current: 1, total: 1 },
    builder(toolbar, meta) {
      return toolbar.buildExportTab(meta);
    },
  },
  {
    id: "ai",
    label: "AI",
    icon: "ai.svg",
    eyebrow: "Assistants",
    title: "AI Companion",
    subtitle: "Trigger campus-aware AI helpers.",
    description:
      "Access AI copilots for status summaries, anomaly detection, and guided tours.",
    pages: { current: 1, total: 1 },
    builder(toolbar, meta) {
      return toolbar.buildAITab(meta);
    },
  },
  {
    id: "settings",
    label: "Settings",
    icon: "adjustments-code.svg",
    eyebrow: "Preferences",
    title: "Control Center",
    subtitle: "Tune UI, notifications, and renderer modes.",
    description:
      "Adjust experience preferences, renderer choices, and notification channels.",
    pages: { current: 1, total: 1 },
    builder(toolbar, meta) {
      return toolbar.buildSettingsTab(meta);
    },
  },
  {
    id: "news",
    label: "News",
    icon: "book.svg",
    eyebrow: "Campus briefings",
    title: "Latest Updates",
    subtitle: "Stay informed on incidents and announcements.",
    description:
      "Review alerts, maintenance notices, and daily digest entries relevant to the campus.",
    pages: { current: 1, total: 1 },
    builder(toolbar, meta) {
      return toolbar.buildNewsTab(meta);
    },
  },
];

const PANEL_LIMITS = {
  min: 160,
  maxRatio: 0.75,
};

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
      this.root = document.createElement("section");
      this.root.id = "toolbar-root";
      document.body.appendChild(this.root);
    }

    this.root.classList.add(
      "toolbar",
      "toolbar__container",
      "toolbar-panel",
      "theme-scifi-glass",
    );

    this.categories = categories ?? labelCategories;
    this.layoutManager = layoutManager ?? null;
    this.labelManager = labelManager ?? null;
    this.setup = setupInstance ?? null;
    this.exportTarget = exportTarget;
    this.exporter = new MeshExporter();
    this.uilPanel = uilPanel;

    this.toolStates = new Map();
    this.tabContentCache = new Map();
    this.activeLayout = "svg-aligned";
    this.activeCategories = new Set(
      (this.categories || []).map((category) => category.key),
    );
    this.activeTab = TAB_CONFIG[0].id;
    this.panelHeight = 260;
    this.isCollapsed = false;

    if (this.layoutManager && this.labelManager) {
      this.layoutManager.labels = this.labelManager.getLabels();
    }

    this.render();
  }

  render() {
    this.renderShell();
    this.renderActiveTab();
    this.syncInitialStates();
  }

  renderShell() {
    this.root.innerHTML = "";

    this.panel = document.createElement("div");
    this.panel.className = "toolbar-panel__surface";
    this.panel.style.setProperty(
      "--toolbar-panel-height",
      `${this.panelHeight}px`,
    );
    this.panel.classList.toggle("is-collapsed", this.isCollapsed);

    this.resizeHandle = document.createElement("div");
    this.resizeHandle.className = "toolbar-panel__resize-handle";
    this.resizeHandle.setAttribute("role", "separator");
    this.resizeHandle.setAttribute("aria-label", "Resize toolbar panel");

    this.header = document.createElement("header");
    this.header.className = "toolbar-panel__header";

    this.navContainer = document.createElement("div");
    this.navContainer.className = "toolbar-page__nav";
    this.header.append(this.navContainer);

    this.body = document.createElement("div");
    this.body.className = "toolbar-panel__body";

    this.panel.append(this.resizeHandle, this.header, this.body);
    this.root.appendChild(this.panel);

    this.initResizeHandle();
  }

  setActiveTab(tabId) {
    if (this.activeTab === tabId) return;
    this.activeTab = tabId;
    this.renderActiveTab();
    if (this.navButtons) {
      this.navButtons.forEach((button, id) => {
        button.classList.toggle("is-active", id === tabId);
      });
    }
  }

  renderActiveTab() {
    const currentTab = TAB_CONFIG.find((tab) => tab.id === this.activeTab);
    if (!currentTab) return;

    this.renderHeaderNav(currentTab);

    let content = this.tabContentCache.get(currentTab.id);
    if (!content) {
      content = currentTab.builder(this, currentTab);
      this.tabContentCache.set(currentTab.id, content);
    }

    const page = this.buildPageLayout(currentTab, content);
    this.body.innerHTML = "";
    this.body.appendChild(page);
    this.afterTabRender(currentTab.id);
  }

  afterTabRender(tabId) {
    if (tabId === "layouts" || tabId === "views") {
      this.syncInitialStates();
    }
    if (tabId === "sensors") {
      this.refreshCategoryCounts();
    }
  }

  buildLayoutsTab() {
    return this.buildGroup("layouts", LAYOUT_OPTIONS, (option) =>
      this.handleLayoutChange(option.key),
    );
  }

  buildSensorsTab() {
    return this.buildCategoryGroup(this.categories || [], (category, active) =>
      this.handleCategoryToggle(category.key, active),
    );
  }

  buildViewsTab() {
    return this.buildGroup("views", VIEW_OPTIONS, (option) =>
      this.handleViewChange(option.key),
    );
  }

  buildToolsTab() {
    return this.buildGroup("tools", TOOL_ACTIONS, (action, state) =>
      action.handler?.(this, state),
    );
  }

  buildExportTab() {
    return this.buildGroup("export", EXPORT_ACTIONS, (action) =>
      action.handler?.(this.exporter, this.exportTarget),
    );
  }

  buildAITab() {
    return this.buildPlaceholder("AI assistants coming soon.");
  }

  buildSettingsTab() {
    return this.buildPlaceholder("Settings panel under construction.");
  }

  buildNewsTab() {
    return this.buildPlaceholder("News feed will surface alerts and updates.");
  }

  buildPlaceholder(text) {
    const wrapper = document.createElement("div");
    wrapper.className = "toolbar__group toolbar__group--placeholder";
    const message = document.createElement("p");
    message.textContent = text;
    wrapper.appendChild(message);
    return wrapper;
  }

  buildPageLayout(tabMeta, actionsNode) {
    const page = document.createElement("div");
    page.className = "toolbar-page";

    const contentRow = document.createElement("div");
    contentRow.className = "toolbar-page__content";
    contentRow.append(
      this.buildInfoColumn(tabMeta),
      this.buildActionsColumn(actionsNode),
    );

    const footerRow = document.createElement("div");
    footerRow.className = "toolbar-page__footer";
    footerRow.textContent = "Footer actions coming soon.";

    page.append(contentRow, footerRow);
    return page;
  }
  
  renderHeaderNav(currentTab) {
    if (!this.navContainer) return;
    this.navContainer.innerHTML = "";
    this.navButtons = new Map();

    const track = document.createElement("div");
    track.className = "toolbar-page__nav-track";

    TAB_CONFIG.forEach((tab, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "toolbar-page__nav-btn";
      button.dataset.tab = tab.id;
      button.setAttribute("aria-label", tab.label);
      button.innerHTML = `<img src="/icons/${tab.icon}" alt="" width="28" height="28" />`;
      if (tab.id === currentTab.id) {
        button.classList.add("is-active");
      }
      button.addEventListener("click", () => this.setActiveTab(tab.id));
      track.appendChild(button);
      this.navButtons.set(tab.id, button);

      if (index < TAB_CONFIG.length - 1) {
        const sep = document.createElement("span");
        sep.className = "toolbar-page__nav-separator";
        sep.textContent = "|";
        track.appendChild(sep);
      }
    });

    this.navContainer.append(track);
  }

  buildInfoColumn(tabMeta) {
    const column = document.createElement("div");
    column.className = "toolbar-page__info";

    const eyebrow = document.createElement("p");
    eyebrow.className = "toolbar-section__eyebrow";
    eyebrow.textContent = tabMeta.eyebrow || "";

    const title = document.createElement("h3");
    title.textContent = tabMeta.title || tabMeta.label || "Panel";

    const subtitle = document.createElement("p");
    subtitle.className = "toolbar-section__subtitle";
    subtitle.textContent = tabMeta.subtitle || "";

    const description = document.createElement("p");
    description.className = "toolbar-page__description";
    description.textContent = tabMeta.description || "";

    column.append(eyebrow, title, subtitle, description);
    return column;
  }

  buildActionsColumn(actionsNode) {
    const column = document.createElement("div");
    column.className = "toolbar-page__actions";
    column.appendChild(actionsNode);
    return column;
  }

  buildGroup(role, options, onSelect) {
    const group = document.createElement("div");
    group.className = "toolbar__group";
    group.dataset.role = role;

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
          this.setActiveButton(button);
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
        variant: "chip",
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
    const { key, icon, label, count, isToggle = false, variant = "tile" } =
      option;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `toolbar__button toolbar__button--${variant}`;

    if (isToggle) {
      const initialState =
        (typeof option.getState === "function"
          ? option.getState(this)
          : this.toolStates.get(key)) ?? true;
      button.classList.toggle("active", initialState);
      button.setAttribute("aria-pressed", String(initialState));
      this.toolStates.set(key, initialState);
    } else {
      button.setAttribute("aria-pressed", "false");
    }

    button.dataset.key = key;
    button.title = label;
    button.setAttribute("aria-label", label);

    if (icon) {
      const iconEl = document.createElement("img");
      iconEl.src = icon.startsWith("/") ? icon : `/icons/${icon}`;
      iconEl.alt = "";
      iconEl.width = 24;
      iconEl.height = 24;
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

  initResizeHandle() {
    const handle = this.resizeHandle;
    let pointerId = null;
    let startY = 0;
    let startHeight = this.panelHeight;

    const onPointerMove = (event) => {
      if (event.pointerId !== pointerId) return;
      const delta = startY - event.clientY;
      const targetHeight = Math.min(
        Math.max(startHeight + delta, PANEL_LIMITS.min),
        window.innerHeight * PANEL_LIMITS.maxRatio,
      );
      this.setPanelHeight(targetHeight);
    };

    const onPointerUp = (event) => {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    handle.addEventListener("pointerdown", (event) => {
      pointerId = event.pointerId;
      startY = event.clientY;
      startHeight = this.panelHeight;
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    });
  }

  setPanelHeight(height) {
    this.panelHeight = height;
    this.panel.style.setProperty(
      "--toolbar-panel-height",
      `${Math.round(height)}px`,
    );
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.panel.classList.toggle("is-collapsed", this.isCollapsed);
    this.collapseButton.setAttribute(
      "aria-expanded",
      String(!this.isCollapsed),
    );
  }

  syncInitialStates() {
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
      const isActive = btn === button;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });
  }

  handleLayoutChange(layoutKey) {
    this.activeLayout = layoutKey;
    if (this.layoutManager?.setMode) {
      this.layoutManager.setMode(layoutKey);
    }
  }

  handleViewChange(viewKey) {
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
