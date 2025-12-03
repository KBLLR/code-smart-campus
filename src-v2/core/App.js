import { SceneManager } from '../world/SceneManager.js';
import { DataPipeline } from '../integration/DataPipeline.js';
import { UIManager } from '../ui/UIManager.js';
import { HomeAssistantConnector } from '../integration/HomeAssistantConnector.js';
import { MLXClient } from '../integration/MLXClient.js';

export class App {
    constructor() {
        // Core Systems
        this.sceneManager = new SceneManager();
        this.dataPipeline = new DataPipeline();
        this.uiManager = new UIManager();

        // Integration
        this.haConnector = new HomeAssistantConnector(
            import.meta.env.VITE_HA_URL,
            import.meta.env.VITE_HA_TOKEN
        );
        this.mlxClient = new MLXClient();
    }

    async init() {
        console.log('[App] Initializing...');

        // 1. Load Data
        await this.dataPipeline.init();

        // 2. Initialize World
        await this.sceneManager.init();

        // 3. Initialize UI
        await this.uiManager.init(this.sceneManager, this.dataPipeline);

        // 4. Connect to External Services
        this.connectServices();

        console.log('[App] Ready');
    }

    async connectServices() {
        try {
            await this.haConnector.connect();
            console.log('[App] Connected to Home Assistant');
        } catch (e) {
            console.warn('[App] Failed to connect to Home Assistant:', e);
        }
    }

    start() {
        this.sceneManager.start();
    }
}
