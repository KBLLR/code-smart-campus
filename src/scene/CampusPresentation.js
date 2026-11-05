/**
 * CampusPresentation — how the provided campus.glb is shown.
 *
 * Runtime-only changes; public/models/campus.glb is never modified:
 *   - every room gets its own material (the GLB shares one material per category,
 *     so emphasising one meeting room used to light up all eight and the legend disk);
 *   - room geometry is re-centred on its own bounds so Space.js labels anchor to
 *     the room, not to the model origin (a3 was ~90 units off);
 *   - architectural edge lines for legibility on the light Core-X canvas;
 *   - emphasis for hover / selection / area focus / category filter, eased per frame
 *     (instant under prefers-reduced-motion).
 */
import {
  Box3, Color, EdgesGeometry, LineBasicMaterial, LineSegments, MeshStandardMaterial, Vector3,
} from 'three';

import { CATEGORY_PALETTE, GLB_BUTTON_CATEGORY, SCENE_NEUTRALS, tintFor } from './categoryPalette.js';
import { LEVELS } from '../campus/CampusState.js';

const NO_RAYCAST = () => {};

const LOOK = Object.freeze({
  normal: { mix: 0, lighten: 0.12, opacity: 1, edgeOpacity: 0.55, edgeDark: 0, emissive: 0 },
  hovered: { mix: 0, lighten: 0.32, opacity: 1, edgeOpacity: 0.9, edgeDark: 1, emissive: 0.04 },
  selected: { mix: 0, lighten: 0.04, opacity: 1, edgeOpacity: 1, edgeDark: 1, emissive: 0.12 },
  context: { mix: 0.45, lighten: 0.1, opacity: 1, edgeOpacity: 0.35, edgeDark: 0, emissive: 0 },
  dimmed: { mix: 0.8, lighten: 0.15, opacity: 1, edgeOpacity: 0.18, edgeDark: 0, emissive: 0 },
});

export class CampusPresentation {
  /**
   * @param {object} opts
   * @param {{scene: import('three').Object3D, rooms: {id: string, mesh: import('three').Mesh}[], buttons: {id: string, mesh: import('three').Mesh}[]}} opts.model  GLBLoader result
   * @param {{rooms: Map<string, object>}} opts.roomIndex
   * @param {boolean} [opts.reducedMotion]
   */
  constructor({ model, roomIndex, reducedMotion = false }) {
    this.model = model;
    this.roomIndex = roomIndex;
    this.reducedMotion = reducedMotion;
    this.entries = new Map(); // roomId -> { mesh, material, edges, base, look, target }
    this.buttonEntries = new Map(); // mesh uuid -> { mesh, category }
    this.categoryFilter = null;
    this.floorColor = new Color(SCENE_NEUTRALS.floor);
    this.edgeDark = new Color(SCENE_NEUTRALS.edge);
    this.edgeMuted = new Color(SCENE_NEUTRALS.edgeMuted);
    this._tmp = new Color();
    this._prepare();
  }

  _prepare() {
    this.model.scene.traverse((obj) => {
      if (!obj.isMesh) return;
      if ((obj.name || '').toLowerCase() === 'floormap') {
        obj.material = new MeshStandardMaterial({ color: SCENE_NEUTRALS.floor, roughness: 1, metalness: 0 });
        obj.castShadow = false;
        obj.receiveShadow = true;
        this.floor = obj;
      }
    });

    for (const { id, mesh } of this.model.rooms) {
      const room = this.roomIndex.rooms.get(id);
      if (!room) continue;
      this._recenter(mesh);
      const base = new Color(tintFor(room.category));
      const material = new MeshStandardMaterial({
        name: `room:${room.id}`,
        color: base.clone(),
        roughness: 0.88,
        metalness: 0,
        emissive: base.clone(),
        emissiveIntensity: 0,
      });
      mesh.material = material;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const edges = new LineSegments(
        new EdgesGeometry(mesh.geometry, 30),
        new LineBasicMaterial({ color: this.edgeMuted.clone(), transparent: true, opacity: LOOK.normal.edgeOpacity }),
      );
      edges.name = `edges:${room.id}`;
      edges.raycast = NO_RAYCAST; // edges must never steal room picks
      mesh.add(edges);

      const look = { ...LOOK.normal };
      this.entries.set(room.id, { room, mesh, material, edges, base, look, target: { ...LOOK.normal } });
    }

    for (const { mesh } of this.model.buttons || []) {
      const category = GLB_BUTTON_CATEGORY[(mesh.name || '').toLowerCase()];
      if (!category) continue;
      mesh.material = new MeshStandardMaterial({ color: tintFor(category), roughness: 0.8, metalness: 0 });
      mesh.userData.category = category;
      this.buttonEntries.set(mesh.uuid, { mesh, category });
    }

    this._applyAll(true);
  }

