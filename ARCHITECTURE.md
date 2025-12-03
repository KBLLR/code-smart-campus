# Smart Campus - Clean Architecture

## Overview

This is a complete rewrite of the Smart Campus 3D visualization with a clean, modular architecture. The system loads a GLTF model exported from Blender and provides an interactive 3D interface with room-specific AI personalities.

## Architecture

```
src/
├── core/
│   └── CampusApp.js          # Main application orchestrator
├── loaders/
│   └── GLBLoader.js           # GLTF/GLB model loader (Blender-compatible)
├── rooms/
│   ├── RoomManager.js         # Room interaction & state management
│   └── roomsMetadata.js       # Room icons, personalities, metadata
├── ui/
│   ├── ClassroomPicker.js     # Room selection UI ✅
│   ├── HeroHeader.js          # Hero header (stub)
│   ├── PanelDocker.js         # Draggable panels (stub)
│   └── SceneControls.js       # space.js controls (stub)
├── connectors/                # (To be created)
│   ├── BaseConnector.js       # Base connector class
│   ├── HomeAssistant.js       # HA integration
│   ├── GoogleCalendar.js      # Calendar connector (stub)
│   ├── SlackConnector.js      # Slack connector (stub)
│   └── CODEUniversity.js      # CODE API connector (stub)
├── data/
│   └── mappings/
│       └── personalities.json # ADA Personality Compendium (FFM/OCEAN)
├── styles/
│   ├── main.css               # Main styles (preserved from original)
│   └── classroomPicker.css    # Classroom picker styles
└── main-minimal.js            # Entry point

```

## Key Features

### ✅ Completed

1. **Clean Dependencies**
   - Removed: UIL, lil-gui, React
   - Added: @alienkitty/space.js (for future controls)
   - Kept: Three.js, @takram/three-atmosphere (geospatial), GSAP, dotenv

2. **GLB Model Loading**
   - Handles Blender GLTF exports correctly
   - Preserves scene hierarchy
   - Auto-hides non-room objects (projection_live, walls, floor)
   - Extracts room meshes for interaction

3. **Room Metadata System**
   - Each room has: icon, personality, description, color, capacity, features
   - Personalities based on ADA Compendium (FFM/OCEAN psychometric model)
   - 15 personality types: Architect, Sentinel, Optimizer, Innovator, Aesthete, etc.
   - OpenAI-compatible API parameter generation

4. **Classroom Picker**
   - Beautiful UI for selecting rooms
   - Shows room icons, personalities, metadata
   - Real-time search/filter
   - Integrates with RoomManager

5. **Room Interaction**
   - Click to select rooms
   - Hover to highlight
   - Raycasting for picking
   - Visual feedback (emissive materials)

### 🔄 In Progress (Stubs Created)

- **HeroHeader**: Top-left status display
- **PanelDocker**: Draggable sensor panels
- **SceneControls**: space.js integration for scene controls

### 📋 To Do

- **HomeAssistant Integration**
  - WebSocket connection
  - Sensor data streaming
  - Room state updates

- **Connector Architecture** (OpenAI-compatible APIs)
  - Base connector class
  - Google Calendar integration
  - Slack notifications
  - CODE University API

## Room Personalities

Each room is assigned a personality from the ADA Compendium, which defines:

- **FFM Traits**: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism
- **Speaking Style**: How the room's AI agent communicates
- **LLM Parameters**: Temperature, max_tokens for OpenAI-compatible APIs
- **Rhetoric Patterns**: Communication strategies

**Example Assignments:**

- **A1** → Analyst (Deep analysis, evidence-first)
- **A2** → Innovator (Concept generation, futures thinking)
- **A3** → Sentinel (Risk identification, QA)
- **Lab A** → Maverick (Boundary-pushing experiments)
- **Library** → Traditionalist (Best practices, precedent)
- **Cafeteria** → Ambassador (Consensus building)

## Running the App

### Development

```bash
npm install
npm run dev
```

### Entry Points

- **Current (old)**: `src/main.js` (bloated, kept for reference)
- **New (clean)**: `src/main-minimal.js` (clean architecture)

**To switch**: Update `index.html` to point to `main-minimal.js`

### GLTF Model

Place your Blender-exported model at:
```
public/models/campus.glb
```

**Room naming**: Mesh names in Blender become room IDs (normalized to lowercase alphanumeric)

## API Requirements

All AI/LLM API calls must be **OpenAI-compatible**:

```javascript
{
  model: "gpt-4",  // or claude-3-5-sonnet, etc.
  messages: [...],
  temperature: 0.7,
  max_tokens: 400,
  // ... other OpenAI-compatible parameters
}
```

This ensures compatibility with:
- OpenAI
- Anthropic Claude (via OpenAI compatibility layer)
- Any other OpenAI-compatible endpoints

## Next Steps

1. **Complete UI Components**
   - Fully implement HeroHeader with connection status
   - Build PanelDocker with dragging and sensor panels
   - Integrate space.js for SceneControls

2. **HomeAssistant Integration**
   - WebSocket connection manager
   - Sensor entity mapping
   - Real-time updates

3. **Connector System**
   - Base connector architecture
   - Google Calendar events → room scheduling
   - Slack notifications for room events
   - CODE University API integration

4. **Room AI Agents**
   - Per-room AI chat using personality parameters
   - Context-aware responses based on room state
   - Integration with connectors for data

## Design Principles

1. **Modularity**: Each component is self-contained
2. **No Bloat**: Only essential code in main.js
3. **Clean State**: RoomManager handles all room state
4. **Event-Driven**: Components communicate via events
5. **OpenAI-Compatible**: All AI APIs follow OpenAI spec
6. **Personality-First**: Rooms have character and behavior

## File Structure Rationale

- **core/**: Core Three.js setup (scene, camera, renderer)
- **loaders/**: Asset loading (GLB, textures, etc.)
- **rooms/**: Room-specific logic (metadata, interaction, state)
- **ui/**: User interface components (pickers, panels, controls)
- **connectors/**: External service integrations (HA, Calendar, Slack)
- **data/**: Static data (personalities, room configs)

---

**Status**: Minimal working prototype ready for testing
**Next**: Complete UI components and connector architecture
