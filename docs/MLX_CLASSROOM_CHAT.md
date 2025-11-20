# MLX Classroom Chat Integration

This document explains how Smart Campus classroom chat is wired to the local MLX server for on-device AI inference with tool calling.

## Overview

Smart Campus classroom chat can now use a **local MLX server** (instead of cloud APIs) for:
- Privacy-first AI inference on your own hardware
- Tool calling with classroom-scoped operations
- Cost savings (no API charges)
- Zero-latency responses

The integration is **feature-flagged** and **backwards-compatible** — you can toggle between local MLX, cloud OpenAI, or mock responses.

---

## Architecture

```
┌─────────────────┐
│  ClassroomPage  │ (Smart Campus Frontend)
│   ChatSection   │
└────────┬────────┘
         │ POST /api/classrooms/:id/chat
         │ { messages: [...] }
         ▼
┌─────────────────────────────────────────┐
│ vite.classroom-api.js                    │
│ ┌─────────────────────────────────────┐ │
│ │ generateChatResponse()              │ │
│ │   ├─ ENABLE_LOCAL_AI=true           │ │
│ │   │    → generateMLXResponse()      │ │
│ │   ├─ OPENAI_API_KEY set             │ │
│ │   │    → generateOpenAIResponse()   │ │
│ │   └─ else → Mock Response           │ │
│ └─────────────────────────────────────┘ │
└────────┬────────────────────────────────┘
         │
         ▼ (if ENABLE_LOCAL_AI=true)
┌─────────────────────────────────────────┐
│ MLX OpenAI Server                        │
│ http://localhost:8000                    │
│                                          │
│ POST /v1/chat/completions                │
│   model: mlx-community/qwen2.5-7b-...   │
│   tools: [get_classroom, ...]           │
│                                          │
│ Returns: { tool_calls: [...] }          │
└─────────────────────────────────────────┘
         │
         ▼ Tool execution on Campus backend
┌─────────────────────────────────────────┐
│ Classroom Tools                          │
│ (shared/classroom/classroom-tools.ts)    │
│                                          │
│ • get_classroom(classroom_id)            │
│ • get_classroom_snapshot(classroom_id)   │
│ • append_classroom_event(classroom_id,   │
│                          event)          │
└─────────────────────────────────────────┘
```

---

## Setup Instructions

### 1. Start the MLX Server (Phase 1)

The MLX server should already be running from Phase 1 (mlx-campus-integration-auditor).

If not, start it in "campus mode":

```bash
# Navigate to mlx-openai-server repo (assumed to be adjacent)
cd ../mlx-openai-server-lab

# Run the campus mode startup script
./scripts/start-campus-mode.sh

# Or manually:
# MLX_MODEL="mlx-community/qwen2.5-7b-instruct-4bit" \
# ENABLE_TOOLS=true \
# CORS_ORIGIN="http://localhost:5173" \
# python -m mlx_openai_server.server
```

The server should be running at: **http://localhost:8000**

Verify it's alive:
```bash
curl http://localhost:8000/health
# Expected: {"status":"ok","model":"mlx-community/qwen2.5-7b-instruct-4bit"}
```

---

### 2. Configure Smart Campus Environment Variables

Create a `.env` file in the Smart Campus root (copy from `.env.example`):

```bash
cd /home/user/code-smart-campus
cp .env.example .env
```

Edit `.env` to enable local AI:

```bash
# Enable local MLX server
ENABLE_LOCAL_AI=true

# MLX server URL (default: http://localhost:8000)
MLX_SERVER_URL=http://localhost:8000

# Model name (must match what MLX server is running)
MLX_MODEL_NAME=mlx-community/qwen2.5-7b-instruct-4bit

# Optional: Enable cloud fallback if MLX is unreachable
ENABLE_CLOUD_FALLBACK=false

# Optional: OpenAI API key for fallback (leave empty to disable)
OPENAI_API_KEY=

# Logging
LOG_LEVEL=info
DEBUG_CHAT_API=false
```

---

### 3. Start Smart Campus Dev Server

```bash
npm run dev
```

The frontend will be available at: **http://localhost:5173**

---

## Usage: Manual Test Plan

### Test 1: Basic Chat (No Tools)

1. Open http://localhost:5173
2. Click on a classroom (e.g., "Engineering 101")
3. Open the **Chat** section
4. Send a simple message: "Hello, what's the temperature here?"
5. **Expected**:
   - The assistant responds with context from the classroom (e.g., "The current temperature is 22°C")
   - Check browser console logs (or terminal running `npm run dev`) for:
     ```
     [Chat API] 2025-11-20T... classroom-eng-101-abc123 - Using local MLX server
     [Chat API] 2025-11-20T... classroom-eng-101-abc123 - Received MLX response
     ```

