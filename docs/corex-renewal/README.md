# Smart Campus × Core-X renewal — walkthrough

Branch `codex/corex-campus-shell-20261105` in the private handoff repo
`KBLLR/smart-campus-cloud-20261105` (snapshot of `KBLLR/code-smart-campus` @ local `6cfff00`).
Companion docs: [ACCEPTANCE.md](ACCEPTANCE.md) (David's local checklist) and
[MIGRATION.md](MIGRATION.md) (port to the canonical repo).

## 1. Gap analysis (state of the snapshot before this branch)

| Area | Finding | Evidence |
|---|---|---|
| Space.js | Used for `Point3D` labels/panels and the `Interface`-based HUD. Point3D groups were never added to the scene, so label positions never updated (open task CAMPUS-203). Point3D's window `keyup` handler (digits/Esc) is not gated by `enabled`. | `src/ui/spacejs/CampusPoint3DSystem.js`, `node_modules/@alienkitty/space.js/src/three/ui/Point3D.js` |
| Alien.js | Declared dependency (`^1.2.0`) with **no import in the active source tree**. Kept; not removed. | `package.json`, `grep @alienkitty/alien.js src` |
| campus.glb | 46 nodes: `floormap`, 37 room meshes, 8 `bttn-*` legend disks. No textures, no Draco. 25 materials **shared per category**, so emphasising one meeting room lit all eight plus the legend disk. `a3` geometry is ~90 units off its origin. | SHA-256 `e59a6e99…0598`, parsed GLB JSON |
| Navigation | Mesh/label click → `room:select` → full-screen `RoomDetailView` with a hard-coded "Agent online. Listening…" message (not true). `SceneController.enterRoom()` was never called. `CameraManager.transitionTo()` never animated: tween.js 25 no longer adds tweens to the global group. | `src/ui/panels/RoomDetailView.js`, `src/3d/controllers/SceneController.js` |
| Rendering | Dark scene, shadow acne striping on every face (no shadow bias), saturated category colours. | `before-desktop-overview.png` in the walkthrough page |
| Room identity | Three id spaces: mesh names, `unified_rooms_data.js`, classroom registry (`sensors-mapping.json`: 17 records, e.g. `makerspace` vs mesh `labmakerspace`; `kitchen` has no mesh). | `src/rooms/RoomManager.js` alias special-cases |
| Lanes | Legacy LLM path uses `/v1/chat/completions` (`server/index.js`, `vite.classroom-api.js`, `src/connectors/MLXConnector.js`). Vite proxies `/api/(mlx|…)` to `localhost:3001`, which Core-X assigns to Memory Blocks. Topology lists the Smart Campus surface at `127.0.0.1:3000`; Vite serves on 5173 with `open: true`. | `vite.config.js`, `core-x/config/runtime-topology.json` |
| Model assignments | Three different declarations: manifest `text/qwen2.5-14b-4bit`; classroom default absolute path `qwen2.5-7b-instr`; `MLXConnector` absolute path `gpt-oss-20b`. **Not changed** (needs evidence + approval). | `house.manifest.json`, `src/models/Classroom.js`, `src/connectors/MLXConnector.js` |
| Repo hygiene | `AGENTS.md` contains stray `+` diff markers. `docs/Private & Shared/*.csv` were flagged as private-data candidates in the May audit and are present in this snapshot. | `core-x/reports/smart-campus-cleanup/` |

Cloud-checkable: lint, `tsc`, `vite build`, Jest, `node --test`, Playwright with SwiftShader against the supplied GLB.
Needs David's machine: GPU performance, Home Assistant telemetry, Gateway answers, Event Bus, Warehouse.

## 2. Target experience

Calm, precise, spatial — the academic house of Core-X on the shared warm-grey canvas.

```
Campus (overview) ──select area──▶ Area (Garden, Cosmos, …) ──select room──▶ Classroom workspace
      ▲                                  ▲  Esc / Back / breadcrumb               │  [ ] prev/next keep context
      └────────────── Overview ──────────┴─────────────── Esc / Back ─────────────┘
```

- **Campus overview**: whole model framed in the space right of the room navigator. Hover (mesh, list, or keyboard focus) shows a Space.js label and lightens the room.
- **Area**: the area's rooms framed; other rooms desaturate toward the floor colour (opaque, no transparency sorting).
- **Classroom**: camera dollies to the room keeping azimuth; the room is fully tinted, its area stays as context; the workspace opens (side panel on desktop/tablet landscape, bottom sheet ≤900 px).
- **Context is never lost**: the URL hash (`#/room/b4`, `#/area/Cosmos`) is the deep link; Back goes room → area → campus; per-room agent drafts and answers are kept while you move between rooms.

## 3. Architecture

```
campus.glb ─GLBLoader─▶ meshes ─┐
unified_rooms_data.js ──────────┼─▶ campus/roomIdentity.js ─▶ campus/CampusState.js  (single selection truth)
classrooms-with-sensors.js ─────┘                                  │ subscribe
     ┌──────────────────────────┬─────────────────────────────────┼─────────────────────┬─────────────────────┐
scene/CampusPresentation   ui/spacejs/CampusPoint3DSystem    shell/CampusShell     shell/ClassroomWorkspace   CampusApp (camera + URL)
(materials, emphasis)      (Space.js labels)                 (chrome, list, lanes) (room-aware panel)         scene/cameraFraming
```

| Module | Responsibility |
|---|---|
| `src/campus/roomIdentity.js` | One frozen record per room (`id` = mesh id = unified id), aliases to classroom ids, service spaces non-navigable, unmatched meshes/classrooms reported. |
| `src/campus/CampusState.js` | `overview / area / room`, back/next/prev, hover, hash round-trip. No side effects (tested). |
| `src/campus/telemetry.js` | Per-sensor `live / stale / unknown / offline / preview`; availability only from a **reporting** occupancy sensor; source state trusts delivered readings, not the connector's `connected` flag. |
| `src/lanes/corexLanes.js` | The only place Core-X endpoints are resolved; health probes; room agent over `POST /v1/responses`. |
| `src/scene/*` | Presentation, lighting, framing, category tints. Runtime-only; the GLB file is untouched. |
| `src/shell/*` | Semantic HTML chrome and workspace; renders state, fetches nothing itself. |

### Space.js / Alien.js

Space.js stays the spatial layer: each navigable room has a `Point3D` (reticle, leader line, name + "Area · Use"). The integration is simplified: CampusState drives which labels show (hover + pinned selection), the per-point tracker/"ENTER ROOM" panel is replaced by the workspace, points are added to the scene, and Space.js `--ui-*` variables map onto Core-X tokens (`src/styles/corex/spacejs-corex.css`). The legacy Space.js HUD modules (`CampusHeader`, `CampusMetrics`, `RoomDetailView`, `SensorDashboard`, …) are no longer mounted but are kept for the port review. Alien.js remains a dependency; nothing in this slice needed it (see decisions).

### Core-X design system

`src/styles/corex/kbllr.tokens.css` and `motion.css` are byte-identical copies of the Core-X adapter (`core-x/ui/src/design-system`), with digests in `src/styles/corex/PROVENANCE.md`. Shell CSS only consumes tokens: Chakra Petch / Inter / Fira Code, zero radius, dashed structural borders, translucent blur surfaces, sober status colours, neutral-inverse primary action, `kx-*` motion with reduced-motion handling. Room-category tints are house-local application colours (Canon v0.1 has no data-viz palette) derived from the GLB's own category materials.

### Lane boundaries

| Lane | Use in this slice | Boundary |
|---|---|---|
| Gateway `/v1/responses` | Room agent, explicit submit only | No chat-completions client; no model chosen unless `VITE_COREX_TEXT_MODEL`; remote hosts blocked unless `VITE_COREX_ALLOW_REMOTE_LANES=true`; no retry to other endpoints. |
| Telemetry (Home Assistant) | Existing connector, read-only | `callService` is never invoked; viewing never acts. |
| Event Bus | Health only | Emitting `smart-campus.*` events is reserved (decision 4). |
| Warehouse | Health only | `campus.glb` stays local; proposed binding in MIGRATION.md. |
| Vision / audio / embeddings / RAG | Not used | No need in this slice; existing house dependencies unchanged. |

Defaults (`127.0.0.1:8090/8085/5202`) mirror `services.manifest.json` / `runtime-topology.json`; env overrides win and a test forbids other modules from hard-coding Core-X ports.

### States

Loading (GLB progress), model error, no-WebGL (`?render=off` to exercise; list + workspace keep working), telemetry connecting/offline/live/stale/unconfigured, preview fixtures (`?preview=fixture`, persistent amber banner, every row tagged PREVIEW), Gateway checking/online/offline/blocked, empty filter, focus-visible, skip link, live-region announcements, `prefers-reduced-motion` (instant camera, no eased emphasis, no CSS animation).

Keyboard: `/` filter rooms · `↑ ↓` move in list · `Enter` open · `[ ]` previous/next room · `Esc` back.

## 4. Verification (cloud, supplied GLB only)

| Check | Result |
|---|---|
| `npm run lint` / `npx tsc --noEmit` / `npx vite build` | pass |
| `npm run test:campus` (identity, state, telemetry, lanes, framing) | 42 pass |
| `npm run test:sun` | 3 pass |
| `npm test` (Jest) | 55 pass, 1 fail — `picking-performance › multiple single picks are consistent` (max-latency wall-clock assertion, `< 3 ms`). Fails identically on the untouched snapshot (3.005 ms); this branch does not touch `shared/services`. Not skipped. |
| Playwright (SwiftShader) | overview, hover label, area, room, `]`, Esc, filter + keyboard select, lanes panel, preview, no-WebGL, reduced motion at 1440×900, 1180×820, 820×1180; no page errors |

## 5. Remaining decisions (for David)

1. **Accent token** — Canon v0.1 says neutral `#2d2824`; the shipped adapter says `#ff7a3d`. This branch follows Canon for actions and uses `--accent` only for focus/active marks.
2. **Room agent model** — three conflicting declarations (see §1). This branch sends no model unless `VITE_COREX_TEXT_MODEL` is set.
3. **Telemetry path** — keep browser HA via the Vite proxy, or move behind a Core-X service? The HA token handling flagged in May is unchanged here.
4. **Event Bus** — should selecting a room emit an observability event (`smart-campus.status`)? Not done: viewing must stay side-effect free until approved.
5. **Device control** — which existing authorised path (Council proposal → orchestrator) Smart Campus should use. No actions are offered.
6. **Alien.js** — keep as unused dependency, or adopt for post-processing/shaders in a later visual pass.
7. **Category tints** — keep house-local or propose an identity/data-viz namespace to the Canon.
8. **Smart Campus surface port** — topology says `:3000`; Vite uses `:5173`. Align one to the other.

## 6. Reserved for separate PRs

- Remove/replace the legacy chat-completions paths (`server/index.js`, `vite.classroom-api.js`, `MLXConnector`) and the `/api/(mlx|…)` → `:3001` proxy.
- Retire or migrate the unmounted legacy HUD modules; fix `AGENTS.md` diff markers; decide on `docs/Private & Shared/`.
- Schedule/timetable source; real occupancy; room capacity data.
- Warehouse binding for `campus.glb` and any remodelled derivative (none created here — not needed).
- Code-splitting (main chunk ~820 kB), GPU profiling on the target Mac, label collision handling.
- Stabilise the `picking-performance` max-latency assertion (separate, with evidence).
