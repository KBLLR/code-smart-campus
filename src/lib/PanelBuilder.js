export function createPanelsFromData(data) {
  const contentArea = document.getElementById("content-area");
  const panelIndicators = document.querySelector(".panel-indicators");

  contentArea.innerHTML = "";
  panelIndicators.innerHTML = "";

  data.forEach((entity, index) => {
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

    const indicator = document.createElement("div");
    indicator.className = "panel-indicator" + (index === 0 ? " active" : "");
    indicator.onclick = () => {
      const scrollX = index * (contentArea.scrollWidth / data.length);
      contentArea.scrollTo({ left: scrollX, behavior: "smooth" });
    };
    panelIndicators.appendChild(indicator);
  });
}
