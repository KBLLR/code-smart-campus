// src/uiUpdater.js
import { getEntities, getEntityState, getFormattedEntityState } from "./homeAssistant.js";

function findRoomCardElement(roomName) {
  const dashboardPanel = document.getElementById("dashboardPanel");
  if (!dashboardPanel) return null;
  const headers = dashboardPanel.querySelectorAll("h3.text-xl.text-white");
  for (const header of headers) {
    if (header.textContent.trim() === roomName)
      return header.closest(".glass.rounded-lg.p-4");
  }
  return null;
}

function findSidebarCardElement(title) {
  const dashboardPanel = document.getElementById("dashboardPanel");
  if (!dashboardPanel) return null;
  const headers = dashboardPanel.querySelectorAll("h3.text-xl.text-white");
  for (const header of headers) {
    if (header.textContent.trim() === title)
      return header.closest(".glass.rounded-lg.p-4");
  }
  return null;
}

function updateRoomDataPoint(roomCardElement, labelText, value) {
  if (!roomCardElement || !labelText) return;
  const spans = roomCardElement.querySelectorAll("span");
  for (const span of spans) {
    if (span.textContent.trim() === labelText) {
      const valueSpan = span.nextElementSibling;
      if (valueSpan?.tagName === "SPAN") {
        valueSpan.textContent = value ?? "N/A";
        return;
      }
      break;
    }
  }
}

function updateRoomTemperatureStyle(roomCardElement, temperature) {
  if (!roomCardElement) return;
  roomCardElement.classList.remove("temp-normal", "temp-warm", "temp-cold");
  if (temperature === null || isNaN(temperature)) {
    roomCardElement.classList.add("temp-normal");
    return;
  }
  const WARM_THRESHOLD = 23.5;
  const COLD_THRESHOLD = 21.0; // Adjust as needed
  if (temperature > WARM_THRESHOLD) roomCardElement.classList.add("temp-warm");
  else if (temperature < COLD_THRESHOLD)
    roomCardElement.classList.add("temp-cold");
  else roomCardElement.classList.add("temp-normal");
}

function updateDeviceStatus(
  parentElement,
  deviceNameSelector,
  state,
  value = null,
) {
  if (!parentElement) return;
  const nameElement = parentElement.querySelector(deviceNameSelector);
  if (!nameElement) return;
  const deviceContainer = nameElement.closest(
    ".status-on, .status-off, .status-unavailable, .status-idle, .bg-black.bg-opacity-20, .grid > div",
  ); // Refine selector
  const statusValueSpan = nameElement
    .closest("div")
    ?.querySelector(".font-medium");
  if (!deviceContainer) {
    console.warn(
      `UI Updater: Container not found for selector "${deviceNameSelector}"`,
    );
    return;
  }

  let displayStatusText = value;
  if (displayStatusText === null || displayStatusText === undefined) {
    displayStatusText = state
      ? `${state.charAt(0).toUpperCase()}${state.slice(1)}`
      : "N/A";
  }
  if (state === "unavailable") displayStatusText = "Unavailable";
  if (state === "on") displayStatusText = "On";
  if (state === "off") displayStatusText = "Off";
  if (state === "printing") displayStatusText = "Printing";
  if (state === "idle") displayStatusText = "Idle";
  if (state === "occupied") displayStatusText = "Occupied";
  if (state === "detected") displayStatusText = "Detected";

  if (statusValueSpan && !statusValueSpan.textContent.includes("%"))
    statusValueSpan.textContent = displayStatusText;
  deviceContainer.classList.remove(
    "status-on",
    "status-off",
    "status-unavailable",
    "status-idle",
    "text-green-400",
    "text-red-300",
  );
  if (statusValueSpan)
    statusValueSpan.classList.remove("text-green-400", "text-red-300");
  switch (state?.toLowerCase()) {
    case "on":
    case "printing":
    case "occupied":
    case "detected":
      deviceContainer.classList.add("status-on");
      if (statusValueSpan) statusValueSpan.classList.add("text-green-400");
      break;
    case "off":
      if (statusValueSpan)
        statusValueSpan.classList.remove("text-green-400", "text-red-300");
      break;
    case "unavailable":
      deviceContainer.classList.add("status-unavailable");
      if (statusValueSpan) statusValueSpan.classList.add("text-red-300");
      break;
    case "idle":
      deviceContainer.classList.add("status-idle");
      break;
    default:
      if (statusValueSpan)
        statusValueSpan.classList.remove("text-green-400", "text-red-300");
      break;
  }
}

