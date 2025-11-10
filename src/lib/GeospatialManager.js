/**
 * GeospatialManager
 *
 * Orchestrates geospatial rendering for Smart Campus 3D:
 * - Sun positioning & lighting (via SunController)
 * - Moon positioning & phases (via MoonController)
 * - Atmospheric rendering (via three-geospatial atmosphere)
 * - Volumetric clouds (via three-geospatial clouds)
 * - Dynamic lighting based on sun position
 *
 * Architecture:
 * GeospatialManager
 *   ├─ SunController (existing)
 *   ├─ MoonController (existing)
 *   ├─ SunSkyDome (existing)
 *   ├─ AtmosphereRenderer (new; wraps @takram/three-atmosphere)
 *   ├─ CloudSystem (new; wraps @takram/three-clouds)
 *   └─ locationConfig (from src/data/geospatial/locationConfig.js)
 */

import * as THREE from 'three';
import { LOCATION_CONFIG, getEffectiveLocation } from '@data/geospatial/locationConfig.js';
import { SunController } from './SunController.js';
import { MoonController } from './MoonController.js';
import { SunSkyDome } from './SunSkyDome.js';
import { AtmosphereRenderer } from './AtmosphereRenderer.js';

/**
 * Default settings
 */
const DEFAULTS = {
  // Time control
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  day: new Date().getDate(),
  hours: new Date().getHours(),
  minutes: new Date().getMinutes(),
  seconds: new Date().getSeconds(),

  // Sun/Moon visibility
  sunEnabled: true,
  moonEnabled: true,
  atmosphereEnabled: true,
  cloudsEnabled: true,

  // Cloud coverage (0-100%)
  cloudCoverage: 30,
};

export class GeospatialManager {
  /**
   * @param {Object} scene - Three.js Scene instance
   * @param {Object} options - Configuration options
   */
  constructor(scene, options = {}) {
    if (!scene || !(scene instanceof THREE.Scene)) {
      throw new Error('GeospatialManager: scene (THREE.Scene) is required');
    }

    this.scene = scene;
    this.config = { ...DEFAULTS, ...options };

    // Time state
    this.currentDate = new Date(
      this.config.year,
      this.config.month - 1,
      this.config.day,
      this.config.hours,
      this.config.minutes,
      this.config.seconds
    );

    // Effective location (respects test location if enabled)
    this.location = getEffectiveLocation();

    // Controller instances
    this.sunController = null;
    this.moonController = null;
    this.sunSkyDome = null;
    this.atmosphereRenderer = null; // TODO: implement
    this.cloudSystem = null; // TODO: implement

    // Group to hold all geospatial objects
    this.group = new THREE.Group();
    this.group.name = 'GeospatialManager';

    // Initialize controllers
    this._initControllers();
    this._attachToScene();
  }

  /**
   * Initialize all sub-controllers
   */
  _initControllers() {
    // Sun
    if (this.config.sunEnabled) {
      this.sunController = new SunController();
      this.group.add(this.sunController.group);
    }

    // Moon
    if (this.config.moonEnabled) {
      this.moonController = new MoonController({
        siteCoords: {
          lat: this.location.latitude,
          lng: this.location.longitude,
        },
      });
      this.group.add(this.moonController.group);
    }

    // Sky dome (visual background)
    this.sunSkyDome = new SunSkyDome();
    this.group.add(this.sunSkyDome.mesh);

    // Atmosphere (@takram/three-atmosphere)
    if (this.config.atmosphereEnabled) {
      // AtmosphereRenderer initialization is async; will be ready after _init completes
      this.atmosphereRenderer = new AtmosphereRenderer(
        this.scene,
        this.scene.camera || new THREE.PerspectiveCamera()
      );
    }

    // Clouds (stub for now)
    // TODO: Initialize @takram/three-clouds
  }

  /**
   * Attach manager group to scene
   */
  _attachToScene() {
    this.scene.add(this.group);
  }

