import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

const DEFAULT_PARAMS = Object.freeze({
  enabled: true,
  bloomStrength: 0.75,
  bloomRadius: 0.85,
  bloomThreshold: 0.6,
});

export class PostProcessor {
  constructor({ renderer, scene, camera } = {}) {
    if (!renderer) throw new Error("[PostProcessor] renderer is required.");
    if (!scene) throw new Error("[PostProcessor] scene is required.");
    if (!camera) throw new Error("[PostProcessor] camera is required.");

    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.composer = new EffectComposer(renderer);
    this.renderPass = new RenderPass(scene, camera);
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.6, 0.5, 0.8);
    this.outputPass = new OutputPass();

    this.params = {
      enabled: DEFAULT_PARAMS.enabled,
      bloomStrength: DEFAULT_PARAMS.bloomStrength,
      bloomRadius: DEFAULT_PARAMS.bloomRadius,
      bloomThreshold: DEFAULT_PARAMS.bloomThreshold,
    };

    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(this.outputPass);

    this.setSize(
      renderer.domElement.clientWidth || window.innerWidth,
      renderer.domElement.clientHeight || window.innerHeight,
    );
    this._applyBloomSettings();
  }

  updateScene(scene) {
    if (!scene) return;
    this.scene = scene;
    this.renderPass.scene = scene;
  }

  updateCamera(camera) {
    if (!camera) return;
    this.camera = camera;
    this.renderPass.camera = camera;
  }

  setEnabled(enabled) {
    this.params.enabled = Boolean(enabled);
  }

  isEnabled() {
    return this.params.enabled;
  }

  setBloomSettings({ strength, radius, threshold } = {}) {
    if (typeof strength === "number") this.params.bloomStrength = strength;
    if (typeof radius === "number") this.params.bloomRadius = radius;
    if (typeof threshold === "number") this.params.bloomThreshold = threshold;
    this._applyBloomSettings();
  }

  getConfig() {
    return this.params;
  }

  render(delta) {
    if (!this.params.enabled) {
      this.renderer.render(this.scene, this.camera);
      return;
    }
    if (typeof delta === "number") {
      this.composer.render(delta);
    } else {
      this.composer.render();
    }
  }

  setSize(width, height) {
    if (!width || !height) return;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.composer.setPixelRatio(pixelRatio);
    this.composer.setSize(width, height);
    this.bloomPass.setSize(width, height);
  }

  dispose() {
    this.composer?.dispose();
  }

  _applyBloomSettings() {
    this.bloomPass.strength = this.params.bloomStrength;
    this.bloomPass.radius = this.params.bloomRadius;
    this.bloomPass.threshold = this.params.bloomThreshold;
  }
}
