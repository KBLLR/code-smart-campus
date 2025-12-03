/**
 * Smart Campus MLX Proxy Server
 * Proxies requests from frontend to local MLX server
 * Runs on port 3001, forwards to MLX on port 8000
 */

import express from 'express';
import cors from 'cors';
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env if present

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const app = express();
const PORT = process.env.PORT || 3001;
const MLX_SERVER_URL = process.env.MLX_SERVER_URL || 'http://localhost:8000';
const VOICE_API_URL = process.env.VOICE_API_URL || process.env.VITE_VOICE_API_URL;
const REPORT_DIR = join(__dirname, '../coverage/reports');

const convertEmbedToIcs = (url) => {
  try {
    const parsed = new URL(url);
    if (parsed.pathname.includes('/embed')) {
      const src = parsed.searchParams.get('src');
      if (src) {
        return `https://calendar.google.com/calendar/ical/${src}/public/basic.ics`;
      }
    }
  } catch (error) {
    // fall through
  }
  return url;
};

const getCalendarUrls = () => {
  const urls = new Set();
  const defaultUrl = process.env.CALENDAR_ICS_URL || 'https://calendar.google.com/calendar/ical/david.caballero%40code.berlin/public/basic.ics';
  if (defaultUrl) {
    urls.add(convertEmbedToIcs(defaultUrl));
  }

  const extra = process.env.CALENDAR_ICS_URLS;
  if (extra) {
    extra.split(',').map(s => s.trim()).filter(Boolean).forEach(u => urls.add(convertEmbedToIcs(u)));
  }
  return Array.from(urls);
};

// Build classroom snapshots from sensor mapping + room metadata (no JSON asserts needed)
const sensorMappingData = require('../src/data/sensors/sensors-mapping.json');
const roomList = require('../src/data/classrooms/rooms.js').default || require('../src/data/classrooms/rooms.js');

