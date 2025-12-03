# Smart Campus MLX Proxy Server

Express server that proxies requests from the frontend to the local MLX server, enabling real AI-generated campus reports with GPT-OSS-20B.

## Overview

The Smart Campus application uses a two-tier AI architecture:

1. **Classroom Agents** (Phi-3 Mini 4-bit) - Individual room monitoring
2. **Cerberus Agent** (GPT-OSS 20B) - Campus-wide synthesis with Harmony format

This proxy server bridges the frontend with the MLX server running locally.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Vite Dev Server - Port 5173)                    │
│  • CampusReportManager                                      │
│  • CampusHeader                                             │
│  • Room agents                                              │
└───────────────────┬─────────────────────────────────────────┘
                    │ HTTP POST
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  MLX Proxy Server (Express - Port 3001)                    │
│  • POST /api/mlx/chat                                       │
│  • GET  /api/integrations/calendar                          │
│  • GET  /health                                             │
└───────────────────┬─────────────────────────────────────────┘
                    │ HTTP POST (OpenAI-compatible)
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  MLX Server (Port 8000)                                     │
│  • mlx-community/Jinx-gpt-oss-20b-mxfp4-mlx                │
│  • mlx-community/Phi-3-mini-4k-instruct-4bit               │
│  • OpenAI-compatible API (/v1/chat/completions)             │
└─────────────────────────────────────────────────────────────┘
```

## Installation

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `express` - Web server framework
- `cors` - Cross-origin resource sharing
- `concurrently` - Run multiple processes

### 2. Start MLX Server

The MLX server must be running on port 8000 before starting the proxy.

**Option A: Using MLX CLI**
```bash
# Install MLX if not already installed
pip install mlx-lm

# Start server with GPT-OSS 20B
mlx_lm.server \
  --model mlx-community/Jinx-gpt-oss-20b-mxfp4-mlx \
  --port 8000 \
  --host 127.0.0.1
```

**Option B: Using Python Script**
```python
from mlx_lm import load, serve

# Load model
model, tokenizer = load("mlx-community/Jinx-gpt-oss-20b-mxfp4-mlx")

# Start server
serve(model, tokenizer, port=8000)
```

**Option C: Check Existing MLX Setup**
```bash
# Check if MLX server is already running
curl http://localhost:8000/health

# Check available models
curl http://localhost:8000/v1/models
```

### 3. Start Proxy Server

```bash
# Option A: Proxy server only
npm run server

# Option B: Proxy + Vite dev server (recommended)
npm run dev:full
```

## Endpoints

### POST /api/mlx/chat

Chat completion endpoint (OpenAI-compatible).

**Request:**
```json
{
  "model": "mlx-community/Jinx-gpt-oss-20b-mxfp4-mlx",
  "messages": [
    {
      "role": "system",
      "content": "You are Cerberus, the Smart Campus AI..."
    },
    {
      "role": "user",
      "content": "Generate campus overview"
    }
  ],
  "temperature": 0.8,
  "maxTokens": 400
}
```

**Response:**
```json
{
  "completion": "<|analysis|>Environmental data...<|end|><|commentary|>Patterns...<|end|><|final|>Campus overview<|end|>",
  "model": "mlx-community/Jinx-gpt-oss-20b-mxfp4-mlx",
  "latencyMs": 2350,
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 200,
    "total_tokens": 350
  },
  "timestamp": "2025-12-03T10:30:00.000Z"
}
```

### GET /api/integrations/calendar

Returns ICS calendar files from `src/data/integrations/calendar/`.

**Response:**
```json
[
  {
    "filename": "CODE_david.caballero@code.berlin.ics",
    "content": "BEGIN:VCALENDAR...",
    "size": 15420
  }
]
```

### GET /health

Health check and MLX connectivity status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-03T10:30:00.000Z",
  "mlxServer": {
    "url": "http://localhost:8000",
    "reachable": true,
    "status": 200
  }
}
```

### GET /api/mlx/status

MLX server status and available models.

**Response:**
```json
{
  "connected": true,
  "url": "http://localhost:8000",
  "models": [
    {
      "id": "mlx-community/Jinx-gpt-oss-20b-mxfp4-mlx",
      "object": "model"
    },
    {
      "id": "mlx-community/Phi-3-mini-4k-instruct-4bit",
      "object": "model"
    }
  ],
  "timestamp": "2025-12-03T10:30:00.000Z"
}
```

## Configuration

Environment variables (set in `.env`):

```bash
# MLX Server URL (default: http://localhost:8000)
MLX_SERVER_URL=http://localhost:8000

# Proxy server port (default: 3001)
PORT=3001
```

