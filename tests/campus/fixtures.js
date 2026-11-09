/**
 * Test helpers. Real room data comes from the repository's own sources; the
 * classroom records are built from sensors-mapping.json with the same shape as
 * src/data/classrooms/classrooms-with-sensors.js (which imports JSON through
 * Vite and therefore cannot be imported directly under node --test).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { unifiedRooms } from '../../src/data/personalities/unified_rooms_data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Room mesh names exactly as they appear in public/models/campus.glb (verified 2026-11-05). */
export const CAMPUS_GLB_ROOM_MESHES = Object.freeze([
  'restroomsexits01', 'lifts02', 'terraceoxygen', 'lifts', 'terracehydrogen',
  'b20', 'b21', 'b19', 'b18', 'b17', 'b16', 'b15', 'b14', 'b12', 'b10', 'b7', 'b6', 'b5', 'b4', 'b3', 'b2',
  'a26', 'a25', 'a24', 'a14', 'a11', 'a6', 'a3', 'a2', 'a1', 'a23',
  'restroomsexits02', 'lifts03', 'b23', 'b22', 'a22', 'labmakerspace',
]);

export function loadClassrooms() {
  const mapping = JSON.parse(readFileSync(path.join(root, 'src/data/sensors/sensors-mapping.json'), 'utf8'));
  return (mapping.rooms || []).map((room) => ({
    id: room.id,
    name: room.name,
    floor: 1,
    metadata: { capacity: null },
    sensors: (room.sensors || []).map((sensor, index) => ({
      id: `${room.id}-${sensor.type}-${index}`,
      type: sensor.type,
      entity_id: sensor.entityId,
      friendly_name: sensor.friendlyName || null,
      unit: sensor.unit || '',
    })),
  }));
}

export { unifiedRooms };
