# Task Ledger

Track every task for this project here. Keep the table sorted by priority (top = highest). Move items between sections as they progress.

## Backlog
| ID | Title | Description | Priority | Owner | Notes |
|----|-------|-------------|----------|-------|-------|
| DP-101 | Vercel project bootstrap | (Search: \"Vercel monorepo setup\", \"Vite Vercel deployment env\") Create Vercel app, connect repo, configure prod + preview env vars (HA tokens via secrets). | High | Codex | Blocks every other deploy task. |
| DP-102 | Chunking strategy | (Search: \"Vite manualChunks rollup\", \"three.js code splitting\") Define manual chunk map (three-core, UIL vendor, HA client) to keep bundles < 500k. | High | Codex | Coordinate with WebGPU/UIL timelines. |
| DP-103 | Build validation workflow | (Search: \"Vercel GitHub checks\", \"CI env matrix\") Ensure `npm run build && npm run preview` run on PRs with artifact links/screens. | Medium |  | After DP-101. |
| DP-106 | `createLabel.js` load-path review | (Search: \"Vite dynamic import duplication\") Resolve the mixed static/dynamic import pattern for `src/ui/createLabel.js` so it splits correctly and doesn't bloat `main` bundle. | High | Codex | Blocked by DP-102 chunk map. |
| DP-104 | Runtime env matrix | (Search: \"Vercel environment variables best practices\") Document how `.env.local`, preview, and production secrets map to HA endpoints. | Medium |  | Works with data-pipeline team. |
| DP-105 | Rollback & monitoring | (Search: \"Vercel rollback api\", \"deployment alerts\") Provide runbook + alert hooks for failed deploys or regressions. | Low |  | Later phase. |

## In Progress
| ID | Title | Started | Owner | Notes |
|----|-------|---------|-------|-------|

## Review / QA
| ID | Title | PR / Branch | Reviewer | Notes |
|----|-------|-------------|----------|-------|

## Done
| ID | Title | Completed | Outcome |
|----|-------|-----------|---------|
| DP-107 | Vercel CLI automation | 2025-11-08 | Added `vercel.json`, deployment scripts, and README docs so preview/prod pushes run via `npm run deploy:*`. |

> Add or remove columns as needed, but keep the structure predictable so others can grok status fast.
