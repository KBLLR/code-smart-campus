/**
 * SceneFactory.ts
 * Singleton factory managing multi-scene rendering with shared WebGPU renderer
 */

import * as THREE from "three";
import { SceneBase } from "./SceneBase";
import { AssetManager } from "./AssetManager";

// Generic renderer type - accepts WebGLRenderer or WebGPURenderer at runtime
type Renderer = THREE.WebGLRenderer | (any & { isWebGPURenderer?: boolean });

export interface ISceneFactory {
  register(sceneKey: string, sceneInstance: SceneBase): void;
  activate(sceneKey: string): Promise<void>;
  getActive(): SceneBase | null;
  getScene(sceneKey: string): SceneBase | null;
  listScenes(): string[];
  dispose(): Promise<void>;
  readonly renderer: Renderer;
  readonly assetManager: AssetManager;
}

export class SceneFactory implements ISceneFactory {
  private static instance: SceneFactory;

  private activeScene: SceneBase | null = null;
  private scenes: Map<string, SceneBase> = new Map();
  private _renderer!: Renderer;
  private _assetManager: AssetManager = new AssetManager();
  private canvas: HTMLCanvasElement;

  private constructor(canvas: HTMLCanvasElement, renderer?: Renderer) {
    this.canvas = canvas;
    if (renderer) {
      this._renderer = renderer;
      console.log("[SceneFactory] Using provided renderer");
    } else {
      // Default: use WebGL
      this._renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
      this._renderer.setSize(window.innerWidth, window.innerHeight);
      this._renderer.setPixelRatio(window.devicePixelRatio);
      console.log("[SceneFactory] Created default WebGL renderer");
    }
  }

  /**
   * Get or create singleton instance
   */
  static getInstance(
    canvas?: HTMLCanvasElement,
    renderer?: Renderer
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
   * Register a scene instance with unique key
   */
  register(sceneKey: string, sceneInstance: SceneBase): void {
    if (this.scenes.has(sceneKey)) {
      console.warn(`[SceneFactory] Scene "${sceneKey}" already registered`);
      return;
    }
    this.scenes.set(sceneKey, sceneInstance);
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
      await nextScene.init(this._renderer, this._assetManager);
    }

    // Activate new scene
    nextScene.activate();
    this.activeScene = nextScene;

    // Update picking service with scene's room meshes (if available)
    this.updatePickingService(nextScene);

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

    this._assetManager.dispose();
    this._renderer.dispose();

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
    if ("setSize" in this._renderer) {
      (this._renderer as any).setSize(width, height);
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
      if (camera && this._renderer) {
        this._renderer.render(activeSceneGroup, camera as THREE.Camera);
      }
    }
  }

  // ============================================================================
  // Public getters
  // ============================================================================

  get renderer(): Renderer {
    return this._renderer;
  }

  get assetManager(): AssetManager {
    return this._assetManager;
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private onSceneActivated(sceneKey: string): void {
    // Emit custom event for UI or logging
    const event = new CustomEvent("scene-activated", { detail: { sceneKey } });
    document.dispatchEvent(event);
    console.log(`[SceneFactory] Scene activated event dispatched: ${sceneKey}`);
  }

  /**
   * Update picking service with room meshes from the newly activated scene
   */
  private updatePickingService(scene: SceneBase): void {
    // Check if picking service exists on window
    const picking = (window as any).picking;
    if (!picking || typeof picking.setRoomMeshes !== 'function') {
      console.log('[SceneFactory] Picking service not available, skipping mesh update');
      return;
    }

    // Get room meshes from scene (if scene has them)
    const roomMeshes = scene.getRoomMeshes();

    if (roomMeshes && roomMeshes.size > 0) {
      // Convert Map to Array for picking service
      const meshArray = Array.from(roomMeshes.values());
      picking.setRoomMeshes(meshArray);
      console.log(`[SceneFactory] Updated picking service with ${meshArray.length} room meshes from ${scene.sceneKey}`);
    } else {
      // Scene has no room meshes, fall back to legacy meshes
      const legacyMeshes = (window as any).roomMeshesForPicking;
      if (legacyMeshes) {
        picking.setRoomMeshes(legacyMeshes);
        console.log(`[SceneFactory] Scene has no room meshes, using legacy meshes`);
      } else {
        console.log(`[SceneFactory] No room meshes available for picking`);
      }
    }
  }
}
