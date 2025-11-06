// --- START OF FILE main.js (Improved Loader, Panel Debugging) ---

import "@styles/main.css";
import * as THREE from "three";
import Setup from "@/Setup.js";
import { markReady, whenReady, createSignal } from "@utils/initCoordinator.js"; // Assuming createSignal exists in initCoordinator
import { generateRoundedBlocksFromSVG } from "@three/RoundedBlockGenerator.js";
import { LoaderUI } from "@components/Loader.js";
import { Toolbar } from "@organisms/Toolbar.js";
import historyManager from "@data/modules/HistoryManager.js";
import {
  scene,
  updateLabel as updateLabelInScene,
  connectToHomeAssistantWS,
  attachSetup,
  labelManager,
  layoutManager,
  updateSunFromEntity,
  updateMoonFromEntity,
  setHoveredEntity,
  clearHoveredEntity,
  setSelectedEntity,
  clearSelectedEntity,
  focusEntity,
} from "@/scene.js";
import { SensorDashboard } from "@lib/SensorDashboard.js";
import { Debugger } from "@debug/Debugger.js";
import { createPanelsFromData } from "@lib/PanelBuilder.js";
import { WebSocketStatus } from "@network/WebSocketStatus.js";
import { setHaStates, updateEntityState } from "@home_assistant/haState.js";
import { PostProcessor } from "@/postprocessing/PostProcessor.js";
import { CSSHudManager } from "@hud/CSSHudManager.js";

// --- Global Variables / State ---

let initialStatesReceived = false;
const initialStatesProcessedSignal = createSignal(); // Signal for when initial states are done
window.roomMeshes = {};
let isDebugModeActive = false; // Start with debug UI hidden
const debugSettings = {
  // State object for Tweakpane bindings
  enableLabelUpdates: true,
  // Add other debug flags here if needed
};
let debuggerInstance = null; // Hold the debugger instance
let sensorDashboardInstance = null;
let toolbarInstance = null;
let postProcessor = null;
let hudManager = null;

// --- End Debug State ---

// --- UI References ---

const loader = new LoaderUI(); // Loader is created here
const canvas =
  document.querySelector("canvas") ||
  (() => {
    const c = document.createElement("canvas");
    document.body.appendChild(c);
    return c;
  })();
const panelShell = document.querySelector(".panel-shell");
const contentArea = document.getElementById("content-area");
const panelIndicators = document.querySelector(".panel-indicators");
const floatingBtn = document.querySelector(".floating-btn");

panelShell?.classList.remove("is-open");
contentArea?.classList.remove("is-open");
panelIndicators?.classList.remove("is-open");
floatingBtn?.classList.remove("active");

// --- Setup 3D Environment ---
const setup = new Setup(canvas, () => {
  if (postProcessor) {
    postProcessor.setSize(canvas.clientWidth, canvas.clientHeight);
  }
});

setup.setEnvMap("/hdri/night1k.hdr");
attachSetup(setup);

postProcessor = new PostProcessor({
  renderer: setup.re,
  scene,
  camera: setup.cam,
});
scene.userData.postFX = {
  config: postProcessor.getConfig(),
  setEnabled: (value) => {
    postProcessor.setEnabled(value);
    return postProcessor.isEnabled();
  },
  setBloomSettings: (settings) => postProcessor.setBloomSettings(settings),
  captureSnapshot: ({
    bloomEnabled,
    size,
    download = false,
    filename = "scene-snapshot.png",
  } = {}) => {
    const renderer = setup.re;
    if (!renderer) {
      console.warn("[PostFX] Renderer unavailable; snapshot skipped.");
      return null;
    }

    const prevEnabled = postProcessor.isEnabled();
    if (typeof bloomEnabled === "boolean") {
      postProcessor.setEnabled(bloomEnabled);
    }

    const previousSize = new THREE.Vector2();
    renderer.getSize(previousSize);
    const prevPixelRatio = renderer.getPixelRatio();

    if (size?.width && size?.height) {
      renderer.setPixelRatio(1);
      renderer.setSize(size.width, size.height, false);
      postProcessor.setSize(size.width, size.height);
    }

    postProcessor.updateCamera(setup.cam);
    postProcessor.updateScene(scene);
    postProcessor.render();

    const dataUrl = renderer.domElement.toDataURL("image/png");

    if (download && typeof window !== "undefined") {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = filename;
      link.click();
    }

    if (size?.width && size?.height) {
      renderer.setPixelRatio(prevPixelRatio);
      renderer.setSize(previousSize.x, previousSize.y, false);
      postProcessor.setSize(previousSize.x, previousSize.y);
    }

    postProcessor.setEnabled(prevEnabled);
    return dataUrl;
  },
  instance: postProcessor,
};
postProcessor.setSize(canvas.clientWidth, canvas.clientHeight);

hudManager = new CSSHudManager({
  scene,
  camera: setup.cam,
  renderer: setup.re,
});
scene.userData.hud = {
  manager: hudManager,
};
hudManager.sync(labelManager.getLabels());
const hudInteractionState = {
  hoveredEntityId: null,
  selectedEntityId: null,
};

