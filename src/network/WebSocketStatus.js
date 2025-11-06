
export class WebSocketStatus {
  constructor(socket, { containerId = "websocket-status" } = {}) {
    this.socket = socket;
    this.retryCount = 0;
    this.lastEventTime = null;
    this.visible = true;

    this.container =
      document.getElementById(containerId) || document.createElement("div");
    this.container.id = containerId;
    this.container.classList.add("status-pill");

    if (!this.container.parentElement) {
      document.body.appendChild(this.container);
    } else {
      this.container.innerHTML = "";
    }

    this.indicator = document.createElement("span");
    this.indicator.className = "status-indicator";

    this.label = document.createElement("span");
    this.label.className = "status-label";
    this.label.textContent = "Connecting...";

    this.container.appendChild(this.indicator);
    this.container.appendChild(this.label);

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
