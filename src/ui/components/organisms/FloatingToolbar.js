// src/ui/components/molecules/FloatingToolbar.js
import { layoutManager } from "@/scene.js";

export class FloatingToolbar {
  constructor() {
    this.active = false;

    // Container for toolbar
    this.container = document.createElement("div");
    this.container.id = "floating-toolbar";
    this.container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      background: none;
    `;

    // Layout buttons (appear above toggle)
    this.buttons = [
      { icon: "grid.svg", mode: "grid", title: "Grid" },
      { icon: "radial.svg", mode: "radial", title: "Radial" },
      { icon: "layout.svg", mode: "float", title: "Float" },
      { icon: "spiral.svg", mode: "spiral", title: "Spiral" },
      { icon: "flame.svg", mode: "heatmap", title: "Heatmap" },
      { icon: "hand.svg", mode: "manual", title: "Manual" },
      { icon: "aligned.svg", mode: "svg-aligned", title: "SVG-Aligned" },
    ].map(({ icon, mode, title }) =>
      this.createIconButton(icon, title, () => layoutManager.setMode(mode)),
    );

    // Main toggle button
    this.toggleBtn = this.createIconButton(
      "eye.svg",
      "Toggle Layout Modes",
      () => {
        this.active = !this.active;
        this.renderButtons();
      },
    );
    this.container.appendChild(this.toggleBtn);

    document.body.appendChild(this.container);
  }

  createIconButton(icon, title, onClick) {
    const btn = document.createElement("button");
    btn.title = title;
    btn.style.cssText = `
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
    `;

    const img = document.createElement("img");
    img.src = `/icons/${icon}`;
    img.alt = title;
    img.width = 24;
    img.height = 24;
    btn.appendChild(img);

    btn.addEventListener("click", onClick);
    return btn;
  }

  renderButtons() {
    this.buttons.forEach((btn) => {
      if (this.active && !btn.isConnected) {
        this.container.insertBefore(btn, this.toggleBtn);
      } else if (!this.active && btn.isConnected) {
        this.container.removeChild(btn);
      }
    });

    const toggleIcon = this.toggleBtn.querySelector("img");
    toggleIcon.src = this.active ? "/icons/eye-closed.svg" : "/icons/eye.svg";
  }
}
