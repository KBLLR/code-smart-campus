
/**
 * src/ha/wsClient.js
 * 
 * Home Assistant WebSocket Client.
 * Manages persistent connection, auth, and low-level protocol.
 */

import { haConfig } from './config.js';

let socket = null;
let msgId = 1;
let connected = false;
let authenticated = false;
let reconnectTimer = null;

// Map of command ID -> { resolve, reject }
const pendingCommands = new Map();

// Event listeners
const eventListeners = {
  // 'state_changed': [func, func], ...
};

const connectionListeners = []; // funcs(state: 'connecting'|'ready'|'error'|'disconnected')

function notifyConnectionState(state) {
  connectionListeners.forEach(cb => cb(state));
}

function nextId() {
  return msgId++;
}

/**
 * Connect to Home Assistant WebSocket API
 */
export function connect() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return; // Already connecting or connected
  }

  console.log(`[Home Assistant] Connecting WS...`);
  notifyConnectionState('connecting');

  let url = haConfig.wsUrl;
  // Fallback: If URL is missing or looks like root path, derive from window location (proxy)
  if (!url || url === '/' || url.endsWith('5173/')) {
     const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
     url = `${proto}//${window.location.host}/api/websocket`;
     console.log(`[Home Assistant] Using derived WS URL: ${url}`);
  }

  try {
    socket = new WebSocket(url);
  } catch (e) {
    console.error('[Home Assistant] WebSocket creation failed:', e);
    scheduleReconnect();
    return;
  }

  socket.onopen = () => {
    console.log('[Home Assistant] WS Connected. Waiting for auth...');
    // Do not set connected=true yet, wait for auth_ok
  };

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      handleMessage(msg);
    } catch (e) {
      console.error('[Home Assistant] Error parsing WS message:', e);
    }
  };

  socket.onclose = (event) => {
    console.log(`[Home Assistant] WS Closed (code: ${event.code})`, event.reason);
    cleanup();
    scheduleReconnect();
  };

  socket.onerror = (error) => {
    console.error('[Home Assistant] WS Error:', error);
    // onError usually follows with onClose
  };
}

function cleanup() {
  connected = false;
  authenticated = false;
  notifyConnectionState('disconnected');
  // Reject all pending commands
  pendingCommands.forEach((promise, id) => {
    promise.reject(new Error('Connection closed'));
  });
  pendingCommands.clear();
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  console.log(`[Home Assistant] Reconnecting in ${haConfig.reconnectDelayMs}ms...`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, haConfig.reconnectDelayMs);
}

/**
 * Handle incoming WS messages
 */
function handleMessage(msg) {
  // 1. Auth Phase
  if (msg.type === 'auth_required') {
    sendAuth();
    return;
  }
  if (msg.type === 'auth_ok') {
    authenticated = true;
    connected = true;
    console.log('[Home Assistant] WS Authenticated.');
    notifyConnectionState('ready');
    // Resubscribe to events if we have logic for that (implemented by caller via subscribeEvents usually)
    // But since this is a low-level client, we just let consumer re-subscribe or we handle sticky subs.
    // For now, simple client.
    return;
  }
  if (msg.type === 'auth_invalid') {
    console.error('[Home Assistant] Auth invalid:', msg.message);
    socket.close(); // Will trigger reconnect, but auth failure usually fatal unless token changes.
    return;
  }

  // 2. Command Responses
  if (msg.id && pendingCommands.has(msg.id)) {
    const { resolve, reject } = pendingCommands.get(msg.id);
    pendingCommands.delete(msg.id);
    
    if (msg.success) {
      resolve(msg.result);
    } else {
      reject(new Error(msg.error ? msg.error.message : 'Unknown error'));
    }
    return;
  }

  // 3. Events
  if (msg.type === 'event') {
    // msg.event contains details
    const listeners = eventListeners[msg.event.event_type] || [];
    listeners.forEach(cb => cb(msg.event));
    
    // Also global listeners
    const allListeners = eventListeners['*'] || [];
    allListeners.forEach(cb => cb(msg));
  }
}

function sendAuth() {
  socket.send(JSON.stringify({
    type: 'auth',
    access_token: haConfig.token
  }));
}

/**
 * Send a command and wait for response
 */
export function sendCommand(command) {
  if (!authenticated) {
    return Promise.reject(new Error('Not authenticated'));
  }
  
  const id = nextId();
  const payload = { ...command, id };
  
  return new Promise((resolve, reject) => {
    pendingCommands.set(id, { resolve, reject });
    socket.send(JSON.stringify(payload));
  });
}

/**
 * Subscribe to events
 */
export async function subscribeEvents(eventType, handler) {
  if (!eventListeners[eventType]) {
    eventListeners[eventType] = [];
  }
  eventListeners[eventType].push(handler);

  // If connected, tell HA we want these events
  if (authenticated) {
    if (eventType !== '*') {
      // NOTE: multiple subscriptions for same event_type are technically allowed but redundant if not filtered.
      // Minimal implementation:
      return sendCommand({
        type: 'subscribe_events',
        event_type: eventType
      });
    } else {
      return sendCommand({ type: 'subscribe_events' }); 
    }
  }
}

export function onConnectionStateChange(handler) {
  connectionListeners.push(handler);
}

export function isConnected() {
  return connected && authenticated;
}
