// --- START OF FILE scene.js (Modified) ---

import * as THREE from "three";
import { roomRegistry } from "@registries/roomRegistry.js";
import { LabelLayoutManager } from "@utils/LabelLayoutManager.js";
import { Floor } from "@three/FloorGeometry.js";
import { SunController } from "@lib/SunController.js";
import { SunTelemetry } from "@lib/SunTelemetry.js";
import { SunSkyDome, DEFAULT_SUN_SKY_PALETTE } from "@lib/SunSkyDome.js";
import { SunPathArc } from "@lib/SunPathArc.js";
import { MoonController } from "@lib/MoonController.js";
import { SITE_COORDINATES } from "@utils/location.js";
import { materialRegistry } from "@registries/materialsRegistry.js";
import { RoomsManager } from "@/modules/RoomsManager.js";

// 🔧 Globals

// ✅ Essentials
const scene = new THREE.Scene();
scene.camera = null;
scene.renderer = null;
scene.controls = null;
scene.userData.postFX = null;
scene.fog = new THREE.FogExp2(
  new THREE.Color("#13243d"),
  0.0009,
);
const fogScratchColor = new THREE.Color();
const layoutManager = new LabelLayoutManager(scene, {}, roomRegistry);

// ✅ RoomsManager: Unified room, picking, and label management
let roomsManager = null;

async function initializeRoomMeshesAndPicking(camera) {
  console.log('[Scene] Initializing RoomsManager...');

  roomsManager = new RoomsManager(scene, camera, {
    labelsEnabled: true,
    useSprites: false,
    pickingEnabled: true,
    entityBindingEnabled: true,
    debugMode: false,
  });

  await roomsManager.initialize();

  // Populate layoutManager with label anchors
  layoutManager.labels = roomsManager.getLabelAnchors();

  console.log('[Scene] RoomsManager initialized successfully');

  // For backward compatibility, assign module-level exports
  roomMeshes = roomsManager.roomMeshes;
  picking = roomsManager.pickingService;

  return { roomMeshes, picking };
}

function cleanupRoomMeshesAndPicking() {
  if (roomsManager) {
    roomsManager.dispose();
    roomsManager = null;
  }
}

// Backward compatibility: labelManager proxy
const labelManager = {
  getLabels: () => roomsManager?.labelManager?.getLabels() || {},
  getAnchors: () => roomsManager?.labelManager?.getAnchors() || {},
  getAnchor: (entityId) => roomsManager?.getLabelAnchor(entityId) || null,
  updateLabel: (entityId, value) => roomsManager?.updateLabel(entityId, value),
  useSprites: false,
  updateLabelPositions: () => {}, // No-op for anchor-based labels
};
const sunController = new SunController();
const sunTelemetry = new SunTelemetry();
const sunSkyDome = new SunSkyDome();
const sunPathArc = new SunPathArc();
const moonController = new MoonController({ siteCoords: SITE_COORDINATES });
let sunAssetsMounted = false;

function detachSunAssets() {
  if (!sunAssetsMounted) return;
  scene.remove(sunSkyDome.mesh);
  scene.remove(sunPathArc.line);
  scene.remove(moonController.object3d);
  sunAssetsMounted = false;
}

function syncSunAssets(renderer) {
  if (renderer?.isWebGPURenderer) {
    if (sunAssetsMounted) {
      detachSunAssets();
    }
    if (!scene.__loggedWebGPUSkyWarning) {
      console.info(
        "[Scene] SunSkyDome disabled in WebGPU mode (custom ShaderMaterial not supported).",
      );
      scene.__loggedWebGPUSkyWarning = true;
    }
    return;
  }
  if (sunAssetsMounted) return;
  scene.add(sunSkyDome.mesh);
  scene.add(sunPathArc.line);
  scene.add(moonController.object3d);
  sunAssetsMounted = true;
}

const highlightColor = new THREE.Color("#38bdf8");
const highlightEmissive = new THREE.Color("#0ea5e9");
const roomHighlightCache = new Map();
let hoveredRoomKey = null;
let selectedRoomKey = null;

