# RoomsManager Enhancement — Label & Raycaster Integration

Consolidate label generation and raycasting functionality into the central RoomsManager to create a unified API for all room-based interaction and visualization systems.

## Project Snapshot
- Variant: `HITL`
- Intent: **Integrate LabelManager and raycasting into RoomsManager for unified room interaction**

## Objectives

### Primary Goal
Create a cohesive room management system where labels, raycasting, picking, and visual feedback are orchestrated through a single manager class.

### Success Criteria
- [ ] LabelManager fully integrated into RoomsManager
- [ ] Dual raycasting support: PickingService (room shells) + general interaction events
- [ ] Clean API: `showLabels()`, `hideLabels()`, `updateLabel(entityId, value)`
- [ ] Labels automatically positioned using room registry coordinates
- [ ] Room highlighting tied to picking/hover events
- [ ] Redundant standalone LabelManager usage removed from main.js
- [ ] Full test coverage for label + picking integration

## Architecture

### Current State
- **LabelManager** (standalone): Creates sprite/anchor labels from registry
- **RaycasterHandler** (standalone): General-purpose interaction system
- **PickingService** (integrated): Room-specific picking in RoomsManager
- **RoomsManager**: Orchestrates rooms but lacks label management

### Target State
```
RoomsManager {
  ├─ Room Registry (SVG source of truth)
  ├─ Extruded Geometry
  ├─ Picking Meshes
  ├─ PickingService (room selection)
  ├─ LabelManager (NEW - entity labels)
  └─ Event Integration (picking → label highlighting)
}
```

## Folder Structure
- `README.md` — Project overview, scope, success criteria
- `tasks.yaml` — Source of truth for the backlog
- `tasks.md` — Generated ledger (auto-generated)
- `sessions/` — Individual session logs
- `qa/` — QA checklists for testing

## Dependencies
- Three.js raycasting system
- Existing RoomsManager architecture
- LabelManager sprite generation
- Entity binding registry

## Stakeholders
- **Owner**: @KBLLR
- **Primary Users**: Smart Campus 3D application, HUD system, sensor dashboard

## Key Design Decisions
1. **Integration over Composition**: Labels managed directly by RoomsManager instead of external coordination
2. **Optional Label System**: Labels remain opt-in via config flag (`labelsEnabled: true`)
3. **Event-Driven Highlighting**: Room picking events trigger label intensity updates
4. **Dual Raycaster Support**: Keep PickingService for room selection, add general RaycasterHandler for broader interactions

## Best Practices
- Keep session logs for each implementation milestone
- Test both sprite-based and CSS-anchor label modes
- Verify disposal/cleanup of all label resources
- Maintain backward compatibility with existing room picking code

> Commit session logs alongside the code they describe to maintain an auditable history.
