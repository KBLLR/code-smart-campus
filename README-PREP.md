# Agent Workflow Starter (Type-1 Template)

Use this README-PREP to bootstrap new repositories that follow the Type-1 workflow. It describes the project variants, required metadata, CLI scripts, and session expectations. Copy the sections you need into your new repo’s `README.md`, `AGENTS.md`, etc.

---

## Project Variants & Ownership

| Variant             | Creation Rights | Description                                                                 |
|---------------------|-----------------|-----------------------------------------------------------------------------|
| **HITL** (Human-in-the-loop)     | User only      | User approves tasks, reviews milestones, and remains actively involved. Agents must escalate decisions and mark tasks “Done” only when the user signs off. |
| **Semi-supervised** | User only      | User seeds the intent, sets priorities, and reviews milestones. Agents self-direct day-to-day work but report outcomes back to the user. |
| **Unsupervised**    | Agents allowed | Agents can create and operate the project independently (e.g., research spikes, sandbox experiments). They still follow the session/task ritual. |

Record the variant and intent in `tasks.yaml`:

```yaml
project:
  id_prefix: CAMPUS
  owner: "@user-or-team"
  variant: HITL           # HITL | SEMI | UNSUPERVISED
  intent: "Describe the goal or experiment in one sentence"
```

Session templates and scripts will read these fields automatically.

---

## Required Ritual (Tasks → Sessions → PR)

1. **Define/pick a task** in `tasks.yaml` (move it from Backlog to In Progress).
2. **Start a session log**:
   ```bash
   pnpm run new:session "Short objective"
   pnpm run new:session -- --diff "Optional: include git diff"
   ```
   This creates `sessions/YYYY-MM-DDThh-mm-<slug>.md`.
3. **Do the work**, referencing the task ID(s) in commits and notes.
4. **Export the ledger**:
   ```bash
   pnpm run tasks:export
   ```
5. **Run checks**:
   ```bash
   pnpm run check
   ```
   (`check` typically runs lint + smoke tests; adjust per repo.)
6. **Raise a PR** referencing task IDs and the session file. Include evidence (screenshots, logs) if UI-visible.

### Session Template Highlights

Each entry includes:
- Task IDs, models consulted, prompt IDs.
- Project variant & intent (auto-filled).
- Capability flags touched (renderer, device limits, API changes).
- Lint/Test status (result of `pnpm run check`).
- Reflection “Good/Bad/Ugly” + optional quote.
- Image prompt (use `subject | style | medium | mood`).
- Next actions (handoff instructions).

---

## CLI Scripts (package.json)

```jsonc
{
  "scripts": {
    "new:session": "node scripts/new-session.mjs",
    "tasks:export": "node scripts/tasks-export.mjs",
    "check": "npm run lint && npm run test:sun" // adjust to your repo
  },
  "devDependencies": {
    "js-yaml": "^4.1.0" // required for new-session/tasks-export
  }
}
```

- `new-session.mjs` copies `sessions/session-template.md`, stamps the timestamp, and pulls variant/intent from `tasks.yaml`.
- `tasks-export.mjs` converts `tasks.yaml` into `tasks.md` for reviewers.
- `check` ensures lint/tests stay green before PRs merge. Customize the command to match your repo.

### Research Workflow

Before working on any task:
1. **Be specific** in search queries (feature + tech + “best practices”).
2. **Verify sources** (cross-reference official docs, papers, community consensus).
3. **Document findings** in the task/session log (include links, notes).
4. **Benchmark** against existing solutions and flag risks.
5. **Create follow-up tasks** if additional work emerges.

---

## Repo Structure for New Projects

```
/agents-docs/templates/project-template  # reusable template folder
  README.md                              # charter, snapshot, workflow reminder
  tasks.yaml                             # backlog source of truth
  sessions/
    README.md                            # session instructions
    session-template.md                  # Good/Bad/Ugly + quote/prompt sections
/scripts
  new-session.mjs
  tasks-export.mjs
```

To bootstrap a new project:
```bash
cp -R agents-docs/templates/project-template projects/my-initiative
cd projects/my-initiative
pnpm run tasks:export   # generate tasks.md
```

Update `tasks.yaml` with the new ID prefix, owner, variant, and intent.

---

## When to Use Which Variant

- **HITL** – Product-critical initiatives, live UX changes, anything requiring stakeholder sign-off.
- **Semi-supervised** – Roadmaps where the user wants oversight but not day-to-day involvement (e.g., integration work, UI refreshes).
- **Unsupervised** – Exploratory labs, research spikes, automation experiments. Agents own outcomes but still log sessions.

Document the choice up front so every session/PR knows the expected level of autonomy.

---

Use this README-PREP whenever you create a new “agent-workflows” repo. Drop it in, adjust the variant tables to your needs, and scaffold the initial project folder from the template. Once lint/tests pass and the rituals are in place, the repo is ready for multi-agent collaboration.
