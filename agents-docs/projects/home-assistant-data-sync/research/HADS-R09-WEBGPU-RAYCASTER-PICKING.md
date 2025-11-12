# HADS-R09: Classroom Picking Strategy for WebGPU Renderer

**Task:** Select and implement a picking (object selection) strategy compatible with Three.js WebGPURenderer for classroom selection and sensor data display.

**Status:** Research Phase (Design → Implementation)
**Priority:** **Critical** — Blocker for interactive campus visualization
**Date Created:** 2025-11-12
**Last Updated:** 2025-11-12 (Clarification: Raycasting is available, not lost)

---

## Problem Statement

User interaction requires picking:
1. User hovers over or clicks on a classroom in the 3D view
2. System identifies which room was clicked
3. Entity binding registry returns HA entities for that room
4. Sensor panel displays live data (temperature, humidity, occupancy, etc.)

**Current State:**
- WebGPU renderer active and working
- No classroom picking implemented
- Sensor data overlay unavailable
- Campus visualization is view-only

---

## Clarification: Raycasting & WebGPU

### Common Misconception
"WebGPU doesn't support raycasting" → **INCORRECT**

### Reality
- **WebGPU (the API)** does not provide a built-in `raycast()` function
- WebGPU only exposes render and compute pipelines, buffers, textures
- **BUT:** Raycasting is absolutely possible via:
  - **CPU-side:** THREE.Raycaster (renderer-agnostic, works with WebGPURenderer)
  - **GPU-side:** Custom compute shaders, ID buffers, path tracing

### Correct Statement
"WebGPU doesn't ship a built-in raycaster API, but raycasting is available via engine utilities (like THREE.Raycaster) or custom GPU strategies."

---

## Picking Strategies: Comparison

### ⭐ Tier 1: CPU THREE.Raycaster (MVP for Our Scale)

**Approach:** Use Three.js' CPU-side Raycaster on room meshes/bounding boxes.

**Pros:**
- ✅ Works with WebGPURenderer (renderer-agnostic)
- ✅ Simple to implement and debug
- ✅ Excellent for 30 classrooms (low interaction density)
- ✅ No custom GPU code needed
- ✅ Deterministic, easy to reason about

**Cons:**
- CPU-bound (scales poorly beyond ~1000 objects)
- Not applicable if we later have thousands of pickable objects

**Implementation:**
```javascript
import * as THREE from 'three';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Create room shells (simple meshes, not detailed geometry)
const roomMeshes = createRoomBounds(); // Array of boxgeometry per room

window.addEventListener('pointermove', (event) => {
  // Convert screen to NDC
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Cast ray from camera
  raycaster.setFromCamera(mouse, camera);

  // Check intersections with room meshes
  const intersects = raycaster.intersectObjects(roomMeshes);

  if (intersects.length > 0) {
    const roomMesh = intersects[0].object;
    const roomId = roomMesh.userData.roomId; // e.g. "b.3"

    // Resolve HA entities for this room
    const entities = entityBindingRegistry.getEntitiesForLocation(roomId);

    // Highlight room and show sensor panel
    highlightRoom(roomId);
    showSensorPanel(roomId, entities);
  }
});
```

**When to Use:**
- Current MVP (30 classrooms, light interaction)
- Prototyping picking interaction
- Clarity and robustness over performance

**When to Upgrade:**
- If object count exceeds 100–200 and CPU raycasting becomes bottleneck
- If we add thousands of sub-room objects (furniture, devices)

---

### 🚀 Tier 2: GPU ID-Buffer Picking (Scalable Upgrade)

**Approach:** Render rooms to offscreen texture with unique ID colors, sample pixel at cursor.

**Pros:**
- ✅ GPU-accelerated, scales to thousands of objects
- ✅ Works with WebGPURenderer
- ✅ Single-pixel readback is fast even for large scenes
- ✅ Can encode additional data in pixel (normal, distance, etc.)

**Cons:**
- Extra render pass per frame
- Requires GPU → CPU readback (slight latency)
- More code complexity than Tier 1

**⚠️ Implementation Note (Caveat):** The GPU code examples in this doc (e.g., readPixels snippets) are written in WebGL idiom for clarity. When implementing Tier 2 with WebGPU, translate these patterns to WebGPU's compute pipelines and texture readback APIs. See WebGPU spec links in References section.

