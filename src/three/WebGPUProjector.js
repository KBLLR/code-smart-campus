import * as THREE from "three";

/**
 * Creates a default projector texture with a test pattern
 * Useful for testing projections without external assets
 */
function createProjectorTexture({
  size = 512,
  text = "PROJECTOR",
  bgColor = "#0f172a",
  lineColor = "#94a3b8",
  accentColor = "#2dd4bf",
} = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  // Grid lines
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1;
  const step = size / 8;
  for (let i = 0; i <= size; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // Border
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(step * 0.5, step * 0.5, size - step, size - step);

  // Text
  ctx.font = `bold ${Math.floor(step * 0.6)}px "IBM Plex Sans", "Inter", system-ui`;
  ctx.fillStyle = accentColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/**
 * WebGPUProjector - A spotlight-based projection system for 3D scenes
 * Uses THREE.SpotLight to create projector-like lighting and shadow mapping
 *
 * Note: This implementation uses SpotLight instead of ProjectorLight (not available in Three.js 0.181.0)
 * The projector can cast shadows and project textures through its shadow map
 */
export class WebGPUProjector {
  constructor({
    scene,
    renderer,
    target = null,
    intensity = 1,
    distance = 200,
  } = {}) {
    if (!scene || !renderer?.isWebGPURenderer) {
      console.info("[WebGPUProjector] Renderer not WebGPU; skipping projector.");
      return;
    }

    this.scene = scene;
    this.renderer = renderer;
    this.targetObject = target;

    // Create default projector texture
    this.texture = createProjectorTexture() ?? null;

    // Configuration - optimized for SpotLight
    this.config = {
      enabled: true,
      intensity,
      distance,
      angle: Math.PI / 6, // 30 degrees - cone angle
      penumbra: 0.5, // edge softness (0-1)
      decay: 2, // light falloff
      focus: 1, // shadow focus (spotlight property)
      position: { x: 0, y: 100, z: 0 },
      rotation: { x: -Math.PI / 3, y: 0, z: 0 },
    };

    // Create the SpotLight
    this.projectorLight = this.#createSpotLight();
    if (this.projectorLight) {
      scene.add(this.projectorLight);
    }

    // Helper to visualize the light cone (optional)
    this.helper = null;

    this.updateTarget(target);
  }

  #createSpotLight() {
    const light = new THREE.SpotLight(
      0xffffff, // color
      this.config.intensity, // intensity
      this.config.distance, // distance
      this.config.angle, // angle
      this.config.penumbra, // penumbra
      this.config.decay, // decay
    );

    // Position
    const { x, y, z } = this.config.position;
    light.position.set(x, y, z);

    // Rotation
    const { x: rx, y: ry, z: rz } = this.config.rotation;
    light.rotation.set(rx, ry, rz);

    // Shadow setup
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = this.config.distance;
    light.shadow.camera.fov = (this.config.angle * 180) / Math.PI;
    light.shadow.bias = -0.004;
    light.shadow.focus = this.config.focus;

    // Optional: Assign texture for visual reference
    // Note: Actual projection would require a custom material or shader
    if (this.texture) {
      // Store reference for potential future use with custom materials
      light.userData.projectionTexture = this.texture;
    }

    return light;
  }

  /**
   * Create a helper to visualize the projector's light cone
   */
  createHelper() {
    if (!this.projectorLight) return null;
    if (this.helper) {
      this.scene.remove(this.helper);
      this.helper = null;
    }

    this.helper = new THREE.SpotLightHelper(this.projectorLight);
    this.scene.add(this.helper);
    return this.helper;
  }

  /**
   * Remove the visualization helper
   */
  removeHelper() {
    if (this.helper) {
      this.scene.remove(this.helper);
      this.helper = null;
    }
  }

  /**
   * Update the projector's target position
   */
  updateTarget(target) {
    this.targetObject = target || this.targetObject;
    if (!this.projectorLight) return;

    if (this.targetObject) {
      const box = new THREE.Box3().setFromObject(this.targetObject);
      const center = new THREE.Vector3();
      box.getCenter(center);

      // Position projector above and looking at the target
      this.projectorLight.position.set(
        center.x + 50,
        center.y + 100,
        center.z + 50,
      );
      this.projectorLight.target.position.copy(center);
      this.projectorLight.target.updateMatrixWorld();
    } else {
      // Default position looking down at origin
      this.projectorLight.position.set(
        this.config.position.x,
        this.config.position.y,
        this.config.position.z,
      );
      this.projectorLight.target.position.set(0, 0, 0);
      this.projectorLight.target.updateMatrixWorld();
    }

    if (this.helper) {
      this.helper.update();
    }
  }

  /**
   * Dispose of resources
   */
  dispose() {
    if (this.projectorLight) {
      // Remove target object
      if (this.projectorLight.target) {
        this.scene.remove(this.projectorLight.target);
      }
      // Remove shadow map
      this.projectorLight.shadow.map?.dispose?.();
      // Remove light from scene
      this.scene.remove(this.projectorLight);
    }
    if (this.helper) {
      this.scene.remove(this.helper);
      this.helper = null;
    }
    this.texture?.dispose?.();
  }
}

// Control methods
WebGPUProjector.prototype.setEnabled = function setEnabled(value) {
  this.config.enabled = Boolean(value);
  if (this.projectorLight) this.projectorLight.visible = this.config.enabled;
};

WebGPUProjector.prototype.setIntensity = function setIntensity(value) {
  this.config.intensity = Math.max(0, value);
  if (this.projectorLight) this.projectorLight.intensity = this.config.intensity;
};

WebGPUProjector.prototype.setDistance = function setDistance(value) {
  this.config.distance = Math.max(1, value);
  if (this.projectorLight) {
    this.projectorLight.distance = this.config.distance;
    this.projectorLight.shadow.camera.far = this.config.distance;
  }
};

WebGPUProjector.prototype.setAngle = function setAngle(value) {
  // Clamp between 0 and PI/2
  this.config.angle = Math.max(0, Math.min(Math.PI / 2, value));
  if (this.projectorLight) {
    this.projectorLight.angle = this.config.angle;
    this.projectorLight.shadow.camera.fov = (this.config.angle * 180) / Math.PI;
  }
};

WebGPUProjector.prototype.setPenumbra = function setPenumbra(value) {
  this.config.penumbra = Math.max(0, Math.min(1, value));
  if (this.projectorLight)
    this.projectorLight.penumbra = this.config.penumbra;
};

WebGPUProjector.prototype.setDecay = function setDecay(value) {
  this.config.decay = Math.max(1, value);
  if (this.projectorLight) this.projectorLight.decay = this.config.decay;
};

WebGPUProjector.prototype.setFocus = function setFocus(value) {
  this.config.focus = Math.max(0, Math.min(1, value));
  if (this.projectorLight) this.projectorLight.shadow.focus = this.config.focus;
};

WebGPUProjector.prototype.setPosition = function setPosition(x, y, z) {
  this.config.position = { x, y, z };
  if (this.projectorLight) {
    this.projectorLight.position.set(x, y, z);
  }
};

WebGPUProjector.prototype.setRotation = function setRotation(x, y, z) {
  this.config.rotation = { x, y, z };
  if (this.projectorLight) {
    this.projectorLight.rotation.set(x, y, z);
  }
};

/**
 * Load an external texture for projection
 * @param {string} url - URL to image or video
 * @param {string} type - 'image' or 'video'
 */
WebGPUProjector.prototype.loadTexture = function loadTexture(url, type = "image") {
  const textureLoader = new THREE.TextureLoader();

  if (type === "image") {
    textureLoader.load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        this.texture = texture;
        if (this.projectorLight) {
          this.projectorLight.userData.projectionTexture = texture;
        }
      },
      undefined,
      (error) => {
        console.error("[WebGPUProjector] Failed to load texture:", error);
      },
    );
  } else if (type === "video") {
    const video = document.createElement("video");
    video.src = url;
    video.crossOrigin = "anonymous";
    video.playsInline = true;
    video.autoplay = true;
    video.loop = true;
    video.play();

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture = videoTexture;

    if (this.projectorLight) {
      this.projectorLight.userData.projectionTexture = videoTexture;
    }
  }
};

/**
 * Get the projection texture for use in custom materials
 * @returns {THREE.Texture|null}
 */
WebGPUProjector.prototype.getProjectionTexture = function getProjectionTexture() {
  return this.texture;
};
