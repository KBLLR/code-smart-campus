import * as THREE from "three";
import { WebGPURenderer } from "three/webgpu";

const hasNavigator =
  typeof navigator !== "undefined" && typeof navigator.gpu !== "undefined";

function normalizeMode(mode) {
  if (!mode) return "off";
  return String(mode).toLowerCase();
}

export function createRenderer({
  canvas,
  preferWebGPU = false,
  webGPUOnly = false,
} = {}) {
  if (!canvas) {
    throw new Error("[RendererFactory] Canvas element is required.");
  }

  let renderer = null;
  let usingWebGPU = false;
  let initPromise = Promise.resolve();

  const attemptWebGPU = preferWebGPU && hasNavigator;

  if (attemptWebGPU) {
    try {
      renderer = new WebGPURenderer({
        canvas,
        antialias: true,
      });
      usingWebGPU = true;
      console.info("[RendererFactory] WebGPU renderer created (experimental).");
      initPromise = Promise.resolve(renderer.init?.()).catch((error) => {
        console.error("[RendererFactory] WebGPU init failed:", error);
        if (webGPUOnly) {
          throw error;
        }
      });
    } catch (error) {
      console.warn(
        "[RendererFactory] Failed to construct WebGPU renderer, falling back to WebGL.",
        error,
      );
      renderer = null;
      usingWebGPU = false;
    }
  }

  if (!renderer) {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    console.info("[RendererFactory] Using WebGL renderer.");
  }

  return {
    renderer,
    usingWebGPU,
    initPromise,
  };
}

export function shouldPreferWebGPU(mode) {
  const normalized = normalizeMode(mode);
  if (normalized === "force") return true;
  if (normalized === "prefer") return hasNavigator;
  return false;
}
