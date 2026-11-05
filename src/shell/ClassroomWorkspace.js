/**
 * ClassroomWorkspace — the room-aware panel for one selected classroom.
 *
 * Shows identity, location, availability, telemetry, schedule, the room agent
 * (Gateway /v1/responses, on explicit submit only) and the action boundary.
 * Every section states where its data comes from and says "unknown" / "offline"
 * / "not connected" rather than filling gaps. Opening a classroom performs no
 * action: it renders data that is already in memory.
 */
import { LEVELS } from '../campus/CampusState.js';
import { READING_STATES, SOURCE_STATES } from '../campus/telemetry.js';
import { LANE_STATES } from '../lanes/corexLanes.js';
import { tintFor } from '../scene/categoryPalette.js';
import { esc, prefersReducedMotion, toneFor } from './dom.js';

const SOURCE_COPY = {
  [SOURCE_STATES.LIVE]: 'Home Assistant is delivering readings.',
  [SOURCE_STATES.CONNECTING]: 'Connecting to Home Assistant… no readings yet.',
  [SOURCE_STATES.OFFLINE]: 'Home Assistant is offline or returned no readings. Values are not shown.',
  [SOURCE_STATES.UNCONFIGURED]: 'No telemetry source is configured for this build.',
  [SOURCE_STATES.PREVIEW]: 'Preview fixtures (?preview=fixture). These are not live readings.',
};

function relativeTime(ts, now = Date.now()) {
  if (!Number.isFinite(ts)) return null;
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  return `${Math.round(s / 3600)} h ago`;
}

export class ClassroomWorkspace {
  /**
   * @param {object} deps
   * @param {HTMLElement} deps.element
   * @param {import('../campus/CampusState.js').CampusState} deps.state
   * @param {(room: object) => object} deps.getTelemetry   room -> deriveRoomTelemetry() result
   * @param {() => {state: string, detail: string}} deps.getGatewayStatus
   * @param {(args: {room: object, telemetry: object, question: string}) => Promise<{ok: boolean, text: string, error: string|null}>} deps.ask
   * @param {() => void} [deps.onLayoutChange]
   */
  constructor({ element, state, getTelemetry, getGatewayStatus, ask, onLayoutChange = () => {} }) {
    this.el = element;
    this.state = state;
    this.getTelemetry = getTelemetry;
    this.getGatewayStatus = getGatewayStatus;
    this.ask = ask;
    this.onLayoutChange = onLayoutChange;
    this.conversations = new Map(); // roomId -> { draft, answer, error, pending }
    this.currentRoomId = null;

    this.el.addEventListener('click', (e) => this._onClick(e));
    this.el.addEventListener('submit', (e) => this._onSubmit(e));
    this._openMore = new Set();
    this.el.addEventListener('toggle', (e) => {
      const d = e.target;
      if (!(d instanceof HTMLDetailsElement) || !d.dataset.room) return;
      if (d.open) this._openMore.add(d.dataset.room);
      else this._openMore.delete(d.dataset.room);
    }, true);
    this.el.addEventListener('input', (e) => {
      if (e.target.name === 'question' && this.currentRoomId) this._conv(this.currentRoomId).draft = e.target.value;
    });
    this._unsubscribe = state.subscribe((snap, meta) => {
      if (meta.reason === 'hover') return;
      this._onState(snap);
    });
  }

  _conv(roomId) {
    if (!this.conversations.has(roomId)) this.conversations.set(roomId, { draft: '', answer: null, error: null, pending: false });
    return this.conversations.get(roomId);
  }

  _onState(snap) {
    if (snap.level !== LEVELS.ROOM || !snap.room) {
      if (!this.el.hidden) {
        this.el.hidden = true;
        this.currentRoomId = null;
        this.onLayoutChange();
      }
      return;
    }
    const opening = this.el.hidden;
    this.currentRoomId = snap.room.id;
    this.render();
    if (opening) {
      this.el.hidden = false;
      if (!prefersReducedMotion()) {
        this.el.classList.remove('is-entering');
        void this.el.offsetWidth;
        this.el.classList.add('is-entering');
      }
      this.onLayoutChange();
    }
  }

  /** Re-render the current room (telemetry or lane status changed). Keeps focus and draft. */
  refresh() {
    if (this.currentRoomId && !this.el.hidden) this.render();
  }

