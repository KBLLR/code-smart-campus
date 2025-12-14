/**
 * CampusApp - Main application orchestrator
 * Manages scene, camera, renderer, and all subsystems
 */

import * as THREE from 'three';
import { GLBLoader } from '../loaders/GLBLoader.js';
import { RoomManager } from '../rooms/RoomManager.js';
import { CampusPoint3DSystem } from '../ui/spacejs/CampusPoint3DSystem.js';
import { SensorManager } from '../sensors/SensorManager.js';
import { HomeAssistantConnector } from '../connectors/HomeAssistantConnector.js';
import { MLXConnector } from '../connectors/MLXConnector.js';
import { SensorSyncService } from '../services/SensorSyncService.js';
import { loadSensorMappings, validateSensorMappings } from '../utils/sensorMappingLoader.js';
import { classroomRegistry } from '../models/ClassroomRegistry.js';
import classroomsWithSensors from '../data/classrooms/classrooms-with-sensors.js';
import { BackgroundView } from '../3d/views/BackgroundView.js';

// 3D Core
import { World } from '../3d/core/World.js';
import { Renderer } from '../3d/core/Renderer.js';
import { CameraManager } from '../3d/core/CameraManager.js';
import { InputManager } from '../3d/core/InputManager.js';
import { SceneController } from '../3d/controllers/SceneController.js';

// New UI Components & Managers
import { CampusHeader } from '../ui/hud/CampusHeader.js';
import { CampusMetrics } from '../ui/hud/CampusMetrics.js';
import { RoomHoverPanel } from '../ui/hud/RoomHoverPanel.js';
import { PanelManager } from '../ui/panels/PanelManager.js';
import { GraphManager } from '../managers/GraphManager.js';
import { AudioManager } from '../managers/AudioManager.js';
import { RoomViewLayer } from '../managers/RoomViewLayer.js';
import { UIEventBridge } from '../managers/UIEventBridge.js';
// (Optional) Keep SensorDashboard if valuable, or remove. Keeping mainly for potential detailed view logic reuse
import { SensorDashboard } from '../ui/hud/SensorDashboard.js'; 

export class CampusApp {
  constructor(options = {}) {
    this.canvas = options.canvas;
    this.modelPath = options.modelPath || '/models/campus.glb';

    // Core 3D Systems
    this.world = null;
    this.renderer = null;
    this.cameraManager = null;
    this.inputManager = null;

    // Subsystems
    this.glbLoader = null;
    this.roomManager = null;
    this.sensorManager = null;
    this.sensorSyncService = null;
    this.campusPoint3D = null;
    
    // UI Systems
    this.graphManager = null;
    this.audioManager = null;
    this.panelManager = null;
    this.roomViewLayer = null;
    this.uiEventBridge = null;
    
    // UI Elements
    this.campusHeader = null;
    this.campusMetrics = null;
    this.roomHoverPanel = null;
    this.sensorDashboard = null;
    
    this.classroomRegistry = classroomRegistry;

    // State
    this.isRunning = false;
    this.clock = new THREE.Clock();

    // Interaction State
    this.hoveredRoom = null;
    this.hoveredButton = null;
  }

  /**
   * Initialize all systems
   */
  async init() {
    console.log('[CampusApp] Initializing...');

    this._setupCore();

    // Load classroom data
    await this._loadClassroomData();

    // Load campus model
    this.glbLoader = new GLBLoader(this.world.scene);
    const campusModel = await this.glbLoader.load(this.modelPath);

    // Initialize room manager with loaded model
    this.roomManager = new RoomManager(this.world.scene, campusModel);

    // Register rooms and buttons with InputManager
    this._setupInputLayers();

    // Ensure GLB doesn't override background/environment
    this.world.scene.background = null;
    this.world.scene.environment = null;

    // Radial glow background (View)
    this.radialBackground = new BackgroundView();

    // Initialize sensor manager and connectors
    this._setupSensorSystem();

    // Initialize UI
    this._setupUI();

    // Setup event listeners (Resize etc)
    this._setupEventListeners();

    console.log('[CampusApp] ✓ Initialization complete');
  }

