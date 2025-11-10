# Future Feature: Real-Time Weather Integration (Home Assistant)

---

## Title
`Live Weather Sync from Home Assistant (Humidity, Cloud Cover, Condition)`

## Context & Motivation
- **Problem**: Currently, cloud coverage & atmospheric conditions are static or manually controlled. Integrating with HA allows Smart Campus 3D to reflect *actual* weather in real-time.
- **Who benefits**:
  - Facility managers monitoring campus during live events (rain, fog warning).
  - Educational demonstrations (correlate weather to sensor/occupancy data).
  - Casual users seeing campus under current conditions.

## Desired Outcome
- Success looks like:
  - Cloud coverage syncs to HA `weather.` entity every 5–10 minutes.
  - Atmospheric condition (clear, cloudy, rainy, fog) updates cloudiness/visibility.
  - UI displays current weather condition + timestamp.
- Metrics:
  - Zero latency impact (async updates to renderer).
  - No lost HA messages (retry logic if WS drops).
  - Smooth cloud fade-in/out over 2–3 sec (not jarring).

## Requirements & Constraints

### Must
- Poll HA weather entity (cloudiness, condition fields).
- Update scene cloud system per HA data.
- Graceful fallback if HA WS unavailable.

### Should
- Display current weather condition in UI (icon + label).
- Show last-sync timestamp.
- Log weather update history (for future analytics).
- Support custom attribute mapping (different HA setups).

### Won't
- Predict weather (use HA forecasts separately if needed).
- Fetch external weather APIs (use HA as single source of truth).
- Render rain/snow particles (scope creep; visual complexity).
- Support multiple weather sensors (start with primary entity).

### Constraints
- **Polling rate**: HA weather updates ~5–10 min; no real-time.
- **Entity path**: Assume `weather.campus` or configurable.
- **Fallback**: If HA disconnects, keep last-known state (don't snap to default).

## Technical Sketch

1. **Data binding**:
   - Subscribe to HA `weather.*.attributes.cloudiness` (0–100%).
   - Subscribe to HA `weather.*.attributes.condition` (clear, cloudy, rainy, fog, etc.).
   - Map condition → scene parameters (fog distance, cloud density, light intensity).

2. **Scene updates**:
   - `CloudSystem.setCoverage(cloudiness)` → fade clouds over 2 sec.
   - Fog distance per condition: clear (1000m), cloudy (500m), fog (100m).
   - Adjust atmosphere scattering intensity (foggy = less contrast).

3. **Integration**:
   - Extend `src/services/haWs.js` to subscribe weather entity changes.
   - Create `src/world/managers/WeatherSync.js` (maps HA → scene state).
   - Wire into `GeospatialManager` lifecycle.

4. **UI**:
   - Add weather info panel (icon, condition label, last-sync time).
   - Optional: weather history sparkline (last 24h cloudiness).

5. **Modules touched**:
   - `src/services/haWs.js` (subscribe to weather entity)
   - `src/world/managers/WeatherSync.js` (new)
   - `src/world/managers/CloudSystem.js` (extend for smooth transitions)
   - `src/ui/components/WeatherPanel.js` (new; glassy panel)

## Dependencies
- Home Assistant WS service (already integrated; verify weather entity available).
- HA `weather.` entity with `cloudiness` & `condition` attributes (standard HA template).
- Smooth easing function for cloud transition (already in monorepo?).

## Risks & Open Questions

- **Risk**: HA weather entity not available in all setups; need fallback config.
- **Risk**: HA disconnect mid-sync; implement queue + retry logic.
- **Question**: Should fog distance fade smoothly or snap? Smooth is better UX.
- **Question**: Multiple weather sources (forecast vs. current)? Start with current condition.
- **Question**: How to map HA condition strings (e.g., `rainy`) to scene parameters? Create lookup table.

## Integration Plan

1. **Phase 1 (Stub)**: Wire HA weather entity; log updates (no visual change).
2. **Phase 2 (MVP)**: Cloud coverage updates; fog distance per condition.
3. **Phase 3 (Polish)**: Weather info UI; smooth transitions; history logging.
4. **Phase 4 (Advanced)**: Atmospheric scattering intensity per condition; rain particle stubs.
5. **Rollout**: Feature flag "Live Weather Sync"; default off (manual control preferred initially).
6. **Docs**: Document HA entity requirements; provide weather entity template for users.

## Status
- **Current state**: `idea`
- **Last reviewed**: `2025-11-10`
- **Unblocked**: Depends on existing HA WS service (already working).
- **Task ID**: `GEO-703`
