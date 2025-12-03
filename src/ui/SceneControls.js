/**
 * SceneControls - Scene control panel using space.js
 * TODO: Full implementation with @alienkitty/space.js integration
 */

export class SceneControls {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.container = null;
    this._init();
  }

  _init() {
    // TODO: Integrate @alienkitty/space.js for scene controls
    // For now, just a placeholder
    console.log('[SceneControls] Initialized (stub - space.js integration pending)');
  }

  update(delta) {
    // Update controls if needed
  }

  dispose() {
    this.container?.remove();
  }
}
