# Smart-C UI System - Quick Reference Guide

**File:** Q5UL8JFEzL4LZvY5JnAs2p | **Framework:** Space.js + Alien.js | **Date:** Dec 8, 2025

---

## 🎨 Design Tokens

### Colors
```css
--color-primary-gray: #595959;
--color-black: #000000;
--color-white: #FFFFFF;
```

### Typography
```css
--font-heading-lg: 36px;    /* Mars heading */
--font-heading-md: 19px;    /* Section titles */
--font-body: 17px;          /* Standard UI */
--font-small: 13px;         /* Descriptions */
--font-label: 12px;         /* Markers, segments */
--font-numeric: 11px;       /* Badge numbers */
```

### Spacing
```css
--space-unit: 8.026px;      /* Base unit */
--space-xs: 16.05px;        /* Outer margin */
--space-sm: 20.87px;        /* Graph padding */
--space-md: 40.13px;        /* Toggle width */
--space-lg: 80.26px;        /* Panel width */
```

---

## 📦 Component Sizes

### Navigation
| Component | Width | Height | Notes |
|-----------|-------|--------|-------|
| Tab | 35.05px | 31.05px | POL/OBL/ISO |
| Active Indicator | 18.46px | 1.20px | Underline |
| Link | 38.05px | 31.05px | Standard |

### Controls
| Component | Width | Height | Notes |
|-----------|-------|--------|-------|
| Toggle | 80.26px | 16.05px | Split 40.13px each |
| Color Picker | 16.05px | 16.05px | Square |
| Slider | variable | 0.80px | Track height |
| Dropdown | 80.26px | 16.05px | Standard |

### Display
| Component | Width | Height | Notes |
|-----------|-------|--------|-------|
| FPS Counter | ~17px | ~12px | Top-right |
| Data Card | 100-132px | 59.63px | 2-line format |
| Info Panel | 240.77px | 26.63px | Centered text |
| Badge | 13.64px | 13.64px | Number indicator |

### Graphs
| Component | Width | Height | Notes |
|-----------|-------|--------|-------|
| Circular Small | 240.77px | 240.77px | Audio/Markers |
| Circular Medium | 365.97px | 365.97px | 3D Radial |
| Circular Large | 648.53px | 648.53px | Audio Expanded |
| Linear | 1069.01px | 64.20px | Horizontal |

### Icons
| Component | Width | Height | Notes |
|-----------|-------|--------|-------|
| Standard Icon | 16.05px | 16.05px | Most icons |
| Audio Icon | 19.26px | 12.84px | Rectangular |
| Detail Button | 48.15px | 32.10px | With padding |

---

## 🎯 9 Main Sections

