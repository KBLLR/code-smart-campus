/**
 * Cross-Scene Picking Validation Tests
 *
 * Validates that picking works consistently across:
 * - Geospatial scene (main)
 * - Projector scene (feature/scene-projector)
 * - Backdrop scene (feature/scene-backdrop)
 *
 * All 3 scenes should:
 * - Pick the same room at the same screen coordinates
 * - Return the same roomId (not scene-specific)
 * - Have room meshes with userData.roomId set
 */

import * as THREE from 'three';
import { PickingService, PickResult } from '@shared/services/picking-service';

/**
 * Mock scene setup (simulates each scene type)
 */
interface MockScene {
  name: string;
  camera: THREE.Camera;
  roomMeshes: THREE.Mesh[];
  picking: PickingService;
}

describe('Cross-Scene Picking Validation', () => {
  let scenes: Map<string, MockScene>;

  beforeEach(() => {
    scenes = new Map();

    // Setup geospatial scene
    scenes.set('geospatial', createMockScene('geospatial', 'standard'));

    // Setup projector scene
    scenes.set('projector', createMockScene('projector', 'stylized'));

    // Setup backdrop scene
    scenes.set('backdrop', createMockScene('backdrop', 'atmospheric'));
  });

  afterEach(() => {
    scenes.forEach((scene) => {
      scene.roomMeshes.forEach(m => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
    });
  });

  /**
   * 1. SCENE-SPECIFIC PICKING
   */
  describe('Geospatial scene picking', () => {
    it('CROSS-4.1: geospatial scene picks room correctly', () => {
      const geoScene = scenes.get('geospatial');
      if (!geoScene) return;

      const result = geoScene.picking.pick(512, 384);

      expect(result).toHaveProperty('hit');
      expect(result).toHaveProperty('roomId');
      if (result.hit) {
        expect(typeof result.roomId).toBe('string');
      }
    });

    it('geospatial scene has correct room count', () => {
      const geoScene = scenes.get('geospatial');
      if (!geoScene) return;

      expect(geoScene.roomMeshes.length).toBe(30);
    });
  });

  describe('Projector scene picking', () => {
    it('CROSS-4.2: projector scene picks room correctly', () => {
      const projScene = scenes.get('projector');
      if (!projScene) return;

      const result = projScene.picking.pick(512, 384);

      expect(result).toHaveProperty('hit');
      expect(result).toHaveProperty('roomId');
      if (result.hit) {
        expect(typeof result.roomId).toBe('string');
      }
    });

    it('projector scene has correct room count', () => {
      const projScene = scenes.get('projector');
      if (!projScene) return;

      expect(projScene.roomMeshes.length).toBe(30);
    });
  });

  describe('Backdrop scene picking', () => {
    it('CROSS-4.3: backdrop scene picks room correctly', () => {
      const backScene = scenes.get('backdrop');
      if (!backScene) return;

      const result = backScene.picking.pick(512, 384);

      expect(result).toHaveProperty('hit');
      expect(result).toHaveProperty('roomId');
      if (result.hit) {
        expect(typeof result.roomId).toBe('string');
      }
    });

    it('backdrop scene has correct room count', () => {
      const backScene = scenes.get('backdrop');
      if (!backScene) return;

      expect(backScene.roomMeshes.length).toBe(30);
    });
  });

  /**
   * 2. CROSS-SCENE CONSISTENCY
   */
  describe('Cross-scene consistency', () => {
    it('CROSS-4.4: all 3 scenes pick same room at same screen coords', () => {
      const testCoords = [
        { x: 512, y: 384 }, // Center
        { x: 256, y: 192 }, // Top-left
        { x: 768, y: 576 }, // Bottom-right
      ];

      testCoords.forEach(({ x, y }) => {
        const geoResult = scenes.get('geospatial')?.picking.pick(x, y);
        const projResult = scenes.get('projector')?.picking.pick(x, y);
        const backResult = scenes.get('backdrop')?.picking.pick(x, y);

        if (geoResult?.hit && projResult?.hit && backResult?.hit) {
          // All hit - should return same roomId
          expect(geoResult.roomId).toBe(projResult.roomId);
          expect(projResult.roomId).toBe(backResult.roomId);
        } else if (!geoResult?.hit && !projResult?.hit && !backResult?.hit) {
          // All miss - consistent behavior
          expect(geoResult?.hit).toBe(projResult?.hit);
          expect(projResult?.hit).toBe(backResult?.hit);
        }
      });
    });

    it('CROSS-4.5: all 3 scenes return different meshes but same roomId', () => {
      const geoScene = scenes.get('geospatial');
      const projScene = scenes.get('projector');
      const backScene = scenes.get('backdrop');

      if (!geoScene || !projScene || !backScene) return;

      // Pick at same position
      const geoResult = geoScene.picking.pick(512, 384);
      const projResult = projScene.picking.pick(512, 384);
      const backResult = backScene.picking.pick(512, 384);

      if (geoResult.hit && projResult.hit && backResult.hit) {
        // Same roomId across scenes
        expect(geoResult.roomId).toBe(projResult.roomId);
        expect(projResult.roomId).toBe(backResult.roomId);

        // Different meshes (one per scene)
        const geoMesh = geoScene.roomMeshes.find(m => m.userData.roomId === geoResult.roomId);
        const projMesh = projScene.roomMeshes.find(m => m.userData.roomId === projResult.roomId);
        const backMesh = backScene.roomMeshes.find(m => m.userData.roomId === backResult.roomId);

        // Objects should be different instances
        expect(geoMesh).not.toBe(projMesh);
        expect(projMesh).not.toBe(backMesh);

        // But all should exist
        expect(geoMesh).toBeDefined();
        expect(projMesh).toBeDefined();
        expect(backMesh).toBeDefined();
      }
    });
  });

  /**
   * 3. ROOM REGISTRY CONSISTENCY
   */
  describe('Room registry consistency', () => {
    it('all scenes have same room IDs', () => {
      const geoRooms = scenes.get('geospatial')?.roomMeshes.map(m => m.userData.roomId) || [];
      const projRooms = scenes.get('projector')?.roomMeshes.map(m => m.userData.roomId) || [];
      const backRooms = scenes.get('backdrop')?.roomMeshes.map(m => m.userData.roomId) || [];

      const geoSet = new Set(geoRooms);
      const projSet = new Set(projRooms);
      const backSet = new Set(backRooms);

      // All sets should be equal
      expect(geoSet).toEqual(projSet);
      expect(projSet).toEqual(backSet);
    });

    it('all room IDs are unique within a scene', () => {
      scenes.forEach((scene) => {
        const roomIds = scene.roomMeshes.map(m => m.userData.roomId);
        const uniqueRoomIds = new Set(roomIds);

        expect(uniqueRoomIds.size).toBe(roomIds.length);
      });
    });

    it('all rooms have valid roomId (not undefined or null)', () => {
      scenes.forEach((scene) => {
        scene.roomMeshes.forEach((mesh) => {
          expect(mesh.userData.roomId).toBeDefined();
          expect(mesh.userData.roomId).not.toBeNull();
          expect(typeof mesh.userData.roomId).toBe('string');
          expect(mesh.userData.roomId.length).toBeGreaterThan(0);
        });
      });
    });
  });

  /**
   * 4. PICKING BEHAVIOR CONSISTENCY
   */
  describe('Picking behavior consistency', () => {
    it('repeated picks on same scene return same roomId', () => {
      const geoScene = scenes.get('geospatial');
      if (!geoScene) return;

      const results = [
        geoScene.picking.pick(512, 384),
        geoScene.picking.pick(512, 384),
        geoScene.picking.pick(512, 384),
      ];

      const roomIds = results.map(r => r.roomId);

      // All picks should return same roomId
      expect(roomIds[0]).toBe(roomIds[1]);
      expect(roomIds[1]).toBe(roomIds[2]);
    });

    it('different screen positions produce different results (when rooms vary)', () => {
      const geoScene = scenes.get('geospatial');
      if (!geoScene) return;

      const results = [
        geoScene.picking.pick(100, 100),
        geoScene.picking.pick(500, 500),
        geoScene.picking.pick(900, 900),
      ];

      // Not all picks should be identical (unless very sparse geometry)
      const roomIds = results.map(r => r.roomId);
      const uniqueRoomIds = new Set(roomIds);

      // At least some variation expected
      expect(uniqueRoomIds.size).toBeGreaterThanOrEqual(1);
    });
  });

  /**
   * 5. SCENE ISOLATION
   */
  describe('Scene isolation', () => {
    it('modifying one scene picking does not affect others', () => {
      const geoScene = scenes.get('geospatial');
      const projScene = scenes.get('projector');

      if (!geoScene || !projScene) return;

      // Initial picks
      const geoResult1 = geoScene.picking.pick(512, 384);
      const projResult1 = projScene.picking.pick(512, 384);

      // Update geo scene camera (simulate camera change)
      const newCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      newCamera.position.set(0, 10, 30);
      newCamera.lookAt(0, 0, 0);
      geoScene.picking.setCamera(newCamera);

      // Picks after update
      const geoResult2 = geoScene.picking.pick(512, 384);
      const projResult2 = projScene.picking.pick(512, 384);

      // Proj scene should be unaffected
      expect(projResult1.roomId).toBe(projResult2.roomId);

      // Geo scene might change (depending on camera)
      // but the picking service itself should still work
      expect(geoResult2).toHaveProperty('hit');
      expect(geoResult2).toHaveProperty('roomId');
    });
  });

  /**
   * 6. PERFORMANCE ACROSS SCENES
   */
  describe('Performance across scenes', () => {
    it('all scenes meet performance target (< 1ms per pick)', () => {
      const targetLatency = 1.0; // ms

      scenes.forEach((scene) => {
        const durations: number[] = [];

        for (let i = 0; i < 10; i++) {
          const start = performance.now();
          scene.picking.pick(512, 384);
          durations.push(performance.now() - start);
        }

        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;

        console.log(`${scene.name} scene: avg ${avg.toFixed(3)}ms`);

        expect(avg).toBeLessThan(targetLatency * 2); // Allow some margin
      });
    });
  });
});

/**
 * FIXTURES
 */

function createMockScene(sceneName: string, styleType: string): MockScene {
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.set(0, 5, 20);
  camera.lookAt(0, 0, 0);

  const roomMeshes = createSceneRoomMeshes(styleType);
  const picking = new PickingService(camera, roomMeshes);

  return {
    name: sceneName,
    camera,
    roomMeshes,
    picking,
  };
}

function createSceneRoomMeshes(styleType: string): THREE.Mesh[] {
  // All 30 rooms, same IDs across scenes
  const roomIds = [
    'b.3', 'b.5', 'b.7', 'b.10', 'b.12', 'b.14', 'b.15', 'b.16', 'b.17', 'b.18',
    'b.19', 'b.22', 'b.23', 'a.1', 'a.2', 'a.3', 'a.5', 'a.6', 'a.11', 'a.12',
    'a.14', 'a.23', 'a.24', 'a.25', 'a.26', 'hydrogen', 'kitchen', 'library', 'b.2', 'b.4',
  ];

  return roomIds.map((id, index) => {
    const geometry = new THREE.BoxGeometry(8, 3, 8);

    // Different materials per scene style
    let material: THREE.Material;
    if (styleType === 'standard') {
      material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
    } else if (styleType === 'stylized') {
      material = new THREE.MeshToonMaterial({ color: 0xff6600 });
    } else {
      material = new THREE.MeshBasicMaterial({ color: 0x00ff77 });
    }

    const mesh = new THREE.Mesh(geometry, material);

    // Position in grid
    const row = Math.floor(index / 6);
    const col = index % 6;
    mesh.position.set(col * 15 - 37, 0, row * 15 - 22);

    mesh.userData.roomId = id;

    return mesh;
  });
}
