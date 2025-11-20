/**
 * Classroom API Plugin for Vite
 *
 * Provides REST endpoints for classroom operations:
 * - GET /api/classrooms/:id - Get classroom definition
 * - GET /api/classrooms/:id/snapshot - Get classroom snapshot
 * - GET /api/classrooms/:id/events - Get classroom events
 * - POST /api/classrooms/:id/events - Append classroom event
 * - POST /api/classrooms/:id/chat - Chat with classroom AI assistant (MLX-enabled)
 * - GET /api/classrooms/:id/calendar - Get classroom calendar
 * - WS /api/classrooms/:id/sensors - Stream sensor updates
 *
 * MLX Integration (Phase 2):
 * - Supports local MLX server via ENABLE_LOCAL_AI env var
 * - Implements tool calling loop with classroom-scoped tools
 * - Preserves existing OpenAI cloud fallback
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import { randomBytes } from 'crypto';

// Load environment variables
config();

// Import classroom tools for MLX tool calling
import {
  get_classroom,
  get_classroom_snapshot,
  append_classroom_event,
  OPENAI_TOOL_DEFINITIONS,
} from './shared/classroom/classroom-tools.js';

// In-memory stores (in production, use database/Redis)
const eventsStore = new Map(); // classroom_id -> ClassroomEvent[]

// ============================================================================
// Configuration & Helpers
// ============================================================================

/**
 * MLX Configuration from environment variables
 */
const MLX_CONFIG = {
  enabled: process.env.ENABLE_LOCAL_AI === 'true',
  serverUrl: process.env.MLX_SERVER_URL || 'http://localhost:8000',
  modelName: process.env.MLX_MODEL_NAME || 'mlx-community/qwen2.5-7b-instruct-4bit',
  cloudFallback: process.env.ENABLE_CLOUD_FALLBACK === 'true',
  logLevel: process.env.LOG_LEVEL || 'info',
  debugMode: process.env.DEBUG_CHAT_API === 'true',
};

/**
 * Generate a non-PII request ID for logging and tracing
 * Format: classroom-{classroomId}-{random}
 */
function generateRequestId(classroomId) {
  const random = randomBytes(8).toString('hex');
  return `classroom-${classroomId}-${random}`;
}

/**
 * Safe logger that never logs PII (student messages, names)
 * Logs request IDs, tool calls, and system events only
 */
function safeLog(level, requestId, message, metadata = {}) {
  if (MLX_CONFIG.logLevel === 'error' && level !== 'error') return;

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    requestId,
    message,
    ...metadata,
  };

  if (MLX_CONFIG.debugMode || level === 'error') {
    console[level === 'error' ? 'error' : 'log'](`[Chat API] ${JSON.stringify(logEntry)}`);
  } else if (level === 'info') {
    console.log(`[Chat API] ${timestamp} ${requestId} - ${message}`);
  }
}

/**
 * Parse request body for POST requests
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

/**
 * Extract classroom ID from path like /api/classrooms/eng-101/...
 */
function extractClassroomId(url) {
  const match = url.match(/\/api\/classrooms\/([^\/]+)/);
  return match ? match[1] : null;
}

/**
 * Load classroom from filesystem (mimicking shared/classroom/classroom-tools.ts)
 */
function loadClassroom(classroomId) {
  try {
    const filePath = join(process.cwd(), 'data', 'classrooms', `${classroomId}.json`);
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null;
    }
    throw err;
  }
}

/**
 * Generate a snapshot from classroom definition
 */