  /** Move geometry so its bounds are centred on the mesh origin, compensating the mesh position. */
  _recenter(mesh) {
    const g = mesh.geometry;
    g.computeBoundingBox();
    const c = g.boundingBox.getCenter(new Vector3());
    if (c.lengthSq() < 1e-6) return;
    g.translate(-c.x, -c.y, -c.z);
    g.computeBoundingBox();
    g.computeBoundingSphere();
    mesh.position.add(c.multiply(mesh.scale).applyQuaternion(mesh.quaternion));
    mesh.updateMatrixWorld(true);
  }

  // ---------------------------------------------------------------------------
  // Bounds

  campusBox() {
    const box = new Box3();
    if (this.floor) box.expandByObject(this.floor);
    this.entries.forEach(({ mesh }) => box.expandByObject(mesh));
    return box;
  }

  roomBox(roomId) {
    const e = this.entries.get(roomId);
    return e ? new Box3().setFromObject(e.mesh) : null;
  }

  areaBox(areaName) {
    const box = new Box3();
    this.entries.forEach(({ room, mesh }) => {
      if (room.area === areaName) box.expandByObject(mesh);
    });
    return box.isEmpty() ? null : box;
  }

  // ---------------------------------------------------------------------------
  // Emphasis

  /** Category filter from the legend; null clears it. */
  setCategoryFilter(category) {
    this.categoryFilter = category && CATEGORY_PALETTE[category] ? category : null;
    this.setEmphasis(this._lastSnapshot || { level: LEVELS.OVERVIEW });
  }

  setEmphasis(snapshot) {
    this._lastSnapshot = snapshot;
    const { level, areaName, roomId, hoveredId } = snapshot;
    this.entries.forEach((entry, id) => {
      let look = LOOK.normal;
      const { room } = entry;
      if (level === LEVELS.ROOM) {
        look = id === roomId ? LOOK.selected : (room.area === areaName ? LOOK.context : LOOK.dimmed);
      } else if (level === LEVELS.AREA) {
        look = room.area === areaName ? LOOK.normal : LOOK.dimmed;
      }
      if (this.categoryFilter && room.category !== this.categoryFilter && id !== roomId) {
        look = LOOK.dimmed;
      }
      if (id === hoveredId && id !== roomId) look = LOOK.hovered;
      entry.target = { ...look };
    });
    if (this.reducedMotion) this._applyAll(true);
  }

  update(dt) {
    if (this.reducedMotion) return;
    const k = 1 - Math.exp(-12 * Math.min(dt || 0.016, 0.1));
    let dirty = false;
    this.entries.forEach((entry) => {
      for (const key of Object.keys(entry.target)) {
        const from = entry.look[key];
        const to = entry.target[key];
        if (Math.abs(to - from) > 1e-3) {
          entry.look[key] = from + (to - from) * k;
          dirty = true;
        } else {
          entry.look[key] = to;
        }
      }
    });
    if (dirty) this._applyAll(false);
  }

  _applyAll(snap) {
    this.entries.forEach((entry) => {
      if (snap) entry.look = { ...entry.target };
      const { look, material, edges, base } = entry;
      const c = this._tmp.copy(base).lerp(this.floorColor, look.mix);
      if (look.lighten) c.lerp(new Color(1, 1, 1), look.lighten);
      material.color.copy(c);
      material.emissive.copy(base);
      material.emissiveIntensity = look.emissive;
      const transparent = look.opacity < 0.99;
      material.transparent = transparent;
      material.opacity = look.opacity;
      material.depthWrite = !transparent;
      edges.material.color.copy(this.edgeMuted).lerp(this.edgeDark, look.edgeDark);
      edges.material.opacity = look.edgeOpacity;
    });
  }

  /** Button meshes (GLB legend disks) -> category, for click handling. */
  categoryForMesh(mesh) {
    return this.buttonEntries.get(mesh?.uuid)?.category || null;
  }

  dispose() {
    this.entries.forEach(({ material, edges }) => {
      material.dispose();
      edges.geometry.dispose();
      edges.material.dispose();
    });
    this.entries.clear();
  }
}
