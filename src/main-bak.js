// --- START OF FILE main.js (Updated Toolbar Init with Promise.all) ---

import "@/style.css";
import * as THREE from "three";
import Setup from "@/Setup.js";
import { markReady, whenReady, createSignal } from "@utils/initCoordinator.js";
import { generateRoundedBlocksFromSVG } from "@three/RoundedBlockGenerator.js";
import { LoaderUI } from "@components/Loader.js";
import { Toolbar } from "@organisms/Toolbar.js";
import historyManager from "@data/modules/HistoryManager.js";
import {
  scene,
  // labels, // labels variable is locally scoped in scene.js, use labelManager.getLabels() if needed externally
  updateLabel as updateLabelInScene,
  connectToHomeAssistantWS,
  attachSetup,
  labelManager,
} from "@/scene.js";
import { SensorDashboard } from "@lib/SensorDashboard.js";
import { Debugger } from "@debug/Debugger.js";
import { createPanelsFromData } from "@lib/PanelBuilder.js";
import { WebSocketStatus } from "@network/WebSocketStatus.js";
import { createHomeAssistantSocket } from "@network/HomeAssistantSocket.js";
import { setHaStates, updateEntityState } from "@home_assistant/haState.js";

// Home Assistant Controller
const haController = createHomeAssistantSocket({
  onStateUpdate: handleEntityUpdate,
  onInitialStates: handleInitialStates,
});

haController.connect();

new WebSocketStatus(haController.getSocket());

// --- Global Variables / State ---
let initialStatesReceived = false;
const initialStatesProcessedSignal = createSignal();
window.roomMeshes = {};
let isDebugModeActive = false;
const debugSettings = { enableLabelUpdates: true };
let debuggerInstance = null;
let sensorDashboardInstance = null;

// --- UI References ---
const loader = new LoaderUI();
const canvas =
  document.querySelector("canvas") ||
  (() => {
    const c = document.createElement("canvas");
    document.body.appendChild(c);
    return c;
  })();
const contentArea = document.getElementById("content-area");
const panelIndicators = document.querySelector(".panel-indicators");
const floatingBtn = document.querySelector(".floating-btn");
 // Not needed if Toolbar component finds it


// --- Setup 3D Environment ---
const setup = new Setup(canvas, () => {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (h > 0) {
    setup.cam.aspect = w / h;
    setup.cam.updateProjectionMatrix();
  }
  setup.re.setSize(w, h, false);
});
setup.setEnvMap("/hdri/night.hdr");
attachSetup(setup);

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
      initialSensors.forEach((sensor) =>
        sensorDashboardInstance.update(sensor),
      );
    }
  }
  // Signal that processing is done
  initialStatesProcessedSignal.resolve(); // Make sure initialStatesProcessedSignal is defined in global scope
  console.log("[handleInitialStates] Finished processing.");
}

