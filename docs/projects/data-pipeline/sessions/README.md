# Session Logs — Data Pipeline

Log every work block for the data pipeline project **before** committing code.

## Naming Convention
- `YYYY-MM-DDThh-mm-session.md` (UTC recommended)
- Example: `2025-11-03T05-30-session.md`

## Workflow
1. Copy the global template:  
   `cp docs/templates/session-template.md docs/projects/data-pipeline/sessions/$(date -Iseconds)-session.md`
2. Fill in all sections (summary, objectives, execution notes, reflection, next actions, quote, image prompt).
3. Link relevant task IDs from `../tasks.md`.
4. Reference the session file in your PR description for traceability.

Consistent logging keeps the pipeline auditable and handoffs painless.
