export class OrchestratorClient {
    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
    }

    async sendEvent(event) {
        // Proxy to port 3001
        await fetch(`${this.baseUrl}/events`, {
            method: 'POST',
            body: JSON.stringify(event)
        });
    }
}
