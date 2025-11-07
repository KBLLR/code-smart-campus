# Task Ledger — Home Assistant Integration

Keep the table ordered by priority. Reference session logs when moving cards between sections.

## Backlog
| ID | Title | Description | Priority | Owner | Notes |
|----|-------|-------------|----------|-------|-------|
| HA-101 | Restore HA cloud tunnel availability | Investigate why `rehvwt2…ui.nabu.casa` returns `ERR_INVALID_RESPONSE`, coordinate with infra, and document the recovery steps. | High | | Blocker for every downstream HA feature. |
| HA-102 | Token lifecycle & storage | Define how long-lived tokens are issued, stored in `.env`, rotated, and revoked; ship a short SOP for agents. | High | | Prevents recurring 401 errors during history fetches. |
| HA-103 | Connectivity health checks | Add a lightweight script/UI indicator that pings REST + WS endpoints and surfaces actionable errors in-app. | Medium | | Consumers currently see “Failed to fetch” without detail. |

## In Progress
| ID | Title | Started (YYYY-MM-DD) | Owner | Notes |
|----|-------|----------------------|-------|-------|

## Review / QA
| ID | Title | PR / Branch | Reviewer | Notes |
|----|-------|--------------|----------|-------|

## Done
| ID | Title | Completed (YYYY-MM-DD) | Outcome |
|----|-------|------------------------|---------|
