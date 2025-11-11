# Scene Factory API Specification

**Status:** DRAFT (T-01)
**Date:** 2025-11-11
**Scope:** Define precise API signatures, lifecycle contracts, and memory strategy for multi-scene WebGPU architecture.

---

## Table of Contents

1. [Overview](#overview)
2. [Core Types & Interfaces](#core-types--interfaces)
3. [SceneFactory API](#scenefactory-api)
4. [SceneBase API](#scenebase-api)
5. [AssetManager API](#assetmanager-api)
6. [SceneConfig Format](#sceneconfig-format)
7. [Lifecycle Flows](#lifecycle-flows)
8. [Memory Management Strategy](#memory-management-strategy)
9. [UI Integration](#ui-integration)
10. [WebGPU-Specific Notes](#webgpu-specific-notes)

---

## Overview

### Core Principle
- **One shared WebGPURenderer** across all scenes.
- **One AssetManager** for reference-counted shared resources.
- **Multiple SceneBase implementations** (GeospatialScene, BackdropScene, ProjectorLightScene).
- **Dynamic scene switching** with zero dangling GPU resources.

### Architecture Diagram

```
┌─────────────────────────────────────┐
│   SceneFactory (singleton)          │
│  - activeScene: SceneBase           │
│  - renderer: WebGPURenderer        │
│  - assetManager: AssetManager       │
│  - scenes: Map<id, SceneBase>       │
└─────────────────────────────────────┘
         │
         ├─── SharedResources
         │    ├─ AssetManager (texture/geometry/model cache)
         │    └─ reference counting
         │
         └─── SceneBase (abstract)
              ├─ GeospatialScene
              ├─ BackdropScene
              └─ ProjectorLightScene

Each Scene has:
├─ config: SceneConfig
├─ lifecycle hooks: init, activate, deactivate, dispose
├─ own Three.js.Group/Object3D
└─ UI control module (optional)
```

---

## Core Types & Interfaces

### TypeScript Type Definitions

```typescript
// ============================================================================
// SCENE FACTORY TYPES
// ============================================================================

export interface ISceneFactory {
  /**
   * Register a scene class with a unique key.
   * @param sceneKey - Unique identifier (e.g. "geospatial", "backdrop")
   * @param SceneClass - Class implementing SceneBase
   */
  register(sceneKey: string, SceneClass: typeof SceneBase): void;

  /**
   * Activate a registered scene by key.
   * - Deactivates current scene (if any)
   * - Calls dispose() on previous scene
   * - Initializes and activates new scene
   * - Mounts UI controls for new scene
   * @param sceneKey - Key of scene to activate
   * @throws Error if scene not registered
   */
  activate(sceneKey: string): Promise<void>;

  /**
   * Get the currently active scene instance
   */
  getActive(): SceneBase | null;

  /**
   * Get a registered scene instance by key (does not activate)
   */
  getScene(sceneKey: string): SceneBase | null;

  /**
   * List all registered scene keys
   */
  listScenes(): string[];

  /**
   * Shut down factory: dispose all scenes, renderer, assets
   */
  dispose(): Promise<void>;

  /**
   * Get the shared WebGPURenderer (read-only reference)
   */
  readonly renderer: WebGPURenderer;

  /**
   * Get the shared AssetManager (read-only reference)
   */
  readonly assetManager: AssetManager;
}

// ============================================================================
// SCENE BASE TYPES
// ============================================================================

export interface ISceneBase {
  /**
   * Unique identifier for this scene instance
   */
  readonly sceneKey: string;

  /**
   * Configuration object (immutable after init)
   */
  readonly config: SceneConfig;

  /**
   * Three.js Group containing all scene objects
   */
  readonly group: THREE.Group;

  /**
   * Whether this scene is currently active
   */
  readonly isActive: boolean;

  /**
   * Initialize scene with factory resources.
   * Called once when scene is first activated.
   * - Load shared assets via assetManager
   * - Build scene graph under this.group
   * - Register UI controls
   * @param renderer - The shared WebGPURenderer
   * @param assetManager - The shared AssetManager
   */
  init(renderer: WebGPURenderer, assetManager: AssetManager): Promise<void>;

  /**
   * Activate scene: make visible, enable updates.
   * Called after init() or when switching back to this scene.
   * - Show/unhide scene objects
   * - Start animation loops
   * - Bind UI event handlers
   */
  activate(): void;

  /**
   * Deactivate scene: pause updates, hide.
   * Called when switching to a different scene.
   * - Hide/pause scene objects
   * - Stop animation loops
   * - Unbind UI event handlers
   * - DO NOT dispose resources
   */
  deactivate(): void;

  /**
   * Dispose all non-shared resources.
   * Called when scene is removed or factory shuts down.
   * - Dispose own Materials, Textures, RenderTargets
   * - Call assetManager.release() for shared assets
   * - Clear scene graph
   * - Unregister UI controls permanently
   */
  dispose(): Promise<void>;

  /**
   * Optional: Update hook called every frame if scene is active
   * @param deltaTime - Elapsed time in seconds
   */
  update?(deltaTime: number): void;

  /**
   * Optional: Handle window resize
   */
  onWindowResize?(width: number, height: number): void;
}

// ============================================================================
// SCENE CONFIG TYPES
// ============================================================================

export interface SceneConfig {
  /**
   * Unique key for this scene
   */
  sceneKey: string;

  /**
   * Display name in UI
   */
  name: string;

  /**
   * Camera configuration
   */
  camera: {
    type: "perspective" | "orthographic";
    fov?: number; // for perspective
    near: number;
    far: number;
    position: [number, number, number];
    lookAt: [number, number, number];
    up?: [number, number, number];
  };

  /**
   * Environment map (optional)
   */
  environment?: {
    mapAsset: string; // asset key in AssetManager
    intensity: number;
  };

  /**
   * Lights configuration
   */
  lights?: {
    ambient?: { color: number; intensity: number };
    directional?: Array<{
      color: number;
      intensity: number;
      position: [number, number, number];
      castShadow?: boolean;
      shadowMapSize?: number;
    }>;
  };

  /**
   * UI control schema for this scene
   */
  uiControls?: {
    modules: Array<{
      id: string;
      label: string;
      controls: Record<string, any>; // Tweakpane-compatible schema
    }>;
  };

  /**
   * Post-processing configuration (optional)
   */
  postProcessing?: {
    enabled: boolean;
    effects: Array<{ type: string; config: Record<string, any> }>;
  };

  /**
   * Scene-specific metadata
   */
  metadata?: Record<string, any>;
}

// ============================================================================
// ASSET MANAGER TYPES
// ============================================================================

export interface IAssetManager {
  /**
   * Load a texture by key. Cached and reference-counted.
   * @param key - Asset key (e.g. "floor_albedo")
   * @param url - URL to load from (only if not cached)
   * @returns Texture promise
   */
  getTexture(key: string, url?: string): Promise<THREE.Texture>;

  /**
   * Load geometry by key. Cached and reference-counted.
   */
  getGeometry(key: string, url?: string): Promise<THREE.BufferGeometry>;

  /**
   * Load a GLTF model by key. Cached and reference-counted.
   */
  getModel(key: string, url: string): Promise<THREE.Group>;

  /**
   * Release a reference to an asset.
   * Once refCount reaches 0, asset is disposed.
   * @param key - Asset key
   */
  release(key: string): void;

  /**
   * Pre-cache an asset without incrementing refCount.
   * Useful for guaranteed availability.
   */
  preload(key: string, url: string, type: "texture" | "geometry" | "model"): Promise<void>;

  /**
   * Get statistics: currently cached assets, memory usage, refCounts
   */
  getStats(): {
    cached: Array<{ key: string; type: string; refCount: number }>;
    memoryEstimate: number; // bytes
  };

  /**
   * Force-dispose an asset (use cautiously)
   */
  forceDispose(key: string): void;

  /**
   * Clear all unused assets (refCount === 0)
   */
  clearUnused(): void;

  /**
   * Shut down: dispose all assets
   */
  dispose(): void;
}

// ============================================================================
// SHARED RESOURCES
// ============================================================================

export interface SharedResources {
  renderer: WebGPURenderer;
  assetManager: AssetManager;
  canvas: HTMLCanvasElement;
}

```

---

## SceneFactory API

### Public Interface

```typescript
export class SceneFactory implements ISceneFactory {
  private static instance: SceneFactory;
  private activeScene: SceneBase | null = null;
  private scenes: Map<string, SceneBase> = new Map();
  private renderer: WebGPURenderer;
  private assetManager: AssetManager;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGPURenderer({ canvas });
    this.assetManager = new AssetManager();
  }

  static getInstance(canvas?: HTMLCanvasElement): SceneFactory {
    if (!SceneFactory.instance && canvas) {
      SceneFactory.instance = new SceneFactory(canvas);
    }
    return SceneFactory.instance;
  }

  register(sceneKey: string, SceneClass: typeof SceneBase): void {
    // Instantiate scene with empty config (will be set by subclass)
    const instance = new SceneClass();
    this.scenes.set(sceneKey, instance);
  }

  async activate(sceneKey: string): Promise<void> {
    const nextScene = this.scenes.get(sceneKey);
    if (!nextScene) {
      throw new Error(`Scene "${sceneKey}" not registered`);
    }

    // Deactivate current scene
    if (this.activeScene) {
      this.activeScene.deactivate();
      await this.activeScene.dispose();
    }

    // Initialize new scene (if not already done)
    if (!nextScene.isInitialized) {
      await nextScene.init(this.renderer, this.assetManager);
    }

    // Activate new scene
    nextScene.activate();
    this.activeScene = nextScene;

    // Emit event (for UI, logging, etc)
    this.onSceneActivated(sceneKey);
  }

  getActive(): SceneBase | null {
    return this.activeScene;
  }

  getScene(sceneKey: string): SceneBase | null {
    return this.scenes.get(sceneKey) || null;
  }

  listScenes(): string[] {
    return Array.from(this.scenes.keys());
  }

  async dispose(): Promise<void> {
    if (this.activeScene) {
      this.activeScene.deactivate();
      await this.activeScene.dispose();
    }
    for (const scene of this.scenes.values()) {
      await scene.dispose();
    }
    this.assetManager.dispose();
    this.renderer.dispose();
  }

  get renderer(): WebGPURenderer {
    return this._renderer;
  }

  get assetManager(): AssetManager {
    return this._assetManager;
  }

  // Private event hook (for UI integration)
  private onSceneActivated(sceneKey: string): void {
    document.dispatchEvent(
      new CustomEvent("scene-activated", { detail: { sceneKey } })
    );
  }
}
```

---

## SceneBase API

### Abstract Base Class

```typescript
export abstract class SceneBase implements ISceneBase {
  protected sceneKey: string = "";
  protected config: SceneConfig;
  protected group: THREE.Group = new THREE.Group();
  protected isActive: boolean = false;
  protected isInitialized: boolean = false;

  // Subclass implements this static property
  protected static readonly configTemplate: SceneConfig;

  // Protected access to factory resources
  protected renderer!: WebGPURenderer;
  protected assetManager!: AssetManager;

  constructor() {
    // Subclass must set this.config = { ...SceneBase.configTemplate }
  }

  async init(
    renderer: WebGPURenderer,
    assetManager: AssetManager
  ): Promise<void> {
    this.renderer = renderer;
    this.assetManager = assetManager;

    // Apply camera config
    this.setupCamera(this.config.camera);

    // Apply lights
    if (this.config.lights) {
      this.setupLights(this.config.lights);
    }

    // Load environment map (if specified)
    if (this.config.environment) {
      await this.setupEnvironment(this.config.environment);
    }

    // Subclass-specific initialization
    await this.build();

    // Register UI controls
    if (this.config.uiControls) {
      this.registerUIControls();
    }

    this.isInitialized = true;
  }

  activate(): void {
    this.group.visible = true;
    this.isActive = true;
    this.onActivate();
  }

  deactivate(): void {
    this.isActive = false;
    this.group.visible = false;
    this.onDeactivate();
  }

  async dispose(): Promise<void> {
    // Unregister UI
    this.unregisterUIControls();

    // Call subclass-specific disposal
    await this.onDispose();

    // Release shared assets
    if (this.config.environment?.mapAsset) {
      this.assetManager.release(this.config.environment.mapAsset);
    }

    // Dispose own scene graph
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });
    this.group.clear();
  }

  update(deltaTime: number): void {
    if (this.isActive) {
      this.onUpdate(deltaTime);
    }
  }

  onWindowResize(width: number, height: number): void {
    this.onResize(width, height);
  }

  // Protected hooks for subclasses
  protected abstract async build(): Promise<void>;
  protected abstract onActivate(): void;
  protected abstract onDeactivate(): void;
  protected abstract async onDispose(): Promise<void>;
  protected abstract onUpdate(deltaTime: number): void;
  protected abstract onResize(width: number, height: number): void;

  // Helper methods
  protected setupCamera(cameraConfig: SceneConfig["camera"]): void {
    // Implementation in SceneBase
  }

  protected setupLights(lightsConfig: SceneConfig["lights"]): void {
    // Implementation in SceneBase
  }

  protected async setupEnvironment(
    envConfig: SceneConfig["environment"]
  ): Promise<void> {
    // Implementation in SceneBase
  }

  protected registerUIControls(): void {
    // Implementation in SceneBase (integrates with UILController)
  }

  protected unregisterUIControls(): void {
    // Implementation in SceneBase
  }
}
```

---

## AssetManager API

### Caching & Reference Counting

```typescript
export class AssetManager implements IAssetManager {
  private cache: Map<string, AssetEntry> = new Map();
  private loader: {
    texture: THREE.TextureLoader;
    geometry: any; // Custom geometry loader
    gltf: any; // GLTFLoader
  };

  interface AssetEntry {
    asset: THREE.Texture | THREE.BufferGeometry | THREE.Group;
    refCount: number;
    type: "texture" | "geometry" | "model";
    url: string;
  }

  async getTexture(key: string, url?: string): Promise<THREE.Texture> {
    let entry = this.cache.get(key);

    if (!entry && url) {
      const texture = await this.loader.texture.loadAsync(url);
      entry = { asset: texture, refCount: 0, type: "texture", url };
      this.cache.set(key, entry);
    }

    if (entry) {
      entry.refCount++;
      return entry.asset as THREE.Texture;
    }

    throw new Error(`Texture "${key}" not found in cache`);
  }

  async getGeometry(
    key: string,
    url?: string
  ): Promise<THREE.BufferGeometry> {
    // Similar to getTexture
  }

  async getModel(key: string, url: string): Promise<THREE.Group> {
    // Similar to getTexture, but loads GLTF
  }

  release(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      entry.refCount--;
      if (entry.refCount === 0) {
        // Log for monitoring, but don't auto-dispose yet
        console.debug(`Asset "${key}" ref count = 0 (unused)`);
      }
    }
  }

  async preload(
    key: string,
    url: string,
    type: "texture" | "geometry" | "model"
  ): Promise<void> {
    if (!this.cache.has(key)) {
      if (type === "texture") await this.getTexture(key, url);
      else if (type === "geometry") await this.getGeometry(key, url);
      else if (type === "model") await this.getModel(key, url);
    }
  }

  getStats(): {
    cached: Array<{ key: string; type: string; refCount: number }>;
    memoryEstimate: number;
  } {
    const cached = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      type: entry.type,
      refCount: entry.refCount,
    }));
    const memoryEstimate = this.estimateMemory();
    return { cached, memoryEstimate };
  }

  forceDispose(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      (entry.asset as any).dispose?.();
      this.cache.delete(key);
    }
  }

  clearUnused(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.refCount === 0) {
        (entry.asset as any).dispose?.();
        this.cache.delete(key);
      }
    }
  }

  dispose(): void {
    for (const [, entry] of this.cache.entries()) {
      (entry.asset as any).dispose?.();
    }
    this.cache.clear();
  }

  private estimateMemory(): number {
    let total = 0;
    for (const entry of this.cache.values()) {
      // Rough estimates; tune based on actual asset types
      if (entry.type === "texture") {
        const tex = entry.asset as THREE.Texture;
        total += (tex.image?.width || 0) * (tex.image?.height || 0) * 4; // RGBA
      } else if (entry.type === "geometry") {
        const geo = entry.asset as THREE.BufferGeometry;
        // Sum all buffer sizes
        total += Object.values(geo.attributes).reduce(
          (sum, attr: any) => sum + attr.array.byteLength,
          0
        );
      }
      // Models are approximate
      if (entry.type === "model") total += 1024 * 1024; // 1MB placeholder
    }
    return total;
  }
}
```

---

## SceneConfig Format

### JSON Schema Example (for validation & documentation)

```json
{
  "sceneKey": "geospatial",
  "name": "Campus Geospatial",
  "camera": {
    "type": "perspective",
    "fov": 75,
    "near": 0.1,
    "far": 10000,
    "position": [0, 50, 100],
    "lookAt": [0, 0, 0],
    "up": [0, 1, 0]
  },
  "environment": {
    "mapAsset": "hdr_campus_env",
    "intensity": 1.0
  },
  "lights": {
    "ambient": {
      "color": "#ffffff",
      "intensity": 0.25
    },
    "directional": [
      {
        "color": "#ffe39a",
        "intensity": 1.1,
        "position": [1000, 1000, 500],
        "castShadow": true,
        "shadowMapSize": 4096
      }
    ]
  },
  "uiControls": {
    "modules": [
      {
        "id": "sunSky",
        "label": "Sun & Sky",
        "controls": {
          "arcOpacity": { "type": "slider", "min": 0, "max": 1, "step": 0.05 }
        }
      }
    ]
  },
  "postProcessing": {
    "enabled": true,
    "effects": [
      {
        "type": "bloom",
        "config": {
          "strength": 0.5,
          "radius": 0.4,
          "threshold": 0.0
        }
      }
    ]
  },
  "metadata": {
    "description": "Main interactive campus 3D view with geospatial data",
    "tags": ["production", "primary"]
  }
}
```

---

## Lifecycle Flows

### Initialization & Activation Flow

```
User calls: sceneFactory.activate("geospatial")

1. SceneFactory.activate("geospatial")
   ├─ Fetch scene instance from registry
   ├─ If activeScene exists:
   │  ├─ activeScene.deactivate() → hide, pause updates, unbind UI
   │  └─ activeScene.dispose() → release resources, unregister UI
   │
   ├─ If newScene.isInitialized === false:
   │  └─ newScene.init(renderer, assetManager)
   │     ├─ setupCamera() from config
   │     ├─ setupLights() from config
   │     ├─ setupEnvironment() → load HDR map via assetManager
   │     └─ build() [subclass hook]
   │        ├─ GeospatialScene.build():
   │        │  ├─ Load campus geometry
   │        │  ├─ Instantiate SunController, AtmosphereRenderer, MoonController
   │        │  └─ Add to this.group
   │        ├─ BackdropScene.build():
   │        │  └─ Load sky dome, backdrop geometry
   │        └─ ProjectorLightScene.build():
   │           └─ Load projector geometry, setup light maps
   │
   ├─ newScene.activate() → show, start updates, bind UI
   └─ Emit 'scene-activated' event
      └─ UI layer listens and updates panel (scene switcher, config panel)
```

### Deactivation & Disposal Flow

```
User switches scenes or calls factory.dispose()

1. currentScene.deactivate()
   ├─ group.visible = false
   ├─ Stop animation loops
   └─ Unbind UI event handlers

2. currentScene.dispose()
   ├─ Unregister UI controls
   ├─ Call onDispose() [subclass hook]
   │  └─ GeospatialScene.onDispose():
   │     ├─ Stop SunController updates
   │     ├─ Dispose AtmosphereRenderer buffers
   │     └─ Dispose MoonController light
   ├─ Release shared assets:
   │  └─ assetManager.release("hdr_campus_env")
   │     └─ refCount-- ; if refCount === 0, mark as unused
   └─ Traverse group and dispose all Materials, Geometries, Textures

3. Scene is now fully cleaned up
   └─ No lingering GPU resources
```

### Update Loop

```
Each frame:

renderer.render(scene, camera)
  ├─ if (activeScene.isActive && activeScene.update):
  │  └─ activeScene.update(deltaTime)
  │     └─ [GeospatialScene.update]:
  │        ├─ sunController.update(time)
  │        ├─ moonController.update(time)
  │        ├─ atmosphereRenderer.update(sunPosition)
  │        └─ Any custom animations
  │
  └─ renderer.render() → WebGPU draw calls
```

---

## Memory Management Strategy

### Reference Counting for Shared Assets

```typescript
// Asset lifecycle:
// 1. Scene A calls: tex = assetManager.getTexture("floor_albedo", "url")
//    → Cache entry created with refCount = 1
//
// 2. Scene A.release("floor_albedo")
//    → refCount = 0 (unused, but not disposed yet)
//
// 3. Scene B calls: tex = assetManager.getTexture("floor_albedo", "url")
//    → refCount = 1 (reuse cached texture, no reload)
//
// 4. Scene B.release("floor_albedo")
//    → refCount = 0
//
// 5. assetManager.clearUnused()
//    → Disposes all assets with refCount === 0

// Benefits:
// - Safe to reuse assets across scenes
// - Automatic cleanup of truly unused assets
// - Memory stats available via getStats()
```

### Non-Shared Resource Disposal

```typescript
// Each scene owns (and must dispose):
// - Materials (phong, standard, etc)
// - RenderTargets (for bloom, shadows, post-FX)
// - Custom textures (generated procedurally, not cached)
// - Geometries created per-scene
//
// Shared (cached in AssetManager):
// - HDR environment maps
// - Common floor/wall textures
// - Campus geometry (GLTF models)
// - Precomputed textures (atmosphere LUT)
```

### Memory Leak Detection

```typescript
// Monitoring approach:
// 1. Every scene.dispose() logs which assets were released
// 2. assetManager.getStats() called before/after scene switch
// 3. WebGPU memory info (if available via extensions) tracked
// 4. Benchmarking script toggles scenes 100x and checks for growth

example:
  const before = assetManager.getStats();
  await factory.activate("geospatial");
  const after = assetManager.getStats();
  console.log(`Memory delta: ${after.memoryEstimate - before.memoryEstimate}`);
  // Should be near zero if properly released
```

---

## UI Integration

### Scene-to-UI Binding

```typescript
// In SceneBase:
protected registerUIControls(): void {
  const uiController = globalUILController; // global reference

  if (!this.config.uiControls) return;

  for (const module of this.config.uiControls.modules) {
    uiController.registerModule(module.id, {
      label: module.label,
      controls: module.controls,
      bindings: this.getUIBindings(), // Subclass provides
    });
  }
}

// Subclass example (GeospatialScene):
protected getUIBindings(): Record<string, { get: () => any; set: (v: any) => void }> {
  return {
    "sunSky.arcOpacity": {
      get: () => this.atmosphereRenderer.config.arcOpacity,
      set: (v) => { this.atmosphereRenderer.config.arcOpacity = v; }
    },
    "sunSky.dawnColor": {
      get: () => this.sunDebug.config.palette.dawn,
      set: (v) => { this.sunDebug.config.palette.dawn = v; }
    },
  };
}
```

### UI Event Flow

```
User adjusts slider in UIL panel
  ↓
UILController detects change
  ↓
Calls binding.set(newValue)
  ↓
SceneBase.binding.set() → Updates scene state
  ↓
SceneBase.update() picks up state change
  ↓
Visual result on next frame
```

---

## WebGPU-Specific Notes

### Considerations for WebGPU Renderer

1. **No texture format auto-conversion**
   - Load textures in WebGPU-compatible formats (RGBA, RGB, etc)
   - Validate formats before caching

2. **Manual resource disposal is mandatory**
   - Three.js WebGPURenderer doesn't auto-cleanup
   - Every scene.dispose() must explicitly call `.dispose()` on materials, textures, geometries

3. **Render target management**
   - Post-processing (bloom, etc) requires RenderTargets
   - Must be disposed when scene deactivates

4. **Single canvas, single renderer**
   - All scenes render to same canvas
   - Avoid creating multiple WebGPURenderer instances (expensive)

5. **Precomputed textures**
   - AtmosphereRenderer uses precomputed LUT textures
   - Cache these aggressively; reference-count to avoid reload

### WebGPU Feature Detection

```typescript
// In SceneFactory:
const isWebGPUAvailable = navigator.gpu !== undefined;
const isWebGPUCapable = await navigator.gpu?.requestAdapter();

if (!isWebGPUCapable) {
  console.warn("WebGPU not available; fall back to WebGL");
  // Use WebGLRenderer instead
}
```

---

## Implementation Checklist

- [ ] **T-02**: Implement AssetManager with reference counting
- [ ] **T-03**: Scaffold folder structure and create module stubs
- [ ] **T-04**: Implement GeospatialScene within factory pattern
- [ ] **T-05**: Implement BackdropScene stub
- [ ] **T-06**: Implement ProjectorLightScene stub
- [ ] **T-07**: Create UI panels for scene switching and config
- [ ] **T-08**: Test memory cleanup and dispose patterns
- [ ] **T-09**: Write how-to-use documentation

---

**Next:** Implement T-02 (AssetManager) and T-03 (scaffolding).
