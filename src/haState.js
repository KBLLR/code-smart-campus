// src/home_assistant/haState.js
// Simple module to store and access HA state centrally

let _haStates = []; // Array of entity objects { entity_id, state, attributes, ... }
let _entitiesById = {}; // Map for quick lookup by entity_id
let _entitiesByFriendlyName = {}; // Map for lookup by friendly_name (less reliable)

/**
 * Sets the central state array and builds lookup maps.
 * Should be called once after receiving initial states.
 * @param {Array<object>} states - The array of entity state objects from HA.
 */
export function setHaStates(states) {
  if (!Array.isArray(states)) {
    console.error("[haState] Invalid states data received:", states);
    return;
  }
  _haStates = states;
  _entitiesById = {};
  _entitiesByFriendlyName = {};
  _haStates.forEach((entity) => {
    if (entity && entity.entity_id) {
      _entitiesById[entity.entity_id] = entity;
      if (entity.attributes?.friendly_name) {
        // Handle potential duplicate friendly names? Last one wins for now.
        _entitiesByFriendlyName[entity.attributes.friendly_name] = entity;
      }
    }
  });
  console.log(
    `[haState] Stored ${Object.keys(_entitiesById).length} entities.`,
  );
}

/**
 * Updates a single entity state in the central store.
 * @param {object} entity - The updated entity state object.
 */
export function updateEntityState(entity) {
  if (!entity || !entity.entity_id) return;

  const existingEntity = _entitiesById[entity.entity_id];
  if (existingEntity) {
    // Update existing entry
    Object.assign(existingEntity, entity);
    // Update friendly name map if name changed (though unlikely via state_changed)
    if (
      entity.attributes?.friendly_name &&
      entity.attributes.friendly_name !==
        existingEntity.attributes?.friendly_name
    ) {
      // Remove old name entry if it pointed here
      if (
        existingEntity.attributes?.friendly_name &&
        _entitiesByFriendlyName[existingEntity.attributes.friendly_name]
          ?.entity_id === entity.entity_id
      ) {
        delete _entitiesByFriendlyName[existingEntity.attributes.friendly_name];
      }
      _entitiesByFriendlyName[entity.attributes.friendly_name] = existingEntity;
    }
  } else {
    // Add new entity
    _haStates.push(entity);
    _entitiesById[entity.entity_id] = entity;
    if (entity.attributes?.friendly_name) {
      _entitiesByFriendlyName[entity.attributes.friendly_name] = entity;
    }
  }
}

/**
 * Gets the full array of stored states.
 * @returns {Array<object>}
 */
export function getHaStates() {
  return _haStates;
}

/**
 * Finds an entity by its entity_id.
 * @param {string} entityId
 * @returns {object | undefined} The entity object or undefined if not found.
 */
export function findEntity(entityId) {
  return _entitiesById[entityId];
}

/**
 * Finds an entity by its friendly_name attribute.
 * Note: Less reliable than finding by entity_id as friendly names might not be unique.
 * @param {string} friendlyName
 * @returns {object | undefined} The entity object or undefined if not found.
 */
export function findEntityByFriendlyName(friendlyName) {
  return _entitiesByFriendlyName[friendlyName];
}

/**
 * Gets the formatted state string (state + unit).
 * @param {string} entityId
 * @returns {string} Formatted state or 'N/A'.
 */
export function getFormattedState(entityId) {
  const entity = findEntity(entityId);
  if (!entity || entity.state === "unavailable" || entity.state === "unknown") {
    return "N/A";
  }
  const unit = entity.attributes?.unit_of_measurement || "";
  return `${entity.state} ${unit}`.trim();
}
