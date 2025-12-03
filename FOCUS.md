# Smart Campus - Focus Areas

**Date**: 2025-12-03
**Status**: Active Development

## Core Priorities

### 1. Harmony Response System 🎯

**Location**: `src/utils/harmonyParser.js`

GPT-OSS Harmony format parser for structured AI responses using channel-based output.

#### What is Harmony?

Harmony format structures AI responses into distinct channels:
```
<|analysis|>Internal reasoning and data processing<|end|>
<|commentary|>Thoughts, considerations, patterns<|end|>
<|final|>User-facing answer<|end|>
```

#### Current Implementation

**Key Functions**:
- `extractChannel(response, channelName)` - Extract specific channels
- `parseHarmonyResponse(response)` - Parse into structured object
- `isHarmonyFormat(response)` - Detect Harmony format
- `getDisplayText(response)` - Extract user-facing text

**Features**:
- Multi-channel response parsing (analysis, commentary, final)
- Fallback handling for non-Harmony responses
- Display text extraction
- Format validation

#### Integration Points

Current usage:
- Room agent responses
- Campus overview generation
- AI-driven analysis systems

#### Improvement Opportunities

1. **Enhanced Visualization**
   - Create UI components to display each channel separately
   - Tabbed interface: Analysis | Commentary | Final
   - Syntax highlighting for Harmony tags
   - Collapsible sections for each channel

2. **Advanced Channel Types**
   - Add support for custom channels beyond analysis/commentary/final
   - `<|metrics|>` - Numerical data and statistics
   - `<|visualization|>` - Data for charts/graphs
   - `<|actions|>` - Suggested next steps

3. **Response Streaming**
   - Support for streaming Harmony responses
   - Progressive channel rendering as data arrives
   - Real-time updates for long analyses

4. **Analytics**
   - Track which channels users interact with most
   - Measure response quality by channel
   - A/B test different prompt structures

5. **Developer Tools**
   - Harmony response debugger
   - Channel preview in dev mode
   - Response validation tools

### 2. Google Calendar Integration 📅

**Location**: `src/utils/ICSParser.js`, `src/data/schemas/CalendarReservation.schema.json`

Parse and visualize Google Calendar data from ICS files to display room schedules.

#### Current Implementation

**ICSParser.js**:
- Parses .ics files into event objects
- Extracts: start, end, summary, description, location
- Basic UTC date parsing

**CalendarReservation.schema.json**:
- Comprehensive calendar data schema
- Reservation management
- Recurrence rules (RFC 5545 compatible)
- Virtual meeting support
- Room setup configurations
- Availability tracking

#### Existing Data

- **Calendar file**: `src/data/integrations/calendar/CODE_david.caballero@code.berlin.ics`
- Contains actual calendar events for CODE University

#### Improvement Opportunities

1. **Enhanced Calendar Parsing**
   - Improve timezone handling (currently basic UTC)
   - Support for recurring events (RRULE parsing)
   - Handle VTIMEZONE components
   - Parse attendees and organizers
   - Extract event status (confirmed, tentative, cancelled)

2. **3D Calendar Visualization**
   - Show events as 3D overlays on room blocks
   - Color-code by event type (class, meeting, workshop)
   - Animate current/upcoming events
   - Timeline scrubbing (past/present/future)
   - Heat map: room utilization over time

3. **Real-time Integration**
   - Google Calendar API integration (OAuth)
   - Live event updates via webhooks
   - Push notifications for room changes
   - Sync with Home Assistant calendar entities

4. **Room Booking System**
   - Visual room availability checker
   - Quick-book interface (click room → reserve)
   - Conflict detection and resolution
   - Participant management
   - Email confirmations

5. **Analytics Dashboard**
   - Room utilization statistics
   - Peak usage times
   - Most/least used rooms
   - Event type distribution
   - Capacity planning insights

6. **Smart Scheduling**
   - AI-powered room recommendations
   - Based on: event type, participant count, equipment needs
   - Suggest optimal times based on past patterns
   - Auto-reschedule when conflicts arise

### 3. Visualization & Analysis 📊

Improve the visual representation of campus data and create analytical insights.

#### Current Capabilities

**3D Visualization** (Three.js):
- Room blocks with extruded geometry
- Picking/interaction system
- Labels and markers (Space.js)
- Sun/moon simulation
- Atmospheric rendering

