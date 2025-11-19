/**
 * Classroom Tools
 *
 * OpenAI-style tool implementations that operate on Classroom objects.
 * These tools are parameterized by classroom_id, not separate per classroom.
 *
 * Pattern: Tools work WITH ClassroomDefinition objects, not as separate entities.
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import {
  validateClassroomEvent,
  safeValidateClassroom,
} from './classroom-schema';
import type {
  ClassroomDefinition,
  ClassroomSnapshot,
  ClassroomEvent,
  ClassroomId,
} from './classroom-types';

/**
 * Classroom storage configuration
 */
const CLASSROOMS_DIR = join(process.cwd(), 'data', 'classrooms');

/**
 * In-memory cache of loaded classrooms
 * (In production, this would be replaced with database/Redis)
 */
const classroomCache = new Map<ClassroomId, ClassroomDefinition>();

/**
 * Tool Result wrapper
 */
interface ToolResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// Tool 1: get_classroom
// ============================================================================

/**
 * Get Classroom Tool
 *
 * Fetches the complete ClassroomDefinition for a given classroom_id.
 * This is the primary way agents and UI access classroom data.
 *
 * OpenAI Function Definition:
 * {
 *   "name": "get_classroom",
 *   "description": "Fetch complete classroom definition including sensors, personas, integrations, and configuration",
 *   "parameters": {
 *     "type": "object",
 *     "properties": {
 *       "classroom_id": {
 *         "type": "string",
 *         "description": "Unique classroom identifier (e.g., 'eng-101', 'lab-a')"
 *       }
 *     },
 *     "required": ["classroom_id"]
 *   }
 * }
 */
export async function get_classroom(params: {
  classroom_id: ClassroomId;
}): Promise<ToolResult<ClassroomDefinition>> {
  const { classroom_id } = params;

  try {
    // Check cache first
    if (classroomCache.has(classroom_id)) {
      console.log(`[get_classroom] Cache hit: ${classroom_id}`);
      return {
        success: true,
        data: classroomCache.get(classroom_id)!,
      };
    }

    // Load from filesystem
    const filePath = join(CLASSROOMS_DIR, `${classroom_id}.json`);

    let jsonData: any;
    try {
      const fileContent = readFileSync(filePath, 'utf-8');
      jsonData = JSON.parse(fileContent);
    } catch (fileError: any) {
      if (fileError.code === 'ENOENT') {
        return {
          success: false,
          error: `Classroom "${classroom_id}" not found. Available classrooms: ${listAvailableClassrooms().join(', ')}`,
        };
      }
      throw fileError;
    }

    // Validate with Zod schema
    const validationResult = safeValidateClassroom(jsonData);

    if (!validationResult.success) {
      console.error(`[get_classroom] Validation failed for ${classroom_id}:`, validationResult.error);
      return {
        success: false,
        error: `Invalid classroom data for "${classroom_id}": ${validationResult.error.message}`,
      };
    }

    const classroom = validationResult.data as ClassroomDefinition;

    // Cache it
    classroomCache.set(classroom_id, classroom);

    console.log(`[get_classroom] Loaded: ${classroom_id} (${classroom.name})`);

    return {
      success: true,
      data: classroom,
    };
  } catch (error: any) {
    console.error(`[get_classroom] Error loading ${classroom_id}:`, error);
    return {
      success: false,
      error: `Failed to load classroom: ${error.message}`,
    };
  }
}

// ============================================================================
// Tool 2: get_classroom_snapshot
// ============================================================================

/**
 * Get Classroom Snapshot Tool
 *
 * Returns a compact, "thinking-friendly" snapshot of a classroom.
 * Optimized for agent reasoning with derived metrics (comfort score).
 *
 * OpenAI Function Definition:
 * {
 *   "name": "get_classroom_snapshot",
 *   "description": "Get compact classroom snapshot with current sensors, personas, and upcoming events - optimized for agent reasoning",
 *   "parameters": {
 *     "type": "object",
 *     "properties": {
 *       "classroom_id": {
 *         "type": "string",
 *         "description": "Unique classroom identifier"
 *       }
 *     },
 *     "required": ["classroom_id"]
 *   }
 * }
 */
