# Classroom Data Object Schema

## OpenAI API Compatible Classroom Template

This schema defines a comprehensive classroom object that integrates with OpenAI's Assistant API and function calling.

---

## Complete Classroom Object

```javascript
{
  // Basic Identity
  "id": "classroom-lab-a",
  "name": "Lab A",
  "type": "classroom",
  "category": "laboratory",
  "building": "main-campus",
  "floor": 1,
  "room_number": "101",

  // Physical Properties
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

  // Visual Metadata
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

  // OpenAI Assistant Configuration (OpenAI API Compatible)
  "assistant": {
    "id": "asst_lab_a_001",
    "name": "Lab A Assistant",
    "model": "gpt-4-turbo-preview",
    "description": "AI assistant for Lab A with expertise in computer science and laboratory management",

    // Personality (Big Five Model + Custom)
    "personality": {
      "name": "Dr. Code",
      "archetype": "The Innovator",
      "expertise": "Computer Science, AI, Research Methods",
      "tone": "professional, encouraging, technical",
      "communication_style": "Clear, detailed, pedagogical",

      // Five Factor Model (Big Five)
      "ffm": {
        "O": 0.9,  // Openness (curious, creative)
        "C": 0.8,  // Conscientiousness (organized, responsible)
        "E": 0.6,  // Extraversion (energetic, talkative)
        "A": 0.7,  // Agreeableness (friendly, compassionate)
        "N": 0.3   // Neuroticism (calm, stable)
      },

      // Custom Traits
      "traits": {
        "technical_depth": 0.95,
        "patience": 0.85,
        "humor": 0.6,
        "formality": 0.7
      }
    },

    // System Instructions (OpenAI format)
    "instructions": "You are Dr. Code, the AI assistant for Lab A, a cutting-edge computer science laboratory. You help students with programming, guide research projects, manage lab resources, and provide technical support. You have deep expertise in AI, machine learning, software engineering, and research methodologies. You communicate in a professional yet encouraging manner, adapting explanations to the student's level.",

    // OpenAI Tools/Functions
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "check_workstation_availability",
          "description": "Check which workstations are currently available in the lab",
          "parameters": {
            "type": "object",
            "properties": {
              "workstation_type": {
                "type": "string",
                "enum": ["standard", "high-performance", "gpu"],
                "description": "Type of workstation needed"
              }
            }
          }
        }
      },
      {
        "type": "function",
        "function": {
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
            "required": ["sensor_type"]
          }
        }
      },
      {
        "type": "function",
        "function": {
          "name": "schedule_equipment",
          "description": "Schedule lab equipment for a specific time slot",
          "parameters": {
            "type": "object",
            "properties": {
              "equipment_id": {
                "type": "string",
                "description": "ID of the equipment to schedule"
              },
              "start_time": {
                "type": "string",
                "format": "date-time",
                "description": "Start time for reservation"
              },
              "duration_minutes": {
                "type": "integer",
                "description": "Duration of reservation in minutes"
              },
              "purpose": {
                "type": "string",
                "description": "Purpose of equipment usage"
              }
            },
            "required": ["equipment_id", "start_time", "duration_minutes"]
          }
        }
      },
      {
        "type": "function",
        "function": {
          "name": "get_next_class",
          "description": "Get information about the next scheduled class in this room",
          "parameters": {
            "type": "object",
            "properties": {}
          }
        }
      },
      {
        "type": "code_interpreter"
      },
      {
        "type": "retrieval"
      }
    ],

    // File IDs for retrieval (OpenAI format)
    "file_ids": [
      "file-lab-a-syllabus-2024",
      "file-lab-safety-protocols",
      "file-equipment-manuals"
    ],

    // Metadata (OpenAI format)
    "metadata": {
      "room_id": "classroom-lab-a",
      "department": "Computer Science",
      "managed_by": "htdi-campus-system"
    }
  },

  // Real-time Sensors
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
      "last_updated": "2024-12-01T20:00:00Z"
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
      "last_updated": "2024-12-01T20:00:00Z"
    },
    {
      "id": "sensor-co2-lab-a-001",
      "type": "co2",
      "entity_id": "sensor.lab_a_co2",
      "source": "HomeAssistant",
      "unit": "ppm",
      "current_value": 650,
      "status": "ok",
      "thresholds": {
        "max": 1000,
        "warning": 800
      },
      "last_updated": "2024-12-01T20:00:00Z"
    },
    {
      "id": "sensor-light-lab-a-001",
      "type": "light",
      "entity_id": "sensor.lab_a_illuminance",
      "source": "HomeAssistant",
      "unit": "lux",
      "current_value": 450,
      "status": "ok",
      "last_updated": "2024-12-01T20:00:00Z"
    }
  ],

  // Events & Schedule
  "events": {
    "current": {
      "id": "event-cs301-lecture-001",
      "title": "CS 301 - Machine Learning",
      "type": "lecture",
      "instructor": "Dr. Sarah Johnson",
      "start_time": "2024-12-01T14:00:00Z",
      "end_time": "2024-12-01T16:00:00Z",
      "attendees": 25,
      "status": "in_progress",
      "tags": ["machine-learning", "ai", "graduate"]
    },
    "next": {
      "id": "event-cs401-lab-002",
      "title": "CS 401 - Advanced AI Lab",
      "type": "lab",
      "instructor": "Dr. Mike Chen",
      "start_time": "2024-12-01T17:00:00Z",
      "end_time": "2024-12-01T19:00:00Z",
      "attendees": 20,
      "status": "scheduled",
      "tags": ["ai", "research", "graduate"]
    },
    "calendar_url": "https://calendar.university.edu/room/lab-a",
    "ical_feed": "webcal://calendar.university.edu/room/lab-a.ics"
  },

  // Equipment & Resources
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
      },
      "maintenance": {
        "last_service": "2024-11-15",
        "next_service": "2025-02-15"
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
        "ram": "64GB",
        "storage": "2TB NVMe SSD"
      },
      "software": [
        "PyTorch 2.0",
        "TensorFlow 2.14",
        "CUDA 12.0",
        "VS Code",
        "JetBrains Suite"
      ]
    }
  ],

  // Access Control
  "access": {
    "public_hours": {
      "monday": { "open": "08:00", "close": "22:00" },
      "tuesday": { "open": "08:00", "close": "22:00" },
      "wednesday": { "open": "08:00", "close": "22:00" },
      "thursday": { "open": "08:00", "close": "22:00" },
      "friday": { "open": "08:00", "close": "18:00" },
      "saturday": { "open": "10:00", "close": "16:00" },
      "sunday": "closed"
    },
    "required_permissions": ["student-id", "cs-department"],
    "special_access": ["research-student", "teaching-assistant", "faculty"],
    "keycard_id": "access-point-lab-a-001"
  },

  // Emergency & Safety
  "safety": {
    "exits": 2,
    "fire_extinguishers": 2,
    "first_aid_kit": true,
    "emergency_contact": "+1-555-0100",
    "evacuation_route": "north-exit-to-assembly-point-a",
    "max_occupancy": 35,
    "ada_accessible": true
  },

  // Network & Connectivity
  "network": {
    "wifi": {
      "ssid": "Campus-5G-LabA",
      "bandwidth": "10 Gbps",
      "coverage": "excellent"
    },
    "ethernet_ports": 32,
    "smart_board_ip": "10.10.101.50",
    "devices": [
      {
        "name": "Smart Whiteboard",
        "ip": "10.10.101.50",
        "type": "display",
        "status": "online"
      },
      {
        "name": "Video Conference System",
        "ip": "10.10.101.51",
        "type": "av_equipment",
        "status": "online"
      }
    ]
  },

  // Analytics & Usage
  "analytics": {
    "utilization_rate": 0.85,
    "average_occupancy": 22,
    "peak_hours": ["14:00-16:00", "17:00-19:00"],
    "total_hours_used_this_week": 45,
    "energy_consumption_kwh": 250,
    "popular_courses": [
      "CS 301 - Machine Learning",
      "CS 401 - Advanced AI",
      "CS 350 - Computer Vision"
    ]
  },

  // Integration Points
  "integrations": {
    "calendar": {
      "provider": "Google Calendar",
      "api_endpoint": "https://calendar.google.com/api/v3/calendars/lab-a"
    },
    "lms": {
      "provider": "Canvas",
      "course_ids": ["CS301", "CS401", "CS350"]
    },
    "home_assistant": {
      "entity_prefix": "lab_a",
      "webhook_url": "https://ha.campus.edu/webhook/lab-a"
    },
    "openai": {
      "assistant_id": "asst_lab_a_001",
      "api_key_ref": "OPENAI_API_KEY_LAB_A"
    }
  },

  // State Management
  "state": {
    "highlighted": false,
    "selected": false,
    "occupied": true,
    "climate_status": "optimal",
    "equipment_status": "all_operational",
    "alert_level": "none",
    "last_cleaned": "2024-12-01T06:00:00Z",
    "maintenance_required": false
  }
}
```

