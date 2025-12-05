/**
 * CampusApp - Main application orchestrator
 * Manages scene, camera, renderer, and all subsystems
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLBLoader } from '../loaders/GLBLoader.js';
import { RoomManager } from '../rooms/RoomManager.js';
// ClassroomPicker removed - using Space.js Point3D system instead
import { RoomDetailView } from '../ui/RoomDetailView.js';
import { HeroHeader } from '../ui/HeroHeader.js';
import { PanelDocker } from '../ui/PanelDocker.js';
import { SceneControls } from '../ui/SceneControls.js';
import { CampusPoint3DSystem } from '../ui/spacejs/CampusPoint3DSystem.js';
import { SensorManager } from '../sensors/SensorManager.js';
import { HomeAssistantConnector } from '../connectors/HomeAssistantConnector.js';
import { SensorSyncService } from '../services/SensorSyncService.js';
import { loadSensorMappings, validateSensorMappings } from '../utils/sensorMappingLoader.js';
import { downloadJSON, downloadYAML } from '../utils/downloadHelper.js';
import { CampusHeader } from '../ui/hud/CampusHeader.js';
import { CampusMetrics } from '../ui/hud/CampusMetrics.js';
import { RoomHoverPanel } from '../ui/hud/RoomHoverPanel.js';
import { HeaderBar } from '../ui/hud/HeaderBar.js';
import { classroomRegistry } from '../models/ClassroomRegistry.js';
import classroomsWithSensors from '../data/classrooms/classrooms-with-sensors.js';
import { RadialGlowBackground } from '../visuals/RadialGlowBackground.js';

export class CampusApp {
  constructor(options = {}) {
    this.canvas = options.canvas;
    this.modelPath = options.modelPath || '/models/campus.glb';

    // Core Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // Subsystems
    this.glbLoader = null;
    this.roomManager = null;
    this.sensorManager = null;
    this.sensorSyncService = null;
    this.campusPoint3D = null;
    this.roomDetailPanel = null;
    this.heroHeader = null;
    this.panelDocker = null;
    this.sceneControls = null;
    this.campusHeader = null;
    this.campusMetrics = null;
    this.roomHoverPanel = null;
    this.headerBar = null;
    this.radialBackground = null;
    this.classroomRegistry = classroomRegistry;

    // State
    this.isRunning = false;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredRoom = null;
  }

  /**
   * Initialize all systems
   */
  async init() {
    console.log('[CampusApp] Initializing...');

    this._setupScene();
    this._setupCamera();
    this._setupRenderer();
    this._setupControls();
    this._setupLighting();

    // Load classroom data
    await this._loadClassroomData();

    // Load campus model
    this.glbLoader = new GLBLoader(this.scene);
    const campusModel = await this.glbLoader.load(this.modelPath);

    // Initialize room manager with loaded model
    this.roomManager = new RoomManager(this.scene, campusModel);
    // Ensure GLB doesn't override background/environment
    this.scene.background = null;
    this.scene.environment = null;
    // Radial glow background (Alien.js-inspired)
    this.radialBackground = new RadialGlowBackground();

    // Initialize sensor manager and connectors
    this._setupSensorSystem();

    // Initialize UI
    this._setupUI();

    // Create Point3D labels for all rooms (after UI setup)
    // Points remain hidden until hovered (proper Space.js behavior)
    if (this.campusPoint3D) {
      this.campusPoint3D.createRoomPoints();
    }

    // Setup event listeners
    this._setupEventListeners();

    console.log('[CampusApp] ✓ Initialization complete');
  }

  /**
   * Start animation loop
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this._animate();
    console.log('[CampusApp] ✓ Animation started');
  }

  /**
   * Stop animation loop
   */
  stop() {
    this.isRunning = false;
    console.log('[CampusApp] Animation stopped');
  }

  /**
   * Clean up and dispose resources
   */
  dispose() {
    console.log('[CampusApp] Disposing...');

    this.stop();

    // Dispose subsystems
    this.headerBar?.destroy();
    this.campusHeader?.destroy();
    this.campusMetrics?.destroy();
    this.roomHoverPanel?.destroy();
    this.radialBackground?.dispose();
    this.sensorSyncService?.dispose();
    this.sensorManager?.dispose();
    this.campusPoint3D?.dispose();
    this.roomDetailView?.dispose();
    this.roomManager?.dispose();
    this.sceneControls?.dispose();
    this.controls?.dispose();
    this.renderer?.dispose();

    console.log('[CampusApp] ✓ Disposed');
  }

  // ========================================
  // Private Methods
  // ========================================

  _setupScene() {
    this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x13243d, 0.0009);
    console.log('[CampusApp] Scene created');
  }

  _setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    this.camera.position.set(200, 150, 200);
    this.camera.lookAt(0, 0, 0);
    console.log('[CampusApp] Camera created');
  }

  _setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.autoClear = false;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    console.log('[CampusApp] Renderer created');
  }

  _setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 50;
    this.controls.maxDistance = 800;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below ground
    console.log('[CampusApp] Controls created');
  }

  _setupLighting() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0x404040, 1.5);
    this.scene.add(ambient);

    // Main directional light (sun)
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(100, 200, 100);
    sun.castShadow = true;
    sun.shadow.camera.left = -200;
    sun.shadow.camera.right = 200;
    sun.shadow.camera.top = 200;
    sun.shadow.camera.bottom = -200;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 500;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    this.scene.add(sun);

    // Fill light
    const fill = new THREE.DirectionalLight(0x7799ff, 0.3);
    fill.position.set(-100, 50, -100);
    this.scene.add(fill);

    console.log('[CampusApp] Lighting created');
  }

  _setupSensorSystem() {
    // Create sensor manager
    this.sensorManager = new SensorManager();

    // Create and register Home Assistant connector
    // Use cloud WebSocket URL (or local if available)
    const haConnector = new HomeAssistantConnector({
      url: import.meta.env.VITE_CLOUD_WS || import.meta.env.VITE_LOCAL_WS || import.meta.env.VITE_HA_URL,
      token: import.meta.env.VITE_HA_TOKEN || import.meta.env.VITE_CLOUD_TOKEN,
    });

    this.sensorManager.registerConnector('HomeAssistant', haConnector);

    // Create sensor sync service
    this.sensorSyncService = new SensorSyncService(this.sensorManager, this.classroomRegistry);

    // Start all connectors (will auto-discover sensors from Home Assistant)
    this.sensorManager.startAll().then(async () => {
      // Log discovered sensors after connection
      setTimeout(async () => {
        const sensors = this.sensorManager.getDiscoveredSensors();
        console.log(`[CampusApp] ✓ Discovered ${sensors.length} sensors from Home Assistant:`);
        console.table(sensors.map(s => ({
          'Entity ID': s.entityId,
          'Friendly Name': s.friendlyName,
          'Current Value': `${s.state} ${s.unit}`,
        })));

        // Load and apply sensor mappings from sensors-mapping.json
        console.log('\n[CampusApp] 📡 Loading sensor mappings...');
        const mappingStats = await loadSensorMappings(this.sensorManager);

        console.log(`\n[CampusApp] ✓ Telemetry enabled for ${mappingStats.roomsWithTelemetry.length} rooms:`);
        console.log(`  • Total mapped sensors: ${mappingStats.mappedSensors}/${mappingStats.totalSensors}`);
        console.log(`  • Sensor types: ${Array.from(mappingStats.sensorTypes).join(', ')}`);

        // Validate mappings
        console.log('\n[CampusApp] 🔍 Validating sensor mappings...');
        validateSensorMappings(this.sensorManager);

        // Export sensors to JSON
        const sensorsJSON = this.sensorManager.exportSensorsToJSON();
        console.log('\n[CampusApp] 📄 Raw Sensors JSON (copy to file):');
        console.log(sensorsJSON);

        // Analyze sensors for grouping
        const analysis = this.sensorManager.analyzeSensorGroupings();
        console.log('\n[CampusApp] 🔍 Sensor Analysis:');
        console.log('Total Sensors:', analysis.totalSensors);
        console.log('\nBy Domain:', analysis.byDomain);
        console.log('\nBy Unit:', analysis.byUnit);
        console.log('\nBy Device Class:', analysis.byDeviceClass);
        console.log('\nBy Area:', analysis.byArea);
        console.log('\nSuggested Room Mappings:', analysis.suggestedRoomMappings);
        console.log('\nUngrouped Sensors:', analysis.ungroupedSensors);

        // Export analysis to JSON
        const analysisJSON = JSON.stringify(analysis, null, 2);
        console.log('\n[CampusApp] 📊 Analysis JSON (copy to file):');
        console.log(analysisJSON);

        // Start syncing live sensor data to classrooms
        this.sensorSyncService.start();

        // Save to window for easy access
        window.sensorsData = sensors;
        window.sensorsAnalysis = analysis;
        window.sensorSyncService = this.sensorSyncService;

        // Add download functions to window
        window.downloadSensorsJSON = () => downloadJSON(sensors, 'sensors.json');
        window.downloadSensorsYAML = () => downloadYAML(sensors, 'sensors.yaml');
        window.downloadAnalysisJSON = () => downloadJSON(analysis, 'sensor-analysis.json');
        window.downloadAnalysisYAML = () => downloadYAML(analysis, 'sensor-analysis.yaml');
        window.downloadSensorHistory = () => this.sensorSyncService.exportHistory();

        console.log('\n[CampusApp] 💡 Available commands:');
        console.log('\n📥 Download sensor data:');
        console.log('  window.downloadSensorsJSON() - Download raw sensors as JSON');
        console.log('  window.downloadSensorsYAML() - Download raw sensors as YAML');
        console.log('  window.downloadAnalysisJSON() - Download analysis as JSON');
        console.log('  window.downloadAnalysisYAML() - Download analysis as YAML');
        console.log('  window.downloadSensorHistory() - Download sensor history');
        console.log('\n🗺️  Map sensors to rooms:');
        console.log('  window.sensorManager.mapEntityToRoom(entityId, roomId, sensorType)');
        console.log('\n📊 Inspect data:');
        console.log('  window.sensorsData - Raw sensor data');
        console.log('  window.sensorsAnalysis - Analysis and groupings');
      }, 2000);
    }).catch(error => {
      console.warn('[CampusApp] Could not start sensor connectors:', error.message);
      console.log('[CampusApp] App will continue without real-time sensor data');
    });

    // Expose sensor manager to window for debugging
    window.sensorManager = this.sensorManager;

    console.log('[CampusApp] Sensor system initialized');
  }

  async _loadClassroomData() {
    classroomsWithSensors.forEach(room => {
      this.classroomRegistry.register(room);
    });
    console.log(`[CampusApp] Loaded ${this.classroomRegistry.count} classrooms (sensors + metadata)`);
  }


  _setupUI() {
    // HUD Components (Space.js)
    this.headerBar = new HeaderBar();
    this.campusHeader = new CampusHeader(this.classroomRegistry, this.sensorManager);
    window.campusHeader = this.campusHeader; // Expose for legacy UI toggling

    this.campusMetrics = new CampusMetrics(this.classroomRegistry);

    this.roomHoverPanel = new RoomHoverPanel(this.classroomRegistry);
    window.roomHoverPanel = this.roomHoverPanel; // Expose for legacy UI toggling

    // Space.js Point3D system (complete implementation following Space.js architecture)
    this.campusPoint3D = new CampusPoint3DSystem(
      this.scene,
      this.camera,
      this.roomManager,
      this.classroomRegistry
    );

    // Room detail view (opened via Point3D "Enter Room" button) (Hologram style with chat)
    this.roomDetailView = new RoomDetailView(this.classroomRegistry);

    // Listen for room selection events
    document.addEventListener('classroompicker:roomselect', (e) => {
      this.roomDetailView.show(e.detail.room.id, this.roomManager, this.sensorManager);
      this.campusHeader.hide();
    });

    // Hide detail view when picker opens
    document.addEventListener('classroompicker:open', () => {
      this.roomDetailView.hide();
      this.campusHeader.show(); // Show header when picker opens (optional, but good for context)
    });

    // Show header when detail view closes
    document.addEventListener('roomdetailview:close', () => {
      this.campusHeader.show();
    });

    // Hero header
    this.heroHeader = new HeroHeader({
      title: 'Smart Campus',
      subtitle: 'Live 3D Visualization',
    });

    // Panel docker
    this.panelDocker = new PanelDocker();

    // Scene controls (space.js integration)
    this.sceneControls = new SceneControls(this.scene, this.camera, this.renderer);

    console.log('[CampusApp] UI initialized');
  }

  _setupEventListeners() {
    // Window resize
    window.addEventListener('resize', () => this._onResize());

    // Room interactions
    this.canvas.addEventListener('click', (event) => this._onCanvasClick(event));
    this.canvas.addEventListener('pointermove', (event) => this._onCanvasHover(event));

    // Listen for room selection from Point3D panel clicks
    document.addEventListener('room:select', (e) => {
      this.roomDetailView.show(e.detail.roomId, this.roomManager, this.sensorManager, this.classroomRegistry);
      this.campusHeader.hide();
    });

    console.log('[CampusApp] Event listeners attached');
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.radialBackground?.handleResize(window.innerWidth, window.innerHeight);
  }

  _onCanvasClick() {
    // Point3D system handles click automatically
    // Panel will show via Point3D hover/click interaction
    // "Enter Room" button in Point3DManager will trigger detail view
  }

  _onCanvasHover(event) {
    const room = this.roomManager.getRoomAtPointer(event, this.camera);

    if (room) {
      this.roomManager.highlightRoom(room.id);
      this.hoveredRoom = room;
      this.roomHoverPanel.show(room.id, event.clientX, event.clientY);
    } else {
      this.roomManager.clearHighlight();
      this.hoveredRoom = null;
      this.roomHoverPanel.hide();
    }
  }

  _animate() {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this._animate());

    const delta = this.clock.getDelta();
    const time = performance.now();

    // Update controls
    this.controls.update();

    // Update room manager
    this.roomManager?.update(delta);

    // Render radial glow background first (full-screen pass)
    this.renderer.clear();
    this.radialBackground?.render(this.renderer);
    this.renderer.clearDepth();

    // Update radial background
    this.radialBackground?.update(time);

    // Update Point3D system (handles raycasting, positioning, animations, lines)
    this.campusPoint3D?.update(time);

    // Update scene controls
    this.sceneControls?.update(delta);

    // Render
    this.renderer.render(this.scene, this.camera);
  }
}
