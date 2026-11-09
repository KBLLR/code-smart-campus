import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  resolveLaneConfig, probeLane, askRoomAgent, buildRoomAgentRequest, extractResponseText,
  LANE_STATES, COREX_LOCAL_DEFAULTS, RESPONSES_PATH,
} from '../../src/lanes/corexLanes.js';

const room = { id: 'b4', name: 'B.4', area: 'Garden', use: 'Meetings' };
const telemetry = {
  sourceState: 'offline',
  availability: { state: 'unknown', reason: 'Telemetry is not live.' },
  rows: [{ label: 'Temperature', entityId: 'sensor.t', display: null, state: 'offline' }],
};

function recorder(response) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, init });
    if (response instanceof Error) throw response;
    return response;
  };
  return { calls, impl };
}

test('defaults mirror the Core-X local services and are marked as defaults', () => {
  const cfg = resolveLaneConfig({});
  assert.equal(cfg.lanes.gateway.url, COREX_LOCAL_DEFAULTS.gateway);
  assert.equal(cfg.lanes.gateway.source, 'corex-default');
  assert.equal(cfg.textModel, null);
});

test('env overrides win and trailing slashes are trimmed', () => {
  const cfg = resolveLaneConfig({ VITE_COREX_GATEWAY_URL: 'http://localhost:9999/' });
  assert.equal(cfg.lanes.gateway.url, 'http://localhost:9999');
  assert.equal(cfg.lanes.gateway.source, 'env');
});

test('remote lanes are blocked unless explicitly allowed', async () => {
  const cfg = resolveLaneConfig({ VITE_COREX_GATEWAY_URL: 'https://api.example.com' });
  assert.ok(cfg.lanes.gateway.blockedReason);
  const { calls, impl } = recorder({ ok: true });
  const probe = await probeLane(cfg.lanes.gateway, { fetchImpl: impl });
  assert.equal(probe.state, LANE_STATES.BLOCKED);
  const ask = await askRoomAgent({ config: cfg, room, telemetry, question: 'hi', fetchImpl: impl });
  assert.equal(ask.ok, false);
  assert.equal(calls.length, 0, 'no request may leave for a blocked remote gateway');

  const allowed = resolveLaneConfig({ VITE_COREX_GATEWAY_URL: 'https://api.example.com', VITE_COREX_ALLOW_REMOTE_LANES: 'true' });
  assert.equal(allowed.lanes.gateway.blockedReason, null);
});

test('a lane can be disabled explicitly', async () => {
  const cfg = resolveLaneConfig({ VITE_COREX_WAREHOUSE_URL: 'off' });
  const probe = await probeLane(cfg.lanes.warehouse, { fetchImpl: async () => { throw new Error('no'); } });
  assert.equal(probe.state, LANE_STATES.UNCONFIGURED);
});

test('health probe reports online / offline honestly', async () => {
  const cfg = resolveLaneConfig({});
  const ok = await probeLane(cfg.lanes.gateway, { fetchImpl: recorder({ ok: true, status: 200 }).impl });
  assert.equal(ok.state, LANE_STATES.ONLINE);
  const bad = await probeLane(cfg.lanes.gateway, { fetchImpl: recorder({ ok: false, status: 503 }).impl });
  assert.equal(bad.state, LANE_STATES.OFFLINE);
  const down = await probeLane(cfg.lanes.gateway, { fetchImpl: recorder(new TypeError('Failed to fetch')).impl });
  assert.equal(down.state, LANE_STATES.OFFLINE);
  const { calls, impl } = recorder({ ok: true, status: 200 });
  await probeLane(cfg.lanes.eventBus, { fetchImpl: impl });
  assert.equal(calls[0].url, `${COREX_LOCAL_DEFAULTS.eventBus}/health`);
});

test('room agent uses POST /v1/responses on the Gateway, never chat completions', async () => {
  const cfg = resolveLaneConfig({});
  const { calls, impl } = recorder({ ok: true, json: async () => ({ output_text: 'Telemetry is offline.' }) });
  const res = await askRoomAgent({ config: cfg, room, telemetry, question: 'Is it warm?', fetchImpl: impl });
  assert.equal(res.ok, true);
  assert.equal(res.text, 'Telemetry is offline.');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `${COREX_LOCAL_DEFAULTS.gateway}${RESPONSES_PATH}`);
  assert.equal(calls[0].init.method, 'POST');
  assert.doesNotMatch(calls[0].url, /chat\/completions/);
  const body = JSON.parse(calls[0].init.body);
  assert.equal('model' in body, false, 'no model is chosen by Smart Campus unless configured');
  assert.equal(body.stream, false);
  assert.equal(body.metadata.room_id, 'b4');
});

test('configured text model is passed through unchanged', () => {
  const body = buildRoomAgentRequest({ room, telemetry, question: 'q', model: 'text/configured-model' });
  assert.equal(body.model, 'text/configured-model');
});

test('room context forwards unknown values as unknown', () => {
  const body = buildRoomAgentRequest({ room, telemetry, question: 'q' });
  assert.match(body.input, /Temperature \(sensor\.t\): unknown \[offline\]/);
  assert.match(body.input, /Telemetry source: offline/);
  assert.match(body.instructions, /cannot control devices/);
});

test('gateway failures surface as errors without retries or fallbacks', async () => {
  const cfg = resolveLaneConfig({});
  const down = recorder(new TypeError('Failed to fetch'));
  const res = await askRoomAgent({ config: cfg, room, telemetry, question: 'q', fetchImpl: down.impl });
  assert.equal(res.ok, false);
  assert.match(res.error, /unreachable/);
  assert.equal(down.calls.length, 1);

  const http = recorder({ ok: false, status: 502 });
  const res2 = await askRoomAgent({ config: cfg, room, telemetry, question: 'q', fetchImpl: http.impl });
  assert.match(res2.error, /HTTP 502/);

  const empty = await askRoomAgent({ config: cfg, room, telemetry, question: '   ', fetchImpl: http.impl });
  assert.equal(empty.ok, false);
});

test('extractResponseText reads output_text and message content', () => {
  assert.equal(extractResponseText({ output: [{ type: 'reasoning' }, { type: 'message', content: [{ type: 'output_text', text: 'A' }, { type: 'output_text', text: 'B' }] }] }), 'A\nB');
  assert.equal(extractResponseText(null), '');
});

test('new Smart Campus modules contain no chat-completions client and no hard-coded Core-X ports', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src');
  const dirs = ['campus', 'shell', 'lanes', 'scene'].map((d) => path.join(root, d));
  const files = [];
  const walk = (d) => {
    let entries = [];
    try { entries = readdirSync(d); } catch { return; }
    for (const e of entries) {
      const p = path.join(d, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(js|ts)$/.test(e)) files.push(p);
    }
  };
  dirs.forEach(walk);
  assert.ok(files.length > 0);
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    assert.doesNotMatch(src, /chat\/completions/, f);
    if (!f.endsWith(path.join('lanes', 'corexLanes.js'))) {
      assert.doesNotMatch(src, /:(8085|8090|8091|8092|8093|8094|8095|5202)\b/, `${f} must resolve Core-X services through corexLanes.js`);
    }
  }
});
