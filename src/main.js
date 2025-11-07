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
  attachSetup,
  labelManager,
  layoutManager,
  updateSunFromEntity,
  updateMoonFromEntity,
  setHoveredEntity,
  clearHoveredEntity,
  setSelectedEntity,
  clearSelectedEntity,
  highlightRoomByKey,
  clearRoomHighlightByKey,
  focusEntity,
} from "@/scene.js";
import { SensorDashboard } from "@lib/SensorDashboard.js";
import { createPanelsFromData } from "@lib/PanelBuilder.js";
import { WebSocketStatus } from "@network/WebSocketStatus.js";
import { setHaStates, updateEntityState } from "@home_assistant/haState.js";
import {
  fetchEntityHistory,
  requestEntityRefresh,
  isHaApiConfigured,
} from "@home_assistant/haClient.js";
import { ViewHero } from "@molecules/ViewHero.js";
import { uilController } from "@ui/UILController.js";
import { registerNavigationControls } from "@ui/modules/NavigationControls.js";
import { registerLightingControls } from "@ui/modules/LightingControls.js";
import { registerSunSkyControls } from "@ui/modules/SunSkyControls.js";
import { registerDebuggerControls } from "@ui/modules/DebuggerControls.js";
import { registerOrbitDebugControls } from "@ui/modules/OrbitDebugControls.js";
import { registerRoomLevelsControls } from "@ui/modules/RoomLevelsControls.js";
import { CanvasUILPanels } from "@ui/modules/CanvasUILPanels.js";
import { PostProcessor } from "@/postprocessing/PostProcessor.js";
import { CSSHudManager } from "@hud/CSSHudManager.js";
import { dataPipeline } from "@data/DataPipeline.js";
import { RoomSelectionController } from "@interaction/RoomSelectionController.js";

// --- Global Variables / State ---

let initialStatesReceived = false;
const initialStatesProcessedSignal = createSignal(); // Signal for when initial states are done
window.roomMeshes = {};
let sensorDashboardInstance = null;
let toolbarInstance = null;
let postProcessor = null;
let hudManager = null;
let roomSelectionController = null;

const hydrateSensorDashboard = (entities = []) => {
  if (!sensorDashboardInstance || !Array.isArray(entities)) return;
  entities.forEach((entity) => sensorDashboardInstance.update(entity));
};

const normalizeRoomId = (value) =>
  typeof value === "string" ? value.toLowerCase().replace(/[^a-z0-9]/g, "") : null;

const DEFAULT_HISTORY_WINDOW_HOURS = 6;

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
const viewHeroRoot = document.getElementById("view-hero-root");
const uilRoot = document.getElementById("uil-root");
const viewHero = new ViewHero({
  mount: viewHeroRoot,
  eyebrow: "Smart Campus",
  title: "3D CODE Floorplan",
  subtitle:
    "Navigate the live campus replica, inspect rooms, and track real-time telemetry.",
  status: {
    label: "Telemetry Pending",
    tone: "warning",
  },
});

panelShell?.classList.remove("is-open");
contentArea?.classList.remove("is-open");
panelIndicators?.classList.remove("is-open");
floatingBtn?.classList.remove("active");

const buildRoomEntityMap = () => {
  const anchors = labelManager?.getAnchors?.();
  const map = new Map();
  if (!anchors) return map;
  Object.entries(anchors).forEach(([entityId, anchor]) => {
    const normalizedRoom = normalizeRoomId(anchor?.userData?.room);
    if (normalizedRoom && !map.has(normalizedRoom)) {
      map.set(normalizedRoom, entityId);
    }
  });
  return map;
};

