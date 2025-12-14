# Smart-C UI System - Component Map

A visual guide to navigate and understand the relationships between all sections of the Smart-C design system.

---

## 🗺️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         SMART-C UI SYSTEM                       │
│                    Space.js + Alien.js Framework                │
└─────────────────────────────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
    ┌────▼────┐           ┌─────▼─────┐           ┌────▼────┐
    │   HUD   │           │  CONTROLS │           │  GRAPHS │
    │ OVERLAY │           │  & PANELS │           │  & VIZ  │
    └─────────┘           └───────────┘           └─────────┘
         │                       │                       │
    ┌────┴────┐           ┌─────┴─────┐           ┌────┴────┐
    │         │           │           │           │         │
┌───▼───┐ ┌──▼──┐   ┌────▼────┐ ┌───▼────┐ ┌────▼────┐ ┌─▼──┐
│ Main  │ │Info │   │Material │ │ Audio  │ │  3D     │ │Data│
│ HUD   │ │Panel│   │Settings │ │Controls│ │ Radial  │ │Viz │
└───────┘ └─────┘   └─────────┘ └────────┘ └─────────┘ └────┘
│583:107│ │592:640│ │ 583:412 │ │594:729 │ │ 583:448 │ │594:│
│       │ │       │ │         │ │        │ │         │ │750 │
│       │ │       │ │         │ │        │ │         │ │785 │
└───────┘ └───────┘ └─────────┘ └────────┘ └─────────┘ └────┘
```

---

## 📋 Section Relationships

### Core HUD Group
```
┌────────────────────────────────────────────────┐
│ 1. UI HUD LAYOUT (583:107)                    │
│    └─ Contains: Header, Data Cards, Nav       │
│                                                │
│         ┌──────────────────────────┐          │
│         │ 5. UI DETAILS (592:640) │          │
│         │    Expanded info view    │          │
│         └──────────────────────────┘          │
└────────────────────────────────────────────────┘
```

### Settings & Controls Group
```
┌────────────────────────────────────────────────┐
│ 2. UI FLOATING PANEL (583:412)                │
│    └─ Material settings, Physics, Post-FX     │
│                                                │
│         ┌──────────────────────────┐          │
│         │ 9. SPACE.JS (600:1007) │          │
│         │    Live implementation  │          │
│         └──────────────────────────┘          │
└────────────────────────────────────────────────┘
```

### Visualization Group
```
┌────────────────────────────────────────────────┐
│ 3. 3D RADIAL GRAPH (583:448)                  │
│    └─ Circular data viz (365.97px)            │
│                                                │
│ 6. AUDIO RADIAL GRAPH (594:729)               │
│    └─ Audio spectrum (648.53px)               │
│                                                │
│ 7. GRAPH MARKERS (594:750)                    │
│    └─ Interactive markers demo                │
│                                                │
│ 8. GRAPHS COLLECTION (594:785)                │
│    └─ 6 graph type variations                 │
└────────────────────────────────────────────────┘
```

### Component Library
```
┌────────────────────────────────────────────────┐
│ 4. UI COMPONENTS (583:630)                    │
│    └─ 19 reusable components                  │
│        • Reticles (3)                          │
│        • Trackers (2)                          │
│        • Points (2)                            │
│        • Detail Buttons (6)                    │
│        • Mute Buttons (2)                      │
│        • Links (2)                             │
│        • Others (2)                            │
└────────────────────────────────────────────────┘
```

---

## 🎯 Component Usage Matrix

| Component | Used In | Count | Purpose |
|-----------|---------|-------|---------|
| FPS Counter | 1, 2, 3, 6, 9 | 5 | Performance monitoring |
| Navigation Tabs | 1, 2, 9 | 3 | Camera view selection |
| Color Picker | 2, 9 | 2 | Material color selection |
| Slider | 2, 6, 9 | 3 | Value adjustment |
| Toggle | 2, 9 | 2 | Binary state control |
| Circular Graph | 3, 6 | 2 | Radial data display |
| Linear Graph | 7, 8 | 2 | Horizontal data display |
| Markers | 3, 7, 8 | 3 | Data point indicators |
| Info Panel | 1, 3, 4 | 3 | Contextual information |
| Badge | 4, 5 | 2 | Numeric indicators |

---

## 🔄 Data Flow

```
User Input
    ↓
