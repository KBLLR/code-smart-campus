// --- START OF FILE scene.js (Modified) ---

import * as THREE from "three";
import { roomRegistry } from "@registries/roomRegistry.js";
import { labelRegistry } from "@registries/labelRegistry.js";
import { LabelLayoutManager } from "@utils/LabelLayoutManager.js";
import { markReady } from "@utils/initCoordinator.js";
import { LabelManager } from "@lib/LabelManager.js";
import { Floor } from "@three/FloorGeometry.js";

// 🔌 Env
const WS_URL =
  import.meta.env.VITE_CLOUD_WS ||
  import.meta.env.VITE_LOCAL_WS ||
  "ws://localhost:8123/api/websocket";
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN;

// 🔧 Globals
let camera, renderer, controls;

// ✅ Essentials
const scene = new THREE.Scene();
const layoutManager = new LabelLayoutManager(scene, {}, roomRegistry);
const labelManager = new LabelManager(scene, labelRegistry, roomRegistry);

try {
  labelManager.injectLabels(); // Inject labels early as before
} catch (error) {
  console.error("❌ Error injecting labels:", error);
}

const floor = new Floor(); // Add floor
scene.add(floor.mesh);

// ✅ Setup injection
function attachSetup({ scene: setupScene, cam, re, orbCtrls }) {
  camera = cam;
  renderer = re;
  controls = orbCtrls;
  scene.add(new THREE.AmbientLight(0xffffff, 1.0));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(50, 100, 50);
  scene.add(dirLight);
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
  labels,
  connectToHomeAssistantWS,
  updateLabel,
  attachSetup,
};

// --- END OF FILE scene.js (Modified) ---
