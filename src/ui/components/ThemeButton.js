let socket = null;
let retryCount = 0;
let lastMessageTime = null;

export function connectToWebSocket(url, token, onMessage) {
  socket = new WebSocket(url);

  socket.onopen = () => {
    console.log("[WS] Connected");
    socket.send(JSON.stringify({ type: "auth", access_token: token }));
    retryCount = 0;
  };

  socket.onmessage = (event) => {
    lastMessageTime = Date.now();
    const msg = JSON.parse(event.data);
    if (msg.type === "auth_ok") {
      socket.send(
        JSON.stringify({
          id: 1,
          type: "subscribe_events",
          event_type: "state_changed",
        }),
      );
    } else if (msg.type === "event" && msg.event?.data?.new_state) {
      const entityId = msg.event.data.entity_id;
      const state = msg.event.data.new_state.state;
      const unit =
        msg.event.data.new_state.attributes.unit_of_measurement || "";
      onMessage(entityId, `${state} ${unit}`);
    }
  };

  socket.onerror = (err) => {
    console.warn("[WS] Error:", err);
  };

  socket.onclose = () => {
    console.warn("[WS] Closed. Reconnecting in 3s...");
    retryCount++;
    setTimeout(() => connectToWebSocket(url, token, onMessage), 3000);
  };

  return socket;
}

export function getWebSocketStatus() {
  return {
    connected: socket?.readyState === 1,
    retryCount,
    lastMessageTime,
  };
}
