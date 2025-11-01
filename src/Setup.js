// --- START OF FILE Setup.js (Modified) ---

import * as THREE from "three";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Pane } from "tweakpane";
import { StatsGLPanel } from "@/debug/StatsGLPanel.js";
import { StatsPanel } from "@/debug/StatsPanel.js";

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
    this.orbCtrls.dampingFactor = 0.05;
    this.orbCtrls.screenSpacePanning = false; // Keep panning relative to world space
    this.orbCtrls.minDistance = 20; // Set min zoom distance
    this.orbCtrls.maxDistance = 300; // Set max zoom distance
    this.orbCtrls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent camera going below ground plane

    this.hdrLoader = new HDRLoader();

    this.pane = new Pane(); // Commented out if not used directly here

    // --- Event Listeners ---
    window.addEventListener("resize", this.handleWindowResize.bind(this)); // Use bind or arrow function

    // --- MODIFICATION START (Suggestion #5) ---
    // Replace location.reload() with call to resize handler
    window.addEventListener("orientationchange", () => {
      console.log("Orientation changed, handling resize...");
      // Optional delay to allow browser to settle dimensions
      setTimeout(() => {
        this.handleWindowResize();
      }, 100); // Adjust delay if needed
    });
    // COMMENTED OUT: Old disruptive reload logic
    // window.addEventListener("orientationchange", () => location.reload());
    // --- MODIFICATION END ---
  }

  isMobileDevice() {
    // Consider a more robust check or using window.matchMedia
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  setEnvMap(url) {
    this.hdrLoader.load(
      url,
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.background = texture; // Set background
        this.scene.environment = texture; // Set environment map for reflections
        // this.texture = texture; // Storing separately might be redundant
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
        targetPosition.set(0, 150, 0); // Directly above
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

    // Stop any ongoing OrbitControls movement
    this.orbCtrls.enabled = false; // Temporarily disable controls during transition

    // Use GSAP or a similar library for smooth transitions if available
    // Example using a simple Lerp loop if GSAP isn't imported/available
    const startPosition = this.cam.position.clone();
    const startLookAt = this.orbCtrls.target.clone(); // Use controls target for smooth lookAt transition
    const startTime = this.clock.getElapsedTime();

    const animateView = () => {
      const elapsed = this.clock.getElapsedTime() - startTime;
      const progress = Math.min(elapsed / transitionDuration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      this.cam.position.lerpVectors(
        startPosition,
        targetPosition,
        easeProgress,
      );
      this.orbCtrls.target.lerpVectors(startLookAt, targetLookAt, easeProgress);
      this.cam.lookAt(this.orbCtrls.target); // Ensure camera always looks at the interpolated target
      this.orbCtrls.update(); // Required for damping and target updates

      if (progress < 1) {
        requestAnimationFrame(animateView);
      } else {
        // Ensure final position and target are set precisely
        this.cam.position.copy(targetPosition);
        this.orbCtrls.target.copy(targetLookAt);
        this.cam.lookAt(this.orbCtrls.target);
        this.orbCtrls.enabled = true; // Re-enable controls
        this.orbCtrls.update(); // Final update
        console.log(`[Setup] Camera view '${viewName}' set.`);
      }
    };

    if (transitionDuration > 0) {
      requestAnimationFrame(animateView);
    } else {
      // Instant change
      this.cam.position.copy(targetPosition);
      this.orbCtrls.target.copy(targetLookAt);
      this.cam.lookAt(this.orbCtrls.target);
      this.orbCtrls.enabled = true;
      this.orbCtrls.update();
      console.log(`[Setup] Camera view '${viewName}' set instantly.`);
    }
  }
  // --- MODIFICATION END ---

  // Optional: Dispose method to clean up resources
  dispose() {
    window.removeEventListener("resize", this.handleWindowResize.bind(this));
    window.removeEventListener("orientationchange", this.handleWindowResize); // Ensure correct listener removal
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
