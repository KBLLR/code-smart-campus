/**
 * shared/scenes/projectorLight/index.ts
 * ProjectorLightScene implementation
 *
 * Specialized scene for projector light visualization and testing.
 * Useful for:
 * - Testing spotlight/projector effects
 * - Light mapping and shadow preview
 * - Performance profiling of dynamic lights
 * - Ambient/directional light studies
 *
 * Features:
 * - Configurable spotlight(s)
 * - Real-time light intensity/color adjustment
 * - Light cone visualization
 * - Dynamic shadow mapping
 */

import * as THREE from "three";
import { SceneBase, type SceneConfig } from "../../engine";

/**
 * ProjectorLightScene Configuration Template
 */
const PROJECTOR_LIGHT_CONFIG: SceneConfig = {
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
      intensity: 0.5,
    },
  },
  uiControls: {
    modules: [
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
            value: 100,
          },
          lightAngle: {
            type: "slider",
            min: 0,
            max: Math.PI / 2,
            step: 0.01,
            value: Math.PI / 4,
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
    description: "Projector light visualization and testing scene",
    tags: ["specialized", "testing", "lighting-focused"],
    features: ["spotlight", "shadows", "light-mapping", "dynamic-lighting"],
  },
};

/**
 * ProjectorLightScene
 *
 * A specialized scene for projector/spotlight visualization and testing.
 * Provides controls for real-time light parameter adjustment.
 */
export class ProjectorLightScene extends SceneBase {
  protected static readonly configTemplate: SceneConfig = PROJECTOR_LIGHT_CONFIG;

  // Instance properties
  private projectorLight: THREE.SpotLight | null = null;
  private projectorGeometry: THREE.Group | null = null;
  private targetGeometry: THREE.Mesh | null = null;
  private lightConeHelper: THREE.SpotLightHelper | null = null;

  constructor() {
    super();
    this.sceneKey = "projectorLight";
    this.config = PROJECTOR_LIGHT_CONFIG;
  }

  protected async build(): Promise<void> {
    console.log("[ProjectorLightScene] Building scene...");

    try {
      // Create target geometry (what the light illuminates)
      this.createTargetGeometry();

      // Create projector light and visualization
      this.createProjectorLight();

      // Setup helper geometry
      this.createLightConeHelper();

      console.log("[ProjectorLightScene] Build complete");
    } catch (e) {
      console.error("[ProjectorLightScene] Build failed:", e);
      throw e;
    }
  }

  protected onActivate(): void {
    console.log("[ProjectorLightScene] Activated");
    // Ensure light is enabled
    if (this.projectorLight) {
      this.projectorLight.visible = true;
    }
  }

  protected onDeactivate(): void {
    console.log("[ProjectorLightScene] Deactivated");
  }

  protected async onDispose(): Promise<void> {
    console.log("[ProjectorLightScene] Disposing...");

    // Remove light cone helper
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

    // Remove target geometry
    if (this.targetGeometry) {
      this.group.remove(this.targetGeometry);
      this.targetGeometry.geometry.dispose();
      (this.targetGeometry.material as THREE.Material).dispose();
      this.targetGeometry = null;
    }

    // Remove projector geometry
    if (this.projectorGeometry) {
      this.group.remove(this.projectorGeometry);
      this.projectorGeometry.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
      this.projectorGeometry = null;
    }
  }

  protected onUpdate(deltaTime: number): void {
    // Optional: Subtle animation
    if (this.lightConeHelper && this.projectorLight) {
      this.lightConeHelper.update();
    }
  }

  protected onResize(width: number, height: number): void {
    // Minimal resize handling
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Create target geometry (ground/surfaces for the light to illuminate)
   */
  private createTargetGeometry(): void {
    this.projectorGeometry = new THREE.Group();
    this.projectorGeometry.name = "ProjectorGeometry";

    // Floor plane
    const floorGeometry = new THREE.PlaneGeometry(200, 200);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.projectorGeometry.add(floor);

    // Some objects to show shadows
    const boxGeometry = new THREE.BoxGeometry(20, 20, 20);
    const boxMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6b6b,
      roughness: 0.4,
    });

    for (let i = 0; i < 3; i++) {
      const box = new THREE.Mesh(boxGeometry, boxMaterial);
      box.position.set(-50 + i * 60, 10, 0);
      box.castShadow = true;
      box.receiveShadow = true;
      this.projectorGeometry.add(box);
    }

    this.group.add(this.projectorGeometry);
    console.log("[ProjectorLightScene] Target geometry created");
  }

  /**
   * Create the projector spotlight
   */
  private createProjectorLight(): void {
    // Spotlight
    this.projectorLight = new THREE.SpotLight(0xffffff, 100);
    this.projectorLight.position.set(0, 80, 50);
    this.projectorLight.target.position.set(0, 0, 0);
    this.projectorLight.angle = Math.PI / 4;
    this.projectorLight.penumbra = 0.1;
    this.projectorLight.castShadow = true;
    this.projectorLight.shadow.mapSize.width = 2048;
    this.projectorLight.shadow.mapSize.height = 2048;
    this.projectorLight.shadow.camera.near = 0.5;
    this.projectorLight.shadow.camera.far = 500;

    this.group.add(this.projectorLight);
    this.group.add(this.projectorLight.target);

    // Visual representation of projector body
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

    console.log("[ProjectorLightScene] Projector light created");
  }

  /**
   * Create helper to visualize light cone
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
        get: () => this.projectorLight?.intensity ?? 100,
        set: (value: number) => {
          if (this.projectorLight) {
            this.projectorLight.intensity = value;
          }
        },
      },

      "projector.lightAngle": {
        get: () => this.projectorLight?.angle ?? Math.PI / 4,
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
  // Getters
  // ============================================================================

  public getProjectorLight(): THREE.SpotLight | null {
    return this.projectorLight;
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
