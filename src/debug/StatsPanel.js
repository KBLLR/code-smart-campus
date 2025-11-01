// src/debug/StatsPanel.js
import Stats from "three/examples/jsm/libs/stats.module.js";

export class StatsPanel {
  constructor(alignment = "bottom-right") {
    // alignment: 'top-left', 'top-right', 'bottom-left', 'bottom-right'
    this.stats = new Stats();
    this.alignPanel(alignment);
    document.body.appendChild(this.stats.dom);
    this.hide(); // Start hidden by default
    console.log("[StatsPanel] Standard Stats.js initialized.");
  }

  alignPanel(alignment) {
    this.stats.dom.style.position = "fixed"; // Use fixed for consistent positioning
    this.stats.dom.style.zIndex = "10000"; // Ensure it's on top

    switch (alignment) {
      case "top-right":
        this.stats.dom.style.top = "0px";
        this.stats.dom.style.left = "auto";
        this.stats.dom.style.right = "0px";
        this.stats.dom.style.bottom = "auto";
        break;
      case "bottom-left":
        this.stats.dom.style.top = "auto";
        this.stats.dom.style.left = "0px";
        this.stats.dom.style.right = "auto";
        this.stats.dom.style.bottom = "0px";
        break;
      case "bottom-right":
        this.stats.dom.style.top = "auto";
        this.stats.dom.style.left = "auto";
        this.stats.dom.style.right = "0px";
        this.stats.dom.style.bottom = "0px";
        break;
      case "top-left":
      default: // Default to top-left
        this.stats.dom.style.top = "0px";
        this.stats.dom.style.left = "0px";
        this.stats.dom.style.right = "auto";
        this.stats.dom.style.bottom = "auto";
        break;
    }
  }

  get dom() {
    return this.stats.dom;
  }

  update() {
    this.stats.update();
  }

  show() {
    this.stats.dom.style.display = "block";
  }

  hide() {
    this.stats.dom.style.display = "none";
  }

  dispose() {
    this.stats.dom.remove();
    console.log("[StatsPanel] Disposed.");
  }
}
