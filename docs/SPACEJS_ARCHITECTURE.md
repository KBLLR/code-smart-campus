# Space.js Point3D Architecture - Campus Smart Integration

## Overview

Complete rebuild of the campus UI system using **native Space.js architecture** following best practices from the [@alienkitty/space.js](https://github.com/alienkitty/space.js) library.

## Architecture Deep Dive

### Space.js Point3D Hierarchy

```
Point3D (THREE.Group)
├── mesh (invisible raycasting sphere at geometry center)
├── element (Interface container)
│   ├── line (Line from geometry center to label)
│   ├── reticle (center point reticle)
│   ├── tracker (corner brackets - visible on selection)
│   └── point (Point UI component)
│       └── info (PointInfo)
│           ├── container (name/type display)
│           └── panel (Panel with sensor data) ← Opens on click!
```

### Key Components

#### 1. CampusPoint3DSystem (`src/ui/spacejs/CampusPoint3DSystem.js`)

**Purpose**: Complete Point3D integration manager for campus rooms

**Responsibilities**:
- Initialize Stage and Point3D systems
- Create center-of-mass meshes for accurate positioning
- Add panel content (sensors, agent, "Enter Room" button)
- Handle Point3D click events to open panels
- Dispatch room selection events

**Key Methods**:
- `init()` - Initialize Space.js Stage and Point3D system
- `createRoomPoints()` - Generate Point3D for each room
- `createCenterMesh(roomMesh)` - Calculate geometric center for line origin
- `addPanelContent(point, classroom)` - Populate panel with data
- `onPoint3DClick({ target })` - Handle clicks, open panels
- `update(time)` - Call Point3D.update() every frame

#### 2. Geometry Center Calculation

**Problem**: Default Three.js mesh pivot is at bottom, not geometric center
**Solution**: Calculate bounding box center and create invisible mesh

```javascript
createCenterMesh(roomMesh) {
  const bbox = new THREE.Box3().setFromObject(roomMesh);
  const center = new THREE.Vector3();
  bbox.getCenter(center); // Geometric center of mass

  const size = new THREE.Vector3();
  bbox.getSize(size);
  const radius = Math.max(size.x, size.y, size.z) / 2;

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 16, 16),
    new THREE.MeshBasicMaterial({ visible: false })
  );

  mesh.position.copy(center);
  return mesh;
}
```

**Result**: Lines now originate from true geometry center, camera-independent

#### 3. Panel Content Structure

**Space.js Pattern**: Panel → PanelItems (spacer, divider, content)

```javascript
// Agent personality
panel.add(new PanelItem({
  type: 'content',
  text: `<strong>${classroom.agent.personality.name}</strong>`
}));

panel.add(new PanelItem({ type: 'divider' }));

// Sensor data
sensors.forEach(sensor => {
  panel.add(new PanelItem({
    type: 'content',
    text: `${sensor.label}: ${sensor.value}`
  }));
});

// "Enter Room" button
panel.add(new PanelItem({
  type: 'content',
  text: `<div class="campus-enter-room-btn">Enter Room →</div>`
}));
```

#### 4. Event Flow

**Hover Interaction**:
1. Point3D raycasting detects hover
2. Space.js automatically shows: line, reticle, tracker, point label
3. After 2s of no hover → auto fade out

**Click Interaction**:
1. User clicks on room geometry
2. Point3D.events emits `'click'` event
3. `CampusPoint3DSystem.onPoint3DClick()` receives event
4. Calls `target.point.open()` → Panel slides in and animates
5. Panel shows sensors, agent, "Enter Room" button

**Enter Room**:
1. User clicks "Enter Room" button in panel
2. Dispatches `'room:select'` CustomEvent
3. CampusApp listener opens RoomDetailView
4. Panel closes automatically

## Camera-Aware Positioning

**Space.js handles this automatically via `getScreenSpaceBox()`**:

```javascript
updateMatrixWorld(force) {
  const box = getScreenSpaceBox(this.mesh, this.camera);
  const center = box.getCenter(this.center).multiply(this.halfScreen);
  const centerX = this.halfScreen.x + center.x;
  const centerY = this.halfScreen.y - center.y;

  this.reticle.target.set(centerX, centerY);
  this.tracker.target.set(centerX, centerY);
  this.point.target.set(centerX + halfWidth, centerY - halfHeight);
}
```

**Result**: Labels, lines, and trackers remain correctly positioned regardless of:
- Camera rotation
- Camera zoom
- Camera type (perspective/orthographic)
- Screen resolution

## What Was Removed (Legacy Code)

### ❌ Removed: Point3DManager.js
- **Reason**: Custom implementation that didn't follow Space.js patterns
- **Issue**: Panel items added but panel never opened
- **Replaced by**: CampusPoint3DSystem.js

### ❌ Removed: Standalone Panel Creation in CampusApp
- **Reason**: Conflicted with Point3D's built-in panel system
- **Issue**: Tried to manually position panels with clientX/clientY
- **Replaced by**: Space.js native panel positioning

### ❌ Removed: Manual animateIn() on initialization
- **Reason**: Caused all labels to appear at (0,0) on page load
- **Issue**: Labels visible before camera positioned
- **Solution**: Let Space.js handle animations on hover

## Best Practices Applied

### 1. **Think in Space.js Terms**
- Use built-in Panel system, don't create standalone panels
- Leverage Interface class for UI components
- Use Stage for initialization and ticker

### 2. **Mathematical Precision**
- Calculate true geometry center of mass
- Use bounding box for accurate dimensions
- Screen-space calculations handled by Space.js

### 3. **Event-Driven Architecture**
- Listen to Point3D.events ('click', 'hover', 'change')
- Use CustomEvents for cross-component communication
- Clean event listener management in dispose()

### 4. **Resource Management**
- Proper geometry/material disposal
- Remove event listeners on cleanup
- Clear references to prevent memory leaks

### 5. **Separation of Concerns**
- CampusPoint3DSystem: UI/interaction layer
- ClassroomRegistry: Data layer
- RoomManager: 3D geometry layer
- Clear interfaces between layers

## Usage

```javascript
// In CampusApp.js
this.campusPoint3D = new CampusPoint3DSystem(
  this.scene,
  this.camera,
  this.roomManager,
  this.classroomRegistry
);

// Create points for all rooms
this.campusPoint3D.createRoomPoints();

// In animation loop
this.campusPoint3D.update(time);
```

## Debugging

**Enable Point3D debug mode** to see raycasting spheres:

```javascript
Point3D.init(this.scene, this.camera, {
  root: document.body,
  container: document.body,
  debug: true // Shows invisible raycasting meshes
});
```

## Resources

- **Space.js Repository**: [github.com/alienkitty/space.js](https://github.com/alienkitty/space.js)
- **Alien.js (Related)**: [github.com/alienkitty/alien.js](https://github.com/alienkitty/alien.js)
- **Three.js Screen Projection**: [Stack Overflow](https://stackoverflow.com/questions/29816080/convert-point3d-to-screen2d-get-wrong-result-in-three-js)

## Results

✅ **Panels now open on click** (not just hover)
✅ **Lines originate from geometry center** (not bottom)
✅ **Camera-independent positioning** (works at any angle)
✅ **No (0,0) flash on page load** (proper initialization)
✅ **Clean event-driven architecture** (follows Space.js patterns)
✅ **Proper resource management** (no memory leaks)

## Next Steps

1. **Add real-time sensor updates** - Call `updatePanelData()` when sensor values change
2. **Customize panel styling** - Extend PanelItem with custom CSS variables
3. **Add more panel types** - Graphs, meters, sliders (Space.js supports these)
4. **Multi-select support** - Shift-click to select multiple rooms (Space.js has this)
5. **Keyboard navigation** - Press 1-9 to select specific rooms (Space.js has this)

---

**Author**: Claude (The Architect)
**Date**: 2025-12-05
**Version**: 1.0.0
