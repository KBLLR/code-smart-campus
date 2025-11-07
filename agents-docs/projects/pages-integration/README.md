# Campus Pages Integration

## Project Charter
Modernise the legacy HTML dashboards under `src/data/assets/` (e.g. `interactive_floorplan.html`, `sensors.html`) and bring them into the Vite-powered application with consistent styling, data bindings, and routing. These pages should serve as lightweight 2D companions to the 3D experience, reusing shared registries and APIs instead of static mock data.

## Objectives & Outcomes
- Convert existing standalone HTML pages into composable Vite entries or routed views that ship with the main bundle.
- Replace inline styles and hard-coded SVG/object embeds with reusable design tokens and component primitives.
- Hook floorplan and sensor views into live registries/Home Assistant data so they stay in sync with the 3D scene.
- Establish a repeatable “pages” workflow for future browser-friendly dashboards (documentation + QA checklist).

## Stakeholders & Reviewers
- **Product / Vision**: David Caballero  
- **Implementation**: Codex orchestration + UI agents  
- **Data Sources**: Home Assistant bridge maintainers  
- **QA**: Claude QA agent (responsible for cross-page regression)

## Key Dependencies
- Assets in `src/data/assets/` (SVG floorplans, dashboard bridges)
- Shared styles (`src/styles/main.css`), icon set under `public/icons/`
- Registry generators (`src/tools/generateRoomRegistry.js`, label registry)
- Vite configuration for multi-entry builds (`vite.config.js`)

## Artifacts
- Task backlog: `tasks.md`
- Session logs: `sessions/`
- QA templates: `qa/`
- Future ideas & explorations: `future-features/`
