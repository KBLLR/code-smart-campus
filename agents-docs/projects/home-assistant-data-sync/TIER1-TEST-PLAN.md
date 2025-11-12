# HADS-R09 Tier 1: Test Plan

**Status:** Ready to implement
**Scope:** PickingService unit tests + integration tests
**Framework:** Jest + Three.js test utilities
**Coverage Target:** > 90% PickingService, > 80% integration layer

---

## Test Categories

### 1. PickingService Unit Tests
**File:** `tests/services/picking-service.test.ts`

| Test ID | Description | Priority |
|---------|-------------|----------|
| PS-1.1 | Constructor initializes with camera and meshes | Critical |
| PS-1.2 | Pick returns null hit when no intersection | Critical |
| PS-1.3 | Pick returns roomId for intersected mesh | Critical |
| PS-1.4 | Pick correctly handles multiple overlapping meshes (returns closest) | Critical |
| PS-1.5 | Pick returns correct worldPosition on intersection | High |
| PS-1.6 | NDC conversion correct for all screen corners | High |
| PS-1.7 | setCamera() updates camera without error | Medium |
| PS-1.8 | setRoomMeshes() updates mesh array without error | Medium |

---

### 2. Integration Tests (Picking → Entity Binding)
**File:** `tests/integration/picking-entity-binding.test.ts`

| Test ID | Description | Priority |
|---------|-------------|----------|
| INT-2.1 | Pick room → entity registry returns entities for that room | Critical |
| INT-2.2 | Pick unmapped room → entity registry returns empty array | High |
| INT-2.3 | Pick room A → highlight applied to correct mesh | High |
| INT-2.4 | Pick different room B → previous highlight cleared, B highlighted | High |
| INT-2.5 | Entity binding returns same entities across repeated picks | Medium |

---

### 3. Performance Tests
**File:** `tests/performance/picking-performance.test.ts`

| Test ID | Description | Target | Priority |
|---------|-------------|--------|----------|
| PERF-3.1 | Single pick latency (30 meshes) | < 1ms | Critical |
| PERF-3.2 | 100 consecutive picks, average latency | < 5ms avg | Critical |
| PERF-3.3 | 100 consecutive picks, max latency | < 10ms max | High |
| PERF-3.4 | Memory overhead of raycaster + 30 meshes | < 5MB | Medium |
| PERF-3.5 | No memory leaks over 1000 picks | Stable heap | High |

---

### 4. Cross-Scene Validation
**File:** `tests/scenes/picking-cross-scene.test.ts`

| Test ID | Description | Priority |
|---------|-------------|----------|
| CROSS-4.1 | Geospatial scene picks room correctly | Critical |
| CROSS-4.2 | Projector scene picks room correctly | Critical |
| CROSS-4.3 | Backdrop scene picks room correctly | Critical |
| CROSS-4.4 | All 3 scenes pick same room at same screen coords | Critical |
| CROSS-4.5 | All 3 scenes return different meshes but same roomId | High |

---

### 5. Edge Cases
**File:** `tests/services/picking-service.test.ts` (edge case section)

| Test ID | Description | Priority |
|---------|-------------|----------|
| EDGE-5.1 | Pick outside visible area → null hit | High |
| EDGE-5.2 | Pick with null camera → error or graceful fallback | High |
| EDGE-5.3 | Pick with empty mesh array → null hit | High |
| EDGE-5.4 | Mesh without userData.roomId → not returned | High |
| EDGE-5.5 | Camera moved after initialization → still works | Medium |

---

## Test Data & Fixtures

### Room Mesh Fixtures
```typescript
// 30 room meshes with realistic positions/scales
const roomFixtures = [
  { id: 'b.3', position: [0, 0, 0], scale: [10, 3, 10] },
  { id: 'b.5', position: [20, 0, 0], scale: [10, 3, 10] },
  { id: 'a.1', position: [-20, 0, 0], scale: [15, 3, 15] },
  // ... 27 more rooms
];
```

### Mock HA Data
```typescript
const mockSensorData = {
  'sensor.b3_temperature': { state: '22.5', attributes: { unit_of_measurement: '°C' } },
  'sensor.b3_humidity': { state: '45', attributes: { unit_of_measurement: '%' } },
  'binary_sensor.b3_occupancy': { state: 'on' },
};
```

---

## Running Tests

```bash
# All tests
npm test

# Specific test suite
npm test -- picking-service.test.ts
npm test -- picking-performance.test.ts

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Performance tests only (verbose)
npm test -- picking-performance.test.ts --verbose
```

---

## Success Criteria

- ✅ All Critical tests pass
- ✅ > 80% High priority tests pass
- ✅ Performance: avg pick < 1ms, max pick < 10ms
- ✅ No memory leaks over 1000 picks
- ✅ Cross-scene consistency validated
- ✅ Coverage > 90% (PickingService), > 80% (integration)

---

## Blockers / Assumptions

1. **Three.js version:** Assumes r128+
2. **WebGPU renderer available:** Tests assume WebGPURenderer is initialized
3. **Entity binding registry working:** Tests mock registry, assumes HADS-R02 in place
4. **Jest environment:** Assumes jsdom or three.js test utilities available

---

## Next Steps After Tests Pass

1. Wire picking into live scene (`src/main.js`)
2. Implement SensorPanel component
3. Add room highlight visual
4. Measure performance on M3 (real hardware)
5. Test on all 3 scene branches
6. Merge to main
