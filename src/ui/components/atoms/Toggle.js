// src/ui/components/atoms/Toggle.js
export class Toggle {
  constructor({
    id,
    icon,
    label,
    onToggle,
    initialState = true,
    iconOn,
    iconOff,
    labelOn,
    labelOff,
  }) {
    this.state = initialState;
    this.onToggle = onToggle;
    this.iconOn = iconOn || icon;
    this.iconOff = iconOff || icon;
    this.labelOn = labelOn || label;
    this.labelOff = labelOff || label;

    this.button = document.createElement("button");
    this.button.id = id;
    this.button.className = "toggle-button";
    this.button.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      background: #222;
      color: white;
      padding: 8px 16px;
      border-radius: 999px;
      border: none;
      cursor: pointer;
    `;

    this.iconEl = document.createElement("img");
    this.iconEl.width = 16;
    this.iconEl.height = 16;
    this.iconEl.alt = "toggle icon";

    this.labelEl = document.createElement("span");

    this.button.appendChild(this.iconEl);
    this.button.appendChild(this.labelEl);

    this.button.addEventListener("click", () => this.toggle());
    this.updateUI();
  }

  toggle() {
    this.state = !this.state;
    this.onToggle(this.state);
    this.updateUI();
  }

  updateUI() {
    this.setIcon(this.state ? this.iconOn : this.iconOff);
    this.setLabel(this.state ? this.labelOn : this.labelOff);
  }

  setIcon(iconName) {
    this.iconEl.src = `/icons/${iconName}`;
  }

  setLabel(text) {
    this.labelEl.textContent = text;
  }

  get element() {
    return this.button;
  }

  setState(state) {
    this.state = state;
    this.onToggle(this.state);
    this.updateUI();
  }

  getState() {
    return this.state;
  }
}
