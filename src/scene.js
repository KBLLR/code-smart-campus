// --- START OF FILE scene.js (Modified) ---

import * as THREE from "three";
import { roomRegistry } from "@registries/roomRegistry.js";
import { cleanedLabelRegistry } from "@data/labelCollections.js";
import { LabelLayoutManager } from "@utils/LabelLayoutManager.js";
import { LabelManager } from "@lib/LabelManager.js";
import { Floor } from "@three/FloorGeometry.js";
import { SunController } from "@lib/SunController.js";
import { SunTelemetry } from "@lib/SunTelemetry.js";
import { SunSkyDome, DEFAULT_SUN_SKY_PALETTE } from "@lib/SunSkyDome.js";
import { SunPathArc } from "@lib/SunPathArc.js";
import { MoonController } from "@lib/MoonController.js";
import { SITE_COORDINATES } from "@utils/location.js";
import { materialRegistry } from "@registries/materialsRegistry.js";

// 🔌 Env
const WS_URL =
  import.meta.env.VITE_CLOUD_WS ||
  import.meta.env.VITE_LOCAL_WS ||
  "ws://localhost:8123/api/websocket";
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN;

// 🔧 Globals

// ✅ Essentials
const scene = new THREE.Scene();
scene.camera = null;
scene.renderer = null;
scene.controls = null;
scene.userData.postFX = null;
scene.fog = new THREE.FogExp2(
  new THREE.Color(DEFAULT_SUN_SKY_PALETTE.night.horizon),
  0.0012,
);
const fogScratchColor = new THREE.Color();
const layoutManager = new LabelLayoutManager(scene, {}, roomRegistry);
const labelManager = new LabelManager(
  scene,
  cleanedLabelRegistry,
  roomRegistry,
  { useSprites: false },
);
const sunController = new SunController();
const sunTelemetry = new SunTelemetry();
const sunSkyDome = new SunSkyDome();
const sunPathArc = new SunPathArc();
const moonController = new MoonController({ siteCoords: SITE_COORDINATES });

const highlightColor = new THREE.Color("#38bdf8");
const highlightEmissive = new THREE.Color("#0ea5e9");
const roomHighlightCache = new Map();
let hoveredRoomKey = null;
let selectedRoomKey = null;

const tempVec3 = new THREE.Vector3();

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
    material.color.copy(originalColor).lerp(highlightColor, 0.35);
  }
  if (material.emissive) {
    material.emissive
      .copy(originalEmissive || new THREE.Color(0x000000))
      .lerp(highlightEmissive, 0.85);
  } else if (material.emissive === undefined) {
    material.emissive = highlightEmissive.clone();
  }
  if (typeof material.emissiveIntensity === "number") {
    const { originalEmissiveIntensity } = cache;
    material.emissiveIntensity = Math.max(
      originalEmissiveIntensity ?? 0.6,
      1.25,
    );
  }
  material.needsUpdate = true;
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
    material.color.copy(originalColor);
  }
  if (material.emissive) {
    if (originalEmissive) {
      material.emissive.copy(originalEmissive);
    } else {
      material.emissive.setRGB(0, 0, 0);
    }
  }
  if (typeof originalEmissiveIntensity === "number") {
    material.emissiveIntensity = originalEmissiveIntensity;
  }
  material.needsUpdate = true;
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
      .lerp(dayFog, 0.25);
    scene.fog.density = 0.0012;
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

try {
  labelManager.injectLabels(); // Inject labels early as before
} catch (error) {
  console.error("❌ Error injecting labels:", error);
}
layoutManager.labels = labelManager.getAnchors();

const floor = new Floor(); // Add floor
scene.add(floor.mesh);
scene.add(sunController.object3d);
scene.add(sunSkyDome.mesh);
scene.add(sunPathArc.line);
scene.add(moonController.object3d);

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