  /**
   * Update all systems based on current date/time
   * Call this every frame or when time changes
   */
  update() {
    // Update sun position
    if (this.sunController) {
      const sunPos = this._calculateSunPosition(this.currentDate);
      this.sunController.update(sunPos.azimuth, sunPos.elevation);
      this._updateSkyDomeColor(sunPos.elevation);
    }

    // Update moon position & phase
    if (this.moonController) {
      this.moonController.update(this.currentDate);
    }

    // Update atmosphere color (tied to sun position)
    if (this.atmosphereRenderer && this.atmosphereRenderer.ready) {
      const sunPos = this._calculateSunPosition(this.currentDate);
      this.atmosphereRenderer.update(sunPos.azimuth, sunPos.elevation);
    }

    // Update cloud coverage
    if (this.cloudSystem) {
      this.cloudSystem.update();
    }
  }

  /**
   * Calculate sun azimuth & elevation for given date/time
   * Uses suncalc library (bundled via three-geospatial)
   *
   * @param {Date} date
   * @returns {Object} { azimuth, elevation } in degrees
   */
  _calculateSunPosition(date) {
    // TODO: Integrate with three-geospatial's astronomy-engine
    // For now, use stub calculation
    const msPerDay = 86400000;
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / msPerDay);
    const dayFraction = (date.getHours() * 60 + date.getMinutes()) / 1440;

    // Very rough approximation (replace with actual ephemeris)
    const elevation = 45 * Math.sin((dayOfYear / 365) * Math.PI * 2 - Math.PI / 2);
    const azimuth = (dayFraction * 360 + 180) % 360;

    return { azimuth, elevation };
  }

  /**
   * Update sky dome color based on sun elevation
   * Creates realistic dawn/dusk/noon/night gradients
   */
  _updateSkyDomeColor(elevationDeg) {
    if (!this.sunSkyDome) return;

    // Update sky dome palette based on sun elevation
    // This will be enhanced once three-geospatial atmosphere is integrated
    const elevation = Math.max(-18, Math.min(90, elevationDeg)); // Clamp to twilight range

    // TODO: Use three-geospatial atmosphere LUT to update sky color
    // this.sunSkyDome.updatePaletteForElevation(elevation);
  }

  /**
   * Set current time
   * @param {Date} date
   */
  setTime(date) {
    this.currentDate = new Date(date);
    this.update();
  }

  /**
   * Set current date
   * @param {number} year
   * @param {number} month (1-12)
   * @param {number} day
   */
  setDate(year, month, day) {
    this.currentDate.setFullYear(year, month - 1, day);
    this.update();
  }

  /**
   * Get current date as JS Date object
   */
  getDate() {
    return new Date(this.currentDate);
  }

  /**
   * Set cloud coverage (0-100%)
   */
  setCloudCoverage(coverage) {
    this.config.cloudCoverage = Math.max(0, Math.min(100, coverage));
    if (this.cloudSystem) {
      this.cloudSystem.setCoverage(this.config.cloudCoverage);
    }
  }

  /**
   * Get cloud coverage (0-100%)
   */
  getCloudCoverage() {
    return this.config.cloudCoverage;
  }

  /**
   * Toggle sun visibility
   */
  setSunEnabled(enabled) {
    this.config.sunEnabled = enabled;
    if (this.sunController) {
      this.sunController.group.visible = enabled;
    }
  }

  /**
   * Toggle moon visibility
   */
  setMoonEnabled(enabled) {
    this.config.moonEnabled = enabled;
    if (this.moonController) {
      this.moonController.group.visible = enabled;
    }
  }

  /**
   * Cleanup and destroy
   */
  dispose() {
    if (this.sunController) {
      // this.sunController.dispose?.();
    }
    if (this.moonController) {
      // this.moonController.dispose?.();
    }
    if (this.sunSkyDome) {
      // this.sunSkyDome.dispose?.();
    }
    if (this.atmosphereRenderer) {
      this.atmosphereRenderer.dispose?.();
    }
    if (this.cloudSystem) {
      this.cloudSystem.dispose?.();
    }
    this.scene.remove(this.group);
  }
}
