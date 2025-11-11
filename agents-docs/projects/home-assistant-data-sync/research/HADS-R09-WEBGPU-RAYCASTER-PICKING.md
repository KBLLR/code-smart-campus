# HADS-R09: WebGPU Raycaster for Classroom Selection & Sensor Display

**Task:** Research Three.js WebGPU alternatives to raycasting for picking (selecting) classrooms in the 3D scene.

**Status:** Research Phase (Pending)
**Priority:** **Critical** — Blocker for user interaction with campus map
**Date Created:** 2025-11-12

---

## Problem Statement

When the renderer switched to WebGPU, Three.js raycaster capability was lost. This breaks the core interaction:

1. User hovers over or clicks on a classroom
2. Scene should highlight that room
3. Sensor data panel should show temperature, occupancy, etc. for that room

**Current State:**
- WebGPU renderer active
- Raycasting unavailable
- Classroom selection broken
- Sensor data overlay cannot be triggered

---

## Context

### What We Had (WebGL Era)
```javascript
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(roomMeshes);

  if (intersects.length > 0) {
    const room = intersects[0].object;
    highlightRoom(room);
    showSensorData(room.roomId);
  }
});
```

### What We Need (WebGPU Era)
- Pick (select) rooms by mouse position
- No Three.js raycaster available
- Must use WebGPU-native or alternative approach
- Same functionality: detect which room is under cursor

---

## Root Cause

Three.js WebGPU renderer has limitations:
- No direct raycasting support (raycaster uses WebGL internals)
- WebGPU is lower-level, requires different picking strategy
- Potential workarounds exist but require custom implementation

---

## Proposed Solutions

### Option A: Compute Shader Picking (Native WebGPU)

**Concept:** Use a compute shader to test ray-mesh intersections on GPU.

**Pros:**
- Native WebGPU, leverage GPU
- Parallel ray testing (fast for many objects)
- Modern approach

**Cons:**
- High implementation complexity
- Requires understanding compute shaders
- Overkill for classroom count (30 rooms)
- Steep learning curve

**Sketch:**
```wgsl
// Compute shader pseudo-code
@compute @workgroup_size(256)
fn raycast_rooms(@builtin(global_invocation_id) id: vec3<u32>) {
  let room_id = id.x;
  if (room_id >= room_count) { return; }

  let room = rooms[room_id];
  let intersection = ray_box_intersection(ray, room.bounds);

  if (intersection.hit) {
    atomicMin(&closest_room_id, room_id);
  }
}
```

**References:**
- WebGPU Compute Shader Tutorial
- GPU Gems (ray-box intersection)

---

### Option B: readPixels Picking (GPU Fallback)

**Concept:** Render rooms to offscreen texture with unique colors, read pixel at cursor.

**Pros:**
- Works with existing Three.js WebGPU renderer
- Simple to implement
- No compute shader needed
- Fast for picking (one readPixels call)

**Cons:**
- Requires extra render pass
- readPixels is slow (GPU→CPU sync)
- Only works if room has unique pixel color

**Sketch:**
```javascript
// Render rooms with unique ID colors to offscreen texture
const pickTexture = new THREE.WebGPUTexture(...);
const pickRenderer = new THREE.WebGPURenderer({ renderTarget: pickTexture });

// On mouse move
const pixel = pickTexture.readPixels(mouseX, mouseY);
const roomId = decodeRoomIdFromPixel(pixel);
highlightRoom(roomId);
```

**References:**
- Three.js Object Picking (WebGL example, port to WebGPU)
- GPU Readback Best Practices

---

### Option C: Manual Hit Test (CPU Fallback)

**Concept:** Manually test ray against bounding boxes or triangle meshes (CPU-side).

**Pros:**
- No GPU special cases
- Works with any renderer
- Portable, no WebGPU-specific code

**Cons:**
- CPU-bound, slower than GPU
- Requires mesh data on CPU
- Scales poorly with geometry complexity

