# Long-Standing Issues & Tech Debt

This project tracks the nagging problems we keep stepping over—lint failures, legacy files, and other chores that never quite make a sprint. Each task should document:

- **Debt description** (what hurts and where).
- **Impact** (e.g., lint blocks CI, UX confusion, bundle size warnings).
- **Exit criteria** (what “done” looks like—clean lint run, removed file, etc.).

## Goals
1. Surface persistent build/lint/UX warnings so they stop surprising us.
2. Prioritise fixes without derailing feature work; every issue here should link back to the repo state demonstrating the problem.
3. Provide lightweight session logs so future contributors know why debt existed and how to keep it from returning.

## Structure
- `tasks.md` — backlog/in-progress/done ledger (use prefix `LD-XXX`).
- `sessions/` — short logs whenever we investigate or resolve a debt item.
- `future-features/` — optional docs if a “debt” evolves into a larger feature.

> “Ignore the lint today, debug the fire drill tomorrow.”
