/**
 * shared/ui/SceneSwitcherPanel.ts
 * UIL panel for switching between scenes
 */

import type { SceneFactory } from "../engine/SceneFactory";

export interface SceneSwitcherConfig {
  sceneFactory: SceneFactory;
  uilController?: any; // UILController instance
}

export class SceneSwitcherPanel {
  private sceneFactory: SceneFactory;
  private uilController: any;
  private moduleId: string = "sceneSwitcher";

  constructor(config: SceneSwitcherConfig) {
    this.sceneFactory = config.sceneFactory;
    this.uilController = config.uilController;
  }

  /**
   * Register scene switcher panel with UIL
   */
  register(): void {
    if (!this.uilController) {
      console.warn("[SceneSwitcherPanel] UIL controller not provided");
      return;
    }

    const sceneKeys = this.sceneFactory.listScenes();
    const activeScene = this.sceneFactory.getActive()?.sceneKey || "none";

    // Create selector control for scene switching
    this.uilController.registerModule(this.moduleId, {
      label: "Scene",
      controls: {
        current: {
          type: "selector",
          options: sceneKeys,
          value: activeScene,
        },
      },
      bindings: {
        "current": {
          get: () => this.sceneFactory.getActive()?.sceneKey || "none",
          set: (sceneKey: string) => {
            this.sceneFactory.activate(sceneKey).catch((e) => {
              console.error(`[SceneSwitcherPanel] Failed to activate ${sceneKey}:`, e);
            });
          },
        },
      },
    });

    // Listen for scene activation events
    document.addEventListener("scene-activated", ((e: CustomEvent) => {
      console.log(`[SceneSwitcherPanel] Scene activated: ${e.detail.sceneKey}`);
      // Update UI if needed
    }) as EventListener);

    console.log("[SceneSwitcherPanel] Registered");
  }

  /**
   * Unregister panel
   */
  unregister(): void {
    if (this.uilController) {
      this.uilController.unregisterModule(this.moduleId);
      console.log("[SceneSwitcherPanel] Unregistered");
    }
  }
}
