# SVG Coordinate Debugger

Visual debugging tool to diagnose discrepancies between SVG floor plan coordinates and 3D scene positioning.

## Purpose

Identify orientation and scaling issues by overlaying the SVG floor plan at multiple heights:
- **Y=0** (ground level) - Red wireframe
- **Y=20** (picking mesh height) - Green wireframe  
- **Y=40** (top of extruded blocks) - Blue wireframe

Plus yellow sphere markers showing picking mesh center positions from roomRegistry.

## Usage

### Quick Start

```bash
# Start dev server
npm run dev

# Open in browser
open http://localhost:5173/debug-coordinates.html
```

### View Modes

The debugger shows **3 split viewport panels**:

| Panel | View | Purpose |
|-------|------|---------|
| Left | **Top View** (Y-axis down) | Check XZ plane alignment |
| Middle | **Front View** (Z-axis) | Check height (Y) positioning |
| Right | **Isometric View** | Overall 3D orientation |

### Controls

**Buttons:**
- Toggle overlays at different heights (Red Y=0, Green Y=20, Blue Y=40)
- Toggle picking mesh markers (yellow spheres)
- Toggle reference grids

**Keyboard:**
- `1`, `2`, `3` - Toggle overlays
- `M` - Toggle markers
- `G` - Toggle grids

## What to Look For

### ✅ Correct Alignment
- SVG wireframes match floor plan geometry in top view
- Yellow spheres centered on room shapes at Y=20
- No rotation offset between SVG and 3D meshes

### ❌ Common Issues
- **Rotation mismatch** → Check -90° X rotation
- **Offset** → Check origin/translation
- **Scale mismatch** → Verify 0.1 scale factor
- **Flipped axis** → Check SVG Y→Z mapping

## Files

- `src/debug/SVGCoordinateDebugger.js` - Core debugger class
- `public/debug-coordinates.html` - Standalone test page
- `public/dbug/dbugmap-1.svg` - Debug SVG
- `src/debug/README.md` - This file