function initRoomSelectionController() {
  if (!setup?.cam || !canvas) return;
  const meshes = window.roomMeshes;
  if (!meshes || !Object.keys(meshes).length) return;

  const roomEntityMap = buildRoomEntityMap();
  const resolver = (roomKey) => roomEntityMap.get(roomKey ?? "");

  const hoverHandler = ({ roomKey, entityId } = {}) => {
    if (entityId) {
      setHoveredEntity(entityId);
      return;
    }
    if (roomKey) {
      highlightRoomByKey(roomKey);
    }
  };

  const hoverOutHandler = ({ roomKey, entityId } = {}) => {
    if (entityId) {
      clearHoveredEntity(entityId);
      return;
    }
    if (roomKey) {
      clearRoomHighlightByKey(roomKey);
    }
  };

  const selectHandler = ({ roomKey, entityId } = {}) => {
    if (entityId) {
      setSelectedEntity(entityId);
      focusEntity(entityId, { duration: 0.85 });
      return;
    }
    if (roomKey) {
      highlightRoomByKey(roomKey);
    }
  };

  const selectClearHandler = ({ roomKey, entityId } = {}) => {
    if (entityId) {
      clearSelectedEntity();
      return;
    }
    if (roomKey) {
      clearRoomHighlightByKey(roomKey);
    }
  };

  if (roomSelectionController) {
    roomSelectionController.updateEntityResolver(resolver);
    roomSelectionController.updateInteractiveMeshes();
    return;
  }

  roomSelectionController = new RoomSelectionController({
    camera: setup.cam,
    scene,
    domElement: canvas,
    getRoomMeshes: () => window.roomMeshes,
    getEntityIdForRoom: resolver,
    onHoverRoom: hoverHandler,
    onHoverOut: hoverOutHandler,
    onSelectRoom: selectHandler,
    onSelectClear: selectClearHandler,
  });
}

// --- Setup 3D Environment ---
const setup = new Setup(canvas, () => {
  if (postProcessor) {
    postProcessor.setSize(canvas.clientWidth, canvas.clientHeight);
  }
});

setup.setEnvMap("/hdri/night1k.hdr");
attachSetup(setup);
const navigationController = uilController;
navigationController.init({
  mount: uilRoot,
  width: 300,
  theme: { accent: "#2dd4bf" },
});

registerNavigationControls({ setup, controller: navigationController });
registerOrbitDebugControls({
  controller: navigationController,
  setup,
});
whenReady("roomMeshes", (meshesMap) => {
  registerDebuggerControls({
    controller: navigationController,
    roomMeshes: meshesMap,
    setup,
    scene,
  });
});

