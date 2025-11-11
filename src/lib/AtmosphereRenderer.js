/**
 * AtmosphereRenderer
 *
 * Integrates @takram/three-atmosphere for realistic sky rendering.
 *
 * Features:
 * - Precomputed atmospheric scattering (Mie/Rayleigh)
 * - Sky color updates per sun position (dawn/dusk/noon/night)
 * - Aerial perspective effects
 * - WebGPU support (when available)
 *
 * References:
 * - https://github.com/takram-design-engineering/three-geospatial/tree/main/packages/atmosphere
 * - npm: @takram/three-atmosphere v0.15.1
 */

import * as THREE from 'three';

// Lazy-load atmosphere to handle import errors
let Atmosphere, SkyMaterial, SunDirectionalLight, PrecomputedTexturesLoader, AtmosphereParameters;
let atmosphereLoaded = false;
let atmosphereLoadError = null;

async function loadAtmosphere() {
  if (atmosphereLoaded || atmosphereLoadError) return;

  try {
    const imports = await import('@takram/three-atmosphere');
    Atmosphere = imports.Atmosphere || imports.default?.Atmosphere;
    SkyMaterial = imports.SkyMaterial || imports.default?.SkyMaterial;
    SunDirectionalLight = imports.SunDirectionalLight || imports.default?.SunDirectionalLight;
    PrecomputedTexturesLoader = imports.PrecomputedTexturesLoader || imports.default?.PrecomputedTexturesLoader;
    AtmosphereParameters = imports.AtmosphereParameters || imports.default?.AtmosphereParameters;

    if (!Atmosphere) {
      throw new Error('Atmosphere class not found in module exports');
    }
    atmosphereLoaded = true;
    console.log('[AtmosphereRenderer] Atmosphere module loaded successfully');
  } catch (err) {
    atmosphereLoadError = err;
    console.warn('[AtmosphereRenderer] Failed to load Atmosphere module:', err.message);
  }
}

/**
 * Default atmosphere parameters
 */
const DEFAULT_PARAMS = {
  // Standard Earth atmosphere
  rayleighScatteringCoefficient: 0.005,
  mieScatteringCoefficient: 0.004,
  aerosolDensityHeightScale: 1200, // meters

  // Sun configuration
  sunDistance: 149597870700, // 1 AU in meters
  sunIntensity: 100000, // W/m²

  // Air density profile
  airDensityHeightScale: 8500, // meters (scale height)
  aerosolAsymmetryFactor: 0.8,
};

/**
 * Atmosphere state manager + renderer
 */
export class AtmosphereRenderer {
  /**
   * @param {THREE.Scene} scene
   * @param {THREE.Camera} camera
   * @param {Object} options
   */
  constructor(scene, camera, options = {}) {
    if (!scene || !(scene instanceof THREE.Scene)) {
      throw new Error('AtmosphereRenderer: scene (THREE.Scene) is required');
    }
    if (!camera || !(camera instanceof THREE.Camera)) {
      throw new Error('AtmosphereRenderer: camera (THREE.Camera) is required');
    }

    this.scene = scene;
    this.camera = camera;
    this.params = { ...DEFAULT_PARAMS, ...options };

    // Atmosphere core instance
    this.atmosphere = null;
    this.skyMaterial = null;
    this.skyMesh = null;
    this.sunLight = null;
    this.precomputedTextures = null;

    // Async initialization flag
    this.ready = false;
    this.initPromise = this._init();
  }

  /**
   * Initialize atmosphere system (async due to texture loading)
   */
  async _init() {
    try {
      // Load atmosphere module first
      await loadAtmosphere();

      if (atmosphereLoadError) {
        throw atmosphereLoadError;
      }

      if (!Atmosphere) {
        throw new Error('Atmosphere module could not be loaded');
      }

      // Create Atmosphere instance
      const params = new AtmosphereParameters({
        rayleighScatteringCoefficient: this.params.rayleighScatteringCoefficient,
        mieScatteringCoefficient: this.params.mieScatteringCoefficient,
      });

      this.atmosphere = new Atmosphere(params);

      // Load precomputed textures (LUT)
      // Note: This may take time on first load; consider caching in IndexedDB
      const loader = new PrecomputedTexturesLoader();
      this.precomputedTextures = await loader.load(
        this.atmosphere.parameters
      );

      // Create sky material & mesh
      this._createSkyMesh();

      // Create sun light
      this._createSunLight();

      this.ready = true;
      console.log('[AtmosphereRenderer] Initialized successfully');
    } catch (err) {
      console.error('[AtmosphereRenderer] Initialization failed:', err);
      this.ready = false;
      // Don't throw - allow graceful degradation if atmosphere fails
    }
  }

