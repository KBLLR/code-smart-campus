# WR-013 — TSL & Three.js r181 Materials Research

## 1. TSL (Three Shader Language) Overview
- Introduced in r150+ and stabilized across r180/r181. It wraps node-based materials so code can target both WebGL and WebGPU via Three’s node pipeline.
- **WGSL path**: When using `WebGPURenderer`, TSL graphs compile to WGSL automatically; no need to author raw WGSL unless we need features outside the node graph.
- **Key benefits**:
  - Node graph ensures shader chunks remain portable between renderers.
  - Built-in nodes cover lighting (Lambert/Phong/Physical), math, textures, triplanar mapping, signed distance fields, etc.
  - Supports `MaterialX`-style layering (via `LayeredMaterial` / `NodeMaterial`).

## 2. Material Types & WebGPU Compatibility (r181)
| Material | WebGPU Support | Notes |
|----------|----------------|-------|
| `MeshStandardMaterial` + NodeMaterial (`MeshStandardNodeMaterial`) | ✅ | Works via node pipeline; ideal for physically-based room surfaces.
| `MeshPhysicalNodeMaterial` | ✅ | Required for clearcoat/transmission; more expensive.
| `MeshBasicNodeMaterial` / `SpriteNodeMaterial` | ✅ | Useful for HUD billboards.
| `ShaderMaterial` (raw GLSL) | ⚠️ | Not compatible unless rewritten in TSL or WGSL; current issues logged in repo when using custom GLSL with WebGPURenderer.
| `MeshDepthMaterial` / `MeshDistanceMaterial` | ✅ via nodes | Ensure TSL graph uses `depth`/`distance` nodes.
| `LineMaterial` from `three/examples/jsm/lines` | ⚠️ needs node port | Example relies on WebGL-specific extensions.

## 3. TSL Patterns for Smart Campus
- **Room gradients / trims** (WR-006): Use `mix( colorA, colorB, smoothstep(...) )` nodes with `worldPosition` to compute vertical fades. Works identically in WebGL/WebGPU.
- **Sensor overlays**: Build a `TextureNode` sampling from an instanced atlas; pass sensor data via `InstancedBufferAttribute` -> `AttributeNode`. Use `NodeUniform` for dynamic values to avoid shader recompiles.
- **Projector materials** (WR-008/009): Define a node material that samples a projector texture using a custom UV transform node. WebGPU path can rely on storage buffers to feed projector matrices once WR-009 lands.

## 4. Limitations / Pitfalls (r181)
1. **ShaderMaterial compatibility**: Any existing custom GLSL (e.g., `SunSkyDome`, custom fog) must be rewritten in TSL or WGSL. WebGPURenderer throws `THREE.NodeMaterial` errors otherwise.
2. **Derivatives & discard**: WGSL forbids implicit derivatives with non-uniform control flow. Use `fwidth` nodes carefully and avoid `discard` (use alpha clip nodes).
3. **Texture formats**: WebGPU requires explicit formats; node materials must specify `texture.format`. Some legacy `RGBE` loaders need conversion to `RGBA16F` or use HDRLoader + PMREM.
4. **Uniform updates**: Node graphs compile once; dynamic uniforms should use `NodeUniform` or `uniformGroup` so WebGPU can bind them via bind groups. Avoid per-frame material recompiles.
5. **Lighting**: TSL physical materials rely on `WebGPURenderer`’s `LightingNodeBuilder`. Custom lighting must be composed with node functions, not inline GLSL.

## 5. Recommendations
- Standardize on NodeMaterial wrappers (`MeshStandardNodeMaterial` for rooms, custom NodeMaterial for projector/labels). Keep WebGL fallbacks by reusing the same node graphs.
- For legacy materials (`ShaderMaterial`), create TSL equivalents incrementally. Start with the sun/sky dome, fog, and projector code since they block WebGPU adoption.
- Document uniform/attribute naming so compute shaders (WR-007) can write into the same buffers; TSL can read from `StorageBufferNode` once WebGPU renderer support ships (currently in three@dev branch).

## 6. Next Steps
- Port remaining GLSL materials to TSL (track under WR-006 / new subtasks).
- Build a NodeMaterial library (`src/three/materials/*.js`) with WebGPU-safe defaults (gamma-corrected colors, linear blending, sensor data attributes).