---

## Usage with OpenAI API

### Create Assistant

```javascript
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const classroom = /* your classroom object */;

const assistant = await openai.beta.assistants.create({
  name: classroom.assistant.name,
  instructions: classroom.assistant.instructions,
  model: classroom.assistant.model,
  tools: classroom.assistant.tools,
  file_ids: classroom.assistant.file_ids,
  metadata: classroom.assistant.metadata
});

// Store assistant.id back to classroom object
classroom.assistant.id = assistant.id;
```

### Create Thread and Run

```javascript
// Create a conversation thread
const thread = await openai.beta.threads.create();

// User asks a question
await openai.beta.threads.messages.create(thread.id, {
  role: "user",
  content: "What's the current temperature in the lab?"
});

// Run the assistant
const run = await openai.beta.threads.runs.create(thread.id, {
  assistant_id: classroom.assistant.id
});

// Handle function calls
if (run.status === 'requires_action') {
  const toolCalls = run.required_action.submit_tool_outputs.tool_calls;

  for (const toolCall of toolCalls) {
    if (toolCall.function.name === 'get_sensor_reading') {
      const args = JSON.parse(toolCall.function.arguments);
      const sensor = classroom.sensors.find(s => s.type === args.sensor_type);

      await openai.beta.threads.runs.submitToolOutputs(thread.id, run.id, {
        tool_outputs: [{
          tool_call_id: toolCall.id,
          output: JSON.stringify({
            value: sensor.current_value,
            unit: sensor.unit,
            status: sensor.status,
            last_updated: sensor.last_updated
          })
        }]
      });
    }
  }
}
```

