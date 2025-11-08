import * as THREE from "three";
import { ProjectorLight } from "three/webgpu";

function createGridTexture({
  size = 512,
  lineColor = "rgba(148, 163, 184, 0.6)",
  accentColor = "rgba(45, 212, 191, 0.8)",
  background = "rgba(15, 23, 42, 0.75)",
} = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
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

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(step, step, size - step * 2, size - step * 2);

  ctx.font = `${Math.floor(step * 0.55)}px "IBM Plex Sans", "Inter", system-ui`;
  ctx.fillStyle = accentColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LIVE PROJECTION", size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

export class WebGPUProjector {
  constructor({
    scene,
    renderer,
    target = null,
    intensity = 30,
    distance = 650,
    angle = Math.PI / 6,
    penumbra = 0.25,
  } = {}) {
    if (!scene || !renderer?.isWebGPURenderer) {
      console.info("[WebGPUProjector] Renderer not WebGPU; skipping projector.");
      return;
    }
    this.scene = scene;
    this.renderer = renderer;
    this.targetObject = target;
    this.targetPosition = new THREE.Vector3();

    this.texture = createGridTexture() ?? null;
    this.config = {
      enabled: true,
      intensity,
      distance,
      angleDeg: THREE.MathUtils.radToDeg(angle),
      penumbra,
      aspect: null,
      helper: true,
      position: { x: -180, z: 140 },
    };
    this.light = new ProjectorLight(
      0xffffff,
      intensity,
      distance,
      angle,
      penumbra,
      2,
    );
    this.light.castShadow = false;
    if (this.texture) {
      this.light.map = this.texture;
    }

    this.light.position.set(
      this.config.position.x,
      260,
      this.config.position.z,
    );
    this.light.target.position.set(0, 0, 0);
    scene.add(this.light);
    scene.add(this.light.target);

    this.helperPlane = this.#createHelperPlane();
    if (this.helperPlane) {
      scene.add(this.helperPlane);
    }

    this.updateTarget(target);
  }

  #createHelperPlane() {
    if (!this.texture) return null;
    const geometry = new THREE.PlaneGeometry(80, 80);
    const material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.renderOrder = 10;
    plane.visible = false;
    return plane;
  }

  updateTarget(target) {
    this.targetObject = target || this.targetObject;
    let targetPos = this.targetPosition;
    if (this.targetObject) {
      const box = new THREE.Box3().setFromObject(this.targetObject);
      box.getCenter(targetPos);
      targetPos.y += box.getSize(new THREE.Vector3()).y * 0.15;
    } else {
      targetPos.set(0, 80, 0);
    }

    if (this.helperPlane) {
      this.helperPlane.visible = this.config.enabled && this.config.helper;
      this.helperPlane.position.copy(targetPos);
      this.helperPlane.lookAt(this.light.position);
    }

    this.light.target.position.copy(targetPos);
    this.light.target.updateMatrixWorld();

    const lookMatrix = new THREE.Matrix4().lookAt(
      this.light.position,
      this.light.target.position,
      new THREE.Vector3(0, 1, 0),
    );
    const rotation = new THREE.Euler().setFromRotationMatrix(lookMatrix, "YXZ");
    this.light.rotation.copy(rotation);
  }

  dispose() {
    if (this.light) {
      this.scene.remove(this.light);
      this.scene.remove(this.light.target);
      this.light.dispose?.();
    }
    if (this.helperPlane) {
      this.scene.remove(this.helperPlane);
      this.helperPlane.geometry?.dispose?.();
      this.helperPlane.material?.dispose?.();
    }
    this.texture?.dispose?.();
  }
}

WebGPUProjector.prototype.setEnabled = function setEnabled(value) {
  this.config.enabled = Boolean(value);
  this.light.visible = this.config.enabled;
  if (this.helperPlane) {
    this.helperPlane.visible = this.config.enabled && this.config.helper;
  }
};

WebGPUProjector.prototype.setIntensity = function setIntensity(value) {
  this.config.intensity = value;
  this.light.intensity = value;
};

WebGPUProjector.prototype.setDistance = function setDistance(value) {
  this.config.distance = value;
  this.light.distance = value;
};

WebGPUProjector.prototype.setAngle = function setAngle(degrees) {
  const radians = THREE.MathUtils.degToRad(degrees);
  this.config.angleDeg = degrees;
  this.light.angle = radians;
};

WebGPUProjector.prototype.setPenumbra = function setPenumbra(value) {
  this.config.penumbra = value;
  this.light.penumbra = value;
};

WebGPUProjector.prototype.setAspect = function setAspect(value) {
  this.config.aspect = value;
  this.light.aspect = value;
};

WebGPUProjector.prototype.setHelperVisible = function setHelperVisible(value) {
  this.config.helper = Boolean(value);
  if (this.helperPlane) {
    this.helperPlane.visible = this.config.enabled && this.config.helper;
  }
};

WebGPUProjector.prototype.setPosition = function setPosition(x = 0, z = 0) {
  this.config.position = { x, z };
  this.light.position.x = x;
  this.light.position.z = z;
  this.updateTarget(this.targetObject);
};
