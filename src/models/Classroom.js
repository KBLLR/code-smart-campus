/**
 * Classroom Model (2025)
 * OpenAI Agents + Responses API + Structured Outputs
 * Tier2 Orchestrator Compatible
 */

export class Classroom {
  constructor(data) {
    // Core Identity
    this.id = data.id;
    this.name = data.name;
    this.type = data.type || 'classroom';
    this.category = data.category || 'general';
    this.building = data.building || 'main-campus';
    this.floor = data.floor || 1;
    this.room_number = data.room_number || '';

    // Physical & 3D
    this.geometry = {
      mesh_id: data.geometry?.mesh_id || null,
      position: data.geometry?.position || { x: 0, y: 0, z: 0 },
      bounds: data.geometry?.bounds || {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 }
      },
      area_sqm: data.geometry?.area_sqm || 0,
      volume_m3: data.geometry?.volume_m3 || 0
    };

    // Metadata
    this.metadata = {
      icon: data.metadata?.icon || 'classroom',
      color: data.metadata?.color || '#64748b',
      description: data.metadata?.description || '',
      capacity: data.metadata?.capacity || 0,
      features: data.metadata?.features || [],
      tags: data.metadata?.tags || []
    };

    // OpenAI Agent (2025)
    this.agent = {
      id: data.agent?.id || `agent_${this.id}_2025`,
      name: data.agent?.name || this.name,
      model: data.agent?.model || 'gpt-4.5-turbo',
      description: data.agent?.description || '',

      // Personality
      personality: {
        name: data.agent?.personality?.name || 'Assistant',
        archetype: data.agent?.personality?.archetype || 'The Helper',
        expertise: data.agent?.personality?.expertise || 'General knowledge',
        tone: data.agent?.personality?.tone || 'professional, helpful',
        communication_style: data.agent?.personality?.communication_style || 'Clear and concise',

        // Five Factor Model
        ffm: {
          O: data.agent?.personality?.ffm?.O ?? 0.5,
          C: data.agent?.personality?.ffm?.C ?? 0.5,
          E: data.agent?.personality?.ffm?.E ?? 0.5,
          A: data.agent?.personality?.ffm?.A ?? 0.5,
          N: data.agent?.personality?.ffm?.N ?? 0.5
        },

        traits: data.agent?.personality?.traits || {}
      },

      // System prompt
      system: {
        instructions: data.agent?.system?.instructions || '',
        context_sources: data.agent?.system?.context_sources || []
      },

      // Tools (Responses API format)
      tools: data.agent?.tools || [],

      // Response format (Structured outputs)
      response_format: data.agent?.response_format || null,

      // Metadata
      metadata: {
        room_id: this.id,
        department: data.agent?.metadata?.department || '',
        managed_by: 'htdi-campus-system',
        tier: '3c',
        orchestrator_id: 'tier2-gen-idea-lab',
        ...(data.agent?.metadata || {})
      }
    };

    // Sensors
    this.sensors = (data.sensors || []).map(s => ({
      id: s.id,
      type: s.type,
      entity_id: s.entity_id,
      source: s.source || 'HomeAssistant',
      unit: s.unit || '',
      current_value: s.current_value ?? null,
      status: s.status || 'unknown',
      thresholds: s.thresholds || {},
      last_updated: s.last_updated || new Date().toISOString()
    }));

    // Events & Schedule
    this.events = {
      current: data.events?.current || null,
      next: data.events?.next || null,
      calendar_url: data.events?.calendar_url || ''
    };

    // Equipment
    this.equipment = (data.equipment || []).map(e => ({
      id: e.id,
      name: e.name,
      type: e.type,
      status: e.status || 'unknown',
      location: e.location || '',
      specs: e.specs || {}
    }));

    // Integrations
    this.integrations = {
      orchestrator: {
        url: data.integrations?.orchestrator?.url || 'http://localhost:8081',
        endpoints: {
          chat: '/api/v1/chat/completions',
          snapshot: `/api/smartcampus/classrooms/${this.id}/snapshot`,
          sensors: '/api/smartcampus/entities/batch',
          ...(data.integrations?.orchestrator?.endpoints || {})
        }
      },
      home_assistant: data.integrations?.home_assistant || {
        ws_url: 'ws://localhost:8123/api/websocket',
        entity_prefix: this.id.replace('classroom-', '')
      },
      calendar: data.integrations?.calendar || {}
    };

