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
import { getSunPosition, getMoonPositionExtended } from '@utils/astronomy.js';

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

      // IMPORTANT: Disable SunController's DirectionalLight
      // AtmosphereRenderer provides a superior, atmosphere-aware sun light
      // Keeping both would cause double-illumination artifacts
      if (this.sunController.light) {
        this.sunController.light.intensity = 0; // Disabled; use AtmosphereRenderer.sunLight instead
      }
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
      this.moonController.update({ date: this.currentDate });
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
   * Uses SunCalc (proven, lightweight ephemeris algorithm)
   *
   * @param {Date} date
   * @returns {Object} { azimuth, elevation } in degrees
   */
  _calculateSunPosition(date) {
    try {
      return getSunPosition(date, this.location.latitude, this.location.longitude);
    } catch (err) {
      console.warn('[GeospatialManager] Sun position calculation failed, using fallback:', err);
      // Rough fallback if calculation fails
      const msPerDay = 86400000;
      const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / msPerDay);
      const dayFraction = (date.getHours() * 60 + date.getMinutes()) / 1440;

      return {
        azimuth: (dayFraction * 360 + 180) % 360,
        elevation: 45 * Math.sin(((dayOfYear - 80) / 365) * Math.PI * 2 - Math.PI / 2),
      };
    }
  }

  /**
   * Calculate moon position (azimuth, elevation, phase, illumination)
   *
   * @param {Date} date
   * @returns {Object} { azimuth, elevation, phase, illumination }
   */
  _calculateMoonPosition(date) {
    try {
      return getMoonPositionExtended(date, this.location.latitude, this.location.longitude);
    } catch (err) {
      console.warn('[GeospatialManager] Moon position calculation failed:', err);
      return {
        azimuth: 270,
        elevation: -45,
        phase: 0.5,
        illumination: 0.5,
      };
    }
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
