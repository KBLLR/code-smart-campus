/**
 * shared/scenes/projectorLight/index.ts
 * ProjectorLightScene Implementation (Phase 1c)
 *
 * Projection-ready campus visualization with white canvas materials.
 * Shares campus geometry with GeospatialScene & BackdropScene but applies
 * white matte/glossy canvas materials for projection mapping.
 *
 * Features:
 * - Campus geometry with projection-optimized materials
 * - Configurable projector spotlight
 * - Room selection and highlighting
 * - Real-time light parameter adjustment
 * - High-quality shadow mapping
 */

import * as THREE from "three";
import { SceneBase, type SceneConfig } from "../../engine";
import { loadCampusAsset, type CampusAsset } from "../_shared";

/**
 * ProjectorLightScene Configuration Template
 */
const PROJECTOR_CONFIG: SceneConfig = {
  sceneKey: "projectorLight",
  name: "Projector Light",
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
      intensity: 0.4,
    },
  },
  uiControls: {
    modules: [
      {
        id: "canvas",
        label: "Canvas Material",
        controls: {
          canvasRoughness: {
            type: "slider",
            min: 0,
            max: 1,
            step: 0.05,
            value: 0.8,
          },
          canvasGlossiness: {
            type: "slider",
            min: 0,
            max: 1,
            step: 0.05,
            value: 0.2,
          },
        },
      },
      {
        id: "projector",
        label: "Projector Light",
        controls: {
          lightEnabled: {
            type: "bool",
            value: true,
          },
          lightColor: {
            type: "color",
            value: "#ffffff",
          },
          lightIntensity: {
            type: "knob",
            min: 0,
            max: 500,
            step: 10,
            value: 200,
          },
          lightAngle: {
            type: "slider",
            min: 0,
            max: Math.PI / 2,
            step: 0.01,
            value: Math.PI / 3,
          },
          shadowEnabled: {
            type: "bool",
            value: true,
          },
        },
      },
    ],
  },
  metadata: {
    description: "Projection-ready campus with white canvas materials",
    tags: ["specialized", "projection", "testing"],
    features: ["white-canvas", "spotlight", "shadows", "room-geometry"],
  },
};

/**
 * ProjectorLightScene
 *
 * Campus scene with white canvas materials optimized for projection mapping.
 * Shares campus geometry (Floor + rooms) with other scenes but applies
 * white matte materials for clean projection surfaces.
 */
export class ProjectorLightScene extends SceneBase {
  protected static readonly configTemplate: SceneConfig = PROJECTOR_CONFIG;

  // ============================================================================
  // Instance Properties
  // ============================================================================

  private isBuilt: boolean = false;

  // Campus asset
  private campusAsset: CampusAsset | null = null;
  private campusGroup: THREE.Group | null = null;

  // Material registry
  private materialRegistry: any = null;

  // Projector light system
  private projectorLight: THREE.SpotLight | null = null;
  private lightConeHelper: THREE.SpotLightHelper | null = null;

  // Canvas material state
  private canvasConfig = {
    roughness: 0.8,
    glossiness: 0.2,
  };

  // Room materials (white canvas)
  private roomCanvasMaterials: Map<string, THREE.Material> = new Map();

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor() {
    super();
    this.sceneKey = "projectorLight";
    this.config = PROJECTOR_CONFIG;
  }

  // ============================================================================
  // SceneBase Lifecycle Implementation
  // ============================================================================

  protected async build(): Promise<void> {
    console.log("[ProjectorLightScene] Building projection-ready campus...");

    try {
      // Step 1: Initialize material registry
      await this.initializeMaterialRegistry();

      // Step 2: Load campus geometry (same as other scenes)
      await this.loadCampusGeometry();

      // Step 3: Apply white canvas materials to rooms
      this.applyCanvasMaterials();

      // Step 4: Setup projector light
      this.setupProjectorLight();

      // Step 5: Create light cone visualization
      this.createLightConeHelper();

      this.isBuilt = true;
      console.log("[ProjectorLightScene] Build complete");
    } catch (e) {
      console.error("[ProjectorLightScene] Build failed:", e);
      throw e;
    }
  }

