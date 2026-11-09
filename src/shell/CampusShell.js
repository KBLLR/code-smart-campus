/**
 * CampusShell — Core-X chrome around the 3D campus.
 *
 * Owns: top bar (location breadcrumb, Core-X service chips + panel), the room
 * navigator (grouped by area, filterable, keyboard operable), the room-use legend,
 * the view toolbar, the stage status overlay (loading / error / no-WebGL), and the
 * global keyboard shortcuts. Everything it renders comes from CampusState, the
 * room index, and the lane/telemetry status it is handed — it fetches nothing.
 */
import { CATEGORY_PALETTE, tintFor } from '../scene/categoryPalette.js';
import { LEVELS } from '../campus/CampusState.js';
import { $, esc, isTypingTarget, toneFor } from './dom.js';

const LANE_ORDER = ['gateway', 'telemetry', 'eventBus', 'warehouse'];
const LANE_LABEL = { gateway: 'Gateway', telemetry: 'Telemetry', eventBus: 'Event bus', warehouse: 'Warehouse' };

export class CampusShell {
  /**
   * @param {object} deps
   * @param {import('../campus/CampusState.js').CampusState} deps.state
   * @param {{rooms: Map<string, object>, order: string[], areas: {name: string, roomIds: string[]}[]}} deps.roomIndex
   * @param {(category: string|null) => void} [deps.onCategoryFilter]
   * @param {(enabled: boolean) => void} [deps.onLabelsToggle]
   */
  constructor({ state, roomIndex, onCategoryFilter = () => {}, onLabelsToggle = () => {} }) {
    this.state = state;
    this.roomIndex = roomIndex;
    this.onCategoryFilter = onCategoryFilter;
    this.onLabelsToggle = onLabelsToggle;
    this.categoryFilter = null;
    this.filterText = '';
    this.laneStatus = {};

    this.el = {
      body: document.body,
      crumbs: $('#sc-crumbs'),
      lanes: $('#sc-lanes'),
      lanesPanel: $('#sc-lanes-panel'),
      lanesRows: $('#sc-lanes-rows'),
      rail: $('#sc-rail'),
      railToggle: $('#sc-rooms-toggle'),
      list: $('#sc-room-list'),
      count: $('#sc-rooms-count'),
      search: $('#sc-search'),
      legend: $('#sc-legend ul'),
      status: $('#sc-stage-status'),
      statusTitle: $('#sc-stage-status-title'),
      statusText: $('#sc-stage-status-text'),
      progress: $('#sc-stage-progress'),
      overviewBtn: $('#sc-view-overview'),
      labelsBtn: $('#sc-view-labels'),
      prevBtn: $('#sc-view-prev'),
      nextBtn: $('#sc-view-next'),
      announcer: $('#sc-announcer'),
    };

    this._renderList();
    this._renderLegend();
    this._renderCrumbs(state.snapshot());
    this._bind();
    this._unsubscribe = state.subscribe((snap, meta) => this._onState(snap, meta));
  }

  // ---------------------------------------------------------------------------
  // Stage status

  setLoading(fraction) {
    const { status, progress, statusTitle, statusText } = this.el;
    status.hidden = false;
    statusTitle.textContent = 'Loading campus';
    if (Number.isFinite(fraction)) {
      progress.dataset.indeterminate = 'false';
      progress.style.setProperty('--sc-progress', `${Math.round(fraction * 100)}%`);
      statusText.textContent = `Loading campus.glb… ${Math.round(fraction * 100)}%`;
    } else {
      progress.dataset.indeterminate = 'true';
    }
  }

  setReady() {
    this.el.status.hidden = true;
    this.el.body.dataset.render = 'ready';
  }

  /** The 3D view could not start; the room list and workspace keep working. */
  setRenderUnavailable(reason) {
    const { status, statusTitle, statusText, progress } = this.el;
    this.el.body.dataset.render = 'unavailable';
    status.hidden = false;
    statusTitle.textContent = '3D view unavailable';
    statusText.textContent = `${reason} Rooms and classroom details remain available from the room list.`;
    progress.hidden = true;
  }