┌───────────────┐
│ UI Controls   │ → Toggle, Slider, ColorPicker
└───────┬───────┘
        ↓
┌───────────────┐
│ State Manager │ → Material props, Physics, Audio
└───────┬───────┘
        ↓
    ┌───┴────┐
    ↓        ↓
┌────────┐ ┌──────────┐
│ 3D     │ │ Audio    │
│ Scene  │ │ Processor│
└────┬───┘ └────┬─────┘
     ↓          ↓
┌────────────────────┐
│ Visual Output      │ → Graphs, HUD, Effects
└────────────────────┘
```

---

## 📊 Component Hierarchy

### HUD Elements
```
UI HUD Layout (583:107)
├── Header
│   ├── Branding Text
│   └── FPS Counter
├── Content Area
│   ├── Heading (H1)
│   ├── Description Block
│   │   ├── Text
│   │   └── Wikipedia Link
│   └── Data Cards (3)
│       ├── Distance from Sun
│       ├── Mass
│       └── Surface Gravity
├── Navigation
│   ├── POL Tab
│   ├── OBL Tab (Active)
│   └── ISO Tab
└── Footer
    ├── Info Button
    ├── Page Counter (1/6)
    └── Audio Indicator
```

### Settings Panel
```
UI Floating Panel (583:412)
├── Object Selector
│   ├── Title: "Floating Crystal"
│   └── Geometry: "OctahedronGeometry"
├── Visibility
│   └── Toggle: Off / Visible
├── Material
│   ├── Opacity Slider
│   ├── Side: Front / Back / Double
│   ├── Type: Standard / Physical
│   ├── Common Properties
│   │   ├── Color 1 (0x595959)
│   │   ├── Color 2 (0x000000)
│   │   ├── Roughness (0.7)
│   │   └── Metal (0.7)
│   └── Render Modes
│       ├── Flat (Off/On)
│       ├── Wire (Off/On)
│       └── Tone (Off/On)
├── Geometry Controls
│   └── Dropdown: Geometry / Matcap1
├── Physics
│   ├── Toggle: Off / Physics
│   └── Gravity Slider (4.7)
├── Animation
│   └── Toggle: Off / Animate
└── Post-Processing
    ├── Toggle: Off / On
    └── Settings (when On)
        ├── Interpolation (0.84)
        ├── Smear (1.16)
        ├── Threshold (0.46)
        ├── Smooth (0.3)
        ├── Strength (0.3)
        ├── Radius (0.2)
        └── Chroma (2.2)
```

### Audio Visualization
```
Audio Radial Graph (594:729)
├── Visual
│   ├── Circular Spectrum (648.53px)
│   └── Frequency Labels
│       ├── Highs (top-right)
│       ├── Mids (bottom)
│       └── Lows (top-left)
└── Controls
    ├── Volume (1)
    ├── Delay (39)
    ├── Frequency Bands
    │   ├── Highs Min/Max (0.97/0.34)
    │   ├── Mids Min/Max (0.42/0.33)
    │   └── Lows Min/Max (0.67/0.56)
    ├── Oscilloscope (0.28)
    ├── Chunk (17)
    └── Source
        ├── Label: "Proton Radio"
        └── URL: protonradio.com
```

### Graph System
```
Graph Types
├── Circular (3 variants)
│   ├── Small (240.77px) - Markers demo
│   ├── Medium (365.97px) - 3D radial
│   └── Large (648.53px) - Audio spectrum
└── Linear (1069.01×64.20px)
    ├── Standard (markers only)
    ├── Segmented (3 segments)
    └── Mixed (segments + markers)
```

---

## 🎨 Styling Dependencies

### Color Relationships
```
Background (0x000000)
    ↓
Surface (0x595959)
    ↓
Text/UI (0xffffff)
```

### Size Progression
```
Micro (9px)
    ↓
Numeric (11px)
    ↓
Label (12px)
    ↓
Small (13px)
    ↓
Body (15-17px)
    ↓
Medium Heading (19px)
    ↓
