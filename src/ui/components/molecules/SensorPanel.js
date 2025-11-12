/**
 * SensorPanel.js - Display live sensor data for picked classroom
 *
 * Shows room information and live sensor readings when a room is selected.
 * Used by the HADS-R09 picking interaction system.
 */

let sensorPanelElement = null;

/**
 * Show sensor data for a picked room
 * @param {string} roomId - Room identifier (e.g., 'b.3', 'kitchen')
 * @param {Object} roomData - Room metadata (name, icon, category)
 * @param {Object} sensorData - Map of sensor entity IDs to values
 */
export function showSensorPanel(roomId, roomData = {}, sensorData = {}) {
  const panel = sensorPanelElement || createSensorPanel();

  // Update header with room info
  const header = panel.querySelector('[data-panel="header"]');
  if (header) {
    const icon = roomData.icon || '🏠';
    const name = roomData.displayName || roomData.name || roomId;
    const category = roomData.category || 'Unknown';

    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span style="font-size: 1.5rem;">${icon}</span>
        <div>
          <h3 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #fff;">${name}</h3>
          <p style="margin: 0; font-size: 0.75rem; color: #888;">${category}</p>
        </div>
      </div>
    `;
  }

  // Update sensor list
  const sensorList = panel.querySelector('[data-panel="sensors"]');
  if (sensorList) {
    const sensors = Object.entries(sensorData);

    if (sensors.length === 0) {
      sensorList.innerHTML = '<p style="color: #888; font-size: 0.75rem; margin: 0.5rem 0;">No sensor data available</p>';
    } else {
      const sensorsHtml = sensors
        .map(([entityId, state]) => {
          const value = state?.state || 'unavailable';
          const unit = state?.attributes?.unit_of_measurement || '';
          const friendlyName = state?.attributes?.friendly_name || entityId;

          return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.08);">
              <span style="opacity: 0.8; font-size: 0.85rem;">${friendlyName}</span>
              <strong style="color: #0ea5e9; font-family: monospace; font-size: 0.85rem;">${value} <span style="opacity: 0.7;">${unit}</span></strong>
            </div>
          `;
        })
        .join('');

      sensorList.innerHTML = sensorsHtml;
    }
  }

  // Show panel
  panel.style.display = 'block';
  panel.style.opacity = '1';
}

/**
 * Hide the sensor panel
 */
export function hideSensorPanel() {
  if (sensorPanelElement) {
    sensorPanelElement.style.opacity = '0';
    sensorPanelElement.style.pointerEvents = 'none';
    setTimeout(() => {
      if (sensorPanelElement) {
        sensorPanelElement.style.display = 'none';
      }
    }, 150);
  }
}

/**
 * Create the sensor panel DOM element
 * @returns {HTMLElement} The sensor panel element
 */
function createSensorPanel() {
  const panel = document.createElement('div');
  panel.id = 'sensor-panel';
  panel.setAttribute('data-component', 'sensor-panel');

  // Inline styles for a glassy, modern look
  panel.style.cssText = `
    position: fixed;
    top: 1rem;
    right: 1rem;
    width: 340px;
    max-height: 65vh;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    color: white;
    padding: 1.25rem;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 0.75rem;
    font-family: 'Menlo', 'Monaco', monospace;
    font-size: 0.875rem;
    overflow-y: auto;
    z-index: 1000;
    display: none;
    opacity: 0;
    transition: opacity 150ms ease-out;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  `;

  // Scrollbar styling
  const style = document.createElement('style');
  style.textContent = `
    #sensor-panel::-webkit-scrollbar {
      width: 6px;
    }
    #sensor-panel::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 3px;
    }
    #sensor-panel::-webkit-scrollbar-thumb {
      background: rgba(14, 165, 233, 0.3);
      border-radius: 3px;
    }
    #sensor-panel::-webkit-scrollbar-thumb:hover {
      background: rgba(14, 165, 233, 0.5);
    }
  `;
  document.head.appendChild(style);

  // Panel structure
  panel.innerHTML = `
    <div data-panel="header" style="margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 0.75rem;"></div>
    <div data-panel="sensors"></div>
  `;

  document.body.appendChild(panel);
  sensorPanelElement = panel;

  return panel;
}

/**
 * Clear any existing sensor panel reference (useful for cleanup)
 */
export function disposeSensorPanel() {
  if (sensorPanelElement) {
    sensorPanelElement.remove();
    sensorPanelElement = null;
  }
}

/**
 * Get or create the sensor panel
 * @returns {HTMLElement} The sensor panel element
 */
export function getSensorPanel() {
  return sensorPanelElement || createSensorPanel();
}
