# Continuation Prompt for Next Agent

**From:** ToonShaderAgent (Session: claude/toon-shader-implementation-012MRm1o8xoPYzEL4SuxdZNL)
**To:** Next Agent
**Date:** 2025-11-19
**Branch:** `claude/toon-shader-implementation-012MRm1o8xoPYzEL4SuxdZNL`

---

## 🎯 Mission Overview

You are continuing work on the **Smart Campus Room & Classroom Experience** system. Two major work streams are ready for implementation:

1. **🔴 CRITICAL:** Scene rendering system integration (1 hour to unlock 3 scene views)
2. **🟠 HIGH PRIORITY:** Classroom View UI implementation (architecture complete, UI missing)

---

## Current System Status

### ✅ COMPLETE (Ready to Use)

#### Toon Shader System
- **File:** `src/three/materials/ToonShaderMaterial.js` (228 lines)
- **Status:** ✅ TSL-based toon shader compiles and renders correctly
- **Features:** Cel-shading, rim lighting, occupancy glow, height gradients
- **Integration:** Material registry preset `"roomToon"`
- **Usage:** Works with RoundedBoxGeometry room meshes (50+ per scene)

#### Scene System Architecture
- **Files:** `shared/scenes/{geospatial,backdrop,projectorLight}/index.ts`
- **Status:** ✅ All 3 scenes are code-complete with full lifecycle management
- **Features:**
  - **Geospatial:** Sun/Moon lights, atmosphere, TSL gradients
  - **Backdrop:** WebGPU area light aesthetic, tone mapping
  - **Projector:** White canvas materials, spotlight with 4K shadows
- **Shared Components:** CampusAssetLoader, SceneFactory, SceneBase

#### Classroom View Data Model
- **Schema:** `src/data/schemas/ClassroomView.schema.json` (199 lines)
- **Status:** ✅ Complete JSON Schema with 7 sections defined
- **Sections:** Header, Chat (3D canvas), Presence, Sensors, Calendar, History, Integrations
- **Example:** `src/data/examples/classroom-view-peace.json`
- **Architecture:** Fully documented in `docs/ARCHITECTURE.md` (3600+ lines)

#### Room Personality System
- **Schema:** `src/data/schemas/RoomPersonality.schema.json`
- **Data:** `src/data/mappings/rooms_personalities.json` (30+ room personalities)
- **Status:** ✅ Rich personality data ready for OpenAI integration
- **Features:** Avatar, backstory, traits, tone, function tools

#### Other Complete Systems
- ✅ Material Registry with WebGPU support
- ✅ SVG → RoundedBoxGeometry room generation
- ✅ Home Assistant sensor integration
- ✅ Student Profile schema
- ✅ Calendar/Reservation schema
- ✅ OpenAI integration schema

---

### ❌ NOT IMPLEMENTED (Your Tasks)

#### 1. Scene Rendering Integration (CRITICAL)
- **Status:** ❌ Scenes build successfully but are INVISIBLE
- **Root Cause:** `main.js:1702` animation loop doesn't call `sceneFactory.render()`
- **Impact:** All 3 scene views (Geospatial, Backdrop, Projector) appear blank
- **Fix Time:** 1 hour (10 lines of code)

#### 2. Classroom View UI Components
- **Status:** ❌ Schema and architecture complete, but NO UI components exist
- **Missing:**
  - ClassroomViewManager component
  - ChatSection with 3D canvas
  - PresenceSection
  - SensorsSection (partial - SensorPanel.js exists but not integrated)
  - CalendarSection
  - HistorySection
  - IntegrationsSection
- **Impact:** Users cannot enter classroom view for any room
- **Estimated Time:** 8-12 hours for complete implementation

#### 3. OpenAI Chat Integration
- **Status:** ❌ Schema complete, function tools defined, but no backend/frontend integration
- **Missing:**
  - OpenAI proxy server with function calling
  - Chat message persistence
  - Room personality prompt construction
  - Voice interaction (STT/TTS)
- **Estimated Time:** 6-8 hours

#### 4. Camera/Picking Integration for Scenes
- **Status:** ❌ OrbitControls use `setup.cam`, scenes create own cameras
- **Impact:** Controls don't work properly when scene system is active
- **Estimated Time:** 1.5 hours (after scene rendering fixed)

---

## 🚨 CRITICAL PATH: Fix Scene Rendering First

**Before doing ANYTHING else, fix the scene rendering loop.**

