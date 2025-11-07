# Task Ledger

Track every task for this project here. Keep the table sorted by priority (top = highest). Move items between sections as they progress.

## Backlog
| ID | Title | Description | Priority | Owner | Notes |
|----|-------|-------------|----------|-------|-------|
| WR-001 | Render pipeline audit | Inventory every renderer dependency (postFX, materials, HUD) and flag WebGPU blockers. | High | Codex | Output lives in `future-features/pipeline-audit.md`. |
| WR-002 | Toolchain readiness | Configure Vite/ESLint/TypeScript to compile `three/webgpu` entrypoints and TSL syntax. | High | Codex | Remove WebGL assumptions; ensure build ships WebGPU only. |
| WR-003 | WebGPU bootstrap | Replace the WebGLRenderer instantiation with WebGPURenderer + minimal scene render loop. | High | | Validate controls, resize, stats on WebGPU path. |
| WR-004 | Post-processing strategy | Evaluate replacements for EffectComposer bloom + tone mapping on WebGPU. | Medium | | Compare `postprocessing` WebGPU branch vs custom nodes. |
| WR-005 | QA/perf checklist | Draft validation plan covering FPS, memory, HDR correctness across major devices. | Medium | Claude QA | Align with campus perf targets. |

## In Progress
| ID | Title | Started | Owner | Notes |
|----|-------|---------|-------|-------|

## Review / QA
| ID | Title | PR / Branch | Reviewer | Notes |
|----|-------|-------------|----------|-------|

## Done
| ID | Title | Completed | Outcome |
|----|-------|-----------|---------|

> Add or remove columns as needed, but keep the structure predictable so others can grok status fast.
