/** @typedef {import("@/types/uil.js").UILController} UILController */

const DEFAULT_CONFIG = {
  enabled: true,
  intensity: 100,
  distance: 50,
  angle: Math.PI / 6,
  penumbra: 1,
  decay: 2,
  focus: 1,
  position: { x: 0, y: 100, z: 0 },
  rotation: { x: -Math.PI / 3, y: 0, z: 0 },
  showHelper: false,
};

export async function registerProjectorControls({
  controller,
  projectorProvider,
}) {
  if (!controller || typeof projectorProvider !== "function") return;

  const getProjector = () => {
    try {
      return projectorProvider?.() ?? null;
    } catch {
      return null;
    }
  };

  const readConfig = () => {
    const projector = getProjector();
    if (!projector) return { ...DEFAULT_CONFIG };
    return {
      enabled: projector.config?.enabled ?? true,
      intensity: projector.config?.intensity ?? 100,
      distance: projector.config?.distance ?? 50,
      angle: projector.config?.angle ?? Math.PI / 6,
      penumbra: projector.config?.penumbra ?? 1,
      decay: projector.config?.decay ?? 2,
      focus: projector.config?.focus ?? 1,
      position: projector.config?.position ?? { x: 0, y: 100, z: 0 },
      rotation: projector.config?.rotation ?? {
        x: -Math.PI / 3,
        y: 0,
        z: 0,
      },
      showHelper: projector.helper !== null,
    };
  };

  const config = readConfig();

  await controller.registerModule({
    id: "projector",
    label: "Projector",
    open: false,
    controls: [
      // Visibility and Helpers
      {
        id: "projectorEnabled",
        label: "Visible",
        type: "bool",
        default: config.enabled,
        onChange: (value) => getProjector()?.setEnabled?.(value),
      },
      {
        id: "projectorShowHelper",
        label: "Show Helper",
        type: "bool",
        default: config.showHelper,
        onChange: (value) => {
          const projector = getProjector();
          if (!projector) return;
          if (value) {
            projector.createHelper?.();
          } else {
            projector.removeHelper?.();
          }
        },
      },

      // Light Properties
      {
        id: "projectorIntensity",
        label: "Intensity",
        type: "slider",
        min: 0,
        max: 500,
        step: 1,
        default: config.intensity,
        onChange: (value) => getProjector()?.setIntensity?.(value),
      },
      {
        id: "projectorDistance",
        label: "Distance",
        type: "slider",
        min: 1,
        max: 200,
        step: 1,
        default: config.distance,
        onChange: (value) => getProjector()?.setDistance?.(value),
      },

      // Projection Properties
      {
        id: "projectorAngle",
        label: "Angle (rad)",
        type: "slider",
        min: 0,
        max: Math.PI / 2,
        step: 0.01,
        default: config.angle,
        onChange: (value) => getProjector()?.setAngle?.(value),
      },
      {
        id: "projectorPenumbra",
        label: "Penumbra",
        type: "slider",
        min: 0,
        max: 1,
        step: 0.01,
        default: config.penumbra,
        onChange: (value) => getProjector()?.setPenumbra?.(value),
      },
      {
        id: "projectorDecay",
        label: "Decay",
        type: "slider",
        min: 1,
        max: 2,
        step: 0.01,
        default: config.decay,
        onChange: (value) => getProjector()?.setDecay?.(value),
      },
      {
        id: "projectorFocus",
        label: "Focus",
        type: "slider",
        min: 0,
        max: 1,
        step: 0.01,
        default: config.focus,
        onChange: (value) => getProjector()?.setFocus?.(value),
      },

      // Position Controls
      {
        id: "projectorPositionX",
        label: "Position X",
        type: "slider",
        min: -500,
        max: 500,
        step: 1,
        default: config.position.x,
        onChange: (value) => {
          const projector = getProjector();
          if (!projector) return;
          const pos = projector.config.position;
          projector.setPosition?.(value, pos.y, pos.z);
        },
      },
      {
        id: "projectorPositionY",
        label: "Position Y",
        type: "slider",
        min: 0,
        max: 300,
        step: 1,
        default: config.position.y,
        onChange: (value) => {
          const projector = getProjector();
          if (!projector) return;
          const pos = projector.config.position;
          projector.setPosition?.(pos.x, value, pos.z);
        },
      },
      {
        id: "projectorPositionZ",
        label: "Position Z",
        type: "slider",
        min: -500,
        max: 500,
        step: 1,
        default: config.position.z,
        onChange: (value) => {
          const projector = getProjector();
          if (!projector) return;
          const pos = projector.config.position;
          projector.setPosition?.(pos.x, pos.y, value);
        },
      },

      // Rotation Controls
      {
        id: "projectorRotationX",
        label: "Rotation X (rad)",
        type: "slider",
        min: -Math.PI,
        max: Math.PI,
        step: 0.01,
        default: config.rotation.x,
        onChange: (value) => {
          const projector = getProjector();
          if (!projector) return;
          const rot = projector.config.rotation;
          projector.setRotation?.(value, rot.y, rot.z);
        },
      },
      {
        id: "projectorRotationY",
        label: "Rotation Y (rad)",
        type: "slider",
        min: -Math.PI,
        max: Math.PI,
        step: 0.01,
        default: config.rotation.y,
        onChange: (value) => {
          const projector = getProjector();
          if (!projector) return;
          const rot = projector.config.rotation;
          projector.setRotation?.(rot.x, value, rot.z);
        },
      },
      {
        id: "projectorRotationZ",
        label: "Rotation Z (rad)",
        type: "slider",
        min: -Math.PI,
        max: Math.PI,
        step: 0.01,
        default: config.rotation.z,
        onChange: (value) => {
          const projector = getProjector();
          if (!projector) return;
          const rot = projector.config.rotation;
          projector.setRotation?.(rot.x, rot.y, value);
        },
      },
    ],
  });

  // Listen for projector-ready event to update controls
  window.addEventListener("projector-ready", () => {
    const cfg = readConfig();
    try {
      controller.updateControl("projector", "projectorEnabled", cfg.enabled, {
        silent: true,
      });
      controller.updateControl("projector", "projectorIntensity", cfg.intensity, {
        silent: true,
      });
      controller.updateControl("projector", "projectorDistance", cfg.distance, {
        silent: true,
      });
      controller.updateControl("projector", "projectorAngle", cfg.angle, {
        silent: true,
      });
      controller.updateControl("projector", "projectorPenumbra", cfg.penumbra, {
        silent: true,
      });
      controller.updateControl("projector", "projectorFocus", cfg.focus, {
        silent: true,
      });
    } catch (error) {
      console.warn("[ProjectorControls] Failed to update controls:", error);
    }
  });
}