**Implementation:**
```javascript
// Create offscreen target for picking
const pickingRenderTarget = new THREE.WebGLRenderTarget(
  window.innerWidth,
  window.innerHeight,
  { format: THREE.RGBAFormat, type: THREE.UnsignedByteType }
);

// Create picking scene with room meshes, each colored by ID
const pickingScene = createPickingScene(rooms); // Room ID encoded in color
const pickingCamera = camera.clone();
const pickingRenderer = new THREE.WebGPURenderer({ renderTarget: pickingRenderTarget });

window.addEventListener('pointermove', (event) => {
  // Render picking frame
  pickingRenderer.render(pickingScene, pickingCamera);

  // Read pixel at cursor
  const pixelBuffer = new Uint8Array(4);
  pickingRenderer.readRenderTargetPixels(
    pickingRenderTarget,
    event.clientX,
    window.innerHeight - event.clientY,
    1, 1,
    pixelBuffer
  );

  // Decode room ID from RGBA
  const roomId = decodeRoomIdFromPixel(pixelBuffer);
  if (roomId) {
    const entities = entityBindingRegistry.getEntitiesForLocation(roomId);
    highlightRoom(roomId);
    showSensorPanel(roomId, entities);
  }
});

function decodeRoomIdFromPixel(pixel) {
  const [r, g, b, a] = pixel;
  const encoded = (r << 16) | (g << 8) | b;
  return roomIdMap.get(encoded) || null;
}
```

**When to Use:**
- Post-MVP, when scaling to more rooms or complex geometry
- When CPU raycasting shows latency (> 5ms)
- When we need sub-room object picking (furniture, devices)

---

### Option C: Manual CPU Hit Test (Fallback)

**Approach:** Manually test ray against bounding boxes using math (no raycaster).

**Pros:**
- No dependencies, works anywhere
- Educational (understand ray-box intersection math)

**Cons:**
- Low-level, verbose
- Same performance as THREE.Raycaster
- No advantage over using Raycaster

**When to Use:** Only if THREE.Raycaster is unavailable (unlikely).

---

### Option D: Compute Shader Picking (Advanced GPU)

**Approach:** Use WebGPU compute shader to test ray-room intersections on GPU.

**Pros:**
- True GPU-native, parallel ray testing
- Scales to thousands of intersections
- Modern approach

**Cons:**
- High complexity (WGSL, compute pipeline setup)
- Overkill for 30 rooms
- Longer implementation time

**When to Use:** Future optimization if Tier 2 (ID-buffer) becomes bottleneck.

---

## Recommended Implementation Roadmap

### Phase 1: Tier 1 (CPU Raycaster) — MVP

**Timeline:** 1–2 weeks

**Steps:**
1. Create simple box/sphere geometry for each classroom (room shells, not detailed)
2. Attach `userData.roomId` to each mesh
3. Set up THREE.Raycaster with `setFromCamera(mouse, camera)`
4. On intersect: extract roomId → call entity binding registry
5. Show sensor panel with HA data for that room
6. Add visual highlight (glow, color change, outline)

**Testing:**
```typescript
it('raycasts and picks the correct room', () => {
  const mouseX = 512, mouseY = 384;
  const pickedRoom = pickRoom(mouseX, mouseY);
  expect(pickedRoom.id).toBe('b.3'); // Verify correct room
});

it('picks in < 5ms', () => {
  const start = performance.now();
  const room = pickRoom(512, 384);
  expect(performance.now() - start).toBeLessThan(5);
});
```

**Files to Create:**
- `shared/services/picking-service.ts` — Raycaster wrapper
- `src/ui/components/molecules/SensorPanel.ts` — Sensor data display
- Tests: `tests/picking.test.ts`

**Files to Modify:**
- `src/main.js` — Initialize picking + sensor panel
- `shared/ui/SceneManager.ts` — Integrate picking with scene

---

### Phase 2: Tier 2 (ID-Buffer Picking) — Post-MVP

**Timeline:** 2–3 weeks (after Tier 1 stability)

**Trigger:** CPU raycasting shows > 5ms latency OR object count exceeds 100

**Steps:**
1. Create picking render target (offscreen texture)
2. Render room meshes to target, each with unique color ID
3. On pointer event: readPixels at cursor position
4. Decode room ID from pixel color
5. Use same entity binding → sensor panel flow as Tier 1

**Migration:** Drop-in replacement for `pickRoom()` function

---

### Phase 3: Tier 3 (Compute Shader) — Future Optimization

**Timeline:** Later (only if needed)

**Trigger:** ID-buffer picking becomes bottleneck OR we have thousands of objects

---

## Integration with HADS Architecture

### Picking Layer (This Task)
```typescript
interface PickResult {
  roomId: string | null;
  hit: boolean;
  worldPosition?: THREE.Vector3;  // Optional: 3D position
  screenX?: number;
  screenY?: number;
}

function pickRoom(screenX: number, screenY: number): PickResult {
  // Tier 1: raycaster.setFromCamera() + intersectObjects()
  // OR Tier 2: readPixels() + decode
  return { roomId, hit, worldPosition };
}
```

### Data Layer (HADS-R02: Entity Binding)
```typescript
function onRoomPicked(result: PickResult) {
  if (!result.hit || !result.roomId) return;

  // Step 1: Resolve entities for room
  const entities = entityBindingRegistry.getEntitiesForLocation(result.roomId);
  // → ['sensor.b3_temperature', 'sensor.b3_humidity', ...]

  // Step 2: Fetch HA state (via socket or REST)
  const sensorData = await homeAssistantSocket.getStates(entities);

  // Step 3: Update UI
  showSensorPanel(result.roomId, sensorData);
}
```

