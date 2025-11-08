# WebGPU Renderer Migration

## Project Charter
Deliver a staged migration of the Smart Campus 3D experience from the legacy WebGL renderer to Three.js’ WebGPU stack without regressing lighting, post-processing, or HUD overlays. The end result should unlock modern node-based shading, better performance on Apple Silicon/RTX hardware, and a cleaner path to advanced effects.

## Objectives & Outcomes
- Audit the current rendering pipeline (post-processing, materials, HUD) and document the WebGPU gaps.
- Replace WebGL-specific systems (EffectComposer, shadow maps, stats panel) with WebGPU-compatible alternatives or shims.
- Transition the campus experience entirely onto WebGPU, removing the legacy WebGL renderer once parity checks pass.
- Capture learnings and migration steps so future features (global illumination, GPU particles, on-device ML inference) can be layered on quickly.
- Research TSL shader techniques for room materials and lighting so the campus visuals are ready for WebGPU-first shading workflows.

## Stakeholders & Reviewers
- **Product / Vision**: David Caballero  
- **Rendering Lead**: Codex (renderer squad)  
- **3D Experience Consumers**: Scene/UI agents working in `src/`  
- **QA / Benchmarking**: Claude QA agent, Gemini perf harness

## Key Dependencies
- Three.js r0.181 WebGPU builds (`three/webgpu`, `three/tsl`)
- TSL shader graphs for room materials, sun/sky gradients, and future ML-driven effects
- Post-processing replacements (e.g. `postprocessing` WebGPU branch or custom TSL passes)
- HUD and overlay managers (`CSSHudManager`, label registries)
- Build tooling updates (Vite config, lint allowances for TSL syntax)

## Artifacts
- Task backlog: `tasks.md`
- Session logs: `sessions/`
- QA playbooks: `qa/`
- Future ideas: `future-features/`
