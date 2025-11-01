import { whenReady } from "@utils/initCoordinator.js";

export class WebSocketStatus {
  constructor(socket) {
    this.socket = socket;
    this.retryCount = 0;
    this.lastEventTime = null;
    this.visible = true;

    this.container = document.createElement("div");
    this.container.id = "websocket-status";
    this.container.style.cssText = `
      position: fixed;
      top: 12px;
      left: 12px;
      padding: 8px 16px;
      border-radius: 16px;
      font-size: 12px;
      font-family: monospace;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 10px;
      backdrop-filter: blur(12px);
      background: rgba(0, 0, 0, 0.55);
      box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
      color: white;
    `;

    this.indicator = document.createElement("div");
    this.indicator.style.cssText = `
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: gray;
    `;

    this.label = document.createElement("span");
    this.label.textContent = "Connecting...";

    this.container.appendChild(this.indicator);
    this.container.appendChild(this.label);
    document.body.appendChild(this.container);

    this.initEvents();
  }

  initEvents() {
    this.socket.addEventListener("open", () => this.setStatus("connected"));
    this.socket.addEventListener("error", () => this.setStatus("error"));
    this.socket.addEventListener("close", () => {
      this.retryCount++;
      this.setStatus("closed");
    });
    this.socket.addEventListener("message", () => {
      this.lastEventTime = Date.now();
    });
  }

  setStatus(status) {
    switch (status) {
      case "connected":
        this.indicator.style.background = "#4caf50";
        this.label.textContent = "Connected";
        break;
      case "error":
        this.indicator.style.background = "#ff9800";
        this.label.textContent = "Error";
        break;
      case "closed":
        this.indicator.style.background = "#f44336";
        this.label.textContent = "Disconnected";
        break;
    }
  }

  toggleVisibility() {
    this.visible = !this.visible;
    this.container.style.display = this.visible ? "flex" : "none";
  }
}
