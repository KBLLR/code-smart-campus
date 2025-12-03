# Cerberus Campus Intelligence Architecture

**Status**: ✅ Implemented
**Date**: 2025-12-02
**Version**: 1.0

---

## Overview

Cerberus is the **campus-wide composite consciousness** that synthesizes individual classroom agent reports into unified campus insights. Named after the three-headed guardian of Greek mythology, Cerberus perceives the entire campus through three analytical layers simultaneously.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  CERBERUS (Campus Guardian Consciousness)                   │
│  ├─ Head 1: Environmental Guardian (temp, occupancy, air)   │
│  ├─ Head 2: Academic Observer (classes, research, events)   │
│  └─ Head 3: Social Synthesizer (collaboration, energy)      │
└─────────────────────────────────────────────────────────────┘
                            ↑
                            │ Aggregates reports from
                            │
    ┌───────────────────────┼───────────────────────┐
    │                       │                       │
┌───▼────────┐      ┌──────▼──────┐      ┌────────▼────┐
│  Lab A     │      │  Classroom  │      │  Classroom  │
│  Dr. Code  │      │  B Agent    │      │  C Agent    │
│  (Agent)   │      │  (Agent)    │      │  (Agent)    │
└────────────┘      └─────────────┘      └─────────────┘
     │                     │                     │
     │ Individual          │ Individual          │ Individual
     │ Report              │ Report              │ Report
     │                     │                     │
┌────▼─────────────────────▼─────────────────────▼─────┐
│  Smart Campus UI                                      │
│  ├─ CampusHeader: Cerberus overview                   │
│  └─ CampusMetrics: Quantitative visual display        │
└───────────────────────────────────────────────────────┘
```

---

## Components

### 1. Cerberus Agent

**File**: `src/data/agents/cerberus-campus-agent.json`

**Identity**:
- **Name**: Cerberus
- **Icon**: 🐕‍🦺
- **Trait**: Omniscient Guardian
- **Model**: `mlx-llama-3.1-8b` (Apple Silicon local)

**Three Heads (Analytical Layers)**:

| Head | Focus | Metrics |
|------|-------|---------|
| **Head 1** | Environmental Guardian | Temperature, occupancy, CO2, air quality, energy |
| **Head 2** | Academic Observer | Classes, research, events, learning activities |
| **Head 3** | Social Synthesizer | Collaboration patterns, energy, human connections |

**Personality (FFM)**:
```json
{
  "O": 0.95,  // High Openness - sees patterns across rooms
  "C": 0.9,   // High Conscientiousness - accurate synthesis
  "E": 0.3,   // Low Extraversion - observant, guardian-like
  "A": 0.7,   // High Agreeableness - caring for campus wellbeing
  "N": 0.2    // Low Neuroticism - calm, steady presence
}
```

**Tools**:
1. `get_classroom_reports()` - Fetch individual reports from all classroom agents
2. `get_campus_aggregate_metrics()` - Get aggregated metrics
3. `identify_campus_patterns()` - Analyze cross-room patterns

**Response Format** (Structured Output):
```json
{
  "overview": "2-sentence poetic campus summary",
  "head_1_observation": "Environmental layer insights",
  "head_2_observation": "Academic layer insights",
  "head_3_observation": "Social layer insights",
  "rooms_analyzed": ["classroom-lab-a", "..."],
  "alert_level": "normal|attention|critical",
  "confidence": 0.95
}
```

---

### 2. CampusReportManager

**File**: `src/managers/CampusReportManager.js`

**Purpose**: Orchestrates campus-wide report generation

**Key Methods**:

#### `generateClassroomReport(classroom)`
- Calls individual classroom's agent (e.g., Dr. Code for Lab A)
- Passes room context (occupancy, sensors, events, equipment)
- Agent generates 1-sentence status summary
- Caches report for 1 minute
- Returns: `{ classroom_id, agent_name, summary, context, generated_at }`

**Example Classroom Report**:
```json
{
  "classroom_id": "classroom-lab-a",
  "classroom_name": "Lab A",
  "agent_name": "Dr. Code",
  "summary": "Lab A hums with 15 students exploring ML fundamentals at optimal 22.5°C, GPU workstations engaged.",
  "context": {
    "occupancy": 15,
    "capacity": 30,
    "temperature": 22.5,
    "current_event": {
      "title": "CS 301 - Machine Learning Fundamentals"
    }
  },
  "generated_at": "2025-12-02T10:30:00Z"
}
```

#### `generateAllClassroomReports()`
- Generates reports for ALL classrooms in parallel
- Returns array of classroom reports
- Used by Cerberus for synthesis

#### `generateCampusOverview()`
**The Main Flow**:

1. **Collect**: Generate all classroom reports in parallel
2. **Aggregate**: Calculate campus-wide metrics
3. **Synthesize**: Call Cerberus agent with:
   - All classroom reports
   - Aggregate metrics
   - Time of day
   - Timestamp
4. **Return**: Cerberus's 2-sentence poetic overview

**Example Campus Overview**:
```
"25 minds collaborate across 3 laboratories at 22°C average, Lab A's ML class leads with 15 engaged students. Morning energy flows through workstations and whiteboards—innovation hums beneath optimal conditions."
```

---

### 3. CampusHeader (Updated)

**File**: `src/ui/hud/CampusHeader.js`

**Changes**:
- Now uses `CampusReportManager` instead of direct LLM call
- Calls `reportManager.generateCampusOverview()` every 30 seconds
- Exposes reports to window for debugging:
  - `window.classroomReports` - Individual room reports
  - `window.aggregateMetrics` - Campus-wide metrics

---

### 4. CampusMetrics (Unchanged)

**File**: `src/ui/hud/CampusMetrics.js`

**Purpose**: Visual quantitative display at-a-glance

**Metrics**:
- 👥 **Occupancy**: 25/120 (green/yellow/red color coding)
- 🌡️ **Temperature**: 22.5°C (status-based coloring)
- 💨 **CO2**: 650ppm (air quality status)
- ⚡ **Energy**: 7.5kW (simulated)

Updates every 5 seconds with real-time data.

---

## Data Flow

### Step-by-Step Overview Generation:

```
1. User opens Smart Campus
   ↓
