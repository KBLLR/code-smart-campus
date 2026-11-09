/**
 * Core-X lanes used by Smart Campus.
 *
 * Smart Campus is a house: it consumes shared Core-X services, it does not run
 * its own copies. This module is the single place the house resolves where those
 * services live and how it talks to them.
 *
 * Endpoint resolution
 *   1. VITE_COREX_GATEWAY_URL / VITE_COREX_EVENT_BUS_URL / VITE_COREX_WAREHOUSE_URL
 *   2. the documented Core-X local defaults below, which mirror
 *      core-x/config/services.manifest.json (gateway 8090, event-bus 8085) and
 *      core-x/config/runtime-topology.json (warehouse-server 5202).
 *   If the defaults ever disagree with topology, topology wins: set the env vars.
 *   No other Smart Campus module may hard-code a Core-X service port.
 *
 * Boundaries enforced here
 *   - LLM traffic goes to the Gateway `POST /v1/responses` only. There is no
 *     legacy chat-completions client in this module (enforced by tests).
 *   - Lanes must be loopback hosts unless VITE_COREX_ALLOW_REMOTE_LANES === 'true'.
 *     A non-loopback Gateway is reported as `blocked`, never used silently, so a
 *     misconfigured build cannot fall back to cloud inference.
 *   - No model is chosen here. `VITE_COREX_TEXT_MODEL` is passed through when set;
 *     otherwise the field is omitted and Gateway routing decides. Smart Campus does
 *     not change model roles, routing or assignments.
 *   - Nothing in this module performs device control or automation.
 */

export const COREX_LOCAL_DEFAULTS = Object.freeze({
  gateway: 'http://127.0.0.1:8090',
  eventBus: 'http://127.0.0.1:8085',
  warehouse: 'http://127.0.0.1:5202',
});

export const LANE_STATES = Object.freeze({
  ONLINE: 'online',
  OFFLINE: 'offline',
  CHECKING: 'checking',
  BLOCKED: 'blocked',
  UNCONFIGURED: 'unconfigured',
});

export const RESPONSES_PATH = '/v1/responses';
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);

