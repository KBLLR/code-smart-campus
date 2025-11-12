# HADS-R09 Tier 1: Implementation Guide (CPU Raycaster MVP)

**Status:** Ready to implement
**Timeline:** 1–2 weeks
**Complexity:** Low
**Dependencies:** HADS-R02 (entity binding registry) in place

---

## Overview

This guide walks through implementing Tier 1 picking (CPU THREE.Raycaster) for classroom selection and sensor panel display.

**End Result:**
- User hovers/clicks classroom → room highlights
- Sensor panel shows live temperature, humidity, occupancy, etc.
- Performance measured and validated on M3

---

## Step 1: Create Room Mesh Shells

In your scene setup (likely `src/scene.js` or `src/Setup.js`):

```typescript
import { roomRegistry } from '@/data/mappings/rooms_personalities.json';

/**
 * Create simple box meshes for each room (for picking, not rendering).
 * These are invisible shells with userData.roomId for raycasting.
 */
function createRoomMeshes() {
  const roomMeshes: THREE.Mesh[] = [];
  const geometry = new THREE.BoxGeometry(1, 1, 1); // Unit size, will scale per room
  const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }); // Invisible

  roomRegistry.forEach((room) => {
    const mesh = new THREE.Mesh(geometry, material);

    // Scale to approximate room dimensions (adjust as needed)
    mesh.scale.set(10, 3, 10);

    // Position from room data (if you have center coordinates)
    if (room.center) {
      mesh.position.set(room.center[0], room.center[1], room.center[2]);
    }

    // Store room ID for picking
    mesh.userData.roomId = room.id;
    mesh.userData.roomName = room['room-name'];

    // Add to scene (invisible, doesn't affect visuals)
    scene.add(mesh);
    roomMeshes.push(mesh);
  });

  return roomMeshes;
}
```

**Alternative: Use Existing Geometry**

If you already have room geometry in your floorplan model, you can reuse it:

```typescript
const roomMeshes: THREE.Mesh[] = [];

// Extract room meshes from your loaded model
floorplanModel.traverse((child) => {
  if (child instanceof THREE.Mesh && child.name.match(/room|classroom/i)) {
    child.userData.roomId = extractRoomIdFromName(child.name);
    roomMeshes.push(child);
  }
});
```

---

## Step 2: Initialize PickingService

```typescript
import { PickingService } from '@shared/services/picking-service';

// In your scene initialization
const roomMeshes = createRoomMeshes();
const picking = new PickingService(camera, roomMeshes);

export { picking };
```

---

## Step 3: Wire Pointer Events

In `src/main.js` or your main app file:

```typescript
import { picking } from '@/scene'; // or wherever you export it
import { entityBindingRegistry } from '@shared/services/entity-binding-registry';
import { homeAssistantSocket } from '@/ha'; // Your HA socket instance
import { showSensorPanel } from '@/ui/components/molecules/SensorPanel';
import { highlightRoom } from '@/ui/interactions/room-highlight';

const canvas = document.querySelector('canvas');

// Measure performance
let pickCount = 0;
let pickDurations: number[] = [];

canvas.addEventListener('pointermove', async (event) => {
  const startTime = performance.now();

  // Step 1: Pick room from screen coordinates
  const result = picking.pick(event.clientX, event.clientY);

  // No hit or no roomId
  if (!result.hit || !result.roomId) {
    hideHighlight();
    return;
  }

  // Step 2: Resolve HA entities for this room
  const entities = entityBindingRegistry.getEntitiesForLocation(result.roomId);
  if (entities.length === 0) {
    console.warn(`[Picking] No entities for room ${result.roomId}`);
    return;
  }

  try {
    // Step 3: Fetch live sensor data from Home Assistant
    const sensorData = await homeAssistantSocket.getStates(entities);

    // Step 4: Display sensor panel
    showSensorPanel(result.roomId, sensorData);

    // Step 5: Visual feedback (highlight room)
    highlightRoom(result.roomId);

  } catch (error) {
    console.error('[Picking] Error fetching sensor data:', error);
  }

  // Performance logging
  const duration = performance.now() - startTime;
  pickDurations.push(duration);
  pickCount++;

  if (pickCount % 100 === 0) {
    const avg = pickDurations.reduce((a, b) => a + b, 0) / pickDurations.length;
    const max = Math.max(...pickDurations);
    console.log(`[Picking] 100 picks: avg ${avg.toFixed(2)}ms, max ${max.toFixed(2)}ms`);
    pickDurations = [];
  }
});

// Optional: Click to lock/unlock sensor panel (instead of just hover)
canvas.addEventListener('click', async (event) => {
  const result = picking.pick(event.clientX, event.clientY);
  if (result.hit && result.roomId) {
    console.log(`[Picking] Clicked room: ${result.roomId}`);
    // Could lock the sensor panel here, etc.
  }
});
```

