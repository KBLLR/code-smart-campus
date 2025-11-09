# Smart Campus Live Integration

## ANNEX — Agent Onboarding (Type-1: Existing Repository)

This repository already runs. This annex adds an agent-friendly workflow without touching runtime: **Tasks → Sessions → PR**, with lightweight checks and clean handoffs.

---

### Quickstart (Ritual)

1. **Pick/define a task** in `tasks.yaml` (move cards Backlog → In Progress).
2. **Open a session log**
   ```bash
   pnpm run new:session "<short objective>"
   pnpm run new:session -- --diff "Hook capability flags"
   ```
3. **Do the work**, referencing the task ID(s) in your commits (see Commit Rules).
4. **Export the ledger**
   ```bash
   pnpm run tasks:export
   ```
5. **Run checks**
   ```bash
   pnpm run check
   ```
6. **Raise a PR** referencing the task IDs and session file.

This annex is non-invasive: it standardizes process and docs. Code, build, and deploy remain as-is.

### Files & Conventions

- `tasks.yaml` is the single source of truth. `tasks.md` is generated.
- `sessions/` holds time-stamped logs created from a template.
- ID Prefix: default = uppercase repo basename (override via `tasks.yaml`).
- Example IDs: `CAMPUS-101`, `CAMPUS-204`.
- Status lanes: backlog, in_progress, review, done.

#### Minimal `tasks.yaml`

```yaml
project:
  id_prefix: CAMPUS
  owner: "@repo-maintainer"

backlog:
  - id: CAMPUS-101
    title: "Refactor HUD layout grid"
    description: "Extract grid to CSS vars, add responsive rows."
    priority: high
    owner: "@your-handle"
    research: ["css grid", "hud", "accessibility"]

in_progress:
  - id: CAMPUS-204
    title: "Implement session CLI"
    started: "2025-11-08T10:24:00Z"
    owner: "@your-handle"
    notes: "Waiting on template finalization"

review: []
done: []
```

Keep descriptions crisp; add research keywords so agents know what to read before touching the task.

### Session Logs

- Naming: `sessions/YYYY-MM-DDThh-mm-<slug>.md`
- Create:
  ```bash
  pnpm run new:session "Refactor HUD grid"
  pnpm run new:session -- --diff "Hook capability flags"
  ```

Template sections (auto-inserted):

```
# Session: {{SESSION_NAME}}
**Date:** {{DATE_ISO}}
**Task IDs:** CAMPUS-101
**Models consulted:** Ollama qwen2, Gemini Flash
**Image/Prompt IDs:** city-neon-v1

## Objectives
-
```

Always reference Task IDs here. If you touch renderer or environment conditionals, record it under Capability Flags.

### Commit & PR Rules

**Commits (Conventional Commits)**

- Format: `type(scope): message` (e.g., `feat(hud): expose CSS grid roles`).
- Include task IDs in the body if not in subject: `refs: CAMPUS-101`.
- Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `build`, `ci`.

**Pull Requests**

Include:
- Task IDs (e.g., `CAMPUS-101`, `CAMPUS-204`).
- Session file link (e.g., `sessions/2025-11-08T10-24-refactor-hud-grid.md`).

Checklist:

- [ ] `pnpm run tasks:export`
- [ ] `pnpm run check`
- [ ] Capability flags documented (if applicable)
- [ ] Screenshots/demo notes if UI-visible

### Capability Flags (Context Awareness)

When code changes runtime behavior (renderer, device, API surface), keep a central map and reference it in sessions. Pattern: `scene.userData.capabilities` or `config/capabilities.json`.

Example:

```json
{
  "renderers": { "webgl": true, "webgpu": false },
  "features": { "pmrem": true, "tonemap": "hejl" }
}
```

Mention in the session what changed and why. This saves future agents from re-breaking things.

### Image & Prompt Hygiene

Reference prompts by ID (e.g., `city-neon-v1`) instead of inlining giant text blocks. Log prompt IDs in the session header; store actual prompts centrally (e.g., `prompt-library/image.json`).

**Prompt template suggestion:** `Subject | Style | Medium | Mood`. Keep it short (e.g., “Campus atrium | neon line art | hologram | optimistic”).  
**Quotes:** capture the session vibe in one sentence; cite the author if not original.

### Handoff Checklist (End of Session)

- Tasks updated in `tasks.yaml` with accurate status.
- Session log saved with Objectives, Execution Notes, Next Actions.
- Capability flags updated and documented (if touched).
- `pnpm run tasks:export` executed.
- Open/updated PR references Task IDs and session file.

### FAQ

- **Where do I put a spur-of-the-moment idea?**  
  Add it to backlog with `priority: low` and research keywords. Better messy backlog than lost context.
- **Do I need a session for a 5-minute tweak?**  
  Yes. Use a short session. The log is the glue for handoffs and later audits.
- **Can I skip `tasks:export`?**  
  Only if you enjoy stale ledgers and confused teammates. Run it before every PR.

🗿

## Project Variants

Define the level of Human-In-The-Loop (HITL) involvement before creating a project:

| Variant | Creation | Description |
|---------|----------|-------------|
| **HITL** | User only | User stays in the loop for approvals; agents must escalate decisions and cannot mark tasks done without HITL confirmation. |
| **Semi-supervised** | User only | User seeds the project and reviews milestones; agents self-direct day-to-day work. |
| **Unsupervised** | Agents allowed | Agents create/run the project end-to-end; still follow the logging ritual. |

Record the variant + intent in the project metadata (`tasks.yaml` → `project.variant`, `project.intent`). Session logs pull this information automatically.

This project, developed in collaboration with Google Digital School, explores smart spaces through IoT and connected data. It provides a real-time 3D visualization of a smart campus, integrating live data from Home Assistant to monitor and interact with various sensors and entities within a 3D representation of a building floorplan.

## Key Technologies:

*   **Frontend:** Vanilla JavaScript
*   **3D Graphics:** Three.js
*   **Build Tool:** Vite
*   **Home Automation:** Home Assistant (WebSocket integration)
*   **Styling:** Tailwind CSS

## Getting Started:

1.  **Install Dependencies:** `npm install`
2.  **Run Development Server:** `npm run dev`

## Deployment (Vercel CLI)

Vercel CLI is wired into the repo for both preview and production pushes. Make sure you have access to the project (`npm run deploy:link`) and that `.env.local` mirrors the secrets you’ve stored in Vercel.

```
npm run deploy:preview   # builds locally, uploads using --prebuilt with .env.local
npm run deploy:prod      # builds locally, uploads using --prebuilt --prod
```

The `vercel.json` file pins the build output (`dist/`) and rewrites `/sensors` to `sensors.html` while keeping the rest of the SPA routed through `index.html`.

For more detailed information on the project structure, building, and development conventions, please refer to `GEMINI.md`.