export function isLoopbackUrl(url) {
  try {
    return LOOPBACK_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

function trimSlash(url) {
  return String(url).replace(/\/+$/, '');
}

function laneEntry(id, label, envValue, fallback, allowRemote) {
  const raw = typeof envValue === 'string' ? envValue.trim() : '';
  if (raw === 'off' || raw === 'disabled') {
    return Object.freeze({ id, label, url: null, source: 'env', blockedReason: null, disabled: true });
  }
  const url = trimSlash(raw || fallback);
  const source = raw ? 'env' : 'corex-default';
  let blockedReason = null;
  try {
    new URL(url);
  } catch {
    blockedReason = `Invalid URL "${url}".`;
  }
  if (!blockedReason && !allowRemote && !isLoopbackUrl(url)) {
    blockedReason = `${label} must be a local (loopback) Core-X service; "${url}" is remote. Set VITE_COREX_ALLOW_REMOTE_LANES=true only with an explicit, documented exception.`;
  }
  return Object.freeze({ id, label, url, source, blockedReason, disabled: false });
}

/** Resolve lane endpoints from a Vite-style env object (import.meta.env). */
export function resolveLaneConfig(env = {}) {
  const allowRemote = env.VITE_COREX_ALLOW_REMOTE_LANES === 'true';
  return Object.freeze({
    allowRemote,
    textModel: env.VITE_COREX_TEXT_MODEL ? String(env.VITE_COREX_TEXT_MODEL) : null,
    lanes: Object.freeze({
      gateway: laneEntry('gateway', 'Gateway', env.VITE_COREX_GATEWAY_URL, COREX_LOCAL_DEFAULTS.gateway, allowRemote),
      eventBus: laneEntry('eventBus', 'Event bus', env.VITE_COREX_EVENT_BUS_URL, COREX_LOCAL_DEFAULTS.eventBus, allowRemote),
      warehouse: laneEntry('warehouse', 'Warehouse', env.VITE_COREX_WAREHOUSE_URL, COREX_LOCAL_DEFAULTS.warehouse, allowRemote),
    }),
  });
}

async function fetchWithTimeout(fetchImpl, url, init = {}, timeoutMs = 3000) {
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    return await fetchImpl(url, { ...init, signal: controller?.signal });
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Probe a lane's /health endpoint. Never throws.
 * @returns {Promise<{id: string, state: string, detail: string, checkedAt: number}>}
 */
export async function probeLane(lane, { fetchImpl = globalThis.fetch, timeoutMs = 3000, now = () => Date.now() } = {}) {
  const base = { id: lane.id, checkedAt: now() };
  if (lane.disabled || !lane.url) return { ...base, state: LANE_STATES.UNCONFIGURED, detail: `${lane.label} is disabled for this build.` };
  if (lane.blockedReason) return { ...base, state: LANE_STATES.BLOCKED, detail: lane.blockedReason };
  if (typeof fetchImpl !== 'function') return { ...base, state: LANE_STATES.OFFLINE, detail: 'No fetch implementation available.' };
  try {
    const res = await fetchWithTimeout(fetchImpl, `${lane.url}/health`, { method: 'GET' }, timeoutMs);
    if (!res.ok) return { ...base, state: LANE_STATES.OFFLINE, detail: `${lane.label} health returned HTTP ${res.status}.` };
    return { ...base, state: LANE_STATES.ONLINE, detail: `${lane.label} healthy at ${lane.url}.` };
  } catch (err) {
    const reason = err?.name === 'AbortError' ? `timed out after ${timeoutMs} ms` : 'is unreachable';
    return { ...base, state: LANE_STATES.OFFLINE, detail: `${lane.label} ${reason} (${lane.url}).` };
  }
}

/**
 * Build the OpenResponses request for a room question. The room context is the
 * data the workspace is showing — including unknown values as unknown — so the
 * agent cannot be told something the UI does not know.
 */
export function buildRoomAgentRequest({ room, telemetry, question, model = null }) {
  if (!room || !room.id) throw new TypeError('room is required');
  const text = String(question || '').trim();
  if (!text) throw new TypeError('question is required');

  const readings = (telemetry?.rows || []).map((r) => {
    const value = r.display ?? 'unknown';
    return `- ${r.label} (${r.entityId}): ${value} [${r.state}]`;
  });
  const context = [
    `Room: ${room.name} (id ${room.id})`,
    `Area: ${room.area}; use: ${room.use || 'unspecified'}`,
    `Telemetry source: ${telemetry?.sourceState || 'unconfigured'}`,
    `Availability: ${telemetry?.availability?.state || 'unknown'} — ${telemetry?.availability?.reason || 'no basis'}`,
    readings.length ? `Sensors:\n${readings.join('\n')}` : 'Sensors: none mapped to this room.',
  ].join('\n');

  const body = {
    input: `${context}\n\nQuestion: ${text}`,
    instructions: `You are the Smart Campus room agent for ${room.name}. Answer only from the room context provided. `
      + 'Values marked unknown, offline or stale are not current; say so instead of estimating. '
      + 'You cannot control devices or run automations from this view; if asked, explain that an approved Core-X execution path is required.',
    stream: false,
    metadata: { house_id: 'smart-campus', room_id: room.id, surface: 'classroom-workspace' },
  };
  if (model) body.model = model;
  return body;
}

/** Extract assistant text from an OpenResponses payload (output_text or output[].content[]). */
export function extractResponseText(payload) {
  if (!payload || typeof payload !== 'object') return '';
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) return payload.output_text.trim();
  const parts = [];
  for (const item of Array.isArray(payload.output) ? payload.output : []) {
    if (item?.type && item.type !== 'message') continue;
    for (const c of Array.isArray(item?.content) ? item.content : []) {
      if ((c?.type === 'output_text' || c?.type === 'text') && typeof c.text === 'string') parts.push(c.text);
    }
  }
  return parts.join('\n').trim();
}

/**
 * Ask the room agent through the Core-X Gateway. Only called on an explicit user
 * submit. Never throws; never retries against another endpoint.
 * @returns {Promise<{ok: boolean, text: string, error: string|null, endpoint: string|null}>}
 */
export async function askRoomAgent({ config, room, telemetry, question, fetchImpl = globalThis.fetch, timeoutMs = 60000 }) {
  const lane = config?.lanes?.gateway;
  if (!lane || lane.disabled || !lane.url) return { ok: false, text: '', error: 'Gateway is not configured.', endpoint: null };
  if (lane.blockedReason) return { ok: false, text: '', error: lane.blockedReason, endpoint: null };

  const endpoint = `${lane.url}${RESPONSES_PATH}`;
  let body;
  try {
    body = buildRoomAgentRequest({ room, telemetry, question, model: config.textModel });
  } catch (err) {
    return { ok: false, text: '', error: err.message, endpoint };
  }

  try {
    const res = await fetchWithTimeout(fetchImpl, endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, timeoutMs);
    if (!res.ok) {
      return { ok: false, text: '', error: `Gateway returned HTTP ${res.status}.`, endpoint };
    }
    const text = extractResponseText(await res.json());
    if (!text) return { ok: false, text: '', error: 'Gateway returned no output text.', endpoint };
    return { ok: true, text, error: null, endpoint };
  } catch (err) {
    const reason = err?.name === 'AbortError' ? `timed out after ${Math.round(timeoutMs / 1000)} s` : 'is unreachable';
    return { ok: false, text: '', error: `Gateway ${reason}.`, endpoint };
  }
}
