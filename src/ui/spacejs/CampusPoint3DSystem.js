/**
 * CampusPoint3DSystem — Space.js Point3D labels for campus rooms.
 *
 * Space.js remains the spatial label layer: each navigable room gets a Point3D
 * (reticle + leader line + name/type label) projected from the 3D room.
 *
 * Modernised integration (2026-11):
 *   - Labels are driven by CampusState, not by Point3D's own pointer handling, so
 *     hovering a room in the 3D view, in the room list, or via keyboard shows the
 *     same label, and the selected classroom keeps its label pinned.
 *   - Point3D groups are added to the scene. Previously they were not, so their
 *     world matrices (and therefore label positions) never updated.
 *   - The per-point tracker/panel ("ENTER ROOM →") is replaced by the classroom
 *     workspace; Point3D stays responsible only for in-space labelling.
 *   - Theme comes from Space.js CSS variables mapped to Core-X tokens
 *     (src/styles/corex/spacejs-corex.css).
 */
import { Stage } from '@alienkitty/space.js/src/utils/Stage.js';
import { Point3D } from '@alienkitty/space.js/src/three/ui/Point3D.js';
import { clearTween } from '@alienkitty/space.js/src/tween/Tween.js';

import { LEVELS } from '../../campus/CampusState.js';

export class CampusPoint3DSystem {
  /**
   * @param {import('three').Scene} scene
   * @param {import('three').Camera} camera
   * @param {object} deps
   * @param {{rooms: Map<string, object>, order: string[]}} deps.roomIndex
   * @param {import('../../scene/CampusPresentation.js').CampusPresentation} deps.presentation
   * @param {import('../../campus/CampusState.js').CampusState} deps.state
   * @param {HTMLElement} [deps.container]
   */
  constructor(scene, camera, { roomIndex, presentation, state, container = document.body }) {
    this.scene = scene;
    this.camera = camera;
    this.roomIndex = roomIndex;
    this.presentation = presentation;
    this.state = state;
    this.points = new Map(); // roomId -> Point3D
    this.visible = new Set();
    this.labelsEnabled = true;

    Stage.init(document.body);
    Point3D.init(scene, camera, { root: container, container, debug: false });
    // Selection/hover come from CampusState (raycast in InputManager); Point3D only renders.
    Point3D.enabled = false;
    // Point3D's window keyup handler is not gated by `enabled`: digits would select
    // points while typing in the room search, and Esc would fight the shell's Esc.
    window.removeEventListener('keyup', Point3D.onKeyUp);

    this._createPoints();
    this._unsubscribe = state.subscribe((snap) => this._sync(snap));
  }

  _createPoints() {
    for (const roomId of this.roomIndex.order) {
      const room = this.roomIndex.rooms.get(roomId);
      const entry = this.presentation.entries.get(roomId);
      if (!room || !entry) continue;
      const point = new Point3D(entry.mesh, {
        name: room.name,
        type: [room.area, room.use].filter(Boolean).join(' · '),
        noTracker: true,
      });
      point.userData.roomId = roomId;
      point.element.element.setAttribute('aria-hidden', 'true'); // the room list is the accessible equivalent
      this.scene.add(point);
      this.points.set(roomId, point);
    }
  }

  setLabelsEnabled(enabled) {
    this.labelsEnabled = Boolean(enabled);
    this._sync(this.state.snapshot());
  }

  _sync(snap) {
    const want = new Set();
    if (this.labelsEnabled) {
      if (snap.level === LEVELS.ROOM && snap.roomId) want.add(snap.roomId);
      if (snap.hoveredId) want.add(snap.hoveredId);
    }
    for (const id of [...this.visible]) {
      if (!want.has(id)) this._hide(id);
    }
    for (const id of want) {
      if (!this.visible.has(id)) this._show(id);
    }
  }

  _show(roomId) {
    const point = this.points.get(roomId);
    if (!point) return;
    clearTween(point.timeout);
    if (!point.animatedIn) {
      point.setInitialPosition();
      point.resize();
      point.animateIn();
    }
    this.visible.add(roomId);
  }

  _hide(roomId) {
    const point = this.points.get(roomId);
    this.visible.delete(roomId);
    if (!point) return;
    clearTween(point.timeout);
    if (point.animatedIn) point.animateOut(true);
  }

  update(time) {
    Point3D.update(time);
  }

  dispose() {
    this._unsubscribe?.();
    this.points.forEach((point) => {
      this.scene.remove(point);
      Point3D.remove(point);
    });
    this.points.clear();
    this.visible.clear();
  }
}