### Test 2: Tool Calling (get_classroom_snapshot)

1. In the same chat, send: "Give me a detailed snapshot of this classroom"
2. **Expected**:
   - The assistant calls the `get_classroom_snapshot` tool
   - Logs show:
     ```
     [Chat API] ... Executing tool: get_classroom_snapshot
     [Chat API] ... Tool executed: get_classroom_snapshot
     [Chat API] ... Tool calling complete
     ```
   - The response includes comfort score and sensor details

### Test 3: Tool Calling (append_classroom_event)

1. Send: "Log an event that the room is too hot and students are uncomfortable"
2. **Expected**:
   - The assistant calls `append_classroom_event` with type="sensor-alert"
   - Logs show:
     ```
     [Chat API] ... Executing tool: append_classroom_event
     [append_classroom_event] Event recorded: { eventId: '...', diaryStageId: '...' }
     ```
   - The assistant confirms the event was logged

### Test 4: Verify Classroom Scoping (Security)

1. Open a different classroom (e.g., "Peace Seminar Room")
2. Send a chat message
3. **Expected**:
   - Tools executed in this chat ONLY access the "Peace" classroom
   - Even if the model tries to access a different `classroom_id` in tool arguments, the backend **overrides** it with the actual classroom from the request

Check the code in `vite.classroom-api.js:227-233`:
```javascript
const scopedArgs = {
  ...toolArgs,
  classroom_id: classroomId, // Override with actual classroom from request
};
```

### Test 5: Fallback to Mock (MLX Disabled)

1. Stop the MLX server (Ctrl+C in mlx-openai-server terminal)
2. Edit `.env`:
   ```bash
   ENABLE_LOCAL_AI=false
   OPENAI_API_KEY=  # Leave empty
   ```
3. Restart Smart Campus dev server (`npm run dev`)
4. Send a chat message
5. **Expected**:
   - Logs show:
     ```
     [Chat API] ... Using mock response (no API configured)
     ```
   - Response: "[Mock Response] I'm the {classroom name} assistant. The comfort score is X/100. How can I help you?"

### Test 6: Cloud Fallback (Optional)

1. Keep MLX server stopped
2. Edit `.env`:
   ```bash
   ENABLE_LOCAL_AI=true
   ENABLE_CLOUD_FALLBACK=true
   OPENAI_API_KEY=sk-...  # Your OpenAI key
   ```
3. Restart dev server
4. Send a chat message
5. **Expected**:
   - Logs show:
     ```
     [Chat API] ... MLX server unreachable, falling back to OpenAI
     [Chat API] ... Chat response generated via OpenAI Cloud
     ```

---

## Implementation Details

### Feature Flags

Configured via environment variables in `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_LOCAL_AI` | `false` | Use local MLX server instead of cloud |
| `MLX_SERVER_URL` | `http://localhost:8000` | MLX server endpoint |
| `MLX_MODEL_NAME` | `mlx-community/qwen2.5-7b-instruct-4bit` | Model to request from MLX |
| `ENABLE_CLOUD_FALLBACK` | `false` | Fall back to OpenAI if MLX is down |
| `OPENAI_API_KEY` | (empty) | OpenAI API key for cloud or fallback |
| `LOG_LEVEL` | `info` | Logging verbosity (`info`, `debug`, `error`) |
| `DEBUG_CHAT_API` | `false` | Enable detailed request/response logs |

### Routing Logic

The chat API routes requests based on configuration:

```javascript
if (ENABLE_LOCAL_AI === true) {
  → Call local MLX server (with tool calling)
} else if (OPENAI_API_KEY is set) {
  → Call OpenAI cloud API (no tools yet)
} else {
  → Return mock response
}
```

### Tool Calling Flow

When MLX returns `tool_calls` in the response:

1. **First call**: Send messages + tool definitions to MLX
   - MLX returns: `{ tool_calls: [{ function: { name: "get_classroom_snapshot", arguments: "{...}" } }] }`
2. **Execute tools**: For each tool call:
   - Parse tool name and arguments
   - Call corresponding function (e.g., `get_classroom_snapshot()`)
   - **Enforce scoping**: Always override `classroom_id` with the request's classroom
   - Build tool message: `{ role: "tool", tool_call_id: "...", content: "{...}" }`
3. **Second call**: Send updated messages (with tool results) back to MLX
   - MLX returns final assistant response

### Classroom-Scoped Tools

All tools are parameterized by `classroom_id` (not separate tools per classroom).

**Available tools:**

#### 1. `get_classroom`
Fetch complete classroom definition.

**Parameters:**
- `classroom_id` (string): Classroom identifier

