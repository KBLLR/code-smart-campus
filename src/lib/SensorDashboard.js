// --- START OF FILE SensorDashboard.js (Modified) ---

export class SensorDashboard {
  constructor(containerId = "sensordashboardID") {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn(
        `[SensorDashboard] Container element with ID '${containerId}' not found. Dashboard will not function.`,
      );
      // Optionally, create the container if it doesn't exist?
      this.container = document.createElement("div");
      this.container.id = containerId;
      document.body.appendChild(this.container); //
      return; // Exit if container is essential and not found
    }
    this.sensors = {}; // entity_id => { element: DOMElement } - Store references to created elements

    // Clear any existing content in the container
    this.container.innerHTML = "";
    // Add some basic styling or class if needed
    this.container.classList.add("containerId"); // Example class
    console.log(`[SensorDashboard] Initialized for container #${containerId}`);
  }

  /**
   * Updates the display for a specific sensor entity.
   * This method should be called externally (e.g., by handleEntityUpdate in main.js)
   * when a relevant entity's state changes.
   * @param {object} entity - The full Home Assistant entity state object.
   */
  update(entity) {
    // Ensure the container exists and the entity is valid
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

    // Optional: Filter to only display specific sensor types if desired
    if (!entity.entity_id.startsWith("sensor.")) {
      console.log(
        `[SensorDashboard] Skipping non-sensor entity: ${entity.entity_id}`,
      );
      return;
    }

    const id = entity.entity_id;
    // Use friendly name if available, otherwise derive from entity_id
    const name =
      entity.attributes?.friendly_name ||
      id.replace("sensor.", "").replace(/_/g, " ");
    const value = entity.state ?? "N/A"; // Use 'N/A' if state is null/undefined
    const unit = entity.attributes?.unit_of_measurement || "";
    const displayValue = `${value} ${unit}`.trim();

    // Check if the sensor entry already exists in the DOM
    if (!this.sensors[id]) {
      // Create a new element for this sensor
      const div = document.createElement("div");
      div.className = "sensor-entry"; // Add a class for styling
      div.dataset.entityId = id; // Store entity_id for potential future use
      div.innerHTML = `
        <strong title="${id}">${name}</strong>:
        <span class="sensor-value">${displayValue}</span>
      `;
      this.container.appendChild(div);
      // Store a reference to the created element (or just its value span)
      this.sensors[id] = {
        element: div,
        valueSpan: div.querySelector(".sensor-value"),
      };
      console.log(`[SensorDashboard] Added entry for: ${id}`);
    } else {
      // Update the existing element's value span
      const sensorRef = this.sensors[id];
      if (sensorRef && sensorRef.valueSpan) {
        sensorRef.valueSpan.textContent = displayValue;
        // Optional: Add a temporary highlight on update
        sensorRef.element.classList.add("updated");
        setTimeout(() => {
          sensorRef.element?.classList.remove("updated");
        }, 500); // Remove highlight after 500ms
      } else {
        console.warn(
          `[SensorDashboard] Could not find valueSpan to update for ${id}`,
        );
      }
    }
  }
  clear() {
    if (this.container) {
      this.container.innerHTML = "";
    }
    this.sensors = {};
    console.log("[SensorDashboard] Cleared all sensor entries.");
  }
}

// --- END OF FILE SensorDashboard.js (Modified) ---
