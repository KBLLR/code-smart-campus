import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, PerspectiveCamera, Vector3 } from 'three';

import { frameBox, azimuthOf, FRAMING } from '../../src/scene/cameraFraming.js';

function project(box, { position, target }, fov, aspect) {
  const cam = new PerspectiveCamera(fov, aspect, 0.1, 10000);
  cam.position.copy(position);
  cam.lookAt(target);
  cam.updateMatrixWorld();
  const xs = [];
  const ys = [];
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
    const v = new Vector3(x, y, z).project(cam);
    xs.push(v.x);
    ys.push(v.y);
  }
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

// Approximate campus.glb extents (floor slab + rooms)
const campus = new Box3(new Vector3(-125, 0, -100), new Vector3(120, 27, 95));

test('overview frame keeps the whole campus on screen', () => {
  const f = frameBox({ box: campus, fovDeg: 45, aspect: 1440 / 900, ...FRAMING.overview });
  const p = project(campus, f, 45, 1440 / 900);
  assert.ok(p.minX > -1.15 && p.maxX < 1.15, JSON.stringify(p)); // bounding-sphere fit with <1 padding may graze edges
  assert.ok(p.minY > -1.15 && p.maxY < 1.15, JSON.stringify(p));
});

test('room frame fits a small room fully inside the viewport', () => {
  const room = new Box3(new Vector3(10, 3, 25), new Vector3(22, 27, 34));
  const f = frameBox({ box: room, fovDeg: 45, aspect: 1440 / 900, ...FRAMING.room });
  const p = project(room, f, 45, 1440 / 900);
  assert.ok(p.minX > -1 && p.maxX < 1 && p.minY > -1 && p.maxY < 1, JSON.stringify(p));
});

test('side insets centre the subject in the uncovered part of the screen', () => {
  const room = new Box3(new Vector3(-5, 0, -5), new Vector3(5, 20, 5));
  const inset = { left: 0.2, right: 0.3 };
  const f = frameBox({ box: room, fovDeg: 45, aspect: 1.6, ...FRAMING.room, inset });
  const p = project(room, f, 45, 1.6);
  const freeLeft = -1 + 2 * inset.left;
  const freeRight = 1 - 2 * inset.right;
  assert.ok(p.minX > freeLeft && p.maxX < freeRight, `subject ${p.minX}..${p.maxX} outside free ${freeLeft}..${freeRight}`);
  const centre = (p.minX + p.maxX) / 2;
  assert.ok(Math.abs(centre - (freeLeft + freeRight) / 2) < 0.1, `centre ${centre}`);
});

test('bottom inset lifts the subject above a bottom sheet', () => {
  const room = new Box3(new Vector3(-5, 0, -5), new Vector3(5, 20, 5));
  const f = frameBox({ box: room, fovDeg: 45, aspect: 0.7, ...FRAMING.room, inset: { bottom: 0.5 } });
  const p = project(room, f, 45, 0.7);
  assert.ok(p.minY > -0.05, `subject bottom ${p.minY} hidden under the sheet`);
});

test('azimuth is preserved so transitions dolly instead of spinning', () => {
  const az = 1.1;
  const f = frameBox({ box: campus, fovDeg: 45, aspect: 1.5, azimuth: az });
  assert.ok(Math.abs(azimuthOf(f.position, f.target) - az) < 1e-6);
});

test('empty boxes are rejected', () => {
  assert.throws(() => frameBox({ box: new Box3(), fovDeg: 45, aspect: 1 }), TypeError);
});
