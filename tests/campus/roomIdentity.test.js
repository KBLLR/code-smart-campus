import test from 'node:test';
import assert from 'node:assert/strict';

import { buildRoomIndex, normalizeRoomId, categoryForUse } from '../../src/campus/roomIdentity.js';
import { CAMPUS_GLB_ROOM_MESHES, loadClassrooms, unifiedRooms } from './fixtures.js';

const index = buildRoomIndex({ meshIds: CAMPUS_GLB_ROOM_MESHES, unifiedRooms, classrooms: loadClassrooms() });

test('normalizeRoomId strips punctuation and case', () => {
  assert.equal(normalizeRoomId('A.23 (Narrative)'), 'a23narrative');
  assert.equal(normalizeRoomId('Lab-Makerspace'), 'labmakerspace');
  assert.equal(normalizeRoomId(null), '');
});

test('every room mesh in campus.glb resolves to unified room data', () => {
  assert.deepEqual(index.unmatchedMeshes, []);
  assert.equal(index.rooms.size, CAMPUS_GLB_ROOM_MESHES.length);
});

test('aliases attach legacy classroom ids to the canonical mesh id', () => {
  assert.equal(index.rooms.get('labmakerspace').classroomId, 'makerspace');
  assert.equal(index.rooms.get('terracehydrogen').classroomId, 'hydrogen');
  assert.ok(index.rooms.get('labmakerspace').sensors.length > 0, 'makerspace sensors carried over');
});

test('classrooms without a campus mesh are reported, not invented', () => {
  assert.ok(index.unmatchedClassrooms.includes('kitchen'));
  assert.ok(!index.rooms.has('kitchen'));
});

test('service spaces stay in the scene but are not navigable classrooms', () => {
  for (const id of ['lifts', 'lifts02', 'lifts03', 'restroomsexits01', 'restroomsexits02']) {
    assert.equal(index.rooms.get(id).navigable, false, id);
    assert.ok(!index.order.includes(id), id);
  }
  assert.equal(index.order.length, CAMPUS_GLB_ROOM_MESHES.length - 5);
});

test('navigation order groups rooms by area in a stable order', () => {
  const areaSequence = index.order.map((id) => index.rooms.get(id).area);
  const firstSeen = [...new Set(areaSequence)];
  assert.deepEqual(firstSeen.slice(0, 4), ['Garden', 'Cosmos', 'Cantina', 'Hive']);
  // contiguous areas: each area appears in one run
  const runs = areaSequence.filter((a, i) => i === 0 || a !== areaSequence[i - 1]);
  assert.deepEqual(runs, firstSeen);
  assert.deepEqual(index.areas.map((a) => a.name), firstSeen);
});

test('room use maps onto the GLB category materials', () => {
  assert.equal(categoryForUse('Learning units'), 'learning-units');
  assert.equal(categoryForUse('Studio / Makers space'), 'makerspace');
  assert.equal(categoryForUse('Terrace + Balcony'), 'terrace');
  assert.equal(index.rooms.get('b4').category, 'meetings');
  assert.equal(categoryForUse('something new'), 'other');
});

test('records are frozen so views cannot mutate shared identity', () => {
  const room = index.rooms.get('b4');
  assert.throws(() => { room.name = 'x'; }, TypeError);
});
