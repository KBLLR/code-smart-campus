export function createPanelsFromData(data) {
  const contentArea = document.getElementById("content-area");
  const panelIndicators = document.querySelector(".panel-indicators");

  contentArea.innerHTML = "";
  panelIndicators.innerHTML = "";

  const MAX_PANELS = 10;
  const trimmedData = data.slice(0, MAX_PANELS);
  const hasOverflow = data.length > MAX_PANELS;
  const panels = [];

  const setActiveIndicator = (index) => {
    panelIndicators
      .querySelectorAll(".panel-indicator")
      .forEach((indicator, i) => {
        indicator.classList.toggle("active", i === index);
      });
  };

  trimmedData.forEach((entity, index) => {
    const panel = document.createElement("div");
    panel.className = "hui-panel";
    panel.dataset.entityId = entity.entity_id;

    const title = document.createElement("div");
    title.className = "panel-title";
    title.textContent = entity.attributes.friendly_name || entity.entity_id;
    panel.appendChild(title);

    const state = document.createElement("div");
    state.className = "entity-state";
    state.innerHTML = entity.attributes.unit_of_measurement
      ? `<span class="state-value">${entity.state}</span><span class="state-unit">${entity.attributes.unit_of_measurement}</span>`
      : `<span class="state-value">${entity.state}</span>`;
    panel.appendChild(state);

    const progress = document.createElement("div");
    progress.className = "progress-bar";
    panel.appendChild(progress);

    const lastUpdated = document.createElement("div");
    lastUpdated.className = "last-updated";
    lastUpdated.textContent = `Last updated: ${new Date(entity.last_updated).toLocaleTimeString()}`;
    panel.appendChild(lastUpdated);

    const button = document.createElement("div");
    button.className = "virtual-button";
    button.textContent = "View Details";
    button.onclick = () => showDetailedView(entity);
    panel.appendChild(button);

    contentArea.appendChild(panel);
    panels.push(panel);

    const indicator = document.createElement("div");
    indicator.className = "panel-indicator" + (index === 0 ? " active" : "");
    indicator.onclick = () => {
      const targetPanel = panels[index];
      if (targetPanel) {
        targetPanel.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
        setActiveIndicator(index);
      }
    };
    panelIndicators.appendChild(indicator);
  });

  if (hasOverflow) {
    const summaryPanel = document.createElement("div");
    summaryPanel.className = "hui-panel hui-panel--summary";
    summaryPanel.innerHTML = `
      <div class="panel-title">Additional Sensors</div>
      <p class="panel-summary">
        Showing the first ${MAX_PANELS} entries. View all data inside the Home Assistant dashboard for the full list.
      </p>
      <button class="panel-summary__button" type="button">Open Dashboard</button>
    `;
    summaryPanel
      .querySelector(".panel-summary__button")
      .addEventListener("click", () => {
        const targetUrl =
          import.meta.env.VITE_HA_DASHBOARD_URL || "/sensors.html";
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      });
    contentArea.appendChild(summaryPanel);
    panels.push(summaryPanel);

    const summaryIndicator = document.createElement("div");
    summaryIndicator.className = "panel-indicator";
    summaryIndicator.onclick = () => {
      summaryPanel.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
      setActiveIndicator(panelIndicators.childElementCount - 1);
    };
    panelIndicators.appendChild(summaryIndicator);
  }
}