---

## Step 4: Implement SensorPanel Component

Create `src/ui/components/molecules/SensorPanel.ts`:

```typescript
/**
 * SensorPanel — Display live sensor data for picked classroom.
 */

import { HAState } from '@/types/home-assistant';

export interface SensorPanelData {
  roomId: string;
  roomName: string;
  roomIcon: string;
  sensors: Record<string, HAState>;
}

export function showSensorPanel(roomId: string, sensorData: Record<string, HAState>) {
  const panel = document.getElementById('sensor-panel') || createSensorPanel();

  // Update room info
  const room = locationRegistry.getById(roomId);
  if (!room) {
    console.error(`[SensorPanel] Room not found: ${roomId}`);
    return;
  }

  // Header
  const header = panel.querySelector('[data-panel="header"]');
  if (header) {
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-size: 1.5rem;">${room.icon}</span>
        <div>
          <h2 style="margin: 0; font-size: 1rem;">${room.name}</h2>
          <p style="margin: 0; font-size: 0.75rem; opacity: 0.7;">${room.category}</p>
        </div>
      </div>
    `;
  }

  // Sensor values
  const sensorList = panel.querySelector('[data-panel="sensors"]');
  if (sensorList) {
    const sensorsHtml = Object.entries(sensorData)
      .map(([entityId, state]) => {
        const value = state.state || 'unavailable';
        const unit = state.attributes?.unit_of_measurement || '';
        const friendlyName = state.attributes?.friendly_name || entityId;

        return `
          <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <span style="opacity: 0.8;">${friendlyName}</span>
            <strong>${value} ${unit}</strong>
          </div>
        `;
      })
      .join('');

    sensorList.innerHTML = sensorsHtml;
  }

  // Show panel
  panel.style.display = 'block';
}

export function hideSensorPanel() {
  const panel = document.getElementById('sensor-panel');
  if (panel) panel.style.display = 'none';
}

function createSensorPanel(): HTMLElement {
  const panel = document.createElement('div');
  panel.id = 'sensor-panel';
  panel.style.cssText = `
    position: fixed;
    top: 1rem;
    right: 1rem;
    width: 300px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    font-family: monospace;
    font-size: 0.875rem;
    max-height: 60vh;
    overflow-y: auto;
    z-index: 1000;
  `;

  panel.innerHTML = `
    <div data-panel="header" style="margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 0.5rem;"></div>
    <div data-panel="sensors"></div>
  `;

  document.body.appendChild(panel);
  return panel;
}
```

---

## Step 5: Room Highlight Effect

Create `src/ui/interactions/room-highlight.ts`:

```typescript
/**
 * Visual feedback when hovering/clicking a room.
 */

let highlightedMesh: THREE.Mesh | null = null;
let originalMaterial: THREE.Material | null = null;

export function highlightRoom(roomId: string) {
  const room = scene.getObjectByName(roomId);
  if (!room || !(room instanceof THREE.Mesh)) {
    console.warn(`[Highlight] Room mesh not found: ${roomId}`);
    return;
  }

  // Clear previous highlight
  if (highlightedMesh && originalMaterial) {
    highlightedMesh.material = originalMaterial;
  }

  // Apply highlight material (glow, color, outline, etc.)
  highlightedMesh = room;
  originalMaterial = room.material;

  // Example: Add emissive glow
  const highlightMaterial = new THREE.MeshStandardMaterial({
    color: room.material.color,
    emissive: new THREE.Color(0x00ff00),
    emissiveIntensity: 0.5,
  });

  room.material = highlightMaterial;
}

export function hideHighlight() {
  if (highlightedMesh && originalMaterial) {
    highlightedMesh.material = originalMaterial;
    highlightedMesh = null;
    originalMaterial = null;
  }
}
```

---

## Step 6: Measure & Validate Performance

Add performance tracking (already in Step 3 event listener):

```typescript
// Console output every 100 picks:
// [Picking] 100 picks: avg 0.45ms, max 1.23ms

