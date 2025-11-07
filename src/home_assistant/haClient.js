const RAW_BASE =
  import.meta.env.VITE_HA_URL || import.meta.env.VITE_CLOUD_REST || "";
const BASE_URL = (() => {
  if (!RAW_BASE) return "";
  const trimmed = RAW_BASE.endsWith("/")
    ? RAW_BASE.slice(0, RAW_BASE.length - 1)
    : RAW_BASE;
  if (trimmed === "/api") {
    return trimmed;
  }
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
})();
const TOKEN =
  import.meta.env.VITE_HA_TOKEN ||
  import.meta.env.VITE_CLOUD_TOKEN ||
  "";

function ensureConfigured() {
  if (!BASE_URL || !TOKEN) {
    throw new Error(
      "[haClient] Missing VITE_HA_URL or VITE_HA_TOKEN. Update your .env.local.",
    );
  }
}

async function haRequest(path, { method = "GET", body, headers = {} } = {}) {
  ensureConfigured();

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${BASE_URL}${normalizedPath}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `[haClient] ${method} ${path} failed (${response.status}): ${detail || response.statusText}`,
    );
  }

  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  return response.text();
}

/**
 * Fetches entity history for the given time window.
 * @param {string} entityId
 * @param {{ hours?: number }} options
 * @returns {Promise<Array<{ timestamp: string, state: string, value: number | null }>>}
 */
export async function fetchEntityHistory(entityId, { hours = 6 } = {}) {
  if (!entityId) throw new Error("[haClient] entityId is required.");
  const windowHours = Math.max(1, Math.min(24 * 7, hours)); // clamp to 7 days
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();
  const search = new URLSearchParams({
    filter_entity_id: entityId,
    minimal_response: "true",
    no_attributes: "true",
  });

  const data = await haRequest(`/history/period/${since}?${search.toString()}`);
  if (!Array.isArray(data) || !data.length) return [];
  return data[0]
    .filter((entry) => entry && entry.last_changed)
    .map((entry) => {
      const numeric = Number.parseFloat(entry.state);
      return {
        timestamp: entry.last_changed,
        state: entry.state,
        value: Number.isFinite(numeric) ? numeric : null,
      };
    });
}

/**
 * Requests Home Assistant to refresh an entity via update_entity service.
 * @param {string} entityId
 * @returns {Promise<void>}
 */
export async function requestEntityRefresh(entityId) {
  if (!entityId) throw new Error("[haClient] entityId is required.");
  await haRequest("/services/homeassistant/update_entity", {
    method: "POST",
    body: JSON.stringify({ entity_id: entityId }),
  });
}

export function isHaApiConfigured() {
  return Boolean(BASE_URL && TOKEN);
}
