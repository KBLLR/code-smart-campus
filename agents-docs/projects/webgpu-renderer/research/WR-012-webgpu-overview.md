# WR-012 — WebGPU Fundamentals Research

## 1. What WebGPU Is
- **API family**: WebGPU is the W3C standard (2023 CR / 2024 Rec) that exposes a modern, low-overhead GPU API to browsers. It draws inspiration from Vulkan, Metal, and Direct3D 12, mapping closely to command buffers, pipelines, and bind groups.
- **Execution model**: Everything is explicit: you build `GPUDevice` objects, allocate buffers/textures, describe pipelines (graphics or compute), and submit command buffers to a `GPUQueue`. Shaders are authored in WGSL (WebGPU Shading Language), a memory-safe language designed to be compiled efficiently to native backends.
- **Browser support**: As of late 2025, Chrome 123+, Edge 123+, Safari 17+, and Firefox Nightly expose WebGPU by default (with platform coverage tied to Metal/Vulkan/D3D12 availability). Progressive enhancement is still required for older browsers.

## 2. Problems WebGPU Solves
- **Performance / latency**: WebGL’s GL ES 2/3 heritage requires the driver to guess intent, causing validation overhead and CPU bottlenecks. WebGPU gives direct control over command buffers and avoids implicit state, enabling multi-threaded recording and lower CPU cost.
- **Compute & ML**: WebGL has limited compute capability (via fragment tricks). WebGPU ships first-class compute shaders (WGSL) and storage buffers, unlocking on-device ML inference, physics, and data-parallel workloads.
- **Modern features**: WebGPU exposes bind groups, pipeline state objects, and more advanced texture formats (e.g., 16-bit float targets, storage textures) that are difficult/impossible in WebGL. That is crucial for HDR pipelines, clustered lighting, and temporal reprojection.
- **Security & portability**: WGSL is validated and sandboxed by design; drivers cannot execute arbitrary bytecode. This reduces attack surface while still mapping to Metal/Vulkan/D3D12 under the hood.

## 3. Implications for Smart Campus
| Requirement | How WebGPU Helps | Notes |
|-------------|------------------|-------|
| High-res 3D campus + heavy UI overlays | Explicit resource control keeps CPU cost predictable so we can keep 60 FPS while HUD + WebGPU projector run | Need to batch uploads via staging buffers and reuse pipelines. |
| Real-time sensor shading / ML predictions | Compute shaders let us run occupancy inference (WR-007) or projectors without round-tripping to WASM/CPU | WGSL compute pipeline can read sensor buffers + write cluster heatmaps. |
| HDR lighting / PMREM replacements | Storage textures + float render targets are available without WebGL extensions | Need to replace EffectComposer with node-based or custom pass for WebGPU. |
| Security posture (enterprise campus) | WGSL validation + explicit sandboxing helps with auditing | Provide fallbacks for browsers that disable WebGPU. |

## 4. Migration Considerations
1. **Feature detection**: Use `if (navigator.gpu)` + capability flags (already started in `scene.userData.capabilities`). Provide WebGL fallback for unsupported browsers.
2. **Shader tooling**: Adopt WGSL or Three’s TSL nodes that compile to WGSL when `renderer.isWebGPURenderer`. Avoid inline GLSL.
3. **Resource lifetime**: Release GPUBuffer/GPUTexture resources explicitly (`.destroy()`), especially for sensor-provided geometry or projector atlases, to prevent leaks.
4. **Threading**: Consider using workers to build command buffers once WR-003 matures; WebGPU allows creation of `GPUDevice` on worker threads for CPU-bound tasks.
5. **Validation layers**: During development, keep Chrome’s `chrome://flags/#enable-unsafe-webgpu` telemetry off and use `navigator.gpu.requestAdapter({ powerPreference: "high-performance" })` for consistent perf numbers.

## 5. Next Steps
- Finish WR-003 bootstrap so the renderer can actually use WebGPURenderer in production toggles.
- Feed learnings into WR-007 (compute ML) and WR-008/009 (projector) since compute + storage textures are central there.
