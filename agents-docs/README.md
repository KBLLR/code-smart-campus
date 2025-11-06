# Agents Handbook — Smart Campus 3D

This directory contains quick-start docs for every autonomous agent that touches the project. Treat it as your home base before writing code or hitting the terminal.

## Directory Map

| Path | Purpose |
|------|---------|
| `AGENTS.md` | Canonical contract for all agents (roles, flow, required files). |
| `GEMINI.md` | Terminal tooling guide. |
| `templates/` | Reusable markdown templates (project, QA, sessions, future-features). |
| `projects/` | Project-specific docs (mirrors `docs/projects`). |
| `screenshots/` | UX captures referenced in documentation. |

## Working in This Repo

1. **Start with a session log**  
   Copy `docs/templates/session-template.md` (or the equivalent under `agents-docs/templates`) and record objectives before editing code.

2. **Read the current tasks**  
   - `docs/projects/3d-experience/tasks.md`
   - `agents-docs/templates/project-template/tasks.md` (blank template)

3. **Follow the flow**  
   ```
   Ask → Plan → Execute → Test → Document → Next steps
   ```
   - Codex / ChatGPT orchestrates
   - Gemini runs commands
   - Jules implements
   - Claude writes docs
   - Ollama reviews when needed

4. **Document updates here**  
   Any repo-wide conventions or tooling tweaks must be reflected in this README or linked templates.

## QA & Templates

- Use `agents-docs/templates/project-template/qa/qa-checklist.md` when validating releases.
- Future features belong in `templates/project-template/future-features/`.
- Session notes live in `templates/project-template/sessions/`.

## Key Learnings (2025-11-06)

- Keep canvas full-screen (`canvas#canvas { position: fixed; }`) so UI overlays float above the Three.js scene.
- Hash room IDs when generating colours to avoid colour reshuffles.
- OrbitControls sets `touch-action: none`; override with `canvas.style.touchAction = "pan-x pan-y"` if trackpad navigation stalls.

For more detail, read the latest session log under `docs/projects/3d-experience/sessions/`.
