# Scene Factory Branching Strategy
## Parallel Development Approach

**Created:** 2025-11-11
**Decision Date:** After T-07 Session Review
**Status:** Active Strategy

---

## Overview

Rather than force scene switching integration now (which would require major refactoring and risk breaking existing features), we pursue **parallel independent development** of scenes in separate branches.

Each scene is refined independently, then integrated when the architecture refactor is complete.

---

## Branch Structure

### Production Branch

**`main`** (production)
- ✅ Geospatial scene (primary view)
- ✅ Scene switcher UI (placeholder buttons)
- ✅ All infrastructure complete
- ✅ Build passing, zero errors
- ✅ App fully functional

**Status:** Ready for next projects (T-09 onwards)
**Maintenance:** Bug fixes, geospatial refinements only

---

### Independent Scene Development

**`feature/scene-backdrop`** (independent)
- **Purpose:** Develop backdrop scene independently
- **Starting Point:** Copy from main (all infrastructure included)
- **Work:** Refinements, optimizations, testing
- **Target:** Production-ready backdrop scene
- **Integration:** Ready for T-10 (scene switching refactor)
- **Isolation:** Changes don't affect main branch

**Suggested Improvements:**
- Enhance tone mapping controls
- Add more sky animation options
- Optimize area light rendering
- Test WebGPU-specific features

---

**`feature/scene-projector`** (independent)
- **Purpose:** Develop projector light scene independently
- **Starting Point:** Copy from main (all infrastructure included)
- **Work:** Refinements, optimizations, testing
- **Target:** Production-ready projector scene
- **Integration:** Ready for T-10 (scene switching refactor)
- **Isolation:** Changes don't affect main branch

**Suggested Improvements:**
- Enhance shadow quality
- Add canvas material texture controls
- Optimize spotlight rendering
- Test projection mapping workflows

---

### Research/Exploration Branch

**`feat/scene-knob-lab`** (research)
- **Purpose:** Explore scene knob feature feasibility
- **Status:** Spike/research in progress
- **Timeline:** Parallel to main development
- **Integration:** If viable, becomes feature in future release

---

## Development Workflow

### For Main Branch

```
1. Start: git checkout main
2. Work: Continue geospatial refinements
3. Test: Verify build passing
4. Commit: Normal workflow
5. Goal: Finalize geospatial view + app preparations
```

**Task Focus:** T-09 (memory safety, app prep)

---

### For Scene:Backdrop Branch

```
1. Start:  git checkout feature/scene-backdrop
2. Work:   Backdrop scene improvements
3. Test:   Verify scene rendering correctly
4. Commit: Document improvements with messages
5. Review: Track against acceptance criteria
6. Goal:   Production-ready backdrop variant
```

**Acceptance Criteria:**
- ✅ All UI controls working
- ✅ Rendering smooth at 60+ FPS
- ✅ Memory usage reasonable
- ✅ Visual quality consistent
- ✅ No regressions from main

---

### For Scene:Projector Branch

```
1. Start:  git checkout feature/scene-projector
2. Work:   Projector scene improvements
3. Test:   Verify projection mapping ready
4. Commit: Document improvements with messages
5. Review: Track against acceptance criteria
6. Goal:   Production-ready projector variant
```

**Acceptance Criteria:**
- ✅ Canvas materials render correctly
- ✅ Spotlight shadows working
- ✅ Projection-ready geometry
- ✅ Performance optimized
- ✅ No regressions from main

---

## Future Integration Path (T-10)

When ready to integrate multi-scene switching:

### Step 1: Create Integration Branch
```bash
git checkout main
git checkout -b "feature/scene-integration"
```

### Step 2: Major Refactoring
- Consolidate `src/scene.js` with SceneFactory
- Unify camera/controls system
- Dynamically rewire UI panels
- Integrate post-processing
- Test scene switching

### Step 3: Merge Scene Variants
- Cherry-pick backdrop improvements from `feature/scene-backdrop`
- Cherry-pick projector improvements from `feature/scene-projector`
- Resolve any conflicts
- Test all scenes together

### Step 4: Deploy to Main
```bash
git checkout main
git merge feature/scene-integration
```

---

## Concurrent Development Guidelines

### Branch Isolation

