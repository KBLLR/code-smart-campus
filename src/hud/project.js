import * as THREE from "three";

const tempVector = new THREE.Vector3();

/**
 * Projects a world-space position into screen-space coordinates.
 *
 * @param {THREE.Vector3} worldPosition
 * @param {THREE.Camera} camera
 * @param {HTMLElement} viewportElement - Typically renderer.domElement
 * @returns {{ x: number, y: number, visible: boolean, depth: number }}
 */
export function projectWorldToScreen(worldPosition, camera, viewportElement) {
  tempVector.copy(worldPosition);
  tempVector.project(camera);

  const visible = tempVector.z >= -1 && tempVector.z <= 1;

  const width = viewportElement.clientWidth || window.innerWidth;
  const height = viewportElement.clientHeight || window.innerHeight;

  const x = (tempVector.x * 0.5 + 0.5) * width;
  const y = (-tempVector.y * 0.5 + 0.5) * height;

  return {
    x,
    y,
    visible,
    depth: tempVector.z,
  };
}