hudManager.on("hover", ({ entityId }) => {
  if (!entityId) return;
  hudInteractionState.hoveredEntityId = entityId;
  setHoveredEntity(entityId);
});

hudManager.on("hoverend", ({ entityId }) => {
  const targetId = entityId || hudInteractionState.hoveredEntityId;
  if (!targetId) return;
  if (hudInteractionState.hoveredEntityId === targetId) {
    hudInteractionState.hoveredEntityId = null;
  }
  clearHoveredEntity(targetId);
  if (
    hudInteractionState.selectedEntityId &&
    hudInteractionState.selectedEntityId !== targetId
  ) {
    setSelectedEntity(hudInteractionState.selectedEntityId);
  }
});

hudManager.on("focusin", ({ entityId }) => {
  if (!entityId) return;
  setHoveredEntity(entityId);
});

hudManager.on("focusout", ({ entityId }) => {
  if (!entityId) return;
  clearHoveredEntity(entityId);
});

hudManager.on("select", ({ entityId }) => {
  if (!entityId) return;
  hudInteractionState.selectedEntityId = entityId;
  setSelectedEntity(entityId);
  focusEntity(entityId, { duration: 0.8 });
});

hudManager.on("selectclear", () => {
  hudInteractionState.selectedEntityId = null;
  clearSelectedEntity();
});

scene.userData.cameraDebug = {
  saveBookmark: (name) => setup.saveCameraBookmark(name),
  goToBookmark: (name, duration) => setup.goToBookmark(name, duration),
  listBookmarks: () => setup.listCameraBookmarks(),
  removeBookmark: (name) => setup.removeCameraBookmark(name),
  focusOnPoint: (point) => setup.focusOnPoint(point),
  setTargetBounds: (bounds) => setup.setTargetBounds(bounds),
  setAutoRotate: (enabled, sticky = false) => setup.setAutoRotate(enabled, sticky),
  toggleAutoRotate: () => setup.toggleAutoRotate(),
  setAutoRotateSpeed: (degPerSecond) => setup.setAutoRotateSpeed(degPerSecond),
  setPanEnabled: (enabled) => setup.setPanEnabled(enabled),
  setZoomEnabled: (enabled) => setup.setZoomEnabled(enabled),
  setRotateEnabled: (enabled) => setup.setRotateEnabled(enabled),
  setDistanceLimits: ({ min, max } = {}) => setup.setDistanceLimits(min, max),
  getState: () => ({
    bookmarks: setup.listCameraBookmarks(),
    autoRotate: {
      enabled: setup.autoRotate.enabled,
      speedDeg: THREE.MathUtils.radToDeg(setup.autoRotate.speed),
    },
    controls: {
      pan: setup.orbCtrls.enablePan,
      zoom: setup.orbCtrls.enableZoom,
      rotate: setup.orbCtrls.enableRotate,
      minDistance: setup.orbCtrls.minDistance,
      maxDistance: setup.orbCtrls.maxDistance,
    },
  }),
};

function initializeToolbar(exportTarget = null) {
  if (toolbarInstance) return toolbarInstance;
  try {
    const target =
      exportTarget || window.roundedRoomsGroup || scene;
    toolbarInstance = new Toolbar({
      rootSelector: "#toolbar-root",
      layoutManager,
      labelManager,
      setupInstance: setup,
      exportTarget: target,
    });
    console.log("✅ Toolbar initialized.");
  } catch (error) {
    console.error("❌ Failed to initialize Toolbar:", error);
  }
  return toolbarInstance;
}

// ========== Core Logic Functions ==========

/**
 * Central handler for Home Assistant entity state updates.
 * Updates 3D view, central state, history, and potentially other UI components.
 * @param {string} entityId - The ID of the updated entity.
 * @param {object} entity - The full state object of the updated entity.
 */
