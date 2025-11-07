import { UILController } from "@ui/UILController.js";

/**
 * Registers lighting/post FX controls.
 * @param {{ controller: UILController, postFX: { config: object, setEnabled: Function, setBloomSettings: Function }, setup: import("@/Setup.js").default }} params
 */
export async function registerLightingControls({
  controller,
  postFX,
  setup,
}) {
  if (!controller) throw new Error("[LightingControls] controller is required");
  if (!postFX) {
    console.warn("[LightingControls] postFX controls unavailable.");
  }

  await controller.registerModule({
    id: "lighting",
    label: "Lighting / FX",
    controls: [
      {
        id: "postfxEnabled",
        label: "Bloom Enabled",
        type: "bool",
        default: postFX?.config?.enabled ?? true,
        onChange: (value) => postFX?.setEnabled?.(value),
        bindings: {
          get: () => postFX?.config?.enabled ?? true,
        },
      },
      {
        id: "bloomStrength",
        label: "Bloom Strength",
        type: "knob",
        min: 0,
        max: 2,
        step: 0.05,
        default: postFX?.config?.bloomStrength ?? 0.75,
        onChange: (value) =>
          postFX?.setBloomSettings?.({ strength: value }),
        bindings: {
          get: () => postFX?.config?.bloomStrength ?? 0.75,
        },
      },
      {
        id: "bloomRadius",
        label: "Bloom Radius",
        type: "knob",
        min: 0,
        max: 1.5,
        step: 0.05,
        default: postFX?.config?.bloomRadius ?? 0.85,
        onChange: (value) => postFX?.setBloomSettings?.({ radius: value }),
        bindings: {
          get: () => postFX?.config?.bloomRadius ?? 0.85,
        },
      },
      {
        id: "bloomThreshold",
        label: "Bloom Threshold",
        type: "slide",
        min: 0,
        max: 1,
        step: 0.02,
        default: postFX?.config?.bloomThreshold ?? 0.6,
        onChange: (value) =>
          postFX?.setBloomSettings?.({ threshold: value }),
        bindings: {
          get: () => postFX?.config?.bloomThreshold ?? 0.6,
        },
      },
      {
        id: "resetBloom",
        label: "Reset FX",
        type: "button",
        onChange: () => {
          postFX?.setEnabled?.(true);
          postFX?.setBloomSettings?.({
            strength: 0.75,
            radius: 0.85,
            threshold: 0.6,
          });
        },
      },
    ],
  });
}
