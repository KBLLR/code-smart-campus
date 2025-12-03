# Merge Strategy & Legacy Code Cleanup

**Date**: 2025-12-03
**Current Branch**: `feature/ui-cleanup-agent-config`
**Target**: `main`

## Branch Overview

### Active Feature Branches

1. **feature/ui-cleanup-agent-config** (current, 5 commits ahead)
   - Latest UI components
   - Room agent configuration with Kokoro voices
   - Clean architecture work

2. **feature/minimal-ui** (3 commits ahead, shared history with current)
   - 3D pointer initialization
   - GPToss20 mock data integration

3. **feat/scene-knob-lab** (status unknown)
4. **feature/scene-backdrop** (status unknown)
5. **feature/scene-projector** (status unknown)

### Commit Timeline (Current Branch)

```
dccca5f (HEAD) new UI components
8690b16 feat: cleanup legacy UI and add room agent config with Kokoro voices
57ee3e7 UI 3d pointer successfully initiated
ebf5623 Integrating campus with MLX server and orchestrator
873b70f feat: Add real-time sensor system, UI components, and space.js research
------- (main branch)
175c779 feat: Implement GLTF model loading and Blender compatibility
```

## File Changes Summary

**254 files changed**
- **86,256 insertions**
- **22,113 deletions**

### Directory Structure

