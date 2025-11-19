/**
 * Classroom Types
 *
 * Core type definitions for the Classroom object model.
 * A Classroom is a first-class object representing a smart room with:
 * - Physical space (campus location)
 * - People (personas: teachers, students, assistants)
 * - Sensors (temperature, CO2, occupancy, etc.)
 * - Integrations (Notion, Slack, Figma, GitHub)
 * - Stage configuration (visual scene, diary stage)
 * - UI preferences
 *
 * Pattern: Similar to OpenAI's assistant/thread/vector store objects.
 * Tools operate ON classrooms via classroom_id, not separate tools per classroom.
 */

/**
 * Unique identifier for a classroom
 */
export type ClassroomId = string;

/**
 * Agent profile representing a person or AI assistant in a classroom
 */
export interface AgentProfile {
  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** Role in the classroom */
  role: 'teacher' | 'ta' | 'student' | 'facility' | 'coach' | 'observer';

  /** Personality and behavior contract (used as system prompt) */
  personaPrompt: string;

  /** Tool IDs this agent may call in this classroom */
  tools: string[];

  /** Optional avatar configuration */
  avatar?: {
    color?: string;
    icon?: string;
    imageUrl?: string;
  };

  /** Optional metadata */
  metadata?: Record<string, any>;
}

/**
 * Campus location information
 */
export interface CampusLocation {
  /** Campus identifier (e.g., 'main', 'north') */
  campusId: string;

  /** Building identifier (e.g., 'building-b', 'eng-hall') */
  buildingId: string;

  /** Room identifier within building (e.g., 'b.3', 'peace') */
  roomId: string;
}

/**
 * Stage configuration linking to visual scene and diary
 */
export interface ClassroomStage {
  /** LeAgentDiary stage ID (for history/memory) */
  diaryStageId?: string;

  /** Scene key for visual rendering (geospatial/backdrop/projector) */
  sceneKey?: 'geospatial' | 'backdrop' | 'projector' | 'legacy';

  /** Layout preset affecting furniture/behavior */
  layoutPreset: 'class' | 'seminar' | 'focus' | 'workshop' | 'lab' | 'studio';
}

/**
 * Real-time sensor data
 */
export interface ClassroomSensors {
  /** Temperature in Celsius */
  temperatureC?: number;

  /** CO2 concentration in parts per million */
  co2ppm?: number;

  /** Number of people currently in room */
  occupancyCount?: number;

  /** Noise level in decibels */
  noiseDb?: number;

  /** Light level in lux */
  lightLux?: number;

  /** Humidity percentage */
  humidityPercent?: number;

  /** ISO 8601 timestamp of last sensor update */
  lastUpdated: string;
}

/**
 * People in the classroom (personas)
 */
export interface ClassroomPersonas {
  /** Primary teacher/instructor */
  teacher: AgentProfile | null;

  /** Teaching assistants */
  assistants: AgentProfile[];

  /** Students enrolled/present */
  students: AgentProfile[];
}

/**
 * Classroom policies and rules
 */
export interface ClassroomPolicies {
  /** Whether recording (audio/video) is allowed */
  recordingAllowed: boolean;

  /** Whether AI assistants can be invoked */
  aiAssistantsAllowed: boolean;

  /** Maximum number of AI agents that can be active */
  maxAgents: number;

  /** Privacy level */
  privacyLevel?: 'public' | 'members-only' | 'private';
}

/**
 * External service integrations
 */
export interface ClassroomIntegrations {
  /** Notion database ID for syllabus/notes */
  notionDatabaseId?: string;

  /** Slack channel ID for announcements */
  slackChannelId?: string;

  /** Figma file ID for design work */
  figmaFileId?: string;

  /** GitHub repository for code/labs */
  githubRepo?: string;
}

/**
 * UI configuration for ClassroomViewManager
 */
export interface ClassroomUI {
  /** Visual theme */
  theme: 'studio-lite' | 'studio-dark' | 'campus' | 'minimal';

  /** Which sections are enabled/visible */
  enabledSections: {
    chat: boolean;
    presence: boolean;
    sensors: boolean;
    calendar: boolean;
    history: boolean;
    integrations: boolean;
  };

  /** Optional layout customization */
  layout?: {
    gridTemplate?: string;
    sectionOrder?: string[];
  };
}

/**
 * Complete classroom definition
 *
 * This is the single source of truth for a smart classroom.
 * All tools and UI components operate on this object.
 */
export interface ClassroomDefinition {
  /** Unique classroom identifier */
  id: ClassroomId;

  /** Human-readable name */
  name: string;

  /** Physical location on campus */
  campus: CampusLocation;

  /** Visual stage and diary configuration */
  stage: ClassroomStage;

  /** Real-time sensor data */
  sensors: ClassroomSensors;

  /** People (teachers, students, assistants) */
  personas: ClassroomPersonas;

  /** Classroom rules and policies */
  policies: ClassroomPolicies;

  /** External service integrations */
  integrations: ClassroomIntegrations;

  /** UI rendering preferences */
  ui: ClassroomUI;

  /** Additional custom metadata */
  metadata: Record<string, any>;

  /** ISO 8601 timestamp when classroom was created */
  createdAt?: string;

  /** ISO 8601 timestamp when classroom was last updated */
  updatedAt?: string;
}

/**
 * Compact snapshot of a classroom for agent reasoning
 * (Smaller, more "thinking-friendly" than full ClassroomDefinition)
 */
export interface ClassroomSnapshot {
  classroomId: ClassroomId;
  name: string;
  stage: {
    sceneKey: string;
    layoutPreset: string;
  };
  sensors: {
    temperatureC?: number;
    co2ppm?: number;
    occupancyCount?: number;
    comfortScore?: number; // Derived metric
  };
  personas: {
    teacher?: string; // Just name
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

/**
 * Classroom event for history/diary
 */
export interface ClassroomEvent {
  /** Event type (lesson, break, discussion, etc.) */
  type: 'lesson' | 'break' | 'discussion' | 'activity' | 'system' | 'chat' | 'sensor-alert';

  /** ISO 8601 timestamp (defaults to now) */
  timestamp: string;

  /** Human-readable summary */
  summary: string;

  /** Optional structured payload */
  payload?: Record<string, any>;

  /** Agent/user who triggered the event */
  actor?: {
    id: string;
    name: string;
    role: string;
  };
}
