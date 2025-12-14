
/**
 * src/ha/entityCache.js
 * 
 * Home Assistant Entity Cache.
 * Maintains up-to-date state of all entities.
 */

import { getStates } from './restClient.js';
import { connect, subscribeEvents, onConnectionStateChange } from './wsClient.js';

const entityMap = new Map(); // entity_id -> stateObj

// Listeners for specific entities? Or just use event bus?
// This module purely maintains the cache state.

export async function initEntityCache() {
  console.log('[HA Cache] Initializing...');

  // 1. Initial Snapshot
  try {
    const states = await getStates();
    states.forEach(stateObj => {
      entityMap.set(stateObj.entity_id, stateObj);
    });
    console.log(`[HA Cache] Loaded ${entityMap.size} entities from REST snapshot.`);
  } catch (e) {
    console.error('[HA Cache] Failed to load initial snapshot:', e);
    // Non-fatal? We can rely on WS later? ideally fatal for consistent startup.
  }

  // 2. Start WebSocket and Sync
  onConnectionStateChange((state) => {
    if (state === 'ready') {
      console.log('[HA Cache] WS Ready, subscribing to state_changed...');
      // Sub to state_changed
      subscribeEvents('state_changed', handleStateChanged);
    }
  });

  connect();
}

function handleStateChanged(event) {
  // event.data.entity_id
  // event.data.new_state
  const { entity_id, new_state } = event.data;
  if (new_state) {
    entityMap.set(entity_id, new_state);
  } else {
    // entity removed?
    entityMap.delete(entity_id);
  }
  // We do NOT emit here. The event bus (haBus) will attach its own listener to wsClient.
  // OR wsClient emits to everyone.
  // The cache is just a passive store for synchronous access (getEntity).
}

export function getEntity(entityId) {
  return entityMap.get(entityId) || null;
}

export function getEntitiesByDomain(domain) {
  const results = [];
  for (const [id, state] of entityMap) {
    if (id.startsWith(domain + '.')) {
      results.push(state);
    }
  }
  return results;
}

export function getAllEntities() {
  return Array.from(entityMap.values());
}