    // State
    this.state = {
      highlighted: false,
      selected: false,
      occupied: data.state?.occupied ?? false,
      climate_status: data.state?.climate_status || 'unknown',
      equipment_status: data.state?.equipment_status || 'unknown',
      alert_level: data.state?.alert_level || 'none',
      agent_active: data.state?.agent_active ?? true,
      last_interaction: data.state?.last_interaction || null
    };
  }

  /**
   * Get snapshot for tier2-orchestrator
   */
  toSnapshot() {
    return {
      id: this.id,
      name: this.name,
      description: this.metadata.description,
      type: this.type,
      category: this.category,

      // Agent configuration
      agent: {
        id: this.agent.id,
        name: this.agent.name,
        model: this.agent.model,
        personality: this.agent.personality,
        system: this.agent.system,
        tools: this.agent.tools,
        metadata: this.agent.metadata
      },

      // Current state
      sensors: this.sensors.map(s => ({
        id: s.id,
        type: s.type,
        value: s.current_value,
        unit: s.unit,
        status: s.status,
        last_updated: s.last_updated
      })),

      events: this.events,
      equipment: this.equipment,
      metadata: this.metadata,
      state: this.state
    };
  }

  /**
   * Update sensor value
   */
  updateSensor(sensorId, value, status = 'ok') {
    const sensor = this.sensors.find(s => s.id === sensorId);
    if (sensor) {
      sensor.current_value = value;
      sensor.status = status;
      sensor.last_updated = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Update sensor by entity ID
   */
  updateSensorByEntity(entityId, value, status = 'ok') {
    const sensor = this.sensors.find(s => s.entity_id === entityId);
    if (sensor) {
      sensor.current_value = value;
      sensor.status = status;
      sensor.last_updated = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Get sensor by type
   */
  getSensor(type) {
    return this.sensors.find(s => s.type === type);
  }

  /**
   * Update current event
   */
  updateCurrentEvent(event) {
    this.events.current = event;
  }

  /**
   * Update next event
   */
  updateNextEvent(event) {
    this.events.next = event;
  }

  /**
   * Set room state
   */
  setState(updates) {
    Object.assign(this.state, updates);
  }

  /**
   * Get equipment by ID
   */
  getEquipment(equipmentId) {
    return this.equipment.find(e => e.id === equipmentId);
  }

  /**
   * Update equipment status
   */
  updateEquipmentStatus(equipmentId, status) {
    const equipment = this.getEquipment(equipmentId);
    if (equipment) {
      equipment.status = status;
      return true;
    }
    return false;
  }

  /**
   * Export to JSON
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      category: this.category,
      building: this.building,
      floor: this.floor,
      room_number: this.room_number,
      geometry: this.geometry,
      metadata: this.metadata,
      agent: this.agent,
      sensors: this.sensors,
      events: this.events,
      equipment: this.equipment,
      integrations: this.integrations,
      state: this.state
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json) {
    return new Classroom(json);
  }

  /**
   * Validate classroom data
   */
  validate() {
    const errors = [];

    if (!this.id) errors.push('id is required');
    if (!this.name) errors.push('name is required');
    if (!this.agent.id) errors.push('agent.id is required');
    if (!this.agent.system.instructions) errors.push('agent.system.instructions is required');

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Default classroom agent tools (2025 format)
 */
export const DEFAULT_CLASSROOM_TOOLS = [
  {
    type: 'function',
    name: 'get_sensor_reading',
    description: 'Get current sensor readings for the classroom',
    parameters: {
      type: 'object',
      properties: {
        sensor_type: {
          type: 'string',
          enum: ['temperature', 'humidity', 'occupancy', 'co2', 'light', 'noise'],
          description: 'Type of sensor to query'
        }
      },
      required: ['sensor_type'],
      additionalProperties: false
    },
    strict: true
  },
  {
    type: 'function',
    name: 'check_equipment_status',
    description: 'Check availability and status of classroom equipment',
    parameters: {
      type: 'object',
      properties: {
        equipment_id: {
          type: 'string',
          description: 'ID of equipment to check'
        }
      },
      required: ['equipment_id'],
      additionalProperties: false
    },
    strict: true
  },
  {
    type: 'function',
    name: 'get_next_class',
    description: 'Get information about next scheduled class',
    parameters: {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    strict: true
  },
  {
    type: 'web_search',
    enabled: false
  },
  {
    type: 'file_search',
    enabled: false
  }
];

/**
 * Default response format (Structured outputs)
 */
export const DEFAULT_RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'classroom_agent_response',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        answer: {
          type: 'string',
          description: 'The agent\'s response to the user'
        },
        reasoning: {
          type: 'string',
          description: 'Step-by-step reasoning process'
        },
        actions_taken: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              action: { type: 'string' },
              result: { type: 'string' }
            },
            required: ['tool', 'action', 'result'],
            additionalProperties: false
          }
        },
        context_used: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['sensors', 'calendar', 'equipment', 'knowledge_base']
          }
        },
        confidence: {
          type: 'number',
          minimum: 0,
          maximum: 1
        }
      },
      required: ['answer', 'reasoning', 'actions_taken', 'context_used', 'confidence'],
      additionalProperties: false
    }
  }
};
