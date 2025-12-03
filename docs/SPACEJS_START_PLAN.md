# Space.js Integration - Starting Plan

## 🎯 Components We're Starting With

Based on our architecture analysis and the recommendation for **incremental integration**, we'll begin with the highest-value, lowest-risk components.

---

## Phase 1: Sensor Visualization (Week 1-2)

### Priority 1: Live Sensor Graphs

**Replace:** Static "No data" displays in RoomDetailPanel
**With:** Space.js `Graph` and `Meter` components

**Components to implement:**

#### 1. Temperature Graph
```javascript
import { PanelItem } from '@alienkitty/space.js';

const tempGraph = new PanelItem({
  type: 'graph',
  name: 'Temperature',
  // Real-time updates from SensorManager
});
```
- **Shows**: Historical temperature data with live updates
- **Updates**: Every time Home Assistant pushes new sensor value
- **Visual**: Line graph with time-based X axis

#### 2. Occupancy Meter
```javascript
const occupancyMeter = new PanelItem({
  type: 'meter',
  name: 'Occupancy',
  // Percentage of capacity
});
```
- **Shows**: Current occupancy as percentage of room capacity
- **Visual**: Radial meter with color thresholds (green/yellow/red)

#### 3. CO2/Humidity Dual Graph
```javascript
const envGraph = new PanelItem({
  type: 'graph',
  name: 'Air Quality',
  // CO2 and Humidity on same graph
});
```
- **Shows**: Environmental metrics together
- **Visual**: Multi-line graph with dual Y-axis

#### 4. Energy Consumption Meter
```javascript
const energyMeter = new PanelItem({
  type: 'meter',
  name: 'Energy',
  // Current kW usage
});
```
- **Shows**: Real-time energy consumption
- **Visual**: Meter with warning thresholds

---

## Phase 2: Enhanced Room Panel (Week 2-3)

### Priority 2: Animated Panel System

**Replace:** Custom RoomDetailPanel
**With:** Space.js `Panel` with animated lifecycle

**Features to implement:**

#### 1. Panel Structure
```javascript
import { Panel } from '@alienkitty/space.js';

class RoomSensorPanel {
  constructor(roomId, sensorManager) {
    this.panel = new Panel();
    this.sensorManager = sensorManager;

    // Build panel with modular items
    this._buildPanel(roomId);
  }

  _buildPanel(roomId) {
    // Add room header (spacer + content)
    this.panel.add(new PanelItem({ type: 'spacer' }));
    this.panel.add(new PanelItem({
      type: 'content',
      content: `<h2>${roomName}</h2>`
    }));

    // Add divider
    this.panel.add(new PanelItem({ type: 'divider' }));

    // Add sensor graphs
    this.panel.add(this.tempGraph);
    this.panel.add(this.occupancyMeter);

    // Add divider
    this.panel.add(new PanelItem({ type: 'divider' }));

    // Add room info
    this.panel.add(new PanelItem({
      type: 'content',
      content: `<p>Capacity: ${capacity}</p>`
    }));
  }

  show() {
    this.panel.animateIn(); // Smooth slide-in animation
  }

  hide() {
    this.panel.animateOut(); // Smooth slide-out
  }

  update() {
    this.panel.update(); // Called in RAF loop
  }
}
```

#### 2. Animation Features
- **Smooth transitions**: Panel slides in with easing
- **Spring physics**: Natural-feeling animations
- **Auto-updates**: Graphs refresh in real-time

---

## Phase 3: UI/HUD Enhancement (Week 3-4)

### Priority 3: Professional HUD

**Replace:** Custom HeroHeader
**With:** Space.js `UI` component

**Features:**

#### 1. HUD Component
```javascript
import { UI } from '@alienkitty/space.js';

const campusUI = new UI({
  fps: true,              // Show FPS counter
  header: true,           // Top header bar
  info: true,             // Info display
  details: true,          // Details panel
  detailsButton: true,    // Toggle button
});

campusUI.animateIn();
document.body.appendChild(campusUI.element);
```