  _setupCore() {
    // 1. World
    this.world = new World();

    // 2. Renderer
    this.renderer = new Renderer({
      canvas: this.canvas,
      width: window.innerWidth,
      height: window.innerHeight
    });

    // 3. Camera
    this.cameraManager = new CameraManager({
      width: window.innerWidth,
      height: window.innerHeight,
      domElement: this.renderer.domElement
    });

    // 4. Input
    this.inputManager = new InputManager(
      this.cameraManager.getCamera(),
      this.renderer.domElement
    );
  }

  _setupInputLayers() {
    if (!this.inputManager || !this.roomManager) return;

    // Legacy support: We use RoomManager to get all current meshes
    const meshes = this.roomManager.getInteractableMeshes();
    this.inputManager.registerLayer('main', meshes);

    // Bind InputManager events
    this.inputManager.on('hover', (hit, event) => this._onInputHover(hit, event));
    // Click handled via UI layer usually, but main click handler helps
    this.inputManager.on('click', (hit, event) => this._onInputClick(hit, event));
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this._animate();
    console.log('[CampusApp] ✓ Animation started');
  }

  stop() {
    this.isRunning = false;
  }

  dispose() {
    this.stop();

    // Dispose subsystems
    this.uiEventBridge = null; // Remove listeners?
    this.panelManager?.hideRoomDetail();
    
    this.campusHeader?.destroy();
    this.campusMetrics?.destroy();
    this.roomHoverPanel?.destroy();
    this.sensorDashboard?.destroy();
    
    this.radialBackground?.dispose();
    this.sensorSyncService?.dispose();
    this.sensorManager?.dispose();
    this.campusPoint3D?.dispose();
    this.roomManager?.dispose();

    this.inputManager?.dispose();
    this.cameraManager?.dispose();
    this.renderer?.dispose();
    this.world?.dispose();
  }

  // ========================================
  // Private Methods
  // ========================================

  _setupSensorSystem() {
    this.sensorManager = new SensorManager();

    const haConnector = new HomeAssistantConnector({
      url: import.meta.env.VITE_CLOUD_WS || import.meta.env.VITE_LOCAL_WS || import.meta.env.VITE_HA_URL,
      token: import.meta.env.VITE_HA_TOKEN || import.meta.env.VITE_CLOUD_TOKEN,
    });
    this.sensorManager.registerConnector('HomeAssistant', haConnector);

    const mlxConnector = new MLXConnector({
      url: '/api/mlx/chat',
    });
    this.sensorManager.registerConnector('MLX', mlxConnector);

    this.sensorSyncService = new SensorSyncService(this.sensorManager, this.classroomRegistry);

    this.sensorManager.startAll().then(async () => {
        // Post-connection logic
        // This is where real data starts flowing to GraphManager via UIEventBridge
    }).catch(console.warn);

    window.sensorManager = this.sensorManager;
  }

  async _loadClassroomData() {
    classroomsWithSensors.forEach(room => {
      this.classroomRegistry.register(room);
    });
  }