### Why This is Critical:
- Blocks all 3 scene views from being visible
- Simple fix (10 lines) unlocks hours of work
- No other scene work can be tested until this is done

### Step-by-Step Instructions:

**File:** `src/main.js:1702`

**1. Add clock instance (top of file):**
```javascript
const clock = new THREE.Clock();
```

**2. Update loop() function:**
```javascript
function loop() {
  requestAnimationFrame(loop);

  // Calculate delta time
  const deltaTime = clock.getDelta();

  // Update existing systems
  setup.update?.();
  setup.stats?.update();

  // NEW: Update scene factory if active
  if (window.sceneFactory) {
    window.sceneFactory.update(deltaTime);
  }

  // Update labels/HUD (use active scene camera if available)
  const activeCamera = window.sceneFactory?.getActive()?.camera || setup.cam;
  if (labelManager?.useSprites) {
    labelManager.updateLabelPositions(activeCamera);
  }
  hudManager?.update(activeCamera);

  // NEW: Render active scene OR fallback to legacy
  if (window.sceneFactory && window.sceneFactory.getActive()) {
    // Render scene factory's active scene
    window.sceneFactory.render();
  } else if (postProcessor) {
    // Legacy postprocessing
    postProcessor.render();
  } else if (setup.re && scene && setup.cam) {
    // Legacy direct render
    setup.re.render(scene, setup.cam);
  }
}
```

**3. Update window resize handler:**
```javascript
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Existing resize logic
  setup.re.setSize(width, height);
  setup.cam.aspect = width / height;
  setup.cam.updateProjectionMatrix();

  // NEW: Resize scene factory
  if (window.sceneFactory) {
    window.sceneFactory.onWindowResize(width, height);
  }
});
```

**4. Test:**
- Click "Geospatial" → should see campus with sun/moon lights
- Click "Backdrop" → should see darker aesthetic with area light
- Click "Projector" → should see white canvas rooms with spotlight
- Verify no console errors

**Time:** 30 minutes to implement + 30 minutes to test and debug

**Documentation:** Full details in `docs/SCENE_IMPLEMENTATION_TASKS.md` Phase 1

---

## 🎨 HIGH PRIORITY: Implement Classroom View UI

**After scenes render correctly, implement the Classroom View UI.**

### Overview

