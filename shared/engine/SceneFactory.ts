/**
 * SceneFactory.ts
 * Singleton factory managing multi-scene rendering with shared WebGPU renderer
 */

import * as THREE from "three";
import { WebGPURenderer } from "three/examples/jsm/renderers/webgpu/WebGPURenderer";
import { SceneBase } from "./SceneBase";
import { AssetManager } from "./AssetManager";

export interface ISceneFactory {
  register(sceneKey: string, SceneClass: typeof SceneBase): void;
  activate(sceneKey: string): Promise<void>;
  getActive(): SceneBase | null;
  getScene(sceneKey: string): SceneBase | null;
  listScenes(): string[];
  dispose(): Promise<void>;
  readonly renderer: WebGPURenderer | THREE.WebGLRenderer;
  readonly assetManager: AssetManager;
}

export class SceneFactory implements ISceneFactory {
  private static instance: SceneFactory;

  private activeScene: SceneBase | null = null;
  private scenes: Map<string, SceneBase> = new Map();
  private renderer!: WebGPURenderer | THREE.WebGLRenderer;
  private assetManager: AssetManager = new AssetManager();
  private canvas: HTMLCanvasElement;

  private constructor(canvas: HTMLCanvasElement, renderer?: WebGPURenderer | THREE.WebGLRenderer) {
    this.canvas = canvas;
    if (renderer) {
      this.renderer = renderer;
    } else {
      // Default: try WebGPU, fall back to WebGL
      this.initRenderer();
    }
  }

  /**
   * Get or create singleton instance
   */
  static getInstance(
    canvas?: HTMLCanvasElement,
    renderer?: WebGPURenderer | THREE.WebGLRenderer
  ): SceneFactory {
    if (!SceneFactory.instance) {
      if (!canvas) {
        throw new Error("Canvas required to initialize SceneFactory");
      }
      SceneFactory.instance = new SceneFactory(canvas, renderer);
    }
    return SceneFactory.instance;
  }

  /**
   * Register a scene class with unique key
   */
  register(sceneKey: string, SceneClass: typeof SceneBase): void {
    if (this.scenes.has(sceneKey)) {
      console.warn(`[SceneFactory] Scene "${sceneKey}" already registered`);
      return;
    }
    const instance = new SceneClass();
    this.scenes.set(sceneKey, instance);
    console.log(`[SceneFactory] Registered scene: ${sceneKey}`);
  }

  /**
   * Activate a scene by key
   * - Deactivates current scene
   * - Disposes previous scene
   * - Initializes new scene (if needed)
   * - Activates new scene
   */
  async activate(sceneKey: string): Promise<void> {
    const nextScene = this.scenes.get(sceneKey);
    if (!nextScene) {
      throw new Error(`Scene "${sceneKey}" not registered`);
    }

    console.log(`[SceneFactory] Activating scene: ${sceneKey}`);

    // Deactivate and dispose current scene
    if (this.activeScene) {
      console.log(`[SceneFactory] Deactivating previous scene: ${this.activeScene.sceneKey}`);
      this.activeScene.deactivate();
      await this.activeScene.dispose();
    }

    // Initialize new scene (if not already done)
    if (!nextScene.isInitialized) {
      console.log(`[SceneFactory] Initializing scene: ${sceneKey}`);
      await nextScene.init(this.renderer, this.assetManager);
    }

    // Activate new scene
    nextScene.activate();
    this.activeScene = nextScene;

    // Emit scene-activated event
    this.onSceneActivated(sceneKey);
  }

  /**
   * Get currently active scene
   */
  getActive(): SceneBase | null {
    return this.activeScene;
  }

  /**
   * Get registered scene by key (doesn't activate)
   */
  getScene(sceneKey: string): SceneBase | null {
    return this.scenes.get(sceneKey) || null;
  }

  /**
   * List all registered scene keys
   */
  listScenes(): string[] {
    return Array.from(this.scenes.keys());
  }

  /**
   * Shut down factory: dispose all scenes and renderer
   */
  async dispose(): Promise<void> {
    console.log("[SceneFactory] Disposing...");

    if (this.activeScene) {
      this.activeScene.deactivate();
      await this.activeScene.dispose();
    }

    for (const scene of this.scenes.values()) {
      await scene.dispose();
    }

    this.assetManager.dispose();
    this.renderer.dispose();

    console.log("[SceneFactory] Disposed");
  }

  /**
   * Handle window resize for active scene
   */
  onWindowResize(width: number, height: number): void {
    if (this.activeScene && this.activeScene.onWindowResize) {
      this.activeScene.onWindowResize(width, height);
    }

    // Resize renderer
    if (this.renderer instanceof WebGPURenderer || "setSize" in this.renderer) {
      (this.renderer as any).setSize(width, height);
    }
  }

  /**
   * Update loop hook (call every frame)
   */
  update(deltaTime: number): void {
    if (this.activeScene && this.activeScene.update) {
      this.activeScene.update(deltaTime);
    }
  }

  /**
   * Render the active scene
   */
  render(): void {
    if (this.activeScene) {
      const activeSceneGroup = (this.activeScene as any).group;
      const camera = activeSceneGroup.children.find((c: THREE.Object3D) => c instanceof THREE.Camera);
      if (camera && this.renderer) {
        this.renderer.render(activeSceneGroup, camera as THREE.Camera);
      }
    }
  }

  // ============================================================================
  // Public getters
  // ============================================================================

  get renderer(): WebGPURenderer | THREE.WebGLRenderer {
    return this.renderer;
  }

  get assetManager(): AssetManager {
    return this.assetManager;
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private initRenderer(): void {
    // Try WebGPU first, fall back to WebGL
    try {
      this.renderer = new WebGPURenderer({ canvas: this.canvas });
      console.log("[SceneFactory] Using WebGPU renderer");
    } catch (e) {
      console.warn("[SceneFactory] WebGPU not available, falling back to WebGL", e);
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
    }

    // Basic renderer settings
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  private onSceneActivated(sceneKey: string): void {
    // Emit custom event for UI or logging
    const event = new CustomEvent("scene-activated", { detail: { sceneKey } });
    document.dispatchEvent(event);
    console.log(`[SceneFactory] Scene activated event dispatched: ${sceneKey}`);
  }
}