### 1. UI HUD Layout (583:107)
**Purpose:** Main planetary information display  
**Key Elements:** Heading, Data Cards (3), Navigation, FPS  
**URL:** [View](https://www.figma.com/design/Q5UL8JFEzL4LZvY5JnAs2p/Smart-C?node-id=583-107)

### 2. UI Floating Panel (583:412)
**Purpose:** Material & post-processing controls  
**Key Elements:** Material toggles, Sliders, Color pickers, Physics  
**URL:** [View](https://www.figma.com/design/Q5UL8JFEzL4LZvY5JnAs2p/Smart-C?node-id=583-412)

### 3. 3D Radial Graph (583:448)
**Purpose:** Circular coordinate visualization  
**Key Elements:** 365.97px graph, 6 markers, IP panel  
**URL:** [View](https://www.figma.com/design/Q5UL8JFEzL4LZvY5JnAs2p/Smart-C?node-id=583-448)

### 4. UI Components (583:630)
**Purpose:** Component library showcase  
**Key Elements:** 19 components (Reticles, Trackers, Buttons, Links)  
**URL:** [View](https://www.figma.com/design/Q5UL8JFEzL4LZvY5JnAs2p/Smart-C?node-id=583-630)

### 5. UI Details (592:640)
**Purpose:** Expanded planetary info  
**Key Elements:** Large heading, Detail text block  
**URL:** [View](https://www.figma.com/design/Q5UL8JFEzL4LZvY5JnAs2p/Smart-C?node-id=592-640)

### 6. Audio Radial (594:729)
**Purpose:** Audio frequency visualization  
**Key Elements:** 648.53px spectrum, Highs/Mids/Lows, Controls  
**URL:** [View](https://www.figma.com/design/Q5UL8JFEzL4LZvY5JnAs2p/Smart-C?node-id=594-729)

### 7. Graph Markers (594:750)
**Purpose:** Interactive marker demos  
**Key Elements:** Circular (240.77px), Linear (1069.01px), Drag labels  
**URL:** [View](https://www.figma.com/design/Q5UL8JFEzL4LZvY5JnAs2p/Smart-C?node-id=594-750)

### 8. Graphs Collection (594:785)
**Purpose:** Multiple graph variations  
**Key Elements:** 6 graph types, Markers, Segments  
**URL:** [View](https://www.figma.com/design/Q5UL8JFEzL4LZvY5JnAs2p/Smart-C?node-id=594-785)

### 9. Space.js Example (600:1007)
**Purpose:** Complete implementation  
**Key Elements:** 3 objects, Full controls, Post-processing  
**URL:** [View](https://www.figma.com/design/Q5UL8JFEzL4LZvY5JnAs2p/Smart-C?node-id=600-1007)

---

## 🎮 Implementation Settings

### Performance
```javascript
targetFPS: 120
minFPS: 60
vsyncEnabled: true
```

### Audio Processing
```javascript
frequencyBands: {
  highs: { min: 0.97, max: 0.34 },
  mids:  { min: 0.42, max: 0.33 },
  lows:  { min: 0.67, max: 0.56 }
}
chunkSize: 17
delay: 39
oscilloscope: 0.28
```

### Material Properties
```javascript
roughness: { default: 0.7, range: [0, 2] }
metalness: { default: 0.7, range: [0, 1] }
opacity:   { default: 1.0, range: [0, 1] }

types: ['Standard', 'Physical', 'Matcap']
modes: ['Solid', 'Flat', 'Wireframe', 'ToneMap']
```

### Post-Processing
```javascript
interpolation: 0.84   // Smooth transitions
smear: 1.16          // Motion blur
threshold: 0.46      // Edge detection
smooth: 0.3          // Smoothing factor
strength: 0.3        // Effect strength
radius: 0.2          // Effect radius
chroma: 2.2          // Chromatic aberration
exposure: 0.99       // Exposure control
```

### Physics
```javascript
gravity: { default: 9.8, range: [0, 20] }
enabled: false  // Toggle on/off
```

---

## 🧩 Component Library (19 Items)

### Reticles & Trackers (5)
1. **Reticle 1** - Simple center (8.03×8.03px)
2. **Reticle 2** - With IP tooltip
3. **ReticleCanvas** - Drawing area
4. **Tracker 1** - Basic (72.23×72.23px)
5. **Tracker 2** - With badge (97.91px wide)

### Display Elements (4)
6. **TargetNumber** - Numeric indicator (13.64px border)
7. **LineCanvas** - Line drawing
8. **Point 1** - Data point with IP (47×30.41px)
9. **Point 2** - Variant

### Interactive Buttons (8)
10-15. **DetailsButton 1-6** - Various states
   - Icon: 16.05×16.05px
   - Container: 48.15×32.10px
   - Some with page counter (1/6)
16-17. **MuteButton 1-2** - Audio toggle (19.26×12.84px)
18. **NavLink** - Navigation (38.05×31.05px)
19. **Link** - Generic link

---

## 🎬 Animation & Interaction

### Toggles
- **States:** Off / On (or specific labels)
- **Width:** 40.13px per state
- **Transition:** Recommended 200-300ms ease

### Sliders
- **Track:** 0.80px height
- **Thumb:** (Design dependent)
- **Range:** Variable (9.63-79.45px)
- **Update:** Real-time or on release

### Markers
- **Drag:** Interactive on some
- **Label:** Always visible (14.45px height)
- **Snap:** Optional grid alignment

### Graphs
- **Update Rate:** Tied to FPS
- **Smooth:** Use interpolation (0.84)
- **Resize:** Maintain aspect ratio

---

## 📐 Layout System

### Artboard
```
Total Width: 1800px
Content: 1444.6×865.2px
Margins: 80.26px (left/right)
Padding: 16.05px (inner)
```

### Grid
```
Columns: Flexible (not strict grid)
Gutters: Variable based on content
Alignment: Mix of left, center, right
```

### Responsive
```
Desktop: 1800px (design)
Tablet: Scale proportionally
Mobile: Requires separate design
```

---

## 🔗 External References

- **Space.js:** https://space.js.org/
- **Alien.js:** https://alien.js.org/
- **Three.js:** https://threejs.org/
- **Audio Source:** https://protonradio.com/
- **Figma File:** https://figma.com/design/Q5UL8JFEzL4LZvY5JnAs2p/Smart-C

---

## 🚀 Quick Start

### 1. Setup Dependencies
```bash
npm install three space.js alien.js
```

### 2. Basic Structure
```javascript
import { SpaceScene } from './scenes/SpaceScene';
import { UIManager } from './components/UIManager';
import { AudioProcessor } from './utils/audio-processor';

// Initialize
const scene = new SpaceScene();
const ui = new UIManager();
const audio = new AudioProcessor();

// Connect
scene.init();
ui.init(scene);
audio.init(ui);

// Render loop
function animate() {
  requestAnimationFrame(animate);
  scene.render();
  ui.update();
  audio.update();
}
animate();
```

### 3. Key Concepts
- **HUD overlays** use Alien.js for DOM elements
- **3D scenes** use Space.js/Three.js
- **Audio viz** uses Web Audio API
- **Controls** update 3D scene in real-time

---

## 📝 Notes

### Browser Support
- Chrome 90+ ✓
- Firefox 88+ ✓
- Safari 14+ ✓
- Edge 90+ ✓

### WebGL Required
- Version 2.0 minimum
- Fallback to Canvas 2D if unavailable

### Performance Tips
- Use object pooling for markers
- Batch similar draw calls
- Limit post-processing on mobile
- Cache audio frequency data

### Accessibility
- High contrast mode ready (#595959 / #000000)
- Keyboard navigation for all controls
- ARIA labels for 3D elements
- Screen reader descriptions

---

**Last Updated:** December 8, 2025  
**Version:** 1.0.0  
**Creator:** David Caballero (CODE Smart Campus)
