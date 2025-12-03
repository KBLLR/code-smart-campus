# Classroom Agent Schema 2025

## OpenAI Agents + Responses API + Structured Outputs

**Integration**: tier2-orchestrator → tier1-smart-campus (Tier 3C)
**Stack**: OpenAI Agents, Responses API, Structured Outputs, Harmony Messages

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Client (Browser, CLI, MCP)                                  │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  Tier 2: gen-idea-lab (Orchestrator)                         │
│  POST /api/v1/chat/completions                               │
│  GET  /api/smartcampus/classrooms/:id                        │
│  GET  /api/smartcampus/classrooms/:id/snapshot               │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  Tier 3C: Smart Campus (tier1-smart-campus)                  │
│  - Classroom Agent Runtime                                    │
│  - Sensor Data Integration                                   │
│  - Real-time Event Stream                                    │
│  - 3D Visualization                                          │
└──────────────────────────────────────────────────────────────┘
```

---

## Classroom Agent Object (2025)

```javascript
{
  // ============ Core Identity ============
  "id": "classroom-lab-a",
  "name": "Lab A",
  "type": "classroom",
  "category": "laboratory",
  "building": "main-campus",
  "floor": 1,
  "room_number": "101",

  // ============ Physical & 3D ============
  "geometry": {
    "mesh_id": "lab_a_mesh",
    "position": { "x": 0, "y": 0, "z": 0 },
    "bounds": {
      "min": { "x": -10, "y": 0, "z": -10 },
      "max": { "x": 10, "y": 5, "z": 10 }
    },
    "area_sqm": 100,
    "volume_m3": 500
  },

  "metadata": {
    "icon": "laboratory",
    "color": "#3b82f6",
    "description": "Advanced Computer Science Laboratory",
    "capacity": 30,
    "features": [
      "High-performance workstations",
      "Smart whiteboard",
      "Video conferencing",
      "3D printers"
    ],
    "tags": ["stem", "computer-science", "research"]
  },

  // ============ OpenAI Agent (2025) ============
  "agent": {
    "id": "agent_lab_a_2025",
    "name": "Dr. Code",
    "model": "gpt-4.5-turbo",  // 2025 model
    "description": "AI agent for Lab A with expertise in computer science",

    // Personality Profile
    "personality": {
      "name": "Dr. Code",
      "archetype": "The Innovator",
      "expertise": "Computer Science, AI, Research Methods",
      "tone": "professional, encouraging, technical",
      "communication_style": "Clear, detailed, pedagogical",

      // Five Factor Model (Big Five)
      "ffm": {
        "O": 0.9,  // Openness
        "C": 0.8,  // Conscientiousness
        "E": 0.6,  // Extraversion
        "A": 0.7,  // Agreeableness
        "N": 0.3   // Neuroticism
      },

      "traits": {
        "technical_depth": 0.95,
        "patience": 0.85,
        "humor": 0.6,
        "formality": 0.7
      }
    },

    // System Prompt (Responses API format)
    "system": {
      "instructions": "You are Dr. Code, the AI agent for Lab A, a cutting-edge computer science laboratory. You help students with programming, guide research projects, manage lab resources, and provide technical support. You have deep expertise in AI, machine learning, software engineering, and research methodologies.",

      "context_sources": [
        {
          "type": "smartcampus",
          "endpoint": "http://localhost:8081/api/smartcampus/classrooms/lab-a/snapshot",
          "refresh_interval_ms": 30000
        },
        {
          "type": "calendar",
          "endpoint": "https://calendar.university.edu/api/room/lab-a",
          "refresh_interval_ms": 300000
        }
      ]
    },

    // Tools (Responses API format)
    "tools": [
      {
        "type": "function",
        "name": "get_sensor_reading",
        "description": "Get current sensor readings for the lab environment",
        "parameters": {
          "type": "object",
          "properties": {
            "sensor_type": {
              "type": "string",
              "enum": ["temperature", "humidity", "occupancy", "co2", "light", "noise"],
              "description": "Type of sensor to query"
            }
          },
          "required": ["sensor_type"],
          "additionalProperties": false
        },
        "strict": true  // 2025: Structured outputs
      },
      {
        "type": "function",
        "name": "check_equipment_status",
        "description": "Check availability and status of lab equipment",
        "parameters": {
          "type": "object",
          "properties": {
            "equipment_id": {
              "type": "string",
              "description": "ID of equipment to check"
            }
          },
          "required": ["equipment_id"],
          "additionalProperties": false
        },
        "strict": true
      },
      {
        "type": "function",
        "name": "schedule_equipment",
        "description": "Schedule lab equipment for a time slot",
        "parameters": {
          "type": "object",
          "properties": {
            "equipment_id": {
              "type": "string"
            },
            "start_time": {
              "type": "string",
              "format": "date-time"
            },
            "duration_minutes": {
              "type": "integer",
              "minimum": 15,
              "maximum": 480
            },
            "purpose": {
              "type": "string"
            }
          },
          "required": ["equipment_id", "start_time", "duration_minutes"],
          "additionalProperties": false
        },
        "strict": true
      },
      {
        "type": "function",
        "name": "get_next_class",
        "description": "Get information about next scheduled class",
        "parameters": {
          "type": "object",
          "properties": {},
          "additionalProperties": false
        },
        "strict": true
      },
      {
        "type": "web_search",  // 2025: Built-in web search
        "enabled": true
      },
      {
        "type": "file_search",  // 2025: Built-in file search
        "enabled": true,
        "vector_store_ids": ["vs_lab_a_docs_2025"]
      },
      {
        "type": "computer_use",  // 2025: Computer use tool
        "enabled": false  // Disabled for classroom agents
      }
    ],

    // Response Format (Structured Outputs)
    "response_format": {
      "type": "json_schema",
      "json_schema": {
        "name": "classroom_agent_response",
        "strict": true,
        "schema": {
          "type": "object",
          "properties": {
            "answer": {
              "type": "string",
              "description": "The agent's response to the user"
            },
            "reasoning": {
              "type": "string",
              "description": "Step-by-step reasoning process"
            },
            "actions_taken": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "tool": { "type": "string" },
                  "action": { "type": "string" },
                  "result": { "type": "string" }
                },
                "required": ["tool", "action", "result"],
                "additionalProperties": false
              }
            },
            "context_used": {
              "type": "array",
              "items": {
                "type": "string",
                "enum": ["sensors", "calendar", "equipment", "knowledge_base"]
              }
            },
            "confidence": {
              "type": "number",
              "minimum": 0,
              "maximum": 1
            }
          },
          "required": ["answer", "reasoning", "actions_taken", "context_used", "confidence"],
          "additionalProperties": false
        }
      }
    },

    // Metadata
    "metadata": {
      "room_id": "classroom-lab-a",
      "department": "Computer Science",
      "managed_by": "htdi-campus-system",
      "tier": "3c",
      "orchestrator_id": "tier2-gen-idea-lab"
    }
  },

  // ============ Real-time Sensors ============
  "sensors": [
    {
      "id": "sensor-temp-lab-a-001",
      "type": "temperature",
      "entity_id": "sensor.lab_a_temperature",
      "source": "HomeAssistant",
      "unit": "°C",
      "current_value": 22.5,
      "status": "ok",
      "thresholds": {
        "min": 18,
        "max": 26,
        "optimal": { "min": 20, "max": 24 }
      },
      "last_updated": "2025-01-01T20:00:00Z"
    },
    {
      "id": "sensor-occupancy-lab-a-001",
      "type": "occupancy",
      "entity_id": "binary_sensor.lab_a_occupancy",
      "source": "HomeAssistant",
      "unit": "people",
      "current_value": 15,
      "capacity": 30,
      "status": "ok",
      "last_updated": "2025-01-01T20:00:00Z"
    }
  ],

  // ============ Events & Schedule ============
  "events": {
    "current": {
      "id": "event-cs301-lecture-001",
      "title": "CS 301 - Machine Learning",
      "type": "lecture",
      "instructor": "Dr. Sarah Johnson",
      "start_time": "2025-01-01T14:00:00Z",
      "end_time": "2025-01-01T16:00:00Z",
      "attendees": 25,
      "status": "in_progress"
    },
    "next": {
      "id": "event-cs401-lab-002",
      "title": "CS 401 - Advanced AI Lab",
      "type": "lab",
      "instructor": "Dr. Mike Chen",
      "start_time": "2025-01-01T17:00:00Z",
      "end_time": "2025-01-01T19:00:00Z",
      "attendees": 20,
      "status": "scheduled"
    },
    "calendar_url": "https://calendar.university.edu/room/lab-a.ics"
  },

  // ============ Equipment & Resources ============
  "equipment": [
    {
      "id": "equip-3d-printer-001",
      "name": "Ultimaker S5",
      "type": "3d_printer",
      "status": "available",
      "location": "northwest-corner",
      "specs": {
        "build_volume": "330 x 240 x 300 mm",
        "materials": ["PLA", "ABS", "PETG", "Nylon"]
      }
    },
    {
      "id": "equip-workstation-001",
      "name": "High-Performance Workstation 1",
      "type": "computer",
      "status": "in_use",
      "specs": {
        "cpu": "AMD Ryzen 9 7950X",
        "gpu": "NVIDIA RTX 4090",
        "ram": "64GB"
      }
    }
  },

  // ============ Integration Points ============
  "integrations": {
    "orchestrator": {
      "url": "http://localhost:8081",
      "endpoints": {
        "chat": "/api/v1/chat/completions",
        "snapshot": "/api/smartcampus/classrooms/lab-a/snapshot",
        "sensors": "/api/smartcampus/entities/batch"
      }
    },
    "home_assistant": {
      "ws_url": "ws://localhost:8123/api/websocket",
      "entity_prefix": "lab_a"
    },
    "calendar": {
      "provider": "Google Calendar",
      "api_endpoint": "https://calendar.google.com/api/v3/calendars/lab-a"
    }
  },

  // ============ State ============
  "state": {
    "highlighted": false,
    "selected": false,
    "occupied": true,
    "climate_status": "optimal",
    "equipment_status": "all_operational",
    "alert_level": "none",
    "agent_active": true,
    "last_interaction": "2025-01-01T20:00:00Z"
  }
}
```

---

## 2025 Responses API Usage

### Create Chat Completion with Agent

```javascript
// Call tier2-orchestrator
const response = await fetch('http://localhost:8081/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    model: "gpt-4.5-turbo",
    messages: [
      {
        role: "system",
        content: classroom.agent.system.instructions
      },
      {
        role: "user",
        content: "What's the current temperature in the lab?"
      }
    ],
    tools: classroom.agent.tools,
    response_format: classroom.agent.response_format,
    // 2025: Extended metadata
    metadata: {
      room_id: classroom.id,
      agent_id: classroom.agent.id,
      request_id: crypto.randomUUID()
    }
  })
});