### UI Layer (Sensor Panel)
```typescript
function showSensorPanel(roomId: string, sensorData: Record<string, HAState>) {
  const room = locationRegistry.getById(roomId);

  // Display room name, icon, category
  panel.title = `${room.icon} ${room.name}`;

  // Display sensor values
  panel.temperature = sensorData['sensor.b3_temperature'].state;
  panel.humidity = sensorData['sensor.b3_humidity'].state;
  panel.occupancy = sensorData['binary_sensor.b3_occupancy'].state;

  // Show panel
  panel.visible = true;
}
```

**Separation of Concerns:**
- **Picking:** Screen → roomId only
- **Entity Binding:** RoomId → HA entities (HADS-R02)
- **HA Integration:** Entities → live sensor data
- **UI:** Display sensor panel

Each layer is independent; picking doesn't know about HA, UI doesn't know about picking algorithm.

---

## Success Criteria

### Tier 1 (CPU Raycaster)
- ✅ Classroom picking works for all 30 rooms
- ✅ < 5ms latency per pick (CPU raycasting acceptable)
- ✅ Integrates with entity binding registry (HADS-R02)
- ✅ Sensor panel displays correctly when room picked
- ✅ Works across all 3 scene types (geospatial, projector, backdrop)
- ✅ Unit tests pass (accuracy, performance, cross-scene)

### Tier 2 (GPU ID-Buffer, Post-MVP)
- ✅ Drop-in replacement for Tier 1 `pickRoom()` function
- ✅ Performance improvement validated (> 5ms improvement on 100+ rooms)
- ✅ Pixel readback latency < 2ms
- ✅ No visual artifacts from ID-buffer rendering

---

## Open Questions

### Q1: Room Shell Geometry Complexity?
**Assumption:** Simple box/sphere shells sufficient; no need for exact room outlines.
**To Validate:** Test if simple shells cause false positives (picking wrong room).
**Action:** If issues, refine to actual floor plan polygons.

### Q2: Real-Time Picking Latency Acceptable?
**Assumption:** < 5ms latency acceptable for mousemove events.
**To Validate:** Measure actual latency on target hardware (M3 Mac).
**Action:** If > 5ms, throttle picking to every N frames.

### Q3: Highlight & Feedback Visual?
**Assumption:** Room glow or outline on pick.
**To Validate:** Which visual feedback best matches geospatial/projector/backdrop themes?
**Action:** Design highlight effect per scene type.

### Q4: Mobile Touch Support?
**Assumption:** Desktop mouse interaction only (MVP).
**To Validate:** Do scenes run on mobile?
**Action:** If yes, add `pointerdown` event handling for touch.

---

## References

### Three.js
- [THREE.Raycaster Documentation](https://threejs.org/docs/#api/en/core/Raycaster)
- [WebGPURenderer Documentation](https://threejs.org/docs/#examples/en/renderers/WebGPURenderer)
- [Object Picking Example (WebGL, port logic to WebGPU)](https://threejs.org/examples/?q=pick)

### WebGPU
- [WebGPU Specification (W3C)](https://www.w3.org/TR/webgpu/)
- [WebGPU Compute Shaders](https://www.w3.org/TR/webgpu/#compute-shader)

### Mathematics
- [Ray-Box Intersection (Ryan Juckett)](http://www.3dkingdoms.com/weekly/weekly.php?a=21)
- [Möller–Trumbore Ray-Triangle Intersection](https://en.wikipedia.org/wiki/M%C3%B6ller%E2%80%93Trumbore_intersection_algorithm)

### Performance
- [GPU Readback Best Practices](https://chromium.googlesource.com/chromium/src/+/main/docs/gpu_data_transfer.md)

---

## Next Actions (for Implementation Agent)

1. **Implement Tier 1 (CPU Raycaster)**
   - Create room shell geometry array
   - Set up raycaster event listener
   - Resolve roomId → entities → sensor panel
   - Test on all 30 rooms

2. **Integrate with Entity Binding (HADS-R02)**
   - Verify entity registry returns correct entities for each room
   - Handle unmapped rooms gracefully

3. **Design Sensor Panel UI**
   - Template: Room name + icon + sensor values
   - Show temperature, humidity, occupancy, CO2, etc.
   - Update live when HA pushes state changes

4. **Test & Validate**
   - Pick accuracy (correct room identified)
   - Performance < 5ms per pick
   - Cross-scene consistency (all 3 scenes pick same room)
   - Sensor data appears correctly

5. **Plan Tier 2 Migration** (post-MVP)
   - Profile CPU raycasting performance
   - Measure readPixels latency
   - Schedule GPU ID-buffer upgrade if needed

---

## Session Note

Clarified that raycasting is NOT lost in WebGPU—it's available via THREE.Raycaster (CPU) or custom GPU approaches. Tier 1 (CPU raycaster) is the right MVP for 30 classrooms: simple, robust, debuggable. Tier 2 (GPU ID-buffer) is the scalable upgrade path if we later expand scope. Picking integrates cleanly with HADS-R02 entity binding and HA data layer, with clear separation of concerns.
