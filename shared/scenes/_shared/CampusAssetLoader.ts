/**
 * shared/scenes/_shared/CampusAssetLoader.ts
 *
 * Modularized campus geometry loader
 * Extracts SVG→Floor→Rooms pipeline from main.js into a reusable, scene-agnostic module
 *
 * Responsibilities:
 * - Load Floor base geometry
 * - Load SVG and generate extruded classroom meshes
 * - Initialize materials via materialRegistry
 * - Return complete CampusAsset with full lifecycle management
 */

import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * Campus asset bundle returned by loader
 */
export interface CampusAsset {
  // Geometry
  floorMesh: THREE.Mesh;
  roomGroup: THREE.Group;
  roomMeshes: Map<string, THREE.Mesh>;

  // Metadata
  roomRegistry: Record<string, { meshKey: string; userData: any }>;

  // Scene configuration
  sceneConfig: {
    fogColor: THREE.Color;
    fogDensity: number;
    backgroundColor: THREE.Color;
  };

  // Lifecycle
  dispose(): void;
}

/**
 * Configuration for campus asset loading
 */
export interface CampusAssetLoaderConfig {
  svgURL?: string;
  floorWidth?: number;
  floorHeight?: number;
  floorColor?: number;
  roomHeight?: number;
  fogColor?: string;
  fogDensity?: number;
  backgroundColor?: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<CampusAssetLoaderConfig> = {
  svgURL: "/floorplan.svg",
  floorWidth: 320,
  floorHeight: 250,
  floorColor: 0x2b2b2b,
  roomHeight: 250,
  fogColor: "#13243d",
  fogDensity: 0.0009,
  backgroundColor: "#0f1419",
};

/**
 * Campus asset loader
 * Handles all geometry generation and material initialization
 */
export class CampusAssetLoader {
  private config: Required<CampusAssetLoaderConfig>;
  private materialRegistry: any; // From @registries/materialsRegistry.js
  private roomColorPalette: string[] = [
    "#38bdf8", "#0ea5e9", "#2dd4bf", "#22d3ee", "#8b5cf6", "#f472b6",
  ];

  constructor(
    materialRegistry: any,
    config: CampusAssetLoaderConfig = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.materialRegistry = materialRegistry;
  }

  /**
   * Load complete campus asset (Floor + SVG rooms)
   */
  async load(): Promise<CampusAsset> {
    console.log("[CampusAssetLoader] Loading campus geometry...");

    // Step 1: Create floor
    const floorMesh = this.createFloor();

    // Step 2: Load SVG and generate rooms
    const { roomGroup, roomMeshes, roomRegistry } = await this.loadRoomsFromSVG();

    // Step 3: Create scene config
    const sceneConfig = {
      fogColor: new THREE.Color(this.config.fogColor),
      fogDensity: this.config.fogDensity,
      backgroundColor: new THREE.Color(this.config.backgroundColor),
    };

    console.log(`[CampusAssetLoader] Loaded ${roomMeshes.size} rooms`);

    // Step 4: Return disposable asset
    return {
      floorMesh,
      roomGroup,
      roomMeshes,
      roomRegistry,
      sceneConfig,
      dispose: () => this.disposeAsset(floorMesh, roomGroup, roomMeshes),
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Create floor base geometry
   */
  private createFloor(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(
      this.config.floorWidth,
      this.config.floorHeight
    );
    geometry.rotateX(Math.PI * -0.5);

    const material = this.materialRegistry.create("floorPlate", {
      color: this.config.floorColor,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, -14, 0);
    mesh.receiveShadow = true;

    console.log("[CampusAssetLoader] Floor created");
    return mesh;
  }

  /**
   * Load SVG file and generate room meshes (extruded from SVG paths)
   */
  private async loadRoomsFromSVG(): Promise<{
    roomGroup: THREE.Group;
    roomMeshes: Map<string, THREE.Mesh>;
    roomRegistry: Record<string, { meshKey: string; userData: any }>;
  }> {
    return new Promise((resolve, reject) => {
      const loader = new SVGLoader();
      const roomGroup = new THREE.Group();
      const roomMeshes = new Map<string, THREE.Mesh>();
      const roomRegistry: Record<string, { meshKey: string; userData: any }> = {};

      loader.load(
        this.config.svgURL,
        (svgData) => {
          try {
            svgData.paths.forEach((path) => {
              const rawId = path.userData?.node?.getAttribute("id");
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

                // Create room mesh
                const colorHex = this.getRoomColor(normId || rawId);
                const material = this.materialRegistry.create("roomBase", {
                  color: colorHex,
                  transparent: true,
                  opacity: 0.95,
                  roughness: 0.5,
                  metalness: 0.35,
                  roomKey: normId || rawId || null,
                });

                const geo = new RoundedBoxGeometry(size.x, size.y, this.config.roomHeight, 5, 6);
                const mesh = new THREE.Mesh(geo, material);

                mesh.position.set(center.x, this.config.roomHeight / 2, center.y);
                mesh.rotation.x = -Math.PI / 2;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.userData = {
                  roomKey: normId || rawId || null,
                  roomId: rawId || null,
                  colorHex,
                };

                if (normId) {
                  mesh.name = normId;
                  roomMeshes.set(normId, mesh);
                  roomRegistry[normId] = {
                    meshKey: normId,
                    userData: mesh.userData,
                  };
                }

                roomGroup.add(mesh);
              });
            });

            // Apply SVG transforms
            roomGroup.scale.set(0.1, 0.1, 0.1); // downscale
            roomGroup.rotation.y = Math.PI; // flip

            // Center group origin
            const bbox = new THREE.Box3().setFromObject(roomGroup);
            const groupCenter = new THREE.Vector3();
            bbox.getCenter(groupCenter);
            roomGroup.position.sub(groupCenter);

            console.log(`[CampusAssetLoader] Generated ${roomMeshes.size} rooms from SVG`);
            resolve({ roomGroup, roomMeshes, roomRegistry });
          } catch (e) {
            console.error("[CampusAssetLoader] SVG processing failed:", e);
            reject(e);
          }
        },
        undefined,
        (err) => {
          console.error("[CampusAssetLoader] SVG load failed:", err);
          reject(err);
        }
      );
    });
  }

  /**
   * Get color for room based on ID hash
   */
  private getRoomColor(roomId: string | null): string {
    if (!roomId) return this.roomColorPalette[0];

    let hash = 0;
    for (let i = 0; i < roomId.length; i++) {
      hash = (hash << 5) - hash + roomId.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % this.roomColorPalette.length;
    return this.roomColorPalette[index];
  }

  /**
   * Dispose all geometries and materials
   */
  private disposeAsset(
    floorMesh: THREE.Mesh,
    roomGroup: THREE.Group,
    roomMeshes: Map<string, THREE.Mesh>
  ): void {
    console.log("[CampusAssetLoader] Disposing campus asset...");

    // Dispose floor
    floorMesh.geometry.dispose();
    (floorMesh.material as THREE.Material).dispose();

    // Dispose rooms
    roomGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m: THREE.Material) => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });

    roomMeshes.clear();
    console.log("[CampusAssetLoader] Campus asset disposed");
  }
}

/**
 * Convenience function for loading campus asset
 */
export async function loadCampusAsset(
  materialRegistry: any,
  config?: CampusAssetLoaderConfig
): Promise<CampusAsset> {
  const loader = new CampusAssetLoader(materialRegistry, config);
  return loader.load();
}
