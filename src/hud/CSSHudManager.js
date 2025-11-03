import * as THREE from "three";
import { projectWorldToScreen } from "@hud/project.js";

const DEFAULT_OPTIONS = {
  rootId: "hud-root",
  labelClass: "hud-label",
  hiddenClass: "hud-label--hidden",
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

    const title = anchor?.userData?.registry?.label || entityId;
    const value = anchor?.userData?.registry?.value ?? "";
    element.innerHTML = `
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

      const worldPosition = new THREE.Vector3();
      anchor.getWorldPosition(worldPosition);
      // Slightly elevate labels above the anchor origin
      worldPosition.y += anchor.userData?.hudOffset ?? 12;

      const { x, y, visible } = projectWorldToScreen(
        worldPosition,
        this.camera,
        dom,
      );

      if (!visible) {
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

  dispose() {
    this.labels.forEach(({ element }) => element?.remove());
    this.labels.clear();
  }
}
