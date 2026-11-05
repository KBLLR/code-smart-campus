import test from 'node:test';
import assert from 'node:assert/strict';

import { deriveRoomTelemetry, resolveSourceState, SOURCE_STATES, READING_STATES } from '../../src/campus/telemetry.js';

const room = {
  id: 'labmakerspace',
  sensors: [
    { key: 'occ', type: 'occupancy', entityId: 'binary_sensor.occ', unit: '', label: 'Occupancy' },
    { key: 'temp', type: 'temperature', entityId: 'sensor.temp', unit: '°C', label: 'Temperature' },
    { key: 'hum', type: 'humidity', entityId: 'sensor.hum', unit: '%', label: 'Humidity' },
  ],
};
const NOW = 1_700_000_000_000;

test('offline source: every declared sensor is offline and availability is unknown', () => {
  const t = deriveRoomTelemetry(room, { source: SOURCE_STATES.OFFLINE, now: NOW });
  assert.equal(t.rows.length, 3);
  assert.ok(t.rows.every((r) => r.state === READING_STATES.OFFLINE && r.display === null));
  assert.equal(t.availability.state, 'unknown');
  assert.equal(t.reportingCount, 0);
});

test('connecting source shows unknown, never a value', () => {
  const readings = new Map([['sensor.temp', { state: '21.4', updatedAt: NOW }]]);
  const t = deriveRoomTelemetry(room, { source: SOURCE_STATES.CONNECTING, readings, now: NOW });
  assert.ok(t.rows.every((r) => r.state === READING_STATES.UNKNOWN && r.display === null));
});

test('live source: delivered readings show, missing ones are unknown', () => {
  const readings = new Map([
    ['sensor.temp', { state: '21.43', unit: '°C', updatedAt: NOW - 1000 }],
    ['binary_sensor.occ', { state: 'off', updatedAt: NOW - 1000 }],
    ['sensor.hum', { state: 'unavailable', updatedAt: NOW - 1000 }],
  ]);
  const t = deriveRoomTelemetry(room, { source: SOURCE_STATES.LIVE, readings, now: NOW });
  const byKey = Object.fromEntries(t.rows.map((r) => [r.key, r]));
  assert.equal(byKey.temp.state, READING_STATES.LIVE);
  assert.equal(byKey.temp.display, '21.4 °C');
  assert.equal(byKey.hum.state, READING_STATES.UNKNOWN);
  assert.equal(t.availability.state, 'vacant');
});

test('readings without a timestamp or older than the window are stale, not live', () => {
  const readings = new Map([
    ['sensor.temp', { state: '22', updatedAt: null }],
    ['binary_sensor.occ', { state: 'on', updatedAt: NOW - 60 * 60 * 1000 }],
  ]);
  const t = deriveRoomTelemetry(room, { source: SOURCE_STATES.LIVE, readings, now: NOW });
  assert.equal(t.rows.find((r) => r.key === 'temp').state, READING_STATES.STALE);
  assert.equal(t.rows.find((r) => r.key === 'occ').state, READING_STATES.STALE);
  assert.equal(t.availability.state, 'unknown', 'stale occupancy must not claim availability');
});

test('rooms without an occupancy sensor never claim availability', () => {
  const t = deriveRoomTelemetry({ sensors: [room.sensors[1]] }, { source: SOURCE_STATES.LIVE, readings: new Map([['sensor.temp', { state: '20', updatedAt: NOW }]]), now: NOW });
  assert.equal(t.availability.state, 'unknown');
  assert.match(t.availability.reason, /No occupancy sensor/);
});

test('preview fixtures are labelled preview, never live', () => {
  const readings = new Map([['binary_sensor.occ', { state: 'on', updatedAt: NOW }]]);
  const t = deriveRoomTelemetry(room, { source: SOURCE_STATES.PREVIEW, readings, now: NOW });
  assert.equal(t.rows.find((r) => r.key === 'occ').state, READING_STATES.PREVIEW);
  assert.equal(t.availability.preview, true);
  assert.ok(!t.rows.some((r) => r.state === READING_STATES.LIVE));
});

test('a room with no declared sensors yields an empty, explicit view model', () => {
  const t = deriveRoomTelemetry({ sensors: [] }, { source: SOURCE_STATES.LIVE, now: NOW });
  assert.equal(t.declaredCount, 0);
  assert.deepEqual(t.rows, []);
  assert.equal(t.availability.state, 'unknown');
});

test('source state trusts delivered readings, not the connector flag', () => {
  assert.equal(resolveSourceState({ readingsCount: 0, startedAt: NOW, now: NOW + 1000 }), SOURCE_STATES.CONNECTING);
  assert.equal(resolveSourceState({ readingsCount: 0, startedAt: NOW, now: NOW + 9000 }), SOURCE_STATES.OFFLINE);
  assert.equal(resolveSourceState({ readingsCount: 0, errored: true }), SOURCE_STATES.OFFLINE);
  assert.equal(resolveSourceState({ readingsCount: 3, errored: true }), SOURCE_STATES.LIVE);
  assert.equal(resolveSourceState({ configured: false }), SOURCE_STATES.UNCONFIGURED);
  assert.equal(resolveSourceState({ preview: true, readingsCount: 9 }), SOURCE_STATES.PREVIEW);
});