  protected onActivate(): void {
    console.log("[ProjectorLightScene] Activated");
    if (this.projectorLight) {
      this.projectorLight.visible = true;
    }
  }

  protected onDeactivate(): void {
    console.log("[ProjectorLightScene] Deactivated");
  }

  protected async onDispose(): Promise<void> {
    console.log("[ProjectorLightScene] Disposing...");

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

    // Dispose canvas materials
    this.roomCanvasMaterials.forEach((material) => {
      (material as THREE.Material).dispose();
    });
    this.roomCanvasMaterials.clear();

    // Remove and dispose light cone helper
    if (this.lightConeHelper) {
      this.group.remove(this.lightConeHelper);
      this.lightConeHelper.dispose();
      this.lightConeHelper = null;
    }

    // Remove projector light
    if (this.projectorLight) {
      this.group.remove(this.projectorLight);
      this.group.remove(this.projectorLight.target);
      (this.projectorLight.shadow.map as any)?.dispose?.();
      this.projectorLight = null;
    }

    this.isBuilt = false;
  }

  protected onUpdate(_deltaTime: number): void {
    if (!this.isBuilt) return;

    // Update light cone helper
    if (this.lightConeHelper && this.projectorLight) {
      this.lightConeHelper.update();
    }
  }

  protected onResize(_width: number, _height: number): void {
    // Camera aspect handled by SceneBase
  }

  // ============================================================================
  // Private Methods: Building the Scene
  // ============================================================================

  /**
   * Initialize material registry
   */
  private async initializeMaterialRegistry(): Promise<void> {
    console.log("[ProjectorLightScene] Initializing material registry...");

    try {
      const { materialRegistry: matRegistry } = await import("@registries/materialsRegistry.js");
      this.materialRegistry = matRegistry;

      if (this.renderer) {
        this.materialRegistry.init({ renderer: this.renderer });
      }

      console.log("[ProjectorLightScene] Material registry ready");
    } catch (e) {
      console.error("[ProjectorLightScene] Failed to load material registry:", e);
      throw e;
    }
  }

  /**
   * Load campus geometry (shared with other scenes)
   */
  private async loadCampusGeometry(): Promise<void> {
    console.log("[ProjectorLightScene] Loading campus geometry...");

    try {
      // Load same campus asset
      this.campusAsset = await loadCampusAsset(this.materialRegistry, {
        fogColor: "#0f0f0f",
        fogDensity: 0.0015,
        backgroundColor: "#0a0a0a",
      });

      // Create container
      this.campusGroup = new THREE.Group();
      this.campusGroup.name = "Campus";

      // Add floor
      this.campusGroup.add(this.campusAsset.floorMesh);

      // Add rooms (will replace materials in next step)
      this.campusGroup.add(this.campusAsset.roomGroup);

      // Add to scene
      this.group.add(this.campusGroup);

      console.log(`[ProjectorLightScene] Campus loaded: ${this.campusAsset.roomMeshes.size} rooms`);
    } catch (e) {
      console.error("[ProjectorLightScene] Failed to load campus geometry:", e);
      throw e;
    }
  }

