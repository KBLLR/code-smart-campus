# Task Ledger — HomeAssistant Data Sync & Integration Layer

Keep the table ordered by priority. Reference session logs when moving cards between sections.

## Backlog (Research Phase)

| ID | Title | Description | Priority | Owner | Research Notes |
|----|-------|-------------|----------|-------|---|
| HADS-R01 | Audit current HA integration code | Assess `HomeAssistantSocket.js`, `haState.js`, `ha.js`, and `HomeAssistantSocket.js` for coupling, test coverage, and gaps. Document findings. | Critical | ✅ Done | Session 2025-11-12 identified 6 major fragility issues. |
| HADS-R02 | Map HA entities to room/floor geometry & support device mobility | Research how sensor names relate to spatial objects. Design entity ID → location mapping with support for fixed + mobile devices. | Critical | 🔄 In Progress | HADS-R02-DEVICE-MOBILITY-ARCHITECTURE.md drafted with 3 binding strategies (convention, registry, hybrid) and mobility phases. |
| HADS-R03 | Design scene-agnostic observer pattern | Compare pull vs. push strategies for state sync. Propose how scenes should consume campus data without scene-specific HA logic. | High | | Event bus vs. query-on-demand. Document trade-offs. |
| HADS-R04 | Evaluate state storage options | Should campus state live in volatile memory, IndexedDB, or hybrid? Assess for offline resilience, cross-tab sync, and performance. | High | | Compare localStorage → IndexedDB → Service Worker caching. |
| HADS-R05 | Document error scenarios & recovery | Identify failure modes: HA tunnel down, token expired, WebSocket drop, malformed entities. Propose retry / fallback strategies. | High | | Create runbook for each scenario. |
| HADS-R06 | Type-safe entity binding proposal | Design TypeScript interfaces/types for room, device, sensor bindings. Should prevent scenes from requesting invalid entities. | Medium | | Type-driven architecture. |
| HADS-R07 | Test current WebSocket reconnection | Does `HomeAssistantSocket.js` reconnect correctly? Stress test: kill socket 10 times, verify state consistency. | Medium | | Identify reliability gaps before scaling. |
| HADS-R08 | Assess geospatial/projector/backdrop data needs | What campus entities does each scene type need? Are requirements identical or scene-specific? | Medium | | Ensure abstraction covers all three. |
| HADS-R09 | Research WebGPU raycaster for classroom selection | WebGPU renderer lost raycaster capability; research Three.js WebGPU alternatives for picking classrooms and triggering sensor data display. Propose picking strategy (compute shader, readPixels, hit test). | **Critical** | | **Blocker for user interaction.** Needed to highlight classrooms and show sensor overlay. |

## In Progress

| ID | Title | Started (YYYY-MM-DD) | Owner | Status |
|----|-------|----------------------|-------|--------|

## Review / QA

| ID | Title | PR / Branch | Reviewer | Notes |
|----|-------|--------------|----------|-------|

## Done

| ID | Title | Completed (YYYY-MM-DD) | Outcome |
|----|-------|------------------------|---------|

---

## Notes for Next Agent

- Start with **HADS-R01** (audit current code) to get oriented.
- HADS-R02 and HADS-R03 are blockers for architecture design.
- HADS-R07 should be manual testing (not automated yet) to catch edge cases.
- See `agents-docs/projects/scene-factory/` and `data-pipeline/` for parallel project context.
