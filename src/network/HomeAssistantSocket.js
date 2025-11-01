// /network/HomeAssistantSocket.js

const WS_URL =
  import.meta.env.VITE_CLOUD_WS ||
  import.meta.env.VITE_LOCAL_WS ||
  "ws://localhost:8123/api/websocket";
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN;

export function createHomeAssistantSocket({
  onStateUpdate = () => {},
  onInitialStates = () => {},
  url = WS_URL,
  token = HA_TOKEN,
} = {}) {
  if (!url) throw new Error("WebSocket URL not provided");

  let socket = null;
  let reconnectTimer = null;
  let reconnectDelay = 5000;
  let commandIdCounter = 1;
  const subscriptions = new Map();

  const connect = () => {
    if (socket && socket.readyState <= 1) return socket;

    socket = new WebSocket(url);

    socket.onopen = () => {
      console.log("[HA] Connected.");
      reconnectDelay = 5000;
      if (token) {
        socket.send(JSON.stringify({ type: "auth", access_token: token }));
      } else {
        console.warn("[HA] No auth token provided.");
      }
    };

    socket.onclose = (event) => {
      console.warn(
        `Disconnected: ${event.code} (${event.reason}). Reconnecting...`,
      );
      scheduleReconnect();
    };

    socket.onerror = (err) => {
      console.error("[HA] WebSocket error:", err);
      socket.close();
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "auth_ok") {
          console.log("[HA] Auth OK ✅");
          sendCommand("get_states");
          sendCommand("subscribe_events", { event_type: "state_changed" });
        } else if (
          msg.type === "result" &&
          msg.success &&
          Array.isArray(msg.result)
        ) {
          onInitialStates(msg.result);
        } else if (msg.type === "event") {
          const eventType = msg.event.event_type;
          const handler = subscriptions.get(eventType);
          if (handler) handler(msg.event.data);

          if (eventType === "state_changed" && msg.event.data.new_state) {
            const entity = msg.event.data.new_state;
            onStateUpdate(entity.entity_id, entity);
          }
        }
      } catch (error) {
        console.error("[HA] Message parsing error:", error);
      }
    };

    return socket;
  };

  const scheduleReconnect = () => {
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      reconnectDelay = Math.min(reconnectDelay * 2, 60000);
      connect();
    }, reconnectDelay);
  };

  const sendCommand = (type, payload = {}) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn("[HA] Cannot send, socket not ready");
      return;
    }
    const id = commandIdCounter++;
    socket.send(JSON.stringify({ id, type, ...payload }));
    return id;
  };

  const subscribe = (eventType, callback) => {
    subscriptions.set(eventType, callback);
    sendCommand("subscribe_events", { event_type: eventType });
  };

  const unsubscribe = (eventType) => {
    subscriptions.delete(eventType);
    // Optional: implement unsubscribing with known subscription IDs if needed
  };

  const disconnect = () => {
    if (socket) {
      socket.close();
      socket = null;
      clearTimeout(reconnectTimer);
    }
  };

  return {
    connect,
    sendCommand,
    subscribe,
    unsubscribe,
    disconnect,
    getSocket: () => socket,
  };
}
