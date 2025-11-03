const HA_URL = import.meta.env.VITE_HA_URL;
const TOKEN = import.meta.env.VITE_HA_TOKEN;

if (!HA_URL || !TOKEN) {
  console.error(
    "FATAL: VITE_HA_URL and VITE_HA_TOKEN must be set in your .env file!",
  );
}

const WS_URL = HA_URL ? HA_URL.replace(/^http/, "ws") + "/api/websocket" : null;

let areas = {};
let devices = {};
let entities = {};
let ws = null;
let wsMessageId = 1;
let wsAuthenticated = false;
let wsConnected = false;
let pollingIntervalId = null;
let connectionAttemptIntervalId = null;
let updateListeners = [];
let isConnecting = false;
let initialDataFetched = false;

async function apiRequest(endpoint) {
  if (!HA_URL) throw new Error("HA_URL is not configured.");
  try {
    const res = await fetch(`${HA_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok)
      throw new Error(`API request failed ${res.status}: ${await res.text()}`);
    return await res.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

function formatEntityState(entityData) {
  if (!entityData) return "N/A";
  const state = entityData.state;
  const attributes = entityData.attributes || {};
  const unit = attributes.unit_of_measurement || "";
  if (state === "unavailable") return "Unavailable";
  if (state === "unknown") return "Unknown";
  if (entityData.entity_id.startsWith("binary_sensor.")) {
    const deviceClass = attributes.device_class;
    if (state === "on") {
      switch (deviceClass) {
        case "motion":
        case "occupancy":
          return "Detected";
        case "door":
        case "window":
          return "Open";
        case "plug":
          return "Plugged In";
        case "gas":
        case "smoke":
        case "moisture":
          return "Detected";
        default:
          return "On";
      }
    } else {
      switch (deviceClass) {
        case "motion":
        case "occupancy":
          return "Clear";
        case "door":
        case "window":
          return "Closed";
        case "plug":
          return "Unplugged";
        case "gas":
        case "smoke":
        case "moisture":
          return "Clear";
        default:
          return "Off";
      }
    }
  }
  if (entityData.entity_id.startsWith("sensor.")) {
    const deviceClass = attributes.device_class;
    switch (deviceClass) {
      case "temperature":
        return `${state}${unit || "°"}`;
      case "humidity":
        return `${state}${unit || "%"}`;
      case "power":
        return `${state}${unit || "W"}`;
      case "energy":
        return `${state}${unit || "kWh"}`;
      case "pressure":
        return `${state}${unit || "hPa"}`;
      case "illuminance":
        return `${state}${unit || "lx"}`;
      case "voltage":
        return `${state}${unit || "V"}`;
      case "current":
        return `${state}${unit || "A"}`;
      case "pm25":
      case "pm10":
        return `${state}${unit || "µg/m³"}`;
      case "carbon_dioxide":
        return `${state}${unit || "ppm"}`;
      case "volatile_organic_compounds":
        return `${state}${unit || ""}`;
      case "aqi":
        return `${state} ${unit || "AQI"}`;
    }
  }
  if (entityData.entity_id.startsWith("media_player."))
    return state.charAt(0).toUpperCase() + state.slice(1);
  if (
    entityData.entity_id.startsWith("switch.") ||
    entityData.entity_id.startsWith("light.")
  )
    return state === "on" ? "On" : "Off";
  return `${state}${unit ? " " + unit : ""}`;
}

async function fetchInitialData() {
  console.log("HA: Fetching initial data...");
  isConnecting = true;
  try {
    const [areasData, devicesData, statesData] = await Promise.all([
      apiRequest("/api/areas").catch((e) => {
        console.error("Failed to fetch areas", e);
        return [];
      }),
      apiRequest("/api/devices").catch((e) => {
        console.error("Failed to fetch devices", e);
        return [];
      }),
      apiRequest("/api/states").catch((e) => {
        console.error("Failed to fetch states", e);
        return [];
      }),
    ]);
    if (statesData.length === 0)
      throw new Error("Failed to fetch essential state data.");

    const newAreas = {};
    areasData.forEach(
      (a) => (newAreas[a.area_id] = { ...a, devices: {}, entities: {} }),
    );
    areas = newAreas;
    const newDevices = {};
    devicesData.forEach((d) => {
      newDevices[d.id] = { ...d, entities: {} };
      if (d.area_id && areas[d.area_id])
        areas[d.area_id].devices[d.id] = newDevices[d.id];
    });
    devices = newDevices;
    const newEntities = {};
    statesData.forEach(
      (e) =>
        (newEntities[e.entity_id] = {
          entity_id: e.entity_id,
          state: e.state,
          attributes: e.attributes,
          last_changed: e.last_changed,
          last_updated: e.last_updated,
          context: e.context,
          device_id: null,
          area_id: null,
        }),
    );
    entities = newEntities;

    Object.values(entities).forEach((entity) => {
      const attributes = entity.attributes || {};
      const directDeviceId = attributes.device_id;
      const directAreaId = attributes.area_id;
      if (directDeviceId && devices[directDeviceId]) {
        entity.device_id = directDeviceId;
        devices[directDeviceId].entities[entity.entity_id] = entity;
        entity.area_id = directAreaId || devices[directDeviceId].area_id;
      } else if (directAreaId && areas[directAreaId]) {
        entity.area_id = directAreaId;
      } else {
        const potentialDevice = Object.values(devices).find(
          (d) =>
            d.area_id &&
            entity.entity_id.includes(
              d.name?.toLowerCase().replace(/\s/g, "_"),
            ),
        );
        if (potentialDevice) {
          entity.device_id = potentialDevice.id;
          entity.area_id = potentialDevice.area_id;
          if (devices[entity.device_id])
            devices[entity.device_id].entities[entity.entity_id] = entity;
        }
      }
      if (entity.area_id && areas[entity.area_id]) {
        if (
          !entity.device_id ||
          !areas[entity.area_id].devices[entity.device_id]
        )
          areas[entity.area_id].entities[entity.entity_id] = entity;
        else if (
          entity.device_id &&
          areas[entity.area_id].devices[entity.device_id]
        )
          areas[entity.area_id].devices[entity.device_id].entities[
            entity.entity_id
          ] = entity;
      }
    });

    console.log(
      `HA: Initial data fetched: ${Object.keys(areas).length} Areas, ${Object.keys(devices).length} Devices, ${Object.keys(entities).length} Entities.`,
    );
    initialDataFetched = true;
    notifyListeners();
  } catch (error) {
    console.error("HA: Failed initial data fetch:", error);
    initialDataFetched = false;
    throw error;
  } finally {
    isConnecting = false;
  }
}

function handleWebSocketMessage(event) {
  try {
    const msg = JSON.parse(event.data);
    switch (msg.type) {
      case "auth_required":
        ws?.send(JSON.stringify({ type: "auth", access_token: TOKEN }));
        break;
      case "auth_ok":
        wsAuthenticated = true;
        stopConnectionRetry();
        ws?.send(
          JSON.stringify({
            id: wsMessageId++,
            type: "subscribe_events",
            event_type: "state_changed",
          }),
        );
        console.log("HA WS: Authenticated & Subscribed.");
        break;
      case "auth_invalid":
        console.error("HA WS: Auth failed:", msg.message);
        ws?.close(1008, "Auth Failed");
        wsAuthenticated = false;
        wsConnected = false;
        break;
      case "event":
        if (msg.event?.event_type === "state_changed") {
          const { entity_id, new_state } = msg.event.data;
          if (!entity_id) return;
          if (new_state) {
            const oldState = entities[entity_id]?.state;
            const oldAttr = JSON.stringify(entities[entity_id]?.attributes);
            const newAttr = JSON.stringify(new_state.attributes);
            entities[entity_id] = {
              ...(entities[entity_id] || {}),
              entity_id: new_state.entity_id,
              state: new_state.state,
              attributes: new_state.attributes,
              last_changed: new_state.last_changed,
              last_updated: new_state.last_updated,
              context: new_state.context,
            };
            if (new_state.state !== oldState || newAttr !== oldAttr)
              notifyListeners(entity_id);
          } else {
            if (entities[entity_id]) {
              entities[entity_id].state = "unavailable";
              notifyListeners(entity_id);
            }
          }
        }
        break;
      case "result":
        if (!msg.success)
          console.error(`HA WS: Command (ID: ${msg.id}) failed:`, msg.error);
        break;
    }
  } catch (error) {
    console.error("HA WS: Error processing message:", error, event.data);
  }
}

function connectWebSocket() {
  if (!WS_URL) {
    console.error("HA WS: Cannot connect, URL missing.");
    return;
  }
  if (
    (ws &&
      (ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING)) ||
    isConnecting
  )
    return;
  console.log(`HA WS: Connecting to ${WS_URL}...`);
  isConnecting = true;
  ws = new WebSocket(WS_URL);
  wsMessageId = 1;
  wsAuthenticated = false;
  ws.onopen = () => {
    console.log("HA WS: Connected.");
    wsConnected = true;
    isConnecting = false;
    stopConnectionRetry();
    stopPollingFallback();
  };
  ws.onmessage = handleWebSocketMessage;
  ws.onerror = (error) => {
    console.error("HA WS: Error:", error);
    isConnecting = false;
  };
  ws.onclose = (event) => {
    console.log(
      `HA WS: Closed. Code: ${event.code}, Reason: ${event.reason || "N/A"}`,
    );
    wsConnected = false;
    wsAuthenticated = false;
    isConnecting = false;
    ws = null;
    if (event.code !== 1000 && event.code !== 1008) {
      console.log("HA WS: Unexpected close.");
      startConnectionRetry();
      startPollingFallback();
    } else if (event.code === 1008)
      console.error("HA WS: Auth failed, check token.");
  };
}

function startConnectionRetry(interval = 15000) {
  if (connectionAttemptIntervalId) return;
  console.log(`HA WS: Attempting reconnect every ${interval / 1000}s...`);
  connectionAttemptIntervalId = setInterval(() => {
    if (!wsConnected && !isConnecting) connectWebSocket();
  }, interval);
  if (!wsConnected && !isConnecting) setTimeout(connectWebSocket, 1000);
}

function stopConnectionRetry() {
  if (connectionAttemptIntervalId) {
    clearInterval(connectionAttemptIntervalId);
    connectionAttemptIntervalId = null;
  }
}

async function pollStates() {
  if (wsConnected && wsAuthenticated) {
    stopPollingFallback();
    return;
  }
  console.log("HA: Polling via REST...");
  try {
    const statesData = await apiRequest("/api/states");
    let changed = false;
    statesData.forEach((newState) => {
      const entityId = newState.entity_id;
      const oldState = entities[entityId];
      if (
        !oldState ||
        oldState.state !== newState.state ||
        JSON.stringify(oldState.attributes) !==
          JSON.stringify(newState.attributes)
      ) {
        entities[entityId] = {
          ...(oldState || {}),
          entity_id: newState.entity_id,
          state: newState.state,
          attributes: newState.attributes,
          last_changed: newState.last_changed,
          last_updated: newState.last_updated,
          context: newState.context,
        };
        changed = true;
      }
    });
    if (changed) {
      console.log("HA Polling: Changes detected.");
      notifyListeners();
    }
  } catch (error) {
    console.error("HA Polling Failed:", error);
    if (error.message.includes("401")) {
      console.error("HA Polling: Auth error. Stopping.");
      stopPollingFallback();
      stopConnectionRetry();
    }
  }
}

/**
 * Starts a fallback polling mechanism using REST API if WebSocket connection is not active.
 * This function is called internally when WebSocket connection fails or is not established.
 * @param {number} interval - The polling interval in milliseconds.
 */
function startPollingFallback(interval = 30000) {
  if (pollingIntervalId || (wsConnected && wsAuthenticated)) return;
  console.warn(`HA: Starting REST polling fallback (${interval / 1000}s).`);
  stopConnectionRetry();
  if (!initialDataFetched) {
    pollStates().finally(() => {
      if (!pollingIntervalId)
        pollingIntervalId = setInterval(pollStates, interval);
    });
  } else {
    pollingIntervalId = setInterval(pollStates, interval);
  }
}

function stopPollingFallback() {
  if (pollingIntervalId) {
    console.log("HA: Stopping REST polling.");
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
  }
}

export function onUpdate(callback) {
  if (typeof callback === "function" && !updateListeners.includes(callback))
    updateListeners.push(callback);
}
export function offUpdate(callback) {
  updateListeners = updateListeners.filter((listener) => listener !== callback);
}
function notifyListeners(entityId = null) {
  updateListeners.forEach((listener) => {
    try {
      listener(entityId);
    } catch (error) {
      console.error("HA: Error in listener:", error);
    }
  });
}

export async function connectHomeAssistant() {
  if (!HA_URL || !TOKEN || !WS_URL) throw new Error("HA config missing.");
  if (isConnecting || (wsConnected && initialDataFetched)) return;
  try {
    await fetchInitialData();
    connectWebSocket();
  } catch (initialError) {
    console.error("HA: Initial fetch failed, trying WS anyway...");
    connectWebSocket();
    throw initialError;
  }
}

export function getAreas() {
  return areas;
}
export function getAreaDetails(areaId) {
  return areas[areaId] || null;
}
export function getDevices() {
  return devices;
}
export function getDeviceDetails(deviceId) {
  return devices[deviceId] || null;
}
export function getEntities() {
  return entities;
}
export function getEntityState(entityId) {
  return entities[entityId] || null;
}
export function getFormattedEntityState(entityId) {
  return formatEntityState(entities[entityId]);
}
export function forceRefreshStates() {
  if (!pollingIntervalId) pollStates();
  else console.log("HA: Polling active.");
}
export function getConnectionStatus() {
  return {
    restAvailable: initialDataFetched,
    websocketConnected: wsConnected,
    websocketAuthenticated: wsAuthenticated,
    pollingActive: !!pollingIntervalId,
    isConnecting: isConnecting,
  };
}
export function disconnectHomeAssistant() {
  console.log("HA: Disconnecting...");
  stopConnectionRetry();
  stopPollingFallback();
  ws?.close(1000, "User disconnect");
  ws = null;
  wsConnected = false;
  wsAuthenticated = false;
  isConnecting = false;
}
