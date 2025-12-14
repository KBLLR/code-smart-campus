
/**
 * src/ha/config.js
 * 
 * Home Assistant Configuration Contract.
 * 
 * This module is the single source of truth for HA connection settings.
 * It validates environment variables at startup and exports a consistent config object.
 */

// We assume these are injected via Vite's `import.meta.env` or global `process.env` depending on context.
// In a Vite app, usage is `import.meta.env.VITE_HA_BASE_URL`.
// However, the instructions say "Read and validate env: HA_BASE_URL".
// If this is running in a browser environment via Vite, we need `VITE_` prefix usually, 
// OR we might be using a backend proxy.
// Given the "Tier 1 server bootstrap" mention in Phase 8, this might be Node.js.
// But the project structure shows "vite.config.js" and "src/main.js" which implies client-side.
// The user mentions "authenticate using long-lived access tokens from the user profile".
// PLEASE NOTE: If this is client-side, exposing the Long Lived Token in client code is security risk if committed.
// But we will follow instructions: "Read and validate env".
// We'll support both import.meta.env (Vite) and process.env (Node) just in case, 
// favoring the standard env var names if available, or VITE_ prefixed.

function getEnv(key) {
  // Try Vite way
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // Check for raw key or VITE_ prefixed key
    if (import.meta.env[key]) return import.meta.env[key];
    if (import.meta.env[`VITE_${key}`]) return import.meta.env[`VITE_${key}`];
  }
  // Try Node way
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}

// Function to normalize the Base URL
function normalizeBaseUrl(url) {
  if (!url) return ''; // Default to empty relative path (implies using current origin)
  let normalized = url.trim();
  // Remove trailing headers
  if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  // Remove trailing /api if present to avoid duplication (restClient adds it)
  if (normalized.endsWith('/api')) normalized = normalized.slice(0, -4);
  return normalized;
}

const rawBaseUrl = getEnv('HA_BASE_URL') || getEnv('HA_URL');
const baseUrl = normalizeBaseUrl(rawBaseUrl);

const token = getEnv('HA_ACCESS_TOKEN') || getEnv('HA_TOKEN');

// Optional overrides
const wsUrlOverride = getEnv('HA_WS_URL');
const reconnectDelayMs = parseInt(getEnv('HA_RECONNECT_DELAY_MS') || '5000', 10);
const requestTimeoutMs = parseInt(getEnv('HA_REQUEST_TIMEOUT_MS') || '8000', 10);

// Validation
const missing = [];
// We don't strictly enforce BASE_URL presence anymore to allow default relative behavior
if (!token) missing.push('HA_ACCESS_TOKEN');

if (missing.length > 0) {
  const msg = `[Home Assistant] Missing required environment variables: ${missing.join(', ')}.
Please ensure .env contains VITE_HA_ACCESS_TOKEN (or legacy VITE_HA_TOKEN).
HA integration will fail.`;
  console.error(msg);
  throw new Error(msg);
}

// Robustly derive WS URL
const deriveWsUrl = (httpBase) => {
  if (wsUrlOverride) return wsUrlOverride;

  // If httpBase is absolute
  if (httpBase.startsWith('http://') || httpBase.startsWith('https://')) {
    try {
      const url = new URL(httpBase);
      const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${url.host}/api/websocket`;
    } catch (e) {
      console.warn('[Home Assistant] Invalid HA_BASE_URL for WS derivation:', e);
      return '';
    }
  }

  // If httpBase is relative (or empty), use window.location if available (browser)
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    // We assume the proxy is at /api/websocket relative to current origin
    return `${protocol}//${host}/api/websocket`;
  }
  
  return ''; // Fallback
};

const wsUrl = deriveWsUrl(baseUrl);

export const haConfig = {
  baseUrl, 
  wsUrl,
  token,
  reconnectDelayMs,
  requestTimeoutMs,
};

console.log('[Home Assistant] Config loaded.', { baseUrl: haConfig.baseUrl, wsUrl: haConfig.wsUrl });
