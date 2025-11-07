import * as THREE from "three";

const tempForward = new THREE.Vector3();
const tempRight = new THREE.Vector3();
const tempMove = new THREE.Vector3();

export class CanvasUILPanels {
  constructor({
    scene,
    camera,
    controls,
    canvas,
    setup,
    sunDebug,
    postFX,
    anchor,
  }) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.canvas = canvas;
    this.setup = setup;
    this.sunDebug = sunDebug;
    this.postFX = postFX;
    this.panels = [];
    this.interactive = new THREE.Group();
    this.interactive.name = "CanvasUILPanels";
    this.anchor = anchor;
    this.scene.add(this.interactive);
    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.boundMove = (e) => this.onPointerMove(e);
    this.boundDown = (e) => this.onPointerDown(e);
    this.boundUp = () => this.onPointerUp();
  }

  async init() {
    const module = await import("@/vendor/uil.module.js");
    this.UIL = module.UIL || module.default || module;
    this.computeAnchorBounds();
    this.createNavigationPanel();
    this.createEnvironmentPanel();
    this.panels.forEach((panel) => panel.gui?.draw?.(true));
    this.attachPointerListeners();
  }

  dispose() {
    this.detachPointerListeners();
    this.scene.remove(this.interactive);
    this.panels.forEach((panel) => panel.gui?.clear?.());
    this.panels.length = 0;
  }

  createNavigationPanel() {
    const gui = new this.UIL.Gui({
      w: 256,
      maxHeight: 180,
      isCanvas: true,
      close: false,
      transparent: true,
    });
    const navState = {
      autoRotate: this.setup?.autoRotate?.enabled ?? false,
      move: [0, 0],
      height: this.setup?.cam?.position.y ?? 50,
    };
    const autoControl = gui.add(navState, "autoRotate", {
      type: "Bool",
      fontColor: "#A0E4F1",
    });
    autoControl.onChange = (value) => {
      this.setup?.setAutoRotate?.(value, true);
    };
    const heightControl = gui.add(navState, "height", {
      type: "Circular",
      min: 10,
      max: 140,
      precision: 1,
      fontColor: "#2dd4bf",
    });
    heightControl.onChange = (value) => {
      if (!this.setup?.cam || !this.setup?.orbCtrls) return;
      this.setup.cam.position.y = value;
      this.setup.orbCtrls.target.y = Math.min(value * 0.4, 60);
    };
    const joystickControl = gui.add(navState, "move", {
      type: "Joystick",
      w: 120,
      fontColor: "#D4B87B",
    });
    joystickControl.onChange = (value) => {
      this.applyJoystick(value);
    };
    this.panels.push(this.createPanelMesh(gui, this.getAnchorPosition(-1)));
  }

  createEnvironmentPanel() {
    const gui = new this.UIL.Gui({
      w: 256,
      maxHeight: 180,
      isCanvas: true,
      close: false,
      transparent: true,
    });
    const envState = {
      bloomStrength: this.postFX?.config?.bloomStrength ?? 0.75,
      bloomRadius: this.postFX?.config?.bloomRadius ?? 0.85,
      arcOpacity: this.sunDebug?.config?.arcOpacity ?? 0.4,
    };
    const bloomStrength = gui.add(envState, "bloomStrength", {
      type: "Knob",
      min: 0,
      max: 2,
      precision: 2,
      fontColor: "#7BD4B8",
    });
    bloomStrength.onChange = (value) =>
      this.postFX?.setBloomSettings?.({ strength: value });
    const bloomRadius = gui.add(envState, "bloomRadius", {
      type: "Knob",
      min: 0,
      max: 1.5,
      precision: 2,
      fontColor: "#7BD4B8",
    });
    bloomRadius.onChange = (value) =>
      this.postFX?.setBloomSettings?.({ radius: value });
    const arcOpacity = gui.add(envState, "arcOpacity", {
      type: "Circular",
      min: 0,
      max: 1,
      precision: 2,
      fontColor: "#D47B7B",
    });
    arcOpacity.onChange = (value) => {
      if (!this.sunDebug) return;
      this.sunDebug.config.arcOpacity = value;
      this.sunDebug.apply();
    };
    this.panels.push(this.createPanelMesh(gui, this.getAnchorPosition(1)));
  }

  computeAnchorBounds() {
    if (!this.anchor) return;
    this.anchor.updateWorldMatrix(true, true);
    this.anchorBox = new THREE.Box3().setFromObject(this.anchor);
    this.anchorCenter = this.anchorBox.getCenter(new THREE.Vector3());
    this.anchorSize = this.anchorBox.getSize(new THREE.Vector3());
    console.debug(
      "[CanvasUILPanels] Anchor center/size",
      this.anchorCenter,
      this.anchorSize,
    );
  }

  getAnchorPosition(direction = 1) {
    const center = this.anchorCenter || new THREE.Vector3();
    const size = this.anchorSize || new THREE.Vector3(20, 6, 20);
    const halfWidth = size.x * 0.5;
    const offsetX = Math.min(halfWidth + 6, 28);
    const offsetY = size.y * 0.4 + 4;
    const offsetZ = Math.min(size.z * 0.5 + 6, 18);
    return {
      position: new THREE.Vector3(
        center.x + direction * offsetX,
        center.y + offsetY,
        center.z + offsetZ,
      ),
      rotation: new THREE.Euler(
        0,
        direction > 0 ? -Math.PI / 12 : Math.PI / 12,
        0,
      ),
    };
  }

  createPanelMesh(gui, { position, rotation }) {
    const texture = new THREE.Texture(gui.canvas);
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      depthTest: false,
      side: THREE.FrontSide,
    });
    const geometry = new THREE.PlaneGeometry(4.7, 3);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.rotation.copy(rotation);
    mesh.renderOrder = 20;
    mesh.userData.panel = { gui, texture };
    gui.onDraw = () => {
      texture.needsUpdate = true;
      mesh.visible = true;
    };
    mesh.onBeforeRender = () => {
      mesh.lookAt(this.camera.position);
    };
    this.interactive.add(mesh);
    return { gui, mesh };
  }

  attachPointerListeners() {
    if (!this.canvas) return;
    this.canvasRect = this.canvas.getBoundingClientRect();
    this.canvas.addEventListener("pointermove", this.boundMove);
    this.canvas.addEventListener("pointerdown", this.boundDown);
    window.addEventListener("pointerup", this.boundUp);
  }

  detachPointerListeners() {
    if (!this.canvas) return;
    this.canvas.removeEventListener("pointermove", this.boundMove);
    this.canvas.removeEventListener("pointerdown", this.boundDown);
    window.removeEventListener("pointerup", this.boundUp);
  }

  onPointerMove(event) {
    this.updatePointer(event);
    const hit = this.raycast();
    if (hit) {
      hit.gui.setMouse(hit.uv);
      event.preventDefault();
    } else {
      this.panels.forEach((panel) => panel.gui.reset?.(true));
    }
  }

  onPointerDown(event) {
    this.updatePointer(event);
    const hit = this.raycast();
    if (hit) {
      hit.gui.setMouse(hit.uv);
      if (this.controls) this.controls.enabled = false;
      event.preventDefault();
    } else if (this.controls) {
      this.controls.enabled = true;
    }
  }

  onPointerUp() {
    if (this.controls) this.controls.enabled = true;
  }

  updatePointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -(
      (event.clientY - rect.top) /
      rect.height
    ) * 2 + 1;
  }

  raycast() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(
      this.interactive.children,
      false,
    );
    if (intersects.length === 0) return null;
    const { object, uv } = intersects[0];
    const panel = object.userData.panel;
    if (!panel) return null;
    return { gui: panel.gui, uv };
  }

  applyJoystick(value) {
    if (!this.setup?.cam || !this.setup?.orbCtrls || !value) return;
    const cam = this.setup.cam;
    const controls = this.setup.orbCtrls;
    const panSpeed = 2.0;
    const vx = Array.isArray(value) ? value[0] : value.x ?? 0;
    const vy = Array.isArray(value) ? value[1] : value.y ?? 0;
    cam.getWorldDirection(tempForward);
    tempForward.y = 0;
    if (tempForward.lengthSq() === 0) tempForward.set(0, 0, -1);
    tempForward.normalize();
    tempRight.copy(tempForward).cross(cam.up).normalize();
    tempMove.set(0, 0, 0);
    tempMove.addScaledVector(tempRight, vx * panSpeed);
    tempMove.addScaledVector(tempForward, -(vy * panSpeed));
    controls.target.add(tempMove);
    controls.object.position.add(tempMove);
    controls.update();
  }
}
