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
    debug = false,
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
    this.panelPadding = 4;
    this.debugHelpers = Boolean(debug);
    this.anchorHelper = null;
    this.fallbackHelper = null;
    this.panelDebugMarkers = [];
    this.hasAnchor = false;
    this.cameraFallback = false;
    this.visibilityBounds = { maxDistance: 220 };
    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.boundMove = (e) => this.onPointerMove(e);
    this.boundDown = (e) => this.onPointerDown(e);
    this.boundUp = () => this.onPointerUp();
  }

  async init() {
    const module = await import("uil");
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
    if (this.anchorHelper) {
      this.scene.remove(this.anchorHelper);
      this.anchorHelper.geometry?.dispose?.();
      this.anchorHelper.material?.dispose?.();
      this.anchorHelper = null;
    }
    if (this.fallbackHelper) {
      this.scene.remove(this.fallbackHelper);
      this.fallbackHelper.dispose?.();
      this.fallbackHelper = null;
    }
    if (this.panelDebugMarkers.length) {
      this.panelDebugMarkers.forEach((marker) => {
        this.scene.remove(marker);
        marker.geometry?.dispose?.();
        marker.material?.dispose?.();
      });
      this.panelDebugMarkers.length = 0;
    }
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
    this.panels.push(this.createPanelMesh(gui, { side: -1 }));
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
    this.panels.push(this.createPanelMesh(gui, { side: 1 }));
  }

  computeAnchorBounds() {
    if (!this.anchor) {
      this.enableCameraFallback("Anchor group missing.");
      return;
    }
    this.anchor.updateWorldMatrix(true, true);
    this.anchorBox = new THREE.Box3().setFromObject(this.anchor);
    this.anchorCenter = this.anchorCenter || new THREE.Vector3();
    this.anchorBox.getCenter(this.anchorCenter);
    this.anchorSize = this.anchorSize || new THREE.Vector3();
    this.anchorBox.getSize(this.anchorSize);
    this.anchorSphere = this.anchorSphere || new THREE.Sphere();
    this.anchorBox.getBoundingSphere(this.anchorSphere);
    this.anchorRadius = this.anchorSphere.radius || 20;
    console.log(
      "[CanvasUILPanels] Anchor center/size",
      this.anchorCenter,
      this.anchorSize,
    );
    if (!isFinite(this.anchorSize.x) || !isFinite(this.anchorSize.z)) {
      this.enableCameraFallback("Anchor bounds invalid.");
      return;
    }
    this.hasAnchor = true;
    this.cameraFallback = false;
    if (this.debugHelpers) {
      this.updateAnchorHelper();
    }
    this.refreshPanelPlacements();
  }

  refreshPanelPlacements() {
    if (!this.anchorCenter || !this.panels.length) return;
    this.panels.forEach((panel) => {
      if (!panel?.mesh) return;
      this.updatePanelPlacement(panel.mesh, panel.slot);
    });
  }

  updatePanelPlacement(mesh, slot) {
    const transform = this.getPanelTransform(slot);
    if (!transform) return;
    const { position, rotation } = transform;
    mesh.position.copy(position);
    if (rotation) {
      mesh.rotation.copy(rotation);
    }
  }

  getPanelTransform(slot) {
    const anchorTransform =
      this.hasAnchor && this.anchorCenter
        ? this.getAnchorPosition(slot)
        : null;
    return this.ensureVisiblePlacement(slot, anchorTransform);
  }

  getAnchorPosition(slot = 1) {
    const config =
      typeof slot === "number" ? { side: slot } : { ...(slot || {}) };
    const center = this.anchorCenter
      ? this.anchorCenter.clone()
      : new THREE.Vector3();
    const size = this.anchorSize || new THREE.Vector3(20, 6, 20);
    const side = Math.sign(config.side ?? 1) || 1;
    const depthDir = Math.sign(config.front ?? config.depth ?? 1) || 1;
    const verticalExtra = config.heightOffset ?? 0;
    const halfWidth = Math.max(size.x * 0.5, 6);
    const halfDepth = Math.max(size.z * 0.5, 6);
    const halfHeight = Math.max(size.y * 0.5, 4);
    const padding = this.panelPadding;

    const targetPosition = new THREE.Vector3(
      center.x + side * (halfWidth + padding),
      center.y + halfHeight + verticalExtra + padding * 0.5,
      center.z + depthDir * (halfDepth + padding),
    );

    const yaw = side > 0 ? -Math.PI / 10 : Math.PI / 10;

    return {
      position: targetPosition,
      rotation: new THREE.Euler(0, yaw, 0),
    };
  }

  ensureVisiblePlacement(slot, transform) {
    if (!transform) {
      console.warn(
        "[CanvasUILPanels] Missing anchor transform; falling back to camera placement.",
        { slot },
      );
      return this.getCameraFallbackPosition(slot);
    }
    if (!this.isPlacementVisible(transform.position)) {
      console.warn(
        "[CanvasUILPanels] Anchor placement out of view; switching to camera fallback.",
        { slot, position: transform.position.toArray() },
      );
      return this.getCameraFallbackPosition(slot);
    }
    return transform;
  }

  isPlacementVisible(position) {
    if (!position || !this.camera) return false;
    const projected = position.clone().project(this.camera);
    const withinFrustum =
      projected.x >= -1 &&
      projected.x <= 1 &&
      projected.y >= -1 &&
      projected.y <= 1 &&
      projected.z >= -1 &&
      projected.z <= 1;
    const distance = position.distanceTo(this.camera.position);
    return withinFrustum && distance <= this.visibilityBounds.maxDistance;
  }

  getCameraFallbackPosition(slot = 1) {
    if (!this.cameraFallback) {
      this.enableCameraFallback("Falling back to camera space positioning.");
    }
    const config =
      typeof slot === "number" ? { side: slot } : { ...(slot || {}) };
    const side = Math.sign(config.side ?? 1) || 1;
    const order = config.order ?? 0;
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    if (forward.lengthSq() === 0) forward.set(0, 0, -1);
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, this.camera.up).normalize();
    const up = this.camera.up.clone().normalize();
    const anchorDistance = config.distance ?? 6;
    const lateral = config.lateral ?? 2.2;
    const verticalBase = config.heightOffset ?? 1.4;
    const verticalStep = config.verticalStep ?? 0.7;

    const base = this.camera.position.clone().addScaledVector(forward, anchorDistance);
    base.addScaledVector(right, side * lateral);
    base.addScaledVector(up, verticalBase + order * verticalStep);

    const yaw = Math.atan2(right.x * side, right.z * side) || 0;
    return {
      position: base,
      rotation: new THREE.Euler(0, yaw, 0),
    };
  }

  updateAnchorHelper() {
    if (!this.anchorBox) return;
    if (!this.anchorHelper) {
      this.anchorHelper = new THREE.Box3Helper(
        this.anchorBox,
        new THREE.Color(0x00ffff),
      );
      this.anchorHelper.renderOrder = 5;
      this.scene.add(this.anchorHelper);
    } else {
      this.anchorHelper.box.copy(this.anchorBox);
    }
  }

  enableCameraFallback(reason) {
    if (this.cameraFallback) return;
    this.cameraFallback = true;
    this.hasAnchor = false;
    console.warn("[CanvasUILPanels] Camera fallback enabled:", reason);
    if (this.debugHelpers) {
      this.addFallbackHelper();
    }
  }

  addFallbackHelper() {
    if (this.fallbackHelper) return;
    this.fallbackHelper = new THREE.AxesHelper(2);
    this.scene.add(this.fallbackHelper);
    this.fallbackHelper.renderOrder = 50;
  }

  createPanelMesh(gui, slot = 1) {
    const { position, rotation } = this.getPanelTransform(slot) ?? {
      position: new THREE.Vector3(),
      rotation: new THREE.Euler(),
    };
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
    mesh.userData.panel = { gui, texture, slot };
    if (this.debugHelpers) {
      this.addPanelMarker(mesh);
    }
    gui.onDraw = () => {
      texture.needsUpdate = true;
      mesh.visible = true;
    };
    mesh.onBeforeRender = () => {
      if (this.cameraFallback) {
        const fallback = this.getCameraFallbackPosition(
          mesh.userData.panel.slot,
        );
        if (fallback) {
          mesh.position.copy(fallback.position);
          mesh.rotation.copy(fallback.rotation);
        }
      }
      mesh.lookAt(this.camera.position);
      if (this.debugHelpers && this.cameraFallback && this.fallbackHelper) {
        this.fallbackHelper.position.copy(mesh.position);
      }
    };
    this.interactive.add(mesh);
    console.log("[CanvasUILPanels] Panel created", {
      slot,
      usingAnchor: this.hasAnchor,
      cameraFallback: this.cameraFallback,
      position: mesh.position.toArray(),
    });
    return { gui, mesh, slot };
  }

  addPanelMarker(mesh) {
    const markerGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const markerMat = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      depthTest: false,
      transparent: true,
      opacity: 0.7,
    });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.renderOrder = mesh.renderOrder + 1;
    marker.userData.parentPanel = mesh;
    marker.onBeforeRender = () => {
      marker.position.copy(mesh.position);
    };
    this.scene.add(marker);
    this.panelDebugMarkers.push(marker);
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