**Data Sources**:
- Home Assistant sensors (temp, CO2, occupancy, etc.)
- Sensor mapping registry (1,302 lines)
- Room metadata and personalities
- Calendar events

**UI Components**:
- Campus header and metrics
- Room hover panels
- Sensor panels
- Graphs (radial, line, markers)

#### Improvement Opportunities

1. **Harmony Response Visualization**
   - **Channel Explorer**: Interactive UI for viewing Harmony channels
     - Tabbed interface: Analysis | Commentary | Final
     - Code syntax highlighting for channel tags
     - Expand/collapse sections
     - Copy individual channels

   - **Response Timeline**: Historical view of AI responses
     - See how analysis evolves over time
     - Compare different analysis channels
     - Track commentary patterns

   - **Multi-Agent View**: Compare responses from different agents
     - Side-by-side channel comparison
     - Consensus detection
     - Divergence highlighting

2. **Calendar Visualization**
   - **3D Timeline**: Events rendered as 3D objects in space
     - Current events glow/pulse
     - Future events translucent
     - Past events fade out
     - Timeline scrubber

   - **Room Gantt Chart**: Traditional calendar view
     - All rooms on Y-axis, time on X-axis
     - Drag-and-drop rescheduling
     - Conflict detection
     - Availability gaps highlighted

   - **Occupancy Prediction**: ML-based forecasting
     - Predict room usage patterns
     - Suggest booking windows
     - Capacity planning

3. **Sensor Data Analysis**
   - **Correlation Matrix**: Find relationships between sensors
     - "When CO2 rises, temperature also rises"
     - "Occupancy correlates with noise levels"
     - Visual network graph of correlations

   - **Anomaly Detection**: Flag unusual sensor readings
     - ML-based outlier detection
     - Alert on dangerous conditions
     - Trend analysis

   - **Comparative Analysis**: Room-to-room comparison
     - "Room A is 3°C warmer than average"
     - Benchmark against similar rooms
     - Identify inefficiencies

4. **Interactive Campus Map**
   - **Heat Maps**: Overlay data on 3D campus
     - Temperature heat map
     - Occupancy density
     - CO2 levels
     - Energy consumption
     - Real-time updates

   - **Flow Visualization**: People movement patterns
     - Trace occupancy changes over time
     - Identify high-traffic areas
     - Optimize circulation

   - **Event Overlays**: Calendar events on campus
     - Show where classes are happening now
     - Highlight available rooms
     - Filter by event type

5. **Dashboard Analytics**
   - **Campus Health Score**: Single metric for overall campus status
     - Environmental: air quality, temperature, humidity
     - Academic: room utilization, event coverage
     - Social: collaboration patterns, space usage

   - **Predictive Insights**: AI-generated recommendations
     - "Room B.7 will be overcapacity at 2pm"
     - "Consider opening overflow space"
     - "Optimal study time: 10am-12pm"

   - **Historical Reports**: Automated reporting
     - Weekly utilization reports
     - Monthly energy analysis
     - Semester trends

### 4. Agent System Enhancement 🤖

**Location**: `src/data/agents/room-agents-config.json`

Room-specific AI agents with OCEAN personalities and Kokoro voices.

#### Current Implementation

- 3,242 lines of comprehensive agent configurations
- 15+ personality types (Architect, Sentinel, Optimizer, etc.)
- FFM/OCEAN psychometric traits
- OpenAI-compatible API parameters
- Speaking styles and rhetoric patterns

#### Harmony Integration

Agents should use Harmony format for structured responses:

```javascript
const prompt = formatRoomAgentPrompt(roomId, {
  harmonyChannels: {
    analysis: "Sensor data analysis and environmental state",
    commentary: "Room personality observations and insights",
    final: "User-facing room status update"
  }
});
```

#### Visualization Ideas

1. **Agent Personality Radar**: Visual representation of OCEAN traits
2. **Response Channel Explorer**: See agent's analysis/commentary/final
3. **Agent Conversation History**: Track agent responses over time
4. **Multi-Agent Consensus**: Compare analyses from different room agents

### 5. Real-time Data Pipeline 🔄

**Location**: `src/data/DataPipeline.js`, `src/sensors/SensorManager.js`

#### Current System

- Home Assistant WebSocket integration
- Real-time sensor updates
- Entity state management
- Room-to-entity binding

#### Enhancements

1. **Calendar Event Streaming**
   - Integrate calendar updates into data pipeline
   - Combine sensor data + calendar data
   - "Room A.5: Occupied (class until 3pm)"

