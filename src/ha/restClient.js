
/**
 * src/ha/restClient.js
 * 
 * Home Assistant REST Client.
 * Wraps direct fetch calls to the HA REST API.
 */

import { haConfig } from './config.js';

class HomeAssistantError extends Error {
  constructor(status, endpoint, message) {
    super(`[${status}] ${endpoint}: ${message}`);
    this.name = 'HomeAssistantError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

/**
 * Generic fetch wrapper for HA
 */
async function haFetch(endpoint, options = {}) {
  let base = haConfig.baseUrl || '';
  // Normalize: remove all trailing slashes from base
  while (base.endsWith('/')) {
    base = base.slice(0, -1);
  }

  // If base ends with /api and endpoint starts with /api, strip one from base
  if (base.endsWith('/api') && endpoint.startsWith('/api')) {
    base = base.slice(0, -4);
  }
  
  const url = `${base}${endpoint}`;
  
  const headers = {
    'Authorization': `Bearer ${haConfig.token}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), haConfig.requestTimeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(id);

    if (!response.ok) {
      let msg = response.statusText;
      try {
        const errBody = await response.json();
        if (errBody && errBody.message) msg = errBody.message;
      } catch (e) {
        // ignore parse error of error body
      }
      const errPrefix = `[HomeAssistant] Request failed: ${url}`;
      console.error(errPrefix, response.status, response.statusText);
      throw new HomeAssistantError(response.status, endpoint, `${msg} (URL: ${url})`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(id);
    if (error instanceof HomeAssistantError) throw error;
    // Network errors or aborts
    throw new HomeAssistantError(0, endpoint, error.message);
  }
}

/**
 * Get all states (initial snapshot)
 * GET /api/states
 */
export async function getStates() {
  return await haFetch('/api/states');
}

/**
 * Get single entity state
 * GET /api/states/{entity_id}
 */
export async function getState(entityId) {
  return await haFetch(`/api/states/${entityId}`);
}

/**
 * Call a service
 * POST /api/services/{domain}/{service}
 */
export async function callService(domain, service, data = {}) {
  // If data has entity_id as array, format it if needed, but HA API handles lists usually.
  return await haFetch(`/api/services/${domain}/${service}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