function generateSnapshot(classroom) {
  const { sensors, personas } = classroom;

  // Calculate comfort score (simplified)
  let comfortScore = 70;
  if (sensors.temperatureC) {
    const tempDiff = Math.abs(sensors.temperatureC - 22);
    comfortScore -= tempDiff * 3;
  }
  if (sensors.co2ppm && sensors.co2ppm > 1000) {
    comfortScore -= (sensors.co2ppm - 1000) / 20;
  }
  if (sensors.noiseDb && sensors.noiseDb > 60) {
    comfortScore -= (sensors.noiseDb - 60) / 2;
  }
  comfortScore = Math.max(0, Math.min(100, comfortScore));

  // Infer activity from occupancy and time
  let inferredActivity = 'idle';
  if (sensors.occupancyCount > 0) {
    inferredActivity = sensors.occupancyCount > 15 ? 'lecture' : 'group-work';
  }

  return {
    classroomId: classroom.classroomId,
    timestamp: new Date().toISOString(),
    sensors: { ...sensors },
    personas: Object.keys(personas).map(role => ({
      role,
      ...personas[role],
    })),
    comfortScore: Math.round(comfortScore),
    inferredActivity,
  };
}

/**
 * Initialize events store for a classroom
 */
function getEvents(classroomId) {
  if (!eventsStore.has(classroomId)) {
    eventsStore.set(classroomId, []);
  }
  return eventsStore.get(classroomId);
}

/**
 * Append event to classroom
 */
function appendEvent(classroomId, event) {
  const events = getEvents(classroomId);
  const newEvent = {
    eventId: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    classroomId,
    timestamp: new Date().toISOString(),
    ...event,
  };
  events.push(newEvent);
  // Keep only last 100 events
  if (events.length > 100) {
    events.shift();
  }
  return newEvent;
}

/**
 * Load static calendar data
 */
function loadCalendar(classroomId) {
  try {
    const filePath = join(process.cwd(), 'data', 'classrooms', `${classroomId}-calendar.json`);
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`[calendar] Error loading calendar for ${classroomId}:`, err);
  }
  // Return default schedule if no file exists
  return [];
}

// ============================================================================
// Tool Execution (for MLX tool calling)
// ============================================================================

/**
 * Execute a classroom tool call from the MLX model
 * Enforces classroom scoping - tools can only access their own classroom
 *
 * @param {string} toolName - Name of the tool (e.g., 'get_classroom_snapshot')
 * @param {object} toolArgs - Tool arguments from the model
 * @param {string} classroomId - Classroom ID from the chat request
 * @param {string} requestId - Request ID for logging
 * @returns {Promise<object>} Tool execution result
 */
