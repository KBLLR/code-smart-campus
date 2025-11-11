/**
 * shared/scenes/geospatial/index.ts
 * GeospatialScene implementation
 *
 * Integrates campus 3D environment with geospatial features:
 * - Campus geometry (Floor, rooms, labels)
 * - Sun positioning and lighting
 * - Moon positioning and phases
 * - Atmospheric rendering (sky, aerial perspective)
 * - Dynamic time control
 *
 * NOTE: This scene is designed to be modular and decoupled from src/main.js
 * It may eventually replace or work alongside the existing scene.js setup.
 */

import * as THREE from "three";
import { SceneBase, type SceneConfig } from "../../engine";

/**
 * GeospatialScene Configuration Template
 * Defines default camera, lighting, UI controls, etc.
 */
const GEOSPATIAL_CONFIG: SceneConfig = {
  sceneKey: "geospatial",
  name: "Campus Geospatial",
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
      intensity: 0.25,
    },
  },
  uiControls: {
    modules: [
      {
        id: "sunSky",
        label: "Sun & Sky",
        controls: {
          arcOpacity: {
            type: "slider",
            min: 0,
            max: 1,
            step: 0.05,
            value: 1,
          },
        },
      },
      {
        id: "lighting",
        label: "Lighting / FX",
        controls: {
          bloomEnabled: {
            type: "bool",
            value: true,
          },
          bloomStrength: {
            type: "knob",
            min: 0,
            max: 2,
            step: 0.05,
            value: 0.5,
          },
          bloomRadius: {
            type: "knob",
            min: 0,
            max: 1.5,
            step: 0.05,
            value: 0.4,
          },
        },
      },
    ],
  },
  metadata: {
    description: "Main interactive campus 3D view with geospatial data",
    tags: ["production", "primary"],
    features: ["sun", "moon", "atmosphere", "dynamic-lighting"],
  },
};

/**
 * GeospatialScene
 *
 * A SceneBase implementation for campus 3D visualization with geospatial features.
 * Manages:
 * - Campus geometry loading
 * - Geospatial controller initialization (Sun, Moon, Atmosphere)
 * - Lifecycle management (init, activate, deactivate, dispose)
 * - UI panel registration and updates
 */
export class GeospatialScene extends SceneBase {
  // ============================================================================
  // Static Config
  // ============================================================================

  protected static readonly configTemplate: SceneConfig = GEOSPATIAL_CONFIG;

  // ============================================================================
  // Instance Properties
  // ============================================================================

  // Scene state
  private isBuilt: boolean = false;
  private campusGeometryGroup: THREE.Group | null = null;

  // Geospatial components (lazy-loaded from src/lib)
  private geospatialManager: any = null;
  private sunController: any = null;
  private moonController: any = null;
  private atmosphereRenderer: any = null;

  // UI state
  private uiBindings: Map<string, { get: () => any; set: (v: any) => void }> = new Map();

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor() {
    super();
    this.sceneKey = "geospatial";
    this.config = GEOSPATIAL_CONFIG;
  }

  // ============================================================================
  // SceneBase Lifecycle Implementation
  // ============================================================================

  /**
   * Build scene: Load campus geometry and initialize geospatial components
   * This is called during init() after camera and lights are set up.
   */
  protected async build(): Promise<void> {
    console.log("[GeospatialScene] Building campus environment...");

    try {
      // Step 1: Load campus geometry (Floor, rooms, etc.)
      await this.loadCampusGeometry();

      // Step 2: Initialize geospatial components (Sun, Moon, Atmosphere)
      await this.initializeGeospatialComponents();

      // Step 3: Setup scene-specific materials and effects
      this.setupSceneAppearance();

      this.isBuilt = true;
      console.log("[GeospatialScene] Build complete");
    } catch (e) {
      console.error("[GeospatialScene] Build failed:", e);
      throw e;
    }
  }

  protected onActivate(): void {
    console.log("[GeospatialScene] Activated");
    // Ensure geospatial updates are enabled
    this.resumeGeospatialUpdates();
  }

  protected onDeactivate(): void {
    console.log("[GeospatialScene] Deactivated");
    // Pause geospatial updates
    this.pauseGeospatialUpdates();
  }

  protected async onDispose(): Promise<void> {
    console.log("[GeospatialScene] Disposing...");

    // Dispose geospatial components
    if (this.geospatialManager) {
      this.geospatialManager = null;
    }

    // Cleanup campus geometry
    if (this.campusGeometryGroup) {
      this.group.remove(this.campusGeometryGroup);
      this.traverseAndDispose(this.campusGeometryGroup);
      this.campusGeometryGroup = null;
    }

    // Clear UI bindings
    this.uiBindings.clear();

    this.isBuilt = false;
  }

  protected onUpdate(deltaTime: number): void {
    if (!this.isBuilt) return;

    // Update geospatial systems per frame
    if (this.geospatialManager?.update) {
      this.geospatialManager.update();
    }

    // Optional: Update sun/moon/atmosphere individually if needed
    // this.sunController?.update();
    // this.moonController?.update();
    // this.atmosphereRenderer?.update();
  }

  protected onResize(width: number, height: number): void {
    // Handle camera aspect ratio (done in SceneBase.onWindowResize)
    // Additional resize logic can go here if needed
  }

