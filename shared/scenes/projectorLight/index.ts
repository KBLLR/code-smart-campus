/**
 * shared/scenes/projectorLight/index.ts
 * ProjectorLightScene implementation - projector light visualization
 */

import * as THREE from "three";
import { SceneBase, type SceneConfig } from "../../engine";

export class ProjectorLightScene extends SceneBase {
  protected static readonly configTemplate: SceneConfig = {
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
    metadata: {
      description: "Projector light visualization",
      tags: ["specialized"],
    },
  };

  private projectorLight: THREE.Light | null = null;
  private projectorGeometry: THREE.Group | null = null;

  constructor() {
    super();
    this.sceneKey = "projectorLight";
    this.config = ProjectorLightScene.configTemplate;
  }

  protected async build(): Promise<void> {
    console.log("[ProjectorLightScene] Building scene...");

    // TODO: Setup projector light visualization
    // - Load or create projector geometry
    // - Setup light cone/beam rendering
    // - Configure light maps or shadow maps

    // Placeholder: Simple box representing projector
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const projectorBox = new THREE.Mesh(boxGeometry, material);
    projectorBox.position.y = 10;
    this.group.add(projectorBox);

    // Add a spotlight
    this.projectorLight = new THREE.SpotLight(0xffffff, 100);
    this.projectorLight.position.set(0, 10, 0);
    this.projectorLight.target.position.set(0, 0, 0);
    this.group.add(this.projectorLight);
    this.group.add(this.projectorLight.target);

    console.log("[ProjectorLightScene] Build complete");
  }

  protected onActivate(): void {
    console.log("[ProjectorLightScene] Activated");
  }

  protected onDeactivate(): void {
    console.log("[ProjectorLightScene] Deactivated");
  }

  protected async onDispose(): Promise<void> {
    console.log("[ProjectorLightScene] Disposing...");

    if (this.projectorLight) {
      this.group.remove(this.projectorLight);
      this.projectorLight = null;
    }

    if (this.projectorGeometry) {
      this.group.remove(this.projectorGeometry);
      this.projectorGeometry = null;
    }
  }

  protected onUpdate(deltaTime: number): void {
    // Optional: Rotate projector or animate light
    if (this.projectorLight) {
      this.projectorLight.intensity = 100 + 50 * Math.sin(Date.now() * 0.001);
    }
  }

  protected onResize(width: number, height: number): void {
    // Handle window resize
  }
}

export default ProjectorLightScene;