  setModelError(message) {
    const { status, statusTitle, statusText, progress } = this.el;
    this.el.body.dataset.render = 'error';
    status.hidden = false;
    statusTitle.textContent = 'Campus model failed to load';
    statusText.textContent = `${message} The room list still works; the 3D view needs public/models/campus.glb.`;
    progress.hidden = true;
  }

  announce(text) {
    this.el.announcer.textContent = '';
    // next frame so repeated messages are re-announced
    requestAnimationFrame(() => { this.el.announcer.textContent = text; });
  }

  // ---------------------------------------------------------------------------
  // Lanes

  /** @param {Record<string, {state: string, detail: string, url?: string|null, source?: string}>} status */
  setLaneStatus(status) {
    this.laneStatus = { ...this.laneStatus, ...status };
    const chips = LANE_ORDER.filter((id) => this.laneStatus[id]).map((id) => {
      const s = this.laneStatus[id];
      return `<li><button class="sc-lane-chip" type="button" data-lane="${id}" aria-controls="sc-lanes-panel"
        aria-expanded="${!this.el.lanesPanel.hidden}" title="${esc(`${LANE_LABEL[id]}: ${s.state} — ${s.detail}`)}">
        <span class="sc-dot" data-tone="${toneFor(s.state)}" aria-hidden="true"></span>
        <span class="sc-lane-name">${esc(LANE_LABEL[id])}</span>
        <span class="sc-visually-hidden">${esc(s.state)}</span></button></li>`;
    });
    this.el.lanes.innerHTML = chips.join('');
    this.el.lanesRows.innerHTML = LANE_ORDER.filter((id) => this.laneStatus[id]).map((id) => {
      const s = this.laneStatus[id];
      return `<div class="sc-lane-row">
        <span class="sc-dot" data-tone="${toneFor(s.state)}" aria-hidden="true"></span>
        <strong class="sc-label" style="color:var(--fg1)">${esc(LANE_LABEL[id])}</strong>
        <span class="sc-tag" data-tone="${toneFor(s.state)}">${esc(s.state)}</span>
        <span class="sc-lane-detail">${esc(s.detail)}${s.url ? ` <span class="sc-meta">${esc(s.url)}${s.source === 'corex-default' ? ' · Core-X default' : ''}</span>` : ''}</span>
      </div>`;
    }).join('');
  }

  // ---------------------------------------------------------------------------
  // Rendering

  _roomMatches(room) {
    if (this.categoryFilter && room.category !== this.categoryFilter) return false;
    if (!this.filterText) return true;
    const q = this.filterText;
    return [room.name, room.id, room.use, room.area].some((v) => String(v || '').toLowerCase().includes(q));
  }

  _renderList() {
    const snap = this.state.snapshot();
    let shown = 0;
    const groups = this.roomIndex.areas.map((area) => {
      const rooms = area.roomIds.map((id) => this.roomIndex.rooms.get(id)).filter((r) => this._roomMatches(r));
      if (!rooms.length) return '';
      shown += rooms.length;
      const items = rooms.map((room) => `
        <li>
          <button class="sc-room${snap.hoveredId === room.id ? ' is-hovered' : ''}" type="button" data-room="${esc(room.id)}"
            ${snap.roomId === room.id ? 'aria-current="true"' : ''}>
            <span class="sc-room-swatch" style="--sc-swatch:${tintFor(room.category)}" aria-hidden="true"></span>
            <span><span class="sc-room-name">${esc(room.name)}</span>
              <span class="sc-room-sub">${esc(room.id)} · ${esc(room.use || '—')}</span></span>
            <span class="sc-room-sensors">${room.sensors.length ? `${room.sensors.length} sensor${room.sensors.length === 1 ? '' : 's'}` : ''}</span>
          </button>
        </li>`).join('');
      const current = snap.level !== LEVELS.OVERVIEW && snap.areaName === area.name;
      return `<ul class="sc-area" aria-label="${esc(area.name)}">
        <li><button class="sc-area-head" type="button" data-area="${esc(area.name)}" ${current ? 'aria-current="true"' : ''}
          aria-label="Focus area ${esc(area.name)}">${esc(area.name)} <span class="sc-meta">${rooms.length}</span></button></li>
        ${items}
      </ul>`;
    }).join('');
    this.el.list.innerHTML = groups || '<p class="sc-empty">No rooms match this filter.</p>';
    this.el.count.textContent = `${shown} / ${this.roomIndex.order.length}`;
  }

