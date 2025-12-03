# Space.js Integration Guide

**Libraries**: `@alienkitty/space.js` v1.2.0 + `@alienkitty/alien.js` v1.2.0
**Official**: https://space.js.org | https://github.com/alienkitty/space.js

---

## Core Philosophy

Space.js provides a **minimal, monochrome UI system** designed for 3D WebGL experiences with:
- Roboto Mono typography (monospace aesthetic)
- Pure black background (#060606)
- White text with opacity layers
- Glassmorphism panels
- Smooth animations via Ticker system
- No unnecessary colors (except status indicators)

---

## Available Components

### 1. Interface (Base Class)

**Path**: `@alienkitty/space.js/src/utils/Interface.js`

Base class for all UI components. Extends a simple DOM wrapper with styling and animation methods.

```javascript
import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';

// Create a new UI element
const myPanel = new Interface('.my-panel');

// Styling
myPanel.css({
  position: 'absolute',
  left: 20,
  top: 20,
  color: '#fff',
  fontSize: 'var(--ui-font-size)',
  fontFamily: 'var(--ui-font-family)'
});

// Content
myPanel.html('Hello Campus');
myPanel.text('Plain text');

// Add child elements
const childElement = new Interface('.child');
myPanel.add(childElement);

// Animations
myPanel.tween({ opacity: 1 }, 600, 'easeOutCubic');
myPanel.clearTween().css({ opacity: 0 }).tween({ opacity: 1 }, 300);
```

**Key Methods**:
- `.css(styles)` - Apply CSS styles
- `.html(content)` - Set HTML content
- `.text(content)` - Set text content
- `.add(child)` - Add child Interface
- `.tween(to, duration, ease)` - Animate properties
- `.clearTween()` - Cancel animations
- `.show()` / `.hide()` - Visibility toggle

### 2. Stage

**Path**: `@alienkitty/space.js/src/utils/Stage.js`

Initializes the space.js system. Must be called once before using any components.

```javascript
import { Stage } from '@alienkitty/space.js/src/utils/Stage.js';

// Initialize (call once in main.js)
Stage.init(document.body);
```

Sets up:
- CSS custom properties
- Ticker system for animations
- Event listeners
- Base styling

### 3. Panel & PanelItem

**Path**: `@alienkitty/space.js/src/panels/Panel.js`

Panels are content containers that can be attached to 3D objects or shown independently.

```javascript
import { Panel } from '@alienkitty/space.js/src/panels/Panel.js';
import { PanelItem } from '@alienkitty/space.js/src/panels/PanelItem.js';

// Create panel
const panel = new Panel();

// Add header
panel.add(new PanelItem({
  type: 'title',
  value: 'Room A.5'
}));

// Add spacer
panel.add(new PanelItem({ type: 'spacer' }));

// Add divider line
panel.add(new PanelItem({ type: 'divider' }));

// Add content
panel.add(new PanelItem({
  type: 'content',
  text: '<div>Temperature: 22.5°C</div>'
}));

// Add button/link
panel.add(new PanelItem({
  type: 'link',
  value: 'View Details',
  callback: () => console.log('Clicked!')
}));
```

**PanelItem Types**:
- `title` - Bold header text
- `content` - Regular content (supports HTML)
- `link` - Clickable link/button
- `divider` - Horizontal line
- `spacer` - Vertical spacing
- `list` - Bulleted list item

### 4. Point3D

**Path**: `@alienkitty/space.js/src/three/ui/Point3D.js`

3D markers that follow Three.js objects in world space with attached panels.

```javascript
import { Point3D } from '@alienkitty/space.js/src/three/ui/Point3D.js';

// Initialize Point3D system (once)
Point3D.init(scene, camera, {
  root: document.body,
  container: document.body
});

// Create point for a 3D object
const point = new Point3D(roomMesh, {
  name: 'Room A.5',
  type: 'Classroom',
  noTracker: false // Show corner brackets
});

// Access the panel
point.panel.add(new PanelItem({
  type: 'content',
  text: 'Occupancy: 15/30'
}));

// Update point position (called in render loop)
point.update();
```

**Features**:
- Auto-follows 3D objects
- Shows corner bracket "tracker" around object
- Displays reticle (crosshair) when hovered
- Panel appears on hover
- Line connects label to object

### 5. UI Class

**Path**: `@alienkitty/space.js/src/ui/UI.js`

Higher-level UI manager for app-wide controls.

```javascript
import { UI } from '@alienkitty/space.js/src/ui/UI.js';

const ui = new UI();

// Show loading indicator
ui.animateIn();
```

---

## CSS Variables Reference

From `src/styles/spacejs.css`:

### Typography
```css
--ui-font-family: 'Roboto Mono', monospace;
--ui-font-size: 10px;
--ui-line-height: 15px;
--ui-letter-spacing: 0.04em;

--ui-name-font-family: 'Gothic A1', sans-serif;  /* For names/titles */
--ui-title-font-size: 11px;
--ui-title-letter-spacing: 1px;
```

### Colors
```css
--bg-color: #060606;                    /* Pure black */
--ui-color: #fff;                       /* White */
--ui-secondary-color: #868686;          /* Gray */

/* Status colors */
--ui-color-range-3: #5ec962;  /* Green (good) */
--ui-color-range-4: #fde725;  /* Yellow (warning) */
```

### Opacity Layers
```css
--ui-color-line-opacity: 0.5;           /* Lines */
--ui-color-divider-line-opacity: 0.15;  /* Dividers */
```

---

## Design Patterns

### 1. HUD Component (Top-Level UI)

```javascript
import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';

class CampusHeader extends Interface {
  constructor() {
    super('.campus-header');

    this.title = new Interface('.title');
    this.subtitle = new Interface('.subtitle');

    this.init();
  }

  init() {
    this.css({
      position: 'absolute',
      left: 20,
      top: 20,
      color: '#fff',
      fontFamily: 'var(--ui-font-family)',
      fontSize: 'var(--ui-title-font-size)',
      letterSpacing: 'var(--ui-title-letter-spacing)',
      textTransform: 'uppercase',
      pointerEvents: 'none',
      zIndex: 1000
    });

    this.title.css({
      opacity: 1
    }).text('SMART CAMPUS');

    this.subtitle.css({
      opacity: 0.5,
      marginTop: 4
    }).text('Real-time monitoring active');

    this.add(this.title);
    this.add(this.subtitle);

    // Fade in
    this.css({ opacity: 0 }).tween({ opacity: 1 }, 600, 'easeOutCubic');
  }

  updateSubtitle(text) {
    this.subtitle
      .clearTween()
      .css({ opacity: 0 })
      .text(text)
      .tween({ opacity: 0.5 }, 400, 'easeOutCubic');
  }
}
```

### 2. Glassmorphism Panel

```javascript
class GlassPanel extends Interface {
  constructor() {
    super('.glass-panel');

    this.css({
      position: 'absolute',
      background: 'rgba(6, 6, 6, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
    });
  }
}
```

### 3. Metric Display

```javascript
class MetricRow extends Interface {
  constructor(label, value) {
    super('.metric-row');

    this.label = new Interface('.label');
    this.value = new Interface('.value');

    this.css({
      display: 'flex',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 8,
      fontFamily: 'var(--ui-font-family)',
      fontSize: 'var(--ui-font-size)'
    });

    this.label.css({
      opacity: 0.5,
      textTransform: 'uppercase'
    }).text(label);

    this.value.css({
      opacity: 1
    }).text(value);

    this.add(this.label);
    this.add(this.value);
  }

  updateValue(newValue) {
    this.value.text(newValue);
  }
}
```

### 4. Tabbed Interface

```javascript
class TabbedPanel extends Interface {
  constructor(tabs) {
    super('.tabbed-panel');

    this.tabs = tabs;
    this.currentTab = tabs[0];
    this.tabButtons = new Map();
    this.tabContents = new Map();

    this.init();
  }

  init() {
    const tabBar = new Interface('.tab-bar');
    tabBar.css({
      display: 'flex',
      gap: 8,
      borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
      paddingBottom: 8,
      marginBottom: 16
    });

    // Create tab buttons
    this.tabs.forEach(tab => {
      const button = new Interface('.tab-button');
      button.css({
        padding: '4px 8px',
        cursor: 'pointer',
        opacity: tab === this.currentTab ? 1 : 0.5,
        textTransform: 'uppercase',
        fontSize: 'var(--ui-font-size)',
        fontFamily: 'var(--ui-font-family)',
        letterSpacing: '1px',
        transition: 'opacity 0.2s'
      });
      button.text(tab.name);
      button.element.addEventListener('click', () => this.switchTab(tab));

      tabBar.add(button);
      this.tabButtons.set(tab, button);

      // Create tab content
      const content = new Interface('.tab-content');
      content.css({
        display: tab === this.currentTab ? 'block' : 'none'
      });
      content.html(tab.render());

      this.tabContents.set(tab, content);
    });

    this.add(tabBar);
    this.tabContents.forEach(content => this.add(content));
  }

  switchTab(tab) {
    // Update button states
    this.tabButtons.forEach((button, t) => {
      button.css({ opacity: t === tab ? 1 : 0.5 });
    });

    // Show/hide content
    this.tabContents.forEach((content, t) => {
      content.css({ display: t === tab ? 'block' : 'none' });
    });

    this.currentTab = tab;
  }
}
```

---

## Implementation Examples

### Example 1: Harmony Response Viewer

```javascript
import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';
import { parseHarmonyResponse } from '@/utils/harmonyParser.js';

class HarmonyResponseViewer extends Interface {
  constructor() {
    super('.harmony-viewer');

    this.channels = {
      analysis: new Interface('.channel-analysis'),
      commentary: new Interface('.channel-commentary'),
      final: new Interface('.channel-final')
    };

    this.init();
  }

  init() {
    // Glassmorphism container
    this.css({
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '80%',
      maxWidth: 800,
      maxHeight: '80vh',
      background: 'rgba(6, 6, 6, 0.85)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: 24,
      overflow: 'auto',
      zIndex: 2000
    });

    // Create tabbed interface
    this.createTabs();
  }

  createTabs() {
    const tabBar = new Interface('.tab-bar');
    tabBar.css({
      display: 'flex',
      gap: 16,
      borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
      paddingBottom: 12,
      marginBottom: 20
    });

    ['analysis', 'commentary', 'final'].forEach(channelName => {
      const tab = new Interface(`.tab-${channelName}`);
      tab.css({
        cursor: 'pointer',
        padding: '6px 12px',
        textTransform: 'uppercase',
        fontSize: 'var(--ui-font-size)',
        fontFamily: 'var(--ui-font-family)',
        letterSpacing: '1px',
        opacity: 0.5,
        transition: 'opacity 0.2s'
      });
      tab.text(channelName);
      tab.element.addEventListener('click', () => this.showChannel(channelName));
      tabBar.add(tab);
    });

    this.add(tabBar);

    // Add channel content areas
    Object.entries(this.channels).forEach(([name, channel]) => {
      channel.css({
        display: 'none',
        fontFamily: 'var(--ui-font-family)',
        fontSize: 'var(--ui-font-size)',
        lineHeight: '1.6',
        color: '#fff',
        whiteSpace: 'pre-wrap'
      });
      this.add(channel);
    });

    // Show first channel
    this.showChannel('analysis');
  }

  showChannel(channelName) {
    Object.entries(this.channels).forEach(([name, channel]) => {
      channel.css({ display: name === channelName ? 'block' : 'none' });
    });
  }

  setResponse(harmonyResponse) {
    const parsed = parseHarmonyResponse(harmonyResponse);

    this.channels.analysis.text(parsed.analysis || 'No analysis available');
    this.channels.commentary.text(parsed.commentary || 'No commentary available');
    this.channels.final.text(parsed.final || 'No final response available');

    // Fade in
    this.css({ opacity: 0 }).tween({ opacity: 1 }, 400, 'easeOutCubic');
  }
}
```

### Example 2: Calendar Event Marker

```javascript
import { Point3D } from '@alienkitty/space.js/src/three/ui/Point3D.js';
import { PanelItem } from '@alienkitty/space.js/src/panels/PanelItem.js';

class CalendarEventMarker {
  constructor(scene, camera, roomMesh, event) {
    this.event = event;

    // Create 3D point
    this.point = new Point3D(roomMesh, {
      name: event.summary,
      type: this.getEventTypeLabel(event.type),
      noTracker: false
    });

    // Populate panel
    this.populatePanel();
  }

  populatePanel() {
    const { panel } = this.point;

    panel.add(new PanelItem({ type: 'spacer' }));
    panel.add(new PanelItem({ type: 'divider' }));

    // Event time
    const startTime = new Date(this.event.start).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const endTime = new Date(this.event.end).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    panel.add(new PanelItem({
      type: 'content',
      text: `<div style="display:flex;justify-content:space-between">
        <span style="opacity:0.5">TIME</span>
        <span>${startTime} - ${endTime}</span>
      </div>`
    }));

    // Location
    if (this.event.location) {
      panel.add(new PanelItem({
        type: 'content',
        text: `<div style="display:flex;justify-content:space-between">
          <span style="opacity:0.5">LOCATION</span>
          <span>${this.event.location}</span>
        </div>`
      }));
    }

    // Description
    if (this.event.description) {
      panel.add(new PanelItem({ type: 'spacer' }));
      panel.add(new PanelItem({
        type: 'content',
        text: this.event.description
      }));
    }
  }

  getEventTypeLabel(type) {
    const labels = {
      'class': 'CLASS',
      'workshop': 'WORKSHOP',
      'meeting': 'MEETING',
      'event': 'EVENT'
    };
    return labels[type] || 'EVENT';
  }
}
```

---

## Best Practices

### 1. Always Initialize Stage First

```javascript
// In main.js, before any UI components
import { Stage } from '@alienkitty/space.js/src/utils/Stage.js';
Stage.init(document.body);
```

### 2. Use CSS Variables for Consistency

```javascript
// ✅ Good
myElement.css({
  fontFamily: 'var(--ui-font-family)',
  fontSize: 'var(--ui-font-size)',
  color: 'var(--ui-color)'
});

// ❌ Avoid
myElement.css({
  fontFamily: 'Roboto Mono',
  fontSize: '10px',
  color: '#ffffff'
});
```

### 3. Uppercase for Labels, Normal for Values

```javascript
// Labels: uppercase, opacity 0.5
labelElement.css({
  textTransform: 'uppercase',
  opacity: 0.5
});

// Values: normal case, opacity 1
valueElement.css({
  opacity: 1
});
```

### 4. Animations with Tween

```javascript
// Fade in
element.css({ opacity: 0 }).tween({ opacity: 1 }, 600, 'easeOutCubic');

// Sequential animations
element
  .clearTween()
  .css({ opacity: 0 })
  .tween({ opacity: 1 }, 300, 'easeOutCubic', 200); // 200ms delay
```

### 5. Glassmorphism Styling

```javascript
const glassStyles = {
  background: 'rgba(6, 6, 6, 0.85)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
};
```

---

## Common Pitfalls

### 1. Forgetting Stage.init()
❌ Results in missing CSS variables and broken animations
✅ Call `Stage.init(document.body)` once at app start

### 2. Not Using var(--ui-*) Variables
❌ Inconsistent styling across components
✅ Use CSS variables from spacejs.css

### 3. Overuse of Colors
❌ Purple, blue, red everywhere
✅ Monochrome palette + status colors only

### 4. Heavyweight Fonts
❌ Mixing multiple font families
✅ Roboto Mono (monospace), Gothic A1 (names/captions)

---

## Integration Checklist

For any new UI feature:

- [ ] Import from `@alienkitty/space.js` (not recreating components)
- [ ] Use `Interface` as base class
- [ ] Apply space.js CSS variables
- [ ] Monochrome palette (#060606 background, white text)
- [ ] Uppercase labels, opacity 0.5
- [ ] Glassmorphism for panels/modals
- [ ] Smooth animations with `.tween()`
- [ ] Test with `Stage.init()` called

---

**Next**: Implement HarmonyResponseViewer using this guide.
