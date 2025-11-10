const DEFAULT_CAPABILITIES = Object.freeze({
  renderer: {
    type: "webgl",
    webgl: true,
    webgpu: false,
  },
  postProcessing: {
    supported: false,
    snapshots: false,
  },
  screen: {
    supported: false,
    mode: null,
  },
  projector: {
    supported: false,
    mode: null,
  },
  hud: {
    supported: false,
  },
  stats: {
    supported: false,
  },
  reflections: {
    pmrem: true,
  },
});

/**
 * Create a normalized capability snapshot for the current scene/runtime.
 * @param {{ usingWebGPU?: boolean, hasPostFX?: boolean, supportsSnapshots?: boolean, hasScreen?: boolean, screenMode?: string|null, hasProjector?: boolean, projectorMode?: string|null, hudReady?: boolean, statsReady?: boolean }} [options]
 */
export function buildCapabilitiesSnapshot({
  usingWebGPU = false,
  hasPostFX = false,
  supportsSnapshots = false,
  hasScreen = false,
  screenMode = null,
  hasProjector = false,
  projectorMode = null,
  hudReady = false,
  statsReady = false,
} = {}) {
  return {
    renderer: {
      type: usingWebGPU ? "webgpu" : "webgl",
      webgpu: Boolean(usingWebGPU),
      webgl: !usingWebGPU,
    },
    postProcessing: {
      supported: Boolean(hasPostFX),
      snapshots: Boolean(hasPostFX && supportsSnapshots),
    },
    screen: {
      supported: Boolean(hasScreen),
      mode: hasScreen ? screenMode || (usingWebGPU ? "webgpu" : "webgl") : null,
    },
    projector: {
      supported: Boolean(hasProjector),
      mode: hasProjector ? projectorMode || (usingWebGPU ? "webgpu" : "webgl") : null,
    },
    hud: {
      supported: Boolean(hudReady),
    },
    stats: {
      supported: Boolean(statsReady),
    },
    reflections: {
      pmrem: !usingWebGPU,
    },
  };
}

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function mergeSnapshots(base, patch) {
  const output = { ...base };
  Object.entries(patch || {}).forEach(([key, value]) => {
    if (isObject(value)) {
      output[key] = { ...(base[key] || {}), ...value };
    } else {
      output[key] = value;
    }
  });
  return output;
}

/**
 * Assigns a snapshot onto the scene userData.
 * @param {THREE.Scene} scene
 * @param {ReturnType<typeof buildCapabilitiesSnapshot>} snapshot
 */
export function setSceneCapabilities(scene, snapshot) {
  if (!scene) throw new Error("[capabilities] scene is required");
  scene.userData.capabilities = snapshot
    ? { ...snapshot }
    : { ...DEFAULT_CAPABILITIES };
  return scene.userData.capabilities;
}

/**
 * Applies a deep (shallow-per-branch) merge to the capabilities object.
 * @param {THREE.Scene} scene
 * @param {object} patch
 */
export function updateSceneCapabilities(scene, patch) {
  if (!scene) throw new Error("[capabilities] scene is required");
  const current =
    scene.userData.capabilities || { ...DEFAULT_CAPABILITIES };
  const merged = mergeSnapshots(current, patch);
  scene.userData.capabilities = merged;
  return merged;
}