function handleEntityUpdate(entityId, entity) {
  if (!entity || entity.state === undefined || entity.state === null) {
    // console.warn(`[handleEntityUpdate] Received invalid entity data or state for ${entityId}`);
    return;
  }

  // 1. Update 3D View / Labels
  const unit = entity.attributes?.unit_of_measurement || "";
  const formattedValue = `${entity.state} ${unit}`.trim();
  updateLabelInScene(entityId, formattedValue); // Update label text/color in the 3D scene
  hudManager?.updateLabel(entityId, {
    value: formattedValue,
    title: labelManager.getLabels()?.[entityId]?.userData?.registry?.label,
  });

  if (entityId === "sun.sun") {
    updateSunFromEntity(entity);
  } else if (entityId === "sensor.moon") {
    updateMoonFromEntity(entity);
  }

  // 2. Update Central State Store
  updateEntityState(entity); // Update the global state managed by haState.js

  // 3. Add Reading to History
  const timestamp = entity.last_changed || new Date().toISOString(); // Use last_changed or fallback
  historyManager.addReading(entity.entity_id, entity.state, timestamp);

  // 4. Update HUI Panels dynamically if necessary
  sensorDashboardInstance?.update(entity);

  const panel = contentArea?.querySelector(
    `.hui-panel[data-entity-id="${entityId}"]`,
  );
  if (panel) {
    // --- Fill in panel update logic ---
    const stateElement = panel.querySelector(".state-value");
    const unitElement = panel.querySelector(".state-unit");
    const lastUpdatedElement = panel.querySelector(".last-updated");

    if (stateElement) stateElement.textContent = entity.state;

    // Handle unit display update or addition
    if (unit) {
      if (unitElement) {
        unitElement.textContent = unit;
      } else if (stateElement) {
        // Add unit span if it doesn't exist but should
        // Check if it already exists before adding again (defensive)
        if (!stateElement.parentNode.querySelector(".state-unit")) {
          const newUnitSpan = document.createElement("span");
          newUnitSpan.className = "state-unit";
          newUnitSpan.textContent = unit;
          stateElement.parentNode.appendChild(newUnitSpan);
        }
      }
    } else if (unitElement) {
      unitElement.remove(); // Remove unit span if unit is no longer present
    }

    if (lastUpdatedElement) {
      // Format the date/time nicely
      try {
        lastUpdatedElement.textContent = `Last updated: ${new Date(entity.last_updated).toLocaleTimeString()}`;
      } catch {
        lastUpdatedElement.textContent = `Last updated: N/A`;
      }
    }
    // --- End panel update logic ---
  }
}

/**
 * Handles the initial dump of states received from Home Assistant on connection.
 * Populates the central state store, adds initial history, and builds UI panels.
 * @param {Array<object>} states - Array of HA state objects.
 */
function handleInitialStates(states) {
  if (initialStatesReceived || !Array.isArray(states)) {
    if (initialStatesReceived)
      console.log("[handleInitialStates] Already processed.");
    else
      console.error(
        "[handleInitialStates] Invalid states data received:",
        states,
      );
    return;
  }
  initialStatesReceived = true;
  console.log(
    `[handleInitialStates] Processing ${states.length} initial states...`,
  );
  loader.updateText("Processing initial data...");

  // 1. Update central state store
  setHaStates(states);
  console.log("💾 Central HA state store initialized.");

  const sunEntity = states.find((state) => state.entity_id === "sun.sun");
  if (sunEntity) {
    updateSunFromEntity(sunEntity);
  }

  const moonEntity = states.find((state) => state.entity_id === "sensor.moon");
  if (moonEntity) {
    updateMoonFromEntity(moonEntity);
  } else {
    updateMoonFromEntity({ state: null });
  }

  // 2. Add Initial States to History
  historyManager.addInitialStates(states);

  // 3. Filter and Create Panels
  const allSensorEntities = states.filter((e) =>
    e.entity_id?.startsWith("sensor."),
  );
  console.log(`📊 Found ${allSensorEntities.length} sensor states for panels.`);

  if (allSensorEntities.length > 0) {
    try {
      if (
        typeof createPanelsFromData === "function" &&
        contentArea &&
        panelIndicators
      ) {
        console.log("[handleInitialStates] Calling createPanelsFromData...");
        createPanelsFromData(allSensorEntities);
        console.log("🎨 Panels created from initial states.");

        // Regenerate indicators based on created panels
        const panelCount = contentArea.querySelectorAll(".hui-panel").length;
        panelIndicators.innerHTML = ""; // Clear existing
        if (panelCount > 0) {
          // --- Fill in indicator creation loop ---
          for (let i = 0; i < panelCount; i++) {
            const indicator = document.createElement("div");
            indicator.className = "panel-indicator";
            indicator.dataset.index = i; // Store index for easier lookup
            indicator.onclick = () => {
              const targetPanel = contentArea.querySelectorAll(".hui-panel")[i];
              targetPanel?.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center",
              });
            };
            panelIndicators.appendChild(indicator);
          }
          panelIndicators
            .querySelector(".panel-indicator")
            ?.classList.add("active"); // Activate first
          // --- End indicator creation loop ---
        }
      } else {
        console.error(
          "❌ Cannot create panels: PanelBuilder function or UI elements missing.",
        );
      }
    } catch (error) {
      console.error("❌ Error creating panels from data:", error);
    }
  } else {
    console.warn(
      "⚠️ No sensor entities found in initial state dump. Panels not created.",
    );
    if (contentArea) {
      contentArea.innerHTML =
        "<p style='color: grey; text-align: center; padding: 20px;'>No sensor data available.</p>";
    }
    if (panelIndicators) panelIndicators.innerHTML = "";
    if (sensorDashboardInstance) {
      console.log(
        "[handleInitialStates] Populating Sensor Dashboard with initial states...",
      );
      const initialSensors = states.filter((e) =>
        e.entity_id?.startsWith("sensor."),
      );
      initialSensors.forEach((sensor) => {
        sensorDashboardInstance.update(sensor);
      });
    }
  }
  // Signal that processing is done
  initialStatesProcessedSignal.resolve(); // Make sure initialStatesProcessedSignal is defined in global scope
  console.log("[handleInitialStates] Finished processing.");
}

