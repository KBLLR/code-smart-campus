# Classroom Object Model

**Status:** Phase 4 Implementation
**Priority:** HIGH - Foundation for all classroom features
**Pattern:** OpenAI-style object with parameterized tools

---

## Overview

The **Classroom** is a first-class object in the Smart Campus system, similar to OpenAI's `assistant`, `thread`, or `vector_store` objects. It represents a **single source of truth** for a smart room, combining:

- **Physical space** (campus location)
- **People** (teachers, students, assistants)
- **Sensors** (temperature, CO2, occupancy, noise, light)
- **Integrations** (Notion, Slack, Figma, GitHub)
- **Stage configuration** (visual scene, diary/memory)
- **UI preferences** (theme, enabled sections)

---

## Design Principles

### 1. Object-First, Not Tool-First

**❌ Bad Pattern:** Separate tools per classroom
```javascript
// DON'T DO THIS
{
  "get_eng101_info": { ... },
  "get_laba_info": { ... },
  "update_eng101_sensors": { ... },
  "update_laba_sensors": { ... }
}
```

**✅ Good Pattern:** Tools operate ON classrooms via `classroom_id`
```javascript
// DO THIS
{
  "get_classroom": { classroom_id: "eng-101" },
  "get_classroom": { classroom_id: "lab-a" },
  "get_classroom_snapshot": { classroom_id: "eng-101" }
}
```

This pattern scales to **hundreds of classrooms** without exploding the tools list.

---

### 2. Centralized Context

The magic of the Classroom object is how much context it centralizes:

```typescript
const classroom = await get_classroom("eng-101");

// Now you have everything about this room:
classroom.sensors      // Real-time environmental data
classroom.personas     // Who's teaching, who's learning
classroom.policies     // What's allowed (AI, recording, etc.)
classroom.integrations // External services wired to this room
classroom.stage        // Visual scene + memory/diary
classroom.calendar     // Upcoming events (via external service)
```

Agents can **reason holistically**:
- "Is this room good for deep-focus work right now?" → Check sensors + occupancy + current activity
- "CO₂ is creeping up and the room is full" → Suggest break or open windows
- "Next class starts in 10 minutes and CO₂ is high" → Pre-ventilate, prepare slides

---

### 3. Personas Bound to Rooms

Instead of global AI agents, **personas are scoped to classrooms**:

```json
{
  "personas": {
    "teacher": {
      "id": "prof-sarah-chen",
      "name": "Prof. Sarah Chen",
      "role": "teacher",
      "personaPrompt": "You are Prof. Sarah Chen...",
      "tools": ["get_classroom_snapshot", "search_notion_database"]
    }
  }
}
```

**Benefits:**
- Same agent framework behaves differently per room
- In ENG-101: Teacher uses explanatory tone, links to Notion syllabus
- In Lab-A: SafetyAgent monitors sensors, enforces protocols
- In Focus Room: DistractionCoach enforces quiet based on noise sensors

**Implementation:** Any generic agent orchestrator can spin up the right personas by calling `get_classroom(classroom_id)`.

---

### 4. Stage & Memory Integration

Each classroom links to a **DiaryStage** (via LeAgentDiaryBridge):

```json
{
  "stage": {
    "diaryStageId": "eng-101-fall-2025",
    "sceneKey": "geospatial",
    "layoutPreset": "class"
  }
}
```

**Workflow:**
1. Events (lessons, discussions, sensor alerts) → `append_classroom_event()`
2. Events get pushed to LeAgentDiary stage
3. Agents can pull diary history → "room memory"
4. Export current scene to diary → visual snapshots

This creates a **persistent, visual memory** tied to physical space.

---

### 5. Integrations Scoped Per Classroom

External services are wired **per classroom**, not globally:

```json
{
  "integrations": {
    "notionDatabaseId": "eng101-syllabus-db",
    "slackChannelId": "C12345-eng101",
    "githubRepo": "campus-robotics/lab-assignments"
  }
}
```

**Safe Sandboxing:**
- "Push whiteboard notes to Notion" → Uses `eng-101`'s Notion DB
- "Create GitHub issue" → Uses `lab-a`'s repo
- "Send summary to Slack" → Uses classroom's channel

Agents don't need global config; they ask for the classroom and see what's wired.

---

## Schema Architecture

### Core Types

**Files:**
- `shared/classroom/classroom-types.ts` - TypeScript type definitions
- `shared/classroom/classroom-schema.ts` - Zod validation schemas

