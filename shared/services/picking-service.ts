/**
 * PickingService — Classroom Selection via CPU Raycasting
 *
 * Simple, robust picking for ~30 classrooms.
 * Tier 1 MVP: CPU-side THREE.Raycaster on room mesh shells.
 * Scales well up to ~200 objects before considering GPU upgrade (Tier 2).
 *
 * Usage:
 *   const picking = new PickingService(camera, roomMeshes);
 *   const result = picking.pick(clientX, clientY);
 *   if (result.hit && result.roomId) {
 *     // Handle picked room
 *   }
 */

import * as THREE from 'three';

export interface PickResult {
  /** Room ID (e.g., 'b.3', 'a.1') or null if no hit */
  roomId: string | null;
  /** Whether raycasting found an intersection */
  hit: boolean;
  /** Optional: world position of intersection */
  worldPosition?: THREE.Vector3;
  /** Optional: which mesh was hit (for debugging) */
  meshIndex?: number;
}

export class PickingService {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private camera: THREE.Camera;
  private roomMeshes: THREE.Object3D[];

  /**
   * @param camera — Camera used for raycasting
   * @param roomMeshes — Array of room mesh objects (should have userData.roomId)
   */
  constructor(camera: THREE.Camera, roomMeshes: THREE.Object3D[]) {
    this.camera = camera;
    this.roomMeshes = roomMeshes;
  }

  /**
   * Pick a room at screen coordinates.
   *
   * @param screenX — Client X coordinate (0 = left edge)
   * @param screenY — Client Y coordinate (0 = top edge)
   * @returns PickResult with roomId or null if no hit
   */
  pick(screenX: number, screenY: number): PickResult {
    const { innerWidth, innerHeight } = window;

    // Convert screen coordinates to normalized device coordinates (NDC)
    this.mouse.x = (screenX / innerWidth) * 2 - 1;
    this.mouse.y = -(screenY / innerHeight) * 2 + 1;

    // Set ray origin and direction from camera through NDC point
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Test intersection against all room meshes
    const intersects = this.raycaster.intersectObjects(this.roomMeshes, true);

    // No intersection
    if (!intersects.length) {
      return { roomId: null, hit: false };
    }

    // Get closest intersection
    const intersection = intersects[0];
    const obj = intersection.object;

    // Extract roomId from mesh userData
    const roomId = (obj.userData?.roomId as string) ?? null;

    return {
      roomId,
      hit: !!roomId,
      worldPosition: intersection.point.clone(),
      meshIndex: this.roomMeshes.indexOf(obj),
    };
  }

  /**
   * Update the camera used for raycasting.
   * Call if camera changes.
   */
  setCamera(camera: THREE.Camera) {
    this.camera = camera;
  }

  /**
   * Update the list of room meshes.
   * Call if room geometry is added/removed.
   */
  setRoomMeshes(meshes: THREE.Object3D[]) {
    this.roomMeshes = meshes;
  }
}
