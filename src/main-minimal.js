/**
 * Smart Campus - Minimal Entry Point
 * Clean, modular architecture for 3D campus visualization
 */

import { CampusApp } from './core/CampusApp.js';
import './styles/corex/kbllr.tokens.css';
import './styles/corex/motion.css';
import './styles/corex/spacejs-corex.css';
import './styles/campus-shell.css';

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Main] Initializing Smart Campus...');

  try {
    const app = new CampusApp({
      canvas: document.getElementById('canvas'),
      modelPath: '/models/campus.glb',
      env: import.meta.env,
    });

    await app.init();
    app.start();

    // Expose app to window for debugging
    window.campusApp = app;

    console.log('[Main] ✓ App initialized successfully');
  } catch (error) {
    console.error('[Main] ✗ Failed to initialize:', error);
  }
});
