// src/lib/Response.js
export class Response {
  constructor(entity) {
    this.entity = entity;
    this.id = entity.entity_id;
    this.state = entity.state;
    this.attributes = entity.attributes || {};
    this.unit = this.attributes.unit_of_measurement || "";
    this.friendlyName = this.attributes.friendly_name || this.id;
  }

  get numeric() {
    const num = parseFloat(this.state);
    return isNaN(num) ? null : num;
  }

  get isAvailable() {
    return this.state !== "unavailable" && this.state !== "unknown";
  }

  get formatted() {
    return `${this.state} ${this.unit}`.trim();
  }

  get shortId() {
    return this.id.replace(/^sensor\./, "");
  }

  toJSON() {
    return {
      id: this.id,
      value: this.formatted,
      domain: this.domain,
      available: this.isAvailable,
      friendly_name: this.friendlyName,
    };
  }

  get domain() {
    return this.id.split(".")[0];
  }

  get changedRecently() {
    const lastChanged = new Date(this.entity.last_changed);
    const now = new Date();
    return now - lastChanged < 1000 * 60 * 5; // 5 min
  }

  get hasUnit() {
    return this.unit.length > 0;
  }

  getIcon() {
    const domain = this.domain;
    if (domain === "sensor") {
      const dc = this.attributes.device_class;
      switch (dc) {
        case "temperature":
          return "🌡️";
        case "humidity":
          return "💧";
        case "energy":
          return "⚡";
        case "power":
          return "🔌";
        case "aqi":
          return "🌫️";
      }
    }
    return "🔘";
  }

  asLogString() {
    return `${this.getIcon()} ${this.friendlyName}: ${this.formatted}`;
  }

  ifAbove(threshold, callback) {
    if (this.numeric !== null && this.numeric > threshold)
      callback(this.numeric);
  }

  ifBelow(threshold, callback) {
    if (this.numeric !== null && this.numeric < threshold)
      callback(this.numeric);
  }

  isBetween(min, max) {
    if (this.numeric === null) return false;
    return this.numeric >= min && this.numeric <= max;
  }

  isUnit(unit) {
    return this.unit.toLowerCase() === unit.toLowerCase();
  }

  isDomain(domain) {
    return this.domain === domain;
  }

  printDebug() {
    console.log(`[${this.id}] ${this.formatted} (${this.friendlyName})`);
  }
}
