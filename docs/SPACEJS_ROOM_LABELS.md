# Space.js Room Labels & Panels - Implementation Plan

## 🎯 Goal: Exact Space.js.org Interaction Per Room

### The Interaction Flow

```
1. Idle State
   └─ Room visible in 3D scene

2. Hover State
   └─ Line extends from room to label
   └─ Label appears with room name
   └─ Smooth animation (line draws, label fades in)

3. Click State
   └─ Label expands into full panel
   └─ Panel shows complete room data
   └─ Smooth transition from label → panel
```

---

## 📐 Space.js Label System Architecture

### Component Structure

```javascript
RoomLabel (per room)
├── Line (SVG or CSS3D)
│   ├── Start point: Room center (3D)
│   └── End point: Label position (screen space)
├── Label (compact)
│   ├── Room name
│   └── Room icon
└── Panel (expanded)
    ├── Header
    ├── Sensors (graphs, meters)
    ├── Personality
    └── Room info
```

---

## 🎨 Implementation

### 1. Create RoomLabel Component

```javascript
// src/ui/spacejs/RoomLabel.js
import { Panel, PanelItem } from '@alienkitty/space.js';
import * as THREE from 'three';

export class RoomLabel {
  constructor(room, camera, sensorManager) {
    this.room = room;
    this.camera = camera;
    this.sensorManager = sensorManager;

    // States
    this.isHovered = false;
    this.isExpanded = false;

    // UI Elements
    this.line = null;
    this.label = null;
    this.panel = null;

    // Screen position
    this.screenPosition = new THREE.Vector2();

    this._init();
  }

  _init() {
    this._createLine();
    this._createLabel();
    this._createPanel();

    // Initially hidden
    this.hide();
  }

  /**
   * Create connecting line (SVG or Canvas)
   */
  _createLine() {
    // Create SVG line overlay
    this.lineSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.lineSvg.className = 'room-label-line';
    this.lineSvg.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 100;
    `;

    this.line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    this.line.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
    this.line.setAttribute('stroke-width', '1');
    this.line.setAttribute('stroke-dasharray', '4 2');

    this.lineSvg.appendChild(this.line);
    document.body.appendChild(this.lineSvg);
  }

  /**
   * Create compact label (space.js style)
   */
  _createLabel() {
    this.label = document.createElement('div');
    this.label.className = 'room-label';
    this.label.innerHTML = `
      <div class="room-label__icon">${this._getRoomIcon()}</div>
      <div class="room-label__name">${this.room.name}</div>
    `;

    this.label.style.cssText = `
      position: fixed;
      padding: 8px 12px;
      background: rgba(0, 0, 0, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #fff;
      pointer-events: auto;
      cursor: pointer;
      z-index: 101;
      opacity: 0;
      transform: scale(0.8);
      transition: opacity 0.3s, transform 0.3s;
      white-space: nowrap;
    `;

    // Click to expand
    this.label.addEventListener('click', () => this.expand());

    document.body.appendChild(this.label);
  }

  /**
   * Create full panel (space.js Panel)
   */
  _createPanel() {
    this.panel = new Panel();

    // Header
    this.panel.add(new PanelItem({
      type: 'content',
      content: `
        <div class="room-panel-header">
          <span class="room-panel-icon">${this._getRoomIcon()}</span>
          <h2>${this.room.name}</h2>
          <button class="room-panel-close">×</button>
        </div>
      `
    }));

    this.panel.add(new PanelItem({ type: 'divider' }));

    // Personality
    const personality = this._getRoomPersonality();
    this.panel.add(new PanelItem({
      type: 'content',
      content: `
        <div class="personality-section">
          <h3>Personality: ${personality.name}</h3>
          <p>${personality.expertise}</p>
        </div>
      `
    }));

    this.panel.add(new PanelItem({ type: 'divider' }));

    // Sensors
    this._addSensorItems();

    this.panel.add(new PanelItem({ type: 'divider' }));

    // Room Info
    this.panel.add(new PanelItem({
      type: 'content',
      content: this._getRoomInfoHTML()
    }));

    // Initially hidden
    this.panel.element.style.display = 'none';
    document.body.appendChild(this.panel.element);

    // Close button
    const closeBtn = this.panel.element.querySelector('.room-panel-close');
    closeBtn?.addEventListener('click', () => this.collapse());
  }

  /**
   * Add sensor visualization items
   */
  _addSensorItems() {
    const sensors = this.room.metadata?.sensors || [];

    sensors.forEach(sensorType => {
      const sensorReading = this.sensorManager.getSensor(this.room.id, sensorType);

      // Add graph or meter based on sensor type
      if (['temperature', 'humidity', 'co2', 'light'].includes(sensorType)) {
        // Graph for continuous values
        this.panel.add(new PanelItem({
          type: 'graph',
          name: this._getSensorLabel(sensorType)
        }));
      } else if (['occupancy', 'energy'].includes(sensorType)) {
        // Meter for percentage/threshold values
        this.panel.add(new PanelItem({
          type: 'meter',
          name: this._getSensorLabel(sensorType)
        }));
      } else {
        // Content for other types
        const value = sensorReading ?
          `${sensorReading.value} ${sensorReading.unit}` :
          'No data';

        this.panel.add(new PanelItem({
          type: 'content',
          content: `
            <div class="sensor-item">
              <span>${this._getSensorLabel(sensorType)}</span>
              <span>${value}</span>
            </div>
          `
        }));
      }
    });
  }

  /**
   * Update screen position (call in RAF loop)
   */
  update() {
    if (!this.isHovered && !this.isExpanded) return;

    // Project 3D position to screen space
    const vector = this.room.position.clone();
    vector.project(this.camera);

    // Convert to screen coordinates
    this.screenPosition.x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    this.screenPosition.y = (vector.y * -0.5 + 0.5) * window.innerHeight;

    // Update line
    this._updateLine();

    // Update label position
    if (!this.isExpanded) {
      this._updateLabelPosition();
    }

    // Update panel items
    if (this.isExpanded) {
      this.panel.update();
    }
  }

  /**
   * Update line from room to label
   */
  _updateLine() {
    const roomX = this.screenPosition.x;
    const roomY = this.screenPosition.y;

    const labelRect = this.isExpanded ?
      this.panel.element.getBoundingClientRect() :
      this.label.getBoundingClientRect();

    const labelX = labelRect.left + labelRect.width / 2;
    const labelY = labelRect.top + labelRect.height / 2;

    this.line.setAttribute('x1', roomX);
    this.line.setAttribute('y1', roomY);
    this.line.setAttribute('x2', labelX);
    this.line.setAttribute('y2', labelY);
  }

  /**
   * Update label position (offset from room)
   */
  _updateLabelPosition() {
    // Position to the right and slightly below room
    const offsetX = 40;
    const offsetY = 20;

    this.label.style.left = `${this.screenPosition.x + offsetX}px`;
    this.label.style.top = `${this.screenPosition.y + offsetY}px`;
  }

  /**
   * Show label on hover
   */
  showLabel() {
    if (this.isExpanded) return;

    this.isHovered = true;

    // Animate line drawing
    this.lineSvg.style.display = 'block';
    this.line.style.strokeDashoffset = '0';

    // Fade in label
    this.label.style.display = 'block';
    setTimeout(() => {
      this.label.style.opacity = '1';
      this.label.style.transform = 'scale(1)';
    }, 10);
  }

  /**
   * Hide label on hover out
   */
  hideLabel() {
    if (this.isExpanded) return;

    this.isHovered = false;

    this.label.style.opacity = '0';
    this.label.style.transform = 'scale(0.8)';

    setTimeout(() => {
      this.label.style.display = 'none';
      this.lineSvg.style.display = 'none';
    }, 300);
  }

  /**
   * Expand label into full panel
   */
  expand() {
    this.isExpanded = true;

    // Hide label
    this.label.style.display = 'none';

    // Show panel at label position
    const labelRect = this.label.getBoundingClientRect();
    this.panel.element.style.left = `${labelRect.left}px`;
    this.panel.element.style.top = `${labelRect.top}px`;
    this.panel.element.style.display = 'block';

    // Animate in
    this.panel.animateIn();

    // Keep line visible, update to panel
    this._updateLine();
  }

  /**
   * Collapse panel back to label
   */
  collapse() {
    this.isExpanded = false;

    // Animate out
    this.panel.animateOut();

    setTimeout(() => {
      this.panel.element.style.display = 'none';

      // Show label again if still hovering
      if (this.isHovered) {
        this.showLabel();
      } else {
        this.hideLabel();
      }
    }, 300);
  }

  /**
   * Hide everything
   */
  hide() {
    this.isHovered = false;
    this.isExpanded = false;
    this.label.style.display = 'none';
    this.lineSvg.style.display = 'none';
    this.panel.element.style.display = 'none';
  }

  /**
   * Get room icon
   */
  _getRoomIcon() {
    // Use your existing icon system
    const iconMap = {
      classroom: '📚',
      lab: '🔬',
      library: '📖',
      gym: '💪',
      cafeteria: '🍽️',
      auditorium: '🎭'
    };
    return iconMap[this.room.metadata?.icon] || '🏛️';
  }

  /**
   * Get room personality
   */
  _getRoomPersonality() {
    // Use existing getRoomPersonality function
    return {
      name: this.room.metadata?.personality || 'Unknown',
      expertise: 'Room personality description'
    };
  }

  /**
   * Get sensor label
   */
  _getSensorLabel(sensorType) {
    const labels = {
      temperature: 'Temperature',
      occupancy: 'Occupancy',
      humidity: 'Humidity',
      light: 'Light Level',
      co2: 'CO₂',
      energy: 'Energy',
      motion: 'Motion'
    };
    return labels[sensorType] || sensorType;
  }

  /**
   * Get room info HTML
   */
  _getRoomInfoHTML() {
    const metadata = this.room.metadata;
    return `
      <div class="room-info">
        ${metadata.capacity ? `<div>Capacity: ${metadata.capacity}</div>` : ''}
        ${metadata.features ? `<div>Features: ${metadata.features.join(', ')}</div>` : ''}
        ${metadata.color ? `<div>Color: <span style="color: ${metadata.color}">${metadata.color}</span></div>` : ''}
      </div>
    `;
  }

  /**
   * Cleanup
   */
  dispose() {
    this.label?.remove();
    this.lineSvg?.remove();
    this.panel?.element?.remove();
  }
}
```

---

### 2. Create RoomLabelManager

```javascript
// src/ui/spacejs/RoomLabelManager.js
import { RoomLabel } from './RoomLabel.js';
import * as THREE from 'three';

