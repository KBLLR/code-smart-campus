/**
 * shared/scenes/backdrop/index.ts
 * BackdropScene implementation - minimal sky/environment view
 */

import * as THREE from "three";
import { SceneBase, type SceneConfig } from "../../engine";

export class BackdropScene extends SceneBase {
  protected static readonly configTemplate: SceneConfig = {
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
    metadata: {
      description: "Minimal backdrop/skybox view",
      tags: ["secondary"],
    },
  };

  private skydome: THREE.Mesh | null = null;

  constructor() {
    super();
    this.sceneKey = "backdrop";
    this.config = BackdropScene.configTemplate;
  }

  protected async build(): Promise<void> {
    console.log("[BackdropScene] Building scene...");

    // TODO: Load sky dome or backdrop geometry
    // - Create/load spherical geometry
    // - Apply sky material (shader or texture)

    // Placeholder: Simple sphere
    const geometry = new THREE.SphereGeometry(5000, 64, 64);
    const material = new THREE.MeshBasicMaterial({
      color: 0x4488cc,
      side: THREE.BackSide,
    });
    this.skydome = new THREE.Mesh(geometry, material);
    this.group.add(this.skydome);

    console.log("[BackdropScene] Build complete");
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
      this.skydome.geometry.dispose();
      (this.skydome.material as THREE.Material).dispose();
      this.skydome = null;
    }
  }

  protected onUpdate(deltaTime: number): void {
    // Optional: Rotate skydome or other animations
  }

  protected onResize(width: number, height: number): void {
    // Handle window resize
  }
}

export default BackdropScene;
