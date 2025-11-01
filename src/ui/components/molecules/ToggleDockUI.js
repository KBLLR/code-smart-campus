// src/ui/components/molecules/ToggleDockUI.js
import { Toggle } from "@atoms/Toggle.js";
import { WebSocketStatus } from "@widgets/WebSocketStatus.js";

export class ToggleDockUI {
  constructor() {
    this.container = document.createElement("div");
    this.container.id = "toggle-dock-ui";
    this.container.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px;
      border-radius: 16px;
      backdrop-filter: blur(12px);
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      z-index: 9999;
    `;

    // Toggle: Show Labels
    const toggleLabels = new Toggle({
      id: "toggle-labels",
      iconOn: "eye.svg",
      iconOff: "eye-dotted.svg",
      labelOn: "Hide Labels",
      labelOff: "Show Labels",
      onToggle: (val) => {
        Object.values(window.labels || {}).forEach(
          (label) => (label.visible = val),
        );
      },
    });

    // Toggle: Dark Mode
    const toggleDark = new Toggle({
      id: "toggle-dark",
      iconOn: "moon.svg",
      iconOff: "sun.svg",
      labelOn: "Dark Mode",
      labelOff: "Light Mode",
      onToggle: (val) => {
        document.body.classList.toggle("dark", val);
      },
    });

    this.container.appendChild(toggleLabels.button);
    this.container.appendChild(toggleDark.button);

    document.body.appendChild(this.container);
  }
}
