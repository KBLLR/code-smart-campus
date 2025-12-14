/**
 * MLXConnector - Connects to local MLX AI model
 * Handles prompt engineering and chat interactions
 */

import { BaseConnector } from './BaseConnector.js';
import { getDisplayText } from '../utils/harmonyParser.js';

export class MLXConnector extends BaseConnector {
    constructor(config = {}) {
        super('MLX', {
            url: config.url || '/api/mlx/chat',
            model: config.model || 'mlx-community/Jinx-gpt-oss-20b-mxfp4-mlx',
            ...config,
        });
    }

    /**
     * Start connector (check health?)
     */
    async start() {
        this.isConnected = true;
        this.emit('connected');
        console.log('[MLX] Connector ready');
    }

    /**
     * Send a chat message to the room agent
     * @param {string} roomId - The room ID
     * @param {string} userMessage - The user's text
     * @param {object} personality - Merged personality object from PersonalityLoader
     */
    async chat(roomId, userMessage, personality) {
        if (!userMessage) return null;

        console.log(`[MLX] Chatting with ${roomId} (${personality?.['room-avatar']})...`);

        // default fallback personality
        const p = personality || {
            'room-avatar': 'Agent',
            'room-name': roomId,
            trait: 'Helpful Assistant',
            want: 'To assist users',
            flaw: 'None',
            base_story: 'A smart campus agent.',
            ocean: { temperature: 0.7 }
        };

        // Format prompt for Harmony (Analysis -> Final)
        const currentDate = new Date().toISOString().split('T')[0];
        const systemPrompt = `Knowledge cutoff: 2024-06
Current date: ${currentDate}
Reasoning: high

You are ${p['room-avatar']}, the ${p.trait} of ${p['room-name']}.
${p.base_story}
Your personality: ${p.want} ${p.flaw}

You MUST structure your response using these THREE channels:

1. <|analysis|>
   Think step-by-step about the user's query. Consider your personality and the context of the room.
   <|end|>

2. <|commentary|>
   Briefly note any specific tone or style adjustments you are making.
   <|end|>

3. <|final|>
   Your final response to the user. Speak naturally in your character.
   <|end|>`;

        // Construct payload
        const messages = [
            { role: 'user', content: systemPrompt + "\n\nUser: " + userMessage }
        ];

        const options = {
            temperature: p.ocean?.temperature || 0.7,
            maxTokens: 512
        };

        try {
            const completion = await this.completion(messages, options);
            console.log('[MLX] Raw Output:', completion); // Debug log

            // Parse the response to get only the final text
            const cleanText = getDisplayText(completion);
            return cleanText;

        } catch (error) {
            console.error('[MLX] Chat failed:', error);
            throw error;
        }
    }

    /**
     * Send a raw completion request (for custom prompts/agents like Cerberus)
     * @param {Array} messages - Array of {role, content} objects
     * @param {object} options - { temperature, maxTokens, model }
     */
    async completion(messages, options = {}) {
        const payload = {
            model: options.model || this.config.model,
            messages: messages,
            temperature: options.temperature || 0.7,
            maxTokens: options.maxTokens || 512
        };

        return this._fetchCompletion(payload);
    }

    /**
     * Internal fetch helper
     */
    async _fetchCompletion(payload) {
        const response = await fetch(this.config.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`MLX API Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        // Handle various response formats (MLX-Server vs OpenAI-compatible)
        if (result.completion) return result.completion;
        if (result.choices && result.choices[0]) {
            return result.choices[0].message?.content || result.choices[0].text || '';
        }

        return '';
    }
}
