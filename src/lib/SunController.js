// src/lib/SunController.js
import * as THREE from "three";

const DEFAULT_RADIUS = 420;
const DEFAULT_SUN_COLOR = 0xffe39a;

export class SunController {
  constructor({ radius = DEFAULT_RADIUS, color = DEFAULT_SUN_COLOR } = {}) {
    this.radius = radius;
    this.group = new THREE.Group();
    this.group.name = "SunController";

    this.sphere = this.createSunSphere(color);
    this.light = this.createSunLight(color);
    this.group.add(this.sphere, this.light, this.light.target);

    this.lastUpdate = null;
  }

  createSunSphere(color) {
    const geometry = new THREE.SphereGeometry(12, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.name = "SunSprite";
    return sphere;
  }

  createSunLight(color) {
    const light = new THREE.DirectionalLight(color, 1.1);
    light.name = "SunDirectionalLight";
    light.castShadow = false;
    light.target = new THREE.Object3D();
    light.target.name = "SunLightTarget";
    light.target.position.set(0, 0, 0);
    return light;
  }

  /**
   * Converts Home Assistant azimuth/elevation (deg) to 3D coordinates.
   * @param {number} azimuthDeg
   * @param {number} elevationDeg
   * @returns {THREE.Vector3}
   */
  computeSunPosition(azimuthDeg, elevationDeg) {
    const azimuthRad = THREE.MathUtils.degToRad(azimuthDeg);
    const elevationRad = THREE.MathUtils.degToRad(elevationDeg);

    const cosEl = Math.cos(elevationRad);
    const x = this.radius * cosEl * Math.sin(azimuthRad);
    const y = this.radius * Math.sin(elevationRad);
    const z = this.radius * cosEl * Math.cos(azimuthRad);

    return new THREE.Vector3(x, y, z);
  }

  /**
   * Updates the sun position and light direction.
   * @param {{ azimuth?: number, elevation?: number }} attributes
   */
  updateFromAttributes(attributes = {}) {
    const azimuth = Number(attributes.azimuth ?? attributes.azimuth_deg);
    const elevation = Number(
      attributes.elevation ?? attributes.elevation_deg,
    );

    if (!Number.isFinite(azimuth) || !Number.isFinite(elevation)) {
      return;
    }

    const position = this.computeSunPosition(azimuth, elevation);
    this.sphere.position.copy(position);
    this.light.position.copy(position);

    // Aim the light toward the scene origin.
    this.light.target.position.set(0, 0, 0);
    this.light.target.updateMatrixWorld?.();

    // Adjust intensity based on elevation (sunset/sunrise smoothness).
    const elevationFactor = THREE.MathUtils.clamp(
      (Math.sin(THREE.MathUtils.degToRad(elevation)) + 0.1) * 1.2,
      0,
      1.6,
    );
    this.light.intensity = elevationFactor;
    this.sphere.visible = elevation > -6; // Hide when well below horizon.

    this.lastUpdate = { azimuth, elevation, at: Date.now() };
  }

  get object3d() {
    return this.group;
  }
}

