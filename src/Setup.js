// --- START OF FILE Setup.js (Modified) ---

import * as THREE from "three";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Pane } from "tweakpane";
import { StatsGLPanel } from "@/debug/StatsGLPanel.js";

const DEFAULT_TARGET_BOUNDS = {
  min: new THREE.Vector3(-220, -10, -220),
  max: new THREE.Vector3(220, 160, 220),
};

const KEYBOARD_BINDINGS = {
  forward: ["w", "arrowup"],
  backward: ["s", "arrowdown"],
  left: ["a", "arrowleft"],
  right: ["d", "arrowright"],
  up: ["e", "pageup"],
  down: ["q", "pagedown"],
  focus: ["f"],
  autoRotate: ["r"],
};


export default class Setup {
  static fov = 75;
  static near = 0.01;
  static far = 1000;

  constructor(cnvs, resizeHandler) {
    if (!cnvs || !(cnvs instanceof HTMLCanvasElement)) {
      throw new Error("Setup: Valid canvas element is required.");
    }
    if (typeof resizeHandler !== "function") {
      throw new Error("Setup: Valid resizeHandler function is required.");
    }

    this.cnvs = cnvs;
    this.resizeHandler = resizeHandler;
    this.clock = new THREE.Clock();
    this.cameraBookmarks = new Map();
    this.isCameraAnimating = false;
    this.persistThrottle = 0;
    this.keyState = new Set();
    this.keyboardConfig = {
      panSpeed: 40,
      verticalSpeed: 30,
      focusDuration: 0.6,
    };
    this.targetBounds = {
      min: DEFAULT_TARGET_BOUNDS.min.clone(),
      max: DEFAULT_TARGET_BOUNDS.max.clone(),
    };
    this.autoRotate = {
      enabled: false,
      speed: THREE.MathUtils.degToRad(6),
      idleDelay: 4000,
      lastInteraction: performance.now(),
      sticky: false,
    };

    const w = cnvs.clientWidth;
    const h = cnvs.clientHeight;
    const aspect = w > 0 && h > 0 ? w / h : 1; // Prevent aspect ratio of 0 or NaN

    this.re = new THREE.WebGLRenderer({
      canvas: cnvs,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.re.toneMapping = THREE.ACESFilmicToneMapping; // ACESFilmic is often preferred
    this.re.outputColorSpace = THREE.SRGBColorSpace;
    this.re.shadowMap.enabled = true;
    this.re.shadowMap.type = THREE.PCFSoftShadowMap;

    // Initial size setting - consider removing the mobile check if full screen is always desired
    if (this.isMobileDevice()) {
      this.re.setSize(cnvs.clientWidth * 0.7, cnvs.clientHeight * 0.7, false);
    } else {
      this.re.setSize(cnvs.clientWidth, cnvs.clientHeight, false);
    }

    // Default to full size, let resize handler manage updates
    this.re.setSize(w, h, false);

    this.re.setPixelRatio(Math.min(window.devicePixelRatio, 1));

    this.cam = new THREE.PerspectiveCamera(
      Setup.fov,
      aspect,
      Setup.near,
      Setup.far,
    );
    // Initial camera position (adjust as needed for default view)
    this.cam.position.set(80, 80, 100);
    this.cam.lookAt(0, 0, 0); // Look at the origin initially

    // Scene is created here but managed externally (passed in via attachSetup in main.js?)
    // This seems confusing. Usually Setup would own the scene or receive it.
    // Let's assume scene is created here for simplicity unless told otherwise.
    this.scene = new THREE.Scene();

    try {
      this.stats = new StatsGLPanel(this.re, {}, "bottom-right"); // Pass renderer, empty options, align top-left
    } catch (error) {
      console.error("Failed to initialize StatsGLPanel:", error);
      this.stats = null; // Set to null on failure
    }

    // Optional: Set background color if HDR is not immediately loaded
    // this.scene.background = new THREE.Color(0x111111);

    // this.stats = new Stats();
    // Add Stats panel aligned to top-right (example)
    // this.stats.dom.style.position = "absolute";
    // this.stats.dom.style.top = "0px";
    // this.stats.dom.style.left = "auto";
    // this.stats.dom.style.right = "0px";
    // document.body.appendChild(this.stats.dom);

    this.orbCtrls = new OrbitControls(this.cam, this.cnvs);
    this.orbCtrls.enableDamping = true; // Smoother control transitions
    this.orbCtrls.enablePan = true; // Enable panning
    this.orbCtrls.enableRotate = true; // Enable rotation
    this.orbCtrls.enableZoom = true; // Enable zooming
    this.orbCtrls.dampingFactor = 0.08;
    this.orbCtrls.screenSpacePanning = false; // Keep panning relative to world space
    this.orbCtrls.minDistance = 25; // Set min zoom distance
    this.orbCtrls.maxDistance = 320; // Set max zoom distance
    this.orbCtrls.minPolarAngle = THREE.MathUtils.degToRad(15);
    this.orbCtrls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent camera going below ground plane
    this.orbCtrls.rotateSpeed = 0.9;
    this.orbCtrls.zoomSpeed = 1.1;
    this.orbCtrls.panSpeed = 0.8;

    this.restoreCameraState();
    this.saveCameraBookmark("default", true);
    this.persistBookmarks();

    this.handleKeyDown = (event) => {
      if (event.target && /input|textarea|select/i.test(event.target.tagName))
        return;
      const key = event.key.toLowerCase();
      this.keyState.add(key);
      this.registerInteraction();
      if (KEYBOARD_BINDINGS.focus.includes(key)) {
        this.focusUnderPointer();
      }
      if (KEYBOARD_BINDINGS.autoRotate.includes(key)) {
        this.toggleAutoRotate();
      }
    };
    this.handleKeyUp = (event) => {
      const key = event.key.toLowerCase();
      this.keyState.delete(key);
      this.registerInteraction();
    };
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);

    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.focusTargets = null;
    this.lastPointer = { x: 0, y: 0 };
    this.handleMouseMove = (event) => {
      const rect = this.cnvs.getBoundingClientRect();
      this.lastPointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.lastPointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.registerInteraction();
    };
    this.cnvs.addEventListener("mousemove", this.handleMouseMove);
    this.handleDoubleClick = (event) => {
      const rect = this.cnvs.getBoundingClientRect();
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      const targets = this.focusTargets || this.scene.children;
      this.raycaster.setFromCamera(this.pointer, this.cam);
      const intersections = this.raycaster.intersectObjects(targets, true);
      if (intersections.length > 0) {
        this.focusOnPoint(intersections[0].point);
      }
    };
    this.cnvs.addEventListener("dblclick", this.handleDoubleClick);
    this.handlePointerDown = () => {
      this.registerInteraction();
    };
    this.cnvs.addEventListener("pointerdown", this.handlePointerDown);
    this.handleWheel = () => {
      this.registerInteraction();
    };
    this.cnvs.addEventListener("wheel", this.handleWheel, { passive: true });

    this.hdrLoader = new HDRLoader();

    this.pane = new Pane(); // Commented out if not used directly here

    // --- Event Listeners ---
    this.boundResizeHandler = this.handleWindowResize.bind(this);
    window.addEventListener("resize", this.boundResizeHandler);

    this.orientationHandler = () => {
      console.log("Orientation changed, handling resize...");
      setTimeout(() => this.handleWindowResize(), 120);
    };
    window.addEventListener("orientationchange", this.orientationHandler);
  }

  isMobileDevice() {
    // Consider a more robust check or using window.matchMedia
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  setFocusTargets(objects) {
    if (!objects) {
      this.focusTargets = null;
      return;
    }
    this.focusTargets = Array.isArray(objects) ? objects : [objects];
  }

  registerInteraction() {
    this.autoRotate.lastInteraction = performance.now();
    if (this.autoRotate.enabled && !this.autoRotate.sticky) {
      this.autoRotate.enabled = false;
      this.persistSettings();
    }
  }

  saveCameraBookmark(name, silent = false) {
    if (!name) return;
    this.cameraBookmarks.set(name, {
      position: this.cam.position.clone(),
      target: this.orbCtrls.target.clone(),
    });
    if (!silent) this.persistBookmarks();
  }

  removeCameraBookmark(name) {
    if (!name) return;
    this.cameraBookmarks.delete(name);
    this.persistBookmarks();
  }

  listCameraBookmarks() {
    return Array.from(this.cameraBookmarks.keys());
  }

  getCameraBookmark(name) {
    return this.cameraBookmarks.get(name);
  }

  goToBookmark(name, duration = 0.8) {
    const bookmark = this.cameraBookmarks.get(name);
    if (!bookmark) {
      console.warn(`[Setup] Bookmark '${name}' not found.`);
      return;
    }
    this.flyToTarget(bookmark.position, bookmark.target, duration);
  }

  setAutoRotate(enabled, sticky = false) {
    this.autoRotate.enabled = Boolean(enabled);
    this.autoRotate.sticky = Boolean(sticky);
    this.autoRotate.lastInteraction = performance.now();
    this.persistSettings();
  }

  toggleAutoRotate() {
    this.autoRotate.enabled = !this.autoRotate.enabled;
    this.autoRotate.sticky = this.autoRotate.enabled;
    this.autoRotate.lastInteraction = performance.now();
    this.persistSettings();
    console.log(`[Setup] Auto rotate ${this.autoRotate.enabled ? "enabled" : "disabled"}.`);
  }

  setAutoRotateSpeed(degPerSecond) {
    const value = THREE.MathUtils.degToRad(Math.max(0, degPerSecond));
    this.autoRotate.speed = value;
    this.persistSettings();
  }

  setPanEnabled(enabled = true) {
    this.orbCtrls.enablePan = Boolean(enabled);
  }

  setZoomEnabled(enabled = true) {
    this.orbCtrls.enableZoom = Boolean(enabled);
  }

  setRotateEnabled(enabled = true) {
    this.orbCtrls.enableRotate = Boolean(enabled);
  }

  setDistanceLimits(minDistance = this.orbCtrls.minDistance, maxDistance = this.orbCtrls.maxDistance) {
    if (typeof minDistance === "number" && !Number.isNaN(minDistance)) {
      this.orbCtrls.minDistance = Math.max(0.1, minDistance);
    }
    if (typeof maxDistance === "number" && !Number.isNaN(maxDistance)) {
      this.orbCtrls.maxDistance = Math.max(this.orbCtrls.minDistance + 1, maxDistance);
    }
  }

  setTargetBounds(bounds) {
    if (!bounds) return;
    if (bounds.min) this.targetBounds.min = bounds.min.clone();
    if (bounds.max) this.targetBounds.max = bounds.max.clone();
  }

  focusOnPoint(point, duration = this.keyboardConfig.focusDuration) {
    if (!point) return;
    const clamped = point.clone();
    this.clampTarget(clamped);
    const offset = this.cam.position.clone().sub(this.orbCtrls.target);
    if (offset.lengthSq() === 0) {
      offset.set(60, 60, 60);
    }
    const newPosition = clamped.clone().add(offset);
    this.registerInteraction();
    this.flyToTarget(newPosition, clamped, duration);
  }

  focusUnderPointer() {
    if (!this.lastPointer) return;
    this.pointer.x = this.lastPointer.x;
    this.pointer.y = this.lastPointer.y;
    const targets = this.focusTargets || this.scene.children;
    this.raycaster.setFromCamera(this.pointer, this.cam);
    const intersections = this.raycaster.intersectObjects(targets, true);
    if (intersections.length > 0) {
      this.focusOnPoint(intersections[0].point);
    }
  }

  flyToTarget(targetPosition, targetLookAt, duration = 0.8) {
    if (!targetPosition || !targetLookAt) return;

    const startPosition = this.cam.position.clone();
    const startTarget = this.orbCtrls.target.clone();
    const toPos = targetPosition.clone();
    const toTarget = targetLookAt.clone();
    this.clampTarget(toTarget);

    const offset = toPos.clone().sub(toTarget);
    const distance = offset.length();
    const min = this.orbCtrls.minDistance;
    const max = this.orbCtrls.maxDistance;
    if (distance < min) offset.setLength(min);
    if (distance > max) offset.setLength(max);
    const finalPosition = toTarget.clone().add(offset);

    const startTime = this.clock.getElapsedTime();
    const animate = () => {
      const elapsed = this.clock.getElapsedTime() - startTime;
      const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 1;
      const ease = duration > 0 ? 1 - Math.pow(1 - progress, 3) : 1;
      this.cam.position.lerpVectors(startPosition, finalPosition, ease);
      this.orbCtrls.target.lerpVectors(startTarget, toTarget, ease);
      this.cam.lookAt(this.orbCtrls.target);
      this.applyConstraints();
      this.orbCtrls.update();
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.cam.position.copy(finalPosition);
        this.orbCtrls.target.copy(toTarget);
        this.isCameraAnimating = false;
        this.orbCtrls.enabled = true;
        this.orbCtrls.update();
        this.persistCameraState();
      }
    };

    this.isCameraAnimating = true;
    this.orbCtrls.enabled = false;
    if (duration > 0) {
      requestAnimationFrame(animate);
    } else {
      this.cam.position.copy(finalPosition);
      this.orbCtrls.target.copy(toTarget);
      this.orbCtrls.enabled = true;
      this.isCameraAnimating = false;
      this.orbCtrls.update();
      this.persistCameraState();
    }
  }

  clampTarget(target) {
    target.x = THREE.MathUtils.clamp(
      target.x,
      this.targetBounds.min.x,
      this.targetBounds.max.x,
    );
    target.y = THREE.MathUtils.clamp(
      target.y,
      this.targetBounds.min.y,
      this.targetBounds.max.y,
    );
    target.z = THREE.MathUtils.clamp(
      target.z,
      this.targetBounds.min.z,
      this.targetBounds.max.z,
    );
  }

  updateKeyboardNavigation(delta) {
    if (this.isCameraAnimating || this.keyState.size === 0) return;
    const hasKey = (binding) =>
      binding.some((key) => this.keyState.has(key.toLowerCase()));

    const forward = new THREE.Vector3();
    this.cam.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() > 0) forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, this.cam.up).normalize();

