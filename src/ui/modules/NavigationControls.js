import * as THREE from "three";
import { uilController, UILController } from "@ui/UILController.js";

/**
 * Registers navigation-related UIL controls (camera FOV, orbit distance, auto-rotate).
 * @param {{ setup: import("@/Setup.js").default, controller?: UILController }} params
 */
const tempForward = new THREE.Vector3();
const tempRight = new THREE.Vector3();
const tempMove = new THREE.Vector3();

export async function registerNavigationControls({ setup, controller = uilController }) {
  if (!setup) {
    console.warn("[NavigationControls] Setup instance required.");
    return;
  }

  await controller.registerModule({
    id: "navigation",
    label: "Navigation",
    controls: [
      {
        id: "autoRotate",
        label: "Auto Rotate",
        type: "bool",
        default: setup.autoRotate?.enabled ?? false,
        onChange: (value) => setup.setAutoRotate?.(value, true),
        bindings: {
          get: () => setup.autoRotate?.enabled ?? false,
        },
      },
      {
        id: "orbitMinDistance",
        label: "Min Distance",
        type: "slide",
        min: 5,
        max: 200,
        step: 1,
        default: setup.orbCtrls?.minDistance ?? 25,
        onChange: (value) => {
          if (setup.orbCtrls) {
            setup.orbCtrls.minDistance = value;
            setup.setDistanceLimits?.(value, setup.orbCtrls.maxDistance);
          }
        },
        bindings: {
          get: () => setup.orbCtrls?.minDistance ?? 25,
        },
      },
      {
        id: "orbitMaxDistance",
        label: "Max Distance",
        type: "slide",
        min: 50,
        max: 500,
        step: 5,
        default: setup.orbCtrls?.maxDistance ?? 320,
        onChange: (value) => {
          if (setup.orbCtrls) {
            setup.orbCtrls.maxDistance = value;
            setup.setDistanceLimits?.(setup.orbCtrls.minDistance, value);
          }
        },
        bindings: {
          get: () => setup.orbCtrls?.maxDistance ?? 320,
        },
      },
      {
        id: "cameraFov",
        label: "Camera FOV",
        type: "slide",
        min: 30,
        max: 100,
        step: 1,
        default: setup.cam?.fov ?? 75,
        onChange: (value) => {
          if (setup.cam) {
            setup.cam.fov = value;
            setup.cam.updateProjectionMatrix();
          }
        },
        bindings: {
          get: () => setup.cam?.fov ?? 75,
        },
      },
      {
        id: "resetCamera",
        label: "Reset Camera",
        type: "button",
        onChange: () => {
          if (typeof setup.goToBookmark === "function") {
            setup.goToBookmark("default");
          } else if (typeof setup.restoreCameraState === "function") {
            setup.restoreCameraState();
          }
        },
      },
      {
        id: "panJoystick",
        label: "Pan Joystick",
        type: "joystick",
        params: { name: "Pan" },
        default: { x: 0, y: 0 },
        onChange: (value) => applyJoystickPan(setup, value),
      },
    ],
  });
}

function applyJoystickPan(setup, value) {
  if (!setup?.cam || !setup?.orbCtrls || !value) return;
  const cam = setup.cam;
  const controls = setup.orbCtrls;
  const panSpeed = 2.2;

  cam.getWorldDirection(tempForward);
  tempForward.y = 0;
  if (tempForward.lengthSq() === 0) tempForward.set(0, 0, -1);
  tempForward.normalize();
  tempRight.copy(tempForward).cross(cam.up).normalize();

  tempMove.set(0, 0, 0);
  tempMove.addScaledVector(tempRight, value.x * panSpeed);
  tempMove.addScaledVector(tempForward, -value.y * panSpeed);

  controls.target.add(tempMove);
  controls.object.position.add(tempMove);
  controls.update();
}
