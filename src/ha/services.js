
/**
 * src/ha/services.js
 * 
 * Helper functions to call Home Assistant services.
 */

import { callService } from './restClient.js';
import { getRoomEntityConfig } from './roomMapping.js';

/**
 * Control room lights
 * @param {string} roomId 
 * @param {string} mode - 'on', 'off'
 */
export async function setRoomLights(roomId, mode) {
  const cfg = getRoomEntityConfig(roomId);
  if (!cfg || !cfg.lighting) {
    console.warn(`[HA Services] No lighting configured for room ${roomId}`);
    return;
  }

  const lights = Array.isArray(cfg.lighting) ? cfg.lighting : [cfg.lighting];
  
  const service = mode === 'off' ? 'turn_off' : 'turn_on';
  
  // Call for each light or group?
  // We can pass entity_id as list to HA
  await callService('light', service, {
    entity_id: lights
  });
  
  console.log(`[HA Services] Set lights ${mode} for room ${roomId}`);
}

/**
 * Trigger a scene
 * @param {string} sceneEntityId 
 */
export async function triggerScene(sceneEntityId) {
  if (!sceneEntityId.startsWith('scene.')) {
    console.warn(`[HA Services] Invalid scene entity: ${sceneEntityId}`);
    return;
  }
  await callService('scene', 'turn_on', { entity_id: sceneEntityId });
  console.log(`[HA Services] Triggered scene ${sceneEntityId}`);
}