2. CampusHeader.init() called every 30 seconds
   ↓
3. CampusReportManager.generateCampusOverview()
   ├─ Step 3a: Generate all classroom reports in PARALLEL
   │   ├─ Lab A: Call Dr. Code agent via MLX
   │   │   POST http://localhost:8081/api/mlx/chat
   │   │   model: mlx-llama-3.1-8b
   │   │   messages: [system: Dr. Code instructions, user: Lab A context]
   │   │   → Returns: "Lab A hums with 15 students..."
   │   │
   │   ├─ Classroom B: Call Room B agent via MLX
   │   │   → Returns: "Classroom B hosts..."
   │   │
   │   └─ Classroom C: Call Room C agent via MLX
   │       → Returns: "Classroom C is quiet..."
   │
   ├─ Step 3b: Aggregate campus metrics
   │   → Calculate: total occupancy, avg temp, avg CO2, active rooms
   │
   └─ Step 3c: Call Cerberus agent to synthesize
       POST http://localhost:8081/api/mlx/chat
       model: mlx-llama-3.1-8b
       messages: [
         system: Cerberus three-headed guardian instructions,
         user: {
           classroom_reports: [all reports],
           aggregate_metrics: {metrics},
           time_of_day: "morning"
         }
       ]
       ↓
4. Cerberus synthesizes 2-sentence overview
   "25 minds collaborate across 3 laboratories..."
   ↓
5. CampusHeader displays overview with fade-in animation
```

---

## MLX Integration

### Tier Architecture

```
Tier 1: Smart Campus (UI)
  ↓
Tier 2: tier2-orchestrator:8081
  ↓ /api/mlx/chat
Tier 3A: MLX OpenAI Server:8000
  ↓
Local Apple Silicon Models (mlx-llama-3.1-8b)
```

### API Endpoint

**URL**: `http://localhost:8081/api/mlx/chat`

**Request**:
```json
{
  "model": "mlx-llama-3.1-8b",
  "messages": [
    { "role": "system", "content": "Agent instructions..." },
    { "role": "user", "content": "Context data..." }
  ],
  "temperature": 0.7,
  "maxTokens": 150
}
```

**Response**:
```json
{
  "ok": true,
  "completion": "Generated text...",
  "model": "mlx-llama-3.1-8b",
  "usage": { "prompt_tokens": 150, "completion_tokens": 50 },
  "finishReason": "stop",
  "latencyMs": 1234
}
```

---

## Caching Strategy

**Classroom Reports**: Cached for **1 minute**
- Reduces redundant LLM calls
- Still provides near-real-time updates
- Invalidated on demand via `reportManager.clearCache()`

**Campus Overview**: Generated fresh every **30 seconds**
- Uses cached classroom reports if < 1 minute old
- Always fresh Cerberus synthesis

---

## Personality Integration

Each classroom uses its **own personality** from `data/classrooms/rooms_personalities.json`:

