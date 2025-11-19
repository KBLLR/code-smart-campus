/**
 * Classroom UI Types
 *
 * Mirror types from shared/classroom/classroom-types.ts for UI consumption.
 * These can be replaced with direct imports if sharing types across client/server.
 */

export interface ClassroomSensors {
  temperatureC?: number;
  co2ppm?: number;
  occupancyCount?: number;
  noiseDb?: number;
  lightLux?: number;
  humidityPercent?: number;
  lastUpdated?: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  role: 'teacher' | 'ta' | 'student' | 'facility' | 'coach' | 'observer';
  personaPrompt?: string;
  tools?: string[];
  avatar?: {
    color?: string;
    icon?: string;
    imageUrl?: string;
  };
}

export interface ClassroomDefinition {
  id: string;
  name: string;
  campus: {
    campusId: string;
    buildingId: string;
    roomId: string;
  };
  stage: {
    diaryStageId?: string;
    sceneKey?: string; // 'geospatial' | 'backdrop' | 'projector' | ...
    layoutPreset: string; // 'class' | 'seminar' | 'lab' | 'focus' | ...
  };
  sensors: ClassroomSensors;
  personas: {
    teacher: AgentProfile | null;
    assistants: AgentProfile[];
    students: AgentProfile[];
  };
  policies: {
    recordingAllowed: boolean;
    aiAssistantsAllowed: boolean;
    maxAgents: number;
    [key: string]: any;
  };
  integrations: {
    notionDatabaseId?: string;
    slackChannelId?: string;
    figmaFileId?: string;
    githubRepo?: string;
    [key: string]: any;
  };
  ui: {
    theme: 'studio-lite' | 'studio-dark' | 'campus' | 'minimal';
    enabledSections: {
      chat: boolean;
      presence: boolean;
      sensors: boolean;
      calendar: boolean;
      history: boolean;
      integrations: boolean;
    };
  };
  metadata?: Record<string, any>;
}

export interface ClassroomSnapshot {
  classroomId: string;
  name: string;
  comfortScore?: number; // 0–100
  inferredActivity?: string; // 'lecture', 'small-group', 'hands-on-work', etc.
  sensors: ClassroomSensors;
  personasSummary?: {
    teacherName?: string;
    studentCount?: number;
    assistantCount?: number;
  };
}

export interface ClassroomEvent {
  id: string;
  classroomId: string;
  type: string;
  timestamp: string;
  summary: string;
  payload?: any;
}
