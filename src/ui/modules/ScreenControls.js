/** @typedef {import("@/types/uil.js").UILController} UILController */

const POSITION_RANGE = 400;
const RATIO_OPTIONS = ["16:9", "9:16", "1:1", "3:2", "2:3"];

const DEFAULT_CONFIG = {
  enabled: true,
  ratio: "16:9",
  position: { x: 0, z: 0 },
};

export async function registerScreenControls({
  controller,
  screenProvider,
}) {
  if (!controller || typeof screenProvider !== "function") return;

  const getScreen = () => {
    try {
      return screenProvider?.() ?? null;
    } catch {
      return null;
    }
  };

  const readConfig = () => {
    const screen = getScreen();
    if (!screen) return { ...DEFAULT_CONFIG };
    return {
      enabled: screen.config?.enabled ?? true,
      ratio: screen.config?.ratio ?? "16:9",
      position: screen.config?.position ?? { x: 0, z: 0 },
    };
  };

  const config = readConfig();

  const record = await controller.registerModule({
    id: "screen",
    label: "Screen",
    open: false,
    controls: [
      {
        id: "screenEnabled",
        label: "Visible",
        type: "bool",
        default: config.enabled,
        onChange: (value) => getScreen()?.setEnabled?.(value),
      },
      {
        id: "screenRatio",
        label: "Ratio",
        type: "list",
        options: RATIO_OPTIONS.reduce((acc, ratio) => {
          acc[ratio] = ratio;
          return acc;
        }, {}),
        default: config.ratio,
        onChange: (value) => getScreen()?.setRatioPreset?.(value),
      },
      {
        id: "screenPosition",
        label: "Position",
        type: "joystick",
        default: [
          config.position.x / POSITION_RANGE,
          config.position.z / POSITION_RANGE,
        ],
        onChange: (value) => {
          const screen = getScreen();
          if (!screen || !value) return;
          const [x, y] = Array.isArray(value)
            ? value
            : [value.x ?? 0, value.y ?? 0];
          screen.setPosition?.(x * POSITION_RANGE, y * POSITION_RANGE);
        },
      },
    ],
  });

  try {
    const ratioCtrl = record?.controls?.get("screenRatio")?.pane?.c?.[0];
    if (ratioCtrl) {
      ratioCtrl.style.minWidth = "220px";
    }
    const joystickPane = record?.controls?.get("screenPosition")?.pane?.c?.[0];
    if (joystickPane) {
      joystickPane.style.width = "100%";
      joystickPane.style.marginTop = "8px";
    }
  } catch (error) {
    console.warn("[ScreenControls] Failed to style controls:", error);
  }

  window.addEventListener("screen-ready", () => {
    const cfg = readConfig();
    controller.updateControl("screen", "screenEnabled", cfg.enabled, {
      silent: true,
    });
    controller.updateControl("screen", "screenRatio", cfg.ratio, {
      silent: true,
    });
    controller.updateControl(
      "screen",
      "screenPosition",
      [
        cfg.position.x / POSITION_RANGE,
        cfg.position.z / POSITION_RANGE,
      ],
      { silent: true },
    );
  });
}
