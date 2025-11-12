/**
 * Floorplan Transform Configuration
 *
 * Single source of truth for SVG → 3D world coordinate transformation.
 * Used by:
 * - generateRoomRegistry.js (build-time coordinate extraction)
 * - RoundedBlockGenerator.js (runtime geometry extrusion)
 * - RoomMeshGenerator.js (runtime picking mesh placement)
 */

import * as THREE from 'three';

/**
 * Scale factor: SVG pixels → world meters
 * SVG coordinates are in px, world coordinates are in meters
 */
export const FLOORPLAN_SCALE = 0.1;

/**
 * Default Y-height for room centers and picking meshes
 */
export const FLOORPLAN_HEIGHT = 20;

/**
 * Rotation to align SVG coordinate system with 3D world
 * SVG has Y-down, 3D world has Y-up
 * This rotates -90° around X-axis to map SVG Y → World Z
 */
export const FLOORPLAN_ROTATION_X = -Math.PI / 2;

/**
 * World origin offset
 * If SVG coordinates need to be offset in world space, adjust here
 */
export const FLOORPLAN_ORIGIN = new THREE.Vector3(0, 0, 0);

/**
 * Converts raw SVG coordinates (x, y in pixels) into 3D world-space position [x, y, z]
 *
 * @param {number} svgX - X coordinate in SVG space (pixels)
 * @param {number} svgY - Y coordinate in SVG space (pixels)
 * @param {number} [height=FLOORPLAN_HEIGHT] - Y height in world space
 * @returns {[number, number, number]} World position [x, y, z]
 *
 * @example
 * // SVG center at (1427, 1043) → World position
 * const [x, y, z] = svgToWorldCenter(1427, 1043);
 * // → [142.7, 20, 104.3]
 */
export function svgToWorldCenter(svgX, svgY, height = FLOORPLAN_HEIGHT) {
  // Apply scale
  const scaledX = svgX * FLOORPLAN_SCALE;
  const scaledZ = svgY * FLOORPLAN_SCALE; // SVG Y → World Z

  // Apply origin offset
  const worldX = FLOORPLAN_ORIGIN.x + scaledX;
  const worldY = height;
  const worldZ = FLOORPLAN_ORIGIN.z + scaledZ;

  return [worldX, worldY, worldZ];
}

/**
 * Converts world coordinates back to SVG space
 * Useful for debugging or reverse-mapping
 *
 * @param {number} worldX - X coordinate in world space
 * @param {number} worldZ - Z coordinate in world space
 * @returns {[number, number]} SVG position [x, y]
 */
export function worldToSvgPosition(worldX, worldZ) {
  const svgX = (worldX - FLOORPLAN_ORIGIN.x) / FLOORPLAN_SCALE;
  const svgY = (worldZ - FLOORPLAN_ORIGIN.z) / FLOORPLAN_SCALE;
  return [svgX, svgY];
}

/**
 * Apply the standard floorplan transform to a Three.js object
 * Sets position, rotation, and scale to match floorplan coordinate system
 *
 * @param {THREE.Object3D} object - Object to transform
 * @param {number} [scale=FLOORPLAN_SCALE] - Scale factor
 */
export function applyFloorplanTransform(object, scale = FLOORPLAN_SCALE) {
  object.scale.set(scale, scale, scale);
  object.rotation.x = FLOORPLAN_ROTATION_X;
  object.position.copy(FLOORPLAN_ORIGIN);
}
