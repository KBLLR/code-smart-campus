/**
 * Classroom Schema (Zod)
 *
 * Runtime validation for ClassroomDefinition objects.
 * Ensures type safety and provides helpful error messages.
 */

import { z } from 'zod';
import type {
  ClassroomDefinition,
  ClassroomSnapshot,
  ClassroomEvent,
} from './classroom-types';

/**
 * Agent Profile Schema
 */
export const AgentProfileSchema = z.object({
  id: z.string().min(1, 'Agent ID required'),
  name: z.string().min(1, 'Agent name required'),
  role: z.enum(['teacher', 'ta', 'student', 'facility', 'coach', 'observer']),
  personaPrompt: z.string().min(10, 'Persona prompt must be at least 10 characters'),
  tools: z.array(z.string()).default([]),
  avatar: z.object({
    color: z.string().optional(),
    icon: z.string().optional(),
    imageUrl: z.string().url().optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Campus Location Schema
 */
export const CampusLocationSchema = z.object({
  campusId: z.string().min(1, 'Campus ID required'),
  buildingId: z.string().min(1, 'Building ID required'),
  roomId: z.string().min(1, 'Room ID required'),
});

/**
 * Classroom Stage Schema
 */
export const ClassroomStageSchema = z.object({
  diaryStageId: z.string().optional(),
  sceneKey: z.enum(['geospatial', 'backdrop', 'projector', 'legacy']).optional(),
  layoutPreset: z.enum(['class', 'seminar', 'focus', 'workshop', 'lab', 'studio']),
});

/**
 * Classroom Sensors Schema
 */
export const ClassroomSensorsSchema = z.object({
  temperatureC: z.number().min(-50).max(100).optional(),
  co2ppm: z.number().min(0).max(10000).optional(),
  occupancyCount: z.number().int().min(0).optional(),
  noiseDb: z.number().min(0).max(200).optional(),
  lightLux: z.number().min(0).optional(),
  humidityPercent: z.number().min(0).max(100).optional(),
  lastUpdated: z.string().datetime(),
});

/**
 * Classroom Personas Schema
 */
export const ClassroomPersonasSchema = z.object({
  teacher: AgentProfileSchema.nullable(),
  assistants: z.array(AgentProfileSchema).default([]),
  students: z.array(AgentProfileSchema).default([]),
});

/**
 * Classroom Policies Schema
 */
export const ClassroomPoliciesSchema = z.object({
  recordingAllowed: z.boolean().default(false),
  aiAssistantsAllowed: z.boolean().default(true),
  maxAgents: z.number().int().min(1).max(20).default(5),
  privacyLevel: z.enum(['public', 'members-only', 'private']).optional(),
});

/**
 * Classroom Integrations Schema
 */
export const ClassroomIntegrationsSchema = z.object({
  notionDatabaseId: z.string().optional(),
  slackChannelId: z.string().optional(),
  figmaFileId: z.string().optional(),
  githubRepo: z.string().optional(),
});

/**
 * Classroom UI Schema
 */
export const ClassroomUISchema = z.object({
  theme: z.enum(['studio-lite', 'studio-dark', 'campus', 'minimal']).default('campus'),
  enabledSections: z.object({
    chat: z.boolean().default(true),
    presence: z.boolean().default(true),
    sensors: z.boolean().default(true),
    calendar: z.boolean().default(true),
    history: z.boolean().default(true),
    integrations: z.boolean().default(true),
  }),
  layout: z.object({
    gridTemplate: z.string().optional(),
    sectionOrder: z.array(z.string()).optional(),
  }).optional(),
});

/**
 * Complete Classroom Definition Schema
 */
export const ClassroomSchema = z.object({
  id: z.string().min(1, 'Classroom ID required'),
  name: z.string().min(1, 'Classroom name required'),
  campus: CampusLocationSchema,
  stage: ClassroomStageSchema,
  sensors: ClassroomSensorsSchema,
  personas: ClassroomPersonasSchema,
  policies: ClassroomPoliciesSchema,
  integrations: ClassroomIntegrationsSchema,
  ui: ClassroomUISchema,
  metadata: z.record(z.any()).default({}),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

/**
 * Classroom Snapshot Schema (compact version for agents)
 */
export const ClassroomSnapshotSchema = z.object({
  classroomId: z.string(),
  name: z.string(),
  stage: z.object({
    sceneKey: z.string(),
    layoutPreset: z.string(),
  }),
  sensors: z.object({
    temperatureC: z.number().optional(),
    co2ppm: z.number().optional(),
    occupancyCount: z.number().optional(),
    comfortScore: z.number().min(0).max(100).optional(),
  }),
  personas: z.object({
    teacher: z.string().optional(),
    assistantCount: z.number().int(),
    studentCount: z.number().int(),
  }),
  nextCalendarEvents: z.array(z.object({
    title: z.string(),
    start: z.string(),
    end: z.string(),
  })).optional(),
  currentActivity: z.string().optional(),
});

/**
 * Classroom Event Schema
 */
export const ClassroomEventSchema = z.object({
  type: z.enum(['lesson', 'break', 'discussion', 'activity', 'system', 'chat', 'sensor-alert']),
  timestamp: z.string().datetime(),
  summary: z.string().min(1),
  payload: z.record(z.any()).optional(),
  actor: z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
  }).optional(),
});

/**
 * Validate a ClassroomDefinition object
 *
 * @param data - Unvalidated JSON data
 * @returns Validated and typed ClassroomDefinition
 * @throws ZodError with detailed validation errors
 */
export function validateClassroomDefinition(data: unknown): ClassroomDefinition {
  return ClassroomSchema.parse(data) as ClassroomDefinition;
}

/**
 * Safely validate a ClassroomDefinition without throwing
 *
 * @param data - Unvalidated JSON data
 * @returns { success: true, data } or { success: false, error }
 */
export function safeValidateClassroom(data: unknown) {
  return ClassroomSchema.safeParse(data);
}

/**
 * Validate a ClassroomSnapshot
 */
export function validateClassroomSnapshot(data: unknown): ClassroomSnapshot {
  return ClassroomSnapshotSchema.parse(data) as ClassroomSnapshot;
}

/**
 * Validate a ClassroomEvent
 */
export function validateClassroomEvent(data: unknown): ClassroomEvent {
  return ClassroomEventSchema.parse(data) as ClassroomEvent;
}