/** Formats basic markdown-like text for display in HTML */
function formatReleaseNotes(markdown) {
  if (!markdown) return "";
  let formatted = markdown
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
document.body.addEventListener("click", function (event) {
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
  // console.log("Floating button clicked!"); // Debug log removed
  if (!contentArea || !panelIndicators || !floatingBtn) {
    console.error("Floating button click: Required UI elements missing!");
    return; // Prevent toggling if elements are missing
  }

  floatingBtn.classList.toggle("active");
  contentArea.classList.toggle("visible");
  panelIndicators.classList.toggle("visible");
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

// --- Keystroke Listener for Debug Toggle (Using 'D' key) ---
window.addEventListener("keydown", (event) => {
  // Ignore keydown events if user is typing in an input field
  if (
    event.target.tagName === "INPUT" ||
    event.target.tagName === "TEXTAREA" ||
    event.target.isContentEditable
  ) {
    return;
  }

  // Use 'KeyD' for the "D" key (case-insensitive check just in case)
  if (event.code === "KeyD" || event.key.toLowerCase() === "d") {
    // Don't prevent default unless it interferes with something else
    // event.preventDefault();
    isDebugModeActive = !isDebugModeActive;
    console.log(
      `Debug Mode ${isDebugModeActive ? "Activated" : "Deactivated"} (Key D)`,
    );
    toggleDebugUI(isDebugModeActive); // Assumes toggleDebugUI is defined elsewhere
  }
});

// --- Function to Toggle Debug UI Visibility ---
function toggleDebugUI(show) {
  const displayStyle = show ? "block" : "none"; // Or use CSS classes for transitions

  // Toggle Stats.js panel
  if (setup.stats) {
    // Check if stats instance exists
    if (show) setup.stats.show();
    else setup.stats.hide();
  }

  // Toggle Tweakpane panel
  if (debuggerInstance?.domElement) {
    debuggerInstance.domElement.style.display = show ? "block" : "none";
  } else if (show && debuggerInstance) {
    // Fallback check
    const tpPane = document.querySelector(".tp-dfwv");
    if (tpPane) tpPane.style.display = displayStyle;
  }
}

// ========== Initial Setup Calls ==========
loader.updateText("Initializing...");
const roomsReadyPromise = whenReady("roundedRoomsGroup");
const initialStatesReadyPromise = initialStatesProcessedSignal.promise;

// --- Promise Logging (Optional for Debug) ---
// console.log("[Init] roomsReadyPromise created..."); roomsReadyPromise.then(() => console.log("[Init] roomsReadyPromise RESOLVED."));
// console.log("[Init] initialStatesReadyPromise created..."); initialStatesReadyPromise.then(() => console.log("[Init] initialStatesReadyPromise RESOLVED."));

// --- 1. Load Rounded Blocks ---
const svgURL = "/floorplan.svg";
loader.updateText("Loading floorplan...");
console.log("[Init] Starting floorplan generation...");
generateRoundedBlocksFromSVG(svgURL, scene, window.roomMeshes)
  .then((group) => {
    /* ... (Adds group to scene, marks roomMeshes and roundedRoomsGroup ready) ... */
    console.log("[Init] generateRoundedBlocksFromSVG finished.");
    if (group instanceof THREE.Group) {
      scene.add(group);
      console.log(
        `✅ Rounded blocks group added (${group.children.length} meshes).`,
      );
      markReady("roomMeshes", window.roomMeshes);
      markReady("roundedRoomsGroup", group); // Resolve the promise
      console.log(
        "[Init] 'roundedRoomsGroup' and 'roomMeshes' marked as ready.",
      );
    } else {
      console.error("❌ generateRoundedBlocksFromSVG failed.");
      loader.updateText("Error!");
    }
  })
  .catch((error) => {
    console.error("❌ Failed floorplan generation:", error);
    loader.updateText("Error!");
  });

// --- 2. Connect Home Assistant & Init Dashboard ---
let haSocket = null;
window.addEventListener("DOMContentLoaded", () => {
  console.log("[Init] DOMContentLoaded fired.");
  try {
    sensorDashboardInstance = new SensorDashboard("sensor-dashboard");
    console.log("📊 SensorDashboard initialized.");
  } catch (error) {
    console.error("❌ Failed SensorDashboard init:", error);
  }

  loader.updateText("Connecting to Home Assistant...");
  haSocket = connectToHomeAssistantWS(handleEntityUpdate, handleInitialStates);
  if (haSocket) {
    new WebSocketStatus(haSocket);
    console.log("🟢 WebSocketStatus UI initialized.");
  } else {
    console.error("🔴 WS Connection Failed.");
    loader.updateText("Error!");
    initialStatesProcessedSignal.reject("WS Conn Fail");
  }
});

// --- 3. Mark Labels Ready (after listener setup below) ---
// Moved this *after* the whenReady("labels",...) block below
// if (labelManager && typeof labelManager.getLabels === 'function') { /* ... markReady("labels", ...) ... */ }

// **************************************************************************
// --- MODIFICATION START: Replaced Toolbar Initialization Logic ---
// **************************************************************************

// ✅ Toolbar UI (Depends on labels AND rooms group being ready)
// Wait for both dependencies using Promise.all
Promise.all([
  whenReady("labels"),
  whenReady("roundedRoomsGroup"), // Wait for the group needed for export
])
  .then(([labelsData, groupData]) => {
    // Destructure the resolved data
    const labelCount = Object.keys(labelsData ?? {}).length;
    console.log(
      `[Toolbar Init] Dependencies ready: Labels (${labelCount}), Rooms Group (${groupData ? "OK" : "Missing"}).`,
    ); // Log readiness

    // Validate dependencies
    if (!labelsData || typeof labelsData !== "object") {
      console.error(
        "❌ Toolbar Init Aborted: Invalid labelsData received by Promise.all.",
        labelsData,
      );
      return;
    }
    if (!groupData) {
      // Log a warning but maybe still initialize the toolbar without export functionality?
      console.warn(
        "❌ Toolbar Init Warning: Rounded rooms group not available. Export buttons will be disabled or may fail.",
      );
      // You could potentially pass null or undefined for exportTarget and handle it in Toolbar.js
    }

    // Instantiate the Toolbar
    try {
      // Ensure the .toolbar div exists in HTML
      new Toolbar({
        onToggleGroup: (group, visible) => {
          // Callback logic for toggling label groups
          if (!labelsData) return; // Safety check
          Object.values(labelsData).forEach((label) => {
            const type =
              label?.userData?.registry?.type ||
              label?.userData?.type ||
              "unknown";
            if (type === group && label && typeof label.visible === "boolean") {
              label.visible = visible;
            }
          });
        },
        initialLabels: labelsData, // Pass label data
        setupInstance: setup, // Pass setup instance (for camera views)
        scene: scene, // Pass scene instance (potentially for exporter)
        exportTarget: groupData, // Pass the resolved rooms group for exporting
      });
      console.log("✅ Toolbar initialized successfully.");
    } catch (error) {
      console.error("❌ Failed Toolbar instantiation:", error);
    }
  })
  .catch((error) => {
    // This catch block handles errors if *either* whenReady("labels") or whenReady("roundedRoomsGroup") rejects
    console.error(
      "❌ Error waiting for Toolbar dependencies (labels or roundedRoomsGroup):",
      error,
    );
    // Optionally, provide user feedback that the toolbar could not load
  });

// **************************************************************************
// --- END MODIFICATION ---
// **************************************************************************

// --- Mark Labels Ready (Moved Here - After whenReady listener is set up) ---
// We still need to signal when labels are actually ready.
// This should happen after labelManager is definitely available.
if (labelManager && typeof labelManager.getLabels === "function") {
  try {
    const currentLabels = labelManager.getLabels();
    console.log(
      `[Init] Attempting to mark labels ready with ${Object.keys(currentLabels ?? {}).length} labels...`,
    );
    markReady("labels", currentLabels); // Signal readiness and pass data
    console.log("[Init] 'labels' marked as ready.");
  } catch (error) {
    console.error("❌ Error getting or marking labels ready:", error);
  }
} else {
  console.error(
    "❌ Cannot mark labels ready: labelManager or getLabels() not available.",
  );
}

// --- Debugger Setup ---
// Wait until the main 3D group for rooms ('roundedRoomsGroup') is ready before initializing the debugger.
whenReady("roundedRoomsGroup", (group) => {
  console.log("[Debugger Init] Prerequisite 'roundedRoomsGroup' is ready.");

  // --- Step 1: Basic Validation ---
  if (!(scene instanceof THREE.Scene)) {
    console.error("❌ Debugger Setup Aborted: Invalid 'scene' object.");
    return;
  }
  if (!(setup.cam instanceof THREE.Camera)) {
    console.error("❌ Debugger Setup Aborted: Invalid 'setup.cam' object.");
    return;
  }
  if (!setup.orbCtrls || typeof setup.orbCtrls.update !== "function") {
    console.error(
      "❌ Debugger Setup Aborted: Invalid 'setup.orbCtrls' object.",
    );
    return;
  }
  if (!group) {
    console.warn("❌ Debugger Setup Warning: 'group' object missing.");
  }

  // --- Step 2: Initialize Debugger Instance ---
  try {
    // Create the instance, passing scene, camera, controls, and the shared debugSettings state
    debuggerInstance = new Debugger(
      scene,
      setup.cam,
      setup.orbCtrls,
      debugSettings,
    );
    window.debugger = debuggerInstance; // Optional global access
    console.log("🐛 Debugger initialized successfully.");

    // Set initial visibility based on the flag
    if (!isDebugModeActive) {
      console.log("[Debugger Init] Hiding debug UI panels initially.");
      toggleDebugUI(false); // Assumes toggleDebugUI is defined above
    }

    // --- Step 3: Update Debugger Object Picker (When roomMeshes are ready) ---
    whenReady("roomMeshes", (meshesMap) => {
      console.log("[Debugger Update] Dependency 'roomMeshes' is ready.");

      if (
        !debuggerInstance ||
        typeof debuggerInstance.updateObjectPickerOptions !== "function"
      ) {
        console.warn(
          "Debugger instance or update method missing. Skipping picker update.",
        );
        return;
      }
      if (
        !meshesMap ||
        typeof meshesMap !== "object" ||
        Object.keys(meshesMap).length === 0
      ) {
        console.warn(
          "Debugger: Invalid or empty 'meshesMap'. Skipping picker update.",
        );
        return;
      }

      // Format data for Tweakpane { 'Display Name': uuid }
      const formattedMeshes = {};
      let validMeshCount = 0;
      Object.entries(meshesMap).forEach(([id, mesh]) => {
        if (mesh instanceof THREE.Object3D) {
          formattedMeshes[mesh.name || id] = mesh.uuid;
          validMeshCount++;
        }
      });

      // Update the picker
      if (validMeshCount > 0) {
        debuggerInstance.updateObjectPickerOptions(formattedMeshes);
        console.log(
          `🐛 Debugger object picker updated (${validMeshCount} rooms).`,
        );
      } else {
        console.warn("Debugger: No valid meshes found for picker.");
      }
    }); // End whenReady roomMeshes
  } catch (error) {
    console.error("❌ Error initializing Debugger instance:", error);
    debuggerInstance = null;
  }
}); // End whenReady roundedRoomsGroup

// --- Wait for Critical Operations, then Hide Loader ---
// This ensures the main 3D structure is loaded and initial HA data is processed
// before removing the loading screen.
console.log(
  "[Init] Setting up Promise.all to wait for rooms and initial states processing...",
);
Promise.all([roomsReadyPromise, initialStatesReadyPromise])
  .then(() => {
    // This block executes only if BOTH roomsReadyPromise AND initialStatesReadyPromise resolve.
    console.log(">>> Promise.all RESOLVED successfully!");
    console.log(
      "✅ Core async initializations complete (Rooms Loaded, Initial HA States Processed).",
    );
    // Now it's safe to hide the loader.
    if (loader && typeof loader.complete === "function") {
      loader.complete();
    } else {
      console.error(
        "Loader not available or 'complete' method missing when trying to hide.",
      );
      // Attempt manual removal as fallback
      const loaderElement = document.getElementById("loader");
      loaderElement?.remove();
    }
  })
  .catch((error) => {
    // This block executes if EITHER roomsReadyPromise OR initialStatesReadyPromise rejects.
    console.error(">>> Promise.all REJECTED!");
    console.error("❌ Error during core initialization:", error);
    // Update the loader to show a persistent error message.
    if (loader && typeof loader.updateText === "function") {
      loader.updateText(`Initialization Error: ${error || "Unknown error"}`);
    } else {
      // Fallback alert if loader is unavailable
      alert(`Initialization Error: ${error || "Unknown error"}`);
    }
    // Consider leaving the loader visible or adding a dedicated error overlay.
  });

// --- Animation Loop ---
// The main render cycle for the application.
function loop() {
  // Schedule the next frame. MUST be the first line for smooth animation.
  requestAnimationFrame(loop);

  // --- Start FPS Measurement --- (if debugger is initialized)
  debuggerInstance?.updateFpsGraph?.();

  // --- Update Controls & Stats ---
  // Update camera controls (essential for damping/transitions).
  setup.orbCtrls?.update();
  // Update Stats panel (only needed for standard Stats.js, not StatsGLPanel with init).
  // setup.stats?.update();

  // --- Update Dynamic Scene Elements ---
  // Update label positions based on camera view, but only if enabled via debugger.
  if (debugSettings.enableLabelUpdates && labelManager?.updateLabelPositions) {
    labelManager.updateLabelPositions(setup.cam);
  }

  // --- Render the Scene ---
  // Ensure all core components are ready before attempting to render.
  if (setup.re && scene && setup.cam) {
    setup.re.render(scene, setup.cam);
  }

  // --- End FPS Measurement --- (if debugger is initialized)
  debuggerInstance?.endFpsGraph?.();
}

// --- Start the Animation Loop ---
console.log("🚀 Starting animation loop...");
loop(); // Kick off the rendering cycle

// --- END OF FILE main.js ---
