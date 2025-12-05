import sensorMappingData from '../sensors/sensors-mapping.json';
import roomList from './rooms.js';

const normalize = (value) => (value || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

const roomMetaById = new Map(
  roomList.map((room) => [normalize(room.id || room.name), room])
);

const classroomsWithSensors = (sensorMappingData.rooms || []).map((room) => {
  const meta = roomMetaById.get(normalize(room.id)) || roomMetaById.get(normalize(room.name)) || {};
  const descriptionParts = [];
  if (meta.area) descriptionParts.push(meta.area);
  if (meta.use) descriptionParts.push(meta.use);

  return {
    id: room.id,
    name: room.name,
    type: 'classroom',
    category: room.category || meta.area || 'general',
    building: 'main-campus',
    floor: 1,
    room_number: room.id || '',
    geometry: { mesh_id: meta.id || room.id },
    metadata: {
      icon: 'classroom',
      color: '#94a3b8',
      description: descriptionParts.length > 0 ? descriptionParts.join(' • ') : room.name,
      capacity: meta.capacity ?? null,
      features: meta.use ? [meta.use] : []
    },
    agent: {
      id: `agent-${room.id}`,
      name: `${room.name} Agent`,
      model: 'mlx-community/gemma-2-9b-it-4bit',
      description: 'On-campus room agent',
      personality: {
        name: room.name,
        archetype: 'Sentinel',
        expertise: 'Campus operations',
        tone: 'concise, observational',
        communication_style: 'Direct status updates',
        ffm: { O: 0.5, C: 0.7, E: 0.4, A: 0.6, N: 0.3 },
        traits: {}
      },
      system: {
        instructions: `You are the room agent for ${room.name}. Report environmental, occupancy, and activity succinctly.`
      },
      tools: [],
      response_format: null,
      metadata: {}
    },
    sensors: (room.sensors || []).map((sensor, index) => ({
      id: `${room.id}-${sensor.type}-${index}`,
      type: sensor.type,
      entity_id: sensor.entityId,
      source: 'HomeAssistant',
      unit: sensor.unit || '',
      current_value: null,
      status: 'unknown',
      thresholds: sensor.thresholds || {}
    })),
    events: {
      current: null,
      next: null,
      calendar_url: ''
    },
    equipment: [],
    integrations: {},
    state: {
      highlighted: false,
      selected: false,
      occupied: false,
      climate_status: 'unknown',
      equipment_status: 'unknown',
      alert_level: 'none',
      agent_active: true,
      last_interaction: null
    }
  };
});

export default classroomsWithSensors;
