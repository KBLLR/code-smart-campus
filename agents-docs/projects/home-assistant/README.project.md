# Home Assistant Integration Project

Central source of truth for everything related to connecting the Smart Campus experience to Home Assistant (HA). Use this project to track tunnel availability, credential management, WebSocket/REST adapters, and any automation that keeps the data pipeline healthy.

## Scope
- Nabu Casa tunnel configuration and fallbacks.
- Token issuance/rotation for REST + WebSocket clients.
- Availability monitoring, retry strategy, and failure handling.
- Documentation for other agents on how to obtain HA access safely.

## Not in Scope
- Scene UI / 3D rendering (see `3d-experience`).
- Data modelling once telemetry is present (see `data-pipeline`).
- Page-level presentation work (see `pages-integration`).

## Directory Layout
- `tasks.md` — canonical backlog.
- `sessions/` — per-session logs (one per work block).
- `future-features/` — parking lot for bigger ideas once the basics are stable.

## Getting Started
1. Ensure you can reach the HA instance (usually the Nabu Casa URL in `.env`).
2. Generate a long-lived access token under *Profile → Long-Lived Access Tokens*.
3. Update `.env` with `VITE_HA_URL`, `VITE_HA_TOKEN`, and their cloud equivalents.
4. Run `npm run dev` — the Vite proxy forwards `/api/*` to HA, and WebSockets read from `VITE_CLOUD_WS` / `VITE_LOCAL_WS`.

## Useful Links
- [Home Assistant Long-Lived Access Tokens](https://www.home-assistant.io/docs/authentication/#long-lived-access-tokens)
- [Nabu Casa Remote UI docs](https://www.nabucasa.com/config/remote/)
- Project template reference: `agents-docs/templates/project-template`
