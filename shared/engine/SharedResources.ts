/**
 * SharedResources.ts
 * Singleton holder for resources shared across all scenes
 */

import * as THREE from "three";

// Generic renderer type - accepts WebGLRenderer or WebGPURenderer at runtime
type Renderer = THREE.WebGLRenderer | (any & { isWebGPURenderer?: boolean });

export interface ISharedResources {
  renderer: Renderer;
  assetManager: any; // Will be AssetManager type
  canvas: HTMLCanvasElement;
}

export class SharedResources implements ISharedResources {
  renderer: Renderer;
  assetManager: any;
  canvas: HTMLCanvasElement;

  constructor(
    renderer: Renderer,
    assetManager: any,
    canvas: HTMLCanvasElement
  ) {
    this.renderer = renderer;
    this.assetManager = assetManager;
    this.canvas = canvas;
  }
}
