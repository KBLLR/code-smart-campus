/**
 * shared/scenes/backdrop/index.ts
 * BackdropScene Implementation (Phase 1b)
 *
 * Stylized campus 3D visualization following WebGPU backdrop aesthetic.
 * Same campus geometry as GeospatialScene but with:
 * - WebGPU-native tone mapping
 * - Area light responsiveness (visual style)
 * - High-quality material rendering
 * - Stylized lighting mood
 *
 * Inspired by: https://github.com/mrdoob/three.js/blob/master/examples/webgpu_backdrop_area.html
 * (Material qualities, tone mapping, light responsiveness patterns)
 */

import * as THREE from "three";
import { SceneBase, type SceneConfig } from "../../engine";
import { loadCampusAsset, type CampusAsset } from "../_shared";

/**
 * BackdropScene Configuration Template
 */
const BACKDROP_CONFIG: SceneConfig = {
  sceneKey: "backdrop",
  name: "Backdrop",
  camera: {
    type: "perspective",
    fov: 75,
    near: 0.1,
    far: 10000,
    position: [0, 50, 100],
    lookAt: [0, 0, 0],
    up: [0, 1, 0],
  },
  lights: {
    ambient: {
      color: 0xffffff,
      intensity: 0.5,
    },
  },
  uiControls: {
    modules: [
      {
        id: "backdrop",
        label: "Backdrop Aesthetic",
        controls: {
          toneExposure: {
            type: "slider",
            min: 0.5,
            max: 2.0,
            step: 0.1,
            value: 1.0,
          },
          toneContrast: {
            type: "slider",
            min: 0.5,
            max: 2.0,
            step: 0.1,
            value: 1.0,
          },
          glossiness: {
            type: "slider",
            min: 0,
            max: 1,
            step: 0.05,
            value: 0.5,
          },
        },
      },
      {
        id: "lighting",
        label: "Lighting Mood",
        controls: {
          lightIntensity: {
            type: "knob",
            min: 0.3,
            max: 1.5,
            step: 0.05,
            value: 1.0,
          },
          lightWarmth: {
            type: "color",
            value: "#ffffff",
          },
        },
      },
    ],
  },
  metadata: {
    description: "Stylized campus view with WebGPU backdrop aesthetic",
    tags: ["secondary", "stylized", "backdrop"],
    features: ["tone-mapping", "high-quality-materials", "lighting-mood"],
  },
};

/**
 * BackdropScene
 *
 * Stylized campus rendering following WebGPU backdrop example patterns.
 * Uses same campus geometry as GeospatialScene but applies:
 * - Tone mapping (exposure, contrast)
 * - Area light-responsive materials
 * - High-quality PBR rendering
 * - Custom lighting mood
 */
export class BackdropScene extends SceneBase {
  protected static readonly configTemplate: SceneConfig = BACKDROP_CONFIG;

  // ============================================================================
  // Instance Properties
  // ============================================================================

  private isBuilt: boolean = false;

  // Campus asset
  private campusAsset: CampusAsset | null = null;
  private campusGroup: THREE.Group | null = null;

  // Lighting
  private ambientLight: THREE.AmbientLight | null = null;
  private areaLight: THREE.RectAreaLight | null = null;

  // Material registry
  private materialRegistry: any = null;

  // Tone mapping state
  private toneConfig = {
    exposure: 1.0,
    contrast: 1.0,
    glossiness: 0.5,
  };

  // Lighting mood state
  private lightingConfig = {
    intensity: 1.0,
    warmth: new THREE.Color(0xffffff),
  };

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor() {
    super();
    this.sceneKey = "backdrop";
    this.config = BACKDROP_CONFIG;
  }

  // ============================================================================
  // SceneBase Lifecycle Implementation
  // ============================================================================

  protected async build(): Promise<void> {
    console.log("[BackdropScene] Building stylized backdrop environment...");

    try {
      // Step 1: Initialize material registry
      await this.initializeMaterialRegistry();

      // Step 2: Load campus geometry (same as GeospatialScene)
      await this.loadCampusGeometry();

      // Step 3: Setup area light aesthetic (visual style, not functional light)
      this.setupAreaLightAesthetic();

      // Step 4: Configure scene appearance
      this.setupSceneAppearance();

      this.isBuilt = true;
      console.log("[BackdropScene] Build complete");
    } catch (e) {
      console.error("[BackdropScene] Build failed:", e);
      throw e;
    }
  }

  protected onActivate(): void {
    console.log("[BackdropScene] Activated");
  }

  protected onDeactivate(): void {
    console.log("[BackdropScene] Deactivated");
  }

  protected async onDispose(): Promise<void> {
    console.log("[BackdropScene] Disposing...");

    // Dispose campus asset
    if (this.campusAsset) {
      this.campusAsset.dispose();
      this.campusAsset = null;
    }

    // Remove campus group
    if (this.campusGroup) {
      this.group.remove(this.campusGroup);
      this.campusGroup = null;
    }

    // Dispose lights
    this.ambientLight = null;
    this.areaLight = null;

    this.isBuilt = false;
  }

  protected onUpdate(deltaTime: number): void {
    // Optional: Subtle animations or mood transitions
    // For now, static scene
  }

  protected onResize(width: number, height: number): void {
    // Camera aspect handled by SceneBase
  }

  // ============================================================================
  // Private Methods: Building the Scene
  // ============================================================================

