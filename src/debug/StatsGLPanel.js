// src/debug/StatsGLPanel.js
import Stats from "stats-gl"; // Import from the installed package

export class StatsGLPanel {
  /**
   * @param {THREE.WebGLRenderer | THREE.WebGPURenderer} renderer - The Three.js renderer instance.
   * @param {object} [options] - Options for stats-gl (e.g., { logsPerSecond: 30, samplesLog: 100 }).
   * @param {string} [alignment='top-right'] - Panel position ('top-left', 'top-right', etc.).
   */
  constructor(renderer, options = {}, alignment = "bottom-right") {
    if (!renderer) {
      throw new Error("[StatsGLPanel] Renderer instance is required.");
    }

    this.stats = new Stats(options);
    this.alignPanel(alignment);
    document.body.appendChild(this.stats.dom);

    // Init with renderer - this patches the renderer's render function
    try {
      this.stats.init(renderer);
      console.log("[StatsGLPanel] stats-gl initialized and patched renderer.");
    } catch (error) {
      console.error("[StatsGLPanel] Failed to init with renderer:", error);
      // Fallback? Or let it fail?
      this.stats.dom.textContent = "Error initializing stats-gl";
    }

    this.hide();
  }

  alignPanel(alignment) {
    this.stats.dom.style.position = "fixed"; // Use fixed for consistent positioning
    this.stats.dom.style.zIndex = "10000"; // Ensure it's on top
    this.stats.dom.style.userSelect = "none";
    this.stats.dom.style.pointerEvents = "none"; // Usually don't want interaction

    switch (alignment) {
      case "top-right":
        this.stats.dom.style.top = "10px"; // Add some margin
        this.stats.dom.style.left = "auto";
        this.stats.dom.style.right = "10px";
        this.stats.dom.style.bottom = "auto";
        break;
      case "bottom-left":
        this.stats.dom.style.top = "auto";
        this.stats.dom.style.left = "10px";
        this.stats.dom.style.right = "auto";
        this.stats.dom.style.bottom = "10px";
        break;
      case "bottom-right":
        this.stats.dom.style.top = "auto";
        this.stats.dom.style.left = "auto";
        this.stats.dom.style.right = "200px";
        this.stats.dom.style.bottom = "80px";
        break;
      case "top-left":
      default: // Default to top-left
        this.stats.dom.style.top = "10px";
        this.stats.dom.style.left = "10px";
        this.stats.dom.style.right = "auto";
        this.stats.dom.style.bottom = "auto";
        break;
    }
  }

  get dom() {
    return this.stats.dom;
  }

  // Update is not strictly needed if init(renderer) was successful,
  // but provide it for consistency / potential manual use.
  update() {
    this.stats.update();
  }

  show() {
    this.stats.dom.style.display = "block"; // Or 'flex' depending on its internal structure
  }

  hide() {
    this.stats.dom.style.display = "none";
  }

  dispose() {
    // stats-gl doesn't have an explicit dispose, just remove the DOM element
    this.stats.dom.remove();
    console.log("[StatsGLPanel] Disposed.");
    // Note: Unpatching the renderer is not straightforward with stats-gl's init().
    // If switching renderers dynamically, this could be an issue.
  }
}