The Classroom View is the **immersive experience** that appears when a user clicks "Enter" on a room. It provides:
- Real-time chat with room's AI personality
- Live presence tracking (who's in the room)
- Sensor data visualization
- Room calendar and reservations
- Activity history timeline
- MCP integrations (Notion, Slack, Figma, GitHub)

### Architecture Summary

**Layout:** CSS Grid with 7 responsive sections
**State Management:** Consider Zustand or Jotai for classroom state
**3D Canvas:** Three.js canvas embedded in chat section (shader ball representing room personality)

### What Already Exists

✅ **Complete JSON Schema** - `src/data/schemas/ClassroomView.schema.json`
✅ **Example Config** - `src/data/examples/classroom-view-peace.json`
✅ **Architecture Docs** - `docs/ARCHITECTURE.md` sections 5-6 (pages 30-80)
✅ **Room Personalities** - `src/data/mappings/rooms_personalities.json`
✅ **SensorPanel Component** - `src/ui/components/molecules/SensorPanel.js` (partial)

### What You Need to Build

#### 1. ClassroomViewManager (Core Component)

**File:** `src/ui/managers/ClassroomViewManager.js`

**Responsibilities:**
- Load classroom config for given room_id
- Orchestrate 7 section components
- Manage CSS Grid layout (responsive)
- Handle section visibility/permissions
- Provide API for opening/closing classroom view

**API:**
```javascript
const classroomManager = new ClassroomViewManager({
  roomId: 'b3peace',
  container: document.getElementById('classroom-container'),
  onClose: () => { /* return to campus view */ }
});

await classroomManager.init();
classroomManager.show();
```

**CSS Grid Layout:**
```
Desktop:
┌─────────────────────────────────┐
│         header                  │
├───────────┬─────────────────────┤
│ presence  │       chat          │
│           │  (with 3D canvas)   │
├───────────┼─────────────────────┤
│  sensors  │      calendar       │
├───────────┼─────────────────────┤
│  history  │   integrations      │
└───────────┴─────────────────────┘

Mobile: Single column, collapsible sections
```

#### 2. ChatSection Component

**File:** `src/ui/components/organisms/ChatSection.js`

**Features:**
- Message history display (student ↔ room AI)
- Text input with send button
- Voice input button (future: STT)
- **3D Canvas** - Embedded Three.js renderer with shader ball
- Typing indicators
- Message timestamps

**3D Canvas (Shader Ball):**
- Small Three.js scene (300x300px) embedded in chat
- Floating shader ball representing room personality
- Reacts to conversation mood (color/movement changes)
- Uses room's avatar color from personality data
- Upgrade path: shader ball → 2D avatar → 3D talking avatar

**Integration:**
```javascript
// Get room personality
const personality = roomPersonalities[roomId];

// Initialize chat with personality
const chatSection = new ChatSection({
  roomId,
  personality,
  onSendMessage: async (message) => {
    // TODO: Call OpenAI API with room personality system prompt
    const response = await openAIProxy.chat(roomId, message);
    return response;
  }
});
```

#### 3. PresenceSection Component

**File:** `src/ui/components/organisms/PresenceSection.js`

**Features:**
- List of users currently in the room
- Avatar badges with online status
- Total user count
- Real-time updates via WebSocket
- Privacy-aware (respects student presence settings)

**Data Source:**
- WebSocket: `ws://localhost:8080/presence/${roomId}`
- Event: `{ type: 'user_joined', user_id, timestamp }`
- Event: `{ type: 'user_left', user_id, timestamp }`

#### 4. SensorsSection Component

**File:** `src/ui/components/organisms/SensorsSection.js`

**Features:**
- Real-time sensor values (temperature, humidity, CO2, occupancy)
- Comfort score indicator
- Historical charts (last 24h)
- Display mode: compact | detailed | chart
- Uses existing SensorPanel.js as base

**Integration:**
```javascript
// Reuse existing sensor data pipeline
import { DataPipeline } from '@data/DataPipeline.js';
import { haClient } from '@home_assistant/haClient.js';

const sensorSection = new SensorsSection({
  roomId,
  dataPipeline: DataPipeline,
  haClient,
  displayMode: 'detailed',
  showHistorical: true
});
```

#### 5. CalendarSection Component

**File:** `src/ui/components/organisms/CalendarSection.js`

**Features:**
- Mini calendar view (week view default)
- Upcoming events list
- Quick reserve button
- Conflict detection (visual indicators)
- Integration with CalendarReservation schema

**UI Library:** Consider FullCalendar.js or build custom

#### 6. HistorySection Component

**File:** `src/ui/components/organisms/HistorySection.js`

**Features:**
- Timeline view of room activities
- Event types: classes, workshops, study sessions, chats, resources
- Searchable and filterable
- Time range selector (today, week, month, all)
- Display mode: timeline | list | grid

#### 7. IntegrationsSection Component

**File:** `src/ui/components/organisms/IntegrationsSection.js`

**Features:**
- MCP integration cards (Notion, Slack, Figma, GitHub)
- OAuth connection status
- Quick access to linked resources
- Enable/disable per integration
- Resource previews (e.g., linked Notion pages, Slack threads)

---

## 📋 Implementation Roadmap

### Phase 1: Scene Rendering (CRITICAL - 1 hour)
1. ✅ Read `SCENE_IMPLEMENTATION_TASKS.md` Phase 1
2. ✅ Fix `main.js:1702` animation loop
3. ✅ Fix window resize handler
4. ✅ Test all 3 scenes render correctly

### Phase 2: Camera & Picking Integration (HIGH - 3 hours)
1. ✅ Read `SCENE_IMPLEMENTATION_TASKS.md` Phases 2-3
2. ✅ Decide camera strategy (shared vs per-scene)
3. ✅ Update OrbitControls integration
4. ✅ Update raycaster to use active scene
5. ✅ Update RoomsManager for scene meshes

### Phase 3: Classroom View Core (HIGH - 8 hours)
1. ✅ Create ClassroomViewManager
2. ✅ Implement ChatSection with 3D shader ball
3. ✅ Implement PresenceSection
4. ✅ Implement SensorsSection (enhance existing SensorPanel)
5. ✅ Wire up room entry action (click "Enter" → open classroom view)
6. ✅ Test classroom view with Peace room (b.3)

### Phase 4: Classroom View Advanced (MEDIUM - 6 hours)
1. ✅ Implement CalendarSection
2. ✅ Implement HistorySection
3. ✅ Implement IntegrationsSection
4. ✅ Add responsive layout (mobile/tablet)
5. ✅ Add section collapse/expand
6. ✅ Polish UX (transitions, loading states)

### Phase 5: OpenAI Chat Integration (MEDIUM - 8 hours)
1. ✅ Create OpenAI proxy server
2. ✅ Implement room personality prompt construction
3. ✅ Implement function tool execution (8 standard tools)
4. ✅ Wire chat to OpenAI API
5. ✅ Add conversation session management
6. ✅ Test chat with room personalities

### Phase 6: Polish & Extensions (LOW - 6 hours)
1. ✅ Scene transition effects
2. ✅ Loading indicators
3. ✅ Voice interaction (STT/TTS)
4. ✅ Material switching UI
5. ✅ Performance optimization

**Total Estimated Time:** 32 hours

---

## 📚 Key Documents to Review

### Must Read (Before Starting)
1. **`docs/SCENE_IMPLEMENTATION_TASKS.md`** - Step-by-step scene integration guide (Phase 1 CRITICAL)
2. **`docs/HANDOFF_TOONSHADER.md`** - Complete context from previous agent
3. **`docs/ARCHITECTURE.md`** - System architecture (focus on sections 5-6 for Classroom View)

### Reference (As Needed)
4. **`docs/SCENE_ARCHITECTURE_AUDIT.md`** - Scene system analysis
5. **`docs/SCHEMAS_INDEX.md`** - All schema documentation
6. **`src/data/schemas/ClassroomView.schema.json`** - Classroom view spec
7. **`src/data/examples/classroom-view-peace.json`** - Example classroom config

---

## 🔧 Technical Stack

### Frontend
- **3D Rendering:** Three.js (WebGPU + WebGL fallback)
- **UI Framework:** Vanilla JS (current) or React (if migrating)
- **State Management:** Consider Zustand or Jotai for classroom state
- **Charts:** Chart.js or Recharts for sensor historical data
- **Calendar:** FullCalendar.js or custom implementation

### Backend (To Be Implemented)
- **API:** Express.js or Fastify
- **Database:** PostgreSQL (with TimescaleDB for sensor time-series)
- **Real-time:** WebSocket (ws or Socket.io)
- **OpenAI:** OpenAI Node SDK
- **Sensors:** Home Assistant REST + WebSocket

### Integration
- **OpenAI:** Function calling with 8 standard room tools
- **MCP:** OAuth-based integrations (Notion, Slack, Figma, GitHub)
- **Home Assistant:** Existing integration via haClient.js

---

## ⚠️ Known Issues & Blockers

### Critical
- ❌ **Scene rendering loop not integrated** - BLOCKS all scene testing
- ❌ **No Classroom View UI** - BLOCKS room entry experience
- ❌ **No OpenAI backend** - BLOCKS chat functionality

### High Priority
- ⚠️ Camera/controls not integrated with scene system
- ⚠️ Picking only works with legacy scene
- ⚠️ Labels/HUD don't update for active scene

### Medium Priority
- ⚠️ No scene transition effects
- ⚠️ No loading indicators
- ⚠️ CampusAssetLoader has hardcoded material type

### Low Priority
- ℹ️ No voice interaction (STT/TTS)
- ℹ️ No material switching UI
- ℹ️ No performance optimization for scene switching

---

## ✅ Testing Checklist

### After Phase 1 (Scene Rendering)
- [ ] Geospatial scene visible with sun/moon lights
- [ ] Backdrop scene visible with area light aesthetic
- [ ] Projector scene visible with white canvas + spotlight
- [ ] Scene switcher buttons work without errors
- [ ] No console errors during scene switch
- [ ] Frame rate stable (60fps target)

### After Phase 3 (Classroom View Core)
- [ ] Click "Enter" on a room → classroom view opens
- [ ] Header shows room name and avatar
- [ ] Chat section displays with 3D shader ball
- [ ] Presence section shows online users (or placeholder)
- [ ] Sensors section shows real-time sensor data
- [ ] Can send chat messages (mock response until OpenAI integrated)
- [ ] Can close classroom view and return to campus
- [ ] Responsive layout works on mobile/tablet

### After Phase 5 (OpenAI Chat)
- [ ] Chat messages receive AI responses from room personality
- [ ] Room personality tone/traits are evident in responses
- [ ] Function tools can be called (e.g., "What's the temperature?")
- [ ] Conversation context is maintained across messages
- [ ] Voice input works (if implemented)

---

## 🎯 Success Metrics

**Scene System Integration:**
- ✅ All 3 scenes render correctly
- ✅ Scene switching is smooth (no flickering)
- ✅ Controls work in all scenes
- ✅ Picking/highlighting works in all scenes
- ✅ 60fps maintained during scene switch

**Classroom View Implementation:**
- ✅ Classroom view opens for any room
- ✅ All 7 sections render correctly
- ✅ 3D shader ball displays in chat
- ✅ Real-time sensor data updates
- ✅ Presence tracking shows online users
- ✅ Responsive layout works on all devices

**OpenAI Chat Integration:**
- ✅ Room personalities respond in character
- ✅ Function tools execute correctly
- ✅ Conversation feels natural and contextual
- ✅ Response time < 3 seconds
- ✅ Error handling works (API failures, rate limits)

---

## 💡 Helpful Tips

### Scene Rendering Debugging
1. Check `window.sceneFactory` exists in browser console
2. Check `sceneFactory.getActive()` returns scene object
3. Verify `scene.group.visible === true`
4. Check `scene.group.children.length > 0`

### Classroom View Debugging
1. Log classroom config loaded from schema
2. Verify room personality data loads correctly
3. Check 3D canvas initializes without WebGL errors
4. Monitor WebSocket connection status for presence/sensors
5. Test with Peace room (b.3) first - has complete example data

### OpenAI Integration Debugging
1. Log system prompt construction (verify personality applied)
2. Test function tools individually before integrating
3. Monitor token usage to avoid rate limits
4. Implement retry logic for API failures
5. Cache conversation sessions to reduce API calls

---

## 🚀 Quick Start Commands

```bash
# 1. Checkout the branch
git checkout claude/toon-shader-implementation-012MRm1o8xoPYzEL4SuxdZNL

# 2. Review the handoff
cat docs/HANDOFF_TOONSHADER.md

# 3. Read the critical task
cat docs/SCENE_IMPLEMENTATION_TASKS.md | head -n 200

# 4. Open main.js and fix the render loop
code src/main.js

# 5. Test the scenes
npm run dev
# Then click scene switcher buttons: Geospatial, Backdrop, Projector

# 6. Once scenes work, start implementing ClassroomViewManager
mkdir -p src/ui/managers
touch src/ui/managers/ClassroomViewManager.js
```

---

## 📞 Questions? Check These Resources

### Scene Rendering Issues
- **Guide:** `docs/SCENE_IMPLEMENTATION_TASKS.md` Phase 1
- **Audit:** `docs/SCENE_ARCHITECTURE_AUDIT.md`
- **Code:** `shared/engine/SceneFactory.ts`

### Classroom View Architecture
- **Schema:** `src/data/schemas/ClassroomView.schema.json`
- **Example:** `src/data/examples/classroom-view-peace.json`
- **Docs:** `docs/ARCHITECTURE.md` (sections 5-6)

### Room Personalities
- **Schema:** `src/data/schemas/RoomPersonality.schema.json`
- **Data:** `src/data/mappings/rooms_personalities.json`
- **OpenAI:** `src/data/schemas/OpenAIIntegration.schema.json`

### Toon Shader
- **Code:** `src/three/materials/ToonShaderMaterial.js`
- **Handoff:** `docs/HANDOFF_TOONSHADER.md`
- **Material switching:** Line 76 in `src/three/RoundedBlockGenerator.js`

---

## 🎯 Your Mission

1. **CRITICAL (1 hour):** Fix scene rendering loop so all 3 scenes are visible
2. **HIGH (3 hours):** Integrate camera/controls/picking with scene system
3. **HIGH (8 hours):** Implement Classroom View UI with 7 sections
4. **MEDIUM (8 hours):** Integrate OpenAI chat with room personalities
5. **POLISH (6 hours):** Transitions, voice, optimization

**Total:** ~26 hours to complete integration

**Priority Order:** Do Phase 1 first (scene rendering), then decide whether to continue with Phase 2 (camera integration) or jump to Phase 3 (Classroom View UI) based on project needs.

---

## 🏆 Final Notes

The toon shader is **complete and working**. The scene system is **architecturally sound**. The classroom view is **fully designed with schemas and examples**.

**All the hard architectural work is done.** What remains is:
1. Connecting scenes to the render loop (trivial fix)
2. Building UI components based on existing schemas (straightforward implementation)
3. Wiring up OpenAI chat (well-documented integration pattern)

You have comprehensive documentation, example data, and step-by-step guides for every task. The foundation is solid. Now build the experience.

**Good luck! 🚀**

---

**Agent Signature:**
**ToonShaderAgent**
**Session:** claude/toon-shader-implementation-012MRm1o8xoPYzEL4SuxdZNL
**Date:** 2025-11-19
**Status:** Handoff complete, ready for next agent