function updateOctoPrintProgress(octoPrintContainer, progressPercent) {
  if (!octoPrintContainer) return;
  const progressBar = octoPrintContainer.querySelector(".progress-value");
  const progressSpan = Array.from(
    octoPrintContainer.querySelectorAll(".font-medium"),
  ).find((span) => span.textContent.includes("%"));
  if (progressBar) {
    const percent =
      progressPercent === null || isNaN(progressPercent)
        ? 0
        : Math.max(0, Math.min(100, progressPercent));
    progressBar.style.width = `${percent}%`;
    if (progressSpan) progressSpan.textContent = `${percent.toFixed(2)}%`;
  }
}

function updateRoomListPanel() {
  const roomListElement = document.getElementById("room-list");
  if (!roomListElement) return;
  const roomItems = roomListElement.querySelectorAll(".room-item");
  roomItems.forEach((item) => {
    const statusDot = item.querySelector(".room-status");
    const roomId = item.dataset.statusTargetFor || item.dataset.roomId; // Use specific target marker if present
    if (!roomId || !statusDot) return;
    const areaId = roomId;
    let representativeEntityState = "off";
    let isUnavailable = false;
    const entitiesInArea = Object.values(getEntities()).filter(
      (e) => e.area_id === areaId,
    );
    if (entitiesInArea.length > 0) {
      if (entitiesInArea.some((e) => e.state === "unavailable"))
        isUnavailable = true;
      else {
        const occupancySensor = entitiesInArea.find(
          (e) =>
            e.entity_id.startsWith("binary_sensor.") &&
            (e.attributes?.device_class === "occupancy" ||
              e.entity_id.includes("occupancy")),
        );
        const lightOrSwitchOn = entitiesInArea.find(
          (e) =>
            (e.entity_id.startsWith("light.") ||
              e.entity_id.startsWith("switch.")) &&
            e.state === "on",
        );
        if (occupancySensor?.state === "on") representativeEntityState = "on";
        else if (lightOrSwitchOn) representativeEntityState = "on";
      }
    }
    statusDot.classList.remove("occupied", "alert");
    if (isUnavailable) statusDot.classList.add("alert");
    else if (representativeEntityState === "on")
      statusDot.classList.add("occupied");
  });
}

