// --- START OF FILE SensorDashboard.js (Categorised) ---

import {
  cleanedLabelRegistry,
  labelCategories,
} from "@data/labelCollections.js";

const CATEGORY_ORDER = labelCategories.reduce((map, category, index) => {
  map.set(category.key, { index, meta: category });
  return map;
}, new Map());

const DEFAULT_CATEGORY_META = {
  key: "misc",
  label: "Miscellaneous",
  icon: "help-circle",
  order: 999,
};

function categorySortKey(categoryKey) {
  const record = CATEGORY_ORDER.get(categoryKey);
  return record ? record.index : DEFAULT_CATEGORY_META.order;
}

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
    this.sections = new Map();
    this.sensors = {}; // entity_id => { element, valueSpan, category }
    this.entries = this._buildEntries();
    this.entriesByCategory = this._groupEntriesByCategory();

    this.container.innerHTML = "";
    this.container.classList.add("sensor-dashboard");
    this._buildCategorySections();
    this._renderEntries();

    console.log(`[SensorDashboard] Initialized for container #${containerId}`);
  }

  _buildEntries() {
    return Object.entries(this.registry)
      .filter(([entityId, entry]) => this._shouldDisplayEntry(entityId, entry))
      .map(([entityId, entry]) => ({ entityId, entry }))
      .sort((a, b) => {
        const categoryDiff =
          categorySortKey(a.entry.category) - categorySortKey(b.entry.category);
        if (categoryDiff !== 0) return categoryDiff;
        if (a.entry.priority !== b.entry.priority) {
          return a.entry.priority - b.entry.priority;
        }
        return a.entry.label.localeCompare(b.entry.label, "en", {
          sensitivity: "base",
        });
      });
  }

  _groupEntriesByCategory() {
    const map = new Map();
    this.entries.forEach(({ entityId, entry }) => {
      const category = entry.category || "misc";
      if (!map.has(category)) {
        map.set(category, []);
      }
      map.get(category).push({ entityId, entry });
    });
    return map;
  }

  getCategorySummary() {
    return Array.from(this.entriesByCategory.entries())
      .map(([key, items]) => {
        const meta = CATEGORY_ORDER.get(key)?.meta ?? {
          key,
          label: key,
        };
        return {
          key,
          label: meta.label ?? key,
          count: items.length,
        };
      })
      .sort((a, b) => categorySortKey(a.key) - categorySortKey(b.key));
  }

  _buildCategorySections() {
    labelCategories
      .filter((category) => this.entriesByCategory.has(category.key))
      .forEach((category) => {
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

  _renderEntries() {
    this.entries.forEach(({ entityId, entry }) => {
      const category = entry.category || "misc";
      const section = this.sections.get(category);
      if (!section) return;
      const item = document.createElement("li");
      item.className = "sensor-dashboard__item";
      item.dataset.entityId = entityId;

      const header = document.createElement("div");
      header.className = "sensor-dashboard__item-header";

      const name = document.createElement("span");
      name.className = "sensor-dashboard__item-label";
      name.textContent = entry.label;

      const room = document.createElement("span");
      room.className = "sensor-dashboard__item-room";
      room.textContent = entry.room ? `Room ${entry.room.toUpperCase()}` : "";

      header.append(name, room);

      const body = document.createElement("div");
      body.className = "sensor-dashboard__item-body";

      const valueSpan = document.createElement("span");
      valueSpan.className = "sensor-dashboard__item-value";
      valueSpan.textContent = "—";

      const timestamp = document.createElement("span");
      timestamp.className = "sensor-dashboard__item-timestamp";
      timestamp.textContent = "—";

      body.append(valueSpan, timestamp);
      item.append(header, body);
      section.list.appendChild(item);

      this.sensors[entityId] = {
        element: item,
        valueSpan,
        timestamp,
        category,
      };
    });
    if (!this.entries.length) {
      const fallback = document.createElement("p");
      fallback.className = "sensor-dashboard__empty";
      fallback.textContent =
        "No dashboard sensors configured. Update labelRegistry to populate this view.";
      this.container.appendChild(fallback);
    }
  }

  _shouldDisplayEntry(_entityId, entry) {
    if (!entry) return false;
    if (entry.category === "global") return false;
    return true;
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
    const sensorRef = this.sensors[id];
    if (!sensorRef) return; // Not a tracked dashboard entry

    const value = entity.state ?? "N/A";
    const unit = entity.attributes?.unit_of_measurement || "";
    const displayValue = `${value} ${unit}`.trim();
    sensorRef.valueSpan.textContent = displayValue;

    // Update timestamp
    if (sensorRef.timestamp) {
      const lastUpdated = entity.last_updated || entity.last_changed;
      if (lastUpdated) {
        try {
          const date = new Date(lastUpdated);
          const now = new Date();
          const diffMs = now - date;
          const diffMins = Math.floor(diffMs / 60000);

          let timeText;
          if (diffMins < 1) {
            timeText = "Just now";
          } else if (diffMins < 60) {
            timeText = `${diffMins}m ago`;
          } else if (diffMins < 1440) {
            const hours = Math.floor(diffMins / 60);
            timeText = `${hours}h ago`;
          } else {
            timeText = date.toLocaleDateString();
          }
          sensorRef.timestamp.textContent = timeText;
        } catch (e) {
          sensorRef.timestamp.textContent = "—";
        }
      } else {
        sensorRef.timestamp.textContent = "—";
      }
    }

    sensorRef.element.classList.add("updated");
    setTimeout(() => {
      sensorRef.element?.classList.remove("updated");
    }, 400);
  }

  filterByCategory(categoryKey) {
    const normalizedKey = categoryKey || null;
    Object.values(this.sensors).forEach(({ element, category }) => {
      const shouldShow = !normalizedKey || category === normalizedKey;
      element.style.display = shouldShow ? "flex" : "none";
    });
  }

  filterBySearch(searchText) {
    const query = (searchText || "").toLowerCase().trim();

    Object.entries(this.sensors).forEach(([entityId, { element }]) => {
      // Skip if already hidden by category filter
      if (element.style.display === "none") return;

      const entry = this.registry[entityId];
      if (!entry) {
        element.style.display = "none";
        return;
      }

      const label = entry.label?.toLowerCase() || "";
      const room = entry.room?.toLowerCase() || "";
      const id = entityId.toLowerCase();

      const matches =
        !query ||
        label.includes(query) ||
        room.includes(query) ||
        id.includes(query);

      element.style.display = matches ? "flex" : "none";
    });
  }

  applyFilters(categoryKey, searchText) {
    const normalizedCategory = categoryKey || null;
    const query = (searchText || "").toLowerCase().trim();

    Object.entries(this.sensors).forEach(([entityId, { element, category }]) => {
      const entry = this.registry[entityId];
      if (!entry) {
        element.style.display = "none";
        return;
      }

      // Check category filter
      const categoryMatches = !normalizedCategory || category === normalizedCategory;

      // Check search filter
      const label = entry.label?.toLowerCase() || "";
      const room = entry.room?.toLowerCase() || "";
      const id = entityId.toLowerCase();
      const searchMatches =
        !query ||
        label.includes(query) ||
        room.includes(query) ||
        id.includes(query);

      const shouldShow = categoryMatches && searchMatches;
      element.style.display = shouldShow ? "flex" : "none";
    });
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
