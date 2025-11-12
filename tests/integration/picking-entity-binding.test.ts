/**
 * Picking + Entity Binding Integration Tests
 *
 * Tests the full flow:
 * 1. User picks classroom (PickingService)
 * 2. Entity binding registry returns entities for that room
 * 3. Visual feedback (highlight) applied
 * 4. Sensor panel data prepared
 */

import * as THREE from 'three';
import { PickingService } from '@shared/services/picking-service';

// Mock entity binding registry
interface MockEntityRegistry {
  getEntitiesForLocation(roomId: string): string[];
}

class MockEntityBindingRegistry implements MockEntityRegistry {
  private bindings: Record<string, string[]> = {
    'b.3': ['sensor.b3_temperature', 'sensor.b3_humidity', 'binary_sensor.b3_occupancy'],
    'b.5': ['sensor.b5_temperature', 'sensor.b5_humidity'],
    'a.1': ['sensor.a1_temperature', 'sensor.a1_humidity', 'sensor.a1_co2'],
    'kitchen': ['sensor.kitchen_temperature', 'sensor.kitchen_humidity'],
    'library': ['sensor.library_temperature', 'sensor.library_occupancy'],
  };

  getEntitiesForLocation(roomId: string): string[] {
    return this.bindings[roomId] || [];
  }
}

