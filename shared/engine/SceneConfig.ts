/**
 * SceneConfig.ts
 * Configuration schema for scenes
 */

import * as THREE from "three";

export interface CameraConfig {
  type: "perspective" | "orthographic";
  fov?: number;
  near: number;
  far: number;
  position: [number, number, number];
  lookAt: [number, number, number];
  up?: [number, number, number];
}

export interface LightConfig {
  ambient?: {
    color: number | string;
    intensity: number;
  };
  directional?: Array<{
    color: number | string;
    intensity: number;
    position: [number, number, number];
    castShadow?: boolean;
    shadowMapSize?: number;
  }>;
}

export interface EnvironmentConfig {
  mapAsset: string;
  intensity: number;
}

export interface UIControlModule {
  id: string;
  label: string;
  controls: Record<string, any>;
}

export interface UIControlsConfig {
  modules: UIControlModule[];
}

export interface PostProcessingEffect {
  type: string;
  config: Record<string, any>;
}

export interface PostProcessingConfig {
  enabled: boolean;
  effects: PostProcessingEffect[];
}

export interface SceneConfig {
  sceneKey: string;
  name: string;
  camera: CameraConfig;
  environment?: EnvironmentConfig;
  lights?: LightConfig;
  uiControls?: UIControlsConfig;
  postProcessing?: PostProcessingConfig;
  metadata?: Record<string, any>;
}

/**
 * Default config template for scenes
 */
export const defaultSceneConfig: Partial<SceneConfig> = {
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
};