/** Formats basic markdown-like text for display in HTML */
function formatReleaseNotes(markdown) {
  if (!markdown) return "";
  const formatted = markdown
    // Basic HTML escaping first
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    // Markdown features
    .replace(/##\s+(.*?)$/gm, "<h4>$1</h4>") // ## Header
    .replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    ) // [Link](url)
    .replace(/@(\w+)/g, '<span class="mention">@$1</span>') // @mention
    // Basic formatting - adjust if needed
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // **Bold**
    .replace(/\*(.*?)\*/g, "<em>$1</em>") // *Italic*
    .replace(/`(.*?)`/g, "<code>$1</code>") // `Code`
    // Newlines
    .replace(/\n/g, "<br>");
  return formatted;
}

/** Displays a detailed modal view for a given Home Assistant entity */
function showDetailedView(entity) {
  if (!entity || !entity.entity_id) {
    console.warn("showDetailedView called with invalid entity.");
    return;
  }

  document.querySelector(".detail-modal")?.remove(); // Clean up previous modal

  const modal = document.createElement("div");
  modal.className = "detail-modal";
  const modalContent = document.createElement("div");
  modalContent.className = "detail-content";

  // --- Header ---
  const header = document.createElement("div");
  header.className = "detail-header";
  header.innerHTML = `
    <h2>${entity.attributes?.friendly_name || entity.entity_id}</h2>
    <div class="close-button" title="Close">×</div>
  `;
  modalContent.appendChild(header);

  // --- Details Area ---
  const details = document.createElement("div");
  details.className = "detail-info"; // This div will contain all sections
  let detailsHTML = ""; // Start empty

  // --- Basic Details Section ---
  detailsHTML += `
    <div class="detail-section">
      <h3>Details</h3>
      <div class="detail-row"><span>Entity ID:</span> <span>${entity.entity_id}</span></div>
      <div class="detail-row"><span>State:</span> <span>${entity.state ?? "N/A"}</span></div>
      <div class="detail-row"><span>Last Updated:</span> <span>${new Date(entity.last_updated || Date.now()).toLocaleString()}</span></div>
      <div class="detail-row"><span>Last Changed:</span> <span>${new Date(entity.last_changed || Date.now()).toLocaleString()}</span></div>
    </div>
  `;

  // --- Attributes Section ---
  if (entity.attributes && Object.keys(entity.attributes).length > 0) {
    detailsHTML += '<div class="detail-section"><h3>Attributes</h3>';
    for (const [key, value] of Object.entries(entity.attributes)) {
      let displayValue;
      // Skip friendly_name and unit_of_measurement as they are often shown elsewhere
      if (key === "friendly_name" || key === "unit_of_measurement") continue;

      if (key === "release_summary" && value) {
        displayValue = `<div class="release-summary">${formatReleaseNotes(value)}</div>`;
      } else if (typeof value === "object" && value !== null) {
        try {
          displayValue = `<pre><code>${JSON.stringify(value, null, 2)}</code></pre>`;
        } catch {
          displayValue = `<span>[Object]</span>`;
        }
      } else {
        displayValue = `<span>${value ?? "N/A"}</span>`;
      }
      detailsHTML += `<div class="detail-row"><span>${key}:</span> ${displayValue}</div>`;
    }
    detailsHTML += "</div>";
  }

  // --- Context Section ---
  if (entity.context) {
    detailsHTML += `
      <div class="detail-section">
        <h3>Context</h3>
        <div class="detail-row"><span>ID:</span> <span>${entity.context.id || "N/A"}</span></div>
        <div class="detail-row"><span>Parent ID:</span> <span>${entity.context.parent_id || "None"}</span></div>
        <div class="detail-row"><span>User ID:</span> <span>${entity.context.user_id || "None"}</span></div>
      </div>
    `;
  }

  // --- History Section ---
  try {
    const entityHistory = historyManager.getHistory(entity.entity_id);
    detailsHTML += `<div class="detail-section"><h3>History (${entityHistory.length} entries)</h3>`; // Note: History is only for current session unless using localStorage persistence
    if (entityHistory.length > 0) {
      detailsHTML += `<ul class="detail-history-list">`;
      const unit = entity.attributes?.unit_of_measurement || "";
      // Show newest first
      for (let i = entityHistory.length - 1; i >= 0; i--) {
        const reading = entityHistory[i];
        const timestamp = new Date(reading.timestamp); // Parse timestamp string if needed
        const displayTimestamp = timestamp.toLocaleString(); // Use locale-specific format
        const displayState = `${reading.state ?? "N/A"} ${unit}`.trim();
        detailsHTML += `<li><span>${displayTimestamp}:</span> <span>${displayState}</span></li>`;
      }
      detailsHTML += `</ul>`;
    } else {
      detailsHTML += `<p>No history recorded for this session.</p>`;
    }
    detailsHTML += `</div>`;
  } catch (error) {
    console.error(`Error rendering history for ${entity.entity_id}:`, error);
    detailsHTML += `<div class="detail-section"><h3>History</h3><p>Error loading history.</p></div>`;
  }

  details.innerHTML = detailsHTML; // Set innerHTML for the details container
  modalContent.appendChild(details); // Append details container to modal content

  // --- Actions Section ---
  const actions = document.createElement("div");
  actions.className = "detail-actions";
  actions.innerHTML = `
    <button class="action-button" title="Not implemented">History Chart</button>
    <button class="action-button primary" title="Request state refresh (no backend)">Refresh</button>
  `;
  modalContent.appendChild(actions);

  // --- Add to DOM & Show ---
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add("visible"));

  // --- Event Listeners for Modal ---
  const closeModal = () => {
    modal.classList.remove("visible");
    modal.addEventListener("transitionend", () => modal.remove(), {
      once: true,
    });
  };
  modal.querySelector(".close-button")?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  modal.querySelectorAll(".action-button").forEach((button) => {
    button.addEventListener("click", function () {
      this.classList.add("clicked");
      setTimeout(() => this.classList.remove("clicked"), 200);
      console.log(`Action button clicked: ${this.textContent}`);
      // TODO: Implement actual actions
      if (this.textContent === "Refresh") {
        // Optionally try to find and re-render the entity display if needed,
        // but a full refresh isn't implemented client-side easily without WS request
        console.log("Refresh requested (client-side only)");
      }
    });
  });
}
window.showDetailedView = showDetailedView;

