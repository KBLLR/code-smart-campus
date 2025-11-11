# Scene Factory Module

This module provides a **shared WebGPU renderer** and a **scene factory system** that allows seamless swapping between multiple scene variants (Geospatial, Backdrop, ProjectorLight) while sharing common assets and properly managing memory.

## Overview
- One `WebGPURenderer` instance for all scenes
- `SceneFactory` handles activation/deactivation of scenes
- `AssetManager` caches shared geometries/textures/models
- Each scene implements `SceneBase` lifecycle: `init`, `activate`, `deactivate`, `dispose`
- UI modules for switching scenes and tuning scene-specific config

## Usage
1. Import `SceneFactory` and `AssetManager`.
2. Register scenes via `SceneFactory.register('geospatial', GeospatialScene)`, etc.
3. Call `SceneFactory.activate('backdrop')` to switch view.
4. UI panel will reflect config of the active scene.

---
🎯 Factory-Prompt

We are building a WebGPU Scene Factory Module for the Smart Campus project.

***Goal***: Support multiple interchangeable scenes (e.g., “GeospatialScene”, “BackdropScene”, and “ProjectorLightScene”) all rendered via a shared WebGPU renderer and shared assets/resources, while allowing each scene to have its own configuration, lifecycle, memory management, and UI controls.

Requirements:
• There is one WebGPURenderer instance (using Three.js’s WebGPURenderer) that all scenes will share.
threejs.org
+1

• Each scene is defined by a configuration object (e.g., camera, environment, lights, geometry, UI panel settings) and can be instantiated, activated, deactivated, and disposed.
• Shared resources (geometries, textures, models, maps) live in a common cache/asset-manager so that switching scenes does not duplicate heavy assets unless necessary.
• When a scene is deactivated or swapped out, it must clean up its own non-shared resources (post-processing buffers, unused textures, scene graph nodes) to avoid GPU memory leaks. (“dispose” pattern).
rustcodeweb.com
+1

• Switching scenes is rapid: you can call something like SceneFactory.activate("Geospatial") or SceneFactory.activate("Backdrop"), and the factory handles deactivating current scene, freeing what needs freeing, then mounting and rendering the new one.
• Each scene must support UI controls (Tweakpane or vanilla) for their specific parameters, while still using the same renderer/canvas pipeline.
• Scenes must be Hot-Swappable but remain decoupled: their code lives under @shared/scenes/…, their modules import common engine utils.

### Deliverables:

API spec for SceneFactory, SceneBase, AssetManager, SceneConfig.

Folder layout in your monorepo: @shared/engine/sceneFactory.ts, @shared/engine/assetManager.ts, @shared/scenes/geospatial/index.ts, @shared/scenes/backdrop/index.ts, @shared/scenes/projectorLight/index.ts.

Memory/Resource strategy: what gets shared, what gets scene-local, how disposal works, how to detect & log leaks.

UI strategy: Each scene registers its own UI panel; SceneFactory mounts/unmounts it when scene switches.

Configuration strategy: JSON/TS configs per scene (camera settings, light settings, environment maps, etc) so new scene variants can be added easily.

Activation/Deactivation flow: pseudocode or flow-chart showing “deactivate currentScene → call currentScene.dispose() → SceneFactory.load(sceneKey) → newScene.init(renderer, assetManager) → newScene.activate()”.

Performance considerations: With WebGPU you want one renderer, shared canvas, reuse resources, avoid multiple independent WebGPURenderer instances.
three.js forum

### Constraints:

No scene holds its own independent renderer; the factory maintains one.

Shared assets must be reference-counted or cached so memory isn’t freed while still in use by other scenes.

Scene disposal must explicitly call .dispose() on Three.js objects (geometries, materials, textures, render targets) to avoid leaks.

Provide hooks for dynamic runtime switching (e.g., user toggles view via UI).

All code must align with the monorepo structure (you prefer Vanilla TS/JS, monorepo with shared libs).

Use plain language but precise API signatures and module structure so the developer team can implement without ambiguity.

### 🔍 Key Research & Reasoning Areas

(You’ll want to explore these and embed findings into the spec.)

Area	Questions to answer
Renderer sharing	Is it feasible (and optimal) to share one WebGPURenderer across multiple scenes in Three.js? Forum posts suggest yes.
three.js forum

Asset sharing & caching	How to build an AssetManager that caches geometries/textures/models and reference-counts or flags them for disposal when no longer used.
Scene lifecycle	How to structure init(), activate(), deactivate(), dispose() methods so each scene cleans up correctly and doesn’t leave a “dead” scene consuming GPU memory.
Configuration per scene	How to define a SceneConfig type with all configurable parameters (camera, environment, UI panel schema) so new scenes can be spun up with minimal code.
UI integration	How the UI (Tweakpane or your custom controls) is tied into each scene’s config, how the factory binds/unbinds panels when scenes switch.
Memory/multi-scene management	What happens if a user toggles back and forth many times? How to avoid memory leaks or multiple hidden scenes accumulating. Implement monitoring/logging of WebGPU memory/info.
Performance & WebGPU specifics	WebGPU with Three.js has newer constraints; e.g., resources must be manually disposed, multiple renderers incur overhead
---
## Module Structure
```scene-factory/
├── README.md
├── AUDIT-log.md
├── tasks.md
├── docs/
│   ├── how-to-use-scene-factory.md
│   └── architecture.md
├── src/
│   ├── index.ts
│   ├── engine/
│   │   ├── SceneFactory.ts
│   │   ├── SceneBase.ts
│   │   ├── AssetManager.ts
│   │   └── SharedResources.ts
│   ├── scenes/
│   │   ├── GeospatialScene/
│   │   │   └── index.ts
│   │   ├── BackdropScene/
│   │   │   └── index.ts
│   │   └── ProjectorLightScene/
│   │       └── index.ts
│   └── ui/
│       ├── SceneSwitcherPanel.ts
│       └── SceneConfigPanel.ts
└── tests/
    └── sceneFactory.test.ts

```
