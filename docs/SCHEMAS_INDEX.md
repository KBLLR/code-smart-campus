# Smart Campus JSON Schemas Index

This document provides an overview of all JSON schemas in the Smart Campus Room & Classroom Experience system.

---

## Schema Files

### 1. RoomPersonality.schema.json
**Location:** `src/data/schemas/RoomPersonality.schema.json`
**Purpose:** Defines AI-ready personality profiles for Smart Campus rooms

**Key Fields:**
- `id` - Room identifier (matches roomRegistry)
- `name` - Human-readable room name
- `category` - Room category for grouping
- `personality` - AI persona configuration
  - `avatar` - Persona name
  - `tone` - Communication style
  - `traits` - Personality characteristics
  - `topics_of_interest` - Preferred discussion topics
  - `backstory` - Narrative context
- `physical_attributes` - Capacity, layout, equipment, accessibility
- `sensors` - Available sensors and entity IDs
- `typical_activities` - Common room activities

**Example:** `src/data/examples/room-personality-peace.json`

---

### 2. ClassroomView.schema.json
**Location:** `src/data/schemas/ClassroomView.schema.json`
**Purpose:** Complete configuration for the classroom experience UI

**Key Fields:**
- `room_id` - Room identifier
- `layout` - CSS Grid configuration
  - `template` - Layout preset
  - `grid` - Grid areas, columns, rows
  - `responsive_breakpoints` - Mobile/tablet/desktop
- `sections` - Section configurations
  - `header` - Room header display
  - `presence` - User presence tracking
  - `chat` - Chat UI and 3D canvas config
  - `sensors` - Sensor dashboard
  - `calendar` - Calendar view
  - `history` - Room timeline
  - `integrations` - MCP integrations
- `theme` - Color scheme and styling
- `permissions` - User permissions

**Example:** `src/data/examples/classroom-view-peace.json`

---

### 3. StudentProfile.schema.json
**Location:** `src/data/schemas/StudentProfile.schema.json`
**Purpose:** Student identity, settings, and preferences

**Key Fields:**
- `id` - Unique student identifier (UUID)
- `email` - Student email
- `display_name` - Public name
- `settings` - Comprehensive settings object
  - `notifications` - Chat, events, sensors, group activity, DND
  - `privacy` - Presence, profile, activity sharing, discovery
  - `preferences` - Communication mode, learning style, theme, accessibility
- `interests` - Topics, favorite rooms, study groups
- `integrations` - MCP integration configs (Notion, Slack, Figma, etc.)

**Example:** `src/data/examples/student-profile-example.json`

---

### 4. CalendarReservation.schema.json
**Location:** `src/data/schemas/CalendarReservation.schema.json`
**Purpose:** Room booking, scheduling, and calendar management

**Key Definitions:**
- `Reservation` - Complete reservation object
  - Basic info (title, description, organizer, participants)
  - Timing (start, end, recurrence rules)
  - Room setup (layout, equipment, catering)
  - Virtual meeting info
  - Privacy settings
- `RecurrenceRule` - RFC 5545 iCalendar-compatible recurrence
- `AvailabilitySlot` - Available time slots for booking
- `RoomCalendar` - Complete calendar view
- `QuickReserveRequest` - Simplified quick-booking

**Example:** `src/data/examples/reservation-example.json`

---

### 5. SensorAnalytics.schema.json
**Location:** `src/data/schemas/SensorAnalytics.schema.json`
**Purpose:** Real-time sensor data, historical analysis, and room comfort metrics

**Key Definitions:**
- `SensorReading` - Individual sensor value
- `RoomSensorSnapshot` - Current sensor state with comfort scores
- `HistoricalDataRequest` - Request for time-series data
- `HistoricalDataResponse` - Aggregated sensor history
- `UsageAnalytics` - Room usage patterns and statistics
  - Occupancy statistics
  - Occupancy heatmap (by day/hour)
  - Comfort trends
  - Typical activity profile
- `SensorDashboardConfig` - Dashboard visualization settings

**Supported Sensors:**
- Temperature, Humidity, CO2, Air Quality, VOC, PM2.5, PM10
- Illumination, Occupancy, Noise, Pressure

---

### 6. ChatPresenceHistory.schema.json
**Location:** `src/data/schemas/ChatPresenceHistory.schema.json`
**Purpose:** Real-time chat, user presence tracking, and persistent room history

**Key Definitions:**
- `ChatMessage` - Text, voice, image, file, link, AI response
- `VoiceInteraction` - Voice-based chat with transcription
- `UserPresence` - Presence info (active, idle, away, offline)
- `RoomPresenceSnapshot` - Current presence state for a room
- `HistoryEvent` - Single event in room history
  - Event types: class, workshop, study session, meeting, chat, resource sharing
  - Participants, resources, outcomes, chat log references
