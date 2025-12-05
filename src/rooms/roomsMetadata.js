/**
 * Room Metadata - Icons, personalities, and characteristics
 * Each room has unique properties that define its character and behavior
 * Personalities reference ADA Personality Compendium (FFM/OCEAN-based)
 */

import personalitiesData from '../data/personalities/ocean-personalities.json';

export const roomsMetadata = {
  // Example rooms from the Blender model (a1, a2, etc.)
  a1: {
    icon: 'classroom',
    personality: 'analyst', // Deep analysis, evidence-first reasoning
    description: 'Classroom A1 - Analytical learning environment',
    color: '#38bdf8',
    capacity: 30,
    features: ['projector', 'whiteboard', 'ac'],
    sensors: ['temperature', 'occupancy', 'light', 'co2'],
  },

  a2: {
    icon: 'classroom',
    personality: 'innovator', // Concept generation, futures thinking
    description: 'Classroom A2 - Creative innovation workspace',
    color: '#8b5cf6',
    capacity: 25,
    features: ['projector', 'collaborative_desks'],
    sensors: ['temperature', 'occupancy', 'light'],
  },

  a3: {
    icon: 'lab',
    personality: 'sentinel', // Risk identification, compliance, QA
    description: 'Lab A3 - Rigorous scientific exploration',
    color: '#0ea5e9',
    capacity: 20,
    features: ['lab_equipment', 'safety_shower'],
    sensors: ['temperature', 'occupancy', 'humidity', 'co2'],
  },

  a4: {
    icon: 'studio',
    personality: 'aesthete', // UX, design language, emotional resonance
    description: 'Studio A4 - Artistic expression',
    color: '#f472b6',
    capacity: 15,
    features: ['easels', 'natural_light'],
    sensors: ['temperature', 'occupancy', 'light'],
  },

  a5: {
    icon: 'computer',
    personality: 'optimizer', // Process refinement, marginal gains
    description: 'Computer Lab A5 - Precision & efficiency',
    color: '#22d3ee',
    capacity: 30,
    features: ['computers', 'servers', 'dual_monitors'],
    sensors: ['temperature', 'occupancy', 'energy', 'co2'],
  },

  a6: {
    icon: 'classroom',
    personality: 'challenger', // Adversarial testing, critical inquiry
    description: 'Classroom A6 - Critical thinking lab',
    color: '#f59e0b',
    capacity: 25,
    features: ['projector', 'whiteboard', 'debate_setup'],
    sensors: ['temperature', 'occupancy', 'light'],
  },

  a7: {
    icon: 'classroom',
    personality: 'diplomat', // Mediation, conflict resolution
    description: 'Classroom A7 - Collaborative learning',
    color: '#ec4899',
    capacity: 28,
    features: ['projector', 'round_tables', 'ac'],
    sensors: ['temperature', 'occupancy', 'light', 'co2'],
  },

  a8: {
    icon: 'classroom',
    personality: 'strategist', // Competitive analysis, wargaming
    description: 'Classroom A8 - Strategic planning',
    color: '#84cc16',
    capacity: 30,
    features: ['projector', 'whiteboard', 'strategy_boards'],
    sensors: ['temperature', 'occupancy', 'light', 'co2'],
  },

  laba: {
    icon: 'lab',
    personality: 'maverick', // Boundary-pushing, high-risk options
    description: 'Research Lab A - Advanced experiments',
    color: '#2dd4bf',
    capacity: 12,
    features: ['fume_hood', 'microscopes', 'incubator'],
    sensors: ['temperature', 'occupancy', 'humidity', 'co2'],
  },

  labb: {
    icon: 'lab',
    personality: 'architect', // Structured planning, systems design
    description: 'Engineering Lab B - Systematic building',
    color: '#fb923c',
    capacity: 18,
    features: ['3d_printer', 'tools', 'workbenches'],
    sensors: ['temperature', 'occupancy', 'motion'],
  },

  labc: {
    icon: 'lab',
    personality: 'advocate', // Ethics, user impact, social responsibility
    description: 'Biology Lab C - Life sciences & sustainability',
    color: '#34d399',
    capacity: 15,
    features: ['greenhouse', 'specimens', 'microscopes'],
    sensors: ['temperature', 'occupancy', 'humidity', 'light'],
  },

  library: {
    icon: 'library',
    personality: 'traditionalist', // Best practices, precedent, institutional memory
    description: 'Library - Knowledge preservation',
    color: '#a78bfa',
    capacity: 50,
    features: ['books', 'study_rooms', 'silent_zone'],
    sensors: ['temperature', 'occupancy', 'light', 'co2'],
  },

  auditorium: {
    icon: 'auditorium',
    personality: 'commander', // Leadership, decision and execution
    description: 'Auditorium - Grand presentations',
    color: '#f59e0b',
    capacity: 200,
    features: ['stage', 'sound_system', 'projector'],
    sensors: ['temperature', 'occupancy', 'light', 'co2'],
  },

  cafeteria: {
    icon: 'cafeteria',
    personality: 'ambassador', // Consensus building, stakeholder alignment
    description: 'Cafeteria - Community gathering',
    color: '#ef4444',
    capacity: 100,
    features: ['kitchen', 'tables', 'vending_machines'],
    sensors: ['temperature', 'occupancy', 'humidity'],
  },

  gym: {
    icon: 'gym',
    personality: 'anchor', // Stability, crisis composure, focus
    description: 'Gymnasium - Physical wellness & stability',
    color: '#06b6d4',
    capacity: 40,
    features: ['equipment', 'lockers', 'mats'],
    sensors: ['temperature', 'occupancy', 'humidity'],
  },

  office: {
    icon: 'office',
    personality: 'strategist', // Competitive analysis, wargaming
    description: 'Administrative Office - Strategic operations',
    color: '#64748b',
    capacity: 10,
    features: ['desks', 'filing_cabinets', 'printers'],
    sensors: ['temperature', 'occupancy', 'motion'],
  },

  hallway: {
    icon: 'hallway',
    personality: 'diplomat', // Mediation, conflict resolution
    description: 'Hallway - Connection & transition',
    color: '#94a3b8',
    capacity: null,
    features: ['lockers', 'water_fountain'],
    sensors: ['motion', 'light'],
  },

  restroomsexits01: {
    icon: 'hallway',
    personality: 'anchor',
    description: 'Restrooms & Exits - Facilities',
    color: '#64748b',
    capacity: null,
    features: ['restrooms', 'exit'],
    sensors: ['motion', 'light'],
  },

  restroomsexits02: {
    icon: 'hallway',
    personality: 'anchor',
    description: 'Restrooms & Exits - Facilities',
    color: '#64748b',
    capacity: null,
    features: ['restrooms', 'exit'],
    sensors: ['motion', 'light'],
  },

  phone_booths: {
    icon: 'office',
    personality: 'traditionalist',
    description: 'Phone Booths - Individual Silent Spaces',
    color: '#a78bfa',
    capacity: 1,
    features: ['soundproof', 'desk'],
    sensors: ['occupancy', 'light'],
  },

  oxygen: {
    icon: 'gym', // Using gym for wellness/outdoor implication
    personality: 'aesthete',
    description: 'Oxygen Terrace - Outdoor Non-Smoking Area',
    color: '#34d399',
    capacity: 20,
    features: ['outdoor', 'seating', 'plants'],
    sensors: ['temperature', 'light', 'air_quality'],
  },

  hydrogen: {
    icon: 'gym',
    personality: 'maverick',
    description: 'Hydrogen Terrace - Outdoor Smoking Area',
    color: '#f87171',
    capacity: 15,
    features: ['outdoor', 'seating'],
    sensors: ['temperature', 'light', 'air_quality'],
  },

  cantina: {
    icon: 'cafeteria',
    personality: 'ambassador',
    description: 'Cantina - Dining Facility',
    color: '#ef4444',
    capacity: 80,
    features: ['kitchen', 'tables'],
    sensors: ['temperature', 'occupancy', 'humidity'],
  },

  lifts: {
    icon: 'hallway',
    personality: 'anchor',
    description: 'Elevators - Vertical Transport',
    color: '#64748b',
    capacity: 8,
    features: ['elevator'],
    sensors: ['motion'],
  },

  kitchen: {
    icon: 'cafeteria',
    personality: 'anchor',
    description: 'Kitchenette - Staff Break Area',
    color: '#f97316',
    capacity: 5,
    features: ['sink', 'microwave', 'fridge'],
    sensors: ['motion', 'temperature'],
  },

  stairs: {
    icon: 'hallway',
    personality: 'anchor',
    description: 'Stairwell - Vertical Access',
    color: '#64748b',
    capacity: null,
    features: ['stairs'],
    sensors: ['motion', 'light'],
  },

  // Default for unknown rooms
  default: {
    icon: 'default',
    personality: 'anchor',
    description: 'Unknown space',
    color: '#94a3b8',
    capacity: null,
    features: [],
    sensors: [],
  },
};

