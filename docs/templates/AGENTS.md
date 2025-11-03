# AGENTS — Canonical Agent Contract

Keep this file in sync with `README.project.md`, `tasks.md`, and `SITEMAP*.md`.

---

## 0. Context

This repository is used for:
- Vite + Vanilla JS / React frontends
- Three.js / WebGL scene tooling
- Smart Campus UI (HA WS, label registry, glassy UI)
- Docs-first workflows (`session-template.md`, `AUDIT-log.md`, `tasks.md`)

Agents MUST follow:
1. **Docs-first**: never write code without telling us where it lives.
2. **Session-linked**: every nontrivial change must reference a session log.
3. **Branch-safe**: never push to `main`/`master` directly.
4. **Local-first**: prefer local tools (Ollama/MPS/CoreML) over remote when equivalent.

---

## 1. Repo layout

- `src/` — app / scene / UI logic
- `src/ui/components/` — atomic/molecular UI
- `src/world/` — Three.js world, postprocessing, managers
- `src/data/` — room/label registries, HA mappings
- `public/` — SVG, icons, HDRI, mediapipe
- `docs/` — project docs, session templates
- `sessions/` — per-work-session logs
- `SITEMAP.md`, `SITEMAP_DETAILED.md` — discovery

Do **not** write into build artifacts.

---

## 2. Runtime assumptions

- Node ≥ 20
- pnpm preferred
- Vite on `:5170+`
- Backend on `:5000`
- macOS / Apple Silicon → prefer Metal/MPS
- No Conda

---

## 3. Agents

### Codex (orchestrator)
- Breaks user intent into tasks
- Reads `tasks.md`, `SITEMAP*.md`
- Assigns to: Gemini CLI, Jules, Claude, Ollama
- Always asks for approval before writes
- Never pushes to `main`

### Gemini CLI (terminal/tooling)
- Runs shell inside project root
- Returns stdout + exit code
- Can discover MCP tools
- No global installs

### Jules (code implementer)
- Plan → diff → branch → PR (on approval)
- Works in sandbox
- Shows diffs first
- Never skips tests w/o reason

### Claude (docs/review)
- Writes/updates docs
- Summarizes large modules
- Uses David’s 4 questions (problem, solution, intention, risk)
- Doesn’t change code directly

### Ollama (local)
- Use when offline/sensitive
- Models: `devstral`, `llama3.2-vision:11b`
- Deterministic params for automation
- Can review diffs

### ChatGPT OS 20
- Terminal-facing UX
- Routes to Codex/Jules/Claude
- Can show task list

---

## 4. Task flow

1. User asks
2. ChatGPT OS normalizes
3. Codex plans
4. Jules edits
5. Gemini tests
6. Claude documents
7. Ollama verifies
8. Codex summarizes

---

## 5. Safety / sandbox

- Default read-only
- Writes require approval
- GitHub: feature branches only
- Tools stay inside PROJECT_ROOT
- Local models get only the file content they need

---

## 6. Required files

- `README.project.md`
- `README.sessions.md`
- `tasks.md`
- `session-template.md`
- `SITEMAP.md`
- `SITEMAP_DETAILED.md`
- `AUDIT-log.md`
- `AGENTS.md`

If missing → create from template.

---

## 7. Branch naming

- `feat/<area>-<short>`
- `fix/<area>-<short>`
- `docs/<area>-<short>`
- `chore/<tool>-<short>`

Include task ID in commit/PR.

---

## 8. Orchestrator prompt (example)

```text
You are Codex. Plan the work, assign agents, require approval, never push to main, and always link to a session log.
```