  /**
   * Replace room materials with white canvas for projection
   */
  private applyCanvasMaterials(): void {
    console.log("[ProjectorLightScene] Applying white canvas materials...");

    if (!this.campusAsset?.roomMeshes) return;

    this.campusAsset.roomMeshes.forEach((mesh, roomKey) => {
      if (mesh.material instanceof THREE.Material) {
        // Create white canvas material (matte for projection)
        const canvasMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: this.canvasConfig.roughness,
          metalness: 0.0,
          side: THREE.DoubleSide,
        });

        // Store for reference
        this.roomCanvasMaterials.set(roomKey, canvasMaterial);

        // Replace mesh material
        mesh.material = canvasMaterial;

        // Ensure shadow settings
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    console.log("[ProjectorLightScene] Canvas materials applied");
  }

  /**
   * Setup projector spotlight with high-quality shadows
   */
  private setupProjectorLight(): void {
    console.log("[ProjectorLightScene] Setting up projector light...");

    // Ambient light (soft base illumination)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.group.add(ambientLight);

    // Projector spotlight (high intensity for projection)
    this.projectorLight = new THREE.SpotLight(0xffffff, 200);
    this.projectorLight.position.set(0, 80, 50);
    this.projectorLight.target.position.set(0, 0, 0);
    this.projectorLight.angle = Math.PI / 3; // 60° cone
    this.projectorLight.penumbra = 0.1;
    this.projectorLight.castShadow = true;
    this.projectorLight.shadow.mapSize.width = 4096;
    this.projectorLight.shadow.mapSize.height = 4096;
    this.projectorLight.shadow.camera.near = 0.5;
    this.projectorLight.shadow.camera.far = 500;

    this.group.add(this.projectorLight);
    this.group.add(this.projectorLight.target);

    // Visual projector body
    const projectorBodyGeometry = new THREE.CylinderGeometry(5, 5, 10, 32);
    const projectorBodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.8,
      roughness: 0.2,
    });
    const projectorBody = new THREE.Mesh(projectorBodyGeometry, projectorBodyMaterial);
    projectorBody.position.copy(this.projectorLight.position);
    projectorBody.castShadow = true;
    this.group.add(projectorBody);

    console.log("[ProjectorLightScene] Projector light configured");
  }

  /**
   * Create light cone visualization helper
   */
  private createLightConeHelper(): void {
    if (this.projectorLight) {
      this.lightConeHelper = new THREE.SpotLightHelper(this.projectorLight);
      this.group.add(this.lightConeHelper);
      console.log("[ProjectorLightScene] Light cone helper created");
    }
  }

  // ============================================================================
  // UI Control Bindings
  // ============================================================================

  protected getUIBindings(): Record<string, { get: () => any; set: (v: any) => void }> {
    return {
      // Canvas material controls
      "canvas.canvasRoughness": {
        get: () => this.canvasConfig.roughness,
        set: (value: number) => {
          this.canvasConfig.roughness = value;
          // Update all room canvas materials
          this.roomCanvasMaterials.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
              material.roughness = value;
            }
          });
        },
      },

      "canvas.canvasGlossiness": {
        get: () => this.canvasConfig.glossiness,
        set: (value: number) => {
          this.canvasConfig.glossiness = value;
          // Glossiness = 1 - roughness
          const roughness = 1 - value;
          this.roomCanvasMaterials.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
              material.roughness = roughness;
            }
          });
        },
      },

      // Projector light controls
      "projector.lightEnabled": {
        get: () => this.projectorLight?.visible ?? true,
        set: (value: boolean) => {
          if (this.projectorLight) {
            this.projectorLight.visible = value;
          }
        },
      },

      "projector.lightColor": {
        get: () => {
          if (this.projectorLight) {
            return "#" + this.projectorLight.color.getHexString();
          }
          return "#ffffff";
        },
        set: (value: string) => {
          if (this.projectorLight) {
            this.projectorLight.color.setStyle(value);
          }
        },
      },

      "projector.lightIntensity": {
        get: () => this.projectorLight?.intensity ?? 200,
        set: (value: number) => {
          if (this.projectorLight) {
            this.projectorLight.intensity = value;
          }
        },
      },

      "projector.lightAngle": {
        get: () => this.projectorLight?.angle ?? Math.PI / 3,
        set: (value: number) => {
          if (this.projectorLight) {
            this.projectorLight.angle = value;
          }
        },
      },

      "projector.shadowEnabled": {
        get: () => this.projectorLight?.castShadow ?? true,
        set: (value: boolean) => {
          if (this.projectorLight) {
            this.projectorLight.castShadow = value;
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

  public getProjectorLight(): THREE.SpotLight | null {
    return this.projectorLight;
  }

  public getRoomMeshes(): Map<string, THREE.Mesh> | null {
    return this.campusAsset?.roomMeshes || null;
  }

  public setLightIntensity(intensity: number): void {
    if (this.projectorLight) {
      this.projectorLight.intensity = intensity;
    }
  }

  public setLightColor(color: THREE.Color | number | string): void {
    if (this.projectorLight) {
      this.projectorLight.color.set(color);
    }
  }
}

export default ProjectorLightScene;
