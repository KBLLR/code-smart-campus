import "./sensors.css";

import { dataPipeline } from "@data/DataPipeline.js";
import { SensorDashboard } from "@lib/SensorDashboard.js";
import { WebSocketStatus } from "@network/WebSocketStatus.js";

const statusContainer = document.getElementById("websocket-status");
const summaryList = document.getElementById("category-summary");
const refreshButton = document.getElementById("refresh-button");
const categoryTitle = document.getElementById("category-title");
const categorySubtitle = document.getElementById("category-subtitle");
const dashboardContainer = document.getElementById("sensor-dashboard");

let wsWidget = null;
let dashboard = null;
let activeCategory = null;

function renderSummary(dashboardInstance) {
  if (!summaryList || !dashboardInstance) return;
  const summary = dashboardInstance.getCategorySummary();
  summaryList.innerHTML = "";

  if (!summary.length) {
    const empty = document.createElement("li");
    empty.className = "summary-card summary-card--empty";
    empty.textContent = "No sensors mapped yet. Update labelRegistry to populate this view.";
    summaryList.appendChild(empty);
    return;
  }

  summary.forEach(({ key, label, count }, index) => {
    const item = document.createElement("li");
    item.className = "summary-card";
    item.dataset.category = key;
    item.setAttribute("role", "tab");
    item.setAttribute("tabindex", "0");
    if (index === 0) {
      item.classList.add("is-active");
      activeCategory = key;
    }
    item.innerHTML = `
      <span class="summary-card__count">${count}</span>
      <span class="summary-card__label">${label}</span>
    `;
    item.addEventListener("click", () => {
      setActiveCategory(key, label);
    });
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActiveCategory(key, label);
      }
    });
    summaryList.appendChild(item);
  });
  updateDashboardCategory();
}

function applyInitialStates(states = []) {
  if (!dashboard) return;
  states.forEach((entity) => {
    dashboard.update(entity);
  });
  updateDashboardCategory();
}

function ensureDashboard() {
  if (dashboard) return dashboard;
  dashboard = new SensorDashboard("sensor-dashboard");
  renderSummary(dashboard);
  return dashboard;
}

function updateDashboardCategory() {
  if (!dashboard || !dashboardContainer) return;
  dashboard.filterByCategory(activeCategory);
  updateCategoryHeader(activeCategory);
}

function updateCategoryHeader(categoryKey) {
  if (!categoryTitle || !categorySubtitle) return;
  const summary = dashboard.getCategorySummary();
  const meta = summary.find((entry) => entry.key === categoryKey);
  if (!meta) {
    categoryTitle.textContent = "Live Sensors";
    categorySubtitle.textContent = "Select a category to filter sensors.";
    return;
  }
  categoryTitle.textContent = meta.label;
  categorySubtitle.textContent = `${meta.count} tracked sensors in this category`;
  Array.from(summaryList.children).forEach((item) => {
    item.classList.toggle("is-active", item.dataset.category === categoryKey);
  });
}

function setActiveCategory(categoryKey, label) {
  activeCategory = categoryKey;
  updateDashboardCategory();
}

function connectPipeline() {
  const socket = dataPipeline.connect();
  if (socket && !wsWidget) {
    try {
      wsWidget = new WebSocketStatus(socket, { containerId: "websocket-status" });
      if (socket.readyState === WebSocket.OPEN) {
        wsWidget.setStatus("connected");
      }
    } catch (error) {
      console.error("[Sensors Page] Failed to initialise WebSocketStatus:", error);
    }
  }
}

function bindPipelineEvents() {
  dataPipeline.on("socket-open", () => {
    wsWidget?.setStatus("connected");
  });

  dataPipeline.on("socket-error", () => {
    wsWidget?.setStatus("error");
  });

  dataPipeline.on("socket-close", () => {
    wsWidget?.setStatus("closed");
  });

  dataPipeline.on("initialised", ({ detail }) => {
    ensureDashboard();
    applyInitialStates(detail?.raw ?? []);
  });

  dataPipeline.on("entity-update", ({ detail }) => {
    ensureDashboard();
    const entity = detail?.raw;
    if (entity) {
      dashboard.update(entity);
      updateDashboardCategory();
    }
  });
}

function bindControls() {
  if (!refreshButton) return;
  refreshButton.addEventListener("click", () => {
    const snapshot = dataPipeline.getEntities();
    const raw = snapshot
      .map((entity) => dataPipeline.getRawEntity(entity.entityId))
      .filter(Boolean);
    applyInitialStates(raw);
    refreshButton.classList.add("is-active");
    setTimeout(() => refreshButton.classList.remove("is-active"), 300);
  });
}

function init() {
  ensureDashboard();
  renderSummary(dashboard);
  bindControls();
  bindPipelineEvents();
  connectPipeline();

  dataPipeline
    .untilInitialised()
    .catch(() => [])
    .then(() => {
      const existingEntities = dataPipeline.getEntities();
      if (existingEntities.length) {
        const raw = existingEntities
          .map((entity) => dataPipeline.getRawEntity(entity.entityId))
          .filter(Boolean);
        applyInitialStates(raw);
      }
    });
}

document.addEventListener("DOMContentLoaded", init);
