const STATUS_TONES = new Map([
  ["default", "view-hero__status--default"],
  ["success", "view-hero__status--success"],
  ["warning", "view-hero__status--warning"],
  ["danger", "view-hero__status--danger"],
  ["info", "view-hero__status--info"],
]);

export class ViewHero {
  /**
   * @param {{
   *   mount?: HTMLElement | null,
   *   eyebrow?: string,
   *   title?: string,
   *   subtitle?: string,
   *   status?: { label: string, tone?: string, icon?: string },
   * }} config
   */
  constructor({
    mount = null,
    eyebrow = "",
    title = "",
    subtitle = "",
    status = null,
  } = {}) {
    this.mountNode = mount || document.body;
    this.root = document.createElement("header");
    this.root.className = "view-hero";
    this.root.setAttribute("role", "presentation");

    this.content = document.createElement("div");
    this.content.className = "view-hero__content";

    this.eyebrowEl = document.createElement("p");
    this.eyebrowEl.className = "view-hero__eyebrow";
    this.content.appendChild(this.eyebrowEl);

    this.titleEl = document.createElement("h1");
    this.titleEl.className = "view-hero__title";
    this.content.appendChild(this.titleEl);

    this.subtitleEl = document.createElement("p");
    this.subtitleEl.className = "view-hero__subtitle";
    this.content.appendChild(this.subtitleEl);

    this.statusEl = document.createElement("div");
    this.statusEl.className = "view-hero__status";
    this.statusLabel = document.createElement("span");
    this.statusLabel.className = "view-hero__status-label";
    this.statusEl.appendChild(this.statusLabel);

    this.root.appendChild(this.content);
    this.root.appendChild(this.statusEl);

    this.mountNode.appendChild(this.root);

    this.setEyebrow(eyebrow);
    this.setTitle(title);
    this.setSubtitle(subtitle);

    if (status) this.setStatus(status);
    else this.statusEl.style.display = "none";
  }

  setEyebrow(value = "") {
    this.eyebrowEl.textContent = value;
    this.eyebrowEl.hidden = !value;
  }

  setTitle(value = "") {
    this.titleEl.textContent = value;
  }

  setSubtitle(value = "") {
    this.subtitleEl.textContent = value;
    this.subtitleEl.hidden = !value;
  }

  /**
   * @param {{ label?: string, tone?: string }} status
   */
  setStatus(status = null) {
    if (!status || !status.label) {
      this.statusEl.style.display = "none";
      return;
    }
    this.statusEl.style.display = "inline-flex";
    this.statusEl.classList.remove(
      ...Array.from(STATUS_TONES.values()),
    );
    const toneClass = STATUS_TONES.get(status.tone || "default");
    if (toneClass) this.statusEl.classList.add(toneClass);
    this.statusLabel.textContent = status.label;
  }
}
