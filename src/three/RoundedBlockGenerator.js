// src/three/RoundedBlockGenerator.js
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import GenColor from "@utils/GenColor.js";

/**
 * Generate rounded boxes from SVG path data and align them to the scene layout.
 * @param {string} svgURL - URL to the SVG file.
 * @param {THREE.Scene} scene - The scene where meshes will be added.
 * @param {Object} registry - Registry to populate with mesh references (keyed by id).
 * @param {number} height - Optional height of the rounded boxes.
 * @returns {Promise<THREE.Group>}
 */
export async function generateRoundedBlocksFromSVG(
  svgURL,
  scene,
  registry,
  height = 250,
) {
  const loader = new SVGLoader();
  const group = new THREE.Group();

  return new Promise((resolve, reject) => {
    loader.load(
      svgURL,
      (svgData) => {
        svgData.paths.forEach((path) => {
          const rawId = path.userData.node?.getAttribute("id");
          const normId = rawId?.toLowerCase().replace(/[^a-z0-9]/g, "");
          const shapes = path.toShapes(true);

          shapes.forEach((shape) => {
            const shapeGeo = new THREE.ShapeGeometry(shape);
            shapeGeo.computeBoundingBox();

            const bbox = shapeGeo.boundingBox;
            if (!bbox) return;

            const size = new THREE.Vector3();
            bbox.getSize(size);

            const center = new THREE.Vector3();
            bbox.getCenter(center);

            const material = new THREE.MeshStandardMaterial({
              color: new GenColor(
                `#${Math.floor(Math.random() * 16777215)
                  .toString(16)
                  .padStart(6, "0")}`,
              ).rgb,
              roughness: 0.5,
              metalness: 0.4,
              transparent: true,
              opacity: 0.95,
            });

            const geo = new RoundedBoxGeometry(size.x, size.y, height, 5, 6);
            const mesh = new THREE.Mesh(geo, material);

            mesh.position.set(center.x, height / 2, center.y); // y = height
            mesh.rotation.x = -Math.PI / 2; // Align to floor

            if (normId) {
              mesh.name = normId;
              registry[normId] = mesh;
            }

            group.add(mesh);
          });
        });

        // Match SVG scene transform
        group.scale.set(0.1, 0.1, 0.1); // downscale
        group.rotation.y = Math.PI; // flip

        // Center group origin
        const bbox = new THREE.Box3().setFromObject(group);
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        group.position.sub(center);

        console.log(`✅ Rounded blocks created: ${group.children.length}`);
        resolve(group);
      },
      undefined,
      (err) => {
        console.error("❌ SVG load failed:", err);
        reject(err);
      },
    );
  });
}