---

## Sensor Data Integration

```javascript
// Update sensor from Home Assistant
function updateSensorFromHA(classroom, entityId, value) {
  const sensor = classroom.sensors.find(s => s.entity_id === entityId);
  if (sensor) {
    sensor.current_value = value;
    sensor.last_updated = new Date().toISOString();

    // Check thresholds
    if (sensor.thresholds) {
      if (value > sensor.thresholds.max || value < sensor.thresholds.min) {
        sensor.status = 'warning';
        classroom.state.alert_level = 'warning';
      } else {
        sensor.status = 'ok';
      }
    }
  }
}
```

---

## Event Management

```javascript
// Get next event
function getNextEvent(classroom) {
  const now = new Date();
  const next = classroom.events.next;

  if (new Date(next.start_time) > now) {
    return {
      title: next.title,
      instructor: next.instructor,
      starts_in_minutes: Math.floor(
        (new Date(next.start_time) - now) / 60000
      )
    };
  }

  return null;
}
```

---

## Complete TypeScript Interface

```typescript
interface Classroom {
  // Basic
  id: string;
  name: string;
  type: string;
  category: string;
  building: string;
  floor: number;
  room_number: string;

  // Geometry
  geometry: {
    mesh_id: string;
    position: Vector3;
    bounds: { min: Vector3; max: Vector3 };
    area_sqm: number;
    volume_m3: number;
  };

  // Metadata
  metadata: {
    icon: string;
    color: string;
    description: string;
    capacity: number;
    features: string[];
    tags: string[];
  };

  // OpenAI Assistant
  assistant: OpenAIAssistant;

  // Sensors
  sensors: Sensor[];

  // Events
  events: {
    current: Event | null;
    next: Event | null;
    calendar_url: string;
    ical_feed: string;
  };

  // Equipment
  equipment: Equipment[];

  // Access
  access: AccessControl;

  // Safety
  safety: SafetyInfo;

  // Network
  network: NetworkInfo;

  // Analytics
  analytics: Analytics;

  // Integrations
  integrations: Integrations;

  // State
  state: RoomState;
}

interface OpenAIAssistant {
  id: string;
  name: string;
  model: string;
  description: string;
  personality: Personality;
  instructions: string;
  tools: OpenAITool[];
  file_ids: string[];
  metadata: Record<string, any>;
}

interface Personality {
  name: string;
  archetype: string;
  expertise: string;
  tone: string;
  communication_style: string;
  ffm: {
    O: number; // Openness
    C: number; // Conscientiousness
    E: number; // Extraversion
    A: number; // Agreeableness
    N: number; // Neuroticism
  };
  traits: Record<string, number>;
}

interface Sensor {
  id: string;
  type: string;
  entity_id: string;
  source: string;
  unit: string;
  current_value: number;
  status: 'ok' | 'warning' | 'error';
  thresholds?: {
    min?: number;
    max?: number;
    optimal?: { min: number; max: number };
    warning?: number;
  };
  last_updated: string;
}

interface Event {
  id: string;
  title: string;
  type: string;
  instructor: string;
  start_time: string;
  end_time: string;
  attendees: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  tags: string[];
}
```

This schema is fully compatible with OpenAI's Assistant API and provides a comprehensive data structure for smart classroom management.