**Returns:**
```json
{
  "success": true,
  "data": {
    "id": "eng-101",
    "name": "Engineering 101",
    "campus": { ... },
    "sensors": { ... },
    "personas": { ... }
  }
}
```

#### 2. `get_classroom_snapshot`
Get compact snapshot with comfort score.

**Parameters:**
- `classroom_id` (string): Classroom identifier

**Returns:**
```json
{
  "success": true,
  "data": {
    "classroomId": "eng-101",
    "name": "Engineering 101",
    "sensors": {
      "temperatureC": 22,
      "co2ppm": 450,
      "comfortScore": 85
    },
    "personas": {
      "teacher": "Dr. Smith",
      "assistantCount": 2,
      "studentCount": 25
    }
  }
}
```

#### 3. `append_classroom_event`
Record an event in the classroom's history.

**Parameters:**
- `classroom_id` (string): Classroom identifier
- `event` (object):
  - `type`: "lesson" | "break" | "discussion" | "activity" | "system" | "chat" | "sensor-alert"
  - `summary` (string): Human-readable event summary
  - `timestamp` (string, optional): ISO 8601 timestamp (defaults to now)
  - `payload` (object, optional): Additional structured data

**Returns:**
```json
{
  "success": true,
  "data": {
    "eventId": "eng-101-1732070400-abc123"
  }
}
```

---

## Safety & Privacy

### Request ID Tracking

Every chat request generates a **non-PII request ID**:

Format: `classroom-{classroomId}-{random_hex}`

Example: `classroom-eng-101-a3b9c7d2f1e4`

This ID is:
- Included in all logs
- Forwarded to MLX server as `X-Request-ID` header
- Used for tracing across services

### PII Protection

**NEVER logs:**
- Student messages
- Student names
- User input content

**Logs only:**
- Request IDs
- Tool names (not arguments)
- Timestamps
- Success/failure status
- Model/path used (MLX vs OpenAI)

### Classroom Scoping Enforcement

Tools **cannot** read or write across different classrooms:

```javascript
// Backend enforces scoping in executeClassroomTool()
const scopedArgs = {
  ...toolArgs,
  classroom_id: classroomId, // ALWAYS use the request's classroom
};
```

Even if the model tries to access `classroom_id: "other-room"`, the backend overrides it.

---

## Logging Examples

### Successful Chat (MLX, No Tools)

```
[Chat API] 2025-11-20T12:34:56.789Z classroom-eng-101-abc123 - Using local MLX server
[Chat API] 2025-11-20T12:34:57.123Z classroom-eng-101-abc123 - Received MLX response
[Chat API] 2025-11-20T12:34:57.124Z classroom-eng-101-abc123 - Chat response generated via MLX
```

### Chat with Tool Calling

```
[Chat API] 2025-11-20T12:35:00.000Z classroom-peace-xyz789 - Using local MLX server
[Chat API] 2025-11-20T12:35:01.234Z classroom-peace-xyz789 - Received MLX response
[Chat API] 2025-11-20T12:35:01.235Z classroom-peace-xyz789 - Processing tool calls
[Chat API] 2025-11-20T12:35:01.236Z classroom-peace-xyz789 - Executing tool: get_classroom_snapshot
[get_classroom_snapshot] Generated snapshot for peace (comfort: 72)
[Chat API] 2025-11-20T12:35:01.300Z classroom-peace-xyz789 - Tool executed: get_classroom_snapshot
[Chat API] 2025-11-20T12:35:02.456Z classroom-peace-xyz789 - Tool calling complete
[Chat API] 2025-11-20T12:35:02.457Z classroom-peace-xyz789 - Chat response generated via MLX
```

### Error: MLX Server Unreachable (No Fallback)

```
[Chat API] {"timestamp":"2025-11-20T12:40:00.000Z","level":"error","requestId":"classroom-eng-101-def456","message":"MLX response generation failed","error":"MLX server unreachable at http://localhost:8000: connect ECONNREFUSED"}
```

### Fallback to Cloud

```
[Chat API] 2025-11-20T12:41:00.000Z classroom-eng-101-ghi789 - Using local MLX server
[Chat API] 2025-11-20T12:41:01.000Z classroom-eng-101-ghi789 - MLX server unreachable, falling back to OpenAI
[Chat API] 2025-11-20T12:41:03.456Z classroom-eng-101-ghi789 - Chat response generated via OpenAI Cloud
```

---

## Known Limitations

### Phase 2 (Current)

