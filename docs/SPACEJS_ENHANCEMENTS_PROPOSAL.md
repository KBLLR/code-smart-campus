# Space.js & Alien.js - Smart Campus Enhancements

**Research Sources:**
- [Space.js GitHub](https://github.com/alienkitty/space.js)
- [Alien.js Materials & Shaders](https://github.com/alienkitty/alien.js)

---

## 🎯 Vision: Immersive Campus HUD with AI-Powered Insights

Transform Smart Campus into a **living, breathing interface** with:
- **Generative AI campus overview** (occupancy, climate, activities)
- **Space.js HUD** with real-time metrics
- **Redesigned room panels** with integrated chat
- **Alien.js materials** for stunning visual effects
- **Smooth animations** and transitions

---

## 1. HUD System (Space.js)

### A. Campus Overview Header

```javascript
import { Header } from '@alienkitty/space.js/src/ui/Header.js';
import { HeaderInfo } from '@alienkitty/space.js/src/ui/HeaderInfo.js';

class CampusHeader extends Interface {
  constructor(campusData, sensorManager) {
    super('.campus-header');

    this.campusData = campusData;
    this.sensorManager = sensorManager;

    // Generative overview text
    this.overview = new Interface('.campus-overview');
    this.overview.css({
      fontSize: 'var(--ui-secondary-font-size)',
      letterSpacing: 'var(--ui-secondary-letter-spacing)',
      opacity: 0.8,
      lineHeight: '18px',
      maxWidth: 600
    });

    // Real-time metrics
    this.metrics = new HeaderInfo();

    this.init();
  }

  init() {
    this.css({
      position: 'absolute',
      left: 20,
      top: 20,
      right: 20
    });

    this.add(this.overview);
    this.add(this.metrics);

    this.updateOverview();
    setInterval(() => this.updateOverview(), 30000); // Every 30s
  }

  async updateOverview() {
    // Generate campus overview using AI
    const summary = await this.generateCampusSummary();
    this.overview.html(summary);
    this.overview.clearTween().css({ opacity: 0 }).tween({ opacity: 0.8 }, 600, 'easeOutCubic');
  }

  async generateCampusSummary() {
    const data = this.campusData.getSnapshot();

    // Call tier2-orchestrator for AI generation
    const response = await fetch('http://localhost:8081/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4.5-turbo',
        messages: [{
          role: 'system',
          content: 'Generate a concise, poetic 2-sentence overview of campus activity. Focus on occupancy, climate, and current events. Use present tense, monospace-friendly language.'
        }, {
          role: 'user',
          content: JSON.stringify({
            total_occupancy: data.occupancy,
            avg_temperature: data.avgTemperature,
            weather: data.weather,
            active_classes: data.activeClasses,
            time_of_day: data.timeOfDay
          })
        }],
        max_tokens: 100
      })
    });

    const result = await response.json();
    return result.choices[0].message.content;
  }
}
```

**Example Output:**
```
"25 minds collaborate across 8 laboratories at 22°C. Morning sun illuminates CS 301 Machine Learning—innovation hums."
```

---

### B. Real-Time Metrics Display

```javascript
import { Info } from '@alienkitty/space.js/src/ui/Info.js';

class CampusMetrics extends Interface {
  constructor(sensorManager) {
    super('.campus-metrics');

    this.sensorManager = sensorManager;

    this.stats = {
      occupancy: new Interface('.stat-occupancy'),
      temperature: new Interface('.stat-temperature'),
      co2: new Interface('.stat-co2'),
      energy: new Interface('.stat-energy')
    };

    this.init();
  }

  init() {
    this.css({
      position: 'absolute',
      left: 20,
      bottom: 20,
      display: 'flex',
      gap: 20,
      fontFamily: 'var(--ui-font-family)',
      fontSize: 'var(--ui-font-size)'
    });

    // Build stat displays
    Object.entries(this.stats).forEach(([key, stat]) => {
      stat.css({
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      });

      const label = new Interface('.label');
      label.css({ opacity: 0.5, fontSize: '9px' });
      label.html(key.toUpperCase());

      const value = new Interface('.value');
      value.css({ fontSize: '14px', fontWeight: 600 });
      value.addClass('stat-value');

      stat.add(label);
      stat.add(value);
      this.add(stat);
    });

    this.update();
    setInterval(() => this.update(), 5000);
  }

  update() {
    const data = this.sensorManager.getAggregate();

    this.stats.occupancy.element.querySelector('.stat-value').textContent =
      `${data.totalOccupancy}/${data.totalCapacity}`;

    this.stats.temperature.element.querySelector('.stat-value').textContent =
      `${data.avgTemperature.toFixed(1)}°C`;

    this.stats.co2.element.querySelector('.stat-value').textContent =
      `${data.avgCO2}ppm`;

    this.stats.energy.element.querySelector('.stat-value').textContent =
      `${data.energyUsage}kW`;

    // Color coding
    this.updateStatusColors(data);
  }

  updateStatusColors(data) {
    // Temperature
    const tempStatus = data.avgTemperature > 24 ? 'warning' : 'ok';
    this.setStatusColor(this.stats.temperature, tempStatus);

    // CO2
    const co2Status = data.avgCO2 > 800 ? 'warning' : 'ok';
    this.setStatusColor(this.stats.co2, co2Status);
  }

  setStatusColor(stat, status) {
    const colors = {
      ok: 'var(--ui-color-range-3)',
      warning: 'var(--ui-color-range-4)',
      error: 'var(--ui-color-range-1)'
    };

    stat.element.querySelector('.stat-value').style.color = colors[status];
  }
}
```

---

## 2. Redesigned Room Panel with Chat

### A. Three-Column Layout

```
┌──────────────────────────────────────────────────────────┐
│  ROOM PANEL: Lab A                                  [×]  │
├────────────┬──────────────────────────┬──────────────────┤
│            │                          │                  │
│  Room      │   AI Chat Interface      │   Sensors &      │
│  Data      │   (Center Focus)         │   History        │
│            │                          │                  │
│  • Name    │  ┌────────────────────┐  │  🌡️ 22.5°C       │
│  • Type    │  │ Chat messages      │  │  💨 45%          │
│  • Cap: 30 │  │ with Dr. Code      │  │  👥 15/30        │
│            │  │                    │  │                  │
│  Equipment │  └────────────────────┘  │  Previous        │
│  • 3D Prnt │  [Type message...]      │  Iterations      │
│  • Wkst 1  │                          │  • v1.2          │
│  • Wkst 2  │                          │  • v1.1          │
│            │                          │  • v1.0          │
└────────────┴──────────────────────────┴──────────────────┘
```

### B. Implementation

```javascript
import { Panel } from '@alienkitty/space.js/src/panels/Panel.js';
import { PanelItem } from '@alienkitty/space.js/src/panels/PanelItem.js';

class RoomPanelEnhanced extends Interface {
  constructor(room, sensorManager, chatManager) {
    super('.room-panel-enhanced');

    this.room = room;
    this.sensorManager = sensorManager;
    this.chatManager = chatManager;

    this.init();
  }

  init() {
    this.css({
      position: 'fixed',
      width: '90vw',
      maxWidth: 1400,
      height: '80vh',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(10, 10, 15, 0.98)',
      border: '1px solid rgba(45, 212, 191, 0.3)',
      borderRadius: 8,
      display: 'grid',
      gridTemplateColumns: '250px 1fr 300px',
      gap: 1,
      zIndex: 1000
    });

    this.createLeftColumn();   // Room data
    this.createCenterColumn();  // Chat
    this.createRightColumn();   // Sensors & history
  }

  createLeftColumn() {
    const left = new Interface('.panel-left');
    left.css({
      padding: 20,
      borderRight: '1px solid rgba(45, 212, 191, 0.2)',
      overflowY: 'auto'
    });

    // Room info
    const title = new Interface('h2');
    title.html(this.room.name);
    left.add(title);

    const description = new Interface('.description');
    description.html(this.room.metadata.description);
    description.css({
      fontSize: 'var(--ui-secondary-font-size)',
      opacity: 0.7,
      marginBottom: 20
    });
    left.add(description);

    // Capacity
    const capacity = new Interface('.capacity');
    capacity.html(`Capacity: ${this.room.metadata.capacity} people`);
    left.add(capacity);

    // Equipment list
    const equipTitle = new Interface('.equipment-title');
    equipTitle.html('Equipment');
    equipTitle.css({ marginTop: 20, marginBottom: 10, fontWeight: 600 });
    left.add(equipTitle);

    this.room.equipment.forEach(equip => {
      const item = new Interface('.equipment-item');
      item.html(`• ${equip.name}`);
      item.css({
        fontSize: 'var(--ui-secondary-font-size)',
        padding: '4px 0',
        cursor: 'pointer'
      });
      item.element.addEventListener('click', () => {
        this.chatManager.sendMessage(`Tell me about ${equip.name}`);
      });
      left.add(item);
    });

    this.add(left);
  }

  createCenterColumn() {
    const center = new Interface('.panel-center');
    center.css({
      display: 'flex',
      flexDirection: 'column',
      padding: 20
    });

    // Chat header
    const chatHeader = new Interface('.chat-header');
    chatHeader.html(`💬 Chat with ${this.room.agent.personality.name}`);
    chatHeader.css({
      fontWeight: 600,
      marginBottom: 15,
      paddingBottom: 10,
      borderBottom: '1px solid rgba(45, 212, 191, 0.2)'
    });
    center.add(chatHeader);

    // Messages container
    this.messagesContainer = new Interface('.messages');
    this.messagesContainer.css({
      flex: 1,
      overflowY: 'auto',
      marginBottom: 15,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    });
    center.add(this.messagesContainer);

    // Input area
    this.createChatInput(center);

    this.add(center);
  }

  createChatInput(parent) {
    const inputContainer = new Interface('.chat-input-container');
    inputContainer.css({
      display: 'flex',
      gap: 10,
      padding: 10,
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: 6
    });

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Ask Dr. Code anything...';
    input.className = 'chat-input';
    input.style.cssText = `
      flex: 1;
      background: transparent;
      border: none;
      color: var(--ui-color);
      font-family: var(--ui-font-family);
      font-size: var(--ui-font-size);
      outline: none;
    `;

    const sendBtn = document.createElement('button');
    sendBtn.textContent = 'Send';
    sendBtn.className = 'chat-send';
    sendBtn.style.cssText = `
      padding: 8px 16px;
      background: rgba(45, 212, 191, 0.2);
      border: 1px solid rgba(45, 212, 191, 0.5);
      color: var(--ui-color);
      font-family: var(--ui-font-family);
      cursor: pointer;
      border-radius: 4px;
    `;

    const sendMessage = async () => {
      const message = input.value.trim();
      if (!message) return;

      this.addUserMessage(message);
      input.value = '';

      const response = await this.chatManager.sendMessage(message, this.room);
      this.addAgentMessage(response);
    };

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    inputContainer.element.appendChild(input);
    inputContainer.element.appendChild(sendBtn);
    parent.add(inputContainer);
  }

  addUserMessage(text) {
    const msg = new Interface('.message.user-message');
    msg.html(`<strong>You:</strong> ${text}`);
    msg.css({
      padding: 10,
      background: 'rgba(45, 212, 191, 0.1)',
      borderRadius: 6,
      borderLeft: '3px solid var(--ui-color-range-3)'
    });
    this.messagesContainer.add(msg);
    this.scrollToBottom();
  }

  addAgentMessage(text) {
    const msg = new Interface('.message.agent-message');
    msg.html(`<strong>${this.room.agent.personality.name}:</strong> ${text}`);
    msg.css({
      padding: 10,
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 6,
      borderLeft: '3px solid var(--ui-color-range-2)'
    });
    this.messagesContainer.add(msg);
    this.scrollToBottom();
  }

  scrollToBottom() {
    this.messagesContainer.element.scrollTop = this.messagesContainer.element.scrollHeight;
  }

  createRightColumn() {
    const right = new Interface('.panel-right');
    right.css({
      padding: 20,
      borderLeft: '1px solid rgba(45, 212, 191, 0.2)',
      overflowY: 'auto'
    });

    // Live sensors
    const sensorsTitle = new Interface('h3');
    sensorsTitle.html('Live Sensors');
    sensorsTitle.css({ marginBottom: 15, fontSize: '12px' });
    right.add(sensorsTitle);

    this.sensorsContainer = new Interface('.sensors-live');
    this.updateSensors();
    setInterval(() => this.updateSensors(), 5000);
    right.add(this.sensorsContainer);

    // Previous iterations
    const historyTitle = new Interface('h3');
    historyTitle.html('Previous Iterations');
    historyTitle.css({ marginTop: 30, marginBottom: 15, fontSize: '12px' });
    right.add(historyTitle);

    const iterations = ['v1.2', 'v1.1', 'v1.0'];
    iterations.forEach(version => {
      const item = new Interface('.iteration-item');
      item.html(`• ${version}`);
      item.css({
        fontSize: 'var(--ui-secondary-font-size)',
        padding: '4px 0',
        opacity: 0.6,
        cursor: 'pointer'
      });
      item.element.addEventListener('click', () => {
        console.log(`Load iteration ${version}`);
      });
      right.add(item);
    });

    this.add(right);
  }

  updateSensors() {
    this.sensorsContainer.empty();

    this.room.sensors.forEach(sensor => {
      const item = new Interface('.sensor-item');
      item.css({
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid rgba(45, 212, 191, 0.1)'
      });

      const label = new Interface('.sensor-label');
      label.html(sensor.type);
      label.css({ fontSize: '11px', opacity: 0.7 });

      const value = new Interface('.sensor-value');
      value.html(`${sensor.current_value}${sensor.unit}`);
      value.css({
        fontSize: '12px',
        fontWeight: 600,
        color: sensor.status === 'ok' ? 'var(--ui-color-range-3)' : 'var(--ui-color-range-4)'
      });

      item.add(label);
      item.add(value);
      this.sensorsContainer.add(item);
    });
  }
}
```

---

## 3. Materials & Visual Effects (Alien.js)

### A. Room Material Enhancements

```javascript
import { UnrealBloomPass } from '@alienkitty/alien.js/src/three/materials/UnrealBloomBlurMaterial.js';
import { ChromaticAberrationMaterial } from '@alienkitty/alien.js/src/three/materials/ChromaticAberrationMaterial.js';
import { FresnelMaterial } from '@alienkitty/alien.js/src/three/materials/FresnelMaterial.js';

class RoomMaterialController {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.setupPostProcessing();
  }

  setupPostProcessing() {
    // Bloom for selected rooms
    this.bloomPass = new UnrealBloomPass();
    this.bloomPass.strength = 1.2;
    this.bloomPass.radius = 0.4;
    this.bloomPass.threshold = 0.85;

    // Chromatic aberration for hover
    this.chromaticAberration = new ChromaticAberrationMaterial();
    this.chromaticAberration.uniforms.maxDistortion.value = 0.01;
  }

  // Apply Fresnel glow to room on hover
  applyFresnelGlow(roomMesh) {
    const originalMaterial = roomMesh.material;

    const fresnelMaterial = new FresnelMaterial({
      color: new THREE.Color('#2dd4bf'),
      fresnelPower: 2.0,
      rimColor: new THREE.Color('#ffffff')
    });

    // Blend with original
    roomMesh.material = fresnelMaterial;

    // Animate in
    this.animateMaterialProperty(fresnelMaterial, 'opacity', 0, 0.3, 400);

    return () => {
      // Restore original
      this.animateMaterialProperty(fresnelMaterial, 'opacity', 0.3, 0, 400, () => {
        roomMesh.material = originalMaterial;
      });
    };
  }

  // Bloom glow on selection
  enableBloomForRoom(roomMesh) {
    roomMesh.layers.enable(1); // Bloom layer
    this.bloomPass.enabled = true;
  }

  disableBloomForRoom(roomMesh) {
    roomMesh.layers.disable(1);
  }

  animateMaterialProperty(material, property, from, to, duration, onComplete) {
    // Use Space.js tween
    const obj = { value: from };
    tween(obj, { value: to }, duration, 'easeOutCubic', () => {
      if (onComplete) onComplete();
    }, () => {
      material[property] = obj.value;
    });
  }
}
```

### B. Animated Transitions

```javascript
// Smooth room transitions with motion blur
import { MotionBlurCompositeMaterial } from '@alienkitty/alien.js/src/three/materials/MotionBlurCompositeMaterial.js';

class CameraTransitionController {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;

    this.motionBlur = new MotionBlurCompositeMaterial();
    this.motionBlur.uniforms.velocityFactor.value = 0.8;
  }

  focusOnRoom(room, duration = 1200) {
    const targetPosition = this.calculateOptimalPosition(room);

    // Enable motion blur during transition
    this.motionBlur.enabled = true;

    // Camera movement with spring physics
    tween(this.camera.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration,
      ease: 'easeOutCubic',
      spring: 0.7,
      damping: 0.5,
      onComplete: () => {
        this.motionBlur.enabled = false;
      }
    });

    // Look-at transition
    tween(this.controls.target, {
      x: room.position.x,
      y: room.position.y,
      z: room.position.z,
      duration,
      ease: 'easeOutCubic'
    });
  }

  calculateOptimalPosition(room) {
    // Position camera for best view of room
    const offset = new THREE.Vector3(15, 10, 15);
    return room.position.clone().add(offset);
  }
}
```

---

## 4. Animation System

### A. Entrance Animations

```javascript
// Staggered room appearance on load
class RoomAnimationController {
  constructor(rooms) {
    this.rooms = rooms;
  }

  animateRoomsIn() {
    const duration = 800;
    const stagger = 100;

    this.rooms.forEach((room, i) => {
      // Start hidden
      room.mesh.scale.set(0, 0, 0);
      room.mesh.material.opacity = 0;
      room.mesh.material.transparent = true;

      // Staggered scale + fade in
      setTimeout(() => {
        tween(room.mesh.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration,
          ease: 'easeOutElastic'
        });

        tween(room.mesh.material, {
          opacity: 1,
          duration,
          ease: 'easeOutCubic'
        });
      }, i * stagger);
    });
  }

  pulseRoom(room) {
    // Gentle breathing animation
    const basScale = { x: 1, y: 1, z: 1 };
    const targetScale = { x: 1.02, y: 1.02, z: 1.02 };

    const pulse = () => {
      tween(room.mesh.scale, targetScale, 1000, 'easeInOutSine', () => {
        tween(room.mesh.scale, baseScale, 1000, 'easeInOutSine', pulse);
      });
    };

    pulse();
  }
}
```

---

## 5. Implementation Roadmap

### Phase 1: HUD System (Week 1)
- ✅ Campus overview header with AI-generated summary
- ✅ Real-time metrics display (occupancy, temp, CO2, energy)
- ✅ Smooth fade-in animations

### Phase 2: Room Panel Redesign (Week 2)
- ✅ Three-column layout (data, chat, sensors)
- ✅ Integrated chat interface with tier2-orchestrator
- ✅ Live sensor updates in right column
- ✅ Previous iterations history

### Phase 3: Materials & Effects (Week 3)
- ✅ Fresnel glow on hover
- ✅ Bloom effect on selection
- ✅ Chromatic aberration transitions
- ✅ Motion blur during camera movement

### Phase 4: Polish & Optimization (Week 4)
- ✅ Staggered entrance animations
- ✅ Breathing/pulse effects for active rooms
- ✅ Performance optimization
- ✅ Responsive design

---

## Sources

- [Space.js GitHub](https://github.com/alienkitty/space.js) - Minimal monospace UI library
- [Alien.js GitHub](https://github.com/alienkitty/alien.js) - 3D materials and shaders

This proposal transforms Smart Campus into an **immersive, AI-powered interface** with stunning visuals and seamless interactions! 🚀
