/** @typedef {import("@/types/uil.js").UILController} UILController */

/**
 * Registers orbit/debug controls that were formerly housed in Tweakpane.
 * @param {{ controller: UILController, setup: import("@/Setup.js").default }} params
 */
export async function registerOrbitDebugControls({ controller, setup }) {
  if (!controller || !setup || !setup.orbCtrls) return;

  const controls = [
    {
      id: "orbitDamping",
      label: "Damping",
      type: "slide",
      min: 0,
      max: 1,
      step: 0.01,
      default: setup.orbCtrls.dampingFactor ?? 0.05,
      onChange: (value) => {
        setup.orbCtrls.enableDamping = value > 0;
        setup.orbCtrls.dampingFactor = value;
      },
      bindings: {
        get: () => setup.orbCtrls.dampingFactor ?? 0.05,
      },
    },
    {
      id: "orbitRotateSpeed",
      label: "Rotate Speed",
      type: "slide",
      min: 0.1,
      max: 1.5,
      step: 0.05,
      default: setup.orbCtrls.rotateSpeed ?? 0.9,
      onChange: (value) => {
        setup.orbCtrls.rotateSpeed = value;
      },
      bindings: { get: () => setup.orbCtrls.rotateSpeed ?? 0.9 },
    },
    {
      id: "orbitZoomSpeed",
      label: "Zoom Speed",
      type: "slide",
      min: 0.1,
      max: 2,
      step: 0.05,
      default: setup.orbCtrls.zoomSpeed ?? 1.1,
      onChange: (value) => {
        setup.orbCtrls.zoomSpeed = value;
      },
      bindings: { get: () => setup.orbCtrls.zoomSpeed ?? 1.1 },
    },
    {
      id: "orbitPanToggle",
      label: "Pan Enabled",
      type: "bool",
      default: setup.orbCtrls.enablePan ?? true,
      onChange: (value) => setup.setPanEnabled?.(value),
      bindings: { get: () => setup.orbCtrls.enablePan ?? true },
    },
    {
      id: "orbitRotateToggle",
      label: "Rotate Enabled",
      type: "bool",
      default: setup.orbCtrls.enableRotate ?? true,
      onChange: (value) => setup.setRotateEnabled?.(value),
      bindings: { get: () => setup.orbCtrls.enableRotate ?? true },
    },
    {
      id: "orbitZoomToggle",
      label: "Zoom Enabled",
      type: "bool",
      default: setup.orbCtrls.enableZoom ?? true,
      onChange: (value) => setup.setZoomEnabled?.(value),
      bindings: { get: () => setup.orbCtrls.enableZoom ?? true },
    },
    {
      id: "statsVisible",
      label: "Show Stats Panel",
      type: "bool",
      default: true,
      onChange: (value) => {
        if (!setup.stats) return;
        if (value) setup.stats.show?.();
        else setup.stats.hide?.();
      },
    },
  ];

  await controller.registerModule({
    id: "orbitDebug",
    label: "Orbit Debug",
    controls,
  });
}