// ========== UI Interactions ==========

// Virtual button visual feedback (using event delegation)
document.body.addEventListener("click", (event) => {
  const button = event.target.closest(".virtual-button");
  // Apply effect only if it's a virtual button AND doesn't have a JS onclick handler
  // (like the 'View Details' button which handles its own logic/navigation)
  if (button && !button.onclick) {
    button.style.transition = "transform 0.15s ease"; // Ensure transition is set
    button.style.transform = "scale(0.95)";
    setTimeout(() => {
      // Check if button still exists before resetting transform
      if (button) button.style.transform = "none";
    }, 150);
  }
});

// Floating button toggle for panel visibility
floatingBtn?.addEventListener("click", function () {
  if (!panelShell || !contentArea || !panelIndicators || !floatingBtn) {
    console.error("Floating button click: Required UI elements missing!");
    return; // Prevent toggling if elements are missing
  }

  const willOpen = !panelShell.classList.contains("is-open");
  panelShell.classList.toggle("is-open", willOpen);
  contentArea.classList.toggle("is-open", willOpen);
  panelIndicators.classList.toggle("is-open", willOpen);
  floatingBtn.classList.toggle("active", willOpen);
});

// Panel indicators scroll sync
contentArea?.addEventListener(
  "scroll",
  function () {
    const currentIndicators =
      panelIndicators?.querySelectorAll(".panel-indicator");
    const currentPanels = this.querySelectorAll(".hui-panel"); // `this` refers to contentArea here

    // Basic validation
    if (
      !currentIndicators ||
      currentIndicators.length === 0 ||
      !currentPanels ||
      currentPanels.length === 0 ||
      currentPanels.length !== currentIndicators.length
    ) {
      // Clear indicators if panel count mismatch or elements missing
      if (panelIndicators) panelIndicators.innerHTML = "";
      return;
    }

    const scrollCenter = this.scrollLeft + this.clientWidth / 2;
    let activeIndex = -1;

    // Find which panel is closest to the center
    let minDistance = Infinity;
    for (let i = 0; i < currentPanels.length; i++) {
      const panel = currentPanels[i];
      const panelCenter = panel.offsetLeft + panel.offsetWidth / 2;
      const distance = Math.abs(scrollCenter - (panelCenter - this.scrollLeft));

      if (distance < minDistance) {
        minDistance = distance;
        activeIndex = i;
      }
    }

    // Alternative center check (sometimes more robust during scroll end)
    for (let i = 0; i < currentPanels.length; i++) {
      const panel = currentPanels[i];
      const panelLeft = panel.offsetLeft - this.scrollLeft;
      const panelRight = panelLeft + panel.offsetWidth;
      if (
        panelLeft < this.clientWidth / 2 &&
        panelRight > this.clientWidth / 2
      ) {
        activeIndex = i;
        break;
      }
    }

    // Fallback if calculation fails
    if (activeIndex === -1 && currentPanels.length > 0) {
      const panelWidth = this.scrollWidth / currentPanels.length;
      activeIndex = Math.round(this.scrollLeft / panelWidth);
      activeIndex = Math.max(
        0,
        Math.min(currentPanels.length - 1, activeIndex),
      ); // Clamp index
    }

    // Update indicator classes
    currentIndicators.forEach((indicator, i) => {
      indicator.classList.toggle("active", i === activeIndex);
    });
  },
  { passive: true },
); // Use passive listener for scroll performance