const normalize = (value) => (value || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
const roomMetaById = new Map(
  roomList.map((room) => [normalize(room.id || room.name), room])
);

const classroomSnapshots = (sensorMappingData.rooms || []).map((room) => {
  const meta = roomMetaById.get(normalize(room.id)) || roomMetaById.get(normalize(room.name)) || {};
  const descriptionParts = [];
  if (meta.area) descriptionParts.push(meta.area);
  if (meta.use) descriptionParts.push(meta.use);

  return {
    id: room.id,
    name: room.name,
    description: descriptionParts.length > 0 ? descriptionParts.join(' • ') : room.name,
    type: 'classroom',
    category: room.category || meta.area || 'general',
    agent: room.agent || null,
    sensors: (room.sensors || []).map((s, idx) => ({
      id: s.id || `${room.id}-${s.type}-${idx}`,
      type: s.type,
      value: s.current_value ?? null,
      unit: s.unit || '',
      status: s.status || 'unknown'
    })),
    events: room.events || { current: null, next: null, calendar_url: '' },
    equipment: room.equipment || [],
    metadata: {
      description: descriptionParts.length > 0 ? descriptionParts.join(' • ') : room.name,
      capacity: meta.capacity ?? null,
      features: meta.use ? [meta.use] : [],
      ...room.metadata
    },
    state: room.state || {
      highlighted: false,
      selected: false,
      occupied: false,
      climate_status: 'unknown',
      equipment_status: 'unknown',
      alert_level: 'none',
      agent_active: true,
      last_interaction: null
    },
    geometry: { mesh_id: meta.id || room.id }
  };
});

const getSnapshotById = (id) => classroomSnapshots.find(c => c.id === id);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

/**
 * MLX Chat Completion Endpoint
 * Proxies OpenAI-compatible requests to MLX server
 */
app.post('/api/mlx/chat', async (req, res) => {
  const startTime = Date.now();

  try {
    const { model, messages, temperature, maxTokens } = req.body;

    if (!model || !messages) {
      return res.status(400).json({
        error: 'Missing required fields: model, messages'
      });
    }

    console.log(`[MLX] Proxying request to ${MLX_SERVER_URL}/v1/chat/completions`);
    console.log(`[MLX] Model: ${model}`);
    console.log(`[MLX] Messages: ${messages.length} message(s)`);

    // Forward to MLX server (OpenAI-compatible endpoint)
    const mlxResponse = await fetch(`${MLX_SERVER_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: temperature || 0.7,
        max_tokens: maxTokens || 500,
        stream: false
      })
    });

    if (!mlxResponse.ok) {
      const errorText = await mlxResponse.text();
      console.error(`[MLX] Error response: ${mlxResponse.status} ${errorText}`);
      throw new Error(`MLX server error: ${mlxResponse.status} ${errorText}`);
    }

    const mlxData = await mlxResponse.json();
    const latencyMs = Date.now() - startTime;

    // Extract completion from OpenAI-compatible response
    const completion = mlxData.choices?.[0]?.message?.content || mlxData.choices?.[0]?.text || '';

    const response = {
      completion,
      model: mlxData.model || model,
      latencyMs,
      usage: mlxData.usage,
      timestamp: new Date().toISOString()
    };

    console.log(`[MLX] ✓ Response generated in ${latencyMs}ms`);
    console.log(`[MLX] Completion length: ${completion.length} characters`);

    res.json(response);

  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error(`[MLX] ✗ Error after ${latencyMs}ms:`, error.message);

    // Check if MLX server is unreachable
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      return res.status(503).json({
        error: 'MLX server unreachable',
        message: `Could not connect to MLX server at ${MLX_SERVER_URL}. Please ensure the MLX server is running.`,
        details: error.message,
        latencyMs
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      latencyMs
    });
  }
});

/**
 * Tier2 Orchestrator support: classroom snapshots
 */
app.get('/api/smartcampus/classrooms', (req, res) => {
  res.json({
    ok: true,
    count: classroomSnapshots.length,
    classrooms: classroomSnapshots,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/smartcampus/classrooms/:id/snapshot', (req, res) => {
  const snapshot = getSnapshotById(req.params.id);
  if (!snapshot) {
    return res.status(404).json({
      ok: false,
      error: 'not_found',
      message: `Classroom ${req.params.id} not found`
    });
  }

  res.json({
    ok: true,
    room: snapshot,
    timestamp: new Date().toISOString()
  });
});

/**
 * Tier2 Orchestrator support: sensor/entity batch
 */
app.post('/api/smartcampus/entities/batch', (req, res) => {
  const entityIds = req.body?.entity_ids || req.body?.ids || [];
  const entities = Array.isArray(entityIds)
    ? entityIds.map(id => ({
        id,
        value: null,
        status: 'unknown',
        updated: new Date().toISOString()
      }))
    : [];

  res.json({
    ok: true,
    entities,
    timestamp: new Date().toISOString()
  });
});

function generateToneWavBase64(durationMs = 800, freq = 440, sampleRate = 16000) {
  const sampleCount = Math.floor(sampleRate * (durationMs / 1000));
  const buffer = Buffer.alloc(44 + sampleCount * 2); // 16-bit PCM

  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + sampleCount * 2, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16); // PCM header size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(1, 22); // channels
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(sampleCount * 2, 40);

  for (let i = 0; i < sampleCount; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * freq * t) * 0.25; // -0.25..0.25
    const intSample = Math.max(-1, Math.min(1, sample)) * 0x7fff;
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer.toString('base64');
}

/**
 * Voice chat proxy endpoint (for Tier3b voice pipeline)
 * Forwards multipart audio + params to VOICE_API_URL if configured.
 */
app.post('/api/voice-chat', async (req, res) => {
  if (!VOICE_API_URL) {
    // Fallback stub: returns placeholder transcript/response + a short tone
    return res.json({
      transcript: 'Voice message received.',
      response_text: 'This is a placeholder response because VOICE_API_URL is not configured.',
      audio_base64: generateToneWavBase64(),
      audio_url: null,
      latency_ms: 0,
      model: 'placeholder',
      voice: 'placeholder'
    });
  }

  try {
    const upstream = await fetch(VOICE_API_URL, {
      method: 'POST',
      headers: {
        // Forward content-type so multipart boundary is preserved
        'content-type': req.headers['content-type'] || 'application/octet-stream'
      },
      body: req,
      // Required when streaming a request body in Node fetch (Undici)
      duplex: 'half'
    });

    const contentType = upstream.headers.get('content-type') || 'application/json';
    res.status(upstream.status);
    res.setHeader('content-type', contentType);
    const buffer = await upstream.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('[VoiceProxy] Failed to forward voice request:', error);
    res.status(502).json({
      error: 'voice_proxy_error',
      message: error.message
    });
  }
});

/**
 * Calendar Integration Endpoint
 * Returns ICS calendar files from data/integrations/calendar/ and optional remote feed
 */
app.get('/api/integrations/calendar', async (req, res) => {
  try {
    const calendarDir = join(__dirname, '../src/data/integrations/calendar');
    const files = readdirSync(calendarDir).filter(f => f.endsWith('.ics'));

    const calendarData = files.map(filename => {
      const filepath = join(calendarDir, filename);
      const content = readFileSync(filepath, 'utf-8');
      return {
        filename,
        content,
        size: content.length
      };
    });

    // Remote ICS feeds (e.g., Google Calendar public links)
    const remoteUrls = getCalendarUrls();
    for (const url of remoteUrls) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          const content = await response.text();
          const filename = `remote-${Buffer.from(url).toString('base64').slice(0, 8)}.ics`;
          calendarData.push({
            filename,
            content,
            size: content.length,
            source: url
          });
        } else {
          console.warn(`[Calendar] Remote ICS returned ${response.status} for ${url}`);
        }
      } catch (error) {
        console.warn(`[Calendar] Failed to fetch remote ICS (${url}):`, error.message);
      }
    }

    console.log(`[Calendar] Serving ${calendarData.length} calendar file(s)`);
    res.json(calendarData);

  } catch (error) {
    console.error('[Calendar] Error reading calendar files:', error);
    res.status(500).json({
      error: 'Failed to read calendar files',
      message: error.message
    });
  }
});

/**
 * Save file endpoint (used by frontend report manager)
 */
app.post('/api/save-file', (req, res) => {
  const { filename, data } = req.body || {};
  if (!filename) {
    return res.status(400).json({
      error: 'filename is required'
    });
  }

  try {
    if (!existsSync(REPORT_DIR)) {
      mkdirSync(REPORT_DIR, { recursive: true });
    }
    const filepath = join(REPORT_DIR, filename);
    writeFileSync(filepath, JSON.stringify(data ?? {}, null, 2), 'utf-8');

    res.json({
      ok: true,
      saved: filepath,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[SaveFile] Failed to save file:', error);
    res.status(500).json({
      error: 'Failed to save file',
      message: error.message
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    mlxServer: {
      url: MLX_SERVER_URL,
      reachable: false
    }
  };

  // Check MLX server connectivity
  try {
    const mlxHealthCheck = await fetch(`${MLX_SERVER_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000) // 2 second timeout
    });

    health.mlxServer.reachable = mlxHealthCheck.ok;
    health.mlxServer.status = mlxHealthCheck.status;

  } catch (error) {
    health.mlxServer.error = error.message;
  }

  const statusCode = health.mlxServer.reachable ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * MLX server status endpoint
 */
app.get('/api/mlx/status', async (req, res) => {
  try {
    const modelsResponse = await fetch(`${MLX_SERVER_URL}/v1/models`, {
      signal: AbortSignal.timeout(5000)
    });

    if (!modelsResponse.ok) {
      throw new Error(`MLX server returned ${modelsResponse.status}`);
    }

    const modelsData = await modelsResponse.json();

    res.json({
      connected: true,
      url: MLX_SERVER_URL,
      models: modelsData.data || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      connected: false,
      url: MLX_SERVER_URL,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Voice service health/status
 */
app.get('/api/voice/status', async (req, res) => {
  const status = {
    configured: Boolean(VOICE_API_URL),
    url: VOICE_API_URL || null,
    reachable: false
  };

  if (!VOICE_API_URL) {
    return res.status(503).json(status);
  }

  try {
    const resp = await fetch(VOICE_API_URL.replace(/\/$/, ''), {
      method: 'HEAD',
      signal: AbortSignal.timeout(2000)
    });
    status.reachable = resp.ok;
    status.status = resp.status;
    return res.status(resp.ok ? 200 : 503).json(status);
  } catch (error) {
    status.error = error.message;
    return res.status(503).json(status);
  }
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Smart Campus MLX Proxy Server',
    version: '1.0.0',
    endpoints: {
      mlxChat: 'POST /api/mlx/chat',
      mlxStatus: 'GET /api/mlx/status',
      calendar: 'GET /api/integrations/calendar',
      health: 'GET /health'
    },
    mlxServer: MLX_SERVER_URL,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Smart Campus MLX Proxy Server                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  🚀 Server running on http://localhost:${PORT}`);
  console.log(`  🤖 MLX Server: ${MLX_SERVER_URL}`);
  if (VOICE_API_URL) {
    console.log(`  🔊 Voice API proxy → ${VOICE_API_URL}`);
  }
  console.log('');
  console.log('  Endpoints:');
  console.log(`    • POST   /api/mlx/chat              - Chat completions`);
  console.log(`    • GET    /api/mlx/status            - MLX server status`);
  console.log(`    • GET    /api/integrations/calendar - Calendar data`);
  console.log(`    • POST   /api/voice-chat            - Voice proxy`);
  console.log(`    • GET    /health                    - Health check`);
  console.log('');
  console.log('  Press Ctrl+C to stop');
  console.log('');

  // Check MLX server on startup
  fetch(`${MLX_SERVER_URL}/health`)
    .then(response => {
      if (response.ok) {
        console.log('  ✓ MLX server is reachable');
      } else {
        console.log(`  ⚠ MLX server returned ${response.status}`);
      }
    })
    .catch(error => {
      console.log(`  ✗ MLX server unreachable: ${error.message}`);
      console.log(`    Make sure MLX server is running on ${MLX_SERVER_URL}`);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n[Server] Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n[Server] Received SIGINT, shutting down gracefully...');
  process.exit(0);
});
