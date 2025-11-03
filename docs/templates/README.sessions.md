# Session Logs

Store every working-session log for this project in this directory.

Name files with the start timestamp so they sort chronologically, e.g.:

- `2025-02-14T09-30-session.md`
- `2025-02-14T14-15-session.md`

## How to log a session

1. Copy the template into this folder:

   ```bash
   cp docs/session-template.md sessions/$(date -Iseconds)-session.md
   ```

2. Fill **every** field:
   - Date, start/end time, elapsed
   - Objectives
   - Execution notes (what you touched)
   - Errors / decisions / learnings
   - Associated tasks / issues (from `../tasks.md`)

3. Save **before** committing the code from that session.

## Link sessions to tasks

- In the session’s “Associated Tasks / Issues” field, reference task IDs from `../tasks.md`.
- In `tasks.md`, add links to the supporting session logs when you close a task.
- In PRs, drop the session filename so reviewers can trace intent.

> Consistent logging keeps reviews fast and makes the repo auditable.