- `RoomTimeline` - Timeline view of room history
- `ChatCanvas3D` - Floating 3D canvas configuration
  - Shader ball or avatar
  - Position, scale, animations
  - Mood/conversation reactivity

---

### 7. RoomActions.schema.json
**Location:** `src/data/schemas/RoomActions.schema.json`
**Purpose:** Room interaction strip (Enter/View info/Reserve) and contextual actions

**Key Definitions:**
- `RoomActionStrip` - Contextual action strip for selected rooms
- `RoomAction` - Individual action (enter, view_info, reserve, etc.)
- `EnterAction` - Configuration for entering classroom view
- `ViewInfoAction` - Configuration for info panel
- `ReserveAction` - Configuration for reservation modal
- `RoomInfoPanel` - Detailed room information display
- `ActionResponse` - Response when action is triggered

---

### 8. OpenAIIntegration.schema.json
**Location:** `src/data/schemas/OpenAIIntegration.schema.json`
**Purpose:** OpenAI API integration for room personalities (compliant with OpenAI API 3.1.0)

**Key Definitions:**
- `RoomPersonalityPrompt` - System prompt configuration
- `OpenAIFunctionTool` - Function tool definition (OpenAI format)
- `RoomFunctionTools` - Available function tools
- `StandardRoomTools` - Standard functions for all rooms
  - get_current_sensors
  - get_room_schedule
  - get_room_availability
  - quick_reserve_room
  - get_active_users
  - search_room_history
  - get_equipment_status
  - suggest_similar_rooms
- `OpenAIChatMessage` - Message format for OpenAI Chat API
- `OpenAIRequestPayload` - Complete chat completion request
- `ConversationSession` - Ongoing conversation with room personality

**Example:** `src/data/examples/openai-conversation-example.json`

---

## Schema Relationships

```
Room (from roomRegistry)
  ↓
RoomPersonality.schema.json ←─── AI persona with traits, backstory, voice
  ↓
ClassroomView.schema.json ←────── Complete UI layout and section configs
  ↓                                   ↓
  ├─ ChatPresenceHistory ←─────── Chat, presence, history, 3D canvas
  ├─ SensorAnalytics ←──────────── Real-time sensors, charts, analytics
  ├─ CalendarReservation ←───────── Bookings, schedule, availability
  └─ RoomActions ←───────────────── Enter/View/Reserve action strip
       ↓
OpenAIIntegration ←──────────────── AI conversations and function calling
       ↓
StudentProfile ←─────────────────── User settings, privacy, preferences
```

---

## OpenAI API 3.1.0 Compliance

All schemas are designed to be:
1. **Serializable as JSON** - Can be sent to OpenAI as tool/metadata payloads
2. **Function-callable** - Room actions are exposed as OpenAI function tools
3. **Context-aware** - Room state and sensor data can be included in prompts
4. **Type-safe** - JSON Schema validation ensures data integrity

---

## Usage Guidelines

### For Frontend Developers
- Import schema types from TypeScript type definitions (generated from schemas)
- Use schemas to validate user input and API responses
- Reference examples for UI component props and data structures

### For Backend Developers
- Use schemas for API request/response validation
- Generate database migrations from schema definitions
- Implement API endpoints that match schema contracts

### For AI Integration Developers
- Use `OpenAIIntegration.schema.json` for function tool definitions
- Construct system prompts from `RoomPersonality.schema.json`
- Feed sensor data and room context using schema-compliant payloads

---

## Validation

All schemas follow JSON Schema Draft 07 specification.

**Validation Tools:**
- ajv (Node.js): `npm install ajv`
- Online validator: https://www.jsonschemavalidator.net/

**Example validation (Node.js):**
```js
import Ajv from 'ajv';
import roomPersonalitySchema from './src/data/schemas/RoomPersonality.schema.json';
import exampleData from './src/data/examples/room-personality-peace.json';

const ajv = new Ajv();
const validate = ajv.compile(roomPersonalitySchema);
const valid = validate(exampleData);

if (!valid) {
  console.error(validate.errors);
} else {
  console.log('Valid!');
}
```

---

## Extension

To add new schemas:
1. Create schema file in `src/data/schemas/`
2. Follow JSON Schema Draft 07 specification
3. Include `$schema` and `$id` fields
4. Create example in `src/data/examples/`
5. Update this index document
6. Update `docs/ARCHITECTURE.md` if the schema affects system architecture

---

**Last Updated:** 2025-11-19
**Maintained By:** Smart Campus Architecture Team