1. **No streaming**: Responses are returned in full (not streamed). Streaming support can be added later with SSE.
2. **No RAG**: Document/content retrieval is not yet integrated. This is planned for Phase 3 (mlx-rag-lab fusion).
3. **OpenAI cloud mode**: When using `ENABLE_LOCAL_AI=false` with OpenAI, tools are **not** enabled (cloud mode doesn't implement tool calling yet).
4. **No calendar integration**: The `nextCalendarEvents` field in snapshots is always `undefined` (calendar tool not implemented).
5. **In-memory event storage**: Events are stored in `eventsStore` Map (cleared on restart). Production should use a database.

### Future Enhancements

- **Streaming responses** via Server-Sent Events (SSE)
- **RAG integration** with mlx-rag-lab for document-aware chat
- **Calendar tools** (get_calendar_for_range)
- **Persistent event storage** (database or LeAgentDiary bridge)
- **Multi-turn tool calling** (handle multiple rounds of tools)
- **Tool calling for OpenAI cloud** (currently only MLX supports tools)

---

## Troubleshooting

### Issue: "MLX server unreachable"

**Symptoms:**
- Logs show: `MLX server unreachable at http://localhost:8000`
- Chat fails or falls back to mock/cloud

**Solutions:**
1. Check if MLX server is running:
   ```bash
   curl http://localhost:8000/health
   ```
2. If not running, start it:
   ```bash
   cd ../mlx-openai-server-lab
   ./scripts/start-campus-mode.sh
   ```
3. Check `MLX_SERVER_URL` in `.env` matches the actual server address

---

### Issue: "No response from assistant"

**Symptoms:**
- Chat message sent, but no response appears
- Browser console shows 500 error

**Solutions:**
1. Check Smart Campus dev server logs for errors
2. Verify `.env` configuration is valid
3. Check if MLX server is healthy:
   ```bash
   curl -X POST http://localhost:8000/v1/chat/completions \
     -H "Content-Type: application/json" \
     -d '{"model":"mlx-community/qwen2.5-7b-instruct-4bit","messages":[{"role":"user","content":"test"}]}'
   ```

---

### Issue: "Tool calls not working"

**Symptoms:**
- Assistant doesn't use tools even when expected
- No tool execution logs appear

**Solutions:**
1. Ensure `ENABLE_LOCAL_AI=true` (tools only work with MLX)
2. Check MLX server was started with `ENABLE_TOOLS=true`
3. Verify model supports tool calling (Qwen 2.5 does)
4. Try explicitly asking: "Use the get_classroom_snapshot tool to tell me about this room"

---

### Issue: "Cross-classroom data leakage"

**Symptoms:**
- Chat in one classroom shows data from another classroom

**Solutions:**
1. This should **never** happen due to scoping enforcement
2. If it does, immediately report it as a security issue
3. Check logs for the `classroom_id` being used in tool calls

---

## Files Modified

### Created
- `.env.example` - Environment variable template
- `docs/MLX_CLASSROOM_CHAT.md` - This documentation

### Modified
- `vite.classroom-api.js` - Added MLX integration, tool calling, logging
  - Imports: Added `dotenv`, `crypto`, classroom tools
  - Added: `MLX_CONFIG`, `generateRequestId()`, `safeLog()`
  - Modified: `generateChatResponse()` - Routing logic
  - Added: `generateMLXResponse()` - MLX-specific handler with tool calling
  - Added: `generateOpenAIResponse()` - Extracted OpenAI handler
  - Added: `executeClassroomTool()` - Tool execution with scoping

### Unchanged (Reused)
- `shared/classroom/classroom-types.ts` - TypeScript interfaces
- `shared/classroom/classroom-schema.ts` - Zod validation schemas
- `shared/classroom/classroom-tools.ts` - Tool implementations
  - `get_classroom()`, `get_classroom_snapshot()`, `append_classroom_event()`
  - `OPENAI_TOOL_DEFINITIONS` - Tool definitions array

---

## Health Check Command

Add this to `package.json` scripts:

```json
{
  "scripts": {
    "health:mlx": "curl -s http://localhost:8000/health | json_pp"
  }
}
```

Usage:
```bash
npm run health:mlx
```

---

## Next Steps (Phase 3+)

1. **RAG Integration**: Wire mlx-rag-lab for document-aware classroom chat
2. **Streaming**: Implement SSE for real-time response streaming
3. **Persistent Storage**: Replace in-memory stores with database
4. **Calendar Tools**: Implement `get_calendar_for_range`
5. **Multi-Agent**: Support multiple agents in a classroom with tool access control

---

## Contact & Support

For issues or questions:
- Check logs first (enable `DEBUG_CHAT_API=true`)
- Review this documentation
- Check MLX server health: `curl http://localhost:8000/health`
- Verify environment variables in `.env`

---

**Document Version**: 1.0
**Last Updated**: 2025-11-20
**Phase**: 2 - MLX Campus Chat Integration
**Author**: campus-chat-mlx-implementer agent
