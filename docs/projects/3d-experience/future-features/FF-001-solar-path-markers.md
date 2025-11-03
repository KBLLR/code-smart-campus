# Future Feature Spec

## Title
Solar Path Event Markers

## Context & Motivation
- The new sun path arc communicates directionally where the sun has been, but it lacks anchors for key events (sunrise, solar noon, sunset).
- Highlighting these cues improves comprehension for facilities teams planning light/energy usage and helps storytelling in demos.

## Desired Outcome
- Viewers see discrete markers along the arc for sunrise, solar noon, and sunset (plus optional user-defined events).
- Hovering or selecting a marker reveals time, elevation, and any associated automation triggers.

## Requirements & Constraints
- Must render lightweight billboards or sprites that inherit the sky/lighting palette without overpowering the arc.
- Should support both real-time HA data and fallback astronomical calculations when telemetry drops.
- Won’t introduce complex physics; markers remain statically aligned to the computed path points.

## Technical Sketch
- Extend `SunTelemetry` to cache the last 24h of samples with timestamps.
- During each update, compute event positions (interpolated sample). Store in a `SunPathMarkers` helper that manages pooled sprite meshes.
- Integrate with existing selection/raycast utilities for tooltips and label sync.

## Dependencies
- Accurate sun telemetry (or precomputed astronomical ephemeris for fallback).
- CSS/Three.js hover tooltip workstream (ties into CSS HUD roadmap).

## Risks & Open Questions
- How noisy is HA data around sunrise/sunset? May need smoothing thresholds.
- Do we need historical data to place markers ahead of time (e.g., tomorrow’s forecast)?

## Integration Plan
- Ship behind a feature flag toggled via Tweakpane.
- Document in 3D Experience README once visuals are tuned; update demo scripts for stakeholder walkthroughs.

## Status
- Current state: idea
- Last reviewed: 2025-11-03
