import * as THREE from "three";
import { projectWorldToScreen } from "@hud/project.js";

const DEFAULT_OPTIONS = {
  rootId: "hud-root",
  labelClass: "hud-label",
  hiddenClass: "hud-label--hidden",
  hoveredClass: "hud-label--hovered",
  selectedClass: "hud-label--selected",
};

export class CSSHudManager {
  constructor({ scene, camera, renderer, options = {} } = {}) {
    if (!(scene instanceof THREE.Scene)) {
      throw new Error("[CSSHudManager] scene is required.");
    }
    if (!(camera instanceof THREE.Camera)) {
      throw new Error("[CSSHudManager] camera is required.");
    }
    if (!renderer || !renderer.domElement) {
      throw new Error("[CSSHudManager] renderer with domElement is required.");
    }

    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.options = { ...DEFAULT_OPTIONS, ...options };

    this.root = this._ensureRoot();
    this.labels = new Map(); // entityId -> { anchor, element }
    this._size = new THREE.Vector2();
    this.renderer.getSize(this._size);
    this._listeners = {
      hover: new Set(),
      hoverend: new Set(),
      select: new Set(),
      focusin: new Set(),
      focusout: new Set(),
      selectclear: new Set(),
    };
    this.selectedEntityId = null;

    this._handlePointerOver = this._handlePointerOver.bind(this);
    this._handlePointerOut = this._handlePointerOut.bind(this);
    this._handleClick = this._handleClick.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleFocusIn = this._handleFocusIn.bind(this);
    this._handleFocusOut = this._handleFocusOut.bind(this);
    this._attachEventDelegates();
  }

  _clearSelection(exceptElement = null) {
    this.labels.forEach(({ element }) => {
      if (element && element !== exceptElement) {
        element.classList.remove(this.options.selectedClass);
      }
    });
  }

  _ensureRoot() {
    let root = document.getElementById(this.options.rootId);
    if (!root) {
      root = document.createElement("div");
      root.id = this.options.rootId;
      document.body.appendChild(root);
    }
    return root;
  }

  sync(labelMap) {
    if (!labelMap) return;

    const existingIds = new Set();

    Object.entries(labelMap).forEach(([entityId, anchor]) => {
      existingIds.add(entityId);
      if (this.labels.has(entityId)) {
        this.labels.get(entityId).anchor = anchor;
        return;
      }

      const element = this._createLabelElement(entityId, anchor);
      this.root.appendChild(element);
      this.labels.set(entityId, { anchor, element });
    });

    // Remove labels no longer present
    Array.from(this.labels.keys()).forEach((entityId) => {
      if (!existingIds.has(entityId)) {
        const entry = this.labels.get(entityId);
        entry?.element?.remove();
        this.labels.delete(entityId);
      }
    });
  }

  _createLabelElement(entityId, anchor) {
    const element = document.createElement("div");
    element.className = this.options.labelClass;
    element.dataset.entityId = entityId;
    element.tabIndex = 0;

    const registry = anchor?.userData?.registry ?? {};
    const title = registry.label || entityId;
    const value = registry.value ?? "";
    const category = registry.category || "misc";
    const type = registry.type || "";
    const room = anchor?.userData?.room || registry.room || "";
    const badgeLabel = (category || "misc").slice(0, 3).toUpperCase();

    element.dataset.category = category;
    element.dataset.type = type;
    if (room) element.dataset.room = room;

    element.innerHTML = `
      <div class="hud-label__meta">
        <span class="hud-label__badge" aria-hidden="true">${badgeLabel}</span>
        <span class="hud-label__room">${room?.toUpperCase?.() || ""}</span>
      </div>
      <div class="hud-label__title">${title}</div>
      <div class="hud-label__value">${value}</div>
    `;

    return element;
  }