const tempVec3 = new THREE.Vector3();

const colorAnimationHandles = new Map();
const numericAnimationHandles = new Map();

function animateColor(material, property, fromColor, toColor, duration = 180) {
  if (!material?.[property]?.isColor) return;
  const key = `${material.uuid}:${property}`;
  if (colorAnimationHandles.has(key)) {
    cancelAnimationFrame(colorAnimationHandles.get(key));
    colorAnimationHandles.delete(key);
  }
  const prop = material[property];
  const startColor = fromColor.clone();
  const targetColor = toColor.clone();
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / duration, 1);
    prop.copy(startColor).lerp(targetColor, t);
    material.needsUpdate = true;
    if (t < 1) {
      colorAnimationHandles.set(key, requestAnimationFrame(step));
    } else {
      colorAnimationHandles.delete(key);
    }
  };
  colorAnimationHandles.set(key, requestAnimationFrame(step));
}

function animateNumber(target, property, from, to, duration = 180) {
  if (typeof target?.[property] !== "number") return;
  const key = `${target.uuid || target.id || ""}:${property}`;
  if (numericAnimationHandles.has(key)) {
    cancelAnimationFrame(numericAnimationHandles.get(key));
    numericAnimationHandles.delete(key);
  }
  const startValue = Number(from ?? target[property]);
  const endValue = Number(to ?? target[property]);
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / duration, 1);
    target[property] = startValue + (endValue - startValue) * t;
    if (t < 1) {
      numericAnimationHandles.set(key, requestAnimationFrame(step));
    } else {
      numericAnimationHandles.delete(key);
    }
  };
  numericAnimationHandles.set(key, requestAnimationFrame(step));
}

const normalizeRoomKey = (key) =>
  typeof key === "string" ? key.toLowerCase().replace(/[^a-z0-9]/g, "") : "";

const getMeshForRoomKey = (roomKey) => {
  const registry = window.roomMeshes || {};
  return registry[roomKey] || null;
};

const ensureHighlightCache = (normalizedKey) => {
  let cache = roomHighlightCache.get(normalizedKey);
  if (!cache) {
    const mesh = getMeshForRoomKey(normalizedKey);
    if (!mesh || !mesh.material) return null;
    const material = mesh.material;
    cache = {
      material,
      originalColor: material.color ? material.color.clone() : null,
      originalEmissive: material.emissive ? material.emissive.clone() : null,
      originalEmissiveIntensity:
        typeof material.emissiveIntensity === "number"
          ? material.emissiveIntensity
          : undefined,
    };
    roomHighlightCache.set(normalizedKey, cache);
  }
  return cache;
};

const applyRoomHighlight = (normalizedKey) => {
  if (!normalizedKey) return false;
  const cache = ensureHighlightCache(normalizedKey);
  if (!cache) return false;
  const { material, originalColor, originalEmissive } = cache;
  if (material.color && originalColor) {
    const targetColor = originalColor.clone().lerp(highlightColor, 0.35);
    animateColor(material, "color", material.color.clone(), targetColor);
  }
  if (material.emissive) {
    const start = material.emissive.clone();
    const base = originalEmissive?.clone() || new THREE.Color(0x000000);
    const targetEmissive = base.clone().lerp(highlightEmissive, 0.85);
    animateColor(material, "emissive", start, targetEmissive);
  }
  if (typeof material.emissiveIntensity === "number") {
    const { originalEmissiveIntensity } = cache;
    const startIntensity = material.emissiveIntensity;
    const targetIntensity = Math.max(originalEmissiveIntensity ?? 0.6, 1.25);
    animateNumber(material, "emissiveIntensity", startIntensity, targetIntensity);
  }
  return true;
};

