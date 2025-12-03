# Space.js & Alien.js - Visual Effects Integration Plan

## 🎯 Focus: Material Transitions, Animations & Hover Panels

**Keep:** ClassroomPicker (selection functionality)
**Add:** Visual polish with space.js/alien.js

---

## Visual Enhancement Strategy

### 1. Material Transitions (Alien.js) 🎨

**On Room Selection:**
```javascript
import { Tween } from '@alienkitty/space.js';

class RoomMaterialController {
  selectRoom(room) {
    // Smooth color transition with spring physics
    Tween.to(room.material.color, {
      r: selectedColor.r,
      g: selectedColor.g,
      b: selectedColor.b,
      duration: 600,
      ease: 'easeOutCubic'
    });

    // Bloom effect on selection
    this.addBloomEffect(room);
  }

  deselectRoom(room) {
    // Smooth transition back to original color
    Tween.to(room.material.color, {
      r: originalColor.r,
      g: originalColor.g,
      b: originalColor.b,
      duration: 400,
      ease: 'easeInCubic'
    });

    // Remove bloom
    this.removeBloomEffect(room);
  }
}
```

**Effects:**
- ✨ **Color transitions**: Smooth easing instead of instant change
- 🌟 **Bloom glow**: Selected room emits soft glow
- 💫 **Spring physics**: Natural bounce feel
- ⚡ **Fast response**: Sub-100ms visual feedback

---

### 2. Hover Interactions (Space.js Panels) 🎯

**On Mouse Hover:**
```javascript
import { Panel, PanelItem } from '@alienkitty/space.js';

class HoverInfoPanel {
  constructor() {
    this.panel = new Panel();
    this.isVisible = false;

    // Compact panel with key info
    this._buildPanel();
  }

  _buildPanel() {
    // Room name
    this.nameItem = new PanelItem({
      type: 'content',
      content: '<h3 class="room-name"></h3>'
    });

    // Quick stats
    this.statsItem = new PanelItem({
      type: 'content',
      content: `
        <div class="hover-stats">
          <span class="stat">🌡️ <span id="temp">--</span>°C</span>
          <span class="stat">👥 <span id="occupancy">--</span></span>
          <span class="stat">⚡ <span id="energy">--</span>kW</span>
        </div>
      `
    });

    this.panel.add(this.nameItem);
    this.panel.add(new PanelItem({ type: 'divider' }));
    this.panel.add(this.statsItem);
  }

  show(roomId, mouseX, mouseY) {
    // Position near cursor
    this.panel.element.style.left = `${mouseX + 20}px`;
    this.panel.element.style.top = `${mouseY}px`;

    // Update content
    this._updateContent(roomId);

    // Smooth slide-in
    this.panel.animateIn();
    this.isVisible = true;
  }

  hide() {
    // Smooth slide-out
    this.panel.animateOut();
    this.isVisible = false;
  }

  update() {
    if (this.isVisible) {
      this.panel.update();
    }
  }
}
```

**Panel Features:**
- 🎯 **Sleek design**: Monospace, minimal, space.js aesthetic
- ⚡ **Quick info**: Room name + live sensor snapshot
- 🎭 **Smooth animations**: Slide-in/out with easing
- 📍 **Smart positioning**: Follows cursor, stays on screen
- 🔄 **Auto-updates**: Live sensor values

---

### 3. Advanced Rendering Effects (Alien.js) 🌟

**Bloom Effect on Selection:**
```javascript
import {
  BloomCompositeMaterial,
  UnrealBloomPass
} from '@alienkitty/alien.js/three';

class BloomController {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    // Create render targets
    this.renderTarget = new THREE.WebGLRenderTarget();
    this.bloomPass = new UnrealBloomPass();

    // Configure bloom
    this.bloomPass.strength = 1.5;
    this.bloomPass.radius = 0.4;
    this.bloomPass.threshold = 0.85;
  }

  markForBloom(object) {
    // Add to bloom layer
    object.layers.enable(1);
  }

  clearBloom(object) {
    // Remove from bloom layer
    object.layers.disable(1);
  }

  render() {
    // Multi-pass rendering with bloom
    this.camera.layers.set(1); // Bloom layer only
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);

    // Composite bloom with main scene
    this.bloomPass.render(this.renderer);
  }
}
```

**Visual Effects:**
- 🌟 **Bloom glow**: Selected rooms emit soft light
- 🎯 **Selective bloom**: Only affects chosen objects
- 🎨 **Configurable**: Adjust strength, radius, threshold
- ⚡ **Performant**: Optimized multi-pass rendering

---

### 4. Camera Transitions (Space.js Tween) 📹

**Smooth Camera Movement:**
```javascript
import { Tween } from '@alienkitty/space.js';

class CameraController {
  focusOnRoom(room) {
    const targetPosition = this.calculateOptimalPosition(room);

    // Smooth camera movement with spring physics
    Tween.to(this.camera.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration: 1200,
      ease: 'easeOutCubic',
      spring: 0.8,
      damping: 0.6
    });

    // Smooth look-at transition
    Tween.to(this.controls.target, {
      x: room.position.x,
      y: room.position.y,
      z: room.position.z,
      duration: 1200,
      ease: 'easeOutCubic'
    });
  }

  resetCamera() {
    // Return to overview with smooth transition
    Tween.to(this.camera.position, {
      x: 200,
      y: 150,
      z: 200,
      duration: 1000,
      ease: 'easeInOutCubic'
    });
  }
}
```

**Camera Features:**
- 🎥 **Smooth transitions**: No jarring jumps
- 🎯 **Auto-framing**: Optimal view of selected room
- 🌊 **Spring physics**: Natural, organic movement
- ↩️ **Reset animation**: Smooth return to overview