  /**
   * Initialize material registry
   */
  private async initializeMaterialRegistry(): Promise<void> {
    console.log("[BackdropScene] Initializing material registry...");

    try {
      const { materialRegistry: matRegistry } = await import("@registries/materialsRegistry.js");
      this.materialRegistry = matRegistry;

      if (this.renderer) {
        this.materialRegistry.init({ renderer: this.renderer });
      }

      console.log("[BackdropScene] Material registry ready");
    } catch (e) {
      console.error("[BackdropScene] Failed to load material registry:", e);
      throw e;
    }
  }

  /**
   * Load campus geometry (shared with GeospatialScene)
   */
  private async loadCampusGeometry(): Promise<void> {
    console.log("[BackdropScene] Loading campus geometry...");

    try {
      // Load same campus asset
      this.campusAsset = await loadCampusAsset(this.materialRegistry, {
        fogColor: "#0f0f0f",  // Darker backdrop
        fogDensity: 0.0015,
        backgroundColor: "#0a0a0a",
      });

      // Create container
      this.campusGroup = new THREE.Group();
      this.campusGroup.name = "Campus";

      // Add floor
      this.campusGroup.add(this.campusAsset.floorMesh);

      // Add rooms
      this.campusGroup.add(this.campusAsset.roomGroup);

      // Add to scene
      this.group.add(this.campusGroup);

      console.log(`[BackdropScene] Campus loaded: ${this.campusAsset.roomMeshes.size} rooms`);
    } catch (e) {
      console.error("[BackdropScene] Failed to load campus geometry:", e);
      throw e;
    }
  }

  /**
   * Setup area light aesthetic (visual style following WebGPU backdrop example)
   * This creates the characteristic look of the three.js webgpu_backdrop_area example
   */
  private setupAreaLightAesthetic(): void {
    console.log("[BackdropScene] Setting up area light aesthetic...");

    // Ambient light (base)
    this.ambientLight = new THREE.AmbientLight(0xffffff, this.lightingConfig.intensity);
    this.group.add(this.ambientLight);

    // Optional: RectAreaLight for area light aesthetic
    // (In the three.js example, this creates the characteristic soft, area-based illumination)
    try {
      // RectAreaLight is available in WebGPU
      // Creates the soft, area-based lighting characteristic of the backdrop example
      this.areaLight = new THREE.RectAreaLight(this.lightingConfig.warmth, this.lightingConfig.intensity, 200, 200);
      this.areaLight.position.set(0, 200, 500);
      this.group.add(this.areaLight);

      console.log("[BackdropScene] Area light aesthetic configured");
    } catch (e) {
      console.warn("[BackdropScene] Area light not available, using ambient only:", e);
    }
  }

  /**
   * Setup scene appearance (tone mapping, colors)
   */
  private setupSceneAppearance(): void {
    console.log("[BackdropScene] Configuring backdrop appearance...");

    // Tone mapping would be applied at renderer level in production
    // For now, we store the config for UI binding
    console.log(
      `[BackdropScene] Tone config: exposure=${this.toneConfig.exposure}, contrast=${this.toneConfig.contrast}`
    );
  }

  // ============================================================================
  // UI Control Bindings
  // ============================================================================

  protected getUIBindings(): Record<string, { get: () => any; set: (v: any) => void }> {
    return {
      // Tone mapping controls
      "backdrop.toneExposure": {
        get: () => this.toneConfig.exposure,
        set: (value: number) => {
          this.toneConfig.exposure = value;
          console.log(`[BackdropScene] Tone exposure: ${value}`);
        },
      },

      "backdrop.toneContrast": {
        get: () => this.toneConfig.contrast,
        set: (value: number) => {
          this.toneConfig.contrast = value;
          console.log(`[BackdropScene] Tone contrast: ${value}`);
        },
      },

      "backdrop.glossiness": {
        get: () => this.toneConfig.glossiness,
        set: (value: number) => {
          this.toneConfig.glossiness = value;
          // Apply to room materials
          if (this.campusAsset?.roomMeshes) {
            this.campusAsset.roomMeshes.forEach((mesh) => {
              if (mesh.material instanceof THREE.Material) {
                if ("roughness" in mesh.material) {
                  (mesh.material as any).roughness = 1 - value; // Invert: higher glossiness = lower roughness
                }
              }
            });
          }
        },
      },

      // Lighting mood controls
      "lighting.lightIntensity": {
        get: () => this.lightingConfig.intensity,
        set: (value: number) => {
          this.lightingConfig.intensity = value;
          if (this.ambientLight) {
            this.ambientLight.intensity = value;
          }
          if (this.areaLight) {
            this.areaLight.intensity = value;
          }
        },
      },

      "lighting.lightWarmth": {
        get: () => "#" + this.lightingConfig.warmth.getHexString(),
        set: (value: string) => {
          this.lightingConfig.warmth.setStyle(value);
          if (this.ambientLight) {
            this.ambientLight.color.copy(this.lightingConfig.warmth);
          }
          if (this.areaLight) {
            this.areaLight.color.copy(this.lightingConfig.warmth);
          }
        },
      },
    };
  }

  // ============================================================================
  // Public Accessors
  // ============================================================================

  public getCampusAsset(): CampusAsset | null {
    return this.campusAsset;
  }

  public getToneConfig(): typeof this.toneConfig {
    return this.toneConfig;
  }

  public getLightingConfig(): typeof this.lightingConfig {
    return this.lightingConfig;
  }

  public getRoomMeshes(): Map<string, THREE.Mesh> | null {
    return this.campusAsset?.roomMeshes || null;
  }
}

export default BackdropScene;
