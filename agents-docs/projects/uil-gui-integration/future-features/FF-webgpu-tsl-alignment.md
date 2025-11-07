# Future Feature — UIL + WebGPU/TSL Alignment

- **Why**: The renderer roadmap targets WebGPU + TSL adoption; UIL controls should remain the single source of truth for tuning lighting/post FX so we don't rewire panels when the renderer swaps.
- **What**:
  1. Expose renderer-agnostic bindings (e.g., tone-mapping exposure, sun shaders) through UIL descriptors.
  2. Add feature flags per renderer so the UI flips to WebGPU-specific controls (PMREM, compute shaders) only when available.
  3. Validate that UIL’s event loop plays nicely with WebGPU render cycles.
- **Dependencies**: WebGPU renderer project (controllers will need to import new helpers once WebGPU lands).
- **Next Step**: Sync with the WebGPU project to understand the upcoming public API before wiring advanced panels.