export function updateDashboardUI() {
  const dashboardPanel = document.getElementById("dashboardPanel");
  const isDashboardPresent = !!dashboardPanel;
  const isDashboardVisible =
    isDashboardPresent &&
    (dashboardPanel.closest("#dashboard")?.classList.contains("open") ||
      dashboardPanel.closest("#dashboard")?.style.display !== "none");
  try {
    updateRoomListPanel();
  } catch (error) {
    console.error("UI Updater Error (Room List):", error);
  }
  if (!isDashboardPresent || !isDashboardVisible) return;

  const getState = (entityId, formatted = false) => {
    const entity = getEntityState(entityId);
    if (!entity) return formatted ? "N/A" : null;
    return formatted ? getFormattedEntityState(entityId) : entity.state;
  };
  const getNumericState = (entityId) => {
    const state = getState(entityId);
    if (
      state === null ||
      state === "unavailable" ||
      state === "unknown" ||
      (typeof state !== "string" && typeof state !== "number")
    )
      return null;
    const num = parseFloat(state);
    return isNaN(num) ? null : num;
  };

  // --- CRITICAL: Replace ALL entity IDs below with YOUR actual HA entity IDs ---
  try {
    const roomB3Card = findRoomCardElement("Room B.3");
    if (roomB3Card) {
      const t = getNumericState("sensor.b3_temperature");
      updateRoomDataPoint(
        roomB3Card,
        "Temperature",
        getState("sensor.b3_temperature", true),
      );
      updateRoomDataPoint(
        roomB3Card,
        "Humidity",
        getState("sensor.b3_humidity", true),
      );
      updateRoomTemperatureStyle(roomB3Card, t);
    }
    const roomB4Card = findRoomCardElement("Room B.4");
    if (roomB4Card) {
      const t = getNumericState("sensor.b4_temperature");
      updateRoomDataPoint(
        roomB4Card,
        "Temperature",
        getState("sensor.b4_temperature", true),
      );
      updateRoomDataPoint(
        roomB4Card,
        "Humidity",
        getState("sensor.b4_humidity", true),
      );
      updateRoomTemperatureStyle(roomB4Card, t);
    }
    const roomB5Card = findRoomCardElement("Room B.5");
    if (roomB5Card) {
      const t = getNumericState("sensor.b5_temperature");
      updateRoomDataPoint(
        roomB5Card,
        "Temperature",
        getState("sensor.b5_temperature", true),
      );
      updateRoomDataPoint(
        roomB5Card,
        "Humidity",
        getState("sensor.b5_humidity", true),
      );
      updateRoomTemperatureStyle(roomB5Card, t);
    }
    const roomB6Card = findRoomCardElement("Room B.6");
    if (roomB6Card) {
      const t = getNumericState("sensor.b6_temperature");
      updateRoomDataPoint(
        roomB6Card,
        "Temperature",
        getState("sensor.b6_temperature", true),
      );
      updateRoomDataPoint(
        roomB6Card,
        "Humidity",
        getState("sensor.b6_humidity", true),
      );
      updateRoomTemperatureStyle(roomB6Card, t);
      updateDeviceStatus(
        roomB6Card,
        "span:first-child",
        getState("switch.b6_power_socket"),
      );
    } // Adjust selector
    const roomB7Card = findRoomCardElement("Room B.7");
    if (roomB7Card) {
      const t = getNumericState("sensor.b7_temperature");
      updateRoomDataPoint(
        roomB7Card,
        "Temperature",
        getState("sensor.b7_temperature", true),
      );
      updateRoomDataPoint(
        roomB7Card,
        "Humidity",
        getState("sensor.b7_humidity", true),
      );
      updateRoomTemperatureStyle(roomB7Card, t);
    }
    const roomA6Card = findRoomCardElement("Room A.6");
    if (roomA6Card) {
      const t = getNumericState("sensor.a6_temperature");
      updateRoomDataPoint(
        roomA6Card,
        "Temperature",
        getState("sensor.a6_temperature", true),
      );
      updateRoomDataPoint(
        roomA6Card,
        "Humidity",
        getState("sensor.a6_humidity", true),
      );
      updateRoomTemperatureStyle(roomA6Card, t);
    }
    const roomB12Card = findRoomCardElement("Room B.12");
    if (roomB12Card) {
      const t = getNumericState("sensor.b12_temperature");
      updateRoomDataPoint(
        roomB12Card,
        "Temperature",
        getState("sensor.b12_temperature", true),
      );
      updateRoomDataPoint(
        roomB12Card,
        "Humidity",
        getState("sensor.b12_humidity", true),
      );
      updateRoomTemperatureStyle(roomB12Card, t);
    }
    const kitchenCard = findRoomCardElement("Kitchen");
    if (kitchenCard) {
      const t = getNumericState("sensor.kitchen_temperature");
      updateRoomDataPoint(
        kitchenCard,
        "Temperature",
        getState("sensor.kitchen_temperature", true),
      );
      updateRoomDataPoint(
        kitchenCard,
        "Humidity",
        getState("sensor.kitchen_humidity", true),
      );
      updateRoomTemperatureStyle(kitchenCard, t);
    }
    const teamHQCard = findRoomCardElement("Team HQ");
    if (teamHQCard) {
      const t = getNumericState("sensor.teamhq_temperature");
      updateRoomDataPoint(
        teamHQCard,
        "Temperature",
        getState("sensor.teamhq_temperature", true),
      );
      updateRoomDataPoint(
        teamHQCard,
        "Humidity",
        getState("sensor.teamhq_humidity", true),
      );
      updateRoomTemperatureStyle(teamHQCard, t);
    }

    const makerSpaceCard = findSidebarCardElement("MakerSpace");
    if (makerSpaceCard) {
      const t = getNumericState("sensor.makerspace_temperature");
      updateRoomDataPoint(
        makerSpaceCard,
        "Temperature",
        getState("sensor.makerspace_temperature", true),
      );
      updateRoomDataPoint(
        makerSpaceCard,
        "Humidity",
        getState("sensor.makerspace_humidity", true),
      );
      updateRoomTemperatureStyle(makerSpaceCard, t);
      updateRoomDataPoint(
        makerSpaceCard,
        "Air Quality (PM2.5)",
        getState("sensor.makerspace_pm25", true),
      );
      updateRoomDataPoint(
        makerSpaceCard,
        "VOC Index",
        getState("sensor.makerspace_voc_index", true),
      );
      updateDeviceStatus(
        makerSpaceCard,
        "span:only-child",
        getState("binary_sensor.makerspace_occupancy"),
      ); // Adjust selector
      const octoPrintContainer = makerSpaceCard.querySelector(
        ".bg-black.bg-opacity-20",
      );
      if (octoPrintContainer) {
        const op_s = getState("sensor.octoprint_current_state");
        const op_p = getNumericState("sensor.octoprint_job_percentage");
        const op_f = getState("sensor.octoprint_estimated_finish_time", true);
        updateDeviceStatus(
          octoPrintContainer,
          "h4 + div > div:nth-child(1) > span:nth-child(1)",
          op_s,
        );
        updateOctoPrintProgress(octoPrintContainer, op_p);
        updateRoomDataPoint(octoPrintContainer, "Est. Finish", op_f);
      } // Adjust selector
      updateDeviceStatus(
        makerSpaceCard,
        "div.grid > div:nth-child(1) > div",
        getState("light.makerspace_ikea_driver_1"),
      );
      updateDeviceStatus(
        makerSpaceCard,
        "div.grid > div:nth-child(2) > div",
        getState("light.makerspace_ikea_driver_2"),
      );
      updateDeviceStatus(
        makerSpaceCard,
        "div.grid > div:nth-child(3) > div",
        getState("light.makerspace_ikea_driver_3"),
      );
      updateDeviceStatus(
        makerSpaceCard,
        "div.grid > div:nth-child(4) > div",
        getState("light.makerspace_laser_light"),
      );
      updateDeviceStatus(
        makerSpaceCard,
        "div.grid > div:nth-child(5) > div",
        getState("light.makerspace_ikea_driver_4"),
      );
      updateDeviceStatus(
        makerSpaceCard,
        "div.grid > div:nth-child(6) > div",
        getState("media_player.makerspace_speaker"),
      );
      updateDeviceStatus(
        makerSpaceCard,
        "div.grid > div:nth-child(7) > div",
        getState("switch.makerspace_smart_plug_1"),
      );
      updateDeviceStatus(
        makerSpaceCard,
        "div.grid > div:nth-child(8) > div",
        getState("switch.makerspace_smart_plug_2"),
      ); // Adjust selectors
    }
    const libraryCard = findSidebarCardElement("Library");
    if (libraryCard) {
      updateDeviceStatus(
        libraryCard,
        "div.text-gray-200",
        getState("switch.library_smart_plug"),
      );
    } // Adjust selector

    const lastUpdatedSpan = document.getElementById("lastUpdated");
    if (lastUpdatedSpan)
      lastUpdatedSpan.textContent = new Date().toLocaleString();
  } catch (error) {
    console.error("UI Updater Error (Dashboard Update):", error);
  }
}