2. **Harmony Response Cache**
   - Cache AI analysis results
   - Invalidate on sensor changes
   - Progressive updates

3. **Multi-Source Aggregation**
   - Home Assistant sensors
   - Google Calendar events
   - Room booking system
   - Student presence (future)

## Implementation Roadmap

### Phase 1: Harmony Enhancement (Week 1-2)
- [x] Create `HarmonyResponseViewer` component (src/ui/HarmonyResponseViewer.js)
- [x] Add channel tabbing (Analysis | Commentary | Final)
- [x] Space.js integration with glassmorphism styling
- [x] Create integration examples (src/examples/harmonyViewerExample.js)
- [x] Document space.js patterns (SPACEJS_GUIDE.md)
- [ ] Implement syntax highlighting for Harmony tags
- [ ] Add response history viewer
- [ ] Create debugging tools for Harmony format

### Phase 2: Calendar Visualization (Week 3-4)
- [x] Improve ICS parser (timezones, recurrence, attendees)
- [x] Create 3D event visualization on room blocks
- [x] Build timeline scrubber for past/present/future
- [x] Add room availability checker
- [x] Implement color-coding by event type

### Phase 3: Analytics Dashboard (Week 5-6)
- [ ] Room utilization statistics
- [ ] Sensor correlation matrix
- [ ] Campus health score calculation
- [ ] Predictive insights with ML
- [ ] Automated reporting system

### Phase 4: Integration & Polish (Week 7-8)
- [ ] Connect Harmony system to room agents
- [ ] Real-time calendar updates via Google Calendar API
- [ ] Multi-agent response comparison view
- [ ] Performance optimization
- [ ] User testing and refinement

## Technical Debt & Cleanup

### Completed ✅
- Removed src-v2 experimental architecture (5.0M)
- Removed 52 Cerberus report JSON files
- Removed Cerberus agent config and documentation
- Removed 27 legacy data files (22K lines)

### TODO
- [ ] Fix ESLint warnings (34 errors, mostly unused vars)
- [ ] Complete TypeScript strict mode compliance
- [ ] Reduce main bundle size (805KB → target 500KB)
- [ ] Implement code splitting with dynamic imports
- [ ] Add comprehensive test coverage for Harmony parser
- [ ] Document Calendar API integration patterns

## Key Files Reference

### Harmony System
- `src/utils/harmonyParser.js` - Core parser (153 lines)
- Usage examples needed in documentation

### Calendar System
- `src/utils/ICSParser.js` - Basic ICS parser (60 lines)
- `src/utils/ICSParser.enhanced.js` - Enhanced ICS parser with timezone/recurrence (438 lines) ✨
- `src/ui/CalendarEventMarker.js` - 3D event markers with Point3D (679 lines) ✨
- `src/ui/CalendarTimeline.js` - Timeline scrubber with Interface (673 lines) ✨
- `src/ui/RoomAvailabilityPanel.js` - Room availability display (661 lines) ✨
- `src/data/schemas/CalendarReservation.schema.json` - Data schema (300 lines)
- `src/data/integrations/calendar/CODE_david.caballero@code.berlin.ics` - Live data

### Visualization
- `src/ui/space/Graph.js` - Graph component (863 lines)
- `src/ui/space/RadialGraph.js` - Radial visualization (1082 lines)
- `src/ui/hud/CampusMetrics.js` - Metrics display (192 lines)

### Data Management
- `src/data/DataPipeline.js` - Real-time pipeline (315 lines)
- `src/sensors/SensorManager.js` - Sensor management (575 lines)
- `src/data/sensors/sensors-mapping.json` - Sensor registry (1302 lines)

## Success Metrics

### User Experience
- Calendar events visible within 3D campus view
- Harmony responses clearly structured and readable
- Analytics dashboard provides actionable insights
- Room booking takes < 30 seconds

### Performance
- Page load time < 2 seconds
- Real-time updates < 100ms latency
- Smooth 60 FPS 3D rendering
- Bundle size < 500KB (gzipped)

### Data Quality
- Calendar sync accuracy > 99%
- Sensor data freshness < 5 seconds
- AI response quality (user-rated) > 4/5
- Zero data loss in real-time pipeline

---

**Next Session**: Start with Phase 1 - Harmony Enhancement. Create the `HarmonyResponseViewer` component with tabbed interface for viewing analysis/commentary/final channels.