Each branch is **completely independent**:
- Can work on backdrop without affecting main
- Can work on projector without affecting main
- Changes stay local until intentional merge
- No blocking between branches

### Keeping Branches Fresh

Periodically sync with main to avoid divergence:

```bash
# In feature/scene-backdrop
git fetch origin
git merge main  # Pick up any main improvements

# Resolve conflicts if any
# Test to ensure no regressions
```

**Frequency:** Weekly or after major main updates

### Merging to Main

Only merge when:
- ✅ Code review approved
- ✅ Tests passing
- ✅ No conflicts
- ✅ Aligned with architecture

```bash
git checkout main
git pull origin main
git merge feature/scene-backdrop
git push origin main
```

---

## Timeline & Priorities

### Immediate (This Week)

1. **main branch**
   - ⏳ Finish geospatial refinements
   - ⏳ Prepare for T-09
   - ✅ Scene switcher UI stable

2. **feature/scene-backdrop**
   - ⏳ Create initial improvements
   - ⏳ Document findings
   - ⏳ Track against acceptance criteria

3. **feature/scene-projector**
   - ⏳ Create initial improvements
   - ⏳ Document findings
   - ⏳ Track against acceptance criteria

### Medium Term (Next 2 Weeks)

1. Complete scene refinements
2. Acceptance criteria validation
3. Performance profiling
4. Memory profiling

### Long Term (Future)

1. T-10: Major refactor for integration
2. Merge scene variants into main
3. Enable multi-scene switching
4. Full app with scene switching

---

## Preventing Common Issues

### Merge Conflicts

**Minimize by:**
- Keeping changes focused and small
- Regularly syncing with main
- Clear commit messages
- Communication between developers

**Resolve by:**
- Review both versions
- Test after resolution
- Verify no regressions

### Divergence

**Monitor by:**
- Tracking commits behind main
- Regular manual reviews
- Scheduled sync points

**Handle by:**
- Periodic merges from main
- Rebase if getting too far behind
- Communication with team

### Performance Regressions

**Prevent by:**
- Baseline performance metrics
- Compare before/after
- Profile memory usage
- Test at target FPS

---

## Documentation & Tracking

### Branch-Specific Docs

Each branch should maintain:
- **README.md** - Changes specific to this scene
- **IMPROVEMENTS.md** - List of enhancements
- **PERFORMANCE.md** - Benchmarks and metrics
- **KNOWN_ISSUES.md** - Any blockers

### Commit Messages

Use clear, descriptive messages:

```
feat: backdrop - enhance tone mapping controls

Add sliders for shadow/midtone/highlight adjustment.
Improves visual customization and scene mood control.

Performance: No impact
Memory: No change
```

### Progress Tracking

Update scene acceptance criteria as you go:

```markdown
## feature/scene-backdrop Acceptance Criteria

- [x] UI controls working
- [x] Rendering smooth at 60+ FPS
- [ ] Memory usage optimized
- [x] Visual quality consistent
- [ ] Integration ready
```

---

## Communication Points

### Daily Standup
- What scene are you working on?
- Any blockers or conflicts?
- Any insights from other branches?

### Weekly Review
- Compare progress across branches
- Identify common improvements
- Discuss integration timeline

### Before Merging
- Request review from team
- Run full test suite
- Verify build passing
- Get approval before merge

---

## Rollback Plan

If a branch needs to restart:

```bash
# Save work (if needed)
git branch backup/scene-backdrop

# Reset to main state
git checkout feature/scene-backdrop
git reset --hard main

# Restart with clean slate
```

---

## Success Criteria

### Branch Strategy Success

✅ Main branch remains stable and deployable
✅ Each scene branch has clear improvements
✅ No merge conflicts or blocking issues
✅ Clear integration path when T-10 begins
✅ All branches building and passing tests
✅ Performance metrics tracked
✅ Team communication clear

---

## Related Documentation

- `SESSION-2025-11-11-EVENING-SCENE-SWITCHER.md` - Architectural review
- `tasks.md` - Task status and timeline
- `SCENE-KNOB-LAB.md` - Research spike status
- Build logs: `npm run build` outputs

---

**Status:** Active
**Last Updated:** 2025-11-11
**Approver:** David Caballero
**Maintainer:** Claude Code
