// src/lib/SunSkyDome.js
import * as THREE from "three";

const SKY_RADIUS = 3000;
const SLOT_IDS = ["dawn", "day", "dusk", "night"];

export const DEFAULT_SUN_SKY_PALETTE = Object.freeze({
  dawn: { top: "#2a3561", horizon: "#ff9d6c", glow: "#ffb266" },
  day: { top: "#5b8fd8", horizon: "#f2d0a7", glow: "#ffd9a3" },
  dusk: { top: "#1c2b4f", horizon: "#ff7b89", glow: "#ff9f8a" },
  night: { top: "#050b1f", horizon: "#12213f", glow: "#a8c5ff" },
});

function sunStrengthFromElevation(elevationDeg) {
  const normalized = THREE.MathUtils.clamp((elevationDeg + 6) / 40, 0, 1);
  return Math.pow(normalized, 1.5);
}

function normalizeAzimuth(degrees) {
  let value = degrees % 360;
  if (value < 0) value += 360;
  return value;
}

function toColor(input, fallback = "#ffffff") {
  if (input instanceof THREE.Color) return input.clone();
  try {
    return new THREE.Color(input ?? fallback);
  } catch {
    return new THREE.Color(fallback);
  }
}

function cloneSlot(slot) {
  return {
    top: toColor(slot?.top),
    horizon: toColor(slot?.horizon),
    glow: toColor(slot?.glow),
  };
}

