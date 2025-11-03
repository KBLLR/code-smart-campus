// src/ui/components/molecules/LabelModal.js
import { ScrollBoxModal } from "@molecules/ScrollBoxModal.js";
import {
  cleanedLabelRegistry,
  labelCategories,
} from "@data/labelCollections.js";

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
    const term = query.trim().toLowerCase();
    const entries = Object.entries(cleanedLabelRegistry);

    const groupedMarkup = labelCategories
      .map((category) => {
        const items = entries.filter(([, data]) => {
          if (data.category !== category.key) return false;
          if (!term) return true;
          const haystack = `${data.entityId} ${data.label} ${data.room} ${data.type}`.toLowerCase();
          return haystack.includes(term);
        });

        if (items.length === 0) return "";

        const listItems = items
          .map(([, data]) => {
            const icon = data.icon ?? category.icon;
            return `<li class="label-modal__item">
              <span class="label-modal__icon">
                <img src="/icons/${icon}.svg" alt="" width="16" height="16" />
              </span>
              <span class="label-modal__text">
                <strong>${data.label}</strong>
                <small>${data.room}</small>
              </span>
            </li>`;
          })
          .join("");

        return `<section class="label-modal__group">
            <header class="label-modal__group-header">
              <img src="/icons/${category.icon}.svg" alt="" width="18" height="18" />
              <span>${category.label} <sup>${items.length}</sup></span>
            </header>
            <ul class="label-modal__list">${listItems}</ul>
          </section>`;
      })
      .filter(Boolean)
      .join("");

    this.modal.setContent(
      groupedMarkup ||
        "<p style='color: rgba(255,255,255,0.7);'>No labels match your search.</p>",
    );
    this.modal.show();
  }
}

// ✅ Define this *after* the class is declared
export function showLabelInfoModal() {
  new LabelModal().renderList();
}