const data = await response.json();

// Structured output guaranteed
const { answer, reasoning, actions_taken, confidence } = JSON.parse(data.choices[0].message.content);
```

### Harmony Message Format (2025)

```javascript
// Harmony: Unified message format across all HTDI services
{
  "harmony_version": "1.0",
  "message_id": "msg_abc123",
  "timestamp": "2025-01-01T20:00:00Z",
  "source": {
    "service": "smart-campus",
    "tier": "3c",
    "room_id": "classroom-lab-a",
    "agent_id": "agent_lab_a_2025"
  },
  "type": "agent_response",
  "payload": {
    "answer": "The current temperature in Lab A is 22.5°C...",
    "reasoning": "I queried the temperature sensor (sensor.lab_a_temperature)...",
    "actions_taken": [
      {
        "tool": "get_sensor_reading",
        "action": "query_temperature",
        "result": "22.5°C"
      }
    ],
    "context_used": ["sensors"],
    "confidence": 0.95
  },
  "metadata": {
    "latency_ms": 234,
    "model": "gpt-4.5-turbo",
    "tokens": {
      "prompt": 150,
      "completion": 75,
      "total": 225
    }
  }
}
```

---

## TypeScript Interfaces (2025)

```typescript
interface ClassroomAgent {
  id: string;
  name: string;
  type: string;
  category: string;