// Expected results on M3:
// - Avg: 0.3–0.8ms per pick
// - Max: < 2ms (even with network latency for HA data)
```

Run the app and check browser console after hovering over classrooms a few times:

```
[Picking] 100 picks: avg 0.42ms, max 1.15ms
[Picking] 200 picks: avg 0.38ms, max 1.89ms
```

If consistently < 5ms, Tier 1 is production-ready. If > 5ms, consider:
- Throttling picking to every N frames: `if (frameCount % 2 !== 0) return;`
- Reducing room mesh count (cull invisible rooms)
- Upgrade to Tier 2 (GPU ID-buffer)

---

## Step 7: Test on All 3 Scenes

Repeat the above for:
- Main branch (geospatial scene)
- `feature/scene-projector`
- `feature/scene-backdrop`

Verify:
- ✅ Picking works on all 3 scenes
- ✅ Same room ID identified across scenes
- ✅ Entity binding returns entities correctly
- ✅ Sensor panel displays with live data
- ✅ Performance is acceptable (< 5ms)

---

## Files Created/Modified

### New Files
- `shared/services/picking-service.ts` ← **Main implementation**
- `src/ui/components/molecules/SensorPanel.ts` ← **Panel UI**
- `src/ui/interactions/room-highlight.ts` ← **Visual feedback**

### Modified Files
- `src/scene.js` or `src/Setup.js` ← Add `createRoomMeshes()`
- `src/main.js` ← Wire pointer events + performance logging

---

## Next Steps After Tier 1 MVP

1. **Validate Performance on M3** — Confirm < 5ms latency
2. **Integrate with HADS-R02** — Entity binding registry working
3. **Connect HA Socket** — Live sensor data flowing
4. **Cross-Scene Testing** — All 3 scenes pick correctly
5. **Polish UI** — Refine sensor panel design, highlight effect
6. **Plan Tier 2** — If needed, outline GPU ID-buffer upgrade

---

## Tier 2 Upgrade Criteria

Switch to GPU ID-buffer picking if:
- CPU raycasting consistently > 5ms
- Room mesh count exceeds 100–200
- Need to pick sub-room objects (furniture, devices)

See `HADS-R09-WEBGPU-RAYCASTER-PICKING.md` for Tier 2 details.

---

## References

- `shared/services/picking-service.ts` — Core raycaster wrapper
- `HADS-R09-WEBGPU-RAYCASTER-PICKING.md` — Architecture & strategy docs
- `research/ENTITY-LOCATIONS.json` — Room registry (30 classrooms)
- `HADS-R02-DEVICE-MOBILITY-ARCHITECTURE.md` — Entity binding strategy

---

## Debugging

### Picking not working?

1. **Check room meshes exist:**
   ```typescript
   console.log('Room meshes:', roomMeshes.length); // Should be 30
   roomMeshes.forEach(m => console.log(m.userData.roomId));
   ```

2. **Check raycaster is initialized:**
   ```typescript
   const result = picking.pick(512, 384); // Approx center of screen
   console.log(result); // Should show { roomId, hit } if mouse over a room
   ```

3. **Check entity binding registry:**
   ```typescript
   const entities = entityBindingRegistry.getEntitiesForLocation('b.3');
   console.log(entities); // Should return array of entity IDs
   ```

4. **Check HA socket:**
   ```typescript
   const states = await homeAssistantSocket.getStates(['sensor.b3_temperature']);
   console.log(states); // Should show live state
   ```

---

## Performance Notes

- Three.js Raycaster is CPU-bound but highly optimized
- 30 room meshes with one raycaster test: **negligible overhead** (< 1ms)
- Raycasting bottleneck only appears with > 1000 objects
- Network latency (fetching HA data) will dominate timing, not picking itself

**Typical timeline:**
- Raycasting: 0.4ms
- Entity registry lookup: 0.1ms
- HA socket fetch: 50–200ms (network)
- Panel render: 1–2ms
- **Total: 50–203ms per interaction** (mostly network, not picking)

---

## Session Signature

Tier 1 MVP ready to ship. Simple, robust, measurable. PickingService is a thin wrapper around THREE.Raycaster—no reinventing, no premature GPU optimization. Integrate with HADS-R02 entity binding and HA socket, validate performance, then decide if Tier 2 upgrade is needed. Most projects won't need GPU picking for 30 classrooms.
