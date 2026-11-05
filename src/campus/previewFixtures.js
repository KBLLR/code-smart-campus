/**
 * Preview fixtures — ONLY for `?preview=fixture`.
 *
 * Deterministic, obviously-synthetic readings so the populated classroom layout
 * can be reviewed without Home Assistant. The shell shows a persistent
 * "Preview · fixture telemetry · not live data" banner, the telemetry source is
 * reported as `preview`, and every row is tagged PREVIEW. Never used otherwise.
 */

const FIXTURE_BY_TYPE = Object.freeze({
  occupancy: 'off',
  temperature: '21.5',
  humidity: '42',
  co2: '640',
  pm25: '4',
  aqi: '38',
  illuminance: '310',
  battery: '87',
});

export function isPreviewRequested(search = '') {
  return new URLSearchParams(search).get('preview') === 'fixture';
}

/** @returns {Map<string, {state: string, updatedAt: number, fixture: true}>} */
export function buildPreviewReadings(roomIndex, now = Date.now()) {
  const readings = new Map();
  roomIndex.rooms.forEach((room) => {
    for (const sensor of room.sensors) {
      const state = FIXTURE_BY_TYPE[sensor.type];
      if (state !== undefined && !readings.has(sensor.entityId)) {
        readings.set(sensor.entityId, { state, updatedAt: now, fixture: true });
      }
    }
  });
  return readings;
}