  geometry: Geometry3D;
  metadata: ClassroomMetadata;

  // 2025: Agent, not Assistant
  agent: OpenAIAgent2025;

  sensors: Sensor[];
  events: EventSchedule;
  equipment: Equipment[];
  integrations: Integrations;
  state: RoomState;
}

interface OpenAIAgent2025 {
  id: string;
  name: string;
  model: string; // "gpt-4.5-turbo" etc.
  description: string;

  personality: Personality;

  system: {
    instructions: string;
    context_sources: ContextSource[];
  };

  // 2025: Responses API tools
  tools: Tool2025[];

  // 2025: Structured outputs
  response_format: ResponseFormat;

  metadata: Record<string, any>;
}

interface Tool2025 {
  type: 'function' | 'web_search' | 'file_search' | 'computer_use';
  name?: string;
  description?: string;
  parameters?: JSONSchema;
  strict?: boolean; // 2025: Structured parameters
  enabled?: boolean;
  vector_store_ids?: string[];
}

interface ResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: JSONSchema;
  };
}

interface HarmonyMessage {
  harmony_version: string;
  message_id: string;
  timestamp: string;
  source: MessageSource;
  type: MessageType;
  payload: any;
  metadata: MessageMetadata;
}
```

---

## Integration with Tier2 Orchestrator

```javascript
// tier1-smart-campus server endpoint
app.get('/api/classrooms/:id', async (req, res) => {
  const classroom = getClassroom(req.params.id);

  // Return classroom data in format expected by tier2
  res.json({
    ok: true,
    room: {
      id: classroom.id,
      name: classroom.name,
      description: classroom.metadata.description,

      // Agent configuration
      agent: classroom.agent,

      // Current state
      sensors: classroom.sensors.map(s => ({
        id: s.id,
        type: s.type,
        value: s.current_value,
        unit: s.unit,
        status: s.status
      })),

      events: classroom.events,
      equipment: classroom.equipment,

      metadata: classroom.metadata
    },
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id']
  });
});
```

This schema is fully compatible with:
- ✅ OpenAI Agents (2025)
- ✅ Responses API
- ✅ Structured Outputs
- ✅ Harmony Messages
- ✅ Tier2 Orchestrator integration
