# Classroom UI Implementation Guide

**Status:** Phase 4.4-4.7 Complete
**Date:** 2025-11-19

---

## Overview

This document describes the complete end-to-end implementation of the Smart Campus Classroom experience, covering:

1. Backend API endpoints for classroom operations
2. Real-time sensor streaming via Server-Sent Events (SSE)
3. OpenAI-powered classroom assistant chat
4. Interactive classroom selector UI
5. Voice interaction (STT/TTS) support
6. Calendar integration
7. Comprehensive React-based dashboard

---

## Architecture

### Backend (Vite Plugin)

File: `vite.classroom-api.js`

The backend is implemented as a Vite dev server plugin that provides REST and SSE endpoints:

#### REST Endpoints

- **GET /api/classrooms/:id** - Fetch complete ClassroomDefinition
- **GET /api/classrooms/:id/snapshot** - Fetch compact ClassroomSnapshot with derived metrics
- **GET /api/classrooms/:id/events** - Fetch classroom event history
- **POST /api/classrooms/:id/events** - Append new classroom event
- **POST /api/classrooms/:id/chat** - Chat with classroom AI assistant (OpenAI integration)
- **GET /api/classrooms/:id/calendar** - Fetch classroom schedule

#### Streaming Endpoint

- **GET /api/classrooms/:id/sensors** (SSE) - Real-time sensor updates every 5 seconds

### Frontend Components

#### Core Components

1. **ClassroomSelector** (`src/modules/classroom/ClassroomSelector.tsx`)
   - Landing page for selecting a classroom
   - Lists available classrooms (eng-101, lab-a)
   - Triggers ClassroomPage rendering

2. **ClassroomPage** (`src/modules/classroom/ClassroomPage.tsx`)
   - Main classroom view orchestrator
   - Fetches classroom data, snapshot, and events
   - Renders ClassroomViewManager with real data
   - Handles scene switching via SceneManager integration

3. **ClassroomViewManager** (`src/modules/classroom/ClassroomViewManager.tsx`)
   - Grid-based dashboard layout (already implemented in Phase 4.3)
   - Orchestrates 6 sections: Chat, Presence, Sensors, Calendar, History, Integrations

#### Section Components

1. **ChatSection** (`src/modules/classroom/sections/ChatSection.tsx`)
   - Full chat UI with message history
   - OpenAI-powered assistant responses
   - Voice input (STT) via Web Speech API
   - Text-to-speech (TTS) for assistant replies
   - Classroom-aware context (comfort score, sensors, activity)

2. **SensorsSection** (`src/modules/classroom/sections/SensorsSection.tsx`)
   - Real-time sensor display with color-coded status
   - WebSocket/SSE integration via `useSensorStream` hook
   - Live indicator when streaming active
   - Status badges: good/warning/bad/cold/hot/dim/bright

3. **CalendarSection** (`src/modules/classroom/sections/CalendarSection.tsx`)
   - Displays upcoming classroom events
   - Groups events by date
   - Type badges (lecture, lab, workshop, office-hours, training, maintenance)
   - Safety level indicators for lab environments

4. **PresenceSection** (`src/modules/classroom/sections/PresenceSection.tsx`)
   - Shows teachers, TAs, and students (already implemented)

5. **HistorySection** (`src/modules/classroom/sections/HistorySection.tsx`)
   - Displays recent classroom events (already implemented)

6. **IntegrationsSection** (`src/modules/classroom/sections/IntegrationsSection.tsx`)
   - Shows connected services (Notion, Slack, GitHub, Figma) (already implemented)

#### Hooks

**useSensorStream** (`src/modules/classroom/hooks/useSensorStream.ts`)
- Connects to SSE endpoint for real-time sensor data
- Auto-reconnects with exponential backoff (5 attempts max)
- Returns latest sensor readings or null if not connected

---

## Setup and Configuration

### 1. Install Dependencies

```bash
# All required dependencies are already in package.json
npm install
```

