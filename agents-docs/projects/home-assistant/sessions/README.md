# Home Assistant Sessions

Log every work block before you commit. To start a new entry:

```bash
mkdir -p agents-docs/projects/home-assistant/sessions
cp agents-docs/templates/project-template/sessions/session-template.md \
  agents-docs/projects/home-assistant/sessions/$(date -Iseconds)-session.md
```

Fill out every field, keep the tone candid, and link relevant task IDs (e.g., `HA-101`). These notes are how the next agent understands tunnel status, token changes, and pending follow-ups.