// ✅ Connect WebSocket (Revised ID Management & Data Passing)
function connectToHomeAssistantWS(
  onStateUpdate = updateLabel, // Default callback (though main.js will override this)
  onInitialStates = null, // Callback for get_states result
) {
  if (!WS_URL) {
    console.error("[HA] WebSocket URL is not defined.");
    return null;
  }
  if (!HA_TOKEN) {
    console.warn("[HA] HA_TOKEN is not defined.");
  }

  let socket = null;
  try {
    socket = new WebSocket(WS_URL);
  } catch (error) {
    console.error("[HA] Failed to create WebSocket:", error);
    scheduleReconnect();
    return null;
  }

  let reconnectTimer = null;
  let commandIdCounter = 1; // Start command IDs from 1
  let getStatesCommandId = -1; // Store the ID used for get_states
  let subscribeCommandId = -1; // Store the ID used for subscribe_events

  const scheduleReconnect = () => {
    clearTimeout(reconnectTimer);
    if (
      !socket ||
      (socket.readyState !== WebSocket.CONNECTING &&
        socket.readyState !== WebSocket.OPEN)
    ) {
      reconnectTimer = setTimeout(
        () => connectToHomeAssistantWS(onStateUpdate, onInitialStates),
        5000,
      );
    }
  };

  socket.onopen = () => {
    console.log("[HA] WebSocket connected");
    commandIdCounter = 1; // Reset command counter on new connection
    getStatesCommandId = -1;
    subscribeCommandId = -1;
    clearTimeout(reconnectTimer);
    if (HA_TOKEN) {
      socket.send(JSON.stringify({ type: "auth", access_token: HA_TOKEN }));
    } else {
      console.warn("[HA] No auth token provided.");
    }
  };

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);

      if (msg.type === "auth_ok") {
        console.log("[HA] Authentication successful.");

        // Send commands sequentially with increasing IDs
        getStatesCommandId = commandIdCounter++;
        console.log(`[HA] Sending get_states (ID: ${getStatesCommandId})`);
        socket.send(
          JSON.stringify({
            id: getStatesCommandId,
            type: "get_states",
          }),
        );

        subscribeCommandId = commandIdCounter++;
        console.log(
          `[HA] Sending subscribe_events (ID: ${subscribeCommandId})`,
        );
        socket.send(
          JSON.stringify({
            id: subscribeCommandId,
            type: "subscribe_events",
            event_type: "state_changed",
          }),
        );
      } else if (msg.type === "auth_required") {
        console.log("[HA] Authentication required.");
      } else if (msg.type === "auth_invalid") {
        console.error("[HA] Authentication failed:", msg.message);
        socket.close();
      } else if (
        msg.type === "event" &&
        msg.event?.event_type === "state_changed" &&
        msg.event?.data?.new_state // Ensure new_state exists
      ) {
        // --- MODIFICATION START (Suggestion #4) ---
        // Process state changes - Pass the full entity object
        const entity = msg.event.data.new_state; // Get the complete new_state object

        // NEW: Pass the entity_id and the full entity object to the callback
        if (typeof onStateUpdate === "function") {
          // The function provided by main.js (handleEntityUpdate) will now receive this object
          onStateUpdate(entity.entity_id, entity);
        }
        // --- MODIFICATION END ---
      } else if (msg.type === "result") {
        // Check against stored command IDs
        if (msg.id === getStatesCommandId) {
          if (msg.success && msg.result) {
            console.log("[HA] Received result for get_states.");
            if (typeof onInitialStates === "function") {
              // Pass the array of state objects to the callback
              onInitialStates(msg.result);
            }
          } else {
            console.error("[HA] Failed to get initial states:", msg.error);
          }
        } else if (msg.id === subscribeCommandId) {
          if (msg.success) {
            console.log(
              "[HA] Successfully subscribed to state_changed events.",
            );
          } else {
            console.error(
              "[HA] Failed to subscribe to state_changed events:",
              msg.error || "No error details provided.",
            );
          }
        } else {
          console.log(
            `[HA] Received unhandled result for command ID: ${msg.id}`,
          );
        }
      }
      // Handle other message types if needed
    } catch (error) {
      console.error(
        "[HA] Error processing WebSocket message:",
        error,
        event.data,
      );
    }
  };

  socket.onerror = (err) => {
    console.error("[HA] WebSocket error:", err);
  };

  socket.onclose = (event) => {
    console.warn(
      `[HA] Socket closed. Code: ${event.code}, Reason: ${event.reason || "N/A"}. Reconnecting...`,
    );
    scheduleReconnect();
  };

  return socket;
}

// ✅ Provide shared references
//window.addEventListener("DOMContentLoaded", () => {
//  console.log("🔔 scene.js: DOMContentLoaded—firing ready signals");
//  markReady("layoutManager", layoutManager);
//  markReady("labels", labelManager.getLabels()); // ← now will wake your toolbar scene.js]
//});

// ✅ Export API
const labels = labelManager.getLabels();
export {
  scene,
  layoutManager,
  labelManager,
  sunController,
  moonController,
  labels,
  connectToHomeAssistantWS,
  updateLabel,
  updateSunFromEntity,
  updateMoonFromEntity,
  attachSetup,
  setHoveredEntity,
  clearHoveredEntity,
  setSelectedEntity,
  clearSelectedEntity,
  focusEntity,
};

// --- END OF FILE scene.js (Modified) ---