export class SunSkyDome {
  constructor(initialPalette = DEFAULT_SUN_SKY_PALETTE) {
    this.palette = {
      dawn: cloneSlot(DEFAULT_SUN_SKY_PALETTE.dawn),
      day: cloneSlot(DEFAULT_SUN_SKY_PALETTE.day),
      dusk: cloneSlot(DEFAULT_SUN_SKY_PALETTE.dusk),
      night: cloneSlot(DEFAULT_SUN_SKY_PALETTE.night),
    };

    this._workState = {
      top: new THREE.Color(),
      horizon: new THREE.Color(),
      nightTop: new THREE.Color(),
      nightHorizon: new THREE.Color(),
      glow: new THREE.Color(),
      blend: 0,
    };

    this.geometry = new THREE.SphereGeometry(SKY_RADIUS, 32, 32);
    this.material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(DEFAULT_SUN_SKY_PALETTE.day.top) },
        horizonColor: {
          value: new THREE.Color(DEFAULT_SUN_SKY_PALETTE.day.horizon),
        },
        nightTopColor: {
          value: new THREE.Color(DEFAULT_SUN_SKY_PALETTE.night.top),
        },
        nightHorizonColor: {
          value: new THREE.Color(DEFAULT_SUN_SKY_PALETTE.night.horizon),
        },
        sunGlowColor: {
          value: new THREE.Color(DEFAULT_SUN_SKY_PALETTE.day.glow),
        },
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
    this._applyPaletteToUniforms(this.palette.day, this.palette.night);
  }

  update(sample) {
    if (!sample) return;
    const uniforms = this.material.uniforms;
    const elevation = sample.elevation ?? 0;
    const azimuth = normalizeAzimuth(sample.azimuth ?? 180);
    const rising = azimuth <= 180;
    const state = this._evaluatePalette(elevation, rising);

    uniforms.sunStrength.value = sunStrengthFromElevation(elevation);
    uniforms.blendFactor.value = state.blend;
    uniforms.topColor.value.copy(state.top);
    uniforms.horizonColor.value.copy(state.horizon);
    uniforms.nightTopColor.value.copy(state.nightTop);
    uniforms.nightHorizonColor.value.copy(state.nightHorizon);
    uniforms.sunGlowColor.value.copy(state.glow);

    const azimuthRad = THREE.MathUtils.degToRad(azimuth);
    const elevationRad = THREE.MathUtils.degToRad(elevation);
    const dir = new THREE.Vector3(
      Math.sin(azimuthRad) * Math.cos(elevationRad),
      Math.sin(elevationRad),
      Math.cos(azimuthRad) * Math.cos(elevationRad),
    );
    uniforms.sunDirection.value.copy(dir);
  }

  setPalette(palette = {}) {
    if (!palette) return;
    const normalized = this._coercePaletteInput(palette);
    SLOT_IDS.forEach((slotId) => {
      const slotUpdate = normalized[slotId];
      if (!slotUpdate) return;
      const target = this.palette[slotId];
      if (slotUpdate.top) target.top.copy(toColor(slotUpdate.top, target.top));
      if (slotUpdate.horizon)
        target.horizon.copy(toColor(slotUpdate.horizon, target.horizon));
      if (slotUpdate.glow)
        target.glow.copy(toColor(slotUpdate.glow, target.glow));
    });
  }

  setPaletteSlot(slotId, values = {}) {
    if (!SLOT_IDS.includes(slotId)) return;
    this.setPalette({ [slotId]: values });
  }

  getPalette() {
    const toHex = (color) => `#${color.getHexString()}`;
    return SLOT_IDS.reduce((acc, slotId) => {
      const slot = this.palette[slotId];
      acc[slotId] = {
        top: toHex(slot.top),
        horizon: toHex(slot.horizon),
        glow: toHex(slot.glow),
      };
      return acc;
    }, {});
  }

  _evaluatePalette(elevation, rising) {
    const work = this._workState;
    let blend = 0;

    if (elevation <= -6) {
      work.top.copy(this.palette.night.top);
      work.horizon.copy(this.palette.night.horizon);
      work.glow.copy(this.palette.night.glow);
      work.nightTop.copy(this.palette.night.top);
      work.nightHorizon.copy(this.palette.night.horizon);
      blend = 0;
    } else if (elevation < 5) {
      const t = THREE.MathUtils.clamp((elevation + 6) / 11, 0, 1);
      const twilight = rising ? this.palette.dawn : this.palette.dusk;
      work.top.copy(this.palette.night.top).lerp(twilight.top, t);
      work.horizon.copy(this.palette.night.horizon).lerp(twilight.horizon, t);
      work.glow.copy(this.palette.night.glow).lerp(twilight.glow, t);
      blend = THREE.MathUtils.smoothstep(-6, 4, elevation) * 0.7;
      work.nightTop
        .copy(this.palette.night.top)
        .lerp(work.top, blend * 0.25);
      work.nightHorizon
        .copy(this.palette.night.horizon)
        .lerp(work.horizon, blend * 0.25);
    } else if (elevation < 15) {
      const t = THREE.MathUtils.clamp((elevation - 5) / 10, 0, 1);
      const twilight = rising ? this.palette.dawn : this.palette.dusk;
      work.top.copy(twilight.top).lerp(this.palette.day.top, t);
      work.horizon.copy(twilight.horizon).lerp(this.palette.day.horizon, t);
      work.glow.copy(twilight.glow).lerp(this.palette.day.glow, t);
      blend = THREE.MathUtils.smoothstep(3, 12, elevation);
      work.nightTop
        .copy(this.palette.night.top)
        .lerp(work.top, Math.max(0.15, blend * 0.25));
      work.nightHorizon
        .copy(this.palette.night.horizon)
        .lerp(work.horizon, Math.max(0.15, blend * 0.25));
    } else {
      work.top.copy(this.palette.day.top);
      work.horizon.copy(this.palette.day.horizon);
      work.glow.copy(this.palette.day.glow);
      blend = 1;
      work.nightTop
        .copy(this.palette.night.top)
        .lerp(work.top, 0.3);
      work.nightHorizon
        .copy(this.palette.night.horizon)
        .lerp(work.horizon, 0.3);
    }

    work.blend = THREE.MathUtils.clamp(blend, 0, 1);
    return work;
  }

  _coercePaletteInput(input) {
    if (!input || typeof input !== "object") return {};
    const hasSlotKeys = SLOT_IDS.some((slot) => slot in input);

    if (hasSlotKeys) {
      return SLOT_IDS.reduce((acc, slotId) => {
        if (input[slotId]) acc[slotId] = { ...input[slotId] };
        return acc;
      }, {});
    }

    const legacy = {};
    if ("dayTop" in input || "dayHorizon" in input || "glow" in input) {
      legacy.day = {
        top: input.dayTop,
        horizon: input.dayHorizon,
        glow: input.glow ?? this.palette.day.glow,
      };
    }
    if ("nightTop" in input || "nightHorizon" in input) {
      legacy.night = {
        top: input.nightTop,
        horizon: input.nightHorizon,
      };
    }
    return legacy;
  }

  _applyPaletteToUniforms(daySlot, nightSlot) {
    const uniforms = this.material.uniforms;
    uniforms.topColor.value.copy(daySlot.top);
    uniforms.horizonColor.value.copy(daySlot.horizon);
    uniforms.sunGlowColor.value.copy(daySlot.glow);
    uniforms.nightTopColor.value.copy(nightSlot.top);
    uniforms.nightHorizonColor.value.copy(nightSlot.horizon);
  }
}
