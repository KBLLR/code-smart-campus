# Smart Campus Classroom Experience - Architecture Summary

> **Quick Reference Guide** for the complete architecture specification

## 📄 Main Document

Full specification: [`CLASSROOM_EXPERIENCE_ARCHITECTURE.md`](./CLASSROOM_EXPERIENCE_ARCHITECTURE.md)

---

## 🎯 What This Architecture Delivers

A comprehensive **Room & Classroom Experience** system that:

1. **🎭 Room Personalities** - Every room has an AI-ready personality profile
2. **🚪 Three-Action Interface** - Enter, View Info, Reserve (contextual action strip)
3. **🏫 Immersive Classroom View** - Complete experience with chat, sensors, calendar, history
4. **👤 Student-Centered** - Authentication, settings, privacy controls
5. **🎨 3D Chat Canvas** - Floating shader ball (evolves to avatar)
6. **📅 Smart Reservations** - Calendar-aware booking with conflict detection
7. **🔌 MCP Integrations** - Notion, Slack, Figma ready

---

## 📊 Core Data Schemas (OpenAI API 3.1.0 Compliant)

### 1. Room Personality (`RoomPersonality.schema.json`)

```json
{
  "id": "b.3",
  "name": "Peace",
  "personality": {
    "avatar": "Pax",
    "tone": "calming",
    "traits": ["peaceful", "introspective"],
    "topics_of_interest": ["meditation", "philosophy"]
  },
  "physical_attributes": { "capacity": 12, "layout": "lounge" },
  "sensors": { "available": ["temperature", "occupancy"] }
}
```

**Files:**
- Schema: `src/data/schemas/RoomPersonality.schema.json`
- Examples: `src/data/examples/room-personality-*.json`

---

### 2. Room Action Strip (`RoomActionStrip.schema.json`)

Three primary actions when room is selected:

```json
{
  "room_id": "library",
  "actions": [
    { "type": "enter", "label": "Enter", "icon": "🚪", "shortcut": "E" },
    { "type": "view_info", "label": "View Info", "icon": "ℹ️", "shortcut": "I" },
    { "type": "reserve", "label": "Reserve", "icon": "📅", "shortcut": "R" }
  ]
}
```

---

### 3. Classroom View (`ClassroomView.schema.json`)

Complete classroom experience configuration:

```json
{
  "room_id": "library",
  "layout": { "template": "default" },
  "sections": {
    "chat": { "canvas_config": { "type": "shader_ball" } },
    "sensors": { "display_mode": "detailed" },
    "calendar": { "enable_quick_reserve": true }
  }
}
```

**Files:**
- Schema: `src/data/schemas/ClassroomView.schema.json`

---

### 4. Student Profile (`StudentProfile.schema.json`)

```json
{
  "id": "student123",
  "settings": {
    "notifications": { "chat_messages": "mentions" },
    "privacy": { "presence_visibility": "visible" },
    "preferences": { "favorite_rooms": ["library", "makerspace"] }
  }
}
```

---

### 5. Chat & Voice (`ChatInteraction.schema.json`)

```json
{
  "room_id": "library",
  "messages": [
    {
      "sender": { "type": "room_personality" },
      "content": { "type": "text", "text": "Welcome to Alexandria!" }
    }
  ],
  "canvas_state": { "mood": "engaged" }
}
```

---

### 6. Calendar & Reservations (`RoomReservation.schema.json`)

```json
{
  "room_id": "library",
  "events": [
    {
      "type": "study_session",
      "start": "2025-11-19T14:00:00Z",
      "end": "2025-11-19T16:00:00Z",
      "status": "confirmed"
    }
  ],
  "availability": [ /* time slots */ ]
}
```

---

## 🔄 Key Interaction Flows

### Flow 1: Room Selection → Action Strip

```
User hovers room → Load action strip → Show 3 actions → User clicks "Enter" → Navigate to classroom view
```

### Flow 2: Enter Classroom View

```
Auth check → Load data (parallel) → Render layout → Initialize chat canvas → Connect real-time
```

### Flow 3: Reservation

```
Click "Reserve" → Load calendar → Select slot → Check conflicts → Add participants → Confirm → Send invites
```

### Flow 4: Chat with Room Personality

```
User types → Canvas mood: "thinking" → OpenAI API (with personality context) → Response → Canvas mood: "engaged"
```

---

## 🎨 UI Components

### Component Hierarchy

```
ClassroomView
├── ClassroomHeader (room icon, title, avatar, status)
├── ClassroomGrid
│   ├── PresencePanel (who's here)
│   ├── ChatSection (3D canvas + messages)
│   ├── SensorsPanel (real-time + historical)
│   ├── CalendarPanel (events + quick reserve)
│   ├── HistoryTimeline (past activities)
│   └── IntegrationsBar (Notion, Slack, Figma)
└── ClassroomFooter (settings)
```