### 2. Environment Variables (Optional)

Create `.env.local` in the project root:

```env
# Optional: For real OpenAI chat responses
OPENAI_API_KEY=sk-...

# If not provided, chat will use mock responses
```

### 3. Start Development Server

```bash
npm run dev
```

The Vite dev server will:
- Load the classroom API plugin
- Serve REST and SSE endpoints at `/api/classrooms/*`
- Enable hot module replacement for frontend code

---

## Usage

### Accessing the Classroom UI

**Option A: Programmatic Initialization**

In your main application (e.g., `src/main.js`):

```javascript
import { initClassroom } from '@/modules/classroom/init';

// Initialize classroom UI
initClassroom();
```

This creates:
- `#classroom-selector-root` - Fullscreen classroom selector overlay
- `#classroom-root` - Fullscreen classroom view container (hidden by default)

**Option B: Manual Integration**

```javascript
import { renderClassroomSelector } from '@/modules/classroom/ClassroomSelector';
import { renderClassroomPage } from '@/modules/classroom/ClassroomPage';

// Render selector
const selectorContainer = document.getElementById('my-selector');
renderClassroomSelector(selectorContainer);

// Render specific classroom
const classroomContainer = document.getElementById('my-classroom');
renderClassroomPage(classroomContainer, 'eng-101', () => {
  console.log('User exited classroom');
});
```

### Adding New Classrooms

1. Create classroom JSON in `data/classrooms/`:

```json
// data/classrooms/my-room.json
{
  "id": "my-room",
  "name": "My Awesome Classroom",
  "campus": {
    "campusId": "main",
    "buildingId": "building-x",
    "roomId": "x.101"
  },
  "stage": {
    "sceneKey": "geospatial",
    "layoutPreset": "class"
  },
  "sensors": {
    "temperatureC": 22.0,
    "co2ppm": 500,
    "occupancyCount": 0,
    "noiseDb": 30,
    "lightLux": 400,
    "humidityPercent": 45
  },
  // ... rest of schema
}
```

2. (Optional) Create calendar data:

```json
// data/classrooms/my-room-calendar.json
[
  {
    "id": "evt-001",
    "title": "Morning Lecture",
    "startTime": "2025-11-20T09:00:00Z",
    "endTime": "2025-11-20T10:30:00Z",
    "type": "lecture",
    "location": "MY-ROOM",
    "instructor": "Prof. Example"
  }
]
```

3. Add to `ClassroomSelector.tsx`:

```typescript
const AVAILABLE_CLASSROOMS: Classroom[] = [
  // ... existing classrooms
  {
    id: 'my-room',
    name: 'My Awesome Classroom',
    building: 'X',
    room: '101',
    description: 'A great place to learn',
  },
];
```

---

## API Reference

### Classroom Definition Schema

See `shared/classroom/classroom-types.ts` for full TypeScript definitions.

Key fields:
- `id`: Unique classroom identifier
- `name`: Display name
- `campus`: Location info (campusId, buildingId, roomId)
- `stage`: Scene configuration (sceneKey, layoutPreset)
- `sensors`: Environmental data (temperatureC, co2ppm, noiseDb, etc.)
- `personas`: Teacher, TAs, students with AI prompts
- `policies`: Recording, AI assistants, max agents
- `integrations`: External services (Notion, Slack, GitHub, Figma)
- `ui`: Theme and enabled sections

### Classroom Snapshot

Compact, thinking-friendly view:
- `comfortScore`: 0-100 derived metric
- `inferredActivity`: 'idle', 'lecture', 'group-work', etc.
- `sensors`: Current readings
- `personasSummary`: Quick persona counts

### Classroom Event

```typescript
{
  id: string;
  classroomId: string;
  type: string; // 'message', 'sensor_alert', 'attendance', etc.
  timestamp: string; // ISO 8601
  summary: string;
  payload?: any;
}
```

---

## Chat Integration

### How It Works