Large Heading (36-37px)
```

### Spacing Scale
```
0.803px  → Border/Divider
8.026px  → Base unit
16.05px  → Standard margin
40.13px  → Toggle half
80.26px  → Panel width
```

---

## 🔗 Quick Navigation

### By Function

**Need HUD elements?** → Section 1 (583:107)  
**Need settings panel?** → Section 2 (583:412)  
**Need data visualization?** → Sections 3, 7, 8  
**Need audio controls?** → Section 6 (594:729)  
**Need component reference?** → Section 4 (583:630)  
**Need full example?** → Section 9 (600:1007)

### By Component Type

**Buttons & Controls** → Sections 2, 4, 6, 9  
**Graphs & Charts** → Sections 3, 6, 7, 8  
**Text & Labels** → Sections 1, 4, 5  
**Icons & Indicators** → Sections 1, 4  
**Panels & Containers** → Sections 2, 3, 6

### By Use Case

**Building a HUD?**  
1. Start with Section 1 (UI HUD Layout)
2. Add components from Section 4 (UI Components)
3. Reference Section 5 (UI Details) for text layouts

**Building 3D controls?**  
1. Start with Section 2 (UI Floating Panel)
2. Reference Section 9 (Space.js Example)
3. Use Section 4 for toggle/slider patterns

**Building visualizations?**  
1. Choose graph type from Sections 3, 7, 8
2. Add audio features from Section 6
3. Use Section 4 for marker components

---

## 📐 Dimension Reference

### Standard Widths
- **Panel:** 80.26px
- **Info Panel:** 240.77px
- **Graph (circular):** 240.77 / 365.97 / 648.53px
- **Graph (linear):** 1069.01px
- **Content Area:** 1444.6px
- **Artboard:** 1800px

### Standard Heights
- **Toggle:** 16.05px
- **Tab:** 31.05px
- **Data Card:** 59.63px
- **Graph (linear):** 64.20px
- **Icon Button:** 32.10px
- **Content Area:** 865.2px

### Standard Sizes
- **Icon:** 16.05×16.05px
- **Badge:** 13.64×13.64px
- **Audio Icon:** 19.26×12.84px
- **Detail Button:** 48.15×32.10px

---

## 🚦 Implementation Priority

### Phase 1 - Core (Week 1-2)
1. ✅ Section 4 - Component Library
2. ✅ Section 1 - UI HUD Layout
3. ✅ Basic 3D scene setup

### Phase 2 - Controls (Week 3-4)
4. ✅ Section 2 - Material Settings Panel
5. ✅ Section 3 - 3D Radial Graph
6. ✅ Interactive state management

### Phase 3 - Audio (Week 5-6)
7. ✅ Section 6 - Audio Radial Graph
8. ✅ Web Audio API integration
9. ✅ Real-time visualization

### Phase 4 - Polish (Week 7-8)
10. ✅ Sections 7, 8 - Graph variations
11. ✅ Section 9 - Full integration
12. ✅ Performance optimization

---

## 📞 Component Directory

### Quick Lookup Table

| Need | Section | Node ID | Component |
|------|---------|---------|-----------|
| FPS display | 1, 2, 3, 6, 9 | Multiple | FPS Counter |
| Camera tabs | 1, 2, 9 | Multiple | POL/OBL/ISO |
| Page counter | 1 | 583:98 | 1/6 display |
| Color input | 2, 9 | Multiple | Color Picker |
| Value slider | 2, 6, 9 | Multiple | Slider |
| Binary toggle | 2, 9 | Multiple | Toggle |
| Circular graph | 3 | 583:441 | 3D Radial |
| Audio spectrum | 6 | 594:724 | Audio Graph |
| Horizontal graph | 7, 8 | Multiple | Linear Graph |
| Drag markers | 7 | 594:732 | Draggable |
| IP tooltip | 4 | 583:466 | Reticle 2 |
| Audio source | 6 | 594:716 | Proton Radio |
| Material panel | 2, 9 | Multiple | Settings |
| Physics controls | 2, 9 | Multiple | Gravity etc. |
| Post-FX panel | 2, 9 | Multiple | Effects |

---

**Navigation Tip:** Each section has a unique Node ID you can use to jump directly to it in Figma using the format:  
`https://www.figma.com/design/Q5UL8JFEzL4LZvY5JnAs2p/Smart-C?node-id=[NODE_ID]`

**Example:**  
`https://www.figma.com/design/Q5UL8JFEzL4LZvY5JnAs2p/Smart-C?node-id=583-107`