  render() {
    const room = this.state.index.rooms.get(this.currentRoomId);
    if (!room) return;
    const telemetry = this.getTelemetry(room);
    const gateway = this.getGatewayStatus();
    const conv = this._conv(room.id);
    const focusName = document.activeElement && this.el.contains(document.activeElement) ? document.activeElement.getAttribute('name') || document.activeElement.dataset.action : null;
    const order = this.state.index.order;
    const pos = order.indexOf(room.id) + 1;
    const keepScroll = this._renderedRoomId === room.id ? this.el.querySelector('.sc-ws-body')?.scrollTop || 0 : 0;
    this._renderedRoomId = room.id;

    this.el.innerHTML = `
      <header class="sc-ws-head">
        <div class="sc-ws-head-row">
          <span class="sc-meta">Classroom ${pos} / ${order.length} · <span class="sc-mono">${esc(room.id)}</span></span>
          <div class="sc-ws-nav">
            <button class="sc-btn sc-btn-icon" type="button" data-action="prev" aria-label="Previous room">‹</button>
            <button class="sc-btn sc-btn-icon" type="button" data-action="next" aria-label="Next room">›</button>
            <button class="sc-btn" type="button" data-action="back" aria-label="Back to ${esc(room.area)} (Escape)">Back</button>
          </div>
        </div>
        <h2 class="sc-ws-title" id="sc-ws-title" tabindex="-1">${esc(room.name)}</h2>
        <div class="sc-meta" style="display:flex;align-items:center;gap:6px">
          <span class="sc-room-swatch" style="--sc-swatch:${tintFor(room.category)}" aria-hidden="true"></span>
          ${esc(room.area)} · ${esc(room.use || 'Use not specified')}
        </div>
      </header>
      <div class="sc-ws-body">
        ${this._availability(telemetry)}
        ${this._telemetry(room, telemetry)}
        ${this._location(room)}
        ${this._schedule()}
        ${this._agent(room, gateway, conv)}
        ${this._actions()}
      </div>`;

    if (keepScroll) this.el.querySelector('.sc-ws-body').scrollTop = keepScroll;
    if (focusName) {
      const target = this.el.querySelector(`[name="${focusName}"], [data-action="${focusName}"]`);
      target?.focus({ preventScroll: true });
    }
  }

  _availability(t) {
    const label = { occupied: 'Occupied', vacant: 'Vacant', unknown: 'Unknown' }[t.availability.state] || 'Unknown';
    return `<section class="sc-section" aria-labelledby="sc-ws-avail">
      <div class="sc-section-head"><h3 class="sc-label" id="sc-ws-avail">Availability</h3>
        ${t.availability.preview ? '<span class="sc-tag" data-tone="warn">Preview</span>' : ''}</div>
      <div class="sc-availability"><span class="sc-dot" data-tone="${toneFor(t.availability.state)}" aria-hidden="true"></span>${label}</div>
      <p>${esc(t.availability.reason)}</p>
    </section>`;
  }

  _telemetry(room, t) {
    const head = `<div class="sc-section-head"><h3 class="sc-label" id="sc-ws-tel">Telemetry</h3>
      <span class="sc-tag" data-tone="${toneFor(t.sourceState)}">${esc(t.sourceState)}</span></div>`;
    if (!t.rows.length) {
      return `<section class="sc-section" aria-labelledby="sc-ws-tel">${head}
        <p>No sensors are mapped to this room${room.classroomId ? '' : ' (no classroom record in sensors-mapping.json)'}.</p></section>`;
    }
    const now = Date.now();
    const renderRow = (r) => {
      const when = relativeTime(r.updatedAt, now);
      const value = r.display ?? '—';
      const stateLabel = {
        [READING_STATES.LIVE]: when ? `live · ${when}` : 'live',
        [READING_STATES.STALE]: when ? `stale · ${when}` : 'stale · no timestamp',
        [READING_STATES.UNKNOWN]: 'unknown',
        [READING_STATES.OFFLINE]: 'offline',
        [READING_STATES.PREVIEW]: 'preview',
      }[r.state];
      return `<li class="sc-reading" data-state="${r.state}">
        <span class="sc-reading-label">${esc(r.label)}</span>
        <span class="sc-reading-value"><strong>${esc(value)}</strong><span class="sc-tag" data-tone="${toneFor(r.state)}">${esc(stateLabel)}</span></span>
        <span class="sc-reading-entity">${esc(r.entityId)}</span>
      </li>`;
    };
    // Room environment first; device/equipment entities behind a disclosure so large rooms stay scannable.
    const primary = t.rows.filter((r) => r.primary);
    const secondary = t.rows.filter((r) => !r.primary);
    const LEAD_MAX = 6;
    const ordered = [...primary, ...secondary];
    const lead = ordered.slice(0, Math.min(LEAD_MAX, Math.max(primary.length, 4)));
    const rest = ordered.slice(lead.length);
    const rows = lead.map(renderRow).join('');
    const more = rest.length
      ? `<details class="sc-more" ${this._openMore?.has(room.id) ? 'open' : ''} data-room="${esc(room.id)}">
          <summary class="sc-btn">${rest.length} more entit${rest.length === 1 ? 'y' : 'ies'}</summary>
          <ul class="sc-readings">${rest.map(renderRow).join('')}</ul></details>`
      : '';
    return `<section class="sc-section" aria-labelledby="sc-ws-tel">${head}
      <p style="margin-bottom:6px">${esc(SOURCE_COPY[t.sourceState] || '')} ${t.reportingCount}/${t.declaredCount} reporting.</p>
      <ul class="sc-readings">${rows}</ul>${more}</section>`;
  }

