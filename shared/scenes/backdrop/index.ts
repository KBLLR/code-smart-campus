/**
 * shared/scenes/backdrop/index.ts
 * BackdropScene implementation
 *
 * Minimal sky/environment view with no campus geometry.
 * Useful for:
 * - Atmospheric/sky visualization only
 * - Performance-optimized preview
 * - Immersive environment showcase
 *
 * Features:
 * - Procedural or textured sky dome
 * - Optional atmospheric scattering
 * - Responsive to sun position
 */

import * as THREE from "three";
import { SceneBase, type SceneConfig } from "../../engine";

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
    position: [0, 0, 0],
    lookAt: [0, 0, 1],
    up: [0, 1, 0],
  },
  lights: {
    ambient: {
      color: 0xffffff,
      intensity: 1.0,
    },
  },
  uiControls: {
    modules: [
      {
        id: "backdrop",
        label: "Backdrop",
        controls: {
          skyColor: {
            type: "color",
            value: "#4488cc",
          },
          rotation: {
            type: "slider",
            min: 0,
            max: Math.PI * 2,
            step: 0.01,
            value: 0,
          },
        },
      },
    ],
  },
  metadata: {
    description: "Minimal sky/environment backdrop view without campus geometry",
    tags: ["secondary", "lightweight", "sky-only"],
    features: ["skydome", "atmospheric-responsive"],
  },
};

/**
 * BackdropScene
 *
 * A lightweight scene focusing on sky/atmosphere visualization.
 * No campus geometry, minimal complexity.
 */
export class BackdropScene extends SceneBase {
  protected static readonly configTemplate: SceneConfig = BACKDROP_CONFIG;

  // Instance properties
  private skydome: THREE.Mesh | null = null;
  private skydomeMaterial: THREE.Material | null = null;
  private rotation: number = 0;

  constructor() {
    super();
    this.sceneKey = "backdrop";
    this.config = BACKDROP_CONFIG;
  }

  protected async build(): Promise<void> {
    console.log("[BackdropScene] Building scene...");

    try {
      // Create sky dome
      this.createSkydome();

      // Setup scene appearance
      this.setupSceneAppearance();

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

    if (this.skydome) {
      this.group.remove(this.skydome);
      this.skydome.geometry.dispose();
      this.skydomeMaterial?.dispose();
      this.skydome = null;
      this.skydomeMaterial = null;
    }
  }

  protected onUpdate(deltaTime: number): void {
    // Optionally rotate sky dome
    if (this.skydome) {
      this.skydome.rotation.y += 0.0001;
    }
  }

  protected onResize(width: number, height: number): void {
    // Scene is sky-only, minimal resize handling needed
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Create the sky dome mesh
   */
  private createSkydome(): void {
    // Large sphere to contain the view
    const geometry = new THREE.SphereGeometry(5000, 64, 64);

    // Simple material for now
    // TODO: Can be upgraded to use:
    // - Shader material for procedural sky
    // - Texture-based sky
    // - AtmosphereRenderer sky if available
    const material = new THREE.MeshBasicMaterial({
      color: 0x4488cc,
      side: THREE.BackSide, // Render inside the sphere
    });

    this.skydome = new THREE.Mesh(geometry, material);
    this.skydomeMaterial = material;
    this.group.add(this.skydome);

    console.log("[BackdropScene] Skydome created");
  }

  /**
   * Setup scene appearance
   */
  private setupSceneAppearance(): void {
    // No fog for sky-only view
    // Minimal setup needed
    console.log("[BackdropScene] Scene appearance configured");
  }

  // ============================================================================
  // UI Control Bindings
  // ============================================================================

  protected getUIBindings(): Record<string, { get: () => any; set: (v: any) => void }> {
    return {
      "backdrop.skyColor": {
        get: () => {
          if (this.skydomeMaterial instanceof THREE.MeshBasicMaterial) {
            return "#" + this.skydomeMaterial.color.getHexString();
          }
          return "#4488cc";
        },
        set: (value: string) => {
          if (this.skydomeMaterial instanceof THREE.MeshBasicMaterial) {
            this.skydomeMaterial.color.setStyle(value);
          }
        },
      },

      "backdrop.rotation": {
        get: () => this.rotation,
        set: (value: number) => {
          this.rotation = value;
          if (this.skydome) {
            this.skydome.rotation.y = value;
          }
        },
      },
    };
  }

  // ============================================================================
  // Getters
  // ============================================================================

  public getSkydome(): THREE.Mesh | null {
    return this.skydome;
  }

  public getSkydomeColor(): THREE.Color {
    if (this.skydomeMaterial instanceof THREE.MeshBasicMaterial) {
      return this.skydomeMaterial.color;
    }
    return new THREE.Color(0x4488cc);
  }

  public setSkydomeColor(color: THREE.Color | number | string): void {
    if (this.skydomeMaterial instanceof THREE.MeshBasicMaterial) {
      this.skydomeMaterial.color.set(color);
    }
  }
}

export default BackdropScene;