- **src/** (8.0M) - Current production code
- **src-v2/** (5.0M) - New clean architecture (not yet integrated)

## Legacy Code Removed

### Data Files (27 files deleted)

#### Obsolete Classroom Data
- `data/classrooms/eng-101-calendar.json`
- `data/classrooms/eng-101.json`
- `data/classrooms/lab-a.json`

#### Legacy SVG Assets (5 files)
- `src/data/assets/floorplan_colored.svg`
- `src/data/assets/fully_annotated_floorplan.svg`
- `src/data/assets/interactive_floorplan.html`
- `src/data/assets/precise_floorplan_annotated.svg`
- `src/data/assets/sensors.html`

#### Deprecated Examples (7 files)
- `src/data/examples/classroom-view-peace.json`
- `src/data/examples/openai-conversation-example.json`
- `src/data/examples/reservation-example.json`
- `src/data/examples/room-personality-*.json` (3 files)
- `src/data/examples/student-profile-example.json`

#### Old Static Data (8 files)
- `src/data/static/entities.json`
- `src/data/static/entity_attributes.json`
- `src/data/static/entity_attributes_full.json`
- `src/data/static/mockup-Room_entity_data.js` (large, 8374 lines)
- `src/data/static/sensors-hardcoded.json`
- `src/data/static/sensors.json`
- `src/data/static/room_positions_colors.json`
- `src/data/static/Entities_in_Critical_States.csv`

#### Old Mapping Files (2 files)
- `src/data/entityLocations.json` (replaced by new system)
- `src/data/mappings/roomEntityMapping.js`

#### Misc Cleanup
- `src/data/misc/model-gltf-validation.json`
- `src/data/misc/tree-before.txt`

### Replaced By

| Legacy | New Location |
|--------|-------------|
| `src/data/entityLocations.json` | `src/data/sensors/sensors-mapping.json` (1302 lines) |
| `src/data/examples/*` | `src/data/agents/room-agents-config.json` (3242 lines) |
| Static mock data | Dynamic sensor system (`src/sensors/SensorManager.js`) |
| Old mappings | `src/rooms/roomsMetadata.js` + `RoomManager.js` |

## New Architecture Additions

### Documentation (13 new docs)
- `ARCHITECTURE.md` - Clean architecture overview
- `docs/CERBERUS_ARCHITECTURE.md` - Cerberus agent system
- `docs/CLASSROOM_AGENT_SCHEMA_2025.md` - Agent schema
- `docs/CLASSROOM_DATA_SCHEMA.md` - Data structure docs
- `docs/HUD_IMPLEMENTATION.md` - HUD design
- `docs/IMPLEMENTATION_COMPLETE.md` - Implementation status
- `docs/MODEL_STRATEGY.md` - 3D model strategy
- `docs/SPACEJS_*.md` (5 files) - Space.js integration docs
- `docs/VISUAL_EFFECTS_PLAN.md` - VFX roadmap

### Core Systems

#### src-v2/ Directory (New Clean Architecture)
```
src-v2/
├── core/App.js                    # App orchestrator
├── integration/                   # Connector layer
│   ├── DataPipeline.js
│   ├── HomeAssistantConnector.js
│   ├── MLXClient.js
│   └── Orchestrator.js
├── world/SceneManager.js          # Scene management
└── ui/UIManager.js                # UI coordination
```

#### New src/ Enhancements
- `src/core/CampusApp.js` (429 lines) - Main app
- `src/connectors/` - Connector architecture
  - `BaseConnector.js`
  - `HomeAssistantConnector.js`
- `src/managers/` - Manager pattern
  - `CampusReportManager.js`
  - `GraphManager.js`
- `src/rooms/` - Room system
  - `RoomManager.js` (268 lines)
  - `roomsMetadata.js` (327 lines)
- `src/sensors/` - Sensor system
  - `SensorManager.js` (575 lines)
- `src/services/` - Service layer
  - `SensorSnapshotService.js`
  - `SensorSyncService.js`

### UI Components

#### New UI System
- `src/ui/ClassroomPicker.js` - Room selection
- `src/ui/RoomDetailView.js` (449 lines) - Room details
- `src/ui/hud/` - HUD components
  - `CampusHeader.js`
  - `CampusMetrics.js`
  - `RoomHoverPanel.js`
- `src/ui/spacejs/` - Space.js 3D UI
  - `Point3DManager.js`
  - `RoomLabel.js`
  - `RoomLabelManager.js`
  - `RoomPoint.js`
- `src/ui/space/` - Graph components
  - `Graph.js` (863 lines)
  - `RadialGraph.js` (1082 lines)
  - `GraphMarker.js`

### Data & Configuration

#### Agent Configuration
- `src/data/agents/cerberus-campus-agent.json` (173 lines)
- `src/data/agents/room-agents-config.json` (3242 lines) - Comprehensive room AI configs
- `src/data/personalities/ocean-personalities.json` (407 lines)
- `src/data/personalities/rooms_personalities.json` (422 lines)

#### Sensor Data
- `src/data/sensors/sensors-mapping.json` (1302 lines)
- `src/data/reports/cerberus-report-*.json` (48 timestamped reports)

#### Schemas
- `src/data/schemas/*.schema.json` (8 schemas)
  - CalendarReservation
  - ChatPresenceHistory
  - ClassroomView
  - OpenAIIntegration
  - RoomActions
  - RoomPersonality
  - SensorAnalytics
  - StudentProfile

## Merge Strategy

### Phase 1: Pre-Merge Validation ✅

1. **Review current branch**
   ```bash
   git status
   git log main..HEAD --oneline
   ```

2. **Check for conflicts**
   ```bash
   git merge-base main HEAD
   git diff main...HEAD --stat
   ```

3. **Run tests**
   ```bash
   npm run lint
   npm run test
   npm run check
   ```

### Phase 2: Clean Merge to Main

#### Option A: Squash Merge (Recommended)
Best for clean history, combines all 5 commits into one comprehensive update.

```bash
# Ensure you're on feature/ui-cleanup-agent-config
git checkout feature/ui-cleanup-agent-config

# Update from main
git fetch origin
git rebase origin/main

# Switch to main
git checkout main
git pull origin main

# Squash merge
git merge --squash feature/ui-cleanup-agent-config

# Create comprehensive commit
git commit -m "feat: Major UI cleanup and agent configuration overhaul

- Remove 27 legacy data files and obsolete examples
- Add comprehensive room agent configuration (3242 lines)
- Implement new sensor management system
- Add Cerberus campus agent architecture
- Integrate MLX server and orchestrator
- Add Space.js 3D UI components (room labels, graphs)
- Create new HUD system (campus header, metrics, hover panels)
- Add 13 comprehensive documentation files
- Implement connector architecture for Home Assistant
- Add OCEAN personality system for room AI agents
- Create schema definitions (8 JSON schemas)
- Add sensor sync and snapshot services

Breaking Changes:
- Removed src/data/entityLocations.json (use sensors-mapping.json)
- Removed src/data/static/* mock data
- Removed legacy classroom examples

refs: CAMPUS-[TASK_ID]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

#### Option B: Standard Merge
Preserves commit history (5 commits).

```bash
git checkout main
git pull origin main
git merge feature/ui-cleanup-agent-config --no-ff
```

### Phase 3: Handle src-v2/ Directory

**Decision Point**: The `src-v2/` directory (5.0M) is not yet integrated.

#### Strategy 1: Keep Parallel (Recommended)
```bash
# src-v2/ stays as experimental architecture
# Continue development in src/
# Migrate components incrementally
```

#### Strategy 2: Remove src-v2/
```bash
# If src-v2 is superseded by current src/ improvements
git rm -r src-v2/
git commit -m "chore: Remove experimental src-v2 architecture"
```

#### Strategy 3: Rename src-v2/ to archive/
```bash
git mv src-v2/ archive/src-v2-experiment/
git commit -m "chore: Archive src-v2 experimental architecture"
```

### Phase 4: Other Feature Branches

#### feature/minimal-ui
Shares 3 commits with current branch (873b70f, ebf5623, 57ee3e7).

**Action**: Safe to delete after merging current branch.
```bash
git branch -d feature/minimal-ui
```

#### Unreviewed Branches
- feat/scene-knob-lab
- feature/scene-backdrop
- feature/scene-projector

**Action**: Review before merging current work.
```bash
# Check each branch
git log main..feat/scene-knob-lab --oneline
git log main..feature/scene-backdrop --oneline
git log main..feature/scene-projector --oneline
```

### Phase 5: Post-Merge Cleanup

1. **Update documentation**
   ```bash
   npm run tasks:export
   git add tasks.md
   git commit -m "docs: Update task ledger post-merge"
   ```

2. **Verify build**
   ```bash
   npm run build
   npm run preview
   ```

3. **Push to remote**
   ```bash
   git push origin main
   ```

4. **Clean up branches**
   ```bash
   git branch -d feature/ui-cleanup-agent-config
   git push origin --delete feature/ui-cleanup-agent-config
   git branch -d feature/minimal-ui
   ```

## Legacy Code Still Present

### Files to Consider Removing (Future Cleanup)

#### Module Imports from Old System
Check if these are still used:
- `src/modules/classroom/ClassroomSelector.tsx` (7 lines, might be stub)

#### Report Overload
- 48 Cerberus report JSON files in `src-v2/data/reports/`
- Consider archiving or pruning old reports

#### Duplicate Data
Check for duplication between:
- `src/data/` vs `src-v2/data/`
- `src/data/personalities/` (two similar files)

### Next Cleanup Phase

```bash
# Find unused files
npm run lint:unused  # if available

# Check for dead code
git log --all --full-history --diff-filter=D -- src/

# Review large files
git ls-files | xargs du -h | sort -rh | head -20
```

## Risk Assessment

### Low Risk
- Removing static mock data (replaced by dynamic system)
- Removing example JSONs (replaced by schema + real configs)
- Removing old SVG assets (using current floorplan)

### Medium Risk
- `entityLocations.json` removal
  - Verify all references updated to `sensors-mapping.json`
  - Check RoomManager integration

### High Risk
- `src-v2/` directory decision
  - Contains 5.0M of code
  - Not currently referenced but represents significant work
  - Recommendation: Keep as parallel experiment

## Recommendations

1. **Use Squash Merge** for cleaner main branch history
2. **Keep src-v2/** as experimental architecture for now
3. **Delete feature/minimal-ui** after merge (shared commits)
4. **Review other feature branches** before taking action
5. **Document breaking changes** in commit message
6. **Run full test suite** before pushing
7. **Create GitHub release** with changelog
8. **Update CLAUDE.md** if architecture paths changed

## ANNEX Workflow Compliance

### Session Log
Create session log before merge:
```bash
npm run new:session "Major UI cleanup merge to main"
```

### Task References
Update tasks.yaml with:
- Task IDs for completed work
- Status changes (backlog → done)
- Session log references

### Export Ledger
```bash
npm run tasks:export
```

### Commit Format
All commits should reference task IDs:
```
feat(ui): major cleanup and agent configuration

refs: CAMPUS-[ID]
```

## Success Criteria

- [ ] All tests pass (`npm run check`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors in dev mode
- [ ] Home Assistant connection works
- [ ] Room selection functional
- [ ] 3D UI renders correctly
- [ ] Agent configurations load
- [ ] Documentation is accurate
- [ ] Breaking changes documented
- [ ] Session log complete

## Rollback Plan

If issues arise after merge:

```bash
# Find merge commit
git log --oneline --merges -1

# Revert merge
git revert -m 1 <merge-commit-hash>

# Or hard reset (DANGEROUS)
git reset --hard <commit-before-merge>
git push origin main --force
```

---

**Next Steps**: Review this strategy, validate approach, then proceed with merge.
