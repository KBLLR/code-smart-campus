/**
 * Camera framing for the campus → area → room flow.
 *
 * Computes a camera position/target that fits a world-space box in the view,
 * keeping the current azimuth so transitions read as a dolly toward the
 * selection rather than a spin around it. Pure three.js math, no renderer.
 */
import { Box3, Sphere, Vector3, MathUtils } from 'three';

export const FRAMING = Object.freeze({
  overview: { elevationDeg: 44, padding: 0.92, minRadius: 0 },
  area: { elevationDeg: 50, padding: 1.05, minRadius: 30 },
  room: { elevationDeg: 56, padding: 2.4, minRadius: 22 },
});

/**
 * @param {object} opts
 * @param {Box3} opts.box             World-space box to frame.
 * @param {number} opts.fovDeg        Vertical field of view.
 * @param {number} opts.aspect        Viewport aspect (w/h).
 * @param {number} [opts.azimuth]     Radians around +Y; defaults to a 3/4 view.
 * @param {number} [opts.elevationDeg]
 * @param {number} [opts.padding]     >1 leaves room around the subject.
 * @param {number} [opts.minRadius]   Prevents tiny rooms from filling the screen.
 * @param {{left?:number,right?:number,bottom?:number}} [opts.inset] Fraction of width (left/right) or height (bottom) covered by panels; the subject is fitted to, and centred in, the free area.
 * @returns {{ position: Vector3, target: Vector3, distance: number }}
 */
export function frameBox({ box, fovDeg, aspect, azimuth = Math.PI / 4, elevationDeg = 42, padding = 1.1, minRadius = 0, inset = {} }) {
  if (!(box instanceof Box3) || box.isEmpty()) throw new TypeError('frameBox requires a non-empty Box3');
  const sphere = box.getBoundingSphere(new Sphere());
  const radius = Math.max(sphere.radius, minRadius) * padding;

  const vFov = MathUtils.degToRad(fovDeg);
  const free = Math.max(0.35, 1 - (inset.left || 0) - (inset.right || 0));
  const tanHalfFull = Math.tan(vFov / 2) * Math.max(0.2, aspect);
  const hFov = 2 * Math.atan(tanHalfFull * free);
  const freeV = Math.max(0.35, 1 - (inset.bottom || 0));
  const fitVFov = 2 * Math.atan(Math.tan(vFov / 2) * freeV);
  const fitFov = Math.min(fitVFov, hFov);
  const distance = radius / Math.sin(fitFov / 2);

  const elevation = MathUtils.degToRad(elevationDeg);
  const dir = new Vector3(
    Math.cos(elevation) * Math.sin(azimuth),
    Math.sin(elevation),
    Math.cos(elevation) * Math.cos(azimuth),
  );

  const target = sphere.center.clone();
  // Shift the look-at point sideways so the subject sits in the area not covered by panels.
  const shift = ((inset.right || 0) - (inset.left || 0)) / 2;
  if (shift) {
    const right = new Vector3(Math.cos(azimuth), 0, -Math.sin(azimuth));
    const screenWidthAtTarget = 2 * tanHalfFull * distance;
    target.addScaledVector(right, shift * screenWidthAtTarget);
  }

  if (inset.bottom) {
    // Camera "up" in world space; moving the target down the screen lifts the subject into the free area.
    const up = new Vector3(-Math.sin(elevation) * Math.sin(azimuth), Math.cos(elevation), -Math.sin(elevation) * Math.cos(azimuth));
    const screenHeightAtTarget = 2 * Math.tan(vFov / 2) * distance;
    target.addScaledVector(up, -(inset.bottom / 2) * screenHeightAtTarget);
  }

  return { position: target.clone().addScaledVector(dir, distance), target, distance };
}

/** Azimuth (radians around +Y) of a camera position relative to its target. */
export function azimuthOf(position, target) {
  return Math.atan2(position.x - target.x, position.z - target.z);
}
