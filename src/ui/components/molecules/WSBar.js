// src/ui/components/molecules/WSBar.js
import { getIconForEntity } from "@utils/entityUtils.js";

export class WSBar {
  constructor({ onToggleGroup }) {
    this.onToggleGroup = onToggleGroup;
    this.groups = new Set();
    this.buttons = {};
    this.container = document.createElement("div");
    this.container.id = "ws-bar";
    this.container.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      padding: 12px;
      border-radius: 24px;
      z-index: 9998;
    `;

    this.renderGroupToggles();
    document.body.appendChild(this.container);
  }

  renderGroupToggles() {
    const groupTypes = [
      "calendar",
      "temperature",
      "occupancy",
      "humidity",
      "air",
      "light",
      "sun",
    ];

    groupTypes.forEach((group) => {
      const icon = getIconForEntity(group);
      const button = document.createElement("button");
      button.id = `group-${group}`;
      button.title = group;
      button.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      `;

      const img = document.createElement("img");
      img.src = `/icons/${icon}.svg`;
      img.alt = icon;
      img.width = 20;
      img.height = 20;

      button.appendChild(img);

      button.onclick = () => {
        const active = button.classList.toggle("active");
        button.style.opacity = active ? "1.0" : "0.4";
        this.onToggleGroup(group, active);
      };

      this.buttons[group] = button;
      this.container.appendChild(button);
    });
  }

  toggleGroupVisibility(group, visible) {
    const btn = this.buttons[group];
    if (!btn || !btn.style) return;
    btn.style.opacity = visible ? "1.0" : "0.4";
  }
}