// --- Keystroke Listener for Debug Toggle (Using 'R' key) ---
window.addEventListener("keydown", (event) => {
  // Ignore keydown events if user is typing in an input field
  if (
    event.target.tagName === "INPUT" ||
    event.target.tagName === "TEXTAREA" ||
    event.target.isContentEditable
  ) {
    return;
  }

  // Use 'KeyR' for the "R" key (case-insensitive check just in case)
  if (event.code === "KeyR" || event.key.toLowerCase() === "r") {
    // Don't prevent default unless it interferes with something else
    // event.preventDefault();
    isDebugModeActive = !isDebugModeActive;
    console.log(
      `Debug Mode ${isDebugModeActive ? "Activated" : "Deactivated"} (Key R)`,
    );
    toggleDebugUI(isDebugModeActive); // Assumes toggleDebugUI is defined elsewhere
  }
});

// --- Function to Toggle Debug UI Visibility ---
function toggleDebugUI(show) {
  // Toggle Stats.js panel
  if (setup.stats) {
    // Check if stats instance exists
    if (show) setup.stats.show();
    else setup.stats.hide();
  }

  // Toggle Tweakpane panel
  if (debuggerInstance?.domElement) {
    debuggerInstance.domElement.style.display = show ? "block" : "none";
    debuggerInstance.domElement.style.pointerEvents = show ? "auto" : "none";
    debuggerInstance.pane?.refresh?.();
  } else if (debuggerInstance) {
    const tpPane = document.querySelector(".tp-dfwv");
    if (tpPane) {
      tpPane.style.display = show ? "block" : "none";
      tpPane.style.pointerEvents = show ? "auto" : "none";
      debuggerInstance.pane?.refresh?.();
    }
  }
}

// --- End Debug Toggle ---
// // --- END of UI Interactions section in main.js ---

// --- START of Debug section in main.js ---

// 🧪 Debugger setup
//
//
// Wait until the main 3D group for rooms is ready before initializing the debugger
// --- START of Initial Setup Calls section in main.js ---

// ========== Initial Setup Calls ==========

// --- Loader: Initialize ---
loader.updateText("Initializing...");

// --- Create promises/signals for async operations ---
// whenReady creates a promise that waits for markReady(resourceName)
const roomsReadyPromise = whenReady("roundedRoomsGroup");

// --- Add logging to track promise states (for debugging) ---
console.log(
  "[Init] roomsReadyPromise created, waiting for 'roundedRoomsGroup'.",
);
roomsReadyPromise.then(
  (group) =>
    console.log(
      "[Init] roomsReadyPromise RESOLVED.",
      group
        ? `Group children: ${group.children?.length}`
        : "Group null/undefined",
    ),
  (err) => console.error("[Init] roomsReadyPromise REJECTED.", err), // Should not happen with whenReady unless manually rejected
);

console.log(
  "[Init] initialStatesProcessedSignal promise created, waiting for resolve/reject.",
);
initialStatesProcessedSignal.promise.then(
  () => console.log("[Init] initialStatesProcessedSignal RESOLVED."),
  (err) => console.error("[Init] initialStatesProcessedSignal REJECTED.", err),
);
// --- End promise logging ---

// --- 1. Load Rounded Blocks (Async Operation) ---
const svgURL = "/floorplan.svg";
loader.updateText("Loading floorplan..."); // Update status before starting
console.log("[Init] Starting floorplan generation...");

generateRoundedBlocksFromSVG(svgURL, scene, window.roomMeshes) // Pass the main scene
  .then((group) => {
    console.log("[Init] generateRoundedBlocksFromSVG finished.");
    if (group instanceof THREE.Group) {
      scene.add(group); // Add the generated group to the main scene
      console.log(
        `✅ Rounded blocks group added to the main scene (${group.children.length} meshes).`,
      );

      // --- Mark resources as ready ---
      // Mark the mesh registry ready (for Debugger object picker)
      markReady("roomMeshes", window.roomMeshes);
      window.roundedRoomsGroup = group;
      // ** CRITICAL: Mark the group itself ready to resolve roomsReadyPromise **
      markReady("roundedRoomsGroup", group);
      console.log(
        "[Init] 'roundedRoomsGroup' and 'roomMeshes' marked as ready.",
      );
      // --- End mark ready ---
    } else {
      console.error(
        "❌ generateRoundedBlocksFromSVG did not return a valid Group.",
      );
      // How to signal failure to Promise.all? Currently, roomsReadyPromise will just never resolve.
      // Consider modifying generateRoundedBlocksFromSVG to return a rejecting promise on failure.
      loader.updateText("Error: Invalid floorplan data!");
    }
  })
  .catch((error) => {
    console.error("❌ Failed to generate rounded blocks:", error);
    loader.updateText("Error loading floorplan!");
    // Rejecting the signal here might hide the loader too early if HA connects successfully.
    // Better to let the roomsReadyPromise hang and potentially handle timeout later if needed.
  });