**Sketch:**
```javascript
// Manual bounding box intersection
function pickRoom(mouseX, mouseY, camera, rooms) {
  const ray = screenToWorldRay(mouseX, mouseY, camera);

  let closest = null;
  let closestDistance = Infinity;

  for (const room of rooms) {
    const distance = rayBoxIntersect(ray, room.boundingBox);
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = room;
    }
  }

  return closest;
}
```

**References:**
- Ray-Box Intersection (math)
- CPU Picking in Three.js (pre-raycaster)

---

### Option D: Canvas 2D Overlay Picking (Hybrid)

**Concept:** Maintain separate 2D canvas overlay mapping mouse to rooms.

**Pros:**
- Simplest to implement
- No GPU overhead
- Works for any renderer
- Can use pre-rendered room geometry map

**Cons:**
- Decoupled from 3D renderer
- Requires manual sync
- Breaks if camera view changes
- Not truly 3D aware

**Sketch:**
```javascript
// 2D canvas with room regions mapped
const canvas = document.getElementById('picking-overlay');
const ctx = canvas.getContext('2d');

// Paint each room with unique color
rooms.forEach(room => {
  const path2D = screenSpacePolygon(room.vertices, camera);
  ctx.fillStyle = room.debugColor;
  ctx.fill(path2D);
});

// On click
canvas.addEventListener('click', (e) => {
  const pixel = ctx.getImageData(e.offsetX, e.offsetY, 1, 1).data;
  const roomId = decodeRoomColor(pixel);
  showSensorData(roomId);
});
```

**References:**
- Canvas Picking Technique
- 2D-to-3D Mapping

---

## Recommendation: Option B (readPixels)

**Why:**
1. **Works now** — Integrates with existing WebGPU renderer
2. **Simple** — Minimal code, no compute shaders
3. **Acceptable performance** — 30 rooms ≈ one readPixels per frame (not a bottleneck)
4. **Flexible** — Can upgrade to compute shader later if needed
5. **Portable** — Technique reusable for other picking needs

**Implementation Timeline:**
- **Week 1:** Prototype readPixels picking on offscreen texture
- **Week 2:** Integrate with classroom highlight + sensor display
- **Week 3:** Optimize readPixels (batch reads, throttle frequency)

---

## Validation Strategy (Testing)

### Test 1: Pick Accuracy
```typescript
it('correctly picks classroom under cursor', () => {
  const mouseX = 512, mouseY = 384; // Center of screen
  const pickedRoom = pickRoom(mouseX, mouseY);

  // Verify picked room matches camera raycast
  const expected = raycastGeometry(mouseX, mouseY, camera);
  expect(pickedRoom.id).toBe(expected.id);
});
```

### Test 2: Performance
```typescript
it('picks room in < 5ms', () => {
  const start = performance.now();
  const room = pickRoom(500, 300);
  const duration = performance.now() - start;

  expect(duration).toBeLessThan(5);
});
```

### Test 3: Cross-Scene Consistency
```typescript
it('all three scenes return same picked room', () => {
  const geoPicked = geospatialScene.pickRoom(500, 300);
  const projPicked = projectorScene.pickRoom(500, 300);
  const backPicked = backdropScene.pickRoom(500, 300);

  expect(geoPicked.id).toBe(projPicked.id);
  expect(projPicked.id).toBe(backPicked.id);
});
```

---

## Integration Points

### With HADS Entity Binding

Once picking works:
1. User picks room A in 3D scene
2. System queries entity binding registry for room A's entities
3. Fetch sensor data from HA (`sensor.a1_temperature`, etc.)
4. Display sensor panel with live data

**Example Flow:**
```typescript
// In scene interaction handler
function onRoomPicked(roomId: string) {
  // Step 1: Pick classroom
  const room = pickRoom(mouseX, mouseY);

  // Step 2: Resolve entity bindings
  const entities = entityRegistry.getEntitiesForLocation(room.id);
  // → ['sensor.a1_temperature', 'sensor.a1_humidity', ...]

  // Step 3: Fetch HA state
  const sensorData = await haSocket.getStates(entities);

  // Step 4: Display sensor overlay
  displaySensorPanel(room.name, sensorData);
}
```

---

## Related Tasks