  _renderLegend() {
    const present = new Set([...this.roomIndex.rooms.values()].filter((r) => r.navigable).map((r) => r.category));
    this.el.legend.innerHTML = Object.entries(CATEGORY_PALETTE)
      .filter(([slug]) => present.has(slug))
      .map(([slug, { label, tint }]) => `<li><button class="sc-chip" type="button" data-category="${slug}"
        aria-pressed="${this.categoryFilter === slug}"><span class="sc-room-swatch" style="--sc-swatch:${tint}" aria-hidden="true"></span>${esc(label)}</button></li>`)
      .join('');
  }

  _renderCrumbs(snap) {
    const items = [`<li><button type="button" data-crumb="overview" ${snap.level === LEVELS.OVERVIEW ? 'aria-current="location"' : ''}>Campus</button></li>`];
    if (snap.areaName) {
      items.push(`<li><button type="button" data-crumb="area" ${snap.level === LEVELS.AREA ? 'aria-current="location"' : ''}>${esc(snap.areaName)}</button></li>`);
    }
    if (snap.room) {
      items.push(`<li><button type="button" data-crumb="room" aria-current="location">${esc(snap.room.name)}</button></li>`);
    }
    this.el.crumbs.innerHTML = items.join('');
  }

  setCategoryFilter(category) {
    this.categoryFilter = this.categoryFilter === category ? null : category;
    this._renderLegend();
    this._renderList();
    this.onCategoryFilter(this.categoryFilter);
  }

  // ---------------------------------------------------------------------------
  // Events

  _onState(snap, meta) {
    this.el.body.dataset.level = snap.level;
    this._renderCrumbs(snap);
    if (meta.reason === 'hover') {
      this.el.list.querySelectorAll('.sc-room.is-hovered').forEach((b) => b.classList.remove('is-hovered'));
      if (snap.hoveredId) this.el.list.querySelector(`.sc-room[data-room="${CSS.escape(snap.hoveredId)}"]`)?.classList.add('is-hovered');
      return;
    }
    const focused = document.activeElement?.dataset?.room;
    this._renderList();
    if (focused) this.el.list.querySelector(`.sc-room[data-room="${CSS.escape(focused)}"]`)?.focus({ preventScroll: true });
    const current = snap.roomId && this.el.list.querySelector(`.sc-room[data-room="${CSS.escape(snap.roomId)}"]`);
    if (current) current.scrollIntoView({ block: 'nearest' });
    if (meta.reason === 'select-room' && snap.room) this.announce(`${snap.room.name}, ${snap.room.area}. Classroom details open.`);
    if (meta.reason === 'focus-area') this.announce(`Area ${snap.areaName}.`);
    if (meta.reason === 'overview') this.announce('Campus overview.');
    if (meta.reason === 'select-room' && meta.source !== 'list') this.setRailOpen(false);
  }

  setRailOpen(open) {
    this.el.body.classList.toggle('sc-rail-open', open);
    this.el.railToggle.setAttribute('aria-expanded', String(open));
    this.el.railToggle.setAttribute('aria-label', open ? 'Hide room list' : 'Show room list');
  }

