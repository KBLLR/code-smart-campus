import { App } from './core/App.js';
import '../src/styles/main.css'; // Reusing existing styles for now

const app = new App();

(async () => {
    try {
        await app.init();
        app.start();
        window.app = app; // For debugging
    } catch (e) {
        console.error('[Main] Fatal Error:', e);
    }
})();
