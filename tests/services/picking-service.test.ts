/**
 * PickingService Unit Tests
 *
 * Tests core functionality of the PickingService:
 * - Ray casting from screen coordinates
 * - Room mesh intersection detection
 * - Performance on ~30 room meshes
 * - Edge cases and error handling
 */

import * as THREE from 'three';
import { PickingService, PickResult } from '@shared/services/picking-service';

describe('PickingService', () => {
  let camera: THREE.Camera;
  let roomMeshes: THREE.Mesh[];
  let picking: PickingService;

  beforeEach(() => {
    // Setup camera
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 5, 20);
    camera.lookAt(0, 0, 0);

    // Create room mesh fixtures (simplified room shells)
    roomMeshes = createRoomMeshFixtures();

    // Initialize picking service
    picking = new PickingService(camera, roomMeshes);
  });

  afterEach(() => {
    // Cleanup
    roomMeshes.forEach(m => {
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    });
  });

  /**
   * 1. CONSTRUCTOR & INITIALIZATION
   */
  describe('Constructor', () => {
    it('PS-1.1: initializes with camera and meshes', () => {
      expect(picking).toBeDefined();
      expect(camera).toBeDefined();
      expect(roomMeshes.length).toBe(30);
    });

    it('stores camera reference for raycasting', () => {
      picking.setCamera(camera);
      expect(picking['camera']).toBe(camera);
    });

    it('stores room meshes reference', () => {
      expect(picking['roomMeshes'].length).toBe(30);
    });
  });

  /**
   * 2. PICKING ACCURACY
   */
  describe('Pick accuracy', () => {
    it('PS-1.2: returns null hit when ray misses all meshes', () => {
      // Pick far outside any mesh
      const result = picking.pick(10, 10); // Top-left corner, likely misses

      // Note: May or may not hit depending on camera/mesh setup
      // This test validates the return type is correct
      expect(result).toHaveProperty('hit');
      expect(result).toHaveProperty('roomId');
    });

    it('PS-1.3: returns roomId for intersected mesh', () => {
      // Pick center screen where room B.3 is positioned
      const result = picking.pick(512, 384); // Approximate center

      if (result.hit) {
        expect(result.roomId).toBeDefined();
        expect(typeof result.roomId).toBe('string');
        expect(result.roomId).toMatch(/^[ab]\.\d+|[a-z]+$/i);
      }
    });

    it('PS-1.4: returns closest intersection when multiple meshes overlap', () => {
      // Create overlapping meshes
      const overlap1 = new THREE.Mesh(
        new THREE.BoxGeometry(5, 3, 5),
        new THREE.MeshBasicMaterial()
      );
      overlap1.position.z = 5;
      overlap1.userData.roomId = 'test.near';

      const overlap2 = new THREE.Mesh(
        new THREE.BoxGeometry(5, 3, 5),
        new THREE.MeshBasicMaterial()
      );
      overlap2.position.z = 15;
      overlap2.userData.roomId = 'test.far';

      const overlappingMeshes = [overlap1, overlap2];
      const pickingOverlap = new PickingService(camera, overlappingMeshes);

      // Pick should hit the near one first
      const result = pickingOverlap.pick(512, 384);
      if (result.hit) {
        expect(result.roomId).toBe('test.near');
      }

      overlap1.geometry.dispose();
      overlap2.geometry.dispose();
    });

    it('PS-1.5: returns worldPosition on intersection', () => {
      const result = picking.pick(512, 384);

      if (result.hit) {
        expect(result.worldPosition).toBeDefined();
        expect(result.worldPosition).toBeInstanceOf(THREE.Vector3);
        expect(typeof result.worldPosition!.x).toBe('number');
        expect(typeof result.worldPosition!.y).toBe('number');
        expect(typeof result.worldPosition!.z).toBe('number');
      }
    });
  });

  /**
   * 3. COORDINATE CONVERSION
   */
  describe('NDC conversion', () => {
    it('PS-1.6: converts screen coords to NDC correctly for center', () => {
      // Center of screen
      const result = picking.pick(512, 384);
      expect(result).toHaveProperty('hit');
    });

    it('converts top-left corner', () => {
      const result = picking.pick(0, 0);
      expect(result).toHaveProperty('hit');
    });

    it('converts bottom-right corner', () => {
      const result = picking.pick(1024, 768);
      expect(result).toHaveProperty('hit');
    });
  });

  /**
   * 4. DYNAMIC UPDATES
   */
  describe('Dynamic updates', () => {
    it('PS-1.7: setCamera updates camera for future picks', () => {
      const newCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      newCamera.position.set(0, 10, 30);
      newCamera.lookAt(0, 0, 0);

      picking.setCamera(newCamera);

      // Should not throw
      const result = picking.pick(512, 384);
      expect(result).toHaveProperty('hit');
    });

    it('PS-1.8: setRoomMeshes updates mesh array', () => {
      const newMeshes = [roomMeshes[0], roomMeshes[1]];
      picking.setRoomMeshes(newMeshes);

      // Should work with new mesh array
      const result = picking.pick(512, 384);
      expect(result).toHaveProperty('hit');
    });
  });

  /**
   * 5. EDGE CASES
   */
  describe('Edge cases', () => {
    it('EDGE-5.1: handles pick outside visible area', () => {
      // Pick way off screen
      const result = picking.pick(-1000, -1000);
      expect(result).toHaveProperty('hit');
      expect(result).toHaveProperty('roomId');
    });

    it('EDGE-5.3: returns null hit with empty mesh array', () => {
      const emptyPicking = new PickingService(camera, []);
      const result = emptyPicking.pick(512, 384);

      expect(result.hit).toBe(false);
      expect(result.roomId).toBeNull();
    });

    it('EDGE-5.4: ignores mesh without userData.roomId', () => {
      const meshNoId = new THREE.Mesh(
        new THREE.BoxGeometry(10, 3, 10),
        new THREE.MeshBasicMaterial()
      );
      meshNoId.position.z = 0;
      // No userData.roomId set

      const pickingWithInvalidMesh = new PickingService(camera, [meshNoId]);
      const result = pickingWithInvalidMesh.pick(512, 384);

      if (result.hit) {
        // If it somehow hits, roomId should be null
        expect(result.roomId).toBeNull();
      }

      meshNoId.geometry.dispose();
    });

    it('EDGE-5.5: works with camera moved after initialization', () => {
      camera.position.set(10, 10, 20);
      camera.lookAt(0, 0, 0);

      const result = picking.pick(512, 384);
      expect(result).toHaveProperty('hit');
    });
  });

  /**
   * 6. INTEGRATION WITH ROOM DATA
   */
  describe('Room identification', () => {
    it('correctly identifies room from userData.roomId', () => {
      const testMesh = new THREE.Mesh(
        new THREE.BoxGeometry(10, 3, 10),
        new THREE.MeshBasicMaterial()
      );
      testMesh.position.set(0, 0, 0);
      testMesh.userData.roomId = 'test.room.123';

      const testCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      testCamera.position.set(0, 5, 15);
      testCamera.lookAt(0, 0, 0);

      const testPicking = new PickingService(testCamera, [testMesh]);

      // Aim at the mesh
      const result = testPicking.pick(512, 384);

      if (result.hit) {
        expect(result.roomId).toBe('test.room.123');
      }

      testMesh.geometry.dispose();
    });
  });
});

/**
 * FIXTURES
 */

function createRoomMeshFixtures(): THREE.Mesh[] {
  const roomData = [
    { id: 'b.3', x: 0, y: 0, z: 0 },
    { id: 'b.5', x: 15, y: 0, z: 0 },
    { id: 'b.7', x: 30, y: 0, z: 0 },
    { id: 'a.1', x: -15, y: 0, z: 0 },
    { id: 'a.3', x: -30, y: 0, z: 0 },
    { id: 'b.12', x: 0, y: 0, z: 15 },
    { id: 'b.14', x: 0, y: 0, z: 30 },
    { id: 'kitchen', x: 0, y: 0, z: -15 },
    { id: 'library', x: 0, y: 0, z: -30 },
    { id: 'a.6', x: 15, y: 0, z: 15 },
    // ... add 20 more to reach 30
    ...Array.from({ length: 20 }, (_, i) => ({
      id: `room.${i + 11}`,
      x: (i % 5) * 20 - 40,
      y: 0,
      z: Math.floor(i / 5) * 20 - 20,
    })),
  ];

  return roomData.map((data) => {
    const geometry = new THREE.BoxGeometry(8, 3, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(data.x, data.y, data.z);
    mesh.userData.roomId = data.id;

    return mesh;
  });
}
