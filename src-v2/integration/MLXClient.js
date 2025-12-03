export class MLXClient {
    constructor(baseUrl = 'http://localhost:8080') {
        this.baseUrl = baseUrl;
    }

    async completion(prompt, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}/v1/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    ...options
                })
            });
            return await response.json();
        } catch (e) {
            console.error('[MLXClient] Completion failed:', e);
            throw e;
        }
    }

    async embedding(text) {
        // Placeholder for embedding endpoint
        return [];
    }
}
