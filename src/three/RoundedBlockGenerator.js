// src/three/RoundedBlockGenerator.js
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import GenColor from "@utils/GenColor.js";
import { materialRegistry } from "@registries/materialsRegistry.js";
import { FLOORPLAN_SCALE, FLOORPLAN_ROTATION_X } from "@config/floorplanTransform.js";

const ROOM_COLOR_PALETTE =
  GenColor.getPalette("cool") ??
  GenColor.getPalette("pastel") ?? [
    "#38bdf8",
    "#0ea5e9",
    "#2dd4bf",
    "#22d3ee",
    "#8b5cf6",
    "#f472b6",
  ];

function hashStringToIndex(id, modulo) {
  if (!id || !modulo) return 0;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % modulo;
}

function getRoomColorHex(roomId, fallbackIndex = 0) {
  const palette = ROOM_COLOR_PALETTE;
  const index = hashStringToIndex(roomId, palette.length);
  return palette[index ?? fallbackIndex] || palette[0];
}

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

            const colorHex = getRoomColorHex(normId || rawId || `room-${group.children.length}`);
            const material = materialRegistry.create("roomBase", {
              color: colorHex,
              transparent: true,
              opacity: 0.95,
              roughness: 0.5,
              metalness: 0.35,
              roomKey: normId || rawId || null,
            });

            const geo = new RoundedBoxGeometry(size.x, size.y, height, 5, 6);
            const mesh = new THREE.Mesh(geo, material);

            mesh.position.set(center.x, height / 2, center.y); // y = height
            mesh.rotation.x = FLOORPLAN_ROTATION_X; // Align SVG Y-axis to World Z-axis
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData = {
              ...(mesh.userData || {}),
              roomKey: normId || rawId || null,
              roomId: rawId || null,
            };

            if (normId) {
              mesh.name = normId;
              registry[normId] = mesh;
            }

            group.add(mesh);
          });
        });

        // Apply SVG → World coordinate transform (from floorplanTransform.js)
        group.scale.set(FLOORPLAN_SCALE, FLOORPLAN_SCALE, FLOORPLAN_SCALE);
        group.rotation.y = Math.PI; // 180° flip to match scene orientation

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