  // ============================================================================
  // Private Methods: Building the Scene
  // ============================================================================

  /**
   * Load campus geometry (Floor, rooms, etc.)
   * This would typically load from src/three/FloorGeometry.js and roomRegistry
   */
  private async loadCampusGeometry(): Promise<void> {
    console.log("[GeospatialScene] Loading campus geometry...");

    // Create campus geometry group
    this.campusGeometryGroup = new THREE.Group();
    this.campusGeometryGroup.name = "CampusGeometry";

    // TODO: Load actual campus geometry
    // For now, add a placeholder grid + axes
    const gridHelper = new THREE.GridHelper(1000, 100);
    gridHelper.position.y = 0;
    this.campusGeometryGroup.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(100);
    this.campusGeometryGroup.add(axesHelper);

    // NOTE: In production, load from:
    // - import { Floor } from "@three/FloorGeometry.js"
    // - import { roomRegistry } from "@registries/roomRegistry.js"
    // - Floor geometry setup and room mesh creation
    // - Label setup via LabelManager

    this.group.add(this.campusGeometryGroup);
    console.log("[GeospatialScene] Campus geometry loaded");
  }

  /**
   * Initialize geospatial components (Sun, Moon, Atmosphere)
   * These are loaded dynamically from src/lib
   */
  private async initializeGeospatialComponents(): Promise<void> {
    console.log("[GeospatialScene] Initializing geospatial components...");

    // TODO: Import and initialize GeospatialManager from src/lib/GeospatialManager.js
    // For now, this is a placeholder. In production:
    //
    // const { GeospatialManager } = await import("@lib/GeospatialManager.js");
    // this.geospatialManager = new GeospatialManager(this.group, {
    //   sunEnabled: true,
    //   moonEnabled: true,
    //   atmosphereEnabled: true,
    //   cloudsEnabled: false,
    // });
    // this.geospatialManager.update();

    console.log("[GeospatialScene] Geospatial components initialized");
  }

  /**
   * Setup scene appearance (fog, background, effects, etc.)
   */
  private setupSceneAppearance(): void {
    // Create a Three.js Scene for container purposes
    // (The actual rendering happens through the factory's group)
    const tempScene = new THREE.Scene();
    tempScene.fog = new THREE.FogExp2(new THREE.Color("#13243d"), 0.0009);
    tempScene.background = new THREE.Color("#0f1419");

    // Copy settings to our group (or apply globally)
    // This is a simplified approach; in production, you might wrap more carefully
    console.log("[GeospatialScene] Scene appearance configured");
  }

  /**
   * Resume geospatial updates (when scene is activated)
   */
  private resumeGeospatialUpdates(): void {
    if (this.geospatialManager) {
      this.geospatialManager.update?.();
    }
  }

  /**
   * Pause geospatial updates (when scene is deactivated)
   */
  private pauseGeospatialUpdates(): void {
    // Optionally pause animations, stop loops, etc.
  }

  /**
   * Recursively traverse and dispose of Three.js resources
   */
  private traverseAndDispose(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m: THREE.Material) => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });
  }

  // ============================================================================
  // UI Control Bindings (for Tweakpane/UIL integration)
  // ============================================================================

  /**
   * Get UI bindings for this scene
   * These are dynamically wired to the UIL controller when scene activates
   */
  protected getUIBindings(): Record<string, { get: () => any; set: (v: any) => void }> {
    const bindings: Record<string, { get: () => any; set: (v: any) => void }> = {
      // Sun & Sky controls
      "sunSky.arcOpacity": {
        get: () => {
          // Return current arc opacity from atmosphere renderer
          return this.atmosphereRenderer?.config?.arcOpacity ?? 1;
        },
        set: (value: number) => {
          if (this.atmosphereRenderer) {
            this.atmosphereRenderer.config.arcOpacity = value;
          }
        },
      },

      // Lighting / FX controls
      "lighting.bloomEnabled": {
        get: () => {
          // Return bloom enabled state (would tie to postFX)
          return true;
        },
        set: (value: boolean) => {
          // Enable/disable bloom in post-processing
          console.log(`[GeospatialScene] Bloom enabled: ${value}`);
        },
      },

      "lighting.bloomStrength": {
        get: () => {
          // Return current bloom strength
          return 0.5;
        },
        set: (value: number) => {
          // Update bloom strength in post-processing
          console.log(`[GeospatialScene] Bloom strength: ${value}`);
        },
      },

      "lighting.bloomRadius": {
        get: () => {
          // Return current bloom radius
          return 0.4;
        },
        set: (value: number) => {
          // Update bloom radius in post-processing
          console.log(`[GeospatialScene] Bloom radius: ${value}`);
        },
      },
    };

    return bindings;
  }

  // ============================================================================
  // Property Accessors
  // ============================================================================

  /**
   * Get geospatial manager for external access
   * (useful for other systems that need sun position, etc.)
   */
  public getGeospatialManager(): any {
    return this.geospatialManager;
  }

  /**
   * Get sun controller
   */
  public getSunController(): any {
    return this.sunController;
  }

  /**
   * Get moon controller
   */
  public getMoonController(): any {
    return this.moonController;
  }

  /**
   * Get atmosphere renderer
   */
  public getAtmosphereRenderer(): any {
    return this.atmosphereRenderer;
  }
}

export default GeospatialScene;
