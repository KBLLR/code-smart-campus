/**
 * SceneSwitcher.js
 * Quick temporary scene switcher UI component
 *
 * Displays scene buttons in the header status row
 * - Buttons for Geospatial (default/highlighted), Projector, Backdrop
 * - Matches the existing "Sensors" button style
 * - Integrates with SceneFactory for scene activation
 */

export class SceneSwitcher {
  /**
   * @param {{
   *   sceneFactory?: any,
   *   onSceneChange?: (sceneKey: string) => void,
   *   scenes?: Array<{key: string, label: string}>,
   * }} config
   */
  constructor({
    sceneFactory = null,
    onSceneChange = null,
    scenes = [
      { key: 'geospatial', label: 'Geospatial' },
      { key: 'projectorLight', label: 'Projector' },
      { key: 'backdrop', label: 'Backdrop' },
    ],
  } = {}) {
    this.sceneFactory = sceneFactory;
    this.onSceneChange = onSceneChange;
    this.scenes = scenes;
    this.activeScene = 'geospatial';
    this.root = null;
    this.sceneButtons = [];
  }

  /**
   * Mount the switcher into an element (status-wrap container)
   */
  mount(parentElement) {
    if (!parentElement) return;

    // Create root container for scene buttons
    this.root = document.createElement('div');
    this.root.className = 'scene-switcher';

    // Create scene buttons
    for (const scene of this.scenes) {
      const btn = document.createElement('button');
      btn.className = 'scene-switcher__btn';
      btn.dataset.scene = scene.key;
      btn.textContent = scene.label;
      btn.setAttribute('aria-label', `Switch to ${scene.label} scene`);

      if (scene.key === this.activeScene) {
        btn.classList.add('scene-switcher__btn--active');
      }

      btn.addEventListener('click', () => this.switchScene(scene.key));
      this.root.appendChild(btn);
      this.sceneButtons.push(btn);
    }

    parentElement.appendChild(this.root);
    this.injectStyles();
  }

  /**
   * Switch to a scene
   */
  async switchScene(sceneKey) {
    try {
      this.activeScene = sceneKey;

      // Update UI
      this.sceneButtons.forEach(btn => {
        if (btn.dataset.scene === sceneKey) {
          btn.classList.add('scene-switcher__btn--active');
        } else {
          btn.classList.remove('scene-switcher__btn--active');
        }
      });

      // Call scene factory if available
      if (this.sceneFactory) {
        await this.sceneFactory.activate(sceneKey);
      }

      // Call custom callback
      if (this.onSceneChange) {
        this.onSceneChange(sceneKey);
      }

      console.log(`[SceneSwitcher] Switched to: ${sceneKey}`);
    } catch (err) {
      console.error(`[SceneSwitcher] Failed to switch to ${sceneKey}:`, err);
    }
  }

  /**
   * Inject CSS styles
   */
  injectStyles() {
    if (document.getElementById('scene-switcher-styles')) {
      return; // Already injected
    }

    const style = document.createElement('style');
    style.id = 'scene-switcher-styles';
    style.textContent = `
      .scene-switcher {
        display: inline-flex;
        gap: 0.5rem;
        align-items: center;
      }

      .scene-switcher__btn {
        border: none;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 999px;
        padding: 0.45rem 1rem;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        color: rgba(248, 250, 252, 0.95);
        font-size: 0.82rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        cursor: pointer;
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.35);
        transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        font-family: inherit;
        font-weight: 500;
      }

      .scene-switcher__btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 18px 36px rgba(0, 0, 0, 0.4);
        background: rgba(255, 255, 255, 0.12);
      }

      .scene-switcher__btn--active {
        background: rgba(45, 212, 191, 0.25);
        color: #2dd4bf;
        box-shadow: 0 15px 30px rgba(45, 212, 191, 0.25);
      }

      .scene-switcher__btn--active:hover {
        transform: translateY(-2px);
        background: rgba(45, 212, 191, 0.35);
        box-shadow: 0 18px 36px rgba(45, 212, 191, 0.35);
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Get current active scene
   */
  getActiveScene() {
    return this.activeScene;
  }

  /**
   * Set active scene (for external updates)
   */
  setActiveScene(sceneKey) {
    if (this.scenes.find(s => s.key === sceneKey)) {
      this.activeScene = sceneKey;
      this.sceneButtons.forEach(btn => {
        if (btn.dataset.scene === sceneKey) {
          btn.classList.add('scene-switcher__btn--active');
        } else {
          btn.classList.remove('scene-switcher__btn--active');
        }
      });
    }
  }

  /**
   * Destroy the component
   */
  destroy() {
    if (this.root && this.root.parentElement) {
      this.root.parentElement.removeChild(this.root);
    }
    this.sceneButtons = [];
    this.root = null;
  }
}