const removeRoomHighlight = (normalizedKey) => {
  if (!normalizedKey) return;
  const cache = roomHighlightCache.get(normalizedKey);
  if (!cache) return;
  const { material, originalColor, originalEmissive, originalEmissiveIntensity } =
    cache;
  if (!material) return;
  if (material.color && originalColor) {
    animateColor(material, "color", material.color.clone(), originalColor.clone());
  }
  if (material.emissive) {
    const base = originalEmissive?.clone() || new THREE.Color(0x000000);
    animateColor(material, "emissive", material.emissive.clone(), base);
  }
  if (typeof originalEmissiveIntensity === "number") {
    animateNumber(
      material,
      "emissiveIntensity",
      material.emissiveIntensity,
      originalEmissiveIntensity,
    );
  }
};

const getRoomKeyForEntity = (entityId) => {
  const anchor = labelManager.getAnchor(entityId);
  return anchor?.userData?.room ?? null;
};

const setHoveredEntity = (entityId) => {
  const roomKey = getRoomKeyForEntity(entityId);
  if (!roomKey) return false;
  const normalizedKey = normalizeRoomKey(roomKey);
  if (!normalizedKey) return false;
  if (hoveredRoomKey && hoveredRoomKey !== normalizedKey) {
    if (hoveredRoomKey !== selectedRoomKey) {
      removeRoomHighlight(hoveredRoomKey);
    }
  }
  const applied = applyRoomHighlight(normalizedKey);
  if (applied) hoveredRoomKey = normalizedKey;
  return applied;
};

const clearHoveredEntity = (entityId) => {
  const roomKey = entityId ? getRoomKeyForEntity(entityId) : null;
  const normalizedKey = roomKey ? normalizeRoomKey(roomKey) : hoveredRoomKey;
  if (!normalizedKey) return;
  if (normalizedKey === selectedRoomKey) {
    hoveredRoomKey = null;
    return;
  }
  removeRoomHighlight(normalizedKey);
  if (hoveredRoomKey === normalizedKey) hoveredRoomKey = null;
};

const setSelectedEntity = (entityId) => {
  const roomKey = getRoomKeyForEntity(entityId);
  if (!roomKey) return false;
  const normalizedKey = normalizeRoomKey(roomKey);
  if (!normalizedKey) return false;
  if (selectedRoomKey && selectedRoomKey !== normalizedKey) {
    if (selectedRoomKey !== hoveredRoomKey) {
      removeRoomHighlight(selectedRoomKey);
    }
  }
  const applied = applyRoomHighlight(normalizedKey);
  if (applied) {
    selectedRoomKey = normalizedKey;
scene.userData?.hud?.manager?.selectEntity(entityId);
 }
  return applied;
};

const clearSelectedEntity = () => {
  if (!selectedRoomKey) return;
  if (selectedRoomKey !== hoveredRoomKey) {
    removeRoomHighlight(selectedRoomKey);
  }
  selectedRoomKey = null;
  scene.userData?.hud?.manager?.clearSelection({ silent: true });
};

const highlightRoomByKey = (roomKey) => {
  const normalizedKey = normalizeRoomKey(roomKey);
  if (!normalizedKey) return false;
  return applyRoomHighlight(normalizedKey);
};

const clearRoomHighlightByKey = (roomKey) => {
  const normalizedKey = normalizeRoomKey(roomKey);
  if (!normalizedKey) return;
  removeRoomHighlight(normalizedKey);
};

const focusEntity = (entityId, { duration } = {}) => {
  const anchor = labelManager.getAnchor(entityId);
  if (!anchor) return false;
  const point = anchor.getWorldPosition(tempVec3);
  point.y += anchor.userData?.hudOffset ?? 12;
  const cameraDebug = scene.userData?.cameraDebug;
  if (cameraDebug?.focusOnPoint) {
    cameraDebug.focusOnPoint(point, duration);
    return true;
  }
  return false;
};

const clonePaletteSlots = (source) => ({
  dawn: { ...source.dawn },
  day: { ...source.day },
  dusk: { ...source.dusk },
  night: { ...source.night },
});

const DEFAULT_SUN_VISUAL_CONFIG = Object.freeze({
  palette: clonePaletteSlots(DEFAULT_SUN_SKY_PALETTE),
  arcColor: "#ffd48a",
  arcOpacity: 0.4,
});

