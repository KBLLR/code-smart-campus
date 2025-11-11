/**
 * shared/index.ts
 * Main exports for Scene Factory module
 */

// Engine exports
export {
  SceneFactory,
  SceneBase,
  AssetManager,
  SharedResources,
  type ISceneFactory,
  type ISceneBase,
  type IAssetManager,
  type ISharedResources,
  type SceneConfig,
  type CameraConfig,
  type LightConfig,
  type EnvironmentConfig,
  defaultSceneConfig,
} from "./engine";

// Scene implementations
export { GeospatialScene } from "./scenes/geospatial";
export { BackdropScene } from "./scenes/backdrop";
export { ProjectorLightScene } from "./scenes/projectorLight";

// UI panels
export { SceneSwitcherPanel, SceneConfigPanel, type SceneSwitcherConfig, type SceneConfigPanelConfig } from "./ui";
