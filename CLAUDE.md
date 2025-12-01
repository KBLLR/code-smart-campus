# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart Campus Live Integration is a real-time 3D visualization of a smart campus built with Three.js. It connects to Home Assistant via WebSockets to monitor sensors and IoT entities within an interactive 3D floorplan representation. The project is developed in collaboration with Google Digital School.

**Tech Stack:** Vanilla JavaScript (ES Modules), Three.js, Vite, Tailwind CSS, Home Assistant WebSocket API

## Essential Commands

### Development
```bash
npm run dev                    # Start dev server (auto-generates roomRegistry.js first)
npm run build                  # TypeScript compile + Vite production build
npm run preview                # Preview production build locally
```

### Testing & Quality
```bash
npm run lint                   # ESLint check
npm run test                   # Run all Jest tests
npm run test:watch             # Jest in watch mode
npm run test:coverage          # Generate coverage report
npm run test:picking           # Run picking system tests
npm run test:sun               # Run sun telemetry tests (Node.js test runner)
npm run check                  # Run lint + sun tests (used in PR workflow)
```

### Data Generation
```bash
npm run generateRoomRegistry   # Generate room registry from SVG floorplan
npm run generateLabelRegistry  # Generate label registry from data sources
```

### Workflow Scripts (ANNEX Type-1)
```bash
npm run new:session "<title>"           # Create timestamped session log
npm run new:session -- --diff "<desc>"  # Create session with diff description
npm run tasks:export                    # Export tasks.yaml to tasks.md
```

### Deployment (Vercel)
```bash
npm run deploy:link              # Link to Vercel project
npm run deploy:preview           # Build + deploy preview (uses .env.local)
npm run deploy:prod              # Build + deploy production
```

## Architecture Overview

### Core Entry Points
- **`src/main.js`**: Main application entry point. Initializes Three.js scene, Home Assistant connection, UI components, and coordinates async loading via `initCoordinator`.
- **`src/scene.js`**: Manages the Three.js scene graph, including sun/moon controllers, fog, RoomsManager, and label system integration.
- **`src/Setup.js`**: Configures Three.js renderer, camera, controls, and post-processing effects.

### Key Architectural Patterns

#### 1. Async Initialization Coordination
Uses `src/utils/initCoordinator.js` to manage dependencies between async components:
```javascript
markReady('svg-loaded');        // Signal component ready
whenReady('svg-loaded');        // Wait for component
createSignal('some-signal');    // Create custom signal
```
This prevents race conditions when loading 3D models, Home Assistant data, and UI components.

#### 2. Centralized Room Management
**`src/modules/RoomsManager.js`** is the single source of truth for:
- SVG floorplan loading (`/public/floorplan.svg`)
- Room registry (auto-generated from SVG)
- 3D geometry generation (extruded blocks)
- Picking meshes (invisible raycasting shells)
- Entity bindings (room → sensor mappings)
- Label management integration

Pipeline: `SVG → roomRegistry.js → 3D geometry → picking meshes → entity bindings → labels`

#### 3. Home Assistant Integration
- **`src/home_assistant/haClient.js`**: REST API client (fetch entity history, refresh state)
- **`src/network/HomeAssistantSocket.js`**: WebSocket connection for real-time updates
- **`src/home_assistant/haState.js`**: Global state management for entity data
- **`src/ha.js`**: Unified interface for entity operations

#### 4. UI Component Architecture (Atomic Design)
- **Atoms**: `src/ui/components/atoms/` (Button, Icon, Label, Toggle)
- **Molecules**: `src/ui/components/molecules/` (SensorPanel, WSBar, LabelModal, SceneSwitcher)
- **Organisms**: `src/ui/components/organisms/` (Toolbar, FloatingToolbar)

#### 5. Path Aliases (Critical for Navigation)
Configured in `vite.config.js`, these aliases simplify imports:
```javascript
@                 → src/
@components       → src/ui/components
@atoms            → src/ui/components/atoms
@molecules        → src/ui/components/molecules
@organisms        → src/ui/components/organisms
@home_assistant   → src/home_assistant
@data             → src/data
@registries       → src/registries
@utils            → src/utils
@ui               → src/ui
@widgets          → src/ui/widgets
@styles           → src/styles
@three            → src/three
@lib              → src/lib
@debug            → src/debug
@panes            → src/debug/panes
@tools            → src/tools
@network          → src/network
@hud              → src/hud
@interaction      → src/interaction
@shared           → ./shared
```
**Always use these aliases** when importing files.

