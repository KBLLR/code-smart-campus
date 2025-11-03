// src/lib/SunSkyDome.js
import * as THREE from "three";

const SKY_RADIUS = 3000;
export const DEFAULT_SUN_SKY_PALETTE = Object.freeze({
  dayTop: "#5b8fd8",
  dayHorizon: "#f2d0a7",
  nightTop: "#0b1d3a",
  nightHorizon: "#1d2f4a",
  glow: "#ffd9a3",
});

function sunStrengthFromElevation(elevationDeg) {
  const normalized = THREE.MathUtils.clamp((elevationDeg + 6) / 40, 0, 1);
  return Math.pow(normalized, 1.5);
}

export class SunSkyDome {
  constructor(initialPalette = DEFAULT_SUN_SKY_PALETTE) {
    this.palette = { ...DEFAULT_SUN_SKY_PALETTE };
    this.geometry = new THREE.SphereGeometry(SKY_RADIUS, 32, 32);
    this.material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(DEFAULT_SUN_SKY_PALETTE.dayTop) },
        horizonColor: { value: new THREE.Color(DEFAULT_SUN_SKY_PALETTE.dayHorizon) },
        nightTopColor: { value: new THREE.Color(DEFAULT_SUN_SKY_PALETTE.nightTop) },
        nightHorizonColor: { value: new THREE.Color(DEFAULT_SUN_SKY_PALETTE.nightHorizon) },
        sunGlowColor: { value: new THREE.Color(DEFAULT_SUN_SKY_PALETTE.glow) },
        sunDirection: { value: new THREE.Vector3(0, 1, 0) },
        sunStrength: { value: 1 },
        blendFactor: { value: 1 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPosition;
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        uniform vec3 nightTopColor;
        uniform vec3 nightHorizonColor;
        uniform vec3 sunGlowColor;
        uniform vec3 sunDirection;
        uniform float sunStrength;
        uniform float blendFactor;

        void main() {
          vec3 dir = normalize(vWorldPosition);
          float height = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);

          vec3 dayColor = mix(horizonColor, topColor, height);
          vec3 nightColor = mix(nightHorizonColor, nightTopColor, height);
          vec3 baseColor = mix(nightColor, dayColor, blendFactor);

          float sunDot = max(dot(dir, normalize(sunDirection)), 0.0);
          float glow = pow(sunDot, 12.0) * sunStrength;

          vec3 color = baseColor + sunGlowColor * glow;
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.name = "SunSkyDome";
    this.setPalette(initialPalette);
  }

  update(sample) {
    if (!sample) return;
    const uniforms = this.material.uniforms;
    const elevation = sample.elevation ?? 0;
    const strength = sunStrengthFromElevation(elevation);
    const blend = THREE.MathUtils.clamp((elevation + 6) / 20, 0, 1);

    uniforms.sunStrength.value = strength;
    uniforms.blendFactor.value = blend;

    const azimuthRad = THREE.MathUtils.degToRad(sample.azimuth ?? 0);
    const elevationRad = THREE.MathUtils.degToRad(elevation);
    const dir = new THREE.Vector3(
      Math.sin(azimuthRad) * Math.cos(elevationRad),
      Math.sin(elevationRad),
      Math.cos(azimuthRad) * Math.cos(elevationRad),
    );
    uniforms.sunDirection.value.copy(dir);
  }

  setPalette(palette = {}) {
    const merged = {
      ...this.palette,
      ...palette,
    };

    this.palette = merged;

    this.material.uniforms.topColor.value.set(merged.dayTop);
    this.material.uniforms.horizonColor.value.set(merged.dayHorizon);
    this.material.uniforms.nightTopColor.value.set(merged.nightTop);
    this.material.uniforms.nightHorizonColor.value.set(merged.nightHorizon);
    this.material.uniforms.sunGlowColor.value.set(merged.glow);
  }

  getPalette() {
    return { ...this.palette };
  }
}