registerLightingControls({
  controller: navigationController,
  postFX: scene.userData.postFX,
  setup,
});
registerSunSkyControls({
  controller: navigationController,
  sunDebug: scene.userData.sunDebug,
});
whenReady("roundedRoomsGroup", (group) => {
  registerRoomLevelsControls({
    controller: navigationController,
    group,
  });
  const canvasPanels = new CanvasUILPanels({
    scene,
    camera: setup.cam,
    controls: setup.orbCtrls,
    canvas,
    setup,
    sunDebug: scene.userData.sunDebug,
    postFX: scene.userData.postFX,
    anchor: group,
  });
  canvasPanels.init();
});

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
  }

  if (sensorDashboardInstance) {
    console.log(
      "[handleInitialStates] Populating Sensor Dashboard with initial states...",
    );
    const dashboardEntities = states.filter((entity) => {
      const id = entity.entity_id || "";
      return id.startsWith("sensor.") || id.startsWith("binary_sensor.");
    });
    dashboardEntities.forEach((entity) => {
      sensorDashboardInstance.update(entity);
    });
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
    <button class="action-button" type="button" data-action="history" title="Render a chart from Home Assistant history">
      History Chart
    </button>
    <button class="action-button primary" type="button" data-action="refresh" title="Ask Home Assistant to refresh this entity">
      Refresh
    </button>
  `;
  modalContent.appendChild(actions);

  const chartSection = document.createElement("div");
  chartSection.className = "detail-section detail-chart";
  chartSection.innerHTML = `
    <div class="detail-chart__header">
      <h3>History Chart</h3>
      <span class="detail-chart__range">Last ${DEFAULT_HISTORY_WINDOW_HOURS}h</span>
    </div>
  `;
  const chartBody = document.createElement("div");
  chartBody.className = "detail-chart__body";
  chartBody.innerHTML =
    '<p class="detail-chart__placeholder">Run “History Chart” to fetch live data from Home Assistant.</p>';
  chartSection.appendChild(chartBody);
  modalContent.appendChild(chartSection);

  const footer = document.createElement("div");
  footer.className = "detail-footer detail-footer--neutral";
  const footerMessage = document.createElement("span");
  footerMessage.className = "detail-footer__message";
  footer.appendChild(footerMessage);
  modalContent.appendChild(footer);

  const setFooterMessage = (message, tone = "neutral") => {
    footer.classList.remove(
      "detail-footer--info",
      "detail-footer--success",
      "detail-footer--error",
      "detail-footer--neutral",
    );
    footer.classList.add(`detail-footer--${tone}`);
    footerMessage.textContent = message;
  };

  const apiReady = isHaApiConfigured();
  setFooterMessage(
    apiReady
      ? "Actions ready."
      : "Set VITE_HA_URL + VITE_HA_TOKEN to enable HA actions.",
    apiReady ? "neutral" : "error",
  );

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
  const historyButton = actions.querySelector('[data-action="history"]');
  const refreshButton = actions.querySelector('[data-action="refresh"]');

  const addPressEffect = (button) => {
    if (!button) return;
    button.addEventListener("click", function () {
      this.classList.add("clicked");
      setTimeout(() => this.classList.remove("clicked"), 200);
    });
  };

  addPressEffect(historyButton);
  addPressEffect(refreshButton);

  if (!apiReady) {
    [historyButton, refreshButton].forEach((btn) => {
      if (!btn) return;
      btn.disabled = true;
      btn.title = "Configure VITE_HA_URL and VITE_HA_TOKEN to enable.";
    });
    return;
  }

  const runHistoryChart = async () => {
    if (!historyButton) return;
    setFooterMessage("Fetching HA history…", "info");
    historyButton.disabled = true;
    chartSection.classList.add("detail-chart--loading");
    try {
      const samples = await fetchEntityHistory(entity.entity_id, {
        hours: DEFAULT_HISTORY_WINDOW_HOURS,
      });
      renderHistoryChart(samples, chartBody, {
        hours: DEFAULT_HISTORY_WINDOW_HOURS,
        entityName: entity.attributes?.friendly_name || entity.entity_id,
      });
      setFooterMessage(
        samples.length
          ? `Loaded ${samples.length} samples from HA.`
          : "No history returned for this window.",
        samples.length ? "success" : "neutral",
      );
    } catch (error) {
      console.error(
        `[DetailModal] History fetch failed for ${entity.entity_id}`,
        error,
      );
      chartBody.innerHTML =
        '<p class="detail-chart__error">Unable to fetch history from Home Assistant.</p>';
      setFooterMessage(error.message || "History fetch failed.", "error");
    } finally {
      chartSection.classList.remove("detail-chart--loading");
      historyButton.disabled = false;
    }
  };

  const requestRefresh = async () => {
    if (!refreshButton) return;
    setFooterMessage("Requesting entity refresh…", "info");
    refreshButton.disabled = true;
    try {
      await requestEntityRefresh(entity.entity_id);
      setFooterMessage(
        "Refresh requested. Awaiting live update from Home Assistant.",
        "success",
      );
    } catch (error) {
      console.error(
        `[DetailModal] Refresh failed for ${entity.entity_id}`,
        error,
      );
      setFooterMessage(error.message || "Refresh failed.", "error");
    } finally {
      refreshButton.disabled = false;
    }
  };

  historyButton?.addEventListener("click", runHistoryChart);
  refreshButton?.addEventListener("click", requestRefresh);
}
window.showDetailedView = showDetailedView;

function renderHistoryChart(
  samples,
  container,
  { hours = DEFAULT_HISTORY_WINDOW_HOURS, entityName = "" } = {},
) {
  if (!container) return;
  if (!Array.isArray(samples) || samples.length === 0) {
    container.innerHTML = `<p class="detail-chart__placeholder">No history returned in the past ${hours}h.</p>`;
    return;
  }

  const numericSamples = samples.filter(
    (sample) => typeof sample.value === "number",
  );

  if (!numericSamples.length) {
    const latestStates = samples
      .slice(-8)
      .reverse()
      .map(
        (sample) =>
          `<li><span>${formatChartTime(sample.timestamp)}</span><span>${sample.state}</span></li>`,
      )
      .join("");
    container.innerHTML = `
      <p class="detail-chart__placeholder">History fetched, but values are non-numeric.</p>
      <ul class="detail-chart__states">${latestStates}</ul>
    `;
    return;
  }

  const width = 360;
  const height = 140;
  const minValue = Math.min(...numericSamples.map((sample) => sample.value));
  const maxValue = Math.max(...numericSamples.map((sample) => sample.value));
  const range = maxValue - minValue || 1;
  const gradientId = `detailChartGradient-${Math.random().toString(36).slice(2, 8)}`;

  const points = numericSamples
    .map((sample, index) => {
      const x =
        numericSamples.length === 1
          ? width / 2
          : (index / (numericSamples.length - 1)) * width;
      const y =
        height - ((sample.value - minValue) / range) * (height - 12) - 6;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  container.innerHTML = `
    <svg class="detail-chart__svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="History for ${entityName}">
      <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#60a5fa" />
          <stop offset="100%" stop-color="#14b8a6" />
        </linearGradient>
      </defs>
      <polyline points="${points}" fill="none" stroke="url(#${gradientId})" stroke-width="2" vector-effect="non-scaling-stroke" />
    </svg>
    <div class="detail-chart__stats">
      <span>Min ${minValue.toFixed(2)}</span>
      <span>Max ${maxValue.toFixed(2)}</span>
      <span>Last ${numericSamples[numericSamples.length - 1].value.toFixed(2)}</span>
    </div>
  `;
}

function formatChartTime(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

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


// ========== Initial Setup Calls ==========

// --- Loader: Initialize ---
loader.updateText("Initializing...");

// --- Create promises/signals for async operations ---
// whenReady creates a promise that waits for markReady(resourceName)
const roomsReadyPromise = whenReady("roundedRoomsGroup");
const roomMeshesReadyPromise = whenReady("roomMeshes");

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

roomsReadyPromise.then(() => {
  initRoomSelectionController();
});

roomMeshesReadyPromise.then(() => {
  if (roomSelectionController) {
    roomSelectionController.updateInteractiveMeshes();
  } else {
    initRoomSelectionController();
  }
});

// --- 2. Connect Home Assistant (Async Operation Triggered by DOMContentLoaded) ---
let haStatusWidget = null;
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

  const unsubInitialised = dataPipeline.on("initialised", ({ detail }) => {
    const rawStates = Array.isArray(detail?.raw) ? detail.raw : [];
    handleInitialStates(rawStates);
    viewHero.setStatus({
      label: "Telemetry Live",
      tone: "success",
    });
  });

  const unsubEntityUpdate = dataPipeline.on(
    "entity-update",
    ({ detail }) => {
      const raw = detail?.raw;
      if (raw?.entity_id) {
        handleEntityUpdate(raw.entity_id, raw);
      }
    },
  );

  const unsubSocketOpen = dataPipeline.on("socket-open", () => {
    if (haStatusWidget) {
      haStatusWidget.setStatus("connected");
    }
    viewHero.setStatus({
      label: "Connected",
      tone: "info",
    });
  });

  const unsubSocketError = dataPipeline.on("socket-error", ({ detail }) => {
    console.error("[DataPipeline] WebSocket reported an error:", detail);
    haStatusWidget?.setStatus("error");
    viewHero.setStatus({
      label: "Connection Error",
      tone: "danger",
    });
  });

  const unsubSocketClose = dataPipeline.on(
    "socket-close",
    ({ detail: { code, reason } = {} }) => {
      console.warn(
        `[DataPipeline] WebSocket closed (${code ?? "n/a"} ${reason ?? ""})`,
      );
      haStatusWidget?.setStatus("closed");
      viewHero.setStatus({
        label: "Disconnected",
        tone: "warning",
      });
    },
  );

  const socket = dataPipeline.connect();
  if (!socket) {
    console.error("🔴 Failed to create WebSocket instance. Check configuration.");
    loader.updateText("Error: HA Connection Failed");
    initialStatesProcessedSignal.reject("WebSocket creation failed");
    unsubInitialised();
    unsubEntityUpdate();
    unsubSocketOpen();
    unsubSocketError();
    unsubSocketClose();
  } else {
    try {
      if (!haStatusWidget) {
        haStatusWidget = new WebSocketStatus(socket);
        console.log("🟢 WebSocketStatus UI initialized.");
      }
    } catch (wsError) {
      console.error("❌ Error initializing WebSocketStatus UI:", wsError);
    }
  }
  // Note: `initialStatesProcessedSignal` resolves within handleInitialStates once the pipeline emits the initial dump.
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
