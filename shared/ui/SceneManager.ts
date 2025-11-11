/**
 * SceneManager.ts
 * Manages scene initialization and factory setup for the main application
 *
 * Responsible for:
 * - Initializing all available scenes
 * - Creating and configuring the SceneFactory
 * - Providing the active scene reference
 */

import { SceneFactory } from "../engine/SceneFactory";
import { GeospatialScene } from "../scenes/geospatial";
import { BackdropScene } from "../scenes/backdrop";
import { ProjectorLightScene } from "../scenes/projectorLight";

export class SceneManager {
  private static instance: SceneManager;
  private sceneFactory: SceneFactory | null = null;

  private constructor() {}

  /**
   * Initialize scene manager with canvas and optional renderer
   */
  static async initialize(
    canvas: HTMLCanvasElement,
    renderer?: any
  ): Promise<SceneManager> {
    if (SceneManager.instance) {
      return SceneManager.instance;
    }

    const instance = new SceneManager();
    instance.sceneFactory = SceneFactory.getInstance(canvas, renderer);

    // Register all available scenes
    instance.registerScenes();

    // Activate default scene (geospatial)
    await instance.sceneFactory.activate("geospatial");

    SceneManager.instance = instance;
    console.log("[SceneManager] Initialized with geospatial scene active");

    return instance;
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SceneManager {
    if (!SceneManager.instance) {
      throw new Error("SceneManager not initialized. Call initialize() first.");
    }
    return SceneManager.instance;
  }

  /**
   * Register all available scenes
   */
  private registerScenes(): void {
    if (!this.sceneFactory) return;

    // Register Geospatial Scene
    const geospatialScene = new GeospatialScene();
    this.sceneFactory.register("geospatial", geospatialScene);

    // Register Backdrop Scene
    const backdropScene = new BackdropScene();
    this.sceneFactory.register("backdrop", backdropScene);

    // Register Projector Light Scene
    const projectorLightScene = new ProjectorLightScene();
    this.sceneFactory.register("projectorLight", projectorLightScene);

    console.log("[SceneManager] Registered 3 scenes: geospatial, backdrop, projectorLight");
  }

  /**
   * Get the scene factory instance
   */
  getSceneFactory(): SceneFactory {
    if (!this.sceneFactory) {
      throw new Error("SceneFactory not initialized");
    }
    return this.sceneFactory;
  }

  /**
   * Get currently active scene
   */
  getActiveScene() {
    return this.sceneFactory?.getActive();
  }

  /**
   * Activate a scene by key
   */
  async activateScene(sceneKey: string): Promise<void> {
    if (!this.sceneFactory) {
      throw new Error("SceneFactory not initialized");
    }
    await this.sceneFactory.activate(sceneKey);
  }

  /**
   * Get list of available scene keys
   */
  listScenes(): string[] {
    return this.sceneFactory?.listScenes() || [];
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    if (this.sceneFactory) {
      await this.sceneFactory.dispose();
    }
  }
}