### Data Sources & Registries

#### Generated Files (Do Not Edit Manually)
- **`src/data/roomRegistry.js`**: Generated from `public/floorplan.svg` via `src/tools/generateRoomRegistry.js`
- **`src/registries/labelRegistry.js`**: Generated label definitions

#### Configuration Files
- **`src/data/entityLocations.json`**: Maps rooms to Home Assistant entities
- **`src/data/mappings/roomEntityMapping.js`**: Room-to-entity binding logic
- **`src/data/geospatial/locationConfig.js`**: GPS coordinates for sun/moon calculations
- **`src/config/capabilities.js`**: Feature flags and runtime capabilities

### Special Systems

#### Sun/Moon Simulation
- **`src/lib/SunController.js`**: Astronomical calculations, sun position
- **`src/lib/SunTelemetry.js`**: Sun telemetry data management
- **`src/lib/MoonController.js`**: Moon phase and position
- **`src/lib/SunSkyDome.js`**: Atmospheric rendering
Uses `suncalc` library with real GPS coordinates from `locationConfig.js`.

#### Picking & Interaction
- **`shared/services/picking-service.ts`**: Raycasting service (TypeScript)
- **`src/three/RaycasterHandler.js`**: Three.js raycasting utilities
- **`src/interaction/RoomSelectionController.js`**: Room selection logic
- **`src/ui/interactions/RoomHighlight.js`**: Visual feedback for room hover/selection

#### Label System
- **`src/lib/LabelManager.js`**: CSS3D and sprite-based labels
- **`src/utils/LabelLayoutManager.js`**: Label positioning and layout
- **`src/data/labelCollections.js`**: Label data collections

#### History & Deployment Tracking
- **`src/data/modules/HistoryManager.js`**: Entity state history
- **`src/history/deploymentViewer.js`**: Deployment timeline visualization

## Development Workflow (ANNEX Type-1)

This repo follows the **ANNEX Type-1 workflow** for agent-friendly development:

### Task Management
1. All tasks live in `tasks.yaml` (single source of truth)
2. Task IDs follow format: `CAMPUS-###`
3. Status lanes: `backlog`, `in_progress`, `review`, `done`
4. Project variant: **HITL** (Human-In-The-Loop) - requires user confirmation for task completion

### Session Ritual
```bash
# 1. Create session log
pnpm run new:session "Add room temperature visualization"

# 2. Work on task, commit with task IDs
git commit -m "feat(rooms): add temperature overlay

refs: CAMPUS-101"

# 3. Export ledger before PR
pnpm run tasks:export

# 4. Run checks
pnpm run check
```

### Session Logs (`sessions/`)
- Format: `YYYY-MM-DDThh-mm-<slug>.md`
- Always reference Task IDs in session header
- Document capability flags if touching renderer or feature detection

### Commit Conventions
- **Format**: `type(scope): message`
- **Types**: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `build`, `ci`
- **Include task IDs** in commit body: `refs: CAMPUS-101`

### Pull Request Checklist
- [ ] Task IDs referenced
- [ ] Session file linked
- [ ] `pnpm run tasks:export` executed
- [ ] `pnpm run check` passes
- [ ] Capability flags documented (if applicable)
- [ ] Screenshots/demo notes for UI changes

## Environment Configuration

### Required Environment Variables (.env)
```bash
# MLX Integration (Phase 2+)
ENABLE_LOCAL_AI=true                        # Use local MLX vs OpenAI cloud
MLX_SERVER_URL=http://localhost:8000        # MLX server endpoint
MLX_MODEL_NAME=mlx-community/qwen2.5-7b-instruct-4bit
ENABLE_CLOUD_FALLBACK=false                 # Fallback to OpenAI if MLX unavailable

# OpenAI Cloud (Fallback)
OPENAI_API_KEY=                             # OpenAI API key

# Logging
LOG_LEVEL=info
DEBUG_CHAT_API=false
```

### Vite Proxy Configuration
- **Development**: `/api` proxied to `VITE_API_PROXY_TARGET` (default: `http://localhost:3001`)
- **Classroom API**: Can bypass proxy if `VITE_USE_LOCAL_CLASSROOM_PLUGIN=true`
- **Production**: Vercel handles routing via `vercel.json`

## Build & Deployment