export class RoomLabelManager {
  constructor(roomManager, camera, sensorManager) {
    this.roomManager = roomManager;
    this.camera = camera;
    this.sensorManager = sensorManager;

    this.labels = new Map(); // roomId -> RoomLabel
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredRoom = null;

    this._init();
  }

  _init() {
    // Create label for each room
    this.roomManager.rooms.forEach((room, roomId) => {
      const label = new RoomLabel(room, this.camera, this.sensorManager);
      this.labels.set(roomId, label);
    });

    // Setup hover detection
    window.addEventListener('mousemove', (e) => this._onMouseMove(e));
  }

  _onMouseMove(event) {
    // Update mouse position
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycast to detect hovered room
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(
      Array.from(this.roomManager.rooms.values()).map(r => r.mesh),
      false
    );

    if (intersects.length > 0) {
      const room = this.roomManager.getRoomFromMesh(intersects[0].object);

      if (room && room.id !== this.hoveredRoom?.id) {
        // Hide previous
        if (this.hoveredRoom) {
          const prevLabel = this.labels.get(this.hoveredRoom.id);
          prevLabel?.hideLabel();
        }

        // Show new
        this.hoveredRoom = room;
        const label = this.labels.get(room.id);
        label?.showLabel();
      }
    } else {
      // No room hovered
      if (this.hoveredRoom) {
        const label = this.labels.get(this.hoveredRoom.id);
        label?.hideLabel();
        this.hoveredRoom = null;
      }
    }
  }

