# Repository Guidelines

## Project Structure & Module Organization
The 3D campus experience lives in `src/`, split into targeted modules: `ui/` for panels and overlays, `animation/` for scene motion, `network/` and `home_assistant/` for live data, and `registries/` for generated lookup tables. Shared utilities sit under `lib/`, `utils/`, and `config/`. Workflow and import helpers reside in `src/tools/`. Static assets (GLB/STL models, floorplan SVGs) ship from `public/`, while stakeholder narratives sit in `docs/`. Vite entrypoints (`main.js`, `scene.js`, `Setup.js`) and TypeScript metadata (`src/tsconfig.json`, `vite.config.js`) anchor the build.

## Build, Test, and Development Commands
- `npm run dev` — Launches Vite with `predev` registry generation so local data stays in sync.
- `npm run build` — Type-checks with `tsc` then emits optimized assets under `dist/`.
- `npm run preview` — Serves the production bundle for release verification.
- `npm run lint` — Applies the project ESLint ruleset to every JS/TS module in `src/`.
- `npm run generateRoomRegistry` / `npm run generateLabelRegistry` — Rebuild generated data when source SVG or Home Assistant fields change.

## Coding Style & Naming Conventions
Follow the ESLint configuration in `eslint.config.js`, which enforces modern ECMAScript/TypeScript defaults with browser and Node globals. Use 2-space indentation, dangling commas only where they clarify multi-line literals, and prefer ES modules (`import`/`export`). Mirror existing names: PascalCase classes/components (`Setup.js`), camelCase helpers (`uiUpdater.js`), and kebab-case asset files. Keep configuration constants in `config/` and isolate side-effectful code in the relevant module rather than `utils/`.

## Testing Guidelines
No automated suite exists yet; new features must include targeted smoke checks. Place future unit tests beside their sources using the `<module>.test.ts` naming pattern and run them with `node --test` (add a matching npm script when you contribute the first suite). Always run `npm run lint` and exercise the flow in `npm run dev` before opening a PR, capturing edge cases like empty registry payloads.

## Commit & Pull Request Guidelines
Commits follow Conventional Commit prefixes (`feat:`, `fix:`, `chore:`) as seen in the Git history; keep scopes meaningful (`feat(ui):`, `fix(network):`). Squash work-in-progress branches before review. Pull requests should include: problem summary, implementation notes, regeneration steps for registries, screenshots or clips when UI changes render differently, and linked issue or ticket references. Request review only after the branch rebases cleanly on the latest `main` and passes lint/build locally.

## Environment & Data Generation
Create a `.env.local` aligned with `dotenv` usage in `src/tools/` and `vite.config.js`; the build reads `VITE_*` keys for API hosts. Floorplan-driven registries rely on `public/floorplan.svg`; keep SVG group IDs stable (`g#rooms`) so `generateRoomRegistry.js` resolves paths. When adding sensors or rooms, extend the raw source data first, regenerate registries, and commit both the source edits and the derived `src/registries/*` outputs.

## UI Assets & Icons
`public/icons/` houses a curated SVG set (e.g. `temperature.svg`, `occupancy.svg`, `badge-3d.svg`) exposed via `/icons/<name>.svg`. Reuse these when styling toolbar chips, dashboard cards, or sprite labels so the UI stays visually consistent. Add new icons using the same naming convention and keep them monochrome for easy theming.
