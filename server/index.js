/**
 * Smart Campus MLX Proxy Server
 * Proxies requests from frontend to local MLX server
 * Runs on port 3001, forwards to MLX on port 8000
 */

import express from 'express';
import cors from 'cors';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const MLX_SERVER_URL = process.env.MLX_SERVER_URL || 'http://localhost:8000';

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
 * Calendar Integration Endpoint
 * Returns ICS calendar files from data/integrations/calendar/
 */
app.get('/api/integrations/calendar', (req, res) => {
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
  console.log('');
  console.log('  Endpoints:');
  console.log(`    • POST   /api/mlx/chat              - Chat completions`);
  console.log(`    • GET    /api/mlx/status            - MLX server status`);
  console.log(`    • GET    /api/integrations/calendar - Calendar data`);
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
