/**
 * SceneBase.ts
 * Abstract base class for all scenes
 */

import * as THREE from "three";
import { WebGPURenderer } from "three/examples/jsm/renderers/webgpu/WebGPURenderer";
import type { SceneConfig, CameraConfig, LightConfig, EnvironmentConfig } from "./SceneConfig";

export interface ISceneBase {
  readonly sceneKey: string;
  readonly config: SceneConfig;
  readonly group: THREE.Group;
  readonly isActive: boolean;
  readonly isInitialized: boolean;

  init(renderer: WebGPURenderer | THREE.WebGLRenderer, assetManager: any): Promise<void>;
  activate(): void;
  deactivate(): void;
  dispose(): Promise<void>;
  update?(deltaTime: number): void;
  onWindowResize?(width: number, height: number): void;
}

export abstract class SceneBase implements ISceneBase {
  protected sceneKey: string = "";
  protected config: SceneConfig = { sceneKey: "", name: "", camera: { type: "perspective", near: 0.1, far: 10000, position: [0, 0, 0], lookAt: [0, 0, 0] } };
  protected group: THREE.Group = new THREE.Group();
  protected isActive: boolean = false;
  protected isInitialized: boolean = false;
  protected camera: THREE.Camera | null = null;

  // Protected access to factory resources
  protected renderer!: WebGPURenderer | THREE.WebGLRenderer;
  protected assetManager!: any;

  constructor() {
    // Subclass must set this.config
  }

  async init(
    renderer: WebGPURenderer | THREE.WebGLRenderer,
    assetManager: any
  ): Promise<void> {
    this.renderer = renderer;
    this.assetManager = assetManager;

    // Setup camera from config
    this.setupCamera(this.config.camera);

    // Setup lights from config
    if (this.config.lights) {
      this.setupLights(this.config.lights);
    }

    // Setup environment map
    if (this.config.environment) {
      await this.setupEnvironment(this.config.environment);
    }

    // Call subclass-specific initialization
    await this.build();

    // Register UI controls
    if (this.config.uiControls) {
      this.registerUIControls();
    }

    this.isInitialized = true;
  }

  activate(): void {
    this.group.visible = true;
    this.isActive = true;
    this.onActivate();
  }

  deactivate(): void {
    this.isActive = false;
    this.group.visible = false;
    this.onDeactivate();
  }

  async dispose(): Promise<void> {
    // Unregister UI
    this.unregisterUIControls();

    // Call subclass-specific disposal
    await this.onDispose();

    // Release shared assets
    if (this.config.environment?.mapAsset && this.assetManager) {
      this.assetManager.release(this.config.environment.mapAsset);
    }

    // Dispose own scene graph
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m: THREE.Material) => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });
    this.group.clear();
  }

  update(deltaTime: number): void {
    if (this.isActive) {
      this.onUpdate(deltaTime);
    }
  }

  onWindowResize(width: number, height: number): void {
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
    this.onResize(width, height);
  }

  // ============================================================================
  // Protected abstract hooks (subclasses must implement)
  // ============================================================================

  protected abstract build(): Promise<void>;
  protected abstract onActivate(): void;
  protected abstract onDeactivate(): void;
  protected abstract onDispose(): Promise<void>;
  protected abstract onUpdate(deltaTime: number): void;
  protected abstract onResize(width: number, height: number): void;

  // ============================================================================
  // Protected helper methods
  // ============================================================================

  protected setupCamera(cameraConfig: CameraConfig): void {
    let camera: THREE.Camera;

    if (cameraConfig.type === "perspective") {
      camera = new THREE.PerspectiveCamera(
        cameraConfig.fov ?? 75,
        window.innerWidth / window.innerHeight,
        cameraConfig.near,
        cameraConfig.far
      );
    } else {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera = new THREE.OrthographicCamera(
        -w / 2,
        w / 2,
        h / 2,
        -h / 2,
        cameraConfig.near,
        cameraConfig.far
      );
    }

    camera.position.set(...cameraConfig.position);
    camera.lookAt(...cameraConfig.lookAt);
    this.camera = camera;
    this.group.add(camera);
  }

  protected setupLights(lightsConfig: LightConfig): void {
    if (lightsConfig.ambient) {
      const ambient = new THREE.AmbientLight(
        lightsConfig.ambient.color,
        lightsConfig.ambient.intensity
      );
      this.group.add(ambient);
    }

    if (lightsConfig.directional) {
      for (const dirConfig of lightsConfig.directional) {
        const directional = new THREE.DirectionalLight(
          dirConfig.color,
          dirConfig.intensity
        );
        directional.position.set(...dirConfig.position);
        if (dirConfig.castShadow) {
          directional.castShadow = true;
          directional.shadow.mapSize.width = dirConfig.shadowMapSize ?? 2048;
          directional.shadow.mapSize.height = dirConfig.shadowMapSize ?? 2048;
        }
        this.group.add(directional);
      }
    }
  }

  protected async setupEnvironment(envConfig: EnvironmentConfig): Promise<void> {
    // Load environment map via assetManager
    try {
      const envMap = await this.assetManager.getTexture(envConfig.mapAsset);
      // Note: Actual integration with renderer depends on renderer type
      // This is a placeholder
      console.log(`Loaded environment map: ${envConfig.mapAsset}`);
    } catch (e) {
      console.warn(`Failed to load environment map: ${envConfig.mapAsset}`, e);
    }
  }

  protected registerUIControls(): void {
    // TODO: Integrate with UILController
    if (this.config.uiControls) {
      console.log(`[${this.sceneKey}] Registering UI controls:`, this.config.uiControls);
    }
  }

  protected unregisterUIControls(): void {
    // TODO: Remove UI controls from UILController
    console.log(`[${this.sceneKey}] Unregistering UI controls`);
  }

  protected getUIBindings(): Record<
    string,
    { get: () => any; set: (v: any) => void }
  > {
    // Subclasses override this
    return {};
  }
}
