/** @typedef {import("@/types/uil.js").UILController} UILController */

/**
 * Controls for adjusting level offsets/scale of the roundedRooms group.
 * @param {{ controller: UILController, group: THREE.Object3D }} params
 */
export async function registerRoomLevelsControls({ controller, group }) {
  if (!controller || !group) return;

  await controller.registerModule({
    id: "levels",
    label: "Levels",
    controls: [
      {
        id: "levelHeight",
        label: "Height Offset",
        type: "slide",
        min: -40,
        max: 40,
        step: 1,
        default: group.position.y,
        onChange: (value) => {
          group.position.y = value;
        },
        bindings: { get: () => group.position.y },
      },
      {
        id: "levelScale",
        label: "Scale",
        type: "slide",
        min: 0.5,
        max: 2,
        step: 0.05,
        default: group.scale.y,
        onChange: (value) => {
          group.scale.set(value, value, value);
        },
        bindings: { get: () => group.scale.y },
      },
      {
        id: "levelReset",
        label: "Reset Levels",
        type: "button",
        onChange: () => {
          group.position.set(0, 0, 0);
          group.scale.set(1, 1, 1);
        },
      },
    ],
  });
}