## Models Used

### Cerberus Campus Agent

**Model:** `mlx-community/Jinx-gpt-oss-20b-mxfp4-mlx` (GPT-OSS 20B)

**Purpose:** Campus-wide synthesis with Harmony format

**Output Format:**
```
<|analysis|>
Environmental Layer: Temperature, occupancy, air quality data
Academic Layer: Classes, research, events
Social Layer: Collaboration patterns, energy, flow
<|end|>

<|commentary|>
Cross-room patterns, anomalies, trends
<|end|>

<|final|>
Poetic 2-sentence campus overview
<|end|>
```

### Classroom Agents

**Model:** `mlx-community/Phi-3-mini-4k-instruct-4bit` (Phi-3 Mini)

**Purpose:** Individual room monitoring and status

**Output:** Simple text summary of room state

## Running in Development

### Full Stack (Recommended)

Runs both proxy server and Vite dev server concurrently:

```bash
npm run dev:full
```

**Output:**
```
[server] Smart Campus MLX Proxy Server
[server] 🚀 Server running on http://localhost:3001
[vite]   VITE v7.1.12  ready in 450 ms
[vite]   ➜  Local:   http://localhost:5173/
```

### Separate Terminals

```bash
# Terminal 1: MLX Server
mlx_lm.server --model mlx-community/Jinx-gpt-oss-20b-mxfp4-mlx --port 8000

# Terminal 2: Proxy Server
npm run server

# Terminal 3: Vite Dev Server
npm run dev
```

## Troubleshooting

### ERR_CONNECTION_REFUSED on port 3001

**Issue:** Proxy server not running

**Fix:**
```bash
npm run server
# or
npm run dev:full
```

### MLX server unreachable

**Issue:** MLX server not running on port 8000

**Fix:**
```bash
# Check if MLX is running
curl http://localhost:8000/health

# Start MLX server
mlx_lm.server --model mlx-community/Jinx-gpt-oss-20b-mxfp4-mlx --port 8000
```

### Port 3001 already in use

**Issue:** Another process using port 3001

**Fix:**
```bash
# Find process
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 npm run server
```

### Model not found

**Issue:** MLX model not downloaded

**Fix:**
```bash
# Download model
mlx_lm.convert \
  --hf-path mlx-community/Jinx-gpt-oss-20b-mxfp4-mlx \
  --mlx-path ~/mlx_models/gpt-oss-20b

# Or let MLX auto-download on first use
mlx_lm.server --model mlx-community/Jinx-gpt-oss-20b-mxfp4-mlx
```

### Slow response times

**Issue:** Model inference taking too long

**Solutions:**
1. Use quantized model (4-bit, 8-bit)
2. Reduce max_tokens
3. Use GPU acceleration (if available)
4. Switch to smaller model for testing

### CORS errors

**Issue:** Frontend can't connect due to CORS

**Fix:** Already handled by `cors()` middleware. If issues persist:

```javascript
// server/index.js
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
```

## Testing

### Test MLX Connection

```bash
# From root directory
curl -X POST http://localhost:3001/api/mlx/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mlx-community/Phi-3-mini-4k-instruct-4bit",
    "messages": [
      {"role": "user", "content": "Hello, world!"}
    ]
  }'
```

### Test Calendar Endpoint

```bash
curl http://localhost:3001/api/integrations/calendar
```

### Test Health Check

```bash
curl http://localhost:3001/health
```

## Production Deployment

For production, consider:

1. **Process Manager:** Use PM2 or systemd
```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start server/index.js --name smart-campus-mlx

# Auto-restart on reboot
pm2 startup
pm2 save
```

2. **Reverse Proxy:** Use Nginx for SSL/TLS
```nginx
server {
  listen 443 ssl;
  server_name campus.example.com;

  location /api/ {
    proxy_pass http://localhost:3001/api/;
  }
}
```

3. **Environment Variables:** Use `.env.production`
```bash
MLX_SERVER_URL=http://internal-mlx-server:8000
PORT=3001
NODE_ENV=production
```

4. **Monitoring:** Add logging and error tracking
   - Winston for structured logging
   - Sentry for error tracking
   - Prometheus for metrics

## Related Documentation

- **FOCUS.md** - Project priorities and roadmap
- **TELEMETRY.md** - Sensor system documentation
- **src/managers/CampusReportManager.js** - Report generation logic
- **src/utils/harmonyParser.js** - Harmony format parsing

---

**Status:** ✓ MLX proxy server ready for GPT-OSS-20B responses
**Last Updated:** 2025-12-03