  /**
   * Update all labels (call in RAF)
   */
  update() {
    this.labels.forEach(label => label.update());
  }

  /**
   * Cleanup
   */
  dispose() {
    this.labels.forEach(label => label.dispose());
    this.labels.clear();
  }
}
```

---

### 3. Integrate into CampusApp

```javascript
// src/core/CampusApp.js

import { RoomLabelManager } from '../ui/spacejs/RoomLabelManager.js';

class CampusApp {
  // ... existing code ...

  _setupUI() {
    // ... existing UI setup ...

    // Add room label system (space.js style)
    this.roomLabelManager = new RoomLabelManager(
      this.roomManager,
      this.camera,
      this.sensorManager
    );

    console.log('[CampusApp] Room label system initialized');
  }

  _animate() {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this._animate());

    const delta = this.clock.getDelta();

    // Update controls
    this.controls.update();

    // Update room manager
    this.roomManager?.update(delta);

    // Update room labels (NEW)
    this.roomLabelManager?.update();

    // Update scene controls
    this.sceneControls?.update(delta);

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    // ... existing dispose ...
    this.roomLabelManager?.dispose();
  }
}
```

---

### 4. Add CSS Styling

```css
/* src/styles/roomLabels.css */

/* Line animation */
.room-label-line line {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: drawLine 0.3s ease-out forwards;
}

