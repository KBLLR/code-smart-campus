import * as THREE from "three";

const POSITION_RANGE = 400;

const DEFAULT_CONFIG = {
  enabled: false,
  intensity: 30,
  distance: 650,
  angleDeg: 30,
  penumbra: 0.25,
  aspect: 1,
  helper: true,
  position: { x: 0, z: 0 },
};

/**
 * @param {{ controller: import("@ui/UILController.js").UILController, projectorProvider: () => any }} params
 */
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

  const toDegrees = (rad) => THREE.MathUtils.radToDeg(rad ?? 0);

  const readConfig = () => {
    const projector = getProjector();
    if (!projector) return { ...DEFAULT_CONFIG };
    return {
      enabled: projector.config?.enabled ?? true,
      intensity: projector.config?.intensity ?? projector.light.intensity,
      distance: projector.config?.distance ?? projector.light.distance,
      angleDeg:
        projector.config?.angleDeg ?? toDegrees(projector.light.angle ?? 0.5),
      penumbra: projector.config?.penumbra ?? projector.light.penumbra,
      aspect:
        projector.config?.aspect ??
        projector.light.aspect ??
        (projector.light.map?.image?.width || 1) /
          (projector.light.map?.image?.height || 1),
      helper: projector.config?.helper ?? true,
      position: projector.config?.position ?? { x: 0, z: 0 },
    };
  };

  const config = readConfig();

  const record = await controller.registerModule({
    id: "projector",
    label: "Projector",
    open: false,
    controls: [
      {
        id: "projectorEnabled",
        label: "Enabled",
        type: "bool",
        default: config.enabled,
        onChange: (value) => {
          const projector = getProjector();
          if (!projector) return;
          projector.setEnabled?.(value);
        },
      },
      {
        id: "intensity",
        label: "Intensity",
        type: "slide",
        min: 0,
        max: 120,
        step: 1,
        default: config.intensity,
        onChange: (value) => {
          const projector = getProjector();
          if (!projector) return;
          projector.setIntensity?.(value);
        },
      },
      {
        id: "distance",
        label: "Distance",
        type: "slide",
        min: 50,
        max: 1500,
        step: 10,
        default: config.distance,
        onChange: (value) => {
          const projector = getProjector();
          if (!projector) return;
          projector.setDistance?.(value);
        },
      },
      {
        id: "angle",
        label: "Angle (deg)",
        type: "knob",
        params: { w: 110, h: 110 },
        min: 5,
        max: 80,
        step: 1,
        default: config.angleDeg,
        onChange: (value) => {
          const projector = getProjector();
          if (!projector) return;
          projector.setAngle?.(value);
        },
      },
      {
        id: "penumbra",
        label: "Penumbra",
        type: "knob",
        params: { w: 110, h: 110 },
        min: 0,
        max: 1,
        step: 0.01,
        default: config.penumbra,
        onChange: (value) => {
          const projector = getProjector();
          if (!projector) return;
          projector.setPenumbra?.(value);
        },
      },
      {
        id: "aspect",
        label: "Aspect Ratio",
        type: "slide",
        min: 0.5,
        max: 2.5,
        step: 0.05,
        default: config.aspect,
        onChange: (value) => {
          const projector = getProjector();
          if (!projector) return;
          projector.setAspect?.(value);
        },
      },
      {
        id: "positionXY",
        label: "Position",
        type: "joystick",
        default: [
          config.position.x / POSITION_RANGE,
          config.position.z / POSITION_RANGE,
        ],
        onChange: (value) => {
          const projector = getProjector();
          if (!projector || !value) return;
          const [x, y] = Array.isArray(value)
            ? value
            : [value.x ?? 0, value.y ?? 0];
          projector.setPosition?.(
            x * POSITION_RANGE,
            y * POSITION_RANGE,
          );
        },
      },
      {
        id: "helperVisible",
        label: "Show Helper",
        type: "bool",
        default: config.helper,
        onChange: (value) => {
          const projector = getProjector();
          if (!projector) return;
          projector.setHelperVisible?.(value);
        },
      },
    ],
  });

  console.info("[UIL] Projector controls registered (waiting for light).");

  try {
    const knobRow = ["angle", "penumbra", "aspect"];
    knobRow.forEach((id, index) => {
      const ctrlRecord = record?.controls?.get(id);
      const paneRoot = ctrlRecord?.pane?.c?.[0];
      if (paneRoot) {
        paneRoot.style.display = "inline-block";
        paneRoot.style.width = "calc(33% - 8px)";
        paneRoot.style.marginRight =
          index === knobRow.length - 1 ? "0" : "8px";
        paneRoot.style.verticalAlign = "top";
      }
    });
  } catch (error) {
    console.warn("[ProjectorControls] Failed to style knob row:", error);
  }

  try {
    const joystickPane = record?.controls?.get("positionXY")?.pane?.c?.[0];
    if (joystickPane) {
      joystickPane.style.width = "100%";
      joystickPane.style.marginTop = "8px";
    }
  } catch (error) {
    console.warn("[ProjectorControls] Failed to style joystick:", error);
  }

  window.addEventListener("projector-ready", () => {
    const cfg = readConfig();
    controller.updateControl("projector", "projectorEnabled", cfg.enabled, {
      silent: true,
    });
    controller.updateControl("projector", "intensity", cfg.intensity, {
      silent: true,
    });
    controller.updateControl("projector", "distance", cfg.distance, {
      silent: true,
    });
    controller.updateControl("projector", "angle", cfg.angleDeg, {
      silent: true,
    });
    controller.updateControl("projector", "penumbra", cfg.penumbra, {
      silent: true,
    });
    controller.updateControl("projector", "aspect", cfg.aspect, {
      silent: true,
    });
    controller.updateControl("projector", "helperVisible", cfg.helper, {
      silent: true,
    });
    controller.updateControl(
      "projector",
      "positionXY",
      [
        cfg.position.x / POSITION_RANGE,
        cfg.position.z / POSITION_RANGE,
      ],
      { silent: true },
    );
  });
}
