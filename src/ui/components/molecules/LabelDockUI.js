// src/ui/components/molecules/LabelDockUI.js
import { Toggle } from "@atoms/Toggle.js";

export class LabelDockUI {
  constructor(layoutManager) {
    this.layoutManager = layoutManager;

    this.container = document.createElement("div");
    this.container.id = "ws-toolbar";
    this.container.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 20px;
      padding: 10px 14px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.85);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 9999;
    `;

    this.render();
    document.body.appendChild(this.container);
  }

  render() {
    const header = document.createElement("div");
    header.textContent = "🛰 Groups";
    header.style.cssText = `
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 6px;
    `;
    this.container.appendChild(header);

    const groups = ["temperature", "occupancy", "calendar", "camera", "sun"];

    groups.forEach((group) => {
      const toggle = new Toggle({
        id: `toggle-${group}`,
        label: group,
        icon: `${group}.svg`,
        onToggle: (visible) => {
          this.layoutManager.toggleGroupVisibility?.(group, visible);
        },
      });
      toggle.button.title = `Toggle ${group}`;
      this.container.appendChild(toggle.button);
    });
  }
}
