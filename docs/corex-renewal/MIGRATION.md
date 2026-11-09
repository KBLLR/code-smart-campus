# Porting to `KBLLR/code-smart-campus`

This handoff repo has one unrelated root commit (the snapshot). **Do not merge or rebase its history
into the canonical repo.** Port the reviewed changes as patches onto the canonical default branch.

## Steps (after David approves this PR)

1. In the canonical repo, branch from its actual default branch:
   `git switch -c codex/corex-campus-shell-<date> origin/main`.
2. Confirm the canonical tree still matches the snapshot base for the touched files
   (snapshot = local `6cfff00`, three commits ahead of remote `7218d82`). Push or reconcile those three
   commits first if they are still local-only.
3. From the handoff repo export the slice commits (everything after `e93012c`):
   `git format-patch e93012c..codex/corex-campus-shell-20261105 -o /tmp/sc-port`
   and apply in the canonical clone with `git am -3 /tmp/sc-port/*.patch`.
   Each commit is one slice (identity/state, lanes, scene, shell, docs) and can be applied or dropped independently, in order.
4. Resolve conflicts against any canonical drift; re-run `npm run check`, `npm run test:campus`,
   `npx tsc --noEmit`, `npx vite build`, then the local acceptance checklist.
5. Open a draft PR in `code-smart-campus`; after merge, update the Core-X root gitlink for
   `houses/smart-campus` in a separate Core-X PR (only to a commit reachable on the canonical remote).

## Files touched

New: `src/campus/*`, `src/lanes/corexLanes.js`, `src/scene/*`, `src/shell/*`, `src/styles/campus-shell.css`,
`src/styles/corex/*`, `tests/campus/*`, `docs/corex-renewal/*`.
Modified: `index.html`, `package.json` (scripts only), `src/main-minimal.js`, `src/core/CampusApp.js`,
`src/3d/core/{World,Renderer,CameraManager}.js`, `src/loaders/GLBLoader.js`,
`src/ui/spacejs/CampusPoint3DSystem.js`, `src/connectors/HomeAssistantConnector.js` (forwards timestamps),
`src/data/classrooms/classrooms-with-sensors.js` (adds `friendly_name`).
No dependency changes, no asset changes, no deletions.

## Warehouse proposal for `campus.glb` (not implemented)

- Register the original as a Warehouse item with provenance: source house `smart-campus`, path
  `public/models/campus.glb`, SHA-256 `e59a6e99…0598`, 5 080 188 bytes; Core-X `assets.index.json` already lists it as `ast_6d9eb34d`.
- Smart Campus would resolve the model through Warehouse resolve/stream (`warehouse-server`, via `corexLanes`)
  with the local file as the dev fallback, and record a receipt binding the house view to the item.
- No derivative model was needed for this slice (all presentation changes are runtime). Any future remodel
  gets a new filename (for example `campus.corex-v1.glb`) plus a provenance note naming the parent hash.