    const horizontal = new THREE.Vector3();
    if (hasKey(KEYBOARD_BINDINGS.forward)) horizontal.add(forward);
    if (hasKey(KEYBOARD_BINDINGS.backward)) horizontal.addScaledVector(forward, -1);
    if (hasKey(KEYBOARD_BINDINGS.left)) horizontal.addScaledVector(right, -1);
    if (hasKey(KEYBOARD_BINDINGS.right)) horizontal.add(right);

    let moved = false;
    if (horizontal.lengthSq() > 0) {
      horizontal
        .normalize()
        .multiplyScalar(this.keyboardConfig.panSpeed * delta);
      this.cam.position.add(horizontal);
      this.orbCtrls.target.add(horizontal);
      moved = true;
    }

    let verticalDelta = 0;
    if (hasKey(KEYBOARD_BINDINGS.up)) verticalDelta += this.keyboardConfig.verticalSpeed * delta;
    if (hasKey(KEYBOARD_BINDINGS.down)) verticalDelta -= this.keyboardConfig.verticalSpeed * delta;
    if (verticalDelta !== 0) {
      this.cam.position.y += verticalDelta;
      this.orbCtrls.target.y += verticalDelta;
      moved = true;
    }
    if (moved) this.registerInteraction();
  }

  applyConstraints() {
    this.clampTarget(this.orbCtrls.target);
    const offset = this.cam.position.clone().sub(this.orbCtrls.target);
    const distance = offset.length();
    const min = this.orbCtrls.minDistance;
    const max = this.orbCtrls.maxDistance;
    if (distance < min) offset.setLength(min);
    if (distance > max) offset.setLength(max);
    this.cam.position.copy(this.orbCtrls.target).add(offset);
  }

  persistCameraState() {
    if (typeof localStorage === "undefined") return;
    try {
      const payload = JSON.stringify({
        position: this.cam.position,
        target: this.orbCtrls.target,
      });
      localStorage.setItem("smartCampus.camera.state", payload);
      this.persistSettings();
    } catch (error) {
      console.warn("[Setup] Unable to persist camera state:", error);
    }
  }

  persistBookmarks() {
    if (typeof localStorage === "undefined") return;
    try {
      const serialized = Array.from(this.cameraBookmarks.entries()).map(
        ([name, data]) => ({
          name,
          position: data.position,
          target: data.target,
        }),
      );
      localStorage.setItem(
        "smartCampus.camera.bookmarks",
        JSON.stringify(serialized),
      );
      this.persistSettings();
    } catch (error) {
      console.warn("[Setup] Unable to persist camera bookmarks:", error);
    }
  }

  persistSettings() {
    if (typeof localStorage === "undefined") return;
    try {
      const payload = {
        autoRotate: {
          enabled: this.autoRotate.enabled,
          speed: this.autoRotate.speed,
          idleDelay: this.autoRotate.idleDelay,
          sticky: this.autoRotate.sticky,
        },
        keyboard: { ...this.keyboardConfig },
        bounds: {
          min: this.targetBounds.min,
          max: this.targetBounds.max,
        },
      };
      localStorage.setItem(
        "smartCampus.camera.settings",
        JSON.stringify(payload),
      );
    } catch (error) {
      console.warn("[Setup] Unable to persist camera settings:", error);
    }
  }

  restoreCameraState() {
    if (typeof localStorage === "undefined") return;
    try {
      const rawState = localStorage.getItem("smartCampus.camera.state");
      if (rawState) {
        const state = JSON.parse(rawState);
        if (state?.position && state?.target) {
          this.cam.position.set(state.position.x, state.position.y, state.position.z);
          this.orbCtrls.target.set(state.target.x, state.target.y, state.target.z);
          this.cam.lookAt(this.orbCtrls.target);
        }
      }
      const rawBookmarks = localStorage.getItem("smartCampus.camera.bookmarks");
      if (rawBookmarks) {
        JSON.parse(rawBookmarks).forEach((entry) => {
          if (entry?.name && entry.position && entry.target) {
            this.cameraBookmarks.set(entry.name, {
              position: new THREE.Vector3(
                entry.position.x,
                entry.position.y,
                entry.position.z,
              ),
              target: new THREE.Vector3(
                entry.target.x,
                entry.target.y,
                entry.target.z,
              ),
            });
          }
        });
      }
      const rawSettings = localStorage.getItem("smartCampus.camera.settings");
      if (rawSettings) {
        const settings = JSON.parse(rawSettings);
        if (settings?.autoRotate) {
          this.autoRotate.enabled = Boolean(settings.autoRotate.enabled);
          if (Number.isFinite(settings.autoRotate.speed))
            this.autoRotate.speed = settings.autoRotate.speed;
          if (Number.isFinite(settings.autoRotate.idleDelay))
            this.autoRotate.idleDelay = settings.autoRotate.idleDelay;
          if (typeof settings.autoRotate.sticky === "boolean")
            this.autoRotate.sticky = settings.autoRotate.sticky;
        }
        if (settings?.keyboard) {
          Object.assign(this.keyboardConfig, settings.keyboard);
        }
        if (settings?.bounds) {
          if (settings.bounds.min)
            this.targetBounds.min = new THREE.Vector3(
              settings.bounds.min.x,
              settings.bounds.min.y,
              settings.bounds.min.z,
            );
          if (settings.bounds.max)
            this.targetBounds.max = new THREE.Vector3(
              settings.bounds.max.x,
              settings.bounds.max.y,
              settings.bounds.max.z,
            );
        }
      }
    } catch (error) {
      console.warn("[Setup] Unable to restore camera state/bookmarks:", error);
    }
    this.autoRotate.lastInteraction = performance.now();
  }

  update(delta = this.clock.getDelta()) {
    this.updateKeyboardNavigation(delta);
    this.updateAutoRotate(delta);
    this.applyConstraints();
    this.orbCtrls.update();
    this.persistThrottle += delta;
    if (this.persistThrottle >= 1.5) {
      this.persistCameraState();
      this.persistThrottle = 0;
    }
  }

  updateAutoRotate(delta) {
    if (!this.autoRotate.enabled) return;
    const now = performance.now();
    const requiredIdle = this.autoRotate.sticky
      ? Math.min(this.autoRotate.idleDelay, 1000)
      : this.autoRotate.idleDelay;
    if (now - this.autoRotate.lastInteraction < requiredIdle) return;
    const offset = this.cam.position.clone().sub(this.orbCtrls.target);
    if (offset.lengthSq() === 0) return;
    const rotation = new THREE.Matrix4().makeRotationY(
      this.autoRotate.speed * delta,
    );
    offset.applyMatrix4(rotation);
    this.cam.position.copy(this.orbCtrls.target).add(offset);
    this.cam.lookAt(this.orbCtrls.target);
  }

  setEnvMap(url) {
    this.hdrLoader.load(
      url,
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.environment = texture; // Set environment map for reflections
        // Keep sky dome visible by letting background stay managed elsewhere
        if (this.scene.background === texture) {
          this.scene.background = null;
        }
        console.log(`[Setup] Environment map loaded from ${url}`);
        texture.needsUpdate = true; // Ensure update
      },
      undefined, // Progress callback (optional)
      (error) => {
        console.error(
          `[Setup] Failed to load environment map from ${url}:`,
          error,
        );
      },
    );
  }

  // updateTexture is redundant if setEnvMap sets both background and environment
  // updateTexture() {
  //   this.scene.environment = this.texture;
  // }

  handleWindowResize() {
    // Call the external resize handler passed in constructor
    this.resizeHandler();
    // Ensure camera aspect is updated if resizeHandler doesn't do it
    const w = this.cnvs.clientWidth;
    const h = this.cnvs.clientHeight;
    this.cam.aspect = w / h;
    this.cam.updateProjectionMatrix();
  }

  // --- MODIFICATION START (Camera Views) ---

  /**
   * Sets a predefined camera view.
   * @param {string} viewName - Name of the view ('top', 'front', 'iso', 'default').
   * @param {number} transitionDuration - Duration of the transition in seconds (0 for instant).
   */
  setCameraView(viewName, transitionDuration = 0.8) {
    const targetPosition = new THREE.Vector3();
    const targetLookAt = new THREE.Vector3(0, 0, 0); // Assuming center is origin

    switch (viewName.toLowerCase()) {
      case "top":
        targetPosition.set(0.01, 150, 0.01); // Slight offset to avoid polar clamp jitter
        targetLookAt.set(0, 0, 0);
        break;
      case "front":
        targetPosition.set(0, 50, 150); // Front view, slightly elevated
        targetLookAt.set(0, 20, 0); // Look slightly higher than ground
        break;
      case "side":
        targetPosition.set(150, 50, 0); // Side view
        targetLookAt.set(0, 20, 0);
        break;
      case "iso": // Isometric-like view
        targetPosition.set(100, 100, 100);
        targetLookAt.set(0, 0, 0);
        break;
      case "default": // Revert to initial position (or define a specific default)
        targetPosition.set(50, 80, 100);
        targetLookAt.set(0, 0, 0);
        break;
      default:
        console.warn(`[Setup] Unknown camera view name: ${viewName}`);
        return;
    }

    console.log(`[Setup] Setting camera view to: ${viewName}`);
    this.flyToTarget(targetPosition, targetLookAt, transitionDuration);
  }
  // --- MODIFICATION END ---

  // Optional: Dispose method to clean up resources
  dispose() {
    window.removeEventListener("resize", this.boundResizeHandler);
    window.removeEventListener("orientationchange", this.orientationHandler);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.cnvs.removeEventListener("dblclick", this.handleDoubleClick);
    this.cnvs.removeEventListener("mousemove", this.handleMouseMove);
    this.cnvs.removeEventListener("pointerdown", this.handlePointerDown);
    this.cnvs.removeEventListener("wheel", this.handleWheel);
    this.orbCtrls?.dispose();
    this.stats?.dispose(); // Call dispose on the panel instance
    this.re?.dispose();
    this.scene?.traverse((object) => {
      // Dispose scene objects if Setup owns the scene
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    console.log("[Setup] Disposed resources.");
  }
}

// --- END OF FILE Setup.js (Modified) ---