  _location(room) {
    return `<section class="sc-section" aria-labelledby="sc-ws-loc">
      <div class="sc-section-head"><h3 class="sc-label" id="sc-ws-loc">Location &amp; identity</h3></div>
      <dl class="sc-dl">
        <dt>Area</dt><dd>${esc(room.area)}</dd>
        <dt>Use</dt><dd>${esc(room.use || '—')}</dd>
        <dt>Model</dt><dd><span class="sc-mono">campus.glb › ${esc(room.meshId)}</span> <span class="sc-meta">single-level floor plan</span></dd>
        <dt>Classroom</dt><dd>${room.classroomId ? `<span class="sc-mono">${esc(room.classroomId)}</span>` : '<span class="sc-meta">no classroom record</span>'}</dd>
        <dt>Capacity</dt><dd>${room.capacity ? esc(room.capacity) : '<span class="sc-meta">not recorded</span>'}</dd>
      </dl>
    </section>`;
  }

  _schedule() {
    return `<section class="sc-section" aria-labelledby="sc-ws-sched">
      <div class="sc-section-head"><h3 class="sc-label" id="sc-ws-sched">Schedule</h3><span class="sc-tag">not connected</span></div>
      <p>No timetable or calendar source is connected to Smart Campus in this build, so current and next sessions are unknown.</p>
    </section>`;
  }

  _agent(room, gateway, conv) {
    const online = gateway.state === LANE_STATES.ONLINE;
    const agentName = room.agent?.name ? `${room.agent.name}${room.agent.trait ? ` · ${room.agent.trait}` : ''}` : 'Room agent';
    const disabledReason = online ? '' : `Gateway is ${gateway.state}: ${gateway.detail}`;
    let answer = '';
    if (conv.pending) answer = '<div class="sc-answer" aria-busy="true"><span class="sc-dot" data-tone="busy" aria-hidden="true"></span> Waiting for the Gateway…</div>';
    else if (conv.error) answer = `<div class="sc-answer" data-tone="down" role="alert">${esc(conv.error)}</div>`;
    else if (conv.answer) answer = `<div class="sc-answer">${esc(conv.answer)}</div>`;
    return `<section class="sc-section" aria-labelledby="sc-ws-agent">
      <div class="sc-section-head"><h3 class="sc-label" id="sc-ws-agent">Room agent</h3>
        <span class="sc-tag" data-tone="${toneFor(gateway.state)}">gateway ${esc(gateway.state)}</span></div>
      <p style="margin-bottom:8px">${esc(agentName)}. Answers come from Core-X Gateway <span class="sc-mono">/v1/responses</span>
        using only the room context shown here. Nothing is sent until you ask.</p>
      <form class="sc-ask" data-room="${esc(room.id)}">
        <label class="sc-visually-hidden" for="sc-ask-q">Question for ${esc(room.name)}</label>
        <textarea class="sc-input" id="sc-ask-q" name="question" rows="2" placeholder="Ask about this room…" ${conv.pending ? 'disabled' : ''}>${esc(conv.draft)}</textarea>
        <div class="sc-ask-row">
          <span class="sc-meta">${online ? 'Local Core-X only · no cloud fallback' : esc(disabledReason)}</span>
          <button class="sc-btn sc-btn-primary" type="submit" ${online && !conv.pending ? '' : 'disabled'}>Ask</button>
        </div>
        <div aria-live="polite">${answer}</div>
      </form>
    </section>`;
  }

  _actions() {
    return `<section class="sc-section" aria-labelledby="sc-ws-actions">
      <div class="sc-section-head"><h3 class="sc-label" id="sc-ws-actions">Actions</h3><span class="sc-tag">none available</span></div>
      <p>Viewing a classroom never changes devices. Device control and automations are not offered here: they need an
        approved Core-X execution path (Council proposal) with explicit confirmation.</p>
    </section>`;
  }

  _onClick(e) {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'prev') this.state.prev('workspace');
    if (action === 'next') this.state.next('workspace');
    if (action === 'back') this.state.back('workspace');
  }

  async _onSubmit(e) {
    e.preventDefault();
    const form = e.target.closest('form.sc-ask');
    if (!form) return;
    const roomId = form.dataset.room;
    const room = this.state.index.rooms.get(roomId);
    const conv = this._conv(roomId);
    const question = (form.elements.question?.value || '').trim();
    if (!room || !question || conv.pending) return;
    if (this.getGatewayStatus().state !== LANE_STATES.ONLINE) return;

    conv.draft = question;
    conv.pending = true;
    conv.error = null;
    conv.answer = null;
    this.refresh();
    const result = await this.ask({ room, telemetry: this.getTelemetry(room), question });
    conv.pending = false;
    if (result.ok) {
      conv.answer = result.text;
      conv.draft = '';
    } else {
      conv.error = result.error || 'The Gateway did not answer.';
    }
    if (this.currentRoomId === roomId) this.refresh();
  }

  dispose() {
    this._unsubscribe?.();
  }
}