1. User types/speaks message in ChatSection
2. Frontend POSTs to `/api/classrooms/:id/chat` with:
   ```json
   {
     "messages": [
       { "role": "user", "content": "How's the air quality?" }
     ]
   }
   ```
3. Backend:
   - Loads ClassroomDefinition and ClassroomSnapshot
   - Constructs context-rich system prompt with:
     - Classroom name, location
     - Teacher info
     - Current comfort score
     - Real-time sensor readings
     - Inferred activity
   - Calls OpenAI API (or uses mock if no API key)
4. Frontend receives assistant reply and displays in chat

### Customizing AI Behavior

Edit system prompt in `vite.classroom-api.js`:

```javascript
const systemPrompt = `You are a helpful AI assistant for ${classroom.name}...

**Custom Guidelines:**
- Focus on safety in lab environments
- Reference course materials from Notion
- Suggest breaks when CO₂ > 1200 ppm
- Encourage student engagement
`;
```

### Voice Interaction

**Speech-to-Text (STT):**
- Uses Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`)
- Click microphone button → speak → text auto-fills input
- Browser support: Chrome, Edge, Safari (limited in Firefox)

**Text-to-Speech (TTS):**
- Uses `speechSynthesis` API
- Toggle speaker button to enable/disable
- Reads assistant replies aloud automatically
- Supports all major browsers

---

## Real-Time Sensor Streaming

### Server-Sent Events (SSE)

The `useSensorStream` hook connects to `/api/classrooms/:id/sensors`:

```typescript
import { useSensorStream } from '@/modules/classroom/hooks/useSensorStream';

function MySensorComponent({ classroomId }) {
  const liveSensors = useSensorStream(classroomId);

  if (!liveSensors) return <div>Connecting...</div>;

  return (
    <div>
      <p>Temp: {liveSensors.temperatureC}°C</p>
      <p>CO₂: {liveSensors.co2ppm} ppm</p>
    </div>
  );
}
```

### Simulated Updates

In development, the backend simulates sensor drift:
- Temperature: ±0.5°C every 5 seconds
- CO₂: ±20 ppm
- Humidity: ±2%
- Light: ±20 lux
- Noise: ±5 dB

In production, replace simulation logic with real IoT device integration.

---

## Styling and Themes

### CSS Structure

File: `src/css/classroom-view.css`

**Sections:**
1. Container & Layout
2. Chat Section
3. Presence Section
4. Sensors Section
5. Calendar Section
6. History Section
7. Integrations Section
8. Classroom Selector (new)
9. Classroom Page (new)
10. Enhanced Chat (voice, TTS, message bubbles)
11. Enhanced Sensors (live indicator, status colors)
12. Enhanced Calendar (event types, safety badges)
13. Themes
14. Responsive

### Available Themes

Set via `ui.theme` in ClassroomDefinition:
- `studio-lite` - Light theme with clean design
- `studio-dark` - Dark theme with gradient background (default)
- `campus` - Green-tinted campus theme
- `minimal` - Minimal white theme

### Responsive Design

- Desktop: 2-column grid (1.7fr chat + 1.1fr sidebar)
- Mobile (< 768px): Single column stack

---

## Testing

### Manual Testing Checklist

- [ ] **Classroom Selector**
  - [ ] Navigate to app, see selector overlay
  - [ ] Click "Enter Room" for eng-101
  - [ ] Verify ClassroomViewManager loads

- [ ] **Chat Section**
  - [ ] Type message, receive assistant reply
  - [ ] Test microphone button (if browser supports)
  - [ ] Toggle TTS, verify audio playback

- [ ] **Sensors Section**
  - [ ] Verify "● LIVE" indicator appears
  - [ ] Watch sensor values update every ~5 seconds
  - [ ] Check color coding (green=good, yellow=warning, red=bad)

- [ ] **Calendar Section**
  - [ ] Events load and group by date
  - [ ] Event types display correct colors
  - [ ] Safety badges appear for lab events

- [ ] **Scene Switching**
  - [ ] Classroom's `stage.sceneKey` triggers scene change
  - [ ] No errors in console

- [ ] **Exit Flow**
  - [ ] Click "← Exit" button
  - [ ] Return to classroom selector

### Automated Tests

File: `tests/classroom-api.test.js` (to be created)

```javascript
describe('Classroom API', () => {
  test('GET /api/classrooms/eng-101 returns classroom', async () => {
    const res = await fetch('/api/classrooms/eng-101');
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.id).toBe('eng-101');
  });

  test('GET /api/classrooms/eng-101/snapshot returns snapshot', async () => {
    const res = await fetch('/api/classrooms/eng-101/snapshot');
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.comfortScore).toBeDefined();
  });

  // ... more tests
});
```

Run with: `npm test classroom-api`

---

## Troubleshooting

### Issue: Classroom selector doesn't appear

**Solution:** Ensure `initClassroom()` is called in your main entry point:

```javascript
// src/main.js
import { initClassroom } from '@/modules/classroom/init';
initClassroom();
```

### Issue: Chat returns mock responses instead of real AI

**Solution:** Set `OPENAI_API_KEY` environment variable:

```bash
# .env.local
OPENAI_API_KEY=sk-...
```

Restart dev server: `npm run dev`

### Issue: Sensors not updating in real-time

**Solution:**
1. Check browser console for SSE connection errors
2. Verify `/api/classrooms/:id/sensors` endpoint responds (check Network tab)
3. Ensure no firewall/proxy blocking SSE

### Issue: Voice input not working

**Solution:**
- Chrome/Edge: Should work by default
- Firefox: Limited support, may require flags
- Safari: Partial support
- Check browser console for "SpeechRecognition not supported" warnings

---

## Production Deployment

### Backend

For production, replace the Vite plugin with a proper Express/Fastify server:

```javascript
// server/classroomApi.js
import express from 'express';
import { get_classroom, get_classroom_snapshot } from '../shared/classroom/classroom-tools';