**Key Types:**
```typescript
interface ClassroomDefinition {
  id: ClassroomId;
  name: string;
  campus: CampusLocation;
  stage: ClassroomStage;
  sensors: ClassroomSensors;
  personas: ClassroomPersonas;
  policies: ClassroomPolicies;
  integrations: ClassroomIntegrations;
  ui: ClassroomUI;
  metadata: Record<string, any>;
}

interface AgentProfile {
  id: string;
  name: string;
  role: 'teacher' | 'ta' | 'student' | 'facility' | 'coach' | 'observer';
  personaPrompt: string;
  tools: string[];
}
```

### Validation

Runtime validation via Zod ensures type safety:

```typescript
import { validateClassroomDefinition } from '@classroom/classroom-schema';

const classroom = validateClassroomDefinition(jsonData);
// Throws ZodError with helpful messages if invalid
```

---

## Tools API

### 1. `get_classroom`

**Purpose:** Fetch full ClassroomDefinition for a given `classroom_id`

**OpenAI Tool Definition:**
```json
{
  "type": "function",
  "function": {
    "name": "get_classroom",
    "description": "Fetch complete classroom definition including sensors, personas, integrations, and configuration",
    "parameters": {
      "type": "object",
      "properties": {
        "classroom_id": {
          "type": "string",
          "description": "Unique classroom identifier (e.g., 'eng-101', 'lab-a')"
        }
      },
      "required": ["classroom_id"]
    }
  }
}
```

**Behavior:**
1. Load JSON from `data/classrooms/{classroom_id}.json`
2. Validate via `ClassroomSchema`
3. Return validated `ClassroomDefinition`
4. Log clear errors if validation fails

**Example:**
```typescript
const classroom = await get_classroom({ classroom_id: "eng-101" });
console.log(classroom.sensors.temperatureC); // 21.5
console.log(classroom.personas.teacher.name); // "Prof. Sarah Chen"
```

---

### 2. `get_classroom_snapshot`

**Purpose:** Compact, "thinking-friendly" snapshot for agent reasoning

**OpenAI Tool Definition:**
```json
{
  "type": "function",
  "function": {
    "name": "get_classroom_snapshot",
    "description": "Get compact classroom snapshot with current sensors, personas, and upcoming events - optimized for agent reasoning",
    "parameters": {
      "type": "object",
      "properties": {
        "classroom_id": {
          "type": "string",
          "description": "Unique classroom identifier"
        }
      },
      "required": ["classroom_id"]
    }
  }
}
```

**Returns:**
```typescript
interface ClassroomSnapshot {
  classroomId: string;
  name: string;
  stage: { sceneKey: string; layoutPreset: string };
  sensors: {
    temperatureC?: number;
    co2ppm?: number;
    occupancyCount?: number;
    comfortScore?: number; // Derived metric (0-100)
  };
  personas: {
    teacher?: string;      // Just name
    assistantCount: number;
    studentCount: number;
  };
  nextCalendarEvents?: Array<{
    title: string;
    start: string;
    end: string;
  }>;
  currentActivity?: string;
}
```

**Behavior:**
1. Load ClassroomDefinition
2. Fetch latest sensors from sensor service (if available)
3. Calculate `comfortScore` from sensors (derived metric)
4. Fetch 1-3 upcoming calendar events
5. Return compact snapshot

**Example:**
```typescript
const snapshot = await get_classroom_snapshot({ classroom_id: "eng-101" });

// Agent reasoning:
if (snapshot.sensors.co2ppm > 1000 && snapshot.sensors.occupancyCount > 15) {
  return "Room air quality is poor with high occupancy. Suggest a 10-minute break.";
}
```

---

### 3. `append_classroom_event`

**Purpose:** Write an event to classroom's diary/history

**OpenAI Tool Definition:**
```json
{
  "type": "function",
  "function": {
    "name": "append_classroom_event",
    "description": "Record an event in the classroom's history and diary (lesson, discussion, sensor alert, etc.)",
    "parameters": {
      "type": "object",
      "properties": {
        "classroom_id": {
          "type": "string",
          "description": "Unique classroom identifier"
        },
        "event": {
          "type": "object",
          "properties": {
            "type": {
              "type": "string",
              "enum": ["lesson", "break", "discussion", "activity", "system", "chat", "sensor-alert"],
              "description": "Type of event"
            },
            "summary": {
              "type": "string",
              "description": "Human-readable event summary"
            },
            "timestamp": {
              "type": "string",
              "description": "ISO 8601 timestamp (defaults to now if omitted)"
            },
            "payload": {
              "type": "object",
              "description": "Optional structured data"
            }
          },
          "required": ["type", "summary"]
        }
      },
      "required": ["classroom_id", "event"]
    }
  }
}
```

