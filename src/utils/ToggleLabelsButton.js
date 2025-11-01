import { whenReady } from "@utils/initCoordinator.js";

export function setupLabelToggleButton() {
  whenReady("layoutManager", (layoutManager) => {
    const button = document.querySelector("#toggleLabelsButton");
    if (!button) return;

    button.addEventListener("click", () => {
      if (typeof layoutManager.toggleVisibility === "function") {
        layoutManager.toggleVisibility();
      } else {
        console.warn("[LabelToggle] layoutManager has no toggleVisibility()");
      }
    });
  });
}