  _setupUI() {
    console.log('[CampusApp] Setting up UI...');

    // 1. Managers
    this.graphManager = new GraphManager();
    this.audioManager = new AudioManager();
    
    // 2. HUD Elements
    this.campusHeader = new CampusHeader();
    this.campusHeader.onAction = (action) => this._handleHeaderAction(action);
    
    this.campusMetrics = new CampusMetrics();
    this.roomHoverPanel = new RoomHoverPanel();
    
    // 3. Panel System
    this.panelManager = new PanelManager({
        graphManager: this.graphManager,
        audioManager: this.audioManager
    });
    
    // 4. Room Logic Layer
    this.roomViewLayer = new RoomViewLayer(this.panelManager, this.campusHeader);

    // 5. Event Bridge (The glue)
    this.uiEventBridge = new UIEventBridge({
        roomViewLayer: this.roomViewLayer,
        audioManager: this.audioManager,
        graphManager: this.graphManager,
        campusMetrics: this.campusMetrics
    });
    this.uiEventBridge.init();
    
    // 6. Sensor Dashboard (Optional overlay)
    this.sensorDashboard = new SensorDashboard(this.sensorManager);
    
    // 7. Space.js Point System
    // We pass scene/camera but maybe it needs to know about inputManager?
    this.campusPoint3D = new CampusPoint3DSystem(
        this.world.scene,
        this.cameraManager.getCamera(),
        this.roomManager,
        this.classroomRegistry
    );
     // Enable creation of points now
    this.campusPoint3D.createRoomPoints();

    // 8. Scene Controller (3D Logic)
    this.sceneController = new SceneController({
      cameraManager: this.cameraManager,
      roomManager: this.roomManager,
      campusView: this.roomManager.campusView, 
      classroomRegistry: this.classroomRegistry,
      callbacks: {
        // Hook 3D changes to UI changes if needed
      }
    });

    console.log('[CampusApp] UI initialized');
  }

  _setupEventListeners() {
    window.addEventListener('resize', () => this._onResize());

    // Listen for room selection from 3D points
    document.addEventListener('room:select', (e) => {
        const { roomId } = e.detail;
        const roomData = this.classroomRegistry.get(roomId);
        this.roomViewLayer.onRoomEnter(roomId, roomData);
    });

    // Listen for room exit
    document.addEventListener('SMARTCAMPUS_ROOM_LEAVE', (e) => {
         const { roomId } = e.detail;
         this.roomViewLayer.onRoomExit(roomId);
    });
  }

  _handleHeaderAction(action) {
      console.log('[CampusApp] Header Action:', action);
      
      switch(action) {
          case 'openSensors':
              if (this.sensorDashboard) this.sensorDashboard.open();
              break;
          case 'toggleInfo':
              // could toggle an info panel
              break;
          case 'returnToApp':
              // Handle iframe return
              if (window.parent) {
                  window.parent.postMessage({ type: 'RETURN_TO_APP' }, '*');
              }
              break;
      }
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.cameraManager.resize(w, h);
    this.radialBackground?.handleResize(w, h);
  }

  _onInputClick(hit, event) {
    if (!hit) {
      // Background click -> Exit room context?
      this.roomViewLayer.onRoomExit(); 
      return;
    }

    const { object } = hit;
    // Basic interaction logic... 
    // Point3D uses its own click events via Space.js Stage, 
    // so this is for raw mesh clicks
  }

  _onInputHover(hit, event) {
    const { object } = hit || {};
    
    if (object) {
        // Show hover panel if it's a room mesh
        // This requires mapping mesh -> roomId which RoomManager usually does
        const room = this.roomManager.getRoomFromIntersect(hit);
        if (room) {
            this.roomHoverPanel.show({ name: room.name || room.id, type: 'UNIT' });
            
            // Position panel
            // We need screen coordinates
            // InputManager 'event' is usually the MouseEvent or pointer
            // But we might need projectVector
            if (event) {
                this.roomHoverPanel.setPosition(event.clientX, event.clientY);
            }
        }
    } else {
        this.roomHoverPanel.hide();
    }
  }

  _animate() {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this._animate());

    const delta = this.clock.getDelta();
    const time = performance.now();

    // 1. Update Managers
    this.cameraManager.update(delta);
    this.world.update(delta, time);
    this.roomManager?.update(delta);

    // 2. Update UI Systems
    this.radialBackground?.update(time);
    this.campusPoint3D?.update(time);
    this.sceneController?.update(time);
    
    // New UI Updates
    this.panelManager?.update(delta);
    this.audioManager?.update(delta);
    this.graphManager?.update(delta);
    this.campusHeader?.update(delta);
    this.campusMetrics?.update(delta);

    // 3. Render
    this.renderer.clear();
    if (this.radialBackground) {
      this.radialBackground.render(this.renderer.renderer);
    }
    this.renderer.clearDepth();
    this.renderer.render(this.world.scene, this.cameraManager.getCamera());
  }
}


