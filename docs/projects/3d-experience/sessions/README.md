# Session Logs — 3D Experience

Every work block for this project must produce a session log **before** code is committed.

## Naming
- Use ISO-like timestamps for filenames so they sort chronologically, e.g.  
  `2025-11-03T04-35-session.md`

## Workflow
1. Copy the global template:
   ```bash
   cp docs/templates/session-template.md docs/projects/3d-experience/sessions/$(date -Iseconds)-session.md
   ```
2. Fill every section:
   - Date, start/end, elapsed
   - Objectives, execution notes, commands
   - Errors, decisions, learnings
   - Next actions, quote, image prompt
3. Link relevant task IDs from `../tasks.md`.
4. Mention the session log in the PR so reviewers can trace intent.

Consistent logs make handoffs and audits painless—no exceptions.
