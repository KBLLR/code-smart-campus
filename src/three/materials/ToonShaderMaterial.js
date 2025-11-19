/**
 * ToonShaderMaterial.js
 *
 * TSL-based toon shader for SVG-generated room meshes (RoundedBoxGeometry)
 * Designed for Smart Campus WebGPU architecture
 *
 * Features:
 * - Stepped/quantized lighting (cel-shading)
 * - Rim lighting (Fresnel effect) for depth perception
 * - Dynamic room colors from SVG-based palette
 * - Occupancy-based glow effect
 * - Preserves userData.roomKey and userData.roomId
 *
 * Integration:
 * - Called via materialRegistry.create("roomToon", {...})
 * - Works with RoomsManager orchestration
 * - Applied to extrudedGroup meshes (50+ per scene)
 */

import { MeshStandardNodeMaterial } from "three/webgpu";
import {
  clamp,
  color,
  float,
  mix,
  normalView,
  positionWorld,
  smoothstep,
  step,
  uniform,
  viewDirection,
  dot,
  pow,
  add,
  mul,
  sub,
  abs,
  max,
} from "three/tsl";

// Utility functions
const clamp01 = (value) => Math.min(1, Math.max(0, value ?? 0));
const ensurePositive = (value, fallback = 1) =>
  value > 0 ? value : fallback;

const toColorString = (input, fallback = "#2dd4bf") => {
  if (!input && input !== 0) return fallback;
  if (typeof input === "string") return input;
  if (typeof input === "number") {
    const hex = input.toString(16).padStart(6, "0");
    return `#${hex}`;
  }
  if (input?.isColor) {
    return `#${input.getHexString()}`;
  }
  return fallback;
};

/**
 * Build a toon-shaded material for room meshes
 *
 * @param {Object} options - Configuration options
 * @param {string} options.baseColor - Base room color (from SVG/palette)
 * @param {string} options.shadowColor - Color for shadowed areas
 * @param {string} options.rimColor - Rim light color
 * @param {string} options.accentColor - Accent/glow color for occupancy
 * @param {number} options.occupancy - Occupancy level (0-1) for glow effect
 * @param {number} options.toonSteps - Number of toon shading steps (2-5)
 * @param {number} options.rimPower - Rim light intensity (0-1)
 * @param {number} options.rimThickness - Rim light thickness (0-1)
 * @param {number} options.opacity - Material opacity
 * @param {number} options.roughness - Surface roughness
 * @param {number} options.metalness - Surface metalness
 * @param {string} options.roomKey - Room identifier (preserved in userData)
 * @returns {MeshStandardNodeMaterial} Configured toon material
 */
export function buildToonShaderMaterial({
  baseColor = "#2dd4bf",
  shadowColor = "#13172b",
  rimColor = "#5eead4",
  accentColor = "#22d3ee",
  occupancy = 0,
  toonSteps = 3,
  rimPower = 0.6,
  rimThickness = 0.3,
  opacity = 0.95,
  roughness = 0.7,
  metalness = 0.2,
  roomKey = null,
} = {}) {
  const material = new MeshStandardNodeMaterial();

  // Material properties
  material.transparent = true;
  material.opacity = opacity;
  material.depthWrite = false;
  material.roughness = roughness;
  material.metalness = metalness;

  // Color conversion
  const base = toColorString(baseColor, "#2dd4bf");
  const shadow = toColorString(shadowColor, "#13172b");
  const rim = toColorString(rimColor, "#5eead4");
  const accent = toColorString(accentColor, "#22d3ee");

  // Dynamic uniforms
  const occupancyUniform = uniform(clamp01(occupancy));
  const toonStepsUniform = uniform(Math.max(2, Math.min(5, toonSteps)));
  const rimPowerUniform = uniform(clamp01(rimPower));
  const rimThicknessUniform = uniform(clamp01(rimThickness));

  // === TOON SHADING CALCULATION ===

  // 1. Fresnel/Rim lighting (view-dependent edge highlighting)
  // fresnel = 1 - dot(normal, viewDir) — stronger at grazing angles
  const fresnel = sub(
    float(1),
    dot(normalView, viewDirection)
  );

  // Apply rim thickness and power
  const rimMask = smoothstep(
    sub(float(1), rimThicknessUniform),
    float(1),
    fresnel
  );
  const rimLight = mul(
    pow(rimMask, rimPowerUniform.mul(float(3))),
    color(rim)
  );

  // 2. Height-based gradient (world Y position)
  const normalizedHeight = clamp(
    positionWorld.y.div(float(250)).add(float(0.5)),
    float(0),
    float(1)
  );

  // 3. Base toon color (mix base and shadow based on height)
  const toonBase = mix(
    color(shadow),
    color(base),
    normalizedHeight
  );

  // 4. Quantize/step the lighting (cel-shading effect)
  // Discretize values into N steps
  const steppedHeight = mul(
    step(
      float(0.5),
      normalizedHeight
    ),
    float(0.3)
  );

  // 5. Occupancy-based glow
  const glowNode = smoothstep(float(0), float(1), occupancyUniform).mul(
    color(accent)
  );

  // === FINAL COLOR COMPOSITION ===

  // Base toon color + stepped lighting variation + rim light + occupancy glow
  material.colorNode = add(
    add(
      toonBase,
      mul(color(base), steppedHeight)
    ),
    add(
      mul(rimLight, float(0.5)),
      mul(glowNode, float(0.15))
    )
  );

  // Emissive channel for glow and rim
  material.emissiveNode = add(
    mul(rimLight, float(0.3)),
    mul(glowNode, float(0.8))
  );

  // === USER DATA & CONTROLS ===

  material.userData.roomKey = roomKey;
  material.userData.toonShader = {
    setOccupancy(value) {
      occupancyUniform.value = clamp01(value);
    },
    setToonSteps(value) {
      toonStepsUniform.value = Math.max(2, Math.min(5, value));
    },
    setRimPower(value) {
      rimPowerUniform.value = clamp01(value);
    },
    setRimThickness(value) {
      rimThicknessUniform.value = clamp01(value);
    },
    setAccent(value) {
      const newAccent = toColorString(value, accent);
      // Rebuild glow node with new color
      material.colorNode = add(
        add(
          toonBase,
          mul(color(base), steppedHeight)
        ),
        add(
          mul(rimLight, float(0.5)),
          mul(
            smoothstep(float(0), float(1), occupancyUniform).mul(
              color(newAccent)
            ),
            float(0.15)
          )
        )
      );
      material.emissiveNode = add(
        mul(rimLight, float(0.3)),
        mul(
          smoothstep(float(0), float(1), occupancyUniform).mul(
            color(newAccent)
          ),
          float(0.8)
        )
      );
    },
  };

  return material;
}