**Behavior:**
1. Default `timestamp` to now if missing
2. Validate event via `ClassroomEventSchema`
3. Forward to LeAgentDiaryBridge or diary service
4. Include `classroom_id` + `stage.diaryStageId` for traceability
5. Return success/failure

**Example:**
```typescript
await append_classroom_event({
  classroom_id: "eng-101",
  event: {
    type: "sensor-alert",
    summary: "CO₂ levels reached 1200ppm, suggested break",
    payload: {
      co2ppm: 1200,
      occupancyCount: 22,
      action: "suggest-break"
    }
  }
});
```

---

## UI Integration

### ClassroomViewManager

The UI is a **view over the same object** that agents use:

```typescript
interface ClassroomViewManagerProps {
  classroom: ClassroomDefinition;
}

function ClassroomViewManager({ classroom }: ClassroomViewManagerProps) {
  const { ui, personas, sensors, integrations, stage } = classroom;

  return (
    <div className="classroom-view">
      {ui.enabledSections.chat && (
        <ChatSection
          personas={personas}
          aiAllowed={classroom.policies.aiAssistantsAllowed}
        />
      )}
      {ui.enabledSections.presence && (
        <PresenceSection personas={personas} />
      )}
      {ui.enabledSections.sensors && (
        <SensorsSection sensors={sensors} />
      )}
      {/* ... other sections ... */}
    </div>
  );
}
```

**Key Principle:** UI renders from `ClassroomDefinition`. If an agent can see/do it, a human can see/do it.

---

## Data Flow

### 1. Agent Queries Classroom
```
Agent → get_classroom(classroom_id)
      → Load JSON from data/classrooms/{id}.json
      → Validate via Zod
      → Return ClassroomDefinition
```

### 2. Agent Takes Action
```
Agent → Reasons about sensors + personas + policies
      → Decides to suggest break
      → append_classroom_event(classroom_id, event)
      → Event pushed to LeAgentDiary
```

### 3. UI Renders Classroom
```
User clicks "Enter" on room
      → Load ClassroomDefinition
      → Pass to ClassroomViewManager
      → Sections render based on ui.enabledSections
      → 3D scene loads via stage.sceneKey + stage.diaryStageId
```

---

## Example Data

See:
- `data/classrooms/eng-101.json` - Traditional classroom
- `data/classrooms/lab-a.json` - Lab with SafetyAgent

Both validate against `ClassroomSchema` and demonstrate:
- Different personas (teacher, TA, students, facility agent)
- Different integrations (Notion for eng-101, GitHub for lab-a)
- Different policies (recording allowed vs not)
- Different UI themes and layouts

---

## Implementation Checklist

### Phase 4.1: Schema & Types ✅
- [x] Create `classroom-types.ts` with full type definitions
- [x] Create `classroom-schema.ts` with Zod validation
- [x] Create example `eng-101.json`
- [x] Create example `lab-a.json`
- [x] Create `CLASSROOM_OBJECT.md` (this document)

### Phase 4.2: Tools (Next)
- [ ] Implement `get_classroom` tool
- [ ] Implement `get_classroom_snapshot` tool
- [ ] Implement `append_classroom_event` tool
- [ ] Document tools in OpenAI function calling format

### Phase 4.3: UI Components (Next)
- [ ] Create `ClassroomViewManager` component
- [ ] Implement section components (Chat, Presence, Sensors, etc.)
- [ ] Wire classroom loader (roomId → get_classroom → UI)
- [ ] Test with both example classrooms

### Phase 4.4: Validation & Testing (Next)
- [ ] Validate both examples load successfully
- [ ] Test tool calls (get, snapshot, append)
- [ ] Test UI renders correctly for both classrooms
- [ ] Test agent reasoning with snapshot

---

## Benefits of This Pattern

1. **Scalability:** Add 100 classrooms without adding 100 tools
2. **Consistency:** Same object used by agents, UI, and backend
3. **Flexibility:** Each classroom can have unique personas, integrations, policies
4. **Traceability:** Events tied to classroom + stage for memory/history
5. **Sandboxing:** Integrations scoped per classroom, not global
6. **Type Safety:** Zod validation ensures runtime correctness
7. **Agent-Friendly:** Compact snapshots optimized for reasoning

---

## Next Actions

1. **Immediate:** Implement the 3 tools (`get_classroom`, `get_classroom_snapshot`, `append_classroom_event`)
2. **Short-term:** Build ClassroomViewManager and section components
3. **Medium-term:** Wire to OpenAI agents and test end-to-end
4. **Long-term:** Add more classrooms, expand integrations, enhance diary integration

---

**Status:** Schema complete ✅
**Next:** Implement tools
**Refs:** `shared/classroom/*`, `data/classrooms/*`
