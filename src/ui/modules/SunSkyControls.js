import { UILController } from "@ui/UILController.js";

const paletteSlots = [
  { slot: "dawn", prop: "horizon", label: "Dawn Horizon" },
  { slot: "day", prop: "horizon", label: "Day Horizon" },
  { slot: "dusk", prop: "horizon", label: "Dusk Horizon" },
  { slot: "night", prop: "horizon", label: "Night Horizon" },
  { slot: "day", prop: "glow", label: "Glow Color" },
];

/**
 * Registers sun/sky controls (palette + arc opacity).
 * @param {{ controller: UILController, sunDebug: { config: any, apply: Function, reset: Function } }} params
 */
export async function registerSunSkyControls({ controller, sunDebug }) {
  if (!controller || !sunDebug) return;

  const controls = paletteSlots.map(({ slot, prop, label }) => ({
    id: `${slot}${prop}`,
    label,
    type: "color",
    default: sunDebug.config.palette[slot][prop],
    onChange: (value) => {
      sunDebug.config.palette[slot][prop] = value;
      sunDebug.apply();
    },
    bindings: {
      get: () => sunDebug.config.palette[slot][prop],
    },
  }));

  controls.push(
    {
      id: "arcOpacity",
      label: "Arc Opacity",
      type: "slide",
      min: 0,
      max: 1,
      step: 0.05,
      default: sunDebug.config.arcOpacity,
      onChange: (value) => {
        sunDebug.config.arcOpacity = value;
        sunDebug.apply();
      },
      bindings: { get: () => sunDebug.config.arcOpacity },
    },
    {
      id: "resetSun",
      label: "Reset Palette",
      type: "button",
      onChange: () => {
        sunDebug.reset();
      },
    },
  );

  await controller.registerModule({
    id: "sunSky",
    label: "Sun & Sky",
    controls,
  });
}
