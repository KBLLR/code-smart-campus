export class HomeAssistantConnector {
    constructor(url, token) {
        this.url = url;
        this.token = token;
        this.socket = null;
        this.listeners = new Map();
    }

    async connect() {
        if (!this.url || !this.token) {
            throw new Error('Missing HA URL or Token');
        }
        // TODO: Implement actual WebSocket connection logic
        // reusing logic from src/home_assistant/HASocket.js
        console.log('[HA] Connecting to', this.url);
        return Promise.resolve();
    }

    subscribe(entityId, callback) {
        if (!this.listeners.has(entityId)) {
            this.listeners.set(entityId, new Set());
        }
        this.listeners.get(entityId).add(callback);
    }
}
