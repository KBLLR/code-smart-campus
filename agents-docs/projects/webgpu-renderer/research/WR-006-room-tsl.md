# WR-006 — Room TSL Shader Notes (2025-11-07)

## Goals
- Replace the flat `MeshStandardMaterial` rooms with a TSL-driven node material that reacts to height + occupancy (future sensor data).
- Keep compatibility with the new WebGPU renderer while gracefully falling back to legacy materials when WebGPU is off.

## References / Research
- `three/tsl` entrypoint → gives access to node helpers such as `color`, `mix`, `smoothstep`, `positionWorld`, `uniform`, `float`.
- `MeshStandardNodeMaterial` exported from `three/webgpu` (see `node_modules/three/src/materials/nodes/MeshStandardNodeMaterial.js`).
- TSL gradients demo from Ready Player Me background concept (mirrored through `screenUV` mix in `Setup.setupBackground`).

## Implementation Snapshot
- New factory: `src/three/materials/RoomNodeMaterial.js`.
  - Builds a `MeshStandardNodeMaterial`.
  - Color pipeline: `mix(color(baseBottom), color(baseTop), clamp(positionWorld.y / gradientHeight))`.
  - Occupancy glow: `smoothstep(0, 1, occupancyUniform) * color(accent)` used for both additive color and emissive node.
  - Exposes `material.userData.roomShader.{ setOccupancy, setGradientHeight, setAccent }` for future real-time updates.
- `materialRegistry` now:
  - Imports the factory and, when `renderer.isWebGPURenderer`, creates node materials for `roomBase`.
  - Falls back to `MeshStandardMaterial` if WebGPU is unavailable or the factory throws.
  - Stores `roomKey` metadata on every tracked material.
- `RoundedBlockGenerator` passes `roomKey` to the registry so each node material knows which room it belongs to.
- `materialRegistry.init` skips PMREM generation for WebGPU renderers (raw HDR mapping only) to avoid WebGL-only code paths.

## Next Steps
- Feed live occupancy/telemetry into `roomShader.setOccupancy` (subscribe to HA updates + LabelManager).
- Add per-room accent overrides (e.g., categories, alerts) via `setAccent`.
- Extend the node graph with sensor overlays (noise masks, flashing edges) once we have real occupancy events.
