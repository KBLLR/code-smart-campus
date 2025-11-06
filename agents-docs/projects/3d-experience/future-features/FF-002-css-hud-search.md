# Future Feature Spec

## Title
CSS HUD Search & Occlusion

## Context & Motivation
- HUD labels now surface category badges and pointer interactions, but large deployments will overwhelm the viewport.
- Operators need a quick way to search/filter sensors (by name, room, status) without diving into the old panel modal.
- DOM labels remain visible even when anchors sit behind geometry; a depth-aware fade improves legibility and reduces clutter.

## Desired Outcome
- A search input (or hotkey-triggered palette) filters HUD labels in real time based on entity name, room, or category.
- Optional toggles hide labels whose anchors fall outside the camera frustum or are occluded by major geometry.
- Results integrate with the existing selection pipeline (focus camera, highlight room, sync dashboard).

## Requirements & Constraints
- Search should run on the client with minimal cost (<1 ms for a few hundred labels) and operate on the same registry used by `CSSHudManager`.
- Occlusion logic should piggyback on existing raycast utilities; keep the fallback lightweight (e.g., dot-product or depth buffer sampling).
- All controls must respect the “glass” UI theme and remain keyboard-accessible.

## Technical Sketch
- Expose a `filterLabels(predicate)` method on `CSSHudManager` that toggles the `hud-label--hidden` class.
- Build a small search controller that indexes `cleanedLabelRegistry` and emits filter predicates to the manager.
- For occlusion: reuse `LabelLayoutManager` bounds/raycast helpers to compute visibility and push hide/show updates every frame (throttle via RAF).
- Surface search + occlusion toggles inside UIL once FE-120 ships; add a toolbar shortcut in the interim.

## Dependencies
- FE-103 HUD pipeline (anchors, badges, selection syncing).
- FE-120 UIL migration to host the control surface.
- Raycast/selection utilities from FE-104 once implemented (for occlusion accuracy).

## Risks & Open Questions
- Continuous depth testing may hurt performance on low-end devices—should we cap to one test every N frames?
- Do we need to cache search results per category to avoid repeated string comparisons?
- How do we surface “no results” when labels are filtered but selection persists?

## Integration Plan
- Prototype search box triggered by `/` hotkey; gather feedback in sessions.
- Add occlusion checkbox next to HUD debug controls (temporary Tweakpane slot) before UIL switch.
- Update docs (`css-hud-plan.md`) with usage notes and extend FE-103 acceptance criteria accordingly.

## Status
- Current state: idea
- Last reviewed: 2025-11-04
