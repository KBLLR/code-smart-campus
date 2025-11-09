import * as THREE from "three";

function createScreenTexture({
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

const RATIO_MAP = {
  "1:1": 1,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
  "3:2": 3 / 2,
  "2:3": 2 / 3,
};

export class WebGPUScreen {
  constructor({
    scene,
    renderer,
    target = null,
    ratio = "16:9",
  } = {}) {
    if (!scene || !renderer?.isWebGPURenderer) {
      console.info("[WebGPUScreen] Renderer not WebGPU; skipping screen.");
      return;
    }
    this.scene = scene;
    this.renderer = renderer;
    this.targetObject = target;
    this.targetPosition = new THREE.Vector3();

    this.texture = createScreenTexture() ?? null;
    this.config = {
      enabled: true,
      ratio,
      position: { x: -180, z: 140 },
    };
    this.screenMesh = this.#createScreenMesh();
    if (this.screenMesh) {
      scene.add(this.screenMesh);
    }

    this.updateTarget(target);
  }

  #createScreenMesh() {
    if (!this.texture) return null;
    const geometry = new THREE.PlaneGeometry(80, 80);
    const material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.renderOrder = 10;
    plane.visible = true;
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

    if (this.screenMesh) {
      this.screenMesh.visible = this.config.enabled;
      this.screenMesh.position.copy(targetPos);
      this.screenMesh.position.y += 90;
      this.screenMesh.lookAt(targetPos.clone().setY(0));
    }
  }

  dispose() {
    if (this.screenMesh) {
      this.scene.remove(this.screenMesh);
      this.screenMesh.geometry?.dispose?.();
      this.screenMesh.material?.dispose?.();
    }
    this.texture?.dispose?.();
  }
}

WebGPUScreen.prototype.setEnabled = function setEnabled(value) {
  this.config.enabled = Boolean(value);
  if (this.screenMesh) this.screenMesh.visible = this.config.enabled;
};

WebGPUScreen.prototype.setRatioPreset = function setRatioPreset(preset) {
  const ratio = RATIO_MAP[preset] || RATIO_MAP["16:9"];
  this.config.ratio = preset;
  if (this.screenMesh) {
    this.screenMesh.scale.set(1, 1 / ratio, 1);
  }
};
WebGPUScreen.prototype.setPosition = function setPosition(x = 0, z = 0) {
  this.config.position = { x, z };
  if (this.screenMesh) {
    this.screenMesh.position.x = x;
    this.screenMesh.position.z = z;
  }
  this.updateTarget(this.targetObject);
};
