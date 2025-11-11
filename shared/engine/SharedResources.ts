/**
 * SharedResources.ts
 * Singleton holder for resources shared across all scenes
 */

import * as THREE from "three";
import { WebGPURenderer } from "three/examples/jsm/renderers/webgpu/WebGPURenderer";

export interface ISharedResources {
  renderer: WebGPURenderer | THREE.WebGLRenderer;
  assetManager: any; // Will be AssetManager type
  canvas: HTMLCanvasElement;
}

export class SharedResources implements ISharedResources {
  renderer: WebGPURenderer | THREE.WebGLRenderer;
  assetManager: any;
  canvas: HTMLCanvasElement;

  constructor(
    renderer: WebGPURenderer | THREE.WebGLRenderer,
    assetManager: any,
    canvas: HTMLCanvasElement
  ) {
    this.renderer = renderer;
    this.assetManager = assetManager;
    this.canvas = canvas;
  }
}
