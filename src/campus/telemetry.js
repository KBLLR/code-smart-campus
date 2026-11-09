/**
 * Classroom telemetry view model.
 *
 * Turns the room's declared sensors (from the classroom registry) plus whatever
 * readings the telemetry source has actually delivered into display rows with an
 * explicit state. It never fills gaps: a sensor without a delivered reading is
 * "unknown", and when the source itself is not live every row says so.
 *
 * Source states:
 *   live        the telemetry source has delivered at least one reading
 *   connecting  the source is starting; nothing delivered yet
 *   offline     the source failed or delivered nothing within its start window
 *   unconfigured  no telemetry source is configured for this build
 *   preview     readings are labelled fixtures (?preview=fixture), never live data
 *
 * Pure module: no DOM, no network.
 */

export const SOURCE_STATES = Object.freeze({
  LIVE: 'live',
  CONNECTING: 'connecting',
  OFFLINE: 'offline',
  UNCONFIGURED: 'unconfigured',
  PREVIEW: 'preview',
});

export const READING_STATES = Object.freeze({
  LIVE: 'live',
  STALE: 'stale',
  UNKNOWN: 'unknown',
  OFFLINE: 'offline',
  PREVIEW: 'preview',
});

export const DEFAULT_STALE_AFTER_MS = 15 * 60 * 1000;

const UNAVAILABLE_STATES = new Set(['unavailable', 'unknown', '', 'none', 'null']);

function formatValue(raw, unit) {
  if (raw === null || raw === undefined) return null;
  const numeric = typeof raw === 'number' || /^-?\d+(\.\d+)?$/.test(String(raw).trim());
  const n = Number(raw);
  if (numeric && Number.isFinite(n)) {
    const rounded = Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
    return unit ? `${rounded} ${unit}` : String(rounded);
  }
  return String(raw);
}

/**
 * @param {{ sensors: {key: string, type: string, entityId: string, unit: string, label: string}[] }} room
 * @param {object} ctx
 * @param {string} ctx.source                        One of SOURCE_STATES.
 * @param {Map<string, {state: any, unit?: string, updatedAt?: number|null}>} [ctx.readings]  entityId -> delivered reading.
 * @param {number} [ctx.now]
 * @param {number} [ctx.staleAfterMs]
 */
export function deriveRoomTelemetry(room, { source, readings = new Map(), now = Date.now(), staleAfterMs = DEFAULT_STALE_AFTER_MS } = {}) {
  const declared = room?.sensors || [];
  const sourceState = Object.values(SOURCE_STATES).includes(source) ? source : SOURCE_STATES.UNCONFIGURED;

  const rows = declared.map((sensor) => {
    const base = { key: sensor.key, type: sensor.type, label: sensor.label, entityId: sensor.entityId, unit: sensor.unit, primary: Boolean(sensor.primary) };

    if (sourceState !== SOURCE_STATES.LIVE && sourceState !== SOURCE_STATES.PREVIEW) {
      return { ...base, state: sourceState === SOURCE_STATES.CONNECTING ? READING_STATES.UNKNOWN : READING_STATES.OFFLINE, display: null, updatedAt: null };
    }

    const reading = readings.get(sensor.entityId);
    const raw = reading?.state;
    if (!reading || raw === null || raw === undefined || UNAVAILABLE_STATES.has(String(raw).toLowerCase())) {
      return { ...base, state: READING_STATES.UNKNOWN, display: null, updatedAt: reading?.updatedAt ?? null };
    }

    const unit = reading.unit || sensor.unit || '';
    const updatedAt = Number.isFinite(reading.updatedAt) ? reading.updatedAt : null;
    let state = sourceState === SOURCE_STATES.PREVIEW ? READING_STATES.PREVIEW : READING_STATES.LIVE;
    if (state === READING_STATES.LIVE && (updatedAt === null || now - updatedAt > staleAfterMs)) {
      // A value without a trustworthy timestamp is shown, but never as current.
      state = READING_STATES.STALE;
    }
    return { ...base, unit, state, display: formatValue(raw, unit), raw, updatedAt };
  });

  return {
    sourceState,
    rows,
    declaredCount: declared.length,
    reportingCount: rows.filter((r) => r.state === READING_STATES.LIVE || r.state === READING_STATES.PREVIEW).length,
    availability: deriveAvailability(rows, sourceState),
  };
}

/**
 * Availability is only claimed from an occupancy sensor that is reporting now.
 * Everything else is "unknown" with the reason spelled out.
 */
export function deriveAvailability(rows, sourceState) {
  const occupancy = rows.filter((r) => r.type === 'occupancy');
  if (!occupancy.length) {
    return { state: 'unknown', reason: 'No occupancy sensor is mapped to this room.' };
  }
  if (sourceState !== SOURCE_STATES.LIVE && sourceState !== SOURCE_STATES.PREVIEW) {
    return { state: 'unknown', reason: 'Telemetry is not live.' };
  }
  const current = occupancy.find((r) => r.state === READING_STATES.LIVE || r.state === READING_STATES.PREVIEW);
  if (!current) {
    return { state: 'unknown', reason: 'The occupancy sensor has not reported a current value.' };
  }
  const v = String(current.raw).toLowerCase();
  const occupied = v === 'on' || v === 'true' || v === 'detected' || v === 'occupied' || v === '1';
  const vacant = v === 'off' || v === 'false' || v === 'clear' || v === 'vacant' || v === '0';
  if (!occupied && !vacant) {
    return { state: 'unknown', reason: `Unrecognised occupancy value "${current.raw}".` };
  }
  return {
    state: occupied ? 'occupied' : 'vacant',
    reason: sourceState === SOURCE_STATES.PREVIEW ? 'Preview fixture — not a live reading.' : `From ${current.entityId}.`,
    preview: sourceState === SOURCE_STATES.PREVIEW,
  };
}

/**
 * Decide the telemetry source state from what the connector has actually done.
 * `connected` alone is not trusted: the Home Assistant connector reports connected
 * even when its first snapshot fails, so delivered readings are the signal.
 */
export function resolveSourceState({ configured = true, preview = false, readingsCount = 0, errored = false, startedAt = null, now = Date.now(), startWindowMs = 8000 } = {}) {
  if (preview) return SOURCE_STATES.PREVIEW;
  if (!configured) return SOURCE_STATES.UNCONFIGURED;
  if (readingsCount > 0) return SOURCE_STATES.LIVE;
  if (errored) return SOURCE_STATES.OFFLINE;
  if (startedAt !== null && now - startedAt > startWindowMs) return SOURCE_STATES.OFFLINE;
  return SOURCE_STATES.CONNECTING;
}
