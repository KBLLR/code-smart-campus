/**
 * shared/scenes/geospatial/index.ts
 * GeospatialScene implementation
 */

import * as THREE from "three";
import { SceneBase, type SceneConfig } from "../../engine";
import { defaultSceneConfig } from "../../engine/SceneConfig";

export class GeospatialScene extends SceneBase {
  // Static config template
  protected static readonly configTemplate: SceneConfig = {
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
    environment: {
      mapAsset: "hdr_campus_env",
      intensity: 1.0,
    },
    lights: {
      ambient: {
        color: 0xffffff,
        intensity: 0.25,
      },
      directional: [
        {
          color: 0xffe39a,
          intensity: 1.1,
          position: [1000, 1000, 500],
          castShadow: true,
          shadowMapSize: 4096,
        },
      ],
    },
    uiControls: {
      modules: [
        {
          id: "sunSky",
          label: "Sun & Sky",
          controls: {},
        },
        {
          id: "lighting",
          label: "Lighting / FX",
          controls: {},
        },
      ],
    },
    metadata: {
      description: "Main interactive campus 3D view with geospatial data",
      tags: ["production", "primary"],
    },
  };

  // Scene-specific properties
  private sunController: any = null; // Will be SunController instance
  private moonController: any = null; // Will be MoonController instance
  private atmosphereRenderer: any = null; // Will be AtmosphereRenderer instance
  private campusGeometry: THREE.Group | null = null;

  constructor() {
    super();
    this.sceneKey = "geospatial";
    this.config = GeospatialScene.configTemplate;
  }

  // ============================================================================
  // SceneBase implementation
  // ============================================================================

  protected async build(): Promise<void> {
    console.log("[GeospatialScene] Building scene...");

    // TODO: Initialize geospatial components
    // - Load campus geometry from roomRegistry
    // - Instantiate SunController
    // - Instantiate AtmosphereRenderer
    // - Instantiate MoonController
    // - Integrate with existing src/lib/* modules

    // Placeholder: Add a simple grid for now
    const gridHelper = new THREE.GridHelper(1000, 100);
    this.group.add(gridHelper);

    // Placeholder: Add axes helper
    const axesHelper = new THREE.AxesHelper(100);
    this.group.add(axesHelper);

    console.log("[GeospatialScene] Build complete");
  }

  protected onActivate(): void {
    console.log("[GeospatialScene] Activated");
    // Start animation loops, resume geospatial updates
  }

  protected onDeactivate(): void {
    console.log("[GeospatialScene] Deactivated");
    // Pause animation loops
  }

  protected async onDispose(): Promise<void> {
    console.log("[GeospatialScene] Disposing...");

    // Dispose scene-specific components
    // - sunController?.dispose()
    // - moonController?.dispose()
    // - atmosphereRenderer?.dispose()
    // - campusGeometry cleanup

    this.sunController = null;
    this.moonController = null;
    this.atmosphereRenderer = null;
    this.campusGeometry = null;
  }

  protected onUpdate(deltaTime: number): void {
    // Update geospatial components per frame
    // - sunController.update(time)
    // - moonController.update(time)
    // - atmosphereRenderer.update(sunPosition)
  }

  protected onResize(width: number, height: number): void {
    // Handle window resize
  }

  // ============================================================================
  // Getters
  // ============================================================================

  get group(): THREE.Group {
    return this.group;
  }

  get sceneKey(): string {
    return this.sceneKey;
  }

  get config(): SceneConfig {
    return this.config;
  }

  get isActive(): boolean {
    return this.isActive;
  }

  get isInitialized(): boolean {
    return this.isInitialized;
  }
}

export default GeospatialScene;