### ChatCanvas3D Evolution Path

1. **Phase 1 (Current):** Shader ball with mood reactivity
2. **Phase 2:** 2D animated sprite avatar
3. **Phase 3:** 3D talking avatar with lip sync

**Data contract stays the same** across all phases!

---

## 🔌 MCP Integration Examples

### Notion

- Link room to Notion page
- Create session notes automatically
- Display in classroom view

### Slack

- Link room to Slack channel
- Post announcements
- Show recent messages

### Figma

- Link design boards
- Live preview embed
- Show collaborators

---

## 📐 Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- ✅ Extend data models
- ✅ Build action strip
- ✅ Create classroom view layout

### Phase 2: Student Auth (Weeks 3-4)
- ✅ Authentication flow
- ✅ Settings panel
- ✅ Privacy controls

### Phase 3: Chat & Personality (Weeks 5-6)
- ✅ 3D chat canvas (shader ball)
- ✅ OpenAI integration
- ✅ Voice interaction

### Phase 4: Calendar (Weeks 7-8)
- ✅ Calendar view
- ✅ Reservation system
- ✅ Conflict detection

### Phase 5: Presence & History (Weeks 9-10)
- ✅ Real-time presence
- ✅ History timeline
- ✅ Analytics

### Phase 6: MCP Integrations (Weeks 11-12)
- ✅ Notion, Slack, Figma
- ✅ OAuth flows
- ✅ Integration UI

---

## 🚀 Quick Start

### 1. Review Schemas
```bash
cat src/data/schemas/RoomPersonality.schema.json
```

### 2. Review Examples
```bash
cat src/data/examples/room-personality-peace.json
cat src/data/examples/room-personality-library.json
cat src/data/examples/room-personality-makerspace.json
```

### 3. Extend entityLocations.json
Merge personality data into existing room definitions

### 4. Build Action Strip Component
Start with room hover interaction

### 5. Create Classroom View Route
New page at `/classroom/:room_id`

---

## 🔗 OpenAI API Integration

### Example: Room Personality Chat

```javascript
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    {
      role: "system",
      content: `You are ${personality.avatar}, the personality of ${roomName}.
                Tone: ${personality.tone}
                Traits: ${personality.traits.join(', ')}`
    },
    { role: "user", content: userMessage }
  ],
  functions: [
    {
      name: "reserve_room",
      description: "Reserve this room for a time slot",
      parameters: { /* RoomReservation schema */ }
    }
  ]
});
```

---

## 📦 File Structure

```
/src/data/
  schemas/
    RoomPersonality.schema.json
    RoomActionStrip.schema.json
    ClassroomView.schema.json
    StudentProfile.schema.json
    ChatInteraction.schema.json
    RoomReservation.schema.json
    RoomHistory.schema.json
    MCPIntegration.schema.json
  examples/
    room-personality-peace.json
    room-personality-library.json
    room-personality-makerspace.json

/docs/
  CLASSROOM_EXPERIENCE_ARCHITECTURE.md (main spec)
  ARCHITECTURE_SUMMARY.md (this file)
```

---

## 🎯 Key Design Decisions

1. **OpenAI API 3.1.0 Compliance** - All schemas are function-tool compatible
2. **No Breaking Changes** - Extends existing system gracefully
3. **Shader Ball → Avatar** - Evolution path built into data contract
4. **Student-Centered** - Privacy and consent first
5. **MCP-Ready** - Integration framework is extensible
6. **Template-Based** - Layouts scale to many rooms

---

## 📚 Related Files

- **Current Data:** `src/data/entityLocations.json` (will be extended)
- **Room Registry:** `src/data/roomRegistry.js` (auto-generated, links to personalities)
- **Entity Bindings:** `shared/services/entity-binding-registry.ts` (sensors)
- **Data Pipeline:** `src/data/DataPipeline.js` (Home Assistant integration)

---

## 💡 Next Steps

1. ✅ Review and approve architecture
2. ✅ Create example personalities for 3-5 rooms
3. ✅ Begin Phase 1 implementation
4. ✅ Set up OpenAI API credentials
5. ✅ Build action strip prototype

---

**Questions?** See full specification in [`CLASSROOM_EXPERIENCE_ARCHITECTURE.md`](./CLASSROOM_EXPERIENCE_ARCHITECTURE.md)

**Status:** Ready for implementation ✅
**Version:** 1.0.0
**Date:** 2025-11-19