  _bind() {
    const { list, search, legend, crumbs, lanes, lanesPanel, railToggle } = this.el;

    list.addEventListener('click', (e) => {
      const roomBtn = e.target.closest('[data-room]');
      if (roomBtn) {
        this.state.selectRoom(roomBtn.dataset.room, 'list');
        if (window.matchMedia('(max-width: 1100px)').matches) this.setRailOpen(false);
        return;
      }
      const areaBtn = e.target.closest('[data-area]');
      if (areaBtn) this.state.focusArea(areaBtn.dataset.area, 'list');
    });
    list.addEventListener('pointerover', (e) => this.state.hover(e.target.closest('[data-room]')?.dataset.room || null));
    list.addEventListener('pointerleave', () => this.state.hover(null));
    list.addEventListener('focusin', (e) => this.state.hover(e.target.closest('[data-room]')?.dataset.room || null));
    list.addEventListener('focusout', () => this.state.hover(null));
    list.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const buttons = [...list.querySelectorAll('button')];
      const i = buttons.indexOf(document.activeElement);
      if (i === -1) return;
      e.preventDefault();
      buttons[Math.max(0, Math.min(buttons.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))].focus();
    });

    search.addEventListener('input', () => {
      this.filterText = search.value.trim().toLowerCase();
      this._renderList();
    });
    search.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        list.querySelector('.sc-room')?.focus();
      }
    });

    legend.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-category]');
      if (chip) this.setCategoryFilter(chip.dataset.category);
    });

    crumbs.addEventListener('click', (e) => {
      const crumb = e.target.closest('[data-crumb]')?.dataset.crumb;
      if (crumb === 'overview') this.state.overview('crumb');
      if (crumb === 'area') this.state.focusArea(this.state.areaName, 'crumb');
    });

    lanes.addEventListener('click', (e) => {
      if (!e.target.closest('[data-lane]')) return;
      lanesPanel.hidden = !lanesPanel.hidden;
      lanes.querySelectorAll('[data-lane]').forEach((b) => b.setAttribute('aria-expanded', String(!lanesPanel.hidden)));
    });
    document.addEventListener('pointerdown', (e) => {
      if (!lanesPanel.hidden && !lanesPanel.contains(e.target) && !lanes.contains(e.target)) {
        lanesPanel.hidden = true;
        lanes.querySelectorAll('[data-lane]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
      }
    });

    railToggle.addEventListener('click', () => {
      const open = !this.el.body.classList.contains('sc-rail-open');
      this.setRailOpen(open);
      if (open) search.focus();
    });

    this.el.overviewBtn.addEventListener('click', () => this.state.overview('toolbar'));
    this.el.prevBtn.addEventListener('click', () => this.state.prev('toolbar'));
    this.el.nextBtn.addEventListener('click', () => this.state.next('toolbar'));
    this.el.labelsBtn.addEventListener('click', () => {
      const on = this.el.labelsBtn.getAttribute('aria-pressed') !== 'true';
      this.el.labelsBtn.setAttribute('aria-pressed', String(on));
      this.onLabelsToggle(on);
    });

    window.addEventListener('keydown', (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') {
        if (!lanesPanel.hidden) {
          lanesPanel.hidden = true;
          return;
        }
        if (this.el.body.classList.contains('sc-rail-open') && this.state.level === LEVELS.OVERVIEW) {
          this.setRailOpen(false);
          return;
        }
        if (isTypingTarget(e.target) && e.target.value) return; // let the field clear first
        this.state.back('keyboard');
        return;
      }
      if (isTypingTarget(e.target)) return;
      if (e.key === ']') this.state.next('keyboard');
      if (e.key === '[') this.state.prev('keyboard');
      if (e.key === '/') {
        e.preventDefault();
        if (window.matchMedia('(max-width: 1100px)').matches) this.setRailOpen(true);
        search.focus();
      }
    });
  }

  /** Width fractions covered by the rail/workspace, for camera framing. */
  viewportInsets() {
    const w = window.innerWidth || 1;
    const rail = this.el.rail.getBoundingClientRect();
    const railVisible = getComputedStyle(this.el.rail).visibility !== 'hidden' && rail.right > 0;
    const ws = document.getElementById('sc-workspace');
    const wsRect = ws && !ws.hidden ? ws.getBoundingClientRect() : null;
    const wsIsSide = wsRect && wsRect.height > window.innerHeight * 0.6;
    return {
      left: railVisible ? Math.min(0.5, rail.right / w) : 0,
      right: wsIsSide ? Math.min(0.5, (w - wsRect.left) / w) : 0,
      bottom: wsRect && !wsIsSide ? Math.min(0.6, (window.innerHeight - wsRect.top) / window.innerHeight) : 0,
    };
  }

  dispose() {
    this._unsubscribe?.();
  }
}