// --- 2. Connect Home Assistant (Async Operation Triggered by DOMContentLoaded) ---
let haSocket = null;
window.addEventListener("DOMContentLoaded", () => {
  // This ensures the DOM is ready for UI elements like WebSocketStatus if needed
  console.log("[Init] DOMContentLoaded event fired.");
  try {
    // Assumes the container #sensor-dashboard exists in the HTML now
    sensorDashboardInstance = new SensorDashboard("sensor-dashboard");
    console.log("📊 SensorDashboard initialized.");
    initializeToolbar();
  } catch (error) {
    console.error("❌ Failed to initialize SensorDashboard:", error);
    // Decide how to handle this - maybe show an error message?
  }
  loader.updateText("Connecting to Home Assistant...");
  console.log("[Init] Attempting to connect WebSocket...");

  // connectToHomeAssistantWS handles its own connection logic.
  // We pass handleInitialStates, which MUST call initialStatesProcessedSignal.resolve() on success.
  haSocket = connectToHomeAssistantWS(handleEntityUpdate, handleInitialStates);

  if (haSocket) {
    // Initialize WebSocket status UI *after* attempting connection
    try {
      new WebSocketStatus(haSocket); // Assumes WebSocketStatus handles its own DOM insertion
      console.log("🟢 WebSocketStatus UI initialized.");
    } catch (wsError) {
      console.error("❌ Error initializing WebSocketStatus UI:", wsError);
    }
  } else {
    // Connection failed immediately (e.g., invalid URL)
    console.error("🔴 Failed to create WebSocket instance. Check WS_URL.");
    loader.updateText("Error: HA Connection Failed");
    // Reject the signal promise to indicate HA init failure
    initialStatesProcessedSignal.reject("WebSocket creation failed");
  }
  // Note: Further HA connection errors (auth fail, close) might need to trigger
  // initialStatesProcessedSignal.reject() from within scene.js or the WS handlers if you
  // want Promise.all to fail in those cases too. Currently, handleInitialStates only resolves.
});

// --- 3. Wait for Critical Operations, then Hide Loader ---
console.log(
  "[Init] Setting up Promise.all to wait for rooms and initial states processing...",
);
Promise.all([roomsReadyPromise, initialStatesProcessedSignal.promise])
  .then(() => {
    console.log(">>> Promise.all RESOLVED successfully!");
    console.log(
      "✅ Core async initializations complete (Rooms, HA Initial States).",
    );
    loader.complete(); // Hide loader smoothly
  })
  .catch((error) => {
    console.error(">>> Promise.all REJECTED!");
    console.error("❌ Error during core initialization:", error);
    // Display persistent error message on the loader
    loader.updateText(`Initialization Error: ${error || "Unknown error"}`);
    // Consider leaving the loader visible or adding a dedicated error overlay
  });

// --- END of Initial Setup Calls section in main.js ---

// ✅ Toolbar UI
// Wait until the label data managed by LabelManager is ready.

whenReady("labels", (labelsData) => {
  console.log(
    `[Toolbar Init] Labels ready (${Object.keys(labelsData ?? {}).length})`,
  );
  if (labelsData === null || typeof labelsData !== "object") {
    console.error(
      "❌ Toolbar Init Aborted: Received invalid labelsData (expected an object).",
      labelsData,
    );
    return; // Stop if data is fundamentally wrong
  }
  if (Object.keys(labelsData).length === 0) {
    console.warn(
      "[Toolbar Init] labelsData is ready, but it's empty. Toolbar controls might be limited.",
    );
  }
  layoutManager.labels = labelsData;
  initializeToolbar();
}); // End whenReady for "labels"

// --- END of Toolbar UI initialization section in main.js ---

// --- START of Complete Debugger Setup section in main.js ---