const sunVisualConfig = {
  palette: clonePaletteSlots(DEFAULT_SUN_VISUAL_CONFIG.palette),
  arcColor: DEFAULT_SUN_VISUAL_CONFIG.arcColor,
  arcOpacity: DEFAULT_SUN_VISUAL_CONFIG.arcOpacity,
};

let moonPhaseName = null;

function applySunVisualConfig() {
  sunSkyDome.setPalette(sunVisualConfig.palette);
  sunPathArc.setColor(sunVisualConfig.arcColor);
  if (scene.fog) {
    const dayFog = fogScratchColor.set(sunVisualConfig.palette.day.horizon);
    scene.fog.color
      .set(sunVisualConfig.palette.night.horizon)
      .lerp(dayFog, 0.35);
    scene.fog.density = 0.0009;
  }
  const latest = sunTelemetry.getLatest();
  if (latest) {
    const opacity =
      THREE.MathUtils.clamp((latest.elevation + 15) / 60, 0, 1) *
      sunVisualConfig.arcOpacity;
    sunPathArc.setOpacity(opacity);
  } else {
    sunPathArc.setOpacity(sunVisualConfig.arcOpacity);
  }
}

function resetSunVisualConfig() {
  Object.entries(DEFAULT_SUN_VISUAL_CONFIG.palette).forEach(([slot, values]) => {
    Object.assign(sunVisualConfig.palette[slot], values);
  });
  sunVisualConfig.arcColor = DEFAULT_SUN_VISUAL_CONFIG.arcColor;
  sunVisualConfig.arcOpacity = DEFAULT_SUN_VISUAL_CONFIG.arcOpacity;
}

function updateMoon(date = new Date()) {
  try {
    moonController.update({ date, phaseName: moonPhaseName });
  } catch (error) {
    console.warn("[Moon] update failed", error);
  }
}

// NOTE: Label injection now handled by RoomsManager.initialize()
// Labels will be available after initializeRoomMeshesAndPicking() is called
// layoutManager.labels will be populated when RoomsManager initializes

const floor = new Floor(); // Add floor
scene.add(floor.mesh);
scene.add(sunController.object3d);
syncSunAssets();
applySunVisualConfig();

scene.userData.sunDebug = {
  config: sunVisualConfig,
  apply: () => applySunVisualConfig(),
  reset: () => {
    resetSunVisualConfig();
    applySunVisualConfig();
  },
};

scene.userData.moonDebug = {
  update: updateMoon,
  controller: moonController,
};

const DEFAULT_SUN_BOOTSTRAP = { azimuth: 180, elevation: 35 };
sunTelemetry.ingest(DEFAULT_SUN_BOOTSTRAP);
sunController.updateFromAttributes(DEFAULT_SUN_BOOTSTRAP);
sunSkyDome.update(DEFAULT_SUN_BOOTSTRAP);
sunPathArc.update(sunTelemetry.getSamples(), (az, el) =>
  sunController.computeSunPosition(az, el),
);
updateMoon();

// ✅ Setup injection
function attachSetup({ cam, re, orbCtrls }) {
  scene.camera = cam;
  scene.renderer = re;
  scene.controls = orbCtrls;
  syncSunAssets(re);
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  materialRegistry
    .init({ renderer: re })
    .then((envMap) => {
      if (envMap) {
        scene.environment = envMap;
        // Keep background null so the sky dome remains visible
        if (!scene.background) {
          scene.background = null;
        }
      }
      materialRegistry.refresh();
    })
    .catch((error) => {
      console.warn("[Scene] Material registry initialisation failed:", error);
    });
}

// ✅ Handle updates via WebSocket
// This function remains responsible for updating the 3D visual aspects (labels, mesh colors)

