/**
 * Classroom API Plugin for Vite
 *
 * Provides REST endpoints for classroom operations:
 * - GET /api/classrooms/:id - Get classroom definition
 * - GET /api/classrooms/:id/snapshot - Get classroom snapshot
 * - GET /api/classrooms/:id/events - Get classroom events
 * - POST /api/classrooms/:id/events - Append classroom event
 * - POST /api/classrooms/:id/chat - Chat with classroom AI assistant
 * - GET /api/classrooms/:id/calendar - Get classroom calendar
 * - WS /api/classrooms/:id/sensors - Stream sensor updates
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// In-memory stores (in production, use database/Redis)
const eventsStore = new Map(); // classroom_id -> ClassroomEvent[]

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

/**
 * Call OpenAI API (or local MLX server) for chat
 */
async function generateChatResponse(classroomId, messages, mode = 'default') {
  try {
    const classroom = loadClassroom(classroomId);
    if (!classroom) {
      throw new Error(`Classroom ${classroomId} not found`);
    }

    const snapshot = generateSnapshot(classroom);
    const events = getEvents(classroomId);

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

Respond naturally to user questions about the classroom environment, schedule, or general assistance.`;

    // Check for OpenAI API key in environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Return mock response if no API key
      return {
        role: 'assistant',
        content: `[Mock Response] I'm the ${classroom.name} assistant. The comfort score is ${snapshot.comfortScore}/100. How can I help you?`,
      };
    }

    // Call OpenAI API
    const fetch = (await import('node-fetch')).default;
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
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message;
  } catch (err) {
    console.error('[chat] Error generating response:', err);
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
