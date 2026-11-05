import test from 'node:test';
import assert from 'node:assert/strict';

import { buildRoomIndex } from '../../src/campus/roomIdentity.js';
import { CampusState, LEVELS } from '../../src/campus/CampusState.js';
import { CAMPUS_GLB_ROOM_MESHES, loadClassrooms, unifiedRooms } from './fixtures.js';

function fresh() {
  const index = buildRoomIndex({ meshIds: CAMPUS_GLB_ROOM_MESHES, unifiedRooms, classrooms: loadClassrooms() });
  return { index, state: new CampusState(index) };
}

test('starts at the campus overview', () => {
  const { state } = fresh();
  assert.equal(state.level, LEVELS.OVERVIEW);
  assert.equal(state.roomId, null);
  assert.equal(state.toHash(), '');
});

test('selecting a classroom sets room and area and notifies once', () => {
  const { state } = fresh();
  const events = [];
  state.subscribe((snap, meta) => events.push([snap.level, snap.roomId, snap.areaName, meta.reason, meta.source]));
  assert.equal(state.selectRoom('b4', 'list'), true);
  assert.deepEqual(events, [[LEVELS.ROOM, 'b4', 'Garden', 'select-room', 'list']]);
  // re-selecting the same room is a no-op
  state.selectRoom('b4', 'mesh');
  assert.equal(events.length, 1);
});

test('unknown ids and service spaces cannot be selected', () => {
  const { state } = fresh();
  assert.equal(state.selectRoom('nope'), false);
  assert.equal(state.selectRoom('lifts'), false);
  assert.equal(state.level, LEVELS.OVERVIEW);
});

test('back goes room -> area -> overview without losing the area context', () => {
  const { state } = fresh();
  state.selectRoom('b14');
  assert.equal(state.back(), LEVELS.AREA);
  assert.equal(state.areaName, 'Cosmos');
  assert.equal(state.back(), LEVELS.OVERVIEW);
  assert.equal(state.areaName, null);
});

test('next/prev walk the campus order and wrap', () => {
  const { state, index } = fresh();
  const { order } = index;
  state.selectRoom(order[order.length - 1]);
  state.next();
  assert.equal(state.roomId, order[0]);
  state.prev();
  assert.equal(state.roomId, order[order.length - 1]);
});

test('next from an area starts at that area', () => {
  const { state, index } = fresh();
  state.focusArea('Cantina');
  state.next();
  assert.equal(state.roomId, index.areas.find((a) => a.name === 'Cantina').roomIds[0]);
});

test('hash round-trips and invalid hashes fall back to overview', () => {
  const { state } = fresh();
  state.selectRoom('labmakerspace');
  const hash = state.toHash();
  assert.equal(hash, '#/room/labmakerspace');

  const other = fresh().state;
  assert.equal(other.applyHash(hash), true);
  assert.equal(other.roomId, 'labmakerspace');

  assert.equal(other.applyHash('#/room/does-not-exist'), false);
  assert.equal(other.level, LEVELS.OVERVIEW);
  assert.equal(other.applyHash('#/area/Data%20Core'), true);
  assert.equal(other.areaName, 'Data Core');
  assert.deepEqual(CampusState.parseHash('#/room/%E0%A4%A'), { roomId: null, areaName: null });
});

test('hover ignores non-selectable meshes and dedupes', () => {
  const { state } = fresh();
  let count = 0;
  state.subscribe(() => count++);
  state.hover('lifts');
  state.hover('b4');
  state.hover('b4');
  state.hover(null);
  assert.equal(count, 2);
});

test('selection has no side effects beyond listeners (no lane or device access)', () => {
  const { state } = fresh();
  const originalFetch = globalThis.fetch;
  let fetched = false;
  globalThis.fetch = async () => { fetched = true; throw new Error('must not fetch'); };
  try {
    state.selectRoom('b4');
    state.next();
    state.back();
    state.overview();
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(fetched, false);
});