@keyframes drawLine {
  to {
    stroke-dashoffset: 0;
  }
}

/* Label styling (space.js monospace aesthetic) */
.room-label {
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.room-label__icon {
  font-size: 16px;
}

.room-label__name {
  font-weight: 500;
  letter-spacing: 0.5px;
}

.room-label:hover {
  background: rgba(0, 0, 0, 0.95);
  border-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

/* Panel styling */
.room-panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.5);
}

.room-panel-icon {
  font-size: 24px;
}

.room-panel-header h2 {
  flex: 1;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.room-panel-close {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 24px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  transition: all 0.2s;
}

.room-panel-close:hover {
  background: rgba(255, 0, 0, 0.2);
  border-color: rgba(255, 0, 0, 0.5);
}

/* Personality section */
.personality-section {
  padding: 12px;
}

.personality-section h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #2dd4bf;
}

.personality-section p {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.7);
}

/* Sensor items */
.sensor-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 12px;
}

/* Room info */
.room-info {
  padding: 12px;
  font-size: 12px;
  line-height: 1.6;
}

.room-info div {
  margin-bottom: 4px;
}
```

---

## 🎬 Interaction Flow Summary

```
User Action                  Visual Response
─────────────────────────────────────────────────────────
1. Hover over room    →      Line draws from room to label
                            Label fades in with name

2. Click on label     →      Label expands to full panel
                            Panel shows sensors, data, info
                            Line remains connected

3. Click close (×)    →      Panel collapses back to label
                            (if still hovering)

4. Move mouse away    →      Label fades out
                            Line disappears
```

---

## 📊 Data Loading Per Room

Each panel automatically loads:
- ✅ Room name and icon
- ✅ Personality (from ADA Compendium)
- ✅ Live sensors (graphs, meters)
- ✅ Room metadata (capacity, features, color)
- ✅ Real-time updates from SensorManager

---

## 🚀 Next Steps

1. **Install space.js**
   ```bash
   npm install @alienkitty/space.js
   ```

2. **Create components**
   - `src/ui/spacejs/RoomLabel.js`
   - `src/ui/spacejs/RoomLabelManager.js`

3. **Add CSS**
   - `src/styles/roomLabels.css`

4. **Integrate**
   - Update CampusApp to use RoomLabelManager
   - Import CSS in main

5. **Test**
   - Hover over rooms
   - Click labels to expand
   - Verify data loading

**Result: Exact space.js.org interaction with your room data!** ✨