  /**
   * Create sky dome mesh with atmosphere shader
   */
  _createSkyMesh() {
    if (!this.precomputedTextures) return;

    // Create a large sphere for sky background
    const geometry = new THREE.SphereGeometry(5000, 64, 64);

    // Use SkyMaterial from three-atmosphere
    // which handles the atmospheric rendering
    this.skyMaterial = new SkyMaterial({
      // Textures from precomputed LUT
      transmittanceTexture: this.precomputedTextures.transmittanceTexture,
      scatteringTexture: this.precomputedTextures.scatteringTexture,
      irradianceTexture: this.precomputedTextures.irradianceTexture,

      // Sun direction (will be updated per frame)
      sunDirection: new THREE.Vector3(0, 1, 0),

      // Exposure control
      exposure: 1.0,
    });

    this.skyMesh = new THREE.Mesh(geometry, this.skyMaterial);
    this.skyMesh.name = 'AtmosphereSkyMesh';

    // Sky should not be affected by frustum culling
    this.skyMesh.frustumCulled = false;

    // Add to scene
    this.scene.add(this.skyMesh);
  }

  /**
   * Create sun directional light with atmosphere-aware color
   */
  _createSunLight() {
    // Use SunDirectionalLight from three-atmosphere
    // which applies atmospheric color correction
    this.sunLight = new SunDirectionalLight();
    this.sunLight.name = 'AtmosphereSunLight';

    // Default position (will be updated per frame)
    this.sunLight.position.set(0, 300, 300);
    this.sunLight.castShadow = false; // Defer shadow updates to GEO-502

    // Add to scene
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);
  }

  /**
   * Update sky & sun colors based on sun position
   *
   * @param {number} sunAzimuth - degrees (0-360)
   * @param {number} sunElevation - degrees (-18 to 90)
   */
  update(sunAzimuth, sunElevation) {
    if (!this.ready || !this.skyMaterial || !this.sunLight) return;

    // Convert azimuth/elevation to direction vector
    const azRad = THREE.MathUtils.degToRad(sunAzimuth);
    const elRad = THREE.MathUtils.degToRad(sunElevation);

    const cosEl = Math.cos(elRad);
    const sunDir = new THREE.Vector3(
      Math.sin(azRad) * cosEl,
      Math.sin(elRad),
      Math.cos(azRad) * cosEl
    ).normalize();

    // Update sky material
    this.skyMaterial.sunDirection = sunDir;

    // Update sun light
    const sunDist = 10000; // Arbitrary large distance
    this.sunLight.position.copy(sunDir).multiplyScalar(sunDist);
    this.sunLight.target.position.set(0, 0, 0);

    // Adjust sun light intensity based on elevation
    // Sun below horizon = dimmer
    const elevation = Math.max(-18, sunElevation); // Twilight zone
    const elevationNorm = (elevation + 18) / (90 + 18); // 0..1
    this.sunLight.intensity = Math.max(0, Math.min(1.5, elevationNorm));

    // Adjust camera-relative sky mesh position (follow camera)
    if (this.skyMesh) {
      this.skyMesh.position.copy(this.camera.position);
    }
  }

  /**
   * Adjust atmosphere parameters at runtime
   * (useful for weather effects later)
   */
  setParameters(newParams) {
    if (newParams.rayleighScatteringCoefficient) {
      this.params.rayleighScatteringCoefficient = newParams.rayleighScatteringCoefficient;
    }
    if (newParams.mieScatteringCoefficient) {
      this.params.mieScatteringCoefficient = newParams.mieScatteringCoefficient;
    }
    // TODO: Regenerate LUT if parameters change significantly
    console.warn('[AtmosphereRenderer] Parameter updates require LUT regeneration (not yet implemented)');
  }

  /**
   * Set sky material exposure (brightness control)
   */
  setExposure(exposure) {
    if (this.skyMaterial) {
      this.skyMaterial.exposure = exposure;
    }
  }

  /**
   * Cleanup and dispose
   */
  dispose() {
    if (this.skyMesh) {
      this.skyMesh.geometry.dispose();
      if (this.skyMaterial) {
        // Dispose textures if they exist
        if (this.skyMaterial.transmittanceTexture) {
          this.skyMaterial.transmittanceTexture.dispose();
        }
        if (this.skyMaterial.scatteringTexture) {
          this.skyMaterial.scatteringTexture.dispose();
        }
        if (this.skyMaterial.irradianceTexture) {
          this.skyMaterial.irradianceTexture.dispose();
        }
        this.skyMaterial.dispose();
      }
      this.scene.remove(this.skyMesh);
    }

    if (this.sunLight) {
      this.scene.remove(this.sunLight);
      this.scene.remove(this.sunLight.target);
    }

    this.precomputedTextures = null;
    this.atmosphere = null;
    this.ready = false;
  }
}
