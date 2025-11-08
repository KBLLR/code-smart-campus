import { MeshStandardNodeMaterial } from "three/webgpu";
import {
  clamp,
  color,
  float,
  mix,
  positionWorld,
  smoothstep,
  uniform,
} from "three/tsl";

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

export function buildRoomNodeMaterial({
  baseBottom = "#13172b",
  baseTop = "#311649",
  accentColor = "#2dd4bf",
  occupancy = 0,
  gradientHeight = 260,
  opacity = 0.95,
  roughness = 0.55,
  metalness = 0.35,
  roomKey = null,
} = {}) {
  const material = new MeshStandardNodeMaterial();
  material.transparent = true;
  material.opacity = opacity;
  material.depthWrite = false;
  material.roughness = roughness;
  material.metalness = metalness;

  const baseBottomColor = toColorString(baseBottom, "#13172b");
  const baseTopColor = toColorString(baseTop, "#311649");
  const accent = toColorString(accentColor, "#2dd4bf");

  const occupancyUniform = uniform(clamp01(occupancy));
  const gradientHeightUniform = uniform(ensurePositive(gradientHeight, 250));

  const normalizedHeight = clamp(
    positionWorld.y.div(gradientHeightUniform).add(float(0.5)),
    float(0),
    float(1),
  );

  const gradientNode = mix(
    color(baseBottomColor),
    color(baseTopColor),
    normalizedHeight,
  );

  const glowNode = smoothstep(float(0), float(1), occupancyUniform).mul(
    color(accent),
  );

  material.colorNode = gradientNode.add(glowNode.mul(float(0.18)));
  material.emissiveNode = glowNode.mul(float(1.15));

  material.userData.roomKey = roomKey;
  material.userData.roomShader = {
    setOccupancy(value) {
      occupancyUniform.value = clamp01(value);
    },
    setGradientHeight(value) {
      gradientHeightUniform.value = ensurePositive(value, 250);
    },
    setAccent(value) {
      material.colorNode = gradientNode.add(
        smoothstep(float(0), float(1), occupancyUniform).mul(
          color(toColorString(value, accent)),
        ).mul(float(0.18)),
      );
      material.emissiveNode = smoothstep(float(0), float(1), occupancyUniform)
        .mul(color(toColorString(value, accent)))
        .mul(float(1.15));
    },
  };

  return material;
}
