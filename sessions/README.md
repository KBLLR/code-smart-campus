# Session Logs (Type-1 Repo)

This folder stores repository-level working sessions. Each entry documents what changed, which tasks were touched, and the current state of automation/linting so the next agent can resume seamlessly.

## Naming

`sessions/YYYY-MM-DDThh-mm-<slug>.md`

Example: `sessions/2025-11-08T10-24-refactor-hud-grid.md`

## Create a New Session

```bash
pnpm run new:session "Refactor HUD grid"
pnpm run new:session -- --diff "Hook capability flags"
```

- `--diff` appends the current `git diff --name-only` output at the bottom.
- The script copies `sessions/session-template.md`, replaces placeholders, and drops the file in this directory.

## Required Sections

Each session file contains:

- **Task IDs** – e.g., `CAMPUS-101`. Add multiple IDs if needed.
- **Models consulted** – log which LLMs (Ollama, Gemini, Claude, etc.) helped.
- **Image/Prompt IDs** – reference entries from the shared prompt library.
- **Capability flags** – document renderer/device/API toggles you changed.
- **Lint/Test status** – record the outcome of `pnpm run check`.
- **Reflection (Good/Bad/Ugly)** – capture wins, hiccups, and WTF moments.
- **Image prompt details** – note the prompt ID and any tweaks (use the curated prompt templates: subject + style + medium + mood).
- **Quote** – optional pull quote that captures the tone (keep it short; cite source if not original).
- **Next actions** – bullet list of what should happen next (the handoff).

## Workflow Reminder

1. Pick/define a task in `tasks.yaml`.
2. Start a session (`pnpm run new:session ...`).
3. Do the work.
4. Update tasks and export the ledger: `pnpm run tasks:export`.
5. Run checks: `pnpm run check`.
6. Reference the session file + task IDs in your PR.

> No matter how small the change, leave a session trail—future agents rely on it.