async function executeClassroomTool(toolName, toolArgs, classroomId, requestId) {
  // SECURITY: Enforce classroom scoping
  // Tools MUST operate only on the classroom from the chat request
  const scopedArgs = {
    ...toolArgs,
    classroom_id: classroomId, // Override with actual classroom from request
  };

  safeLog('info', requestId, `Executing tool: ${toolName}`, {
    toolName,
    // Don't log full args - may contain PII
    hasArgs: Object.keys(toolArgs).length > 0,
  });

  try {
    let result;

    switch (toolName) {
      case 'get_classroom':
        result = await get_classroom(scopedArgs);
        break;

      case 'get_classroom_snapshot':
        result = await get_classroom_snapshot(scopedArgs);
        break;

      case 'append_classroom_event':
        result = await append_classroom_event(scopedArgs);
        // Also update in-memory events store
        if (result.success && result.data) {
          appendEvent(classroomId, scopedArgs.event);
        }
        break;

      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}. Available tools: get_classroom, get_classroom_snapshot, append_classroom_event`,
        };
    }

    safeLog('info', requestId, `Tool executed: ${toolName}`, {
      success: result.success,
    });

    return result;
  } catch (error) {
    safeLog('error', requestId, `Tool execution failed: ${toolName}`, {
      error: error.message,
    });

    return {
      success: false,
      error: `Tool execution error: ${error.message}`,
    };
  }
}

// ============================================================================
// Chat Response Generation (MLX + OpenAI + Fallback)
// ============================================================================

/**
 * Generate chat response using MLX server, OpenAI cloud, or mock
 * Implements tool calling loop for MLX integration
 *
 * @param {string} classroomId - Classroom ID
 * @param {Array} messages - Chat messages from frontend
 * @param {string} mode - Chat mode (reserved for future use)
 * @returns {Promise<object>} Assistant message response
 */
async function generateChatResponse(classroomId, messages, mode = 'default') {
  const requestId = generateRequestId(classroomId);

  try {
    const classroom = loadClassroom(classroomId);
    if (!classroom) {
      throw new Error(`Classroom ${classroomId} not found`);
    }

    const snapshot = generateSnapshot(classroom);

    // Build system prompt with classroom context
    const systemPrompt = `You are a helpful AI assistant for ${classroom.name}, a smart classroom.

**Classroom Context:**
- Location: ${classroom.campus.buildingId}, Room ${classroom.campus.roomId}
- Teacher: ${classroom.personas.teacher?.name || 'N/A'}
- Current Activity: ${snapshot.inferredActivity}
- Occupancy: ${classroom.sensors.occupancyCount} people
- Comfort Score: ${snapshot.comfortScore}/100

**Current Sensors:**
- Temperature: ${classroom.sensors.temperatureC}°C
- CO₂: ${classroom.sensors.co2ppm} ppm
- Humidity: ${classroom.sensors.humidityPercent}%
- Light: ${classroom.sensors.lightLux} lux
- Noise: ${classroom.sensors.noiseDb} dB

**Guidelines:**
- Be helpful and context-aware
- If comfort score is low, suggest improvements (ventilation, lighting, breaks)
- Reference the teacher and classroom policies when relevant
- Keep responses concise and actionable
- Use tools when you need real-time data or to record events

Respond naturally to user questions about the classroom environment, schedule, or general assistance.`;

    // ===== ROUTING: MLX vs OpenAI Cloud vs Mock =====

    if (MLX_CONFIG.enabled) {
      // Route 1: Local MLX Server
      safeLog('info', requestId, 'Using local MLX server', {
        serverUrl: MLX_CONFIG.serverUrl,
        model: MLX_CONFIG.modelName,
      });

      return await generateMLXResponse(
        classroomId,
        systemPrompt,
        messages,
        requestId
      );
    } else if (process.env.OPENAI_API_KEY) {
      // Route 2: OpenAI Cloud API
      safeLog('info', requestId, 'Using OpenAI cloud API');

      return await generateOpenAIResponse(
        systemPrompt,
        messages,
        requestId
      );
    } else {
      // Route 3: Mock Response (no API key, MLX disabled)
      safeLog('info', requestId, 'Using mock response (no API configured)');

      return {
        role: 'assistant',
        content: `[Mock Response] I'm the ${classroom.name} assistant. The comfort score is ${snapshot.comfortScore}/100. How can I help you?`,
      };
    }
  } catch (err) {
    safeLog('error', requestId, 'Error generating chat response', {
      error: err.message,
    });
    throw err;
  }
}

/**
 * Generate response using local MLX server with tool calling
 */
