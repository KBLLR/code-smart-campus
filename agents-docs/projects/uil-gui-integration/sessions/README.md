# UIL GUI Integration Sessions

Log every work block before committing code tied to this project. To start a new entry:

```bash
mkdir -p agents-docs/projects/uil-gui-integration/sessions
cp agents-docs/templates/project-template/sessions/session-template.md \
  agents-docs/projects/uil-gui-integration/sessions/$(date -Iseconds)-session.md
```

Fill out every field, link the relevant task IDs (e.g., `UG-101`), and summarise the prerequisite web research inside the “Objectives” or “Execution Notes” sections for future agents.