/**
 * Get metadata for a room by ID (with fallback to default)
 */
export function getRoomMetadata(roomId) {
  const exactMatch = roomsMetadata[roomId];
  if (exactMatch) return exactMatch;

  // Try case-insensitive match
  const lowerId = roomId.toLowerCase();
  const caseInsensitiveMatch = roomsMetadata[lowerId];
  if (caseInsensitiveMatch) return caseInsensitiveMatch;

  // Try finding a key that matches case-insensitively (for keys like 'Restrooms_exits_01' vs 'restroomsexits01')
  // This is a bit more expensive but safer
  const key = Object.keys(roomsMetadata).find(k => k.toLowerCase() === lowerId.replace(/_/g, '').toLowerCase());
  if (key) return roomsMetadata[key];

  return roomsMetadata.default;
}

/**
 * Get full personality profile for a room from ADA Compendium
 */
export function getRoomPersonality(roomId) {
  const metadata = getRoomMetadata(roomId);
  const personalityId = metadata.personality;

  return personalitiesData.personalities.find(p => p.id === personalityId) ||
    personalitiesData.personalities.find(p => p.id === 'anchor');
}

/**
 * Get OpenAI-compatible parameters for a room's personality
 * Used for AI connector API calls
 */
export function getRoomAIParams(roomId) {
  const personality = getRoomPersonality(roomId);

  return {
    temperature: personality.temperature,
    max_tokens: personality.maxTokens,
    system_prompt: `You are ${personality.name}. ${personality.expertise}. Speaking style: ${personality.speakingStyle}.`,
    personality_id: personality.id,
  };
}