// 🧪 Debugger setup
// Wait until the main 3D group for rooms ('roundedRoomsGroup') is ready before initializing the debugger.
// This ensures the scene has the primary objects the debugger might interact with initially.
whenReady("roundedRoomsGroup", (group) => {
  console.log("[Debugger Init] Prerequisite 'roundedRoomsGroup' is ready.");
  initializeToolbar(group);

  // --- Step 1: Basic Validation ---
  // Ensure we have valid Scene and Camera objects from the Setup module.
  // The debugger relies heavily on these.
  if (!(scene instanceof THREE.Scene)) {
    console.error(
      "❌ Debugger Setup Aborted: Invalid 'scene' object provided. Expected THREE.Scene.",
      scene,
    );
    return; // Stop initialization if the scene is invalid
  }
  if (!(setup.cam instanceof THREE.Camera)) {
    // Check against base Camera class for flexibility
    console.error(
      "❌ Debugger Setup Aborted: Invalid 'setup.cam' object provided. Expected THREE.Camera.",
      setup.cam,
    );
    return; // Stop initialization if the camera is invalid
  }
  // OrbitControls validation (added based on Debugger constructor)
  if (!setup.orbCtrls || typeof setup.orbCtrls.update !== "function") {
    console.error(
      "❌ Debugger Setup Aborted: Invalid 'setup.orbCtrls' object provided.",
      setup.orbCtrls,
    );
    return; // Stop initialization if OrbitControls are invalid
  }
  // Check the group object itself, although whenReady should provide it if resolved.
  if (!group) {
    console.warn(
      "❌ Debugger Setup: 'group' object from roundedRoomsGroup is unexpectedly missing.",
    );
    // Depending on Debugger's design, you might still proceed or return here.
  }

  // --- Step 2: Initialize Debugger Instance ---
  try {
    // Create the debugger instance, passing essential references.
    // Assumes Debugger constructor requires scene, camera, controls, and the debugSettings state object.
    debuggerInstance = new Debugger(
      scene,
      setup.cam,
      setup.orbCtrls,
      debugSettings,
    );

    // --- (Optional) Make globally accessible for console debugging ---
    // Useful during development but consider removing or wrapping for production builds.
    // Example: if (process.env.NODE_ENV === 'development') { window.debugger = debug; }
    window.debugger = debuggerInstance; // Assign the instance stored in debuggerInstance
    // --- End Optional ---

    console.log("🐛 Debugger initialized successfully.");

    isDebugModeActive = false;
    toggleDebugUI(false);

    // --- Hide Debug UI Panels Initially (if needed) ---
    // Call the function defined elsewhere in main.js to set initial visibility
    // based on the isDebugModeActive flag.
    if (!isDebugModeActive) {
      console.log("[Debugger Init] Hiding debug UI panels initially.");
      toggleDebugUI(false); // Assumes toggleDebugUI is defined
    }

    // --- Step 3: Update Debugger Object Picker (Asynchronously) ---
    // The object picker needs the 'roomMeshes' data, which might become ready
    // at the same time or slightly after 'roundedRoomsGroup'.
    // We use another whenReady to ensure this data is available before updating the picker.
    whenReady("roomMeshes", (meshesMap) => {
      console.log("[Debugger Update] Dependency 'roomMeshes' is ready.");

      // Check if the debugger instance was created successfully and has the required method.
      if (
        !debuggerInstance ||
        typeof debuggerInstance.updateObjectPickerOptions !== "function"
      ) {
        console.warn(
          "Debugger instance is missing or lacks 'updateObjectPickerOptions' method. Skipping picker update.",
        );
        return;
      }
      // Check if the meshesMap data is valid.
      if (
        !meshesMap ||
        typeof meshesMap !== "object" ||
        Object.keys(meshesMap).length === 0
      ) {
        console.warn(
          "Debugger: Invalid or empty 'meshesMap' received. Skipping object picker update.",
          meshesMap,
        );
        return; // Don't proceed if no valid mesh data
      }

      // Prepare options for the object picker in the format { 'Display Name': uuid }
      const formattedMeshes = {};
      let validMeshCount = 0;
      Object.entries(meshesMap).forEach(([id, mesh]) => {
        // Validate that each entry is a THREE.Object3D before adding.
        if (mesh instanceof THREE.Object3D) {
          formattedMeshes[mesh.name || id] = mesh.uuid; // Use mesh name or fallback to id from the registry key
          validMeshCount++;
        } else {
          console.warn(
            `Debugger: Invalid mesh object found in meshesMap for id '${id}'.`,
            mesh,
          );
        }
      });

      // Update the picker only if valid meshes were found.
      if (validMeshCount > 0) {
        debuggerInstance.updateObjectPickerOptions(formattedMeshes);
        console.log(
          `🐛 Debugger object picker updated with ${validMeshCount} room meshes.`,
        );
      } else {
        console.warn(
          "Debugger: No valid meshes found in meshesMap to update object picker.",
        );
      }
    }); // End whenReady for "roomMeshes"
  } catch (error) {
    // Catch errors specifically during Debugger instantiation.
    console.error("❌ Error initializing Debugger instance:", error);
    debuggerInstance = null; // Ensure instance is null if init fails
    // Provide feedback - maybe disable debug features?
  }
}); // End whenReady for "roundedRoomsGroup"

// --- START of Animation Loop section in main.js ---

// 🎥 Animation Loop
// This function runs continuously to update and render the scene.
function loop() {
  // Request the next frame from the browser. This creates the recursive loop.
  requestAnimationFrame(loop);

  // --- Update Time-Dependent Controls ---
  setup.update?.();

  // --- Update Performance Stats ---
  // Update the Stats.js panel (FPS, ms, etc.).
  setup.stats?.update();

  // --- Update Dynamic Scene Elements ---
  // Example: Update label positions/scaling relative to the camera.
  // Check if labelManager exists and has the update method.
  if (labelManager?.useSprites) {
    labelManager.updateLabelPositions(setup.cam);
  }
  hudManager?.update(setup.cam);
  // Add other per-frame updates here if needed (e.g., animations).

  // --- Render the Scene ---
  if (postProcessor) {
    postProcessor.updateCamera(setup.cam);
    postProcessor.updateScene(scene);
    if (postProcessor.isEnabled()) {
      postProcessor.render();
    } else if (setup.re && scene && setup.cam) {
      setup.re.render(scene, setup.cam);
    }
  } else if (setup.re && scene && setup.cam) {
    setup.re.render(scene, setup.cam);
  } else {
    console.warn("Render loop: Renderer, scene, or camera not ready.");
  }
}

// --- Start the Animation Loop ---
// Call the loop function once to begin the animation cycle.
console.log("🚀 Starting animation loop...");
loop();
