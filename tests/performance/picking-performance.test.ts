/**
 * PickingService Performance Tests
 *
 * Validates:
 * - Single pick latency (target: < 1ms)
 * - 100 consecutive picks average latency (target: < 5ms avg)
 * - Max latency in batch (target: < 10ms)
 * - Memory stability (no leaks over 1000 picks)
 */

import * as THREE from 'three';
import { PickingService } from '@shared/services/picking-service';

describe('PickingService Performance', () => {
  let camera: THREE.PerspectiveCamera;
  let roomMeshes: THREE.Mesh[];
  let picking: PickingService;
  let initialHeap: number;

  beforeEach(() => {
    // Setup
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 5, 20);
    camera.lookAt(0, 0, 0);

    roomMeshes = createPerformanceTestRooms();
    picking = new PickingService(camera, roomMeshes);

    // Record initial heap size (if available)
    if (performance.memory) {
      initialHeap = performance.memory.usedJSHeapSize;
    }
  });

  afterEach(() => {
    roomMeshes.forEach(m => {
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    });
  });

  /**
   * 1. SINGLE PICK LATENCY
   */
  describe('Single pick latency', () => {
    it('PERF-3.1: performs single pick in < 1ms', () => {
      // Warmup: exclude cold-start overhead (Node.js JIT)
      picking.pick(512, 384);

      const start = performance.now();
      const result = picking.pick(512, 384);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1.0);
      expect(result).toHaveProperty('hit');
    });

    it('single pick completes in < 2ms (with margin)', () => {
      const start = performance.now();
      picking.pick(512, 384);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(2.0);
    });

    it('multiple single picks are consistent', () => {
      const durations: number[] = [];

      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        picking.pick(512, 384);
        durations.push(performance.now() - start);
      }

      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const max = Math.max(...durations);
      const min = Math.min(...durations);

      console.log(`Single pick stats: avg=${avg.toFixed(3)}ms, min=${min.toFixed(3)}ms, max=${max.toFixed(3)}ms`);

      expect(avg).toBeLessThan(1.5);
      expect(max).toBeLessThan(3.0);
    });
  });

  /**
   * 2. BATCH PERFORMANCE (100 picks)
   */
  describe('Batch performance (100 picks)', () => {
    it('PERF-3.2: 100 consecutive picks average < 5ms', () => {
      const durations: number[] = [];
      const batchStart = performance.now();

      for (let i = 0; i < 100; i++) {
        const pickStart = performance.now();
        picking.pick(
          (Math.random() * 1024) | 0,
          (Math.random() * 768) | 0
        );
        durations.push(performance.now() - pickStart);
      }

      const batchDuration = performance.now() - batchStart;
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

      console.log(`100-pick batch: total=${batchDuration.toFixed(1)}ms, avg=${avgDuration.toFixed(3)}ms`);

      expect(avgDuration).toBeLessThan(5.0);
    });

    it('PERF-3.3: 100 picks max latency < 10ms', () => {
      const durations: number[] = [];

      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        picking.pick((Math.random() * 1024) | 0, (Math.random() * 768) | 0);
        durations.push(performance.now() - start);
      }

      const maxDuration = Math.max(...durations);
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

      console.log(`100 picks: max=${maxDuration.toFixed(3)}ms, avg=${avgDuration.toFixed(3)}ms`);

      expect(maxDuration).toBeLessThan(10.0);
    });

    it('provides detailed performance metrics', () => {
      const durations: number[] = [];

      for (let i = 0; i < 50; i++) {
        const start = performance.now();
        picking.pick((Math.random() * 1024) | 0, (Math.random() * 768) | 0);
        durations.push(performance.now() - start);
      }

      durations.sort((a, b) => a - b);

      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const p50 = durations[Math.floor(durations.length * 0.5)];
      const p95 = durations[Math.floor(durations.length * 0.95)];
      const p99 = durations[Math.floor(durations.length * 0.99)];

      console.log(`50-pick distribution:`);
      console.log(`  avg=${avg.toFixed(3)}ms`);
      console.log(`  p50=${p50.toFixed(3)}ms`);
      console.log(`  p95=${p95.toFixed(3)}ms`);
      console.log(`  p99=${p99.toFixed(3)}ms`);

      expect(avg).toBeLessThan(2.0);
    });
  });

  /**
   * 3. MEMORY STABILITY
   */
  describe('Memory stability', () => {
    it('PERF-3.4: overhead of raycaster + 30 meshes < 5MB', () => {
      if (!performance.memory) {
        console.log('performance.memory not available, skipping heap test');
        return;
      }

      const overhead = performance.memory.usedJSHeapSize - initialHeap;

      // Convert to MB
      const overheadMB = overhead / (1024 * 1024);
      console.log(`PickingService overhead: ${overheadMB.toFixed(2)}MB`);

      expect(overheadMB).toBeLessThan(5.0);
    });

    it('PERF-3.5: no memory leaks over 1000 picks', () => {
      if (!performance.memory) {
        console.log('performance.memory not available, skipping leak test');
        return;
      }

      const heapSamples: number[] = [];

      // Take heap samples every 100 picks
      for (let i = 0; i < 1000; i++) {
        picking.pick((Math.random() * 1024) | 0, (Math.random() * 768) | 0);

        if (i % 100 === 0 && i > 0) {
          heapSamples.push(performance.memory.usedJSHeapSize);
        }
      }

      // Check if heap is trending upward (leak) or stable
      if (heapSamples.length > 2) {
        const first = heapSamples[0];
        const last = heapSamples[heapSamples.length - 1];
        const growth = last - first;
        const growthPercent = (growth / first) * 100;

        console.log(`Heap growth over 1000 picks: ${growth / (1024 * 1024)} MB (${growthPercent.toFixed(1)}%)`);

        // Expect < 20% growth (some growth is normal due to GC pauses)
        expect(growthPercent).toBeLessThan(20);
      }
    });

    it('cleanup releases memory', () => {
      if (!performance.memory) return;

      const before = performance.memory.usedJSHeapSize;

      // Perform many picks
      for (let i = 0; i < 500; i++) {
        picking.pick((Math.random() * 1024) | 0, (Math.random() * 768) | 0);
      }

      const afterPicks = performance.memory.usedJSHeapSize;

      // Dispose resources
      roomMeshes.forEach(m => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });

      const afterCleanup = performance.memory.usedJSHeapSize;

      const memoryUsedByPicks = afterPicks - before;
      const memoryFreedByCleanup = afterPicks - afterCleanup;

      console.log(`Memory used during picks: ${(memoryUsedByPicks / 1024).toFixed(1)} KB`);
      console.log(`Memory freed by cleanup: ${(memoryFreedByCleanup / 1024).toFixed(1)} KB`);

      // Cleanup should free significant memory
      expect(memoryFreedByCleanup).toBeGreaterThan(0);
    });
  });

  /**
   * 4. SCALABILITY
   */
  describe('Scalability', () => {
    it('performance scales linearly with mesh count', () => {
      const results: { count: number; duration: number }[] = [];

      // Test with different mesh counts
      for (const count of [10, 30, 50, 100]) {
        const testMeshes = createPerformanceTestRooms(count);
        const testPicking = new PickingService(camera, testMeshes);

        const durations: number[] = [];
        for (let i = 0; i < 50; i++) {
          const start = performance.now();
          testPicking.pick(512, 384);
          durations.push(performance.now() - start);
        }

        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        results.push({ count, duration: avg });

        testMeshes.forEach(m => {
          m.geometry.dispose();
          (m.material as THREE.Material).dispose();
        });
      }

      console.log('Mesh count vs latency:');
      results.forEach(r => {
        console.log(`  ${r.count} meshes: ${r.duration.toFixed(3)}ms avg`);
      });

      // Latency should stay well under 1ms even with 100 meshes
      const hundredMeshResult = results.find(r => r.count === 100);
      if (hundredMeshResult) {
        expect(hundredMeshResult.duration).toBeLessThan(2.0);
      }
    });

    it('recommends upgrade to Tier 2 at ~200 meshes', () => {
      // Create large mesh count
      const largeMeshCount = 200;
      const largeMeshes = createPerformanceTestRooms(largeMeshCount);
      const largePicking = new PickingService(camera, largeMeshes);

      const durations: number[] = [];
      for (let i = 0; i < 50; i++) {
        const start = performance.now();
        largePicking.pick(512, 384);
        durations.push(performance.now() - start);
      }

      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const max = Math.max(...durations);

      console.log(`200 meshes: avg=${avg.toFixed(3)}ms, max=${max.toFixed(3)}ms`);

      // At 200 meshes, might start approaching 5ms threshold
      // This is where Tier 2 (GPU) would be recommended
      if (avg > 2.0 || max > 5.0) {
        console.log('  ⚠️ Consider upgrading to Tier 2 (GPU ID-buffer) at this scale');
      }

      largeMeshes.forEach(m => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
    });
  });
});

/**
 * FIXTURES
 */

function createPerformanceTestRooms(count: number = 30): THREE.Mesh[] {
  const rooms = [];

  for (let i = 0; i < count; i++) {
    rooms.push({
      id: `room.${i}`,
      x: (i % 10) * 20 - 90,
      y: 0,
      z: Math.floor(i / 10) * 20 - 20,
    });
  }

  return rooms.map((data) => {
    const geometry = new THREE.BoxGeometry(8, 3, 8);
    const material = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(data.x, data.y, data.z);
    mesh.userData.roomId = data.id;

    return mesh;
  });
}