  update(camera = this.camera) {
    this.camera = camera;
    if (!this.labels.size) return;

    const dom = this.renderer.domElement;
    this.labels.forEach(({ anchor, element }) => {
      if (!anchor || !element) return;
      const anchorVisible = anchor.visible !== false;

      const worldPosition = new THREE.Vector3();
      anchor.getWorldPosition(worldPosition);
      // Slightly elevate labels above the anchor origin
      worldPosition.y += anchor.userData?.hudOffset ?? 12;

      const { x, y, visible } = projectWorldToScreen(
        worldPosition,
        this.camera,
        dom,
      );

      if (!visible || !anchorVisible) {
        element.classList.add(this.options.hiddenClass);
        return;
      }

      element.classList.remove(this.options.hiddenClass);
      element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  }

  updateLabel(entityId, { title, value } = {}) {
    const entry = this.labels.get(entityId);
    if (!entry) return;
    if (title) {
      const titleNode = entry.element.querySelector(".hud-label__title");
      if (titleNode) titleNode.textContent = title;
    }
    if (value !== undefined) {
      const valueNode = entry.element.querySelector(".hud-label__value");
      if (valueNode) valueNode.textContent = value;
    }
  }

  selectEntity(entityId, { focus = false, scroll = false } = {}) {
    const entry = this.labels.get(entityId);
    if (!entry) return false;
    this._clearSelection(entry.element);
    entry.element.classList.add(this.options.selectedClass);
    this.selectedEntityId = entityId;
    if (focus) {
      try {
        entry.element.focus({ preventScroll: !scroll });
      } catch {
        entry.element.focus();
      }
    }
    return true;
  }

  clearSelection({ silent = false } = {}) {
    const previous = this.selectedEntityId;
    this._clearSelection();
    this.selectedEntityId = null;
    if (!silent && previous) {
      this.emit("selectclear", { entityId: previous });
    }
  }

  setCategoryVisibility(categoryKey, visible) {
    if (!categoryKey) return;
    const shouldHide = visible === false;
    this.labels.forEach(({ anchor, element }) => {
      const registryCategory = anchor?.userData?.registry?.category;
      const registryType = anchor?.userData?.registry?.type;
      if (registryCategory === categoryKey || registryType === categoryKey) {
        element.classList.toggle(this.options.hiddenClass, shouldHide);
        if (
          shouldHide &&
          element.classList.contains(this.options.selectedClass)
        ) {
          const entityId = element.dataset.entityId;
          this._clearSelection();
          this.selectedEntityId = null;
          this.emit("selectclear", { entityId });
        }
      }
    });
  }

  dispose() {
    this._detachEventDelegates();
    this.labels.forEach(({ element }) => element?.remove());
    this.labels.clear();
    this._listeners = {
      hover: new Set(),
      hoverend: new Set(),
      select: new Set(),
      focusin: new Set(),
      focusout: new Set(),
      selectclear: new Set(),
    };
    this.selectedEntityId = null;
  }

  on(type, handler) {
    const set = this._listeners?.[type];
    if (!set || typeof handler !== "function") return () => {};
    set.add(handler);
    return () => set.delete(handler);
  }

  off(type, handler) {
    const set = this._listeners?.[type];
    if (!set || typeof handler !== "function") return;
    set.delete(handler);
  }

  emit(type, detail) {
    const set = this._listeners?.[type];
    if (!set) return;
    set.forEach((handler) => {
      try {
        handler(detail);
      } catch (error) {
        console.error(`[CSSHudManager] Listener for '${type}' failed.`, error);
      }
    });
  }

  _attachEventDelegates() {
    this.root.addEventListener("pointerover", this._handlePointerOver);
    this.root.addEventListener("pointerout", this._handlePointerOut);
    this.root.addEventListener("click", this._handleClick);
    this.root.addEventListener("keydown", this._handleKeyDown, true);
    this.root.addEventListener("focusin", this._handleFocusIn);
    this.root.addEventListener("focusout", this._handleFocusOut);
  }

  _detachEventDelegates() {
    this.root.removeEventListener("pointerover", this._handlePointerOver);
    this.root.removeEventListener("pointerout", this._handlePointerOut);
    this.root.removeEventListener("click", this._handleClick);
    this.root.removeEventListener("keydown", this._handleKeyDown, true);
    this.root.removeEventListener("focusin", this._handleFocusIn);
    this.root.removeEventListener("focusout", this._handleFocusOut);
  }

  _resolveEventTarget(event) {
    if (!event) return null;
    const label = event.target?.closest?.(`.${this.options.labelClass}`);
    if (!label || !this.root.contains(label)) return null;
    const entityId = label.dataset.entityId;
    if (!entityId) return null;
    const entry = this.labels.get(entityId);
    if (!entry) return null;
    return { entityId, label, entry };
  }

  _handlePointerOver(event) {
    const target = this._resolveEventTarget(event);
    if (!target) return;
    const { entityId, label } = target;
    label.classList.add(this.options.hoveredClass);
    this.emit("hover", {
      entityId,
      anchor: target.entry.anchor,
      element: label,
      nativeEvent: event,
    });
  }

  _handlePointerOut(event) {
    const current = this._resolveEventTarget(event);
    if (!current) return;
    const relatedLabel =
      event.relatedTarget?.closest?.(`.${this.options.labelClass}`);
    if (relatedLabel === current.label) return;
    current.label.classList.remove(this.options.hoveredClass);
    this.emit("hoverend", {
      entityId: current.entityId,
      anchor: current.entry.anchor,
      element: current.label,
      nativeEvent: event,
    });
  }

  _handleClick(event) {
    const target = this._resolveEventTarget(event);
    if (!target) return;
    event.preventDefault();
    this._clearSelection(target.label);
    target.label.classList.add(this.options.selectedClass);
    this.emit("select", {
      entityId: target.entityId,
      anchor: target.entry.anchor,
      element: target.label,
      nativeEvent: event,
    });
  }

  _handleKeyDown(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    const target = this._resolveEventTarget(event);
    if (!target) return;
    event.preventDefault();
    this._clearSelection(target.label);
    target.label.classList.add(this.options.selectedClass);
    this.emit("select", {
      entityId: target.entityId,
      anchor: target.entry.anchor,
      element: target.label,
      nativeEvent: event,
    });
  }

  _handleFocusIn(event) {
    const target = this._resolveEventTarget(event);
    if (!target) return;
    target.label.classList.add(this.options.hoveredClass);
    this.emit("focusin", {
      entityId: target.entityId,
      anchor: target.entry.anchor,
      element: target.label,
      nativeEvent: event,
    });
  }

  _handleFocusOut(event) {
    const target = this._resolveEventTarget(event);
    if (!target) return;
    target.label.classList.remove(this.options.hoveredClass);
    this.emit("focusout", {
      entityId: target.entityId,
      anchor: target.entry.anchor,
      element: target.label,
      nativeEvent: event,
    });
  }
}
