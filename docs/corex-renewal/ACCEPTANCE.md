# Local acceptance checklist (David)

Cloud validation used only the supplied `public/models/campus.glb` with SwiftShader and **no** live
services. Everything below needs your machine.

## Setup

```bash
git fetch origin codex/corex-campus-shell-20261105
git checkout codex/corex-campus-shell-20261105
npm ci --ignore-scripts
npm run check && npm run test:campus && npx tsc --noEmit && npx vite build
npm run dev
```

Optional env (`.env.local`, not committed): `VITE_COREX_GATEWAY_URL`, `VITE_COREX_EVENT_BUS_URL`,
`VITE_COREX_WAREHOUSE_URL` (defaults are the Core-X locals 8090 / 8085 / 5202), `VITE_COREX_TEXT_MODEL`
(only if you decide a model; otherwise Gateway routing decides), `VITE_HA_PROXY_TARGET` for Home Assistant.

Start shared services the normal way (`./corex wall`); do not start copies from the house.

## Visual / interaction (real GPU)

- [ ] Overview loads with progress, no shadow striping, campus framed right of the room list.
- [ ] Hovering a room (mesh or list) lightens only that room and shows its Space.js label.
- [ ] Clicking a room in 3D opens the workspace; camera dollies (no spin) and the room stays visible beside the panel.
- [ ] Area headers frame the whole area; Back / Esc / breadcrumb go room → area → campus.
- [ ] `[` `]` step rooms; URL hash updates; reload restores the same room.
- [ ] Legend chip and the GLB legend disks filter by use.
- [ ] Orbit/zoom stays smooth at 60 fps on the target Mac; dragging cancels a camera transition.
- [ ] macOS "Reduce motion" on → camera jumps, no eased emphasis or slide-in.
- [ ] Tablet (iPad or 1180×820 / 820×1180 window): drawer list + side panel / bottom sheet are usable by touch.

## Services (honest states)

- [ ] Gateway up → chip green; ask a room question → answer appears; check the Gateway log shows `POST /v1/responses` with `metadata.house_id = smart-campus` and no `model` (unless you set one).
- [ ] Gateway down → chip red, Ask disabled with the reason; nothing falls back elsewhere.
- [ ] Home Assistant up → Telemetry chip green; mapped sensors show values with "live · Ns ago"; occupancy drives Availability.
- [ ] HA down → rows show OFFLINE and Availability UNKNOWN (no invented values).
- [ ] Event Bus / Warehouse chips reflect `./corex wall` state.
- [ ] Opening rooms never calls a Home Assistant service (check HA logbook).

## Data checks

- [ ] `campus.glb` SHA-256 still `e59a6e990053b22277954b060f682acc1006b9875c37193ffd51e62a8cec0598`.
- [ ] Your local `public/models/` extras (excluded from the snapshot) are not required by the new shell.
- [ ] Confirm the classroom ↔ mesh aliases (`labmakerspace`↔`makerspace`, `terracehydrogen`↔`hydrogen`) and that `kitchen` really has no mesh.

## Known

- Jest `picking-performance` max-latency assertion is wall-clock sensitive; it failed on the untouched snapshot in the cloud too.
- `?preview=fixture` shows synthetic readings with a banner — never use it for demos of live data.
