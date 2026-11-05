/**
 * Room identity — one canonical record per selectable campus space.
 *
 * Three sources describe the same rooms with different ids:
 *   1. GLB mesh names in public/models/campus.glb   (e.g. "labmakerspace", "b4")
 *   2. unified_rooms_data.js                         (canonical room/agent data, keyed like the meshes)
 *   3. classroom registry (sensors-mapping.json)     (keyed "makerspace", "hydrogen", "kitchen", ...)
 *
 * The canonical id is the unified-data id, which matches the mesh name after
 * normalisation. Classroom records are attached through normalisation plus the
 * explicit alias table below. Nothing here invents rooms: a mesh without data,
 * or a classroom without a mesh, is reported as unmatched instead of guessed.
 *
 * Pure module: no DOM, no three.js, no network. Safe to unit test with node --test.
 */

/** Normalise any id or name to lowercase alphanumerics ("A.23 (Narrative)" -> "a23narrative"). */
export function normalizeRoomId(value) {
  if (value === null || value === undefined) return '';
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Canonical (mesh) id -> other ids that describe the same space in older data.
 * Mirrors the special cases previously hard-coded in RoomManager._init().
 */
export const ROOM_ALIASES = Object.freeze({
  labmakerspace: ['makerspace'],
  terracehydrogen: ['hydrogen'],
  terraceoxygen: ['oxygen'],
});

/** Areas whose spaces are circulation/service and are not offered as classrooms. */
export const SERVICE_AREAS = Object.freeze(['Service']);

/** Display order for campus areas; unknown areas follow alphabetically. */
export const AREA_ORDER = Object.freeze(['Garden', 'Cosmos', 'Cantina', 'Hive', 'Creative Core', 'Data Core']);

/**
 * Room "use" -> category slug. Slugs line up with the category materials that
 * already exist in campus.glb (meetings, learning-units, team-spaces, ...).
 */
const USE_TO_CATEGORY = Object.freeze({
  meetings: 'meetings',
  learningunits: 'learning-units',
  teamspaces: 'team-spaces',
  workspaces: 'workspaces',
  studiomakersspace: 'makerspace',
  project: 'project',
  meditationspace: 'meditation',
  terracebalcony: 'terrace',
  circulation: 'service',
  service: 'service',
});

export function categoryForUse(use) {
  return USE_TO_CATEGORY[normalizeRoomId(use)] || 'other';
}

function compareRooms(a, b) {
  const ai = AREA_ORDER.indexOf(a.area);
  const bi = AREA_ORDER.indexOf(b.area);
  const ar = ai === -1 ? AREA_ORDER.length : ai;
  const br = bi === -1 ? AREA_ORDER.length : bi;
  if (ar !== br) return ar - br;
  if (ar === AREA_ORDER.length && a.area !== b.area) return a.area.localeCompare(b.area);
  return a.name.localeCompare(b.name, 'en', { numeric: true });
}

/** Room-environment sensor types shown first in the classroom workspace. */
export const PRIMARY_SENSOR_TYPES = Object.freeze(['occupancy', 'temperature', 'humidity', 'co2', 'pm25', 'aqi', 'illuminance', 'noise']);

function sensorLabel(type) {
  const t = String(type || 'sensor').replace(/[_-]+/g, ' ').trim();
  if (t === 'pm25') return 'PM2.5';
  if (t === 'aqi') return 'Air quality index';
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Build the room index.
 *
 * @param {object} input
 * @param {string[]} input.meshIds        Room mesh names found in the loaded GLB.
 * @param {object[]} input.unifiedRooms   Entries from unified_rooms_data.js.
 * @param {object[]} [input.classrooms]   Classroom records (classrooms-with-sensors.js shape).
 * @returns {{
 *   rooms: Map<string, object>,
 *   order: string[],
 *   areas: {name: string, roomIds: string[]}[],
 *   unmatchedMeshes: string[],
 *   unmatchedClassrooms: string[],
 * }}
 */
export function buildRoomIndex({ meshIds = [], unifiedRooms = [], classrooms = [] } = {}) {
  const unifiedById = new Map();
  for (const entry of unifiedRooms) {
    const key = normalizeRoomId(entry?.id || entry?.roomData?.name);
    if (key && !unifiedById.has(key)) unifiedById.set(key, entry);
  }

  const classroomByKey = new Map();
  for (const classroom of classrooms) {
    const key = normalizeRoomId(classroom?.id);
    if (key && !classroomByKey.has(key)) classroomByKey.set(key, classroom);
  }

  const usedClassrooms = new Set();
  const rooms = new Map();
  const unmatchedMeshes = [];

  for (const rawMeshId of meshIds) {
    const meshKey = normalizeRoomId(rawMeshId);
    if (!meshKey || rooms.has(meshKey)) continue;

    const unified = unifiedById.get(meshKey);
    if (!unified) {
      unmatchedMeshes.push(rawMeshId);
      continue;
    }

    const candidates = [meshKey, ...(ROOM_ALIASES[meshKey] || [])];
    const classroomKey = candidates.find((k) => classroomByKey.has(k)) || null;
    const classroom = classroomKey ? classroomByKey.get(classroomKey) : null;
    if (classroomKey) usedClassrooms.add(classroomKey);

    const roomData = unified.roomData || {};
    const area = roomData.area || 'Unassigned';
    const use = roomData.use || '';
    const category = categoryForUse(use);
    const navigable = !SERVICE_AREAS.includes(area) && category !== 'service';

    rooms.set(meshKey, Object.freeze({
      id: meshKey,
      meshId: rawMeshId,
      name: roomData.name || unified.agentData?.name || rawMeshId,
      area,
      use,
      category,
      navigable,
      floor: classroom?.floor ?? null,
      capacity: classroom?.metadata?.capacity ?? null,
      classroomId: classroom ? classroom.id : null,
      agent: unified.agentData
        ? Object.freeze({ id: unified.agentData.id || meshKey, name: unified.agentData.name || null, trait: unified.agentData.trait || null })
        : null,
      sensors: Object.freeze((classroom?.sensors || [])
        .filter((s) => s && s.entity_id)
        .map((s) => Object.freeze({
          key: s.id || s.entity_id,
          type: s.type || 'unknown',
          entityId: s.entity_id,
          unit: s.unit || '',
          label: s.friendly_name || sensorLabel(s.type),
          primary: PRIMARY_SENSOR_TYPES.includes(s.type),
        }))),
    }));
  }

  const ordered = [...rooms.values()].filter((r) => r.navigable).sort(compareRooms);
  const order = ordered.map((r) => r.id);

  const areas = [];
  for (const room of ordered) {
    let group = areas.find((a) => a.name === room.area);
    if (!group) {
      group = { name: room.area, roomIds: [] };
      areas.push(group);
    }
    group.roomIds.push(room.id);
  }

  const unmatchedClassrooms = classrooms
    .map((c) => c?.id)
    .filter((id) => id && !usedClassrooms.has(normalizeRoomId(id)));

  return { rooms, order, areas, unmatchedMeshes, unmatchedClassrooms };
}
