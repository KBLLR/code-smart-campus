# Task Ledger — Data Pipeline

Keep the backlog prioritised; link each task to session logs when work begins.

## Backlog
| ID    | Title                                | Description                                                           | Priority | Owner | Notes |
|-------|--------------------------------------|-----------------------------------------------------------------------|----------|-------|-------|
| DP-101 | Telemetry Normalisation Framework   | Define schema & transforms for HA state messages (naming, units).     | High     |       |       |
| DP-102 | Registry Generation Hardening       | Make label/room generators deterministic with validation + diffs.     | High     |       |       |
| DP-103 | Historical Snapshot Storage         | Persist periodic snapshots for analytics & AI workload replay.        | Medium   |       |       |
| DP-104 | Observability & Alerting            | Instrument pipeline with metrics/logging and failure notifications.   | Medium   |       |       |
| DP-105 | Data Access API                     | Expose filtered query endpoints / exports for downstream services.    | Low      |       |       |
| DP-106 | Solar Event Feed (FF-001)           | Generate daily sunrise/sunset/twilight metadata for visual consumers. | Medium   |       | Derive from HA sensors: `sensor.sun_next_dawn/dusk/noon/setting`. |

## In Progress
| ID | Title | Started (YYYY-MM-DD) | Owner | Notes |
|----|-------|----------------------|-------|-------|

## Review / QA
| ID | Title | PR / Branch | Reviewer | Notes |
|----|-------|--------------|----------|-------|

## Done
| ID | Title | Completed (YYYY-MM-DD) | Outcome |
|----|-------|------------------------|---------|