---

## Implementation Plan

### Phase 1: Material Transitions (Week 1)

**Priority:** High visual impact, low complexity

1. **Install space.js tween engine**
   ```bash
   npm install @alienkitty/space.js
   ```

2. **Create RoomMaterialController**
   - Smooth color transitions on select/deselect
   - Spring physics for natural feel
   - Integrate with existing RoomManager

3. **Test & Refine**
   - Adjust easing curves
   - Fine-tune spring parameters
   - Performance check

**Deliverables:**
- ✅ Smooth color transitions (no instant changes)
- ✅ Natural spring physics feel
- ✅ 60fps maintained

---

### Phase 2: Hover Panels (Week 2)

**Priority:** High UX value, medium complexity

1. **Create HoverInfoPanel component**
   - Build with space.js Panel
   - Compact layout (name + key sensors)
   - Position near cursor

2. **Integrate with RoomManager**
   - Listen to hover events
   - Show panel on mouseenter
   - Hide panel on mouseleave
   - Update live sensor values

3. **Polish animations**
   - Slide-in/out with easing
   - Smooth opacity transitions
   - Smart positioning (stay on screen)

**Deliverables:**
- ✅ Sleek hover panels appear on mouse over
- ✅ Live sensor data displayed
- ✅ Smooth animations (no flicker)

---

### Phase 3: Bloom Effects (Week 3)

**Priority:** High polish, higher complexity

1. **Install alien.js**
   ```bash
   npm install @alienkitty/alien.js
   ```

2. **Create BloomController**
   - Multi-pass render pipeline
   - Selective bloom layers
   - Configure bloom parameters

3. **Integrate with selection**
   - Enable bloom on room select
   - Disable bloom on deselect
   - Smooth bloom transitions

**Deliverables:**
- ✅ Selected rooms glow with bloom
- ✅ Smooth bloom fade in/out
- ✅ Performance: 60fps maintained

---

### Phase 4: Camera Transitions (Week 4)

**Priority:** Nice-to-have polish

1. **Create CameraController**
   - Smooth position transitions
   - Look-at animations
   - Auto-framing logic

2. **Integrate with selection**
   - Focus camera on selected room
   - Smooth zoom and rotate
   - Reset to overview

**Deliverables:**
- ✅ Cinematic camera movements
- ✅ Auto-framing selected rooms
- ✅ Smooth reset animation

---

## Architecture Integration

```
CampusApp
├── RoomManager
│   ├── [Existing] Room selection logic
│   └── [NEW] RoomMaterialController (transitions)
├── Hover System
│   ├── [NEW] HoverInfoPanel (space.js)
│   └── [NEW] Hover event handlers
├── Render Pipeline
│   ├── [Existing] Three.js renderer
│   └── [NEW] BloomController (alien.js)
└── Camera System
    ├── [Existing] OrbitControls
    └── [NEW] CameraController (tweens)
```

---

## Visual Effect Showcase

### Before (Current)
- Room selection: Instant color change
- Hover: No feedback
- Camera: Manual orbit controls
- Rendering: Flat materials

### After (With Space.js/Alien.js)
- Room selection: Smooth color transition + bloom glow
- Hover: Sleek panel with live sensor data
- Camera: Cinematic transitions to selected room
- Rendering: Bloom effects on selected objects

---

## Code Organization

```
src/
├── effects/
│   ├── RoomMaterialController.js   (color transitions)
│   ├── BloomController.js          (bloom rendering)
│   └── CameraController.js         (camera animations)
├── ui/
│   ├── HoverInfoPanel.js           (space.js panel)
│   └── [existing components]
└── core/
    └── CampusApp.js                (orchestrator)
```

---

## Performance Considerations

### Optimization Strategy

1. **Tween pooling**: Reuse tween instances
2. **Bloom layers**: Only render selected objects in bloom pass
3. **Panel caching**: Keep hover panel in memory, show/hide
4. **Debounce hover**: 50ms delay to prevent flicker
5. **RAF integration**: All animations in single loop

### Target Metrics
- **FPS**: Maintain 60fps
- **Hover latency**: < 100ms
- **Selection response**: < 50ms
- **Memory**: < 50MB for effects

---

## Success Criteria

### Week 1 (Material Transitions)
- ✅ Room colors transition smoothly (not instant)
- ✅ Spring physics feel natural
- ✅ No performance degradation

### Week 2 (Hover Panels)
- ✅ Panels appear on hover with smooth animation
- ✅ Show live sensor data
- ✅ Follow cursor intelligently

### Week 3 (Bloom Effects)
- ✅ Selected rooms glow beautifully
- ✅ Bloom fades in/out smoothly
- ✅ 60fps maintained

### Week 4 (Camera)
- ✅ Cinematic camera movements
- ✅ Auto-framing works correctly
- ✅ Smooth transitions

---

## Testing Plan

1. **Visual Testing**
   - Select each room type
   - Verify smooth transitions
   - Check bloom effect quality

2. **Interaction Testing**
   - Hover over all rooms
   - Verify panel positioning
   - Check sensor data updates

3. **Performance Testing**
   - Monitor FPS with effects enabled
   - Check memory usage
   - Test on lower-end devices

4. **Edge Cases**
   - Rapid hover on/off
   - Quick selection changes
   - Multiple rooms visible

---

## Next Steps

1. **Install Dependencies**
   ```bash
   npm install @alienkitty/space.js @alienkitty/alien.js
   ```

2. **Start with Phase 1**
   - Create RoomMaterialController
   - Add smooth color transitions
   - Test and refine

3. **Iterate & Polish**
   - Get user feedback
   - Adjust parameters
   - Optimize performance

**Focus: Visual polish that enhances the existing interaction model!** ✨
