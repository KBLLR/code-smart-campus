/**
 * shared/scenes/_shared/CampusAssetLoader.ts
 *
 * Modularized campus geometry loader
 * Supports both SVG and GLTF loading modes
 *
 * Responsibilities:
 * - Load Floor base geometry
 * - Load campus model (SVG or GLTF)
 * - Initialize materials via materialRegistry
 * - Return complete CampusAsset with full lifecycle management
 */

import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
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
  mode?: "svg" | "gltf"; // Loading mode: SVG or GLTF
  svgURL?: string;
  gltfURL?: string; // Path to GLTF/GLB model
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
  mode: "gltf", // Use GLTF by default now
  svgURL: "/floorplan.svg",
  gltfURL: "/models/campus.glb", // Default GLTF model path
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
   * Load complete campus asset (Floor + rooms from SVG or GLTF)
   */
  async load(): Promise<CampusAsset> {
    console.log(`[CampusAssetLoader] Loading campus geometry (mode: ${this.config.mode})...`);

    // Step 1: Create floor (only in SVG mode - GLTF has its own floor)
    const floorMesh = this.config.mode === "svg" ? this.createFloor() : this.createDummyFloor();

    // Step 2: Load rooms (SVG or GLTF mode)
    const { roomGroup, roomMeshes, roomRegistry } =
      this.config.mode === "gltf"
        ? await this.loadRoomsFromGLTF()
        : await this.loadRoomsFromSVG();

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
   * Create floor base geometry (SVG mode only)
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
   * Create dummy invisible floor (GLTF mode - model has its own floor)
   */
  private createDummyFloor(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({ visible: false });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    console.log("[CampusAssetLoader] Using GLTF floor (no separate floor mesh)");
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
   * Load GLTF model and extract room meshes
   */
  private async loadRoomsFromGLTF(): Promise<{
    roomGroup: THREE.Group;
    roomMeshes: Map<string, THREE.Mesh>;
    roomRegistry: Record<string, { meshKey: string; userData: any }>;
  }> {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      const roomMeshes = new Map<string, THREE.Mesh>();
      const roomRegistry: Record<string, { meshKey: string; userData: any }> = {};

      console.log(`[CampusAssetLoader] Loading GLTF from ${this.config.gltfURL}...`);

      loader.load(
        this.config.gltfURL,
        (gltf) => {
          try {
            const roomGroup = gltf.scene;
            roomGroup.name = "CampusRooms";

            // Traverse the GLTF scene to find all meshes
            roomGroup.traverse((object) => {
              if (object instanceof THREE.Mesh) {
                // Normalize mesh name to use as room key
                const meshName = object.name;
                const normId = meshName.toLowerCase().replace(/[^a-z0-9]/g, "");

                if (normId) {
                  // Store mesh reference
                  roomMeshes.set(normId, object);

                  // Get color for this room
                  const colorHex = this.getRoomColor(normId);

                  // Update mesh properties
                  object.castShadow = true;
                  object.receiveShadow = true;
                  object.userData = {
                    roomKey: normId,
                    roomId: meshName,
                    colorHex,
                  };

                  // Apply material from registry if needed
                  // (You can customize this based on your material strategy)
                  if (this.materialRegistry) {
                    try {
                      const material = this.materialRegistry.create("roomBase", {
                        color: colorHex,
                        transparent: true,
                        opacity: 0.95,
                        roughness: 0.5,
                        metalness: 0.35,
                        roomKey: normId,
                      });
                      object.material = material;
                    } catch (e) {
                      console.warn(`[CampusAssetLoader] Failed to apply material to ${meshName}:`, e);
                      // Keep existing material from GLTF
                    }
                  }

                  // Add to registry
                  roomRegistry[normId] = {
                    meshKey: normId,
                    userData: object.userData,
                  };

                  console.log(`[CampusAssetLoader] Found room: ${meshName} → ${normId}`);
                }
              }
            });

            console.log(`[CampusAssetLoader] Loaded GLTF with ${roomMeshes.size} room meshes`);
            resolve({ roomGroup, roomMeshes, roomRegistry });
          } catch (e) {
            console.error("[CampusAssetLoader] GLTF processing failed:", e);
            reject(e);
          }
        },
        (progress) => {
          const percent = (progress.loaded / progress.total) * 100;
          console.log(`[CampusAssetLoader] Loading GLTF: ${percent.toFixed(1)}%`);
        },
        (err) => {
          console.error("[CampusAssetLoader] GLTF load failed:", err);
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