async function generateMLXResponse(classroomId, systemPrompt, messages, requestId) {
  const fetch = (await import('node-fetch')).default;

  try {
    // Prepare messages with system prompt
    const allMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    // First call: Send messages + tool definitions
    let response;
    try {
      response = await fetch(`${MLX_CONFIG.serverUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
        },
        body: JSON.stringify({
          model: MLX_CONFIG.modelName,
          messages: allMessages,
          tools: OPENAI_TOOL_DEFINITIONS,
          temperature: 0.7,
          max_tokens: 800,
        }),
      });
    } catch (fetchError) {
      if (MLX_CONFIG.cloudFallback && process.env.OPENAI_API_KEY) {
        safeLog('info', requestId, 'MLX server unreachable, falling back to OpenAI', {
          error: fetchError.message,
        });
        return await generateOpenAIResponse(systemPrompt, messages, requestId);
      }
      throw new Error(`MLX server unreachable at ${MLX_CONFIG.serverUrl}: ${fetchError.message}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MLX server error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    let assistantMessage = data.choices[0].message;

    safeLog('info', requestId, 'Received MLX response', {
      hasToolCalls: !!assistantMessage.tool_calls,
      toolCallCount: assistantMessage.tool_calls?.length || 0,
    });

    // Tool calling loop
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      safeLog('info', requestId, 'Processing tool calls', {
        count: assistantMessage.tool_calls.length,
      });

      // Add assistant's tool_calls message to conversation
      allMessages.push(assistantMessage);

      // Execute each tool call
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);

        const toolResult = await executeClassroomTool(
          toolName,
          toolArgs,
          classroomId,
          requestId
        );

        // Add tool result as a tool message
        allMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        });
      }

      // Second call: Get final response with tool results
      const finalResponse = await fetch(`${MLX_CONFIG.serverUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
        },
        body: JSON.stringify({
          model: MLX_CONFIG.modelName,
          messages: allMessages,
          temperature: 0.7,
          max_tokens: 800,
        }),
      });

      if (!finalResponse.ok) {
        const errorText = await finalResponse.text();
        throw new Error(`MLX server error on follow-up (${finalResponse.status}): ${errorText}`);
      }

      const finalData = await finalResponse.json();
      assistantMessage = finalData.choices[0].message;

      safeLog('info', requestId, 'Tool calling complete', {
        toolsExecuted: assistantMessage.tool_calls?.length || 0,
      });
    }

    safeLog('info', requestId, 'Chat response generated via MLX');
    return assistantMessage;
  } catch (err) {
    safeLog('error', requestId, 'MLX response generation failed', {
      error: err.message,
    });
    throw err;
  }
}

/**
 * Generate response using OpenAI cloud API (fallback)
 */
async function generateOpenAIResponse(systemPrompt, messages, requestId) {
  const fetch = (await import('node-fetch')).default;
  const apiKey = process.env.OPENAI_API_KEY;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    safeLog('info', requestId, 'Chat response generated via OpenAI Cloud');
    return data.choices[0].message;
  } catch (err) {
    safeLog('error', requestId, 'OpenAI response generation failed', {
      error: err.message,
    });
    throw err;
  }
}


export default function classroomApiPlugin() {
  return {
    name: 'classroom-api',

    configureServer(server) {
      const { server: httpServer } = server;

      // ==================== REST ENDPOINTS ====================

      // GET /api/classrooms/:id
      server.middlewares.use('/api/classrooms', async (req, res, next) => {
        if (req.method !== 'GET') return next();

        const classroomId = extractClassroomId(req.url);
        if (!classroomId || req.url !== `/api/classrooms/${classroomId}`) {
          return next();
        }

        try {
          const classroom = loadClassroom(classroomId);
          if (!classroom) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: `Classroom ${classroomId} not found` }));
            return;
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(classroom));
        } catch (err) {
          console.error('[API] Error loading classroom:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // GET /api/classrooms/:id/snapshot
      server.middlewares.use('/api/classrooms', async (req, res, next) => {
        if (req.method !== 'GET') return next();

        const match = req.url.match(/^\/api\/classrooms\/([^\/]+)\/snapshot$/);
        if (!match) return next();

        const classroomId = match[1];

        try {
          const classroom = loadClassroom(classroomId);
          if (!classroom) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: `Classroom ${classroomId} not found` }));
            return;
          }

          const snapshot = generateSnapshot(classroom);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(snapshot));
        } catch (err) {
          console.error('[API] Error generating snapshot:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // GET /api/classrooms/:id/events
      server.middlewares.use('/api/classrooms', async (req, res, next) => {
        if (req.method !== 'GET') return next();

        const match = req.url.match(/^\/api\/classrooms\/([^\/]+)\/events$/);
        if (!match) return next();

        const classroomId = match[1];
        const events = getEvents(classroomId);

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(events));
      });

      // POST /api/classrooms/:id/events
      server.middlewares.use('/api/classrooms', async (req, res, next) => {
        if (req.method !== 'POST') return next();

        const match = req.url.match(/^\/api\/classrooms\/([^\/]+)\/events$/);
        if (!match) return next();

        const classroomId = match[1];

        try {
          const body = await parseBody(req);
          const event = appendEvent(classroomId, body);

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(event));
        } catch (err) {
          console.error('[API] Error appending event:', err);
          res.statusCode = 400;
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // POST /api/classrooms/:id/chat
      server.middlewares.use('/api/classrooms', async (req, res, next) => {
        if (req.method !== 'POST') return next();

        const match = req.url.match(/^\/api\/classrooms\/([^\/]+)\/chat$/);
        if (!match) return next();

        const classroomId = match[1];

        try {
          const body = await parseBody(req);
          const { messages, mode } = body;

          if (!messages || !Array.isArray(messages)) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'messages array required' }));
            return;
          }

          const response = await generateChatResponse(classroomId, messages, mode);

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(response));
        } catch (err) {
          console.error('[API] Error in chat:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // GET /api/classrooms/:id/calendar
      server.middlewares.use('/api/classrooms', async (req, res, next) => {
        if (req.method !== 'GET') return next();

        const match = req.url.match(/^\/api\/classrooms\/([^\/]+)\/calendar$/);
        if (!match) return next();

        const classroomId = match[1];

        try {
          const calendar = loadCalendar(classroomId);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(calendar));
        } catch (err) {
          console.error('[API] Error loading calendar:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // ==================== WEBSOCKET FOR SENSORS ====================

      // Setup WebSocket server when HTTP server is ready
      // Note: WebSocket support requires the 'ws' package to be installed
      // For now, we'll use Server-Sent Events (SSE) as a fallback
      // WebSocket can be added later with: npm install ws

      // GET /api/classrooms/:id/sensors/stream (Server-Sent Events)
      server.middlewares.use('/api/classrooms', async (req, res, next) => {
        if (req.method !== 'GET') return next();

        const match = req.url.match(/^\/api\/classrooms\/([^\/]+)\/sensors$/);
        if (!match) return next();

        const classroomId = match[1];

        // Setup SSE
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });

        console.log(`[SSE] Client connected to sensors for ${classroomId}`);

        // Send initial state
        const classroom = loadClassroom(classroomId);
        if (classroom) {
          res.write(`data: ${JSON.stringify({
            type: 'sensor_update',
            classroomId,
            timestamp: new Date().toISOString(),
            sensors: classroom.sensors,
          })}\n\n`);
        }

        // Send updates every 5 seconds
        const interval = setInterval(() => {
          const classroom = loadClassroom(classroomId);
          if (!classroom) {
            clearInterval(interval);
            res.end();
            return;
          }

          // Generate slight variations in sensor readings
          const sensors = {
            temperatureC: classroom.sensors.temperatureC + (Math.random() - 0.5) * 0.5,
            co2ppm: Math.max(400, classroom.sensors.co2ppm + (Math.random() - 0.5) * 20),
            humidityPercent: Math.max(0, Math.min(100, classroom.sensors.humidityPercent + (Math.random() - 0.5) * 2)),
            lightLux: Math.max(0, classroom.sensors.lightLux + (Math.random() - 0.5) * 20),
            noiseDb: Math.max(0, classroom.sensors.noiseDb + (Math.random() - 0.5) * 5),
            occupancyCount: classroom.sensors.occupancyCount,
            lastUpdated: new Date().toISOString(),
          };

          res.write(`data: ${JSON.stringify({
            type: 'sensor_update',
            classroomId,
            timestamp: new Date().toISOString(),
            sensors,
          })}\n\n`);
        }, 5000);

        // Cleanup on disconnect
        req.on('close', () => {
          console.log(`[SSE] Client disconnected from ${classroomId}`);
          clearInterval(interval);
          res.end();
        });
      });

      console.log('✅ Classroom API plugin configured');
    },
  };
}
