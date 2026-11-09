/**
 * CampusState — navigation state for the campus → area → classroom flow.
 *
 * Levels:
 *   overview  whole campus framed, nothing selected
 *   area      one campus area (Garden, Cosmos, ...) framed, rooms of that area emphasised
 *   room      one classroom selected; the classroom workspace is open
 *
 * The state is the single source of truth for what is selected. The 3D scene,
 * Space.js labels, the room list and the classroom workspace all render from it,
 * so selecting from any surface (mesh click, list, keyboard, URL hash) stays
 * consistent.
 *
 * Selecting or viewing never performs an action: this module only changes
 * what is shown. It has no network, device, or lane access.
 *
 * Pure module: no DOM. `location.hash` is handled by the caller via toHash()/parseHash().
 */

export const LEVELS = Object.freeze({ OVERVIEW: 'overview', AREA: 'area', ROOM: 'room' });

const HASH_PREFIX = '#/';

export class CampusState {
  /**
   * @param {{ rooms: Map<string, {id: string, area: string, navigable: boolean}>, order: string[], areas: {name: string, roomIds: string[]}[] }} index
   */
  constructor(index) {
    if (!index || !(index.rooms instanceof Map) || !Array.isArray(index.order)) {
      throw new TypeError('CampusState requires a room index from buildRoomIndex()');
    }
    this.index = index;
    this.level = LEVELS.OVERVIEW;
    this.areaName = null;
    this.roomId = null;
    this.hoveredId = null;
    this._listeners = new Set();
  }

  /** @returns {() => void} unsubscribe */
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  snapshot() {
    return Object.freeze({
      level: this.level,
      areaName: this.areaName,
      roomId: this.roomId,
      hoveredId: this.hoveredId,
      room: this.roomId ? this.index.rooms.get(this.roomId) : null,
    });
  }

  isSelectable(roomId) {
    const room = this.index.rooms.get(roomId);
    return Boolean(room && room.navigable);
  }

  /** Select a classroom. Unknown or service spaces are rejected (returns false). */
  selectRoom(roomId, source = 'unknown') {
    if (!this.isSelectable(roomId)) return false;
    if (this.level === LEVELS.ROOM && this.roomId === roomId) return true;
    const room = this.index.rooms.get(roomId);
    this.level = LEVELS.ROOM;
    this.roomId = roomId;
    this.areaName = room.area;
    this._emit('select-room', source);
    return true;
  }

  /** Frame an area without opening a classroom. */
  focusArea(areaName, source = 'unknown') {
    if (!this.index.areas.some((a) => a.name === areaName)) return false;
    this.level = LEVELS.AREA;
    this.areaName = areaName;
    this.roomId = null;
    this._emit('focus-area', source);
    return true;
  }

  /** Room → its area, area → overview. Returns the new level. */
  back(source = 'unknown') {
    if (this.level === LEVELS.ROOM) {
      this.level = LEVELS.AREA;
      this.roomId = null;
      this._emit('back', source);
    } else if (this.level === LEVELS.AREA) {
      this.overview(source);
    }
    return this.level;
  }

  overview(source = 'unknown') {
    if (this.level === LEVELS.OVERVIEW) return;
    this.level = LEVELS.OVERVIEW;
    this.areaName = null;
    this.roomId = null;
    this._emit('overview', source);
  }

  /** Step to the next/previous classroom in campus order, wrapping around. */
  step(delta, source = 'unknown') {
    const { order } = this.index;
    if (!order.length) return false;
    let i = this.roomId ? order.indexOf(this.roomId) : -1;
    if (i === -1) {
      // From overview/area start at the first room of the focused area if any.
      const area = this.areaName && this.index.areas.find((a) => a.name === this.areaName);
      const start = area ? order.indexOf(area.roomIds[0]) : 0;
      return this.selectRoom(order[delta >= 0 ? start : (start - 1 + order.length) % order.length], source);
    }
    i = (i + delta + order.length) % order.length;
    return this.selectRoom(order[i], source);
  }

  next(source) { return this.step(1, source); }
  prev(source) { return this.step(-1, source); }

  /** Hover is transient and only emitted when it changes. Non-selectable ids clear hover. */
  hover(roomId) {
    const next = roomId && this.isSelectable(roomId) ? roomId : null;
    if (next === this.hoveredId) return;
    this.hoveredId = next;
    this._emit('hover', 'pointer');
  }

  toHash() {
    if (this.level === LEVELS.ROOM) return `${HASH_PREFIX}room/${encodeURIComponent(this.roomId)}`;
    if (this.level === LEVELS.AREA) return `${HASH_PREFIX}area/${encodeURIComponent(this.areaName)}`;
    return '';
  }

  /** Apply a hash produced by toHash(). Invalid hashes fall back to overview. */
  applyHash(hash) {
    const parsed = CampusState.parseHash(hash);
    if (parsed.roomId && this.selectRoom(parsed.roomId, 'hash')) return true;
    if (parsed.areaName && this.focusArea(parsed.areaName, 'hash')) return true;
    this.overview('hash');
    return false;
  }

  static parseHash(hash) {
    const value = String(hash || '');
    if (!value.startsWith(HASH_PREFIX)) return { roomId: null, areaName: null };
    const [kind, ...rest] = value.slice(HASH_PREFIX.length).split('/');
    let arg = null;
    try {
      arg = decodeURIComponent(rest.join('/'));
    } catch {
      arg = null;
    }
    if (!arg) return { roomId: null, areaName: null };
    if (kind === 'room') return { roomId: arg, areaName: null };
    if (kind === 'area') return { roomId: null, areaName: arg };
    return { roomId: null, areaName: null };
  }

  _emit(reason, source) {
    const snap = this.snapshot();
    for (const listener of this._listeners) listener(snap, { reason, source });
  }
}
