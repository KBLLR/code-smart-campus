/**
 * Smart Campus - Minimal Entry Point
 * Clean, modular architecture for 3D campus visualization
 */

import { CampusApp } from './core/CampusApp.js';
import './styles/main.css';
import './styles/spacejs.css';

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Main] Initializing Smart Campus...');

  try {
    const app = new CampusApp({
      canvas: document.getElementById('canvas'),
      modelPath: '/models/campus.glb',
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
