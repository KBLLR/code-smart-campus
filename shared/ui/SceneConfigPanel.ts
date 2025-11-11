/**
 * shared/ui/SceneConfigPanel.ts
 * UIL panel for configuring active scene parameters
 */

import type { SceneFactory } from "../engine/SceneFactory";
import type { SceneBase } from "../engine/SceneBase";

export interface SceneConfigPanelConfig {
  sceneFactory: SceneFactory;
  uilController?: any; // UILController instance
}

export class SceneConfigPanel {
  private sceneFactory: SceneFactory;
  private uilController: any;
  private registeredModules: Set<string> = new Set();

  constructor(config: SceneConfigPanelConfig) {
    this.sceneFactory = config.sceneFactory;
    this.uilController = config.uilController;

    // Listen for scene activation to update config panel
    document.addEventListener("scene-activated", ((e: CustomEvent) => {
      this.onSceneActivated(e.detail.sceneKey);
    }) as EventListener);
  }

  /**
   * Update config panel when scene is activated
   */
  private onSceneActivated(sceneKey: string): void {
    const activeScene = this.sceneFactory.getActive();
    if (!activeScene) return;

    console.log(`[SceneConfigPanel] Updating for scene: ${sceneKey}`);

    // Clear previous scene's modules
    for (const moduleId of this.registeredModules) {
      if (this.uilController) {
        this.uilController.unregisterModule(moduleId);
      }
    }
    this.registeredModules.clear();

    // Register new scene's UI modules
    if (activeScene.config.uiControls) {
      for (const uiModule of activeScene.config.uiControls.modules) {
        this.registerModule(activeScene, uiModule.id, uiModule.label, uiModule.controls);
      }
    }
  }

  /**
   * Register a UIL module for scene config
   */
  private registerModule(
    _scene: SceneBase,
    moduleId: string,
    label: string,
    controlsSchema: Record<string, any>
  ): void {
    if (!this.uilController) {
      console.warn("[SceneConfigPanel] UIL controller not provided");
      return;
    }

    try {
      this.uilController.registerModule(moduleId, {
        label,
        controls: controlsSchema,
        bindings: {}, // Will be populated by scene-specific bindings
      });

      this.registeredModules.add(moduleId);
      console.log(`[SceneConfigPanel] Registered module: ${moduleId} (${label})`);
    } catch (e) {
      console.error(`[SceneConfigPanel] Failed to register module ${moduleId}:`, e);
    }
  }

  /**
   * Unregister all modules
   */
  unregister(): void {
    for (const moduleId of this.registeredModules) {
      if (this.uilController) {
        this.uilController.unregisterModule(moduleId);
      }
    }
    this.registeredModules.clear();
    console.log("[SceneConfigPanel] Unregistered all modules");
  }

  /**
   * Get current scene's UI bindings (for real-time updates)
   */
  getSceneBindings(): Record<string, { get: () => any; set: (v: any) => void }> {
    const activeScene = this.sceneFactory.getActive();
    if (!activeScene) return {};

    // Scenes should override getUIBindings() for their specific bindings
    // This is a placeholder hook
    return {};
  }
}
