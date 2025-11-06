# Future Feature Spec

## Title
Solar Event Feed for Visualization Clients

## Context & Motivation
- The 3D experience needs precise timestamps for sunrise, solar noon, sunset, and twilight boundaries to anchor visual markers.
- Relying solely on live `sun.sun` updates introduces jitter and can miss events if telemetry is delayed.

## Desired Outcome
- Provide a lightweight API (or registry artifact) delivering upcoming solar event times with metadata (azimuth, elevation).
- Consumers (3D scene, dashboards, automations) can subscribe/poll once per day to place markers and schedule behaviors.

## Requirements & Constraints
- Must compute events at least 24 hours ahead using HA data or astronomical calculations.
- Should include both civil/nautical twilight markers for richer storytelling.
- Won’t require continuous updates; daily regeneration is acceptable.

## Technical Sketch
- Extend the data pipeline with an ephemeris module (e.g., `astronomia`, `suncalc`) seeded by site coordinates.
- Schedule a job to generate JSON/YAML output stored under `src/data/` (or served via API).
- Include checksum/version info so clients know when data changes.

## Dependencies
- Accurate latitude/longitude of the campus.
- Timezone handling to align with UI expectations.

## Risks & Open Questions
- Validate that external libraries match Home Assistant’s calculations to avoid discrepancies.
- Decide how to reconcile HA overrides (e.g., manual offsets) if they exist.

## Integration Plan
- Start as a generated artifact consumed by the 3D project; later expose through a REST endpoint.
- Document schema and usage in both project READMEs.

## Status
- Current state: idea
- Last reviewed: 2025-11-03
