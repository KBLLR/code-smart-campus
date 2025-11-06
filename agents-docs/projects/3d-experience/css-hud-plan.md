# FE-103 — CSS HUD Labels Plan

_Draft – 2025-11-03_

## Current State Audit
- Labels originate from `cleanedLabelRegistry` and are instantiated by `LabelManager` as Three.js sprites (`createLabel` + `makeTextTexture`).
- `LabelLayoutManager` manipulates sprite positions (cluster/grid/heatmap) but assumes world-space meshes.
- Sprites inherit scene lighting/fog and require per-frame scale hacks (`updateLabelPositions`) to remain legible.
- Glow ring + canvas textures are GPU-driven; modifying typography or layout feels heavyweight and complicates accessibility.

## Target Experience
- Screen-space HUD cards anchored to rooms/sensors with CSS, not textures.
- Responsive typography, iconography, and theming via standard CSS (dark/light, status colors).
- Hover/click affordances that can trigger room focus, selection outlines, or analytics panes.
- Separation of concerns: 3D scene handles anchors & projections; DOM handles presentation + interactions.

## Proposed Architecture
```
scene (THREE)                      DOM Overlay
------------------                 ------------------------------
LabelAnchor (Object3D)   --->      <div class="hud-label" data-id="...">
   userData: { entityId, grouping }    ├─ icon/status chip
                                       ├─ title / metric
CSSHudManager                         ├─ badges (battery, alerts)
  ├─ manages <div id="hud-root">      └─ CTA (Details ▸)
  ├─ projects anchors each frame
  ├─ toggles visibility per entity
  └─ dispatches click events → scene
```

### Core Modules
1. **Anchors** (`LabelAnchor`)  
   - Lightweight `THREE.Object3D` positioned at room centroids.  
   - Replaces sprite groups; contains no geometry, only metadata.
2. **Projection Utility** (`projectWorldToScreen(camera, vector3, domElement)`)  
   - Converts world coordinates to viewport pixels, accounting for DPR + canvas offset.
3. **CSSHudManager**  
   - Maintains a `Map<entityId, { anchor, element }>`  
   - Handles creation/destruction from registry updates.  
   - On `update(camera)` iterates anchors, projects positions, sets `transform: translate3d(...)`.  
   - Applies occlusion fade when anchor faces away or is behind other geometry (optional depth test via raycast).
4. **Template Renderer** (`renderHudContent(entityData)`)  
   - Pure function returning HTML string or DOM fragment using data (friendly name, value, status pill).  
   - Allows swapping themes or customizing per category (occupancy vs. climate).
5. **Interaction Bus**  
   - Dispatches `hud:focus`, `hud:hover`, `hud:click` events that `scene.js` listens to (camera focus via `scene.userData.cameraDebug.focusOnPoint`).

### Styling Notes
- Mount a dedicated overlay node:  
  ```html
  <div id="hud-root" aria-live="polite" inert></div>
  ```  
  placed inside `#ui-shell` but above panels.
- Use CSS variables for palette alignment: `--hud-bg`, `--hud-border`, `--hud-success`, etc.
- Rely on `will-change: transform` + `transform: translate3d(x, y, 0)` for smooth positioning.
- Maintain z-index ordering by optional `translateZ` derived from anchor depth or by sorting `z-index`.
- DOM labels now expose `data-category`, `data-type`, and `data-room` attributes with category badges so future UI shells can restyle or filter without touching Three.js objects.

## Migration Strategy
1. **Phase 1 – Parallel Anchors**  
   - Keep existing sprites for fallback.  
   - Inject `LabelAnchor` objects alongside sprites to validate projection math.  
   - Prototype `CSSHudManager` mirroring a subset (e.g., occupancy sensors).
2. **Phase 2 – Full HUD Swap**  
   - Replace sprite creation with anchor + HUD element.  
   - Remove sprite scale hacks (`updateLabelPositions`) once DOM HUD stable.  
   - Add layout toggles that influence DOM classes instead of world positions (e.g., grid mode becomes CSS grid).
3. **Phase 3 – Enhancements**  
   - Introduce filtering chips, search, and Telegram-like status badges.  
   - Optional CSS3DRenderer experiment for hybrid solutions if depth cues needed.

## Data Flow Hooks
- `updateLabel(entityId, value)` updates HUD text & status (no GPU re-upload).  
- Battery or alert states can push CSS classes (`hud-label--critical`).  
- Future analytics overlays (heatmaps) can reuse anchors with additional DOM children.

## Testing & QA
- Unit-test projection utility with known camera matrices (jest + mock camera).  
- Visual regression: capture screenshot diffs (Playwright) once DOM labels replace sprites.  
- Performance budget: ensure HUD update stays <1ms for 200 labels (use `requestAnimationFrame` and throttle).

## Open Questions
- Occlusion handling: simple dot-product fade vs. raycast to check if label should be hidden.  
- Responsiveness on small screens: collapse HUD or switch to legend mode?  
- Accessibility: ensure labels are in the DOM reading order (ARIA roles, keyboard focus).

---
**Next Actions**
- [x] Create `CSSHudManager` skeleton + projection helper (`src/hud/` namespace).  
- [x] Replace sprite groups with lightweight anchors in `LabelManager`, keeping CSS HUD hydrated.  
- [x] Map HUD interactions (hover/click) to camera focus + selection UX, then retire sprite scaling loop.
