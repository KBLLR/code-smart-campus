# 3D Experience Project

## Project Charter
Craft a high-fidelity, data-driven Three.js representation of the Smart Campus that feels alive, informative, and easy to navigate. The 3D scene must evolve into a first-class interface for occupancy, energy, and environmental insights.

## Objectives & Outcomes
- Deliver a reusable rendering pipeline with realistic lighting (sun + moon), improved materials, and performant post-processing.
- Replace flat text sprites with CSS-anchored HUD labels tied to room and sensor entities.
- Enable intuitive navigation (camera presets, selection tooling) and layer-based visualisations (occupancy heatmap, energy flow, anomalies).
- Document every change with traceable session logs and tests so contributors can safely extend the scene.

## Stakeholders & Reviewers
- **Product / Vision**: David Caballero
- **Engineering**: 3D / Visualization squad (Codex orchestrated)
- **Data Inputs**: Home Assistant integration maintainers
- **QA / Review**: Platform maintainers + Claude docs agent

## Key Dependencies
- Three.js + post-processing utilities (`src/lib/BloomComposer.ts`, `src/lib/ParticleSystem.ts`)
- Home Assistant WebSocket state stream (`src/ha.js`, `src/network/WebSocketStatus.js`)
- Label / room registries (`src/data/labelCollections.js`, `src/utils/labelRegistryUtils.js`)
- UI shell interactions (`index.html`, `src/style.css`, `src/lib/PanelBuilder.js`)

## Artifacts
- Project tasks: `tasks.md`
- Session logs: `sessions/`
- Shared docs/templates: `docs/templates/*.md`