| Task | Dependency |
|------|-----------|
| HADS-R02 | Entity binding (COMPLETE) |
| HADS-R03 | Observer pattern (needed for live updates) |
| HADS-R09 | **WebGPU picking (THIS TASK)** |
| Scene UI | Sensor panel component (depends on HADS-R09) |

---

## Files to Create/Modify

**New:**
- `shared/services/picking-service.ts` — Picking logic (Option B)
- `shared/services/picking.shader.wgsl` — Optional compute shader (Option A)
- `src/ui/components/molecules/SensorPanel.ts` — Display picked room data
- Tests: `tests/picking.test.ts`

**Modify:**
- `src/scene.js` — Add picking event listener
- `shared/ui/SceneManager.ts` — Integrate picking + entity binding
- `src/main.js` — Initialize sensor panel

---

## Open Questions

### Q1: Which picking option?
- **Assumption:** Option B (readPixels) is simplest.
- **To validate:** Benchmark readPixels vs. compute shader on 30 rooms.
- **Action:** If readPixels shows < 2ms latency, go with it. Otherwise, evaluate compute shader.

### Q2: Real-time vs. On-Demand?
- **Assumption:** Pick on mousemove (real-time highlight), not just click.
- **To validate:** Check if 60 FPS picking is feasible.
- **Action:** If FPS drops, throttle picking to every N frames.

### Q3: Multi-room selection?
- **Assumption:** Single room selection for MVP.
- **To validate:** Do scenes ever need to show multiple rooms simultaneously?
- **Action:** If yes, extend picking to return array of intersected rooms.

---

## References & Resources

### Three.js
- [Three.js Object Picking (WebGL approach, for reference)](https://threejs.org/examples/?q=pick)
- [WebGPU Renderer Documentation](https://threejs.org/docs/#examples/en/renderers/WebGPURenderer)

### WebGPU
- [WebGPU Specification (W3C)](https://www.w3.org/TR/webgpu/)
- [WebGPU Compute Shaders](https://www.w3.org/TR/webgpu/#compute-shader)
- [Compute Shader Picking Example](https://github.com/toji/webgpu-gltf-viewer) (reference)

### Mathematics
- [Ray-Box Intersection (Ryan Juckett)](http://www.3dkingdoms.com/weekly/weekly.php?a=21)
- [Ray-Triangle Intersection (Möller-Trumbore)](https://en.wikipedia.org/wiki/M%C3%B6ller%E2%80%93Trumbore_intersection_algorithm)

### Performance
- [GPU Readback Best Practices (Chromium Blog)](https://chromium.googlesource.com/chromium/src/+/main/docs/gpu_data_transfer.md)
- [WebGPU Performance Considerations](https://gpuweb.github.io/gpuweb/#security)

---

## Success Criteria

- ✅ Picking works for all 30 classrooms
- ✅ < 5ms latency per pick
- ✅ Works across geospatial, projector, backdrop scenes
- ✅ Integrates with entity binding (HADS-R02)
- ✅ Sensor panel displays correctly when room is picked
- ✅ Tests pass (accuracy, performance, cross-scene)

---

## Next Actions (for Next Agent)

1. **Evaluate options A–D** against project constraints
   - Prototype Option B (readPixels) first
   - Benchmark if performance is acceptable
   - Fall back to Option C (CPU hit test) if readPixels is slow

2. **Implement picking service** (`picking-service.ts`)
   - Handle mouse events
   - Return picked room ID
   - Subscribe to camera changes

3. **Integrate with entity binding**
   - When room picked, fetch entities via HADS-R02 registry
   - Query HA for sensor data
   - Display sensor panel

4. **Test across all scenes**
   - Geospatial (main scene)
   - Projector branch
   - Backdrop branch

5. **Performance validation**
   - Measure readPixels latency
   - Ensure 60 FPS interaction
   - Optimize if needed

---

## Session Note

Added as blocking task for classroom selection and sensor data display. Without picking, the campus visualization is view-only. Picking enables the interactive sensor monitoring use case—the core of the "sync campus data into the view" requirement.
