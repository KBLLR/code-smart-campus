// src/lib/MoonController.js
import * as THREE from "three";
import {
  getMoonPosition,
  getMoonIllumination,
  normalizeAzimuthDegrees,
  toDegrees,
} from "@utils/astronomy.js";

const DEFAULT_RADIUS = 420;
const DEFAULT_COLOR = 0x9ab0ff;
const DEFAULT_INTENSITY = 0.25;

export class MoonController {
  constructor({
    radius = DEFAULT_RADIUS,
    color = DEFAULT_COLOR,
    intensity = DEFAULT_INTENSITY,
    siteCoords,
  } = {}) {
    if (!siteCoords || !Number.isFinite(siteCoords.lat) || !Number.isFinite(siteCoords.lng)) {
      throw new Error("MoonController: siteCoords with lat/lng is required.");
    }

    this.radius = radius;
    this.siteCoords = siteCoords;

    this.group = new THREE.Group();
    this.group.name = "MoonController";

    this.sphere = this.createMoonSphere(color);
    this.light = this.createMoonLight(color, intensity);

    this.group.add(this.sphere);
    this.group.add(this.light);
    this.group.add(this.light.target);

    this.lastUpdate = null;
    this.lastPhase = null;
  }

  createMoonSphere(color) {
    const geometry = new THREE.SphereGeometry(10, 24, 24);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "MoonSprite";
    return mesh;
  }

  createMoonLight(color, intensity) {
    const light = new THREE.DirectionalLight(color, intensity);
    light.name = "MoonDirectionalLight";
    light.castShadow = false;
    light.target = new THREE.Object3D();
    light.target.name = "MoonLightTarget";
    light.target.position.set(0, 0, 0);
    return light;
  }

  computePosition(date = new Date()) {
    const pos = getMoonPosition(date, this.siteCoords.lat, this.siteCoords.lng);
    const azimuthDeg = normalizeAzimuthDegrees(pos.azimuth);
    const altitudeDeg = toDegrees(pos.altitude);
    const azimuthRad = THREE.MathUtils.degToRad(azimuthDeg);
    const altitudeRad = THREE.MathUtils.degToRad(altitudeDeg);

    const r = this.radius;
    return {
      position: new THREE.Vector3(
        Math.sin(azimuthRad) * Math.cos(altitudeRad) * r,
        Math.sin(altitudeRad) * r,
        Math.cos(azimuthRad) * Math.cos(altitudeRad) * r,
      ),
      azimuth: azimuthDeg,
      altitude: altitudeDeg,
      raw: pos,
    };
  }

  update({ date = new Date(), phaseName = null } = {}) {
    const { position, altitude } = this.computePosition(date);
    this.sphere.position.copy(position);
    this.light.position.copy(position);
    this.light.target.position.set(0, 0, 0);
    this.light.target.updateMatrixWorld?.();

    const illumination = getMoonIllumination(date);
    const phaseFraction = illumination.fraction;
    this.lastPhase = { fraction: phaseFraction, phaseName, date };

    const altitudeFactor = THREE.MathUtils.clamp((altitude + 5) / 40, 0, 1);
    const phaseFactor = Math.max(0.1, phaseFraction);
    const intensity = altitudeFactor * phaseFactor * 0.6;
    this.light.intensity = intensity;
    this.sphere.visible = altitude > -10;

    this.lastUpdate = { date, altitude, phaseFraction, phaseName };
  }

  get object3d() {
    return this.group;
  }
}