### Build Process
1. **TypeScript compilation**: `tsc` (type checking only, outputs to check)
2. **Vite bundling**: Creates optimized bundles in `dist/`
3. **Multi-page**: `index.html` (main), `sensors.html` (sensor view)
4. **WASM handling**: Configured for proper WASM file resolution

### Vercel Deployment
- **Framework**: Vite (detected automatically)
- **Output**: `dist/`
- **Routes**: `/sensors` → `sensors.html`, `/*` → `index.html`
- **Environment**: Mirror `.env.local` secrets to Vercel dashboard

### Custom Vite Plugins
- **`labelRegistryDevPlugin()`** (`vite.server.js`): Dev-time label registry serving
- **`classroomApiPlugin()`** (`vite.classroom-api.js`): Classroom API mock/proxy
- **`tailwindcss()`**: Tailwind CSS v4 integration

## Testing Strategy

### Test Files
- **Jest**: `tests/*.test.js`, `src/**/*.test.js`
- **Node test runner**: `tests/sunTelemetry.test.js`
- **Configuration**: `jest.config.js` (jsdom environment, coverage thresholds)

### Test Patterns
```bash
npm run test:picking           # Focused test for picking system
npm run test:performance       # Performance benchmarks for picking
npm run test:sun               # Sun calculation validation
```

## Debugging

### In-App Debugger
- **Toggle**: Press `D` key
- **Integration**: Tweakpane-based (`src/debug/Debugger.js`)
- **Panels**: `src/ui/modules/*Controls.js` (navigation, lighting, sun/sky, debugger)

### Performance Monitoring
- **Stats.js**: FPS and render stats (`src/debug/StatsPanel.js`)
- **Stats-GL**: Advanced GPU stats (`src/debug/StatsGLPanel.js`)

### SVG Coordinate Debugging
- **`src/debug/SVGCoordinateDebugger.js`**: Visual overlay for SVG coordinate mapping

## Key Constraints & Gotchas

1. **SVG is Source of Truth**: Never manually edit `roomRegistry.js`. Always regenerate from `public/floorplan.svg`.

2. **Async Initialization Order**: Use `initCoordinator` signals to manage dependencies. Direct imports may fail if data isn't loaded.

3. **Path Aliases Required**: Use Vite aliases (`@`, `@components`, etc.) consistently. Relative paths break across modules.

4. **Entity Binding Format**: Room IDs in `entityLocations.json` must match SVG `id` attributes (normalized via `normalizeTUMRoomId`).

5. **Predev Hook**: `npm run dev` auto-runs `generateRoomRegistry` via `predev` script. Don't skip this.

6. **WebSocket State**: Home Assistant connection state managed globally. Check `WebSocketStatus` component for connection health.

7. **TypeScript**: Project uses TypeScript for type checking only (no transpilation for JS files). Shared types in `shared/` directory.

8. **Capability Flags**: Document runtime feature detection in `src/config/capabilities.js` and reference in session logs.

9. **Material Registry**: Centralized material management via `src/registries/materialsRegistry.js`. Don't create materials ad-hoc.

10. **Post-Processing**: FX managed via `src/postprocessing/PostProcessor.js`. Accessed via `scene.userData.postFX`.

## Multi-Entry Architecture

### Primary Pages
- **`index.html`** → `src/main.js`: Main 3D campus visualization
- **`sensors.html`**: Dedicated sensor monitoring view

### Shared Module (`shared/`)
Contains TypeScript-based shared services:
- **`services/picking-service.ts`**: Raycasting engine
- **`services/entity-binding-registry.ts`**: Room-entity binding logic
- **`ui/SceneManager.ts`**: Scene management utilities
- **`engine/`**: Core engine components
- **`classroom/`**: Classroom-specific features
- **`scenes/`**: Scene definitions

## Reference Materials

- **README.md**: High-level overview, ANNEX workflow, quickstart
- **GEMINI.md**: Original Google Digital School context, build instructions
- **tasks.yaml**: Current work items and project status
- **sessions/**: Historical session logs (context for past decisions)

## Common Pitfalls

- **Forgetting to run `generateRoomRegistry`**: Always regenerate after SVG changes
- **Breaking path aliases**: Use aliases consistently; avoid `../../` imports
- **Ignoring initCoordinator signals**: Check for `whenReady()` dependencies
- **Manual registry edits**: Registries are generated, not hand-edited
- **Skipping `tasks:export`**: Always export before PRs to keep ledger in sync
- **Missing capability flags**: Document feature flags when adding conditional rendering