export async function get_classroom_snapshot(params: {
  classroom_id: ClassroomId;
}): Promise<ToolResult<ClassroomSnapshot>> {
  const { classroom_id } = params;

  try {
    // Get full classroom definition
    const classroomResult = await get_classroom({ classroom_id });

    if (!classroomResult.success || !classroomResult.data) {
      return {
        success: false,
        error: classroomResult.error,
      };
    }

    const classroom = classroomResult.data;

    // Calculate comfort score (0-100) based on sensors
    const comfortScore = calculateComfortScore(classroom.sensors);

    // Build compact snapshot
    const snapshot: ClassroomSnapshot = {
      classroomId: classroom.id,
      name: classroom.name,
      stage: {
        sceneKey: classroom.stage.sceneKey || 'legacy',
        layoutPreset: classroom.stage.layoutPreset,
      },
      sensors: {
        temperatureC: classroom.sensors.temperatureC,
        co2ppm: classroom.sensors.co2ppm,
        occupancyCount: classroom.sensors.occupancyCount,
        comfortScore,
      },
      personas: {
        teacher: classroom.personas.teacher?.name,
        assistantCount: classroom.personas.assistants.length,
        studentCount: classroom.personas.students.length,
      },
      // TODO: Integrate with calendar service
      nextCalendarEvents: undefined,
      currentActivity: deriveCurrentActivity(classroom),
    };

    console.log(`[get_classroom_snapshot] Generated snapshot for ${classroom_id} (comfort: ${comfortScore})`);

    return {
      success: true,
      data: snapshot,
    };
  } catch (error: any) {
    console.error(`[get_classroom_snapshot] Error:`, error);
    return {
      success: false,
      error: `Failed to generate snapshot: ${error.message}`,
    };
  }
}

// ============================================================================
// Tool 3: append_classroom_event
// ============================================================================

/**
 * Append Classroom Event Tool
 *
 * Records an event in the classroom's history/diary.
 * Events are forwarded to LeAgentDiary for persistent storage.
 *
 * OpenAI Function Definition:
 * {
 *   "name": "append_classroom_event",
 *   "description": "Record an event in the classroom's history and diary (lesson, discussion, sensor alert, etc.)",
 *   "parameters": {
 *     "type": "object",
 *     "properties": {
 *       "classroom_id": {
 *         "type": "string",
 *         "description": "Unique classroom identifier"
 *       },
 *       "event": {
 *         "type": "object",
 *         "properties": {
 *           "type": {
 *             "type": "string",
 *             "enum": ["lesson", "break", "discussion", "activity", "system", "chat", "sensor-alert"],
 *             "description": "Type of event"
 *           },
 *           "summary": {
 *             "type": "string",
 *             "description": "Human-readable event summary"
 *           },
 *           "timestamp": {
 *             "type": "string",
 *             "description": "ISO 8601 timestamp (defaults to now if omitted)"
 *           },
 *           "payload": {
 *             "type": "object",
 *             "description": "Optional structured data"
 *           }
 *         },
 *         "required": ["type", "summary"]
 *       }
 *     },
 *     "required": ["classroom_id", "event"]
 *   }
 * }
 */
