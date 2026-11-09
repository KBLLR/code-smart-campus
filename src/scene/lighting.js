/**
 * Core-X light-canvas lighting for the campus massing model.
 *
 * Soft hemisphere fill in the warm Core-X neutrals plus one shadow-casting key
 * light whose shadow camera is fitted to the campus bounds. Bias values remove
 * the shadow acne (striping) visible on every room face in the previous preset.
 */
import { DirectionalLight, HemisphereLight, Group, Vector3, Sphere } from 'three';

export function createCorexLighting(campusBox, { shadows = true } = {}) {
  const group = new Group();
  group.name = 'corex-lighting';

  const hemi = new HemisphereLight(0xf8f5ef, 0xa8a39c, 2.3);
  group.add(hemi);

  const sphere = campusBox.getBoundingSphere(new Sphere());
  const r = Math.max(sphere.radius, 1);

  const key = new DirectionalLight(0xfff7ec, 1.6);
  key.position.copy(sphere.center).add(new Vector3(-0.55, 1.15, 0.75).normalize().multiplyScalar(r * 2));
  key.target.position.copy(sphere.center);
  group.add(key, key.target);

  if (shadows) {
    key.castShadow = true;
    const cam = key.shadow.camera;
    cam.left = -r; cam.right = r; cam.top = r; cam.bottom = -r;
    cam.near = r * 0.5; cam.far = r * 4;
    cam.updateProjectionMatrix();
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = r * 0.004;
    key.shadow.radius = 3;
  }

  const fill = new DirectionalLight(0xe6ecf2, 0.35);
  fill.position.copy(sphere.center).add(new Vector3(0.8, 0.6, -0.6).normalize().multiplyScalar(r * 2));
  group.add(fill);

  return group;
}