function updateLabel(entityId, value) {
  // 'value' here is expected to be the formatted string like "22.5 °C"
  const num = parseFloat(value); // Attempt to parse number for color logic
  const normId = entityId?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!normId) return;

  labelManager.updateLabel(entityId, value); // Update text label using the formatted value

  const mesh = window.roomMeshes?.[normId]; // Use global registry safely
  if (mesh?.material && typeof mesh.material.color !== "undefined") {
    if (!isNaN(num)) {
      const tempMin = 10,
        tempMax = 30,
        hueMin = 0.66,
        hueMax = 0.0;
      const clampedVal = THREE.MathUtils.clamp(num, tempMin, tempMax);
      const normalizedVal = (clampedVal - tempMin) / (tempMax - tempMin);
      const hue = hueMin + (hueMax - hueMin) * normalizedVal;
      mesh.material.color.setHSL(hue, 0.8, 0.5);
    } else {
      mesh.material.color.set(0xaaaaaa); // Default color if value is not numeric
    }
    mesh.material.needsUpdate = true;
  }
}

function updateSunFromEntity(entity) {
  const attributes = entity?.attributes;
  if (!attributes) return;

  const timestamp = Date.parse(entity?.last_updated || entity?.last_changed || "") || Date.now();
  const smoothed = sunTelemetry.ingest(attributes, timestamp);
  const reading = sunTelemetry.getInterpolated();

  if (reading) {
    sunController.updateFromAttributes(reading);
    sunSkyDome.update(reading);
    sunPathArc.update(
      sunTelemetry.getSamples(),
      (az, el) => sunController.computeSunPosition(az, el),
    );
    const opacity =
      THREE.MathUtils.clamp((reading.elevation + 15) / 60, 0, 1) *
      sunVisualConfig.arcOpacity;
    sunPathArc.setOpacity(opacity);
    updateMoon(new Date(timestamp));
  } else if (smoothed) {
    sunController.updateFromAttributes(smoothed);
    sunSkyDome.update(smoothed);
    sunPathArc.update(
      sunTelemetry.getSamples(),
      (az, el) => sunController.computeSunPosition(az, el),
    );
    const opacity =
      THREE.MathUtils.clamp((smoothed.elevation + 15) / 60, 0, 1) *
      sunVisualConfig.arcOpacity;
    sunPathArc.setOpacity(opacity);
    updateMoon(new Date(timestamp));
  } else {
    const fallback = sunTelemetry.getLatest() || DEFAULT_SUN_BOOTSTRAP;
    sunController.updateFromAttributes(fallback);
    sunSkyDome.update(fallback);
    sunPathArc.update(
      sunTelemetry.getSamples(),
      (az, el) => sunController.computeSunPosition(az, el),
    );
    sunPathArc.setOpacity(0);
    updateMoon(new Date());
  }
}

function updateMoonFromEntity(entity) {
  if (!entity) return;
  moonPhaseName = entity.state || moonPhaseName;
  const timestamp = Date.parse(entity.last_updated || entity.last_changed || "") || Date.now();
  updateMoon(new Date(timestamp));
}

// ✅ Provide shared references
//window.addEventListener("DOMContentLoaded", () => {
//  console.log("🔔 scene.js: DOMContentLoaded—firing ready signals");
//  markReady("layoutManager", layoutManager);
//  markReady("labels", labelManager.getLabels()); // ← now will wake your toolbar scene.js]
//});

// ✅ Export API
const labels = labelManager.getLabels();

// Backward compatibility getters for roomMeshes and picking
// These are populated after initializeRoomMeshesAndPicking() is called
let roomMeshes = [];
let picking = null;

export {
  scene,
  layoutManager,
  labelManager, // Backward-compatible proxy
  sunController,
  moonController,
  labels,
  updateLabel,
  updateSunFromEntity,
  updateMoonFromEntity,
  attachSetup,
  setHoveredEntity,
  clearHoveredEntity,
  setSelectedEntity,
  clearSelectedEntity,
  highlightRoomByKey,
  clearRoomHighlightByKey,
  focusEntity,
  // RoomsManager: Unified room management
  roomsManager,
  initializeRoomMeshesAndPicking,
  cleanupRoomMeshesAndPicking,
  // Backward compatibility: populated after initialization
  roomMeshes,
  picking,
};

// --- END OF FILE scene.js (Modified) ---
