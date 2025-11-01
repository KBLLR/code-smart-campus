export class LoaderUI {
  constructor() {
    this.container = document.createElement("div");
    this.container.id = "loader";
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      font-family: 'JetBrains Mono', 'Inter', monospace;
      transition: opacity 0.5s ease-out; /* Add transition for hiding */
      opacity: 1; /* Start visible */
    `;

    this.textElement = document.createElement("span"); // Renamed 'text' to avoid conflict with text content
    this.textElement.id = "loader-text";
    this.textElement.style.cssText = `
      color: white;
      font-size: 18px;
      background: rgba(255, 255, 255, 0.05);
      padding: 12px 20px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.1);
      backdrop-filter: blur(8px);
      text-align: center; /* Center text */
    `;

    this.textElement.textContent = "Loading Smart Campus..."; // Initial text

    this.container.appendChild(this.textElement);
    document.body.appendChild(this.container);
    console.log("[LoaderUI] Initialized and added to DOM.");
  }

  /**
   * Updates the loader text based on a percentage (0-100).
   * @param {number} percent
   */

  update(percent) {
    if (this.textElement) {
      // Check if element exists
      const p = Math.max(0, Math.min(100, percent)); // Clamp percentage
      this.textElement.textContent = `Loading Smart Campus... ${p}%`;
    }
  }

  /**
   * Updates the loader text with a specific message.
   * @param {string} message - The text message to display.
   */

  updateText(message) {
    if (this.textElement) {
      // Check if element exists
      this.textElement.textContent = message;
    } else {
      console.warn("[LoaderUI] updateText called, but textElement is missing.");
    }
  }

  /**
   * Shows a completion message and prepares the loader for removal.
   */

  complete() {
    console.log("[LoaderUI] Completing...");
    if (this.textElement) {
      this.textElement.textContent = "✅ Ready Smart Campus";
    }
    // Start fade out, then remove
    if (this.container) {
      this.container.style.opacity = "0";
      // Remove from DOM after transition completes
      this.container.addEventListener("transitionend", () => this.destroy(), {
        once: true,
      });
      // Fallback removal if transition doesn't fire (e.g., display: none)
      setTimeout(() => this.destroy(), 600); // A bit longer than transition
    } else {
      this.destroy(); // Destroy immediately if container missing
    }
  }

  /**
   * Removes the loader element from the DOM.
   */

  destroy() {
    if (this.container) {
      this.container.remove();
      this.container = null; // Nullify reference
      this.textElement = null; // Nullify reference
      console.log("[LoaderUI] Destroyed.");
    }
  }
}
