// src/lib/RoomSensorDisplay.js
import {
  findEntityByFriendlyName,
  getFormattedState,
} from "@/home_assistant/haState.js";

export class RoomSensorDisplay {
  /**
   * Creates a display panel for sensors within a specific room/group.
   * @param {string} groupName - The name of the room or group (e.g., "Makerspace", "General").
   * @param {object} sensorDefs - The sensor definitions for this group from sensors.json ({ "Sensor Friendly Name": { data_type: "..." } }).
   * @param {string} containerSelector - CSS selector for the parent element where panels should be added.
   */
  constructor(groupName, sensorDefs, containerSelector) {
    this.groupName = groupName;
    this.sensorDefs = sensorDefs || {};
    this.container = document.querySelector(containerSelector);
    this.panelElement = null; // Reference to the created panel
    this.valueSpans = {}; // Store references to value spans { "Sensor Friendly Name": spanElement }

    if (!this.container) {
      console.error(
        `[RoomSensorDisplay] Target container "${containerSelector}" not found for group "${groupName}".`,
      );
    }
  }

  /**
   * Renders the initial panel structure and sensor entries.
   */
  render() {
    if (!this.container) return; // Don't render if container doesn't exist

    this.panelElement = document.createElement("div");
    this.panelElement.className = "hui-panel room-sensor-panel"; // Use existing class + new one
    this.panelElement.id = `room-panel-${this.groupName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`; // Create a unique ID

    // Add Title
    const titleEl = document.createElement("div");
    titleEl.className = "panel-title";
    titleEl.textContent = this.groupName;
    this.panelElement.appendChild(titleEl);

    // Add Sensor Entries
    const sensorsContainer = document.createElement("div");
    sensorsContainer.className = "room-sensor-entries"; // Class for styling the list

    for (const sensorName in this.sensorDefs) {
      const sensorEntry = document.createElement("div");
      sensorEntry.className = "room-sensor-entry"; // Class for styling individual entries

      const labelSpan = document.createElement("span");
      labelSpan.className = "room-sensor-label";
      labelSpan.textContent = `${sensorName}: `; // Display the friendly name from JSON key

      const valueSpan = document.createElement("span");
      valueSpan.className = "room-sensor-value";
      valueSpan.dataset.sensorName = sensorName; // Store name for easy update
      this.valueSpans[sensorName] = valueSpan; // Store reference

      // Try to find initial state by friendly name
      const initialEntity = findEntityByFriendlyName(sensorName);
      valueSpan.textContent = initialEntity
        ? getFormattedState(initialEntity.entity_id)
        : "Loading...";

      sensorEntry.appendChild(labelSpan);
      sensorEntry.appendChild(valueSpan);
      sensorsContainer.appendChild(sensorEntry);
    }

    this.panelElement.appendChild(sensorsContainer);
    this.container.appendChild(this.panelElement);
  }

  /**
   * Updates the displayed value for a specific sensor if it belongs to this panel.
   * @param {object} entity - The updated entity state object from Home Assistant.
   */
  update(entity) {
    if (!entity || !this.panelElement) return;

    const friendlyName = entity.attributes?.friendly_name;
    // Check if this panel is supposed to display a sensor with this friendly name
    if (friendlyName && this.sensorDefs[friendlyName]) {
      const valueSpan = this.valueSpans[friendlyName];
      if (valueSpan) {
        valueSpan.textContent = getFormattedState(entity.entity_id);
        // Optional: Add visual indication of update
        valueSpan.style.transition = "color 0.1s ease-in-out";
        valueSpan.style.color = "var(--primary)"; // Highlight briefly
        setTimeout(() => {
          if (valueSpan) valueSpan.style.color = ""; // Reset color
        }, 500);
      }
    }
  }

  /**
   * Removes the panel from the DOM.
   */
  destroy() {
    this.panelElement?.remove();
    this.panelElement = null;
    this.valueSpans = {};
  }
}