export async function append_classroom_event(params: {
  classroom_id: ClassroomId;
  event: {
    type: ClassroomEvent['type'];
    summary: string;
    timestamp?: string;
    payload?: Record<string, any>;
    actor?: {
      id: string;
      name: string;
      role: string;
    };
  };
}): Promise<ToolResult<{ eventId: string }>> {
  const { classroom_id, event } = params;

  try {
    // Get classroom to verify it exists and get diaryStageId
    const classroomResult = await get_classroom({ classroom_id });

    if (!classroomResult.success || !classroomResult.data) {
      return {
        success: false,
        error: classroomResult.error,
      };
    }

    const classroom = classroomResult.data;

    // Default timestamp to now if not provided
    const timestamp = event.timestamp || new Date().toISOString();

    // Build complete event
    const completeEvent: ClassroomEvent = {
      type: event.type,
      summary: event.summary,
      timestamp,
      payload: event.payload,
      actor: event.actor,
    };

    // Validate event structure
    try {
      validateClassroomEvent(completeEvent);
    } catch (validationError: any) {
      return {
        success: false,
        error: `Invalid event data: ${validationError.message}`,
      };
    }

    // Generate event ID
    const eventId = `${classroom_id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // TODO: Forward to LeAgentDiaryBridge
    // For now, log the event
    console.log(`[append_classroom_event] Event recorded:`, {
      eventId,
      classroomId: classroom_id,
      diaryStageId: classroom.stage.diaryStageId,
      event: completeEvent,
    });

    // In production, this would be:
    // await leAgentDiaryBridge.pushEvent({
    //   stageId: classroom.stage.diaryStageId,
    //   event: completeEvent,
    //   metadata: { classroomId: classroom_id, eventId }
    // });

    return {
      success: true,
      data: { eventId },
    };
  } catch (error: any) {
    console.error(`[append_classroom_event] Error:`, error);
    return {
      success: false,
      error: `Failed to append event: ${error.message}`,
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate comfort score (0-100) based on sensor data
 *
 * Scoring factors:
 * - Temperature: optimal 19-23°C
 * - CO2: optimal <800ppm, poor >1200ppm
 * - Humidity: optimal 30-60%
 * - Light: optimal 300-500 lux
 */
function calculateComfortScore(sensors: ClassroomDefinition['sensors']): number {
  let score = 100;

  // Temperature scoring (-20 max)
  if (sensors.temperatureC !== undefined) {
    const temp = sensors.temperatureC;
    if (temp < 18 || temp > 25) {
      score -= 20;
    } else if (temp < 19 || temp > 23) {
      score -= 10;
    }
  }

  // CO2 scoring (-30 max)
  if (sensors.co2ppm !== undefined) {
    const co2 = sensors.co2ppm;
    if (co2 > 1500) {
      score -= 30;
    } else if (co2 > 1200) {
      score -= 20;
    } else if (co2 > 1000) {
      score -= 10;
    }
  }

  // Humidity scoring (-15 max)
  if (sensors.humidityPercent !== undefined) {
    const humidity = sensors.humidityPercent;
    if (humidity < 20 || humidity > 70) {
      score -= 15;
    } else if (humidity < 30 || humidity > 60) {
      score -= 8;
    }
  }

  // Light scoring (-15 max)
  if (sensors.lightLux !== undefined) {
    const light = sensors.lightLux;
    if (light < 200 || light > 800) {
      score -= 15;
    } else if (light < 300 || light > 500) {
      score -= 8;
    }
  }

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Derive current activity from classroom state
 */
function deriveCurrentActivity(classroom: ClassroomDefinition): string | undefined {
  const { sensors, stage } = classroom;

  // If occupancy is 0, room is empty
  if (sensors.occupancyCount === 0) {
    return 'empty';
  }

  // Derive based on layout preset
  if (stage.layoutPreset === 'focus' && sensors.occupancyCount && sensors.occupancyCount < 5) {
    return 'individual-study';
  }

  if (stage.layoutPreset === 'seminar' && sensors.occupancyCount && sensors.occupancyCount > 5) {
    return 'group-discussion';
  }

  if (stage.layoutPreset === 'lab') {
    return 'hands-on-work';
  }

  if (stage.layoutPreset === 'class' && sensors.occupancyCount && sensors.occupancyCount > 10) {
    return 'lecture';
  }

  // Default based on occupancy
  if (sensors.occupancyCount && sensors.occupancyCount > 15) {
    return 'class-session';
  } else if (sensors.occupancyCount && sensors.occupancyCount > 5) {
    return 'small-group';
  }

  return undefined;
}

/**
 * List available classroom IDs
 */
function listAvailableClassrooms(): string[] {
  try {
    const files = readdirSync(CLASSROOMS_DIR);
    return files
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''));
  } catch (error) {
    console.warn('[listAvailableClassrooms] Could not read classrooms directory:', error);
    return [];
  }
}

/**
 * Clear classroom cache (useful for development/testing)
 */
export function clearClassroomCache(): void {
  classroomCache.clear();
  console.log('[Classroom Tools] Cache cleared');
}

/**
 * Preload all classrooms into cache
 */
export async function preloadClassrooms(): Promise<void> {
  const classroomIds = listAvailableClassrooms();
  console.log(`[Classroom Tools] Preloading ${classroomIds.length} classrooms...`);

  for (const id of classroomIds) {
    await get_classroom({ classroom_id: id });
  }

  console.log(`[Classroom Tools] Preloaded ${classroomCache.size} classrooms`);
}

// ============================================================================
// OpenAI Tool Definitions (for easy copy-paste)
// ============================================================================

/**
 * OpenAI Function Calling Tool Definitions
 *
 * Copy these into your OpenAI API call's "tools" array.
 */
export const OPENAI_TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_classroom',
      description:
        'Fetch complete classroom definition including sensors, personas, integrations, and configuration',
      parameters: {
        type: 'object',
        properties: {
          classroom_id: {
            type: 'string',
            description: "Unique classroom identifier (e.g., 'eng-101', 'lab-a')",
          },
        },
        required: ['classroom_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_classroom_snapshot',
      description:
        'Get compact classroom snapshot with current sensors, personas, and upcoming events - optimized for agent reasoning',
      parameters: {
        type: 'object',
        properties: {
          classroom_id: {
            type: 'string',
            description: 'Unique classroom identifier',
          },
        },
        required: ['classroom_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'append_classroom_event',
      description:
        "Record an event in the classroom's history and diary (lesson, discussion, sensor alert, etc.)",
      parameters: {
        type: 'object',
        properties: {
          classroom_id: {
            type: 'string',
            description: 'Unique classroom identifier',
          },
          event: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['lesson', 'break', 'discussion', 'activity', 'system', 'chat', 'sensor-alert'],
                description: 'Type of event',
              },
              summary: {
                type: 'string',
                description: 'Human-readable event summary',
              },
              timestamp: {
                type: 'string',
                description: 'ISO 8601 timestamp (defaults to now if omitted)',
              },
              payload: {
                type: 'object',
                description: 'Optional structured data',
              },
            },
            required: ['type', 'summary'],
          },
        },
        required: ['classroom_id', 'event'],
      },
    },
  },
];