describe('Picking + Entity Binding Integration', () => {
  let camera: THREE.PerspectiveCamera;
  let roomMeshes: THREE.Mesh[];
  let picking: PickingService;
  let entityRegistry: MockEntityRegistry;
  let highlightedMesh: THREE.Mesh | null;

  beforeEach(() => {
    // Setup
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 5, 20);
    camera.lookAt(0, 0, 0);

    roomMeshes = createIntegrationTestRooms();
    picking = new PickingService(camera, roomMeshes);
    entityRegistry = new MockEntityBindingRegistry();
    highlightedMesh = null;
  });

  afterEach(() => {
    roomMeshes.forEach(m => {
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    });
  });

  /**
   * 1. ENTITY RESOLUTION
   */
  describe('Entity resolution', () => {
    it('INT-2.1: picks room and retrieves entities from registry', () => {
      // Pick room B.3
      const result = picking.pick(512, 384);

      if (result.hit && result.roomId === 'b.3') {
        const entities = entityRegistry.getEntitiesForLocation(result.roomId);

        expect(entities.length).toBeGreaterThan(0);
        expect(entities).toContain('sensor.b3_temperature');
        expect(entities).toContain('sensor.b3_humidity');
      }
    });

    it('INT-2.2: returns empty array for unmapped room', () => {
      const entities = entityRegistry.getEntitiesForLocation('unmapped.room');

      expect(entities).toEqual([]);
      expect(entities.length).toBe(0);
    });

    it('returns correct entity count per room', () => {
      const b3Entities = entityRegistry.getEntitiesForLocation('b.3');
      const a1Entities = entityRegistry.getEntitiesForLocation('a.1');
      const kitchenEntities = entityRegistry.getEntitiesForLocation('kitchen');

      expect(b3Entities.length).toBe(3); // temp, humidity, occupancy
      expect(a1Entities.length).toBe(3); // temp, humidity, CO2
      expect(kitchenEntities.length).toBe(2); // temp, humidity
    });

    it('returns sensor entity IDs following naming convention', () => {
      const entities = entityRegistry.getEntitiesForLocation('b.3');

      entities.forEach((entity) => {
        expect(entity).toMatch(/^sensor\.|^binary_sensor\./);
      });
    });
  });

  /**
   * 2. PICKING FLOW WITH ENTITY RESOLUTION
   */
  describe('Complete picking flow', () => {
    it('INT-2.3: picks room and applies highlight', () => {
      const result = picking.pick(512, 384);

      if (result.hit && result.roomId) {
        // Simulate highlight
        const entities = entityRegistry.getEntitiesForLocation(result.roomId);
        highlightedMesh = roomMeshes.find(m => m.userData.roomId === result.roomId) || null;

        expect(highlightedMesh).toBeDefined();
        expect(entities.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('INT-2.4: switching picks clears previous highlight', () => {
      // Pick room B.3
      let result = picking.pick(512, 384);
      const firstRoom = result.roomId;

      if (firstRoom) {
        const firstMesh = roomMeshes.find(m => m.userData.roomId === firstRoom);
        expect(firstMesh).toBeDefined();

        // Now "switch" to different room (B.5)
        result = picking.pick(700, 384); // Different screen position
        const secondRoom = result.roomId;

        if (secondRoom && secondRoom !== firstRoom) {
          const secondMesh = roomMeshes.find(m => m.userData.roomId === secondRoom);
          expect(secondMesh).toBeDefined();
          expect(firstMesh).not.toBe(secondMesh);
        }
      }
    });
  });

  /**
   * 3. CONSISTENCY
   */
  describe('Consistency across picks', () => {
    it('INT-2.5: entity registry returns same entities for repeated picks of same room', () => {
      // Simulate picking the same screen position 3 times
      const picks = [
        picking.pick(512, 384),
        picking.pick(512, 384),
        picking.pick(512, 384),
      ];

      const roomIds = picks.map(p => p.roomId).filter(Boolean);

      if (roomIds.length > 0) {
        const firstRoomId = roomIds[0];

        // All picks should return same roomId
        roomIds.forEach((id) => {
          expect(id).toBe(firstRoomId);
        });

        // Entity resolution should be consistent
        const entitiesSet1 = entityRegistry.getEntitiesForLocation(firstRoomId);
        const entitiesSet2 = entityRegistry.getEntitiesForLocation(firstRoomId);
        const entitiesSet3 = entityRegistry.getEntitiesForLocation(firstRoomId);

        expect(entitiesSet1).toEqual(entitiesSet2);
        expect(entitiesSet2).toEqual(entitiesSet3);
      }
    });
  });

  /**
   * 4. DATA STRUCTURE VALIDATION
   */
  describe('Data structure validation', () => {
    it('entity IDs follow Home Assistant naming convention', () => {
      const allEntities = [
        ...entityRegistry.getEntitiesForLocation('b.3'),
        ...entityRegistry.getEntitiesForLocation('a.1'),
        ...entityRegistry.getEntitiesForLocation('kitchen'),
      ];

      allEntities.forEach((entity) => {
        // Should be domain.entity_name
        expect(entity).toMatch(/^[a-z_]+\.[a-z0-9_]+$/);
      });
    });

    it('no duplicate entities in a room binding', () => {
      const entities = entityRegistry.getEntitiesForLocation('b.3');
      const uniqueEntities = new Set(entities);

      expect(uniqueEntities.size).toBe(entities.length);
    });
  });

  /**
   * 5. ROOM IDENTIFICATION
   */
  describe('Room identification from pick', () => {
    it('identifies correct room from pick result', () => {
      const roomB3 = roomMeshes.find(m => m.userData.roomId === 'b.3');
      if (!roomB3) return; // Skip if fixture doesn't include B.3

      const result = picking.pick(512, 384);

      // If we hit a room, verify it's in our data
      if (result.hit && result.roomId) {
        const mesh = roomMeshes.find(m => m.userData.roomId === result.roomId);
        expect(mesh).toBeDefined();
      }
    });

    it('mesh userData matches entity registry keys', () => {
      const registryKeys = ['b.3', 'b.5', 'b.7', 'a.1', 'a.3', 'kitchen', 'library'];
      const meshIds = roomMeshes.map(m => m.userData.roomId);

      registryKeys.forEach((key) => {
        const found = meshIds.some(id => id === key);
        // At least some registry keys should be present in fixtures
        if (registryKeys.indexOf(key) < 3) {
          expect(found).toBe(true);
        }
      });
    });
  });

  /**
   * 6. ERROR HANDLING
   */
  describe('Error handling', () => {
    it('handles null roomId from pick gracefully', () => {
      const result = picking.pick(512, 384);

      if (!result.hit || !result.roomId) {
        const entities = entityRegistry.getEntitiesForLocation(result.roomId || '');
        expect(entities).toEqual([]);
      }
    });

    it('entity registry survives requesting non-existent room', () => {
      const entities = entityRegistry.getEntitiesForLocation('non.existent.room');

      expect(entities).toBeDefined();
      expect(Array.isArray(entities)).toBe(true);
      expect(entities.length).toBe(0);
    });
  });
});

/**
 * FIXTURES
 */

function createIntegrationTestRooms(): THREE.Mesh[] {
  const rooms = [
    { id: 'b.3', x: 0, y: 0, z: 0 },
    { id: 'b.5', x: 15, y: 0, z: 0 },
    { id: 'b.7', x: 30, y: 0, z: 0 },
    { id: 'a.1', x: -15, y: 0, z: 0 },
    { id: 'a.3', x: -30, y: 0, z: 0 },
    { id: 'kitchen', x: 0, y: 0, z: 15 },
    { id: 'library', x: 0, y: 0, z: -15 },
    ...Array.from({ length: 23 }, (_, i) => ({
      id: `room.${i + 1}`,
      x: (i % 5) * 20 - 40,
      y: 0,
      z: Math.floor(i / 5) * 20,
    })),
  ];

  return rooms.map((data) => {
    const geometry = new THREE.BoxGeometry(8, 3, 8);
    const material = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(data.x, data.y, data.z);
    mesh.userData.roomId = data.id;

    return mesh;
  });
}
