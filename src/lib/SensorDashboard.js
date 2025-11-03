// --- START OF FILE SensorDashboard.js (Categorised) ---

import {
  cleanedLabelRegistry,
  labelCategories,
} from "@data/labelCollections.js";

export class SensorDashboard {
  constructor(containerId = "sensordashboardID") {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn(
        `[SensorDashboard] Container element with ID '${containerId}' not found. Dashboard will not function.`,
      );
      this.container = document.createElement("div");
      this.container.id = containerId;
      document.body.appendChild(this.container);
    }

    this.registry = cleanedLabelRegistry;
    this.categories = labelCategories.filter((category) =>
      Object.values(this.registry).some(
        (entry) => entry.category === category.key,
      ),
    );
    this.sections = new Map();
    this.sensors = {}; // entity_id => { element, valueSpan, category }

    this.container.innerHTML = "";
    this.container.classList.add("sensor-dashboard");
    this.buildCategorySections();
    console.log(`[SensorDashboard] Initialized for container #${containerId}`);
  }

  buildCategorySections() {
    this.categories.forEach((category) => {
      const section = document.createElement("section");
      section.className = "sensor-dashboard__category";
      section.dataset.category = category.key;

      const header = document.createElement("header");
      header.className = "sensor-dashboard__header";
      const icon = document.createElement("img");
      icon.src = `/icons/${category.icon}.svg`;
      icon.alt = "";
      icon.width = 18;
      icon.height = 18;
      const title = document.createElement("span");
      title.textContent = category.label;
      header.append(icon, title);

      const list = document.createElement("ul");
      list.className = "sensor-dashboard__list";

      section.append(header, list);
      this.container.appendChild(section);
      this.sections.set(category.key, { section, list });
    });
  }

  update(entity) {
    if (
      !this.container ||
      !entity ||
      typeof entity !== "object" ||
      !entity.entity_id
    ) {
      console.warn(
        "[SensorDashboard] Update called with invalid entity or missing container.",
      );
      return;
    }

    const id = entity.entity_id;
    const metadata = this.registry[id];
    if (!metadata) return; // Only display sensors we have metadata for

    const categoryKey = metadata.category;
    const section = this.sections.get(categoryKey);
    if (!section) return;

    const value = entity.state ?? "N/A";
    const unit = entity.attributes?.unit_of_measurement || "";
    const displayValue = `${value} ${unit}`.trim();

    if (!this.sensors[id]) {
      const item = document.createElement("li");
      item.className = "sensor-dashboard__item";
      item.dataset.entityId = id;

      const name = document.createElement("span");
      name.className = "sensor-dashboard__item-label";
      name.textContent = metadata.label;

      const valueSpan = document.createElement("span");
      valueSpan.className = "sensor-dashboard__item-value";
      valueSpan.textContent = displayValue;

      item.append(name, valueSpan);
      section.list.appendChild(item);

      this.sensors[id] = {
        element: item,
        valueSpan,
        category: categoryKey,
      };
      console.log(`[SensorDashboard] Added entry for: ${id}`);
    } else {
      const sensorRef = this.sensors[id];
      sensorRef.valueSpan.textContent = displayValue;
      sensorRef.element.classList.add("updated");
      setTimeout(() => {
        sensorRef.element?.classList.remove("updated");
      }, 400);
    }
  }

  clear() {
    this.sections.forEach(({ list }) => {
      list.innerHTML = "";
    });
    this.sensors = {};
    console.log("[SensorDashboard] Cleared all sensor entries.");
  }
}

// --- END OF FILE SensorDashboard.js (Categorised) ---
