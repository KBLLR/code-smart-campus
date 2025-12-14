# Smart-C UI Design System Documentation

**Figma File:** Smart-C  
**File Key:** Q5UL8JFEzL4LZvY5JnAs2p  
**Creator:** David Caballero (david.caballero@code.berlin)  
**Date Analyzed:** December 8, 2025

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Section Breakdown](#section-breakdown)
   - [1. UI HUD Layout](#1-ui-hud-layout-583107)
   - [2. UI Floating Panel Settings](#2-ui-floating-panel-settings-583412)
   - [3. 3D Radial Graph](#3-3d-radial-graph-583448)
   - [4. UI Components Library](#4-ui-components-library-583630)
   - [5. UI Details](#5-ui-details-592640)
   - [6. Audio Radial Graph](#6-audio-radial-graph-594729)
   - [7. Graph Markers](#7-graph-markers-594750)
   - [8. Graphs Collection](#8-graphs-collection-594785)
   - [9. Space.js Example](#9-spacejs-example-6001007)
3. [Design Tokens](#design-tokens)
4. [Component Inventory](#component-inventory)
5. [Implementation Notes](#implementation-notes)

---

## System Overview

**Smart-C** is a comprehensive Space.js/Alien.js UI system designed for interactive 3D space applications. The design system provides HUD overlays, real-time audio visualization, 3D object controls, material/shader configuration panels, and physics simulation interfaces.

### Key Features

- **HUD Overlays** - Space-themed information displays
- **Real-time Audio Visualization** - Frequency band analysis with oscilloscope
- **Interactive 3D Controls** - Geometry, physics, and animation settings
- **Material Configuration** - Standard and Physical material properties
- **Component Library** - 19 reusable UI elements
- **Responsive Layout** - 1800w default artboards (1444.6×865.2 content area)

### Project Context

- **Organization:** CODE Smart Campus
- **Collaboration:** Google Digital Schooling
- **Framework:** Space.js + Alien.js
- **Design Dimensions:** 1800px width (standard), 80.26px margin

---

## Section Breakdown

### 1. UI HUD Layout (583:107)

**Purpose:** Main heads-up display for planetary information and navigation

**Dimensions:** 1444.6×865.2px

**Components:**

#### Header Section
- **Branding:**
  - "CODE Smart Campus"
  - "in collaboration with Google Digital Schooling"
  - Position: Top-left (16.05, 16.05)

- **FPS Counter:**
  - Value: "120"
  - Position: Top-right (1387.61, 8.03)
  - Font size: ~12pt

#### Content Area
- **Heading:** "A11 - Tet and Ris"
  - Position: (144.46, 144.46)
  - Font size: ~19px

- **Description Block:**
  - Mars planetary information
  - Width: 353.13px
  - Height: 110.74px
  - Includes Wikipedia attribution link

- **Data Cards (3 columns):**
  1. **Distance from Sun**
     - Value: "230 million km"
     - Card width: 131.83px
  
  2. **Mass**
     - Value: "0.107 Earths"
     - Card width: 100.26px
  
  3. **Surface Gravity**
     - Value: "0.3794 Earths"
     - Card width: 121.04px

- **Navigation Tabs:**
  - POL / OBL / ISO
  - Center-aligned (653.28, 0)
  - OBL tab has active underline (1.204px height)

#### Footer Section
- **Info Button** (left)
  - Position: (601.92, 44.14)
  - Width: 240.77px

- **Instructions Button** (left-bottom)
  - Position: (601.92, 794.38)
  
- **Page Counter:**
  - Display: "1/6"
  - Icon + text format
  - Position: (15.25, 818.61)

- **Audio Indicator** (right-bottom)
  - Position: (1391.63, 820.21)
  - Icon: 19.26×12.84px

---

### 2. UI Floating Panel Settings (583:412)

**Purpose:** Advanced material and post-processing controls for 3D objects

**Dimensions:** 1444.6×865.2px

**Main Panel:**
- **Title:** "Floating Crystal"
- **Subtitle:** "OctahedronGeometry"
- **Panel Width:** 80.26px

#### Control Sections

**1. Visibility Toggle**
- Off / Visible buttons
- Width: 40.13px each

**2. Material Settings**

**Opacity Control:**
- Label: "Opacity"
- Value: "1"
- Slider with horizontal divider

**Side Selection:**
- Options: Front / Back / Double

**Material Type Toggle:**
- Standard / Physical

**3. Common Properties**

**Color Pickers:**
- Primary: 0x595959 (gray)
- Secondary: 0x000000 (black)
- Width: 16.05px (color swatch)

**Surface Properties:**
- **Roughness:** 0.7 (slider)
- **Metal:** 0.7 (slider)

**Rendering Modes:**
- Off / Flat toggle
- Off / Wire toggle  
- Off / Tone toggle

**4. Geometry Controls**
- Toggle: Off / Visible
- Dropdown: "Geometry" / "Matcap1"

**5. Physics Settings**
- Toggle: Off / Physics
- **Gravity:** 4.7 (slider)
  - Slider width: 58.99px

**6. Animation**
- Toggle: Off / Animate

**7. Background Color**
- Color: 0x000000
- Width: 16.05px

**8. Post-Processing (Hemis Tab)**

**Toggle:** Off / On

**When Enabled:**
- **Interpolation:** 0.84 (slider: 67.41px)
- **Smear:** 1.16 (slider: 23.27px)
- **Threshold:** 0.46 (slider: 36.92px)
- **Smooth:** 0.3 (slider: 24.08px)
- **Strength:** 0.3 (slider: 12.04px)
- **Radius:** 0.2 (slider: 16.05px)
- **Chroma:** 2.2 (slider: 17.66px)

**Additional Effects:**
- Off / Dirt toggle
- Off / Tone toggle
- **Exposure:** 0.99 (slider: 39.73px)
- Off / Gamma toggle

**9. Navigation**
- Camera modes: POL / OBL (active) / ISO
- Center position: (655.17, 0)

---

### 3. 3D Radial Graph (583:448)

**Purpose:** Circular data visualization for 3D coordinate systems

**Dimensions:** 1444.6×865.2px

**Main Graph:**
- **Container Size:** 365.97×365.97px
- **Position:** (539.33, 249.58)

**Graph Elements:**
- **6 Marker Points** positioned radially
- **Marker Labels:** "Marker" text
- **Center Origin Point**

**Info Panel:**
- **IP Address Display:**
  - Position: (918.92, 285.57)
  - Fields:
    - IP Address value
    - Hostname value
  - Width: 80.26px
  - Height: 46.62px

**Update Button:**
- Label: "Update"
- Height: 14.61px

**Border Elements:**
- **Value Display:** Single digit "5"
- Border size: 13.64×13.64px
- Multiple positioned at graph nodes

**FPS Counter:**
- Value display in top-right
- Standard width: 16.86px

---

### 4. UI Components Library (583:630)

**Purpose:** Reusable component showcase and reference

**Dimensions:** 1444.6×865.2px

**Component Grid:**
- **Grid Container:** 967.08×377.20px
- **Component Cell Size:** 73.84×89.89px (with label)
- **Active Area:** 73.84×73.84px

**Component Inventory (19 items):**

**Row 1 - Basic Elements:**
1. **Reticle 1** - Simple center point (8.03×8.03px)
2. **Reticle 2** - With IP info tooltip
   - Displays: 127.0.0.1 / localhost
3. **ReticleCanvas** - Larger drawing area
4. **Tracker 1** - Basic tracking element (72.23×72.23px)
5. **Tracker 2** - With number badge (97.91px wide)
   - Badge: 13.64×13.64px, displays "1"
6. **TargetNumber** - Numeric indicator
   - Border: 13.64×13.64px
7. **LineCanvas** - Line drawing area
8. **Point 1** - Data point with IP display
   - Info panel: 47×30.41px

**Row 2 - Interactive Elements:**
9. **Point 2** - Secondary data point
   - Same dimensions as Point 1
   - Multiple number badges (865.16px vertical span)
10. **DetailsButton 1** - Info icon button
    - Icon: 16.05×16.05px
    - Container: 48.15×32.10px
11. **DetailsButton 2** - Variant 2
12. **DetailsButton 3** - With page counter "1"
13. **DetailsButton 4** - With page counter "1"
14. **DetailsButton 5** - With fraction "1/6"
15. **DetailsButton 6** - With fraction "1/6"

**Row 3 - Control Elements:**
16. **MuteButton 1** - Audio control
    - Icon: 19.26×12.84px
17. **MuteButton 2** - Variant
18. **NavLink 1** - Navigation link
    - Container: 38.05×31.05px
    - Label: "Link"
19. **Link 1** - Generic link element
    - Same dimensions

**Footer Instruction:**
- Text: "Click each component to toggle"
- Position: Bottom center (601.92, 794.38)
- Width: 240.77px

---

### 5. UI Details (592:640)

**Purpose:** Expanded planetary information display

**Dimensions:** 1444.6×865.2px

**Content Block:**
- **Position:** (0, 551.36)
- **Size:** 458.44×313.80px

**Information Displayed:**
- **Heading:** "Mars" (larger text)
  - Position: (142.05, 144.46)
  - Size: ~36.92px height

- **Details Text:**
  - "Distance from Sun: 230 million km"
  - "Mass: 0.107 Earths"
  - "Surface gravity: 0.3794 Earths"
  - Position: (144.46, 186.19)
  - Text block: 169.68×36.12px

**Purpose:** Simple text-based information card for detailed planetary data

---

### 6. Audio Radial Graph (594:729)

**Purpose:** Real-time audio frequency visualization

**Dimensions:** 1444.6×876.4px

**Main Visual:**
- **Graph Container:** 648.53×648.53px
- **Position:** (398.04, 113.93)
- **Type:** Circular frequency spectrum

**Frequency Labels:**
- **Highs** - Position: (613.10, 144.07)
- **Mids** - Position: (313.99, 666.59)
- **Lows** - Position: (12.31, 144.07)
- Font size: ~12.04px

**Control Panel:**
- **Width:** 80.26px
- **Full Height:** 265.81px

**Audio Controls:**

**1. Volume Section:**
- Label: "Volume"
- Value: "1"
- Height: 20.06px

**2. Delay Control:**
- Label: "Delay"
- Value: "39"
- Divider width: 52.17px

**3. Frequency Band Controls:**

**Highs Section:**
- **Min:** 0.97 (divider: 77.85px)
- **Max:** 0.34 (divider: 27.29px)

**Mids Section:**
- **Min:** 0.42 (divider: 33.71px)
- **Max:** 0.33 (divider: 26.48px)

**Lows Section:**
- **Min:** 0.67 (divider: 53.77px)
- **Max:** 0.56 (divider: 44.94px)

**4. Oscilloscope:**
- **Value:** 0.28 (divider: 22.47px)

**5. Processing:**
- **Chunk:** 17 (divider: 44.01px)

**FPS Counter:**
- Value: "118"
- Position: Top-right

**Audio Source:**
- **Label:** "Proton Radio"
- **URL:** protonradio.com
- **Icon:** 19.26×12.84px
- Position: Bottom-right (1391.63, 831.45)

---

### 7. Graph Markers (594:750)

**Purpose:** Interactive marker positioning demonstrations

**Dimensions:** 1444.6×870.8px

**Graph Type 1 - Circular:**
- **Container:** 240.77×240.77px
- **Position:** (421.34, 260.83)

**Markers:**
- Marker 1 (draggable)
- Marker 2
- Marker 3
- "Drag me" label

**Graph Type 2 - Reference:**
- **Container:** 240.77×240.77px
- **Position:** (782.49, 258.02)

**Markers:**
- "Not me" (non-interactive)
- Marker 2

**Graph Type 3 - Linear:**
- **Container:** 1069.01×64.20px
- **Position:** (187.80, 542.93)

**7 Markers (Horizontal):**
- Marker 1
- Marker 2
- Marker 3
- Marker 4
- Marker 5
- Marker 6
- "Drag me" label

**Label Styling:**
- Font size: ~14.45px height

---

### 8. Graphs Collection (594:785)

**Purpose:** Multiple graph type demonstrations

**Dimensions:** 1444.6×871.6px

**Graph Configurations (6 layouts):**

**Graph 1 - 5 Markers:**
- Size: 1069.01×64.20px
- Position: (187.80, 132.82)
- Markers: 1, 2, 3, 4, 5
- Label offset: ~-17px above

**Graph 2 - 2 Markers:**
- Size: 1069.01×64.20px
- Position: (187.80, 237.96)
- Markers: 1, 2

**Graph 3 - Segmented:**
- Size: 1069.01×64.20px
- Position: (187.80, 346.30)
- **Segments:** 1, 2, 3
- **Marker:** 1
- Segment label size: ~12.04px

**Graph 4 - 2 Markers:**
- Size: 1069.01×64.20px
- Position: (187.80, 454.65)
- Markers: 1, 2

**Graph 5 - 3 Markers:**
- Size: 1069.01×64.20px
- Position: (187.80, 562.99)
- Markers: 1, 2, 3

**Graph 6 - Segmented + Markers:**
- Size: 1069.01×64.20px
- Position: (187.80, 671.34)
- **Segments:** 1, 2, 3
- **Markers:** 1, 2
- Both segment and marker labels

**Common Properties:**
- Consistent width: 1069.01px
- Height: 64.20px
- Label positioning: ~-16.85px above graph
- Uniform spacing between graphs

---

### 9. Space.js Example (600:1007)

**Purpose:** Complete implementation showcase from space.js.org

**Dimensions:** 1444.6×865.2px

**Source:** Converted via html.to.design (08/12/2025, 14:19:41 CET)

**Scene Objects:**

**1. Dark Planet:**
- Label: "Dark Planet"
- Geometry: "SphereGeometry"
- Position: (435.60, 443.32)

**2. Floating Crystal:**
- Label: "Floating Crystal"
- Geometry: "OctahedronGeometry"
- Position: (764.07, 348.44)
- **Control Panel Width:** 80.26px

**Crystal Settings:**
- Visibility: Off / Visible
- Material type: Standard / Physical
- Common / Map properties

**Material Properties:**
- **Colors:**
  - 0x595959
  - 0x000000
- **Roughness:** 1.43 (divider: 57.38px)
- **Metal:** 0.7 (divider: 56.18px)
- **Shading:** Off / Flat
- **Wireframe:** Off / Wire
- **Tone Mapping:** Off / Tone

**3. Abstract Cube:**
- Label: "Abstract Cube"
- Geometry: "BoxGeometry"
- Position: (1187.48, 279.94)

**Global Controls (Top-Right Panel):**

**FPS Counter:**
- Value: "120"
- Standard position

**Material Presets:**
- Matcap1 / Matcap2 toggle

**Physics:**
- Toggle: Off / Physics
- **Gravity:** 9.8 (divider: 79.45px)

**Animation:**
- Toggle: Off / Animate

**Background:**
- Color picker: 0x000000

**Scene/Post Toggle:**
- Scene / Post tabs

**Post Effects Panel:**

**Background Color:**
- Color picker: 0x000000

**Intensity:**
- Value: 1.2 (divider: 9.63px)

**Rotation Controls:**
- **Rotate X:** 0
- **Rotate Y:** 0
- **Rotate Z:** 0

**Navigation (Top-Center):**
- **Branding:** "Space.js" link
- **Camera Modes:** POL / OBL (active) / ISO
- Position: (655.17, 0)
- Tab container: 35.05×31.05px

---

## Design Tokens

### Colors

**Primary Palette:**
- `0x595959` - Medium Gray (primary surface)
- `0x000000` - Black (backgrounds, text)
- `0xffffff` - White (text, borders)

**Status Colors:**
- Active/Selected: Underline indicator (1.204px height)
- Default: No highlight
- Hover: (Implementation dependent)

### Typography

**Font Sizes:**
- **Large Heading:** ~36-37px (Mars heading)
- **Medium Heading:** ~19px (A11 - Tet and Ris)
- **Body Text:** ~15-17px (standard UI)
- **Small Text:** ~13px (descriptions, labels)
- **Label/Caption:** ~12.04px (markers, segments)
- **Numeric Display:** ~11px (value badges)
- **Micro Text:** ~9px (heading decorators)

**Font Family:**
- System font (likely -apple-system, SF Pro, or similar)

### Spacing

**Base Unit:** 8.026px (derived from component positioning)

**Common Margins:**
- Outer margin: 16.05px
- Component padding: 8.03px
- Panel spacing: 80.26px (control panels)
- Graph container: 20.87-27.29px (internal)

**Grid System:**
- Artboard: 1800px width
- Content area: 1444.6×865.2px
- Left/Right margin: 80.26px

### Borders & Dividers

**Border Styles:**
- Rounded rectangle (subtle corner radius)
- Standard width: 0.803px (horizontal dividers)

**Border Sizes:**
- Component border: 13.64×13.64px (number badges)
- Color picker: 16.05×16.05px
- Icon container: 16.05×16.05px

### Interactive Elements

**Toggle Buttons:**
- Width: 40.13px
- Height: 16.05px
- Paired layout (Off / On)

**Sliders:**
- Variable widths (9.63-79.45px based on value)
- Standard height: 0.803px (divider line)
- Handle: (Not specified in metadata)

**Icon Sizes:**
- Standard: 16.05×16.05px
- Audio: 19.26×12.84px
- Detail button: 48.15×32.10px (container)

---

## Component Inventory

### Navigation Components

**1. Tab Navigation**
- 3 options: POL / OBL / ISO
- Width per tab: 35.05px
- Height: 31.05px
- Active indicator: 1.204px underline (18.46px wide)

**2. Links**
- Standard link: 22px text width
- Container: 38.05×31.05px
- Navigation variant available

### Display Components

**3. FPS Counter**
- Value display: ~17px width
- Height: ~12.04px
- Position: Consistent top-right

**4. Data Cards**
- Variable widths: 100-132px
- Height: ~59.63px
- Two-line format:
  - Heading (9px)
  - Value (17px)

**5. Info Panel**
- Width: 240.77px
- Height: 26.63px
- Centered text: 231.14px

**6. Detail Panels**
- IP display: 47×30.41px
- Two lines:
  - IP: 15px text
  - Hostname: 13px text

### Control Components

**7. Color Picker**
- Size: 16.05×16.05px
- With value label: 41.10px wide
- Values: Hex format (0x595959)

**8. Slider Control**
- Label + value layout
- Variable track length
- Standard height: 15.25-20.06px

**9. Toggle Switch**
- Two-state: Off / On
- Width: 80.26px (full)
- Each side: 40.13px

**10. Dropdown Menu**
- Width: 80.26px
- Height: 16.05px
- Multiple states visible

### Graph Components

**11. Circular Graph**
- Diameter: 365.97px (3D radial)
- Diameter: 240.77px (audio)
- Diameter: 648.53px (audio expanded)

**12. Linear Graph**
- Width: 1069.01px
- Height: 64.20px
- Horizontal marker placement

**13. Marker Point**
- Label size: ~14.45px height
- Text width: ~41.39px

**14. Segment Label**
- Text width: ~46.54px
- Height: ~12.04px

### Utility Components

**15. Badge/Number Indicator**
- Size: 13.64×13.64px
- Inner text: 11px height
- Container padding: 4.41px (calculated)

**16. Icon Button**
- Size: 16.05×16.05px (icon)
- Container: 48.15×32.10px (with padding)

**17. Audio Indicator**
- Size: 19.26×12.84px
- With label (two-line format)

**18. Page Counter**
- Format: "1/6"
- Total width: 16.80px
- With icon: 48.15×32.10px container

**19. Reticle/Tracker**
- Small: 8.03×8.03px
- Medium: 13.64×13.64px
- Large: 72.23×72.23px

---

## Implementation Notes

### Framework Integration

**Primary Framework:** Space.js (three.js based)
- Scene management
- 3D object rendering
- Animation loops

**UI Library:** Alien.js
- DOM-based UI components
- Interactive controls
- Audio visualization

### Responsive Considerations

**Fixed Dimensions:**
- Design created at 1800px width
- Content width: 1444.6px
- 16:9 aspect ratio maintained

**Scaling Strategy:**
- Use CSS transforms for viewport adaptation
- Maintain aspect ratio
- Consider mobile breakpoints

### Performance Notes

**FPS Targeting:**
- Design shows 120 FPS
- Optimize for 60+ FPS on web
- Consider refresh rate sync

**Audio Processing:**
- Real-time frequency analysis
- Update rates: Based on chunk size (17-39)
- Smoothing values provided (0.3-1.43)

### 3D Rendering

**Material Types:**
- Standard (basic PBR)
- Physical (advanced PBR)
- Matcap (performance mode)

**Geometry Support:**
- SphereGeometry (planets)
- OctahedronGeometry (crystals)
- BoxGeometry (cubes)
- Custom geometries via canvas

**Rendering Modes:**
- Solid (default)
- Flat shading
- Wireframe
- Tone mapped

### Post-Processing

**Available Effects:**
- Hemisphere lighting
- Motion blur (smear: 1.16)
- Chromatic aberration (chroma: 2.2)
- Threshold filtering (0.46)
- Vignette/dirt overlay
- Tone mapping
- Gamma correction
- Exposure control (0.99)

**Performance Settings:**
- Interpolation: 0.84 (smooth transitions)
- Smooth factor: 0.3
- Radius: 0.2
- Strength: 0.3

### Physics Simulation

**Parameters:**
- Gravity: 4.7-9.8 (adjustable)
- Animation toggle
- Object interaction

**Considerations:**
- Performance impact of physics
- Optional physics enable/disable
- Gravity affects all objects

### Audio Visualization

**Frequency Bands:**
- Highs: Min 0.97, Max 0.34
- Mids: Min 0.42, Max 0.33
- Lows: Min 0.67, Max 0.56

**Processing:**
- Volume: 0-1 scale
- Delay: 39 (units TBD)
- Oscilloscope: 0.28
- Chunk size: 17

**Audio Source:**
- Example: Proton Radio (protonradio.com)
- Stream integration required

### State Management

**Persistent Settings:**
- Material properties
- Camera position (POL/OBL/ISO)
- Physics parameters
- Post-processing effects
- Audio settings

**Session Data:**
- Current page (1/6 navigation)
- Active component states
- Graph marker positions

### Accessibility

**Considerations:**
- High contrast mode (0x595959 / 0x000000)
- Text legibility (multiple sizes)
- Interactive element sizing (40px+ touch targets)
- Keyboard navigation for controls
- ARIA labels for 3D scene elements

### Browser Compatibility

**Target:**
- Modern browsers (Chrome, Firefox, Safari, Edge)
- WebGL 2.0 support required
- Web Audio API support

**Fallbacks:**
- Canvas 2D for unsupported WebGL
- Static images for performance mode
- Reduced effects on mobile

---

## File Structure Recommendation

```
smart-c-ui/
├── assets/
│   ├── icons/
│   │   ├── audio-indicator.svg
│   │   ├── detail-button.svg
│   │   └── page-counter.svg
│   └── images/
│       └── background-textures/
├── components/
│   ├── controls/
│   │   ├── ColorPicker.js
│   │   ├── Slider.js
│   │   └── Toggle.js
│   ├── graphs/
│   │   ├── CircularGraph.js
│   │   ├── LinearGraph.js
│   │   └── Marker.js
│   ├── hud/
│   │   ├── DataCard.js
│   │   ├── FPSCounter.js
│   │   └── Navigation.js
│   └── panels/
│       ├── AudioPanel.js
│       ├── MaterialPanel.js
│       └── SettingsPanel.js
├── scenes/
│   ├── objects/
│   │   ├── Crystal.js
│   │   ├── Cube.js
│   │   └── Planet.js
│   └── SpaceScene.js
├── styles/
│   ├── colors.css
│   ├── typography.css
│   └── layout.css
├── utils/
│   ├── audio-processor.js
│   ├── physics-engine.js
│   └── post-processing.js
└── main.js
```

---

## Next Steps

### For Development:

1. **Extract Design Assets**
   - Export all icons as SVG
   - Generate color palette CSS
   - Create typography system

2. **Build Component Library**
   - Start with base components (Toggle, Slider, ColorPicker)
   - Build graph visualizations
   - Create HUD elements

3. **Implement 3D Scene**
   - Set up Space.js/Three.js
   - Create object geometries
   - Add material systems

4. **Audio Integration**
   - Connect Web Audio API
   - Implement frequency analyzer
   - Build visualization renderer

5. **Testing & Optimization**
   - Performance profiling
   - Cross-browser testing
   - Mobile optimization

### For Design:

1. **Additional States**
   - Hover states for interactive elements
   - Loading states
   - Error states

2. **Animation Specifications**
   - Transition timings
   - Easing functions
   - Entrance/exit animations

3. **Responsive Layouts**
   - Tablet breakpoints
   - Mobile layouts
   - Portrait orientation

4. **Dark Mode Support**
   - Light theme variants
   - Auto-switching logic
   - Accessibility compliance

---

## Appendix

### Figma Node IDs

- **583:107** - UI HUD Layout
- **583:412** - UI Floating Panel Settings
- **583:448** - 3D Radial Graph
- **583:630** - UI Components Library
- **592:640** - UI Details
- **594:729** - Audio Radial Graph
- **594:750** - Graph Markers
- **594:785** - Graphs Collection
- **600:1007** - Space.js Example

### Related URLs

- Space.js: https://space.js.org/
- Alien.js: https://alien.js.org/
- Three.js: https://threejs.org/
- Proton Radio: https://protonradio.com/

### Credits

- **Designer:** David Caballero
- **Organization:** CODE Smart Campus
- **Partner:** Google Digital Schooling
- **Conversion Tool:** html.to.design
- **Documentation Date:** December 8, 2025

---

*This documentation was auto-generated from Figma metadata. For the most current information, refer to the source Figma file.*
