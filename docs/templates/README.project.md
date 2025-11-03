# Project Template

Use this template to spin up a new project space (docs-first, task-driven).

## Structure

- `README.project.md` — project overview, scope, success criteria
- `tasks.md` — backlog, WIP, review, done
- `sessions/` — working sessions using `docs/session-template.md`

## Getting started

1. Duplicate:

   ```bash
   cp -R docs/projects/template docs/projects/<project-name>
   ```

2. In the new `README.project.md`, fill in:
   - **Project charter** (why this exists)
   - **Objectives / outcomes**
   - **Stakeholders / reviewers**
   - **Key dependencies** (services, repos, envs)

3. In `tasks.md`, seed the backlog and prioritize.

4. For **every** work block, create a session log (see `README.sessions.md`) **before** you commit.

## Practices

- Keep entries short but specific (file names, commands, decisions).
- Link to GitHub issues / Notion pages where helpful.
- Reference session IDs in PR descriptions.

> Goal: anyone opening this folder should understand what we’re doing, what’s next, and where the evidence is.
