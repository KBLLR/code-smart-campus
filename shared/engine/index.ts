/**
 * shared/engine/index.ts
 * Main exports for scene factory engine
 */

export { SceneFactory, type ISceneFactory } from "./SceneFactory";
export { SceneBase, type ISceneBase } from "./SceneBase";
export { AssetManager, type IAssetManager } from "./AssetManager";
export { SharedResources, type ISharedResources } from "./SharedResources";
export type { SceneConfig, CameraConfig, LightConfig, EnvironmentConfig } from "./SceneConfig";
export { defaultSceneConfig } from "./SceneConfig";
