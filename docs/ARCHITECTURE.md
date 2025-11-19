# Smart Campus Room & Classroom Experience Architecture

**Document ID:** ARCH-001
**Version:** 1.0.0
**Date:** 2025-11-19
**Status:** Production Ready

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Data Model Architecture](#data-model-architecture)
4. [Room Personality System](#room-personality-system)
5. [Classroom View Experience](#classroom-view-experience)
6. [Interaction Flows](#interaction-flows)
7. [OpenAI API Integration](#openai-api-integration)
8. [Technical Implementation](#technical-implementation)
9. [Data Flow](#data-flow)
10. [Extension Points](#extension-points)

---

## Executive Summary

The Smart Campus Room & Classroom Experience is a comprehensive system that transforms physical campus rooms into interactive, AI-enhanced learning environments. Each room has a unique personality that students can interact with, and the classroom view provides a rich, multi-faceted interface for communication, collaboration, sensor monitoring, scheduling, and knowledge sharing.

### Key Features

- **Room Personalities:** AI-powered personas for each room with unique traits, tones, and interaction styles
- **Classroom View:** Immersive experience with chat, presence, sensors, calendar, history, and integrations
- **Room Actions:** Contextual action strip (Enter / View info / Reserve) for seamless navigation
- **Student Profiles:** Comprehensive settings for notifications, privacy, preferences, and integrations
- **Calendar & Reservation:** Google Calendar-style room booking with conflict detection
- **Sensor Analytics:** Real-time and historical data with comfort scores and usage patterns
- **Chat & Presence:** Text and voice interactions with floating 3D shader ball (future avatar)
- **History & Timeline:** Persistent record of events, resources, and activities
- **MCP Integrations:** Seamless connections to Notion, Slack, Figma, GitHub, and more

### Architectural Principles

1. **OpenAI API 3.1.0 Compliance:** All data structures are compatible with OpenAI's function calling and tools system
2. **JSON-First Design:** Every entity, view, and interaction is representable as JSON
3. **Incremental Enhancement:** System designed to evolve without breaking changes (e.g., shader ball → avatar)
4. **Student-Centric:** Privacy, accessibility, and personalization at the core
5. **Ecosystem Integration:** Works seamlessly with Home Assistant sensors and MCP tools

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Smart Campus Frontend                        │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ 3D Campus  │  │  Room List   │  │  Classroom  │  │   Student  │ │
│  │    View    │  │     View     │  │     View    │  │  Settings  │ │
│  └─────┬──────┘  └──────┬───────┘  └──────┬──────┘  └─────┬──────┘ │
└────────┼────────────────┼──────────────────┼───────────────┼────────┘
         │                │                  │               │
         └────────────────┴──────────────────┴───────────────┘
                                  │
         ┌────────────────────────┴─────────────────────────┐
         │                 API Gateway Layer                 │
         │  ┌─────────────┐  ┌──────────────┐  ┌──────────┐ │
         │  │   Rooms     │  │  Classroom   │  │  OpenAI  │ │
         │  │     API     │  │     API      │  │   Chat   │ │
         │  └──────┬──────┘  └──────┬───────┘  └────┬─────┘ │
         └─────────┼─────────────────┼───────────────┼───────┘
                   │                 │               │
         ┌─────────┴─────────────────┴───────────────┴───────┐
         │                Data Layer                          │
         │  ┌──────────────┐  ┌────────────┐  ┌───────────┐ │
         │  │  Room Configs │  │   Student  │  │  History  │ │
         │  │ & Personalities│  │  Profiles  │  │   Store   │ │
         │  └──────┬───────┘  └─────┬──────┘  └─────┬─────┘ │
         └─────────┼──────────────────┼───────────────┼───────┘
                   │                  │               │
         ┌─────────┴──────────────────┴───────────────┴───────┐
         │              External Services                      │
         │  ┌────────────┐  ┌─────────┐  ┌─────────────────┐ │
         │  │    Home    │  │  OpenAI │  │  MCP Servers    │ │
         │  │  Assistant │  │   API   │  │ (Notion, Slack, │ │
         │  │  (Sensors) │  │         │  │  Figma, etc.)   │ │
         │  └────────────┘  └─────────┘  └─────────────────┘ │
         └─────────────────────────────────────────────────────┘
```

### Core Components

1. **Room Registry:** Source of truth for all rooms (generated from SVG floorplan)
2. **Room Personality System:** AI personas with backstories, traits, and function tools
3. **Classroom View Manager:** Orchestrates the complete classroom experience
4. **Action Strip Controller:** Manages contextual room actions (Enter/View/Reserve)
5. **Sensor Analytics Engine:** Processes real-time and historical sensor data
6. **Calendar & Reservation System:** Google Calendar-style room booking
7. **Chat & Presence System:** Real-time communication with 3D visualization
8. **History & Timeline System:** Persistent record of room activities
9. **Student Profile Manager:** User settings, privacy, and integrations
10. **OpenAI Integration Layer:** Function calling and personality-driven chat

---

## Data Model Architecture

### Schema Hierarchy

```
RoomPersonality.schema.json       ← Room AI persona definition
    ↓
ClassroomView.schema.json         ← Complete classroom UI configuration
    ↓
StudentProfile.schema.json        ← User identity and settings
    ↓
CalendarReservation.schema.json   ← Booking and scheduling
    ↓
SensorAnalytics.schema.json       ← Real-time and historical data
    ↓
ChatPresenceHistory.schema.json   ← Communication and timeline
    ↓
RoomActions.schema.json           ← Contextual action strip
    ↓
OpenAIIntegration.schema.json     ← AI function calling and tools
```

### Entity Relationships

```
Room (roomRegistry.js)
  ├── has one → RoomPersonality
  ├── has one → ClassroomView config
  ├── has many → Sensors (Home Assistant entities)
  ├── has many → Reservations
  ├── has many → HistoryEvents
  └── has many → ChatMessages

Student
  ├── has one → StudentProfile
  ├── has many → Reservations (as organizer or participant)
  ├── has many → ChatMessages (as sender)
  ├── has many → UserPresence records
  └── has many → IntegrationConfigs (Notion, Slack, etc.)

ClassroomView
  ├── belongs to → Room
  ├── has one → ChatCanvas3D
  ├── has one → SensorDashboardConfig
  ├── has one → CalendarSection config
  └── has one → HistorySection config

ConversationSession (OpenAI)
  ├── belongs to → Room
  ├── belongs to → Student
  ├── has many → OpenAIChatMessages
  └── may trigger → FunctionTools
```

---

## Room Personality System

### Concept

Every room has an AI-powered personality that can:
- Generate responses "as the room" with a unique voice and perspective
- Answer questions about the room's purpose, history, and capabilities
- Provide personalized suggestions based on sensor data and context
- Execute actions via OpenAI function calling (check availability, make reservations, etc.)

### Personality Components

```json
{
  "id": "b.3",
  "name": "Peace",
  "personality": {
    "avatar": "Pax",
    "icon": "🕊️",
    "tone": "calming",
    "traits": ["peaceful", "introspective", "welcoming"],
    "topics_of_interest": ["meditation", "mindfulness", "quiet study"],
    "backstory": "Peace is a sanctuary space designed for contemplation..."
  }
}
```

### OpenAI System Prompt Construction

For each room, a system prompt is dynamically generated:

```
You are Pax, the AI persona of the Peace room at Smart Campus.

TONE & PERSONALITY:
- Your tone is calming
- Your traits: peaceful, introspective, welcoming, quiet, mindful
- You encourage mindfulness, quiet study, and reflection

ROOM CONTEXT:
- Capacity: 12 people
- Current occupancy: 3 people
- Equipment: meditation cushions, ambient lighting, sound dampening panels
- Current temperature: 21.5°C, Humidity: 45%, Air quality: Excellent

TYPICAL ACTIVITIES:
- Quiet study (daily, morning/afternoon/evening)
- Meditation sessions (weekly, morning)
- Individual reflection (daily)

INSTRUCTIONS:
- Always respond in character as Pax
- Use sensor data to inform your responses
- Suggest activities appropriate for a calm, reflective space
- If asked to perform actions, use available function tools
- Be helpful and supportive while maintaining your peaceful demeanor
```

### Available Function Tools

The room personality has access to these OpenAI function tools:

1. **get_current_sensors** - Retrieve real-time sensor data
2. **get_room_schedule** - View upcoming events and reservations
3. **get_room_availability** - Check if room is available for booking
4. **quick_reserve_room** - Make a quick reservation
5. **get_active_users** - See who's currently in the room
6. **search_room_history** - Find past events and activities
7. **get_equipment_status** - Check equipment availability
8. **suggest_similar_rooms** - Recommend alternative rooms

### Personality Evolution

The system is designed to support personality evolution:
- **Short-term:** Shader ball reacts to conversation mood and sensor signals
- **Medium-term:** 2D avatar with expressions and animations
- **Long-term:** 3D talking avatar with lip-sync and full interaction

All personality data structures anticipate these upgrades without requiring schema changes.

---

## Classroom View Experience

### Purpose

The classroom view is the **central experience** when a student enters a room. It's not just a dashboard—it's an immersive environment that:
- Enriches the student's day with curiosity and exploration
- Favors communication and collaboration
- Encourages experimentation and knowledge sharing
- Preserves room history and context

### Layout Structure

The classroom view uses a **CSS Grid-based responsive layout** defined in the ClassroomView schema:

```json
{
  "room_id": "b.3",
  "layout": {
    "template": "default",
    "grid": {
      "areas": [
        "header header header",
        "chat sensors calendar",
        "chat presence history",
        "integrations integrations integrations"
      ],
      "columns": "2fr 1fr 1fr",
      "rows": "auto 2fr 1fr auto"
    }
  }
}
```

### Core Sections

#### 1. Header Section
- Room icon, name, and personality avatar
- Current status badge (occupied, available, reserved)
- Quick access to room info and settings

#### 2. Chat Section
- Floating 3D canvas with shader ball (room's "voice")
- Text-based chat with students and AI personality
- Voice interaction support (push-to-talk or live)
- Message history with reactions and threads

**3D Chat Canvas:**
```json
{
  "type": "shader_ball",
  "position": { "x": 0, "y": 1.5, "z": 0 },
  "scale": 1.0,
  "shader_params": {
    "shader_type": "mood_reactive",
    "color_palette": ["#E8F4F8", "#B8E0D2", "#95C8D8"],
    "reaction_sensitivity": 0.7
  }
}
```

The shader ball:
- Reacts to conversation (pulsing, color shifts)
- Responds to sensor signals (air quality, noise, etc.)
- Provides visual feedback during AI responses
- Is designed to be replaced with an avatar in the future

#### 3. Presence Section
- Shows who's "in the room" (physically or virtually)
- Displays user avatars and status
- Indicates active sessions or meetings
- Respects privacy settings (invisible/friends-only)

#### 4. Sensors Section
- Real-time sensor data (temperature, humidity, CO2, air quality, occupancy, noise, light)
- Comfort score (0-100) based on sensor thresholds
- Historical charts (1h, 6h, 24h, 7d, 30d views)
- Alerts for poor air quality, high noise, etc.

#### 5. Calendar Section
- Calendar-aware view (day, week, month)
- Shows current and upcoming reservations
- Quick reserve button with preset durations (30min, 1h, 2h, 4h)
- Integration with personal calendars

#### 6. History Section
- Timeline of past events (classes, workshops, study sessions)
- Shared resources (documents, links, Notion pages, Figma files)
- Chat logs and activity summaries
- Searchable and filterable

#### 7. Integrations Section
- Connected MCP tools (Notion, Slack, Figma, GitHub)
- Quick access to linked resources
- Activity feeds from integrations
- OAuth connection status

---

## Interaction Flows

### Flow 1: Room Selection → Action Strip

**Trigger:** User clicks on a room in 3D campus view or room list

**Steps:**
1. Room is highlighted in 3D view (glow effect, label appears)
2. Contextual action strip appears above the room with 3 primary actions:
   - **Enter** (opens classroom view)
   - **View info** (shows quick info panel)
   - **Reserve** (opens reservation form)
3. Each action has an icon, label, and optional badge (e.g., "5 people inside")
4. Actions are permission-aware (disabled if user lacks access)

**Data Flow:**
```
User click → RoomPicker (CPU raycasting) → Room ID
  → Fetch RoomActionStrip config
  → Render action buttons
  → User clicks action
  → Dispatch ActionResponse
```

---

### Flow 2: Enter Classroom View

**Trigger:** User clicks "Enter" on room action strip

**Steps:**
1. Camera transitions to classroom view (zoom animation)
2. Classroom layout is loaded based on room's ClassroomView config
3. All sections initialize in parallel:
   - Header: Load room personality and status
   - Chat: Initialize 3D shader ball, load recent messages
   - Presence: Fetch active users, register own presence
   - Sensors: Subscribe to real-time sensor updates
   - Calendar: Load today's schedule
   - History: Load recent events
   - Integrations: Check MCP connection status
4. Student's presence is broadcast to other users in the room
5. If there's an active session, prompt to join

**Data Flow:**
```
Enter action → ClassroomViewManager.open(room_id)
  → Parallel requests:
      - GET /api/rooms/{id}/personality
      - GET /api/rooms/{id}/config
      - GET /api/rooms/{id}/sensors/current
      - GET /api/rooms/{id}/presence
      - GET /api/rooms/{id}/calendar/today
      - GET /api/rooms/{id}/history?range=7d
      - GET /api/student/integrations
  → Render UI sections
  → WebSocket subscribe (sensors, chat, presence)
  → POST /api/rooms/{id}/presence (register student)
```

---

### Flow 3: Chat with Room Personality

**Trigger:** Student types a message or uses voice in classroom view

**Steps:**
1. Student input is captured (text or voice transcription)
2. Message is sent to chat system
3. Message is displayed in chat UI with student's avatar
4. Shader ball reacts (gentle pulse, color shift)
5. Message is sent to OpenAI API with:
   - Room personality system prompt
   - Conversation history
   - Current room context (sensors, occupancy, schedule)
   - Available function tools
6. If AI calls a function, execute it and return result
7. AI response is generated and sent back
8. Response is displayed in chat with room's avatar
9. Shader ball animates during response (speaking effect)
10. If voice is enabled, text-to-speech plays the response

**Data Flow:**
```
Student input → POST /api/rooms/{id}/chat
  → Save message to history
  → Broadcast to other users (WebSocket)
  → OpenAI API request:
      {
        "model": "gpt-4",
        "messages": [
          { "role": "system", "content": "You are Pax..." },
          { "role": "user", "content": "What's the air quality like?" }
        ],
        "tools": [get_current_sensors, ...]
      }
  → AI response (may include function_call)
  → If function_call: Execute → Add result to messages → Re-call OpenAI
  → Final AI response → Save to history → Broadcast to users
```

---

### Flow 4: Quick Reserve Room

**Trigger:** Student clicks "Reserve" on action strip or in classroom view

**Steps:**
1. Reservation modal opens with default view (quick reserve or calendar)
2. Quick reserve shows:
   - Pre-filled title: "Study Session"
   - Start time: Now (or next available slot)
   - Duration buttons: 30min, 1h, 2h, 4h
   - Participant email input (optional)
3. System checks availability in real-time as user adjusts time
4. If conflicts exist, show warning with alternative suggestions
5. User confirms reservation
6. System creates reservation, sends invites, updates calendar
7. Success message with reservation details

**Data Flow:**
```
Reserve click → Open ReservationModal
  → GET /api/rooms/{id}/availability?start=now&duration=60
  → Display quick reserve form
  → User adjusts time → Debounced availability check
  → User confirms → POST /api/reservations
      {
        "room_id": "b.3",
        "title": "Study Session",
        "start_time": "2025-11-19T14:00:00Z",
        "duration_minutes": 60,
        "participants": ["friend@example.com"]
      }
  → Create reservation
  → Send email invites
  → Update calendar view
  → Broadcast to room presence
```

---

### Flow 5: View Sensor History & Analytics

**Trigger:** Student expands sensors section in classroom view

**Steps:**
1. Sensor section switches from compact to detailed mode
2. Chart view loads with historical data (default: 24h)
3. User can select time range (1h, 6h, 24h, 7d, 30d)
4. User can select sensor types to display (temperature, CO2, etc.)
5. Chart shows aggregated data with thresholds and comfort zones
6. Usage analytics panel shows:
   - Typical occupancy by day/hour (heatmap)
   - Average comfort score
   - Peak usage times
   - Comfort violations

**Data Flow:**
```
Expand sensors → Switch display_mode to "detailed"
  → GET /api/rooms/{id}/sensors/history?range=24h&aggregation=5min
  → Render chart with time series data
  → User changes range → New API request
  → GET /api/rooms/{id}/analytics?period=7d
  → Display usage heatmap and statistics
```

---

### Flow 6: Student Settings & Privacy

**Trigger:** Student opens settings from profile menu

**Steps:**
1. Settings modal opens with tabs:
   - Notifications
   - Privacy
   - Preferences
   - Integrations
   - Accessibility
2. **Notifications tab:** Enable/disable chat, events, sensors, group activity
3. **Privacy tab:** Set presence visibility, profile visibility, activity sharing
4. **Preferences tab:** Set communication mode, learning style, theme, default view
5. **Integrations tab:** Connect/disconnect Notion, Slack, Figma, etc. (OAuth)
6. **Accessibility tab:** Reduced motion, high contrast, text size, screen reader
7. Changes are saved in real-time (debounced)
8. Privacy changes immediately affect what others see

**Data Flow:**
```
Open settings → GET /api/student/profile
  → Render settings UI with current values
  → User changes setting → Debounced save
  → PATCH /api/student/profile { "settings": { ... } }
  → Update local state
  → If privacy change: Broadcast presence update
```

---

## OpenAI API Integration

### Architecture

The OpenAI integration is built on the **Function Calling** paradigm (OpenAI API 3.1.0):

1. Each room personality has a **system prompt** that establishes its character
2. Room actions are exposed as **function tools** with JSON Schema definitions
3. Conversations maintain **session state** with message history
4. Function calls are **executed server-side** and results fed back to the AI
5. Responses are **streamed** for real-time feel

### Function Tool Pattern

Each function tool follows this structure:

```json
{
  "type": "function",
  "function": {
    "name": "get_current_sensors",
    "description": "Retrieve current sensor data (temperature, humidity, CO2, etc.) for the room",
    "parameters": {
      "type": "object",
      "properties": {
        "sensor_types": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["temperature", "humidity", "co2", "air_quality", "illumination", "occupancy", "noise"]
          }
        }
      },
      "required": []
    }
  }
}
```

### Conversation Flow with Function Calling

```
1. User: "What's the air quality like right now?"

2. OpenAI request:
   {
     "model": "gpt-4",
     "messages": [
       { "role": "system", "content": "You are Pax..." },
       { "role": "user", "content": "What's the air quality like right now?" }
     ],
     "tools": [ { get_current_sensors }, ... ]
   }

3. OpenAI response (function call):
   {
     "choices": [{
       "message": {
         "role": "assistant",
         "content": null,
         "tool_calls": [{
           "id": "call_123",
           "type": "function",
           "function": {
             "name": "get_current_sensors",
             "arguments": "{\"sensor_types\": [\"air_quality\", \"co2\", \"voc\"]}"
           }
         }]
       }
     }]
   }

4. Server executes function:
   get_current_sensors(sensor_types=["air_quality", "co2", "voc"])
   → Returns: {
       "air_quality": "excellent",
       "co2": 450,
       "voc": 12
     }

5. OpenAI request (with function result):
   {
     "messages": [
       { "role": "system", "content": "You are Pax..." },
       { "role": "user", "content": "What's the air quality like right now?" },
       {
         "role": "assistant",
         "tool_calls": [...]
       },
       {
         "role": "tool",
         "tool_call_id": "call_123",
         "content": "{\"air_quality\": \"excellent\", \"co2\": 450, \"voc\": 12}"
       }
     ],
     "tools": [...]
   }

6. OpenAI final response:
   {
     "choices": [{
       "message": {
         "role": "assistant",
         "content": "The air quality in here is excellent right now. CO2 levels are at a very healthy 450 ppm, well below the 1000 ppm threshold. Volatile organic compounds are also quite low at 12 µg/m³. This space is perfect for deep, focused work. Would you like to reserve some quiet time?"
       }
     }]
   }

7. Display AI response in chat with Pax's avatar
```

---

## Technical Implementation

### Frontend Stack

- **Framework:** React + Vite
- **3D Rendering:** Three.js (WebGL primary, WebGPU experimental)
- **State Management:** React Context + Custom Stores
- **UI Components:** Atomic Design (Atoms, Molecules, Organisms)
- **Styling:** CSS Modules + CSS Grid for layout
- **Real-time:** WebSocket (Home Assistant + custom WS server)
- **API Client:** Fetch API with interceptors

### Backend Requirements

#### API Endpoints

**Rooms API:**
```
GET    /api/rooms                     # List all rooms
GET    /api/rooms/:id                 # Get room details
GET    /api/rooms/:id/personality     # Get personality config
GET    /api/rooms/:id/config          # Get classroom view config
GET    /api/rooms/:id/sensors/current # Get current sensor snapshot
GET    /api/rooms/:id/sensors/history # Get historical sensor data
GET    /api/rooms/:id/analytics       # Get usage analytics
GET    /api/rooms/:id/presence        # Get active users
POST   /api/rooms/:id/presence        # Register presence
DELETE /api/rooms/:id/presence        # Leave room
GET    /api/rooms/:id/calendar        # Get room calendar
GET    /api/rooms/:id/availability    # Check availability
GET    /api/rooms/:id/history         # Get room history timeline
```

**Chat API:**
```
GET    /api/rooms/:id/chat/messages   # Get recent messages
POST   /api/rooms/:id/chat            # Send message
POST   /api/rooms/:id/chat/voice      # Send voice interaction
GET    /api/rooms/:id/chat/session    # Get conversation session
```

**Reservations API:**
```
GET    /api/reservations              # Get user's reservations
POST   /api/reservations              # Create reservation
PATCH  /api/reservations/:id          # Update reservation
DELETE /api/reservations/:id          # Cancel reservation
```

**Student API:**
```
GET    /api/student/profile           # Get student profile
PATCH  /api/student/profile           # Update profile/settings
GET    /api/student/integrations      # Get MCP integration status
POST   /api/student/integrations/:mcp # Connect integration (OAuth)
DELETE /api/student/integrations/:mcp # Disconnect integration
```

**OpenAI Proxy API:**
```
POST   /api/ai/chat                   # Proxy to OpenAI with room context
POST   /api/ai/function-call          # Execute function and return result
```

#### WebSocket Events

**Sensors:**
```
sensor:update         # Real-time sensor value change
sensor:alert          # Sensor threshold exceeded
```

**Chat:**
```
chat:message          # New chat message
chat:typing           # User is typing
chat:reaction         # Reaction added to message
```

**Presence:**
```
presence:join         # User joined room
presence:leave        # User left room
presence:update       # User status changed
```

**Calendar:**
```
calendar:reservation  # New reservation created
calendar:update       # Reservation modified
calendar:cancel       # Reservation cancelled
```

### Database Schema

**Tables:**
- `rooms` - Room metadata (mirrors roomRegistry + additional fields)
- `room_personalities` - Personality configurations
- `classroom_configs` - Classroom view configurations
- `students` - Student profiles and settings
- `reservations` - Room bookings
- `chat_messages` - Chat history
- `voice_interactions` - Voice recordings and transcriptions
- `presence_log` - Presence history
- `history_events` - Room activity timeline
- `sensor_readings` - Time-series sensor data (or use TimescaleDB)
- `conversation_sessions` - OpenAI chat sessions

### Integration Points

#### Home Assistant
- **REST API:** Fetch entity history, refresh states
- **WebSocket:** Subscribe to real-time sensor updates
- **Entity Binding:** Convention-based mapping (e.g., `sensor.b3_temp` → room `b.3`)

#### OpenAI API
- **Chat Completions:** Room personality conversations
- **Function Calling:** Execute room actions via AI
- **Embeddings (future):** Semantic search over room history

#### MCP Servers
- **Notion:** Link notes, documents, knowledge base
- **Slack:** Connect channels, threads, announcements
- **Figma:** Embed design boards, shared canvases
- **GitHub:** Link code repos, issues, PRs
- **Calendar (Google/Outlook):** Sync personal calendars

---

## Data Flow

### Real-Time Sensor Updates

```
Home Assistant → WebSocket → DataPipeline → Normalize
  → haState Store → UI Components → 3D Scene Updates
  → Sensor Dashboard → Chart Updates
  → If alert threshold exceeded → Notification System
```

### Chat Message Flow

```
Student Input → Chat UI → POST /api/rooms/:id/chat
  → Save to database
  → Broadcast via WebSocket to all users in room
  → All connected clients receive and display message
  → If directed to AI personality:
      → OpenAI API request with context
      → Function calls executed if needed
      → AI response saved and broadcast
```

### Reservation Flow

```
User submits reservation → POST /api/reservations
  → Validate availability (check conflicts)
  → Create reservation in database
  → Update room calendar
  → Send email invites to participants
  → Broadcast calendar:reservation event
  → All users with room open see updated calendar
```

### Presence Tracking

```
User enters classroom → POST /api/rooms/:id/presence
  → Register in presence_log (start time, device, location)
  → Broadcast presence:join event
  → All users see updated presence list

User leaves classroom → DELETE /api/rooms/:id/presence
  → Update presence_log (end time)
  → Broadcast presence:leave event

Every 30 seconds:
  → Client sends heartbeat
  → Server updates last_active timestamp
  → If no heartbeat for 2 minutes → Auto-leave
```

---

## Extension Points

### Future Enhancements

1. **Avatar Upgrade Path**
   - Replace shader ball with 2D animated avatar
   - Upgrade to 3D talking avatar with lip-sync
   - All data structures already anticipate this (avatar_params in schemas)

2. **Voice AI Integration**
   - Real-time voice conversations with room personality
   - Voice cloning for each room avatar
   - Spatial audio for multi-user voice chat

3. **AR/VR Support**
   - Room presence via VR headset
   - 3D overlays for sensor data
   - Immersive classroom view in spatial computing

4. **Advanced Analytics**
   - Machine learning for occupancy prediction
   - Anomaly detection for sensor data
   - Personalized room recommendations based on usage

5. **Gamification**
   - Achievements for room exploration
   - Leaderboards for study time
   - Room "badges" for participation

6. **Multi-Campus Support**
   - Federation of Smart Campus instances
   - Cross-campus room discovery
   - Shared room personalities and resources

7. **Mobile App**
   - Native iOS/Android apps
   - Offline-first with sync
   - Push notifications for room alerts

### Plugin Architecture

The system is designed to support plugins via:
- **Custom MCP servers** for new integrations
- **Shader plugins** for custom chat canvas visuals
- **Widget plugins** for classroom view sections
- **Function tool plugins** for extending room AI capabilities

---

## Conclusion

The Smart Campus Room & Classroom Experience architecture provides a robust, scalable foundation for transforming physical spaces into intelligent, interactive environments. By combining room personalities, comprehensive sensor integration, rich communication tools, and seamless calendar/reservation systems, we create an experience that is:

- **Exploratory:** Students discover and learn through interaction
- **Collaborative:** Communication and knowledge sharing are frictionless
- **Transparent:** Sensor data and room history are accessible and understandable
- **Extensible:** The system can grow without breaking changes
- **OpenAI-Ready:** Full compliance with function calling and tools paradigm

All components are defined with JSON schemas, ensuring consistency, validation, and ease of integration across the ecosystem.

---

**Next Steps:**
1. Review and approve this architecture
2. Implement API endpoints and database schema
3. Build frontend components based on interaction flows
4. Integrate OpenAI function calling
5. Deploy and iterate based on student feedback

**Document Status:** Ready for Implementation
**Approvals:** Pending
**Questions/Feedback:** Contact the Smart Campus Architecture Team