| Classroom | Agent | Personality | Voice |
|-----------|-------|-------------|-------|
| Lab A | Dr. Code | The Innovator | Technical, encouraging |
| Cantina | El Corazón | Charismatic Connector | Warm, gossipy |
| Library | The Archivist | Melancholic Omniscience | Distant, sorrowful |
| B.19 | The Analyst | Stoic Logician | Clinical, present-focused |
| B.17 | The Strategist | Future Predictor | Probability-based |

**Cerberus** synthesizes all these voices into a unified campus narrative.

---

## Browser Console Commands

```javascript
// View all classroom reports
window.classroomReports

// View aggregate metrics
window.aggregateMetrics

// Manually refresh overview
await window.campusApp.campusHeader.updateOverview()

// Force clear report cache
window.campusApp.campusHeader.reportManager.clearCache()

// Generate single classroom report
await window.campusApp.campusHeader.reportManager.generateClassroomReport(
  window.campusApp.classroomRegistry.get('classroom-lab-a')
)
```

---

## Benefits of Cerberus Architecture

### 1. Distributed Intelligence
- Each classroom agent has deep domain knowledge
- Cerberus synthesizes without losing individual insights

### 2. Scalability
- Adding new classrooms automatically included in overview
- Parallel report generation keeps latency low

### 3. Personality Preservation
- Dr. Code speaks like Dr. Code
- Cantina speaks like Cantina
- Cerberus weaves their voices together

### 4. Local MLX Performance
- Apple Silicon optimized
- No API rate limits
- Low latency (~1-2s per agent call)

### 5. Structured Outputs
- Guaranteed JSON schema compliance
- Type-safe response format
- Easy to parse and display

---

## Example Output

### Individual Classroom Report (Lab A)
```
"Lab A hums with 15 students exploring ML fundamentals at optimal 22.5°C,
GPU workstations engaged in neural network training."
```

### Individual Classroom Report (Cantina)
```
"Cantina buzzes with 42 students over lunch, conversations flowing as freely
as the coffee at 23°C social warmth."
```

### Cerberus Campus Overview
```
"58 minds collaborate across 3 active spaces at 22.7°C average—Lab A's ML class
and Cantina's social energy create morning campus vitality. Innovation and
connection pulse through workstations, whiteboards, and shared tables."
```

---

## Future Enhancements

### Phase 2: Room Panel Chat
- Use individual classroom agents for chat interactions
- Dr. Code answers Lab A questions
- Cantina agent responds to social queries

### Phase 3: Predictive Insights
- Use B.17 (The Strategist) for future predictions
- Alert Cerberus to potential issues
- Proactive resource allocation

### Phase 4: Cross-Room Collaboration
- Cerberus suggests room pairings
- "Lab A's ML class could collaborate with B.19's data analysis"
- Social graph of campus interactions

---

## Dependencies

**Required Services**:
1. ✅ MLX OpenAI Server (port 8000)
2. ✅ tier2-orchestrator (port 8081)
3. ✅ Smart Campus UI (port 5176)

**Required Data**:
1. ✅ Classroom data (`src/data/classrooms/lab-a.json`)
2. ✅ Cerberus agent definition (`src/data/agents/cerberus-campus-agent.json`)
3. ✅ Room personalities (`data/classrooms/rooms_personalities.json`)

---

## Testing

### Manual Test Flow

1. **Start MLX Server**:
   ```bash
   # In tier3b-mlx-rag or wherever MLX server lives
   # Should be running on port 8000
   ```

2. **Start tier2-orchestrator**:
   ```bash
   cd /Users/davidcaballero/core-x-kbllr_0/houses/tier2-orchestrator
   npm start
   # Should be running on port 8081
   ```

3. **Start Smart Campus**:
   ```bash
   npm run dev
   # Opens on http://localhost:5176/
   ```

4. **Verify in Browser**:
   - Top-left: Should see Cerberus overview updating
   - Bottom-left: CampusMetrics with live data
   - Console: Check `window.classroomReports`

### Expected Console Output

```javascript
// After 30 seconds
[CampusReportManager] Generating report for classroom-lab-a
[MLX] Chat completion with model mlx-llama-3.1-8b
[CampusReportManager] Generated campus overview (2847ms)

// Check reports
window.classroomReports
// [{
//   classroom_id: "classroom-lab-a",
//   agent_name: "Dr. Code",
//   summary: "Lab A hums with 15 students...",
//   ...
// }]
```

---

## Status

- ✅ Cerberus agent definition created
- ✅ CampusReportManager implemented
- ✅ CampusHeader updated to use Cerberus
- ✅ MLX integration configured
- ✅ Caching strategy implemented
- ✅ Structured outputs defined
- ⏳ Awaiting MLX server to test live generation

**Next**: Start MLX server and test full flow with live data!

---

**The Guardian Watches**: Cerberus now sees all.