#### 2. Info Display
- **Shows**: Current room name, sensor count, connection status
- **Updates**: When room changes or sensors update
- **Style**: Monospace, minimal, consistent with space.js aesthetic

#### 3. FPS Monitor
- **Shows**: Real-time performance metrics
- **Useful for**: Debugging, optimization
- **Visual**: Small, non-intrusive corner display

---

## Installation & Setup

### Step 1: Install Dependencies
```bash
npm install @alienkitty/space.js @alienkitty/alien.js
```

### Step 2: Update Imports
```javascript
// In RoomDetailPanel.js or new component
import { Panel, PanelItem, UI, Graph, Meter } from '@alienkitty/space.js';
```

### Step 3: Create Wrapper Classes
Create adapter classes that bridge our SensorManager with space.js components:

```javascript
// src/ui/spacejs/SensorGraphAdapter.js
export class SensorGraphAdapter {
  constructor(graph, sensorManager, roomId, sensorType) {
    this.graph = graph;
    this.sensorManager = sensorManager;
    this.roomId = roomId;
    this.sensorType = sensorType;

    // Subscribe to sensor updates
    this.sensorManager.on((update) => {
      if (update.roomId === this.roomId &&
          update.sensorType === this.sensorType) {
        this.updateGraph(update.reading.value);
      }
    });
  }

  updateGraph(value) {
    // Update space.js graph with new value
    this.graph.setValue(value);
  }
}
```

---

## Component Mapping

| Current Component | Space.js Component | Priority | Effort |
|-------------------|-------------------|----------|--------|
| **RoomDetailPanel sensors** | `Graph` + `Meter` | 🔥 High | 🟢 Low |
| **RoomDetailPanel structure** | `Panel` + `PanelItem` | 🔥 High | 🟡 Medium |
| **HeroHeader** | `UI` component | 🟡 Medium | 🟢 Low |
| **Room selection feedback** | Tween animations | 🟡 Medium | 🟢 Low |

---

## Success Metrics

### Week 1-2 Goals
- ✅ Temperature graph showing real data from Home Assistant
- ✅ Occupancy meter with percentage display
- ✅ Smooth animations on panel open/close
- ✅ Real-time updates (no manual refresh needed)

### Week 3-4 Goals
- ✅ Complete panel system with all sensors
- ✅ Professional HUD with FPS and info
- ✅ Consistent monospace aesthetic
- ✅ Performance: 60fps maintained

---

## Code Structure

```
src/
├── ui/
│   ├── spacejs/
│   │   ├── RoomSensorPanel.js      (Panel with sensors)
│   │   ├── SensorGraphAdapter.js   (Bridge to SensorManager)
│   │   ├── CampusUI.js             (Main UI/HUD)
│   │   └── animations.js           (Tween helpers)
│   ├── RoomDetailPanel.js          (Legacy - to be replaced)
│   └── ...
└── ...
```

---

## Testing Plan

### 1. Sensor Graph Test
- Connect to Home Assistant
- Click on a room with temperature sensor
- Verify graph shows real-time data
- Verify smooth animations

### 2. Panel Animation Test
- Open panel → Check smooth slide-in
- Close panel → Check smooth slide-out
- Test spring physics feel

### 3. Performance Test
- Monitor FPS with UI open
- Check memory usage
- Verify no leaks on panel open/close

---

## Rollback Plan

If space.js integration causes issues:
1. Keep legacy components commented out (not deleted)
2. Feature flag: `USE_SPACEJS_UI = false`
3. Quick rollback by switching flag

---

## Next Actions

1. ✅ Remove ClassroomPicker (done)
2. 🔄 Install space.js: `npm install @alienkitty/space.js`
3. 🔄 Create proof-of-concept: Single temperature graph
4. 🔄 Evaluate and iterate

**Start small, prove value, then scale up!** 🚀
