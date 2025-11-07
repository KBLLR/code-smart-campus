# Task Ledger — Data Pipeline

Keep the backlog prioritised; link each task to session logs when work begins.

## Backlog
| ID    | Title                                | Description                                                           | Priority | Owner | Notes |
|-------|--------------------------------------|-----------------------------------------------------------------------|----------|-------|-------|
| DP-101 | Telemetry Normalisation Framework   | Define schema & transforms for HA state messages (naming, units).     | High     |       | Anchor epic for DP-101a–c deliverables. |
| DP-101a | Unified DataPipeline service | Consolidate HA websocket + state store into a single normalising service. | High | Codex | Emits `NormalisedEntity` objects to consumers. |
| DP-101b | Canonical room/entity mapping | Author deterministic room ↔ entity manifest and replace fuzzy matching. | High | Codex | Blocker: confirm authoritative room naming scheme. |
| DP-101c | Registry rebuild on normalised data | Regenerate label/room registries via the new pipeline outputs. | High | | Requires 101a+101b complete. |
| DP-102 | Registry Generation Hardening       | Make label/room generators deterministic with validation + diffs.     | High     |       |       |
| DP-103 | Historical Snapshot Storage         | Persist periodic snapshots for analytics & AI workload replay.        | Medium   |       |       |
| DP-104 | Observability & Alerting            | Instrument pipeline with metrics/logging and failure notifications.   | Medium   |       |       |
| DP-105 | Data Access API                     | Expose filtered query endpoints / exports for downstream services.    | Low      |       |       |
| DP-106 | Solar Event Feed (FF-001)           | Generate daily sunrise/sunset/twilight metadata for visual consumers. | Medium   |       | Derive from HA sensors: `sensor.sun_next_dawn/dusk/noon/setting`. |

## In Progress
| ID | Title | Started (YYYY-MM-DD) | Owner | Notes |
|----|-------|----------------------|-------|-------|
| DP-101 | Telemetry Normalisation Framework | 2025-11-06 | Codex | Schema notes drafted (DP-101-normalisation-notes.md); executing sub-tasks. |
| DP-101a | Unified DataPipeline service | 2025-11-06 | Codex | DataPipeline scaffolded; emitting normalised events to main.js & legacy handlers. |
| DP-101b | Canonical room/entity mapping | 2025-11-06 | Codex | Building deterministic mapping manifest + pipeline resolver. |

## Review / QA
| ID | Title | PR / Branch | Reviewer | Notes |
|----|-------|--------------|----------|-------|

## Done
| ID | Title | Completed (YYYY-MM-DD) | Outcome |
|----|-------|------------------------|---------|