const router = express.Router();

router.get('/classrooms/:id', async (req, res) => {
  const result = await get_classroom({ classroom_id: req.params.id });
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(404).json({ error: result.error });
  }
});

// ... other routes

export default router;
```

### Environment Variables

Required:
- `OPENAI_API_KEY` - For chat functionality
- `NODE_ENV=production`

Optional:
- Database connection strings (for persistent events storage)
- Redis URL (for sensor data caching)
- External API keys (Notion, Slack, etc.)

### WebSocket Upgrade (Optional)

For production-grade real-time updates, replace SSE with WebSocket:

1. Install `ws`: `npm install ws`
2. Update `vite.classroom-api.js` to use WebSocketServer
3. Update `useSensorStream.ts` to use WebSocket client

---

## Future Enhancements

### Short-term
- [ ] Three.js shader ball in ChatSection
- [ ] Multi-user presence (real-time avatars)
- [ ] Screen sharing integration
- [ ] Recording playback

### Medium-term
- [ ] External calendar sync (Google Calendar, Outlook)
- [ ] Real IoT sensor integration (MQTT, HTTP webhooks)
- [ ] Notion/Slack bidirectional sync
- [ ] Voice commands ("Hey Classroom, open the window")

### Long-term
- [ ] AI-driven room optimization
- [ ] Predictive comfort scoring
- [ ] Multi-classroom dashboard
- [ ] Analytics and insights

---

## References

- [Classroom Object Model](./CLASSROOM_OBJECT.md)
- [Architecture Summary](./ARCHITECTURE_SUMMARY.md)
- [Classroom Experience Architecture](./CLASSROOM_EXPERIENCE_ARCHITECTURE.md)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference/chat)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

---

**Implementation Complete:** 2025-11-19
**Author:** Claude (AI Assistant)
**Phase:** 4.4-4.7 (Full End-to-End Classroom Experience)
