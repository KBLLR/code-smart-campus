// src/ui/components/molecules/LabelModal.js
import { ScrollBoxModal } from "@molecules/ScrollBoxModal.js";
import { labelRegistry } from "@registries/labelRegistry.js";
import { getIconForEntity } from "@utils/entityUtils.js";

export class LabelModal {
  constructor() {
    this.modal = new ScrollBoxModal({
      title: "🧠 Auto-Generated Labels",
      subtitle: "These were dynamically added based on fuzzy matching:",
      searchable: true,
      onSearch: (q) => this.renderList(q),
      closeText: "Close",
    });

    this.renderList();
  }

  renderList(query = "") {
    const items = Object.entries(labelRegistry)
      .filter(([id, data]) => {
        const l = `${id} ${data.label} ${data.type} ${data.room}`.toLowerCase();
        return l.includes(query.toLowerCase());
      })
      .map(([id, data]) => {
        const icon = getIconForEntity(id);
        return `<li class="label-item" style="display: flex; align-items: center; gap: 6px; padding: 4px 0">
          <img src="/icons/${icon}.svg" alt="${icon}" width="16" height="16" />
          <span>${data.label} → <code>${data.room}</code></span>
        </li>`;
      });

    this.modal.setContent(
      `<ul style="padding-left: 0; list-style: none;">${items.join("")}</ul>`,
    );
    this.modal.show();
  }
}

// ✅ Define this *after* the class is declared
export function showLabelInfoModal() {
  new LabelModal().renderList();
}
