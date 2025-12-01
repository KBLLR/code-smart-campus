/**
 * RoomsManager - Central orchestrator for room-based systems
 *
 * Coordinates:
 * - SVG floorplan loading (source of truth)
 * - Room registry (generated from SVG)
 * - Extruded room geometry (visual 3D blocks)
 * - Picking meshes (invisible raycasting shells)
 * - Entity bindings (room → sensor mappings)
 * - Picking service initialization
 * - Label generation and management (NEW)
 *
 * Pipeline:
 * 1. Load roomRegistry (from SVG-generated data)
 * 2. Load entityLocations (room metadata)
 * 3. Generate extruded geometry from SVG
 * 4. Create picking meshes at registry positions
 * 5. Initialize entity bindings
 * 6. Setup picking service
 * 7. Initialize labels (if enabled)
 *
 * Source of truth: public/floorplan.svg
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { roomRegistry } from '@data/roomRegistry.js';
import entityLocations from '@data/entityLocations.json';
import { generateRoundedBlocksFromSVG } from '@three/RoundedBlockGenerator.js';
import { createRoomMeshes } from '@utils/RoomMeshGenerator.js';
import { PickingService } from '@shared/services/picking-service';
import { entityBindingRegistry, normalizeTUMRoomId } from '@shared/services/entity-binding-registry';
import { LabelManager } from '@lib/LabelManager.js';
import { cleanedLabelRegistry } from '@data/labelCollections.js';

/**
 * Configuration for RoomsManager
 */
export const ROOMS_CONFIG = {
  mode: 'gltf', // 'svg' or 'gltf' - loading mode
  svgPath: '/floorplan.svg',
  gltfPath: '/models/campus.glb', // Path to GLTF model
  extrudedHeight: 250, // Height of 3D room blocks (SVG mode only)
  pickingEnabled: true,
  entityBindingEnabled: true,
  labelsEnabled: true, // Enable integrated label system
  labelsHiddenByDefault: true, // Hide labels until room is hovered
  useSprites: false, // Use sprite-based labels (true) or anchor-based (false)
  debugMode: false,
};

/**
 * RoomsManager
 *
 * Manages all room-related systems with SVG floorplan as single source of truth
 */
export class RoomsManager {
  constructor(scene, camera, config = {}) {
    this.scene = scene;
    this.camera = camera;
    this.config = { ...ROOMS_CONFIG, ...config };

    // Core data
    this.roomRegistry = roomRegistry;
    this.entityLocations = entityLocations;
    this.labelRegistry = cleanedLabelRegistry;

    // Three.js objects
    this.extrudedGroup = null;
    this.roomMeshes = [];
    this.pickingGroup = null; // Parent group for picking meshes (with rotation.y transform)
    this.meshRegistry = {}; // Map of room IDs to extruded meshes

    // Services
    this.pickingService = null;
    this.labelManager = null;
    this.entityBindingRegistry = entityBindingRegistry;

    // State
    this.initialized = false;
    this.labelsVisible = false;
  }

  /**
   * Initialize all room systems
   * Call this once during app startup
   */
  async initialize() {
    if (this.initialized) {
      console.warn('[RoomsManager] Already initialized');
      return;
    }

    console.log('=== RoomsManager Initialization ===');
    console.log(`  Mode: ${this.config.mode}`);
    console.log(`  Source: ${this.config.mode === 'gltf' ? this.config.gltfPath : this.config.svgPath}`);
    console.log(`  Registry entries: ${Object.keys(this.roomRegistry).length}`);
    console.log(`  Entity locations: ${this.entityLocations.length}`);

    try {
      // Step 1: Generate extruded geometry from SVG
      await this.loadExtrudedGeometry();

      // Step 2: Create picking meshes from registry
      this.createPickingMeshes();

      // Step 3: Initialize picking service
      if (this.config.pickingEnabled) {
        this.initializePickingService();
      }

      // Step 4: Setup entity bindings (when HA data available)
      if (this.config.entityBindingEnabled) {
        this.setupEntityBindings();
      }

      // Step 5: Initialize labels (if enabled)
      if (this.config.labelsEnabled) {
        this.initializeLabels();
      }

      this.initialized = true;
      console.log('✅ RoomsManager initialized successfully\n');

      if (this.config.debugMode) {
        this.printDiagnostics();
      }
    } catch (error) {
      console.error('❌ RoomsManager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load and generate 3D geometry (SVG or GLTF mode)
   */
  async loadExtrudedGeometry() {
    if (this.config.mode === 'gltf') {
      await this.loadFromGLTF();
    } else {
      await this.loadFromSVG();
    }
  }

  /**
   * Load extruded geometry from SVG
   */
  async loadFromSVG() {
    console.log('[RoomsManager] Loading extruded geometry from SVG...');

    this.extrudedGroup = await generateRoundedBlocksFromSVG(
      this.config.svgPath,
      this.scene,
      this.meshRegistry,
      this.config.extrudedHeight
    );

    this.scene.add(this.extrudedGroup);
    console.log(`  ✓ Added ${this.extrudedGroup.children.length} extruded room blocks`);
  }

  /**
   * Load geometry from GLTF model
   */
  async loadFromGLTF() {
    console.log(`[RoomsManager] Loading GLTF model from ${this.config.gltfPath}...`);
    const loader = new GLTFLoader();

    // List of non-room objects to skip
    const skipObjects = ['projection_live', 'projectionlive', 'walls', 'floor'];

    let gltf;
    try {
      console.log('[RoomsManager] About to call loadAsync...');
      // Use loadAsync for better async/await support
      gltf = await loader.loadAsync(this.config.gltfPath, (progress) => {
        const percent = (progress.loaded / progress.total) * 100;
        console.log(`  Loading: ${percent.toFixed(1)}%`);
      });
      console.log('[RoomsManager] loadAsync completed');
    } catch (loadError) {
      console.error('[RoomsManager] loadAsync failed:', loadError);
      throw new Error(`Failed to load GLTF file: ${loadError.message}`);
    }

    try {
      console.log('[RoomsManager] GLTF object:', gltf);
      console.log('[RoomsManager] GLTF properties:', Object.keys(gltf || {}));
      console.log('[RoomsManager] GLTF.scene:', gltf?.scene);
      console.log('[RoomsManager] GLTF.scenes:', gltf?.scenes);

      // Blender exports might have scene in scenes[0] instead of scene
      let sceneToUse = gltf.scene;
      if (!sceneToUse && gltf.scenes && gltf.scenes.length > 0) {
        sceneToUse = gltf.scenes[0];
        console.log('[RoomsManager] Using scenes[0] from Blender export');
      }

      console.log('[RoomsManager] Scene to use:', sceneToUse);
      console.log('[RoomsManager] GLTF loaded successfully:', {
        hasScene: !!sceneToUse,
        sceneType: sceneToUse?.type,
        sceneChildren: sceneToUse?.children?.length,
      });

      // Check if we have a valid scene
      if (!sceneToUse) {
        throw new Error(`No valid scene found in GLTF. Available properties: ${Object.keys(gltf || {}).join(', ')}`);
      }

      // Use the GLTF scene directly as our room group (don't create a new group)
      this.extrudedGroup = sceneToUse;
      this.extrudedGroup.name = 'RoomsFromGLTF';

      let meshCount = 0;

      // Traverse GLTF scene and register room meshes (don't move them)
      sceneToUse.traverse((object) => {
        if (object.isMesh || object instanceof THREE.Mesh) {
          meshCount++;
          const meshName = object.name || `unnamed_${meshCount}`;
          const normId = meshName.toLowerCase().replace(/[^a-z0-9]/g, '');

          // Skip non-room objects (walls, projection_live, etc.)
          if (skipObjects.includes(normId)) {
            console.log(`  ⊗ Skipping non-room object: ${meshName}`);
            // Hide non-room objects
            object.visible = false;
            return;
          }

          if (normId) {
            // Store in mesh registry
            this.meshRegistry[normId] = object;

            // Setup mesh properties
            object.castShadow = true;
            object.receiveShadow = true;
            object.userData.roomKey = normId;
            object.userData.roomId = normId; // Use normalized ID for consistency

            console.log(`  ✓ Found room mesh: ${meshName} → ${normId}`);
          }

          // Don't move the mesh - it stays in the GLTF scene hierarchy
        }
      });

      this.scene.add(this.extrudedGroup);
      console.log(`  ✓ Loaded GLTF with ${Object.keys(this.meshRegistry).length} room meshes`);

    } catch (error) {
      console.error('[RoomsManager] GLTF load/processing failed:', error);
      throw error;
    }
  }

  /**
   * Create invisible picking meshes positioned at registry coordinates
   * In GLTF mode, use the GLTF meshes directly for picking
   */
  createPickingMeshes() {
    console.log('[RoomsManager] Creating picking meshes...');

    try {
      if (this.config.mode === 'gltf') {
        // In GLTF mode, use the actual GLTF meshes for picking
        this.roomMeshes = Object.values(this.meshRegistry);
        this.pickingGroup = this.extrudedGroup; // Use the GLTF group directly
        console.log(`  ✓ Using ${this.roomMeshes.length} GLTF meshes for picking`);
      } else {
        // In SVG mode, create separate picking meshes from registry
        const { meshes, group } = createRoomMeshes(this.roomRegistry, this.entityLocations);
        this.roomMeshes = meshes;
        this.pickingGroup = group;
        this.scene.add(group);
        console.log(`  ✓ Created ${this.roomMeshes.length} picking meshes`);
        console.log(`  ✓ Applied coordinate transform to match extruded geometry`);
      }
    } catch (error) {
      // createRoomMeshes fails hard if any rooms are missing
      console.error('[RoomsManager] Failed to create picking meshes:', error.message);
      throw error;
    }
  }

  /**
   * Initialize picking service with room meshes
   */
  initializePickingService() {
    console.log('[RoomsManager] Initializing picking service...');

    this.pickingService = new PickingService(this.camera, this.roomMeshes);

    console.log('  ✓ Picking service ready');
  }

  /**
   * Setup entity bindings (placeholder - called when HA data available)
   */
  setupEntityBindings() {
    console.log('[RoomsManager] Entity binding registry ready');
    console.log('  Call manager.bindHomeAssistantEntities(entities) when HA connects');
  }

  /**
   * Initialize label system
   */
  initializeLabels() {
    console.log('[RoomsManager] Initializing labels...');

    this.labelManager = new LabelManager(
      this.scene,
      this.labelRegistry,
      this.roomRegistry,
      { useSprites: this.config.useSprites }
    );

    this.labelManager.injectLabels();

    // Hide all labels initially if configured
    if (this.config.labelsHiddenByDefault) {
      this.hideAllLabels();
      console.log('  ✓ Labels created (hidden by default, show on hover)');
    } else {
      console.log('  ✓ Label system ready');
    }
  }

  /**
   * Hide all labels
   */
  hideAllLabels() {
    if (!this.labelManager) return;

    // Handle both sprite labels (object) and anchor labels (object)
    if (this.labelManager.labels && typeof this.labelManager.labels === 'object') {
      Object.values(this.labelManager.labels).forEach((label) => {
        if (label && label.element) {
          label.element.style.display = 'none';
        }
      });
    }

    // Also handle anchor-based labels
    if (this.labelManager.anchors && typeof this.labelManager.anchors === 'object') {
      Object.values(this.labelManager.anchors).forEach((anchor) => {
        if (anchor && anchor.userData && anchor.userData.labelElement) {
          anchor.userData.labelElement.style.display = 'none';
        }
      });
    }
  }

  /**
   * Show label for specific room
   */
  showLabel(roomId) {
    if (!this.labelManager) return;

    // Normalize room ID
    const normId = roomId.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Try sprite labels first
    if (this.labelManager.labels && this.labelManager.labels[normId]) {
      const label = this.labelManager.labels[normId];
      if (label && label.element) {
        label.element.style.display = 'block';
      }
    }

    // Also try anchor-based labels
    if (this.labelManager.anchors && this.labelManager.anchors[normId]) {
      const anchor = this.labelManager.anchors[normId];
      if (anchor && anchor.userData && anchor.userData.labelElement) {
        anchor.userData.labelElement.style.display = 'block';
      }
    }
  }

  /**
   * Hide label for specific room
   */
  hideLabel(roomId) {
    if (!this.labelManager) return;

    // Normalize room ID
    const normId = roomId.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Try sprite labels first
    if (this.labelManager.labels && this.labelManager.labels[normId]) {
      const label = this.labelManager.labels[normId];
      if (label && label.element) {
        label.element.style.display = 'none';
      }
    }

    // Also try anchor-based labels
    if (this.labelManager.anchors && this.labelManager.anchors[normId]) {
      const anchor = this.labelManager.anchors[normId];
      if (anchor && anchor.userData && anchor.userData.labelElement) {
        anchor.userData.labelElement.style.display = 'none';
      }
    }
  }

  /**
   * Show all labels
   */
  showLabels() {
    if (!this.labelManager) {
      console.warn('[RoomsManager] Label system not initialized');
      return;
    }

    const labels = this.labelManager.getLabels();
    Object.values(labels).forEach((label) => {
      label.visible = true;
    });
    this.labelsVisible = true;
  }

  /**
   * Hide all labels
   */
  hideLabels() {
    if (!this.labelManager) {
      console.warn('[RoomsManager] Label system not initialized');
      return;
    }

    const labels = this.labelManager.getLabels();
    Object.values(labels).forEach((label) => {
      label.visible = false;
    });
    this.labelsVisible = false;
  }

  /**
   * Update label value for an entity
   *
   * @param {string} entityId - Entity ID (e.g., "sensor.temperature")
   * @param {string|number} value - New value to display
   */
  updateLabel(entityId, value) {
    if (!this.labelManager) {
      console.warn('[RoomsManager] Label system not initialized');
      return;
    }

    this.labelManager.updateLabel(entityId, value);
  }

  /**
   * Get all label anchors (for external systems like HUD)
   *
   * @returns {Object} Map of entity IDs to anchor objects
   */
  getLabelAnchors() {
    if (!this.labelManager) {
      console.warn('[RoomsManager] Label system not initialized');
      return {};
    }

    return this.labelManager.getAnchors();
  }

  /**
   * Get a specific label anchor by entity ID
   *
   * @param {string} entityId - Entity ID
   * @returns {THREE.Object3D|null} Anchor object or null
   */
  getLabelAnchor(entityId) {
    if (!this.labelManager) {
      console.warn('[RoomsManager] Label system not initialized');
      return null;
    }

    return this.labelManager.getAnchor(entityId);
  }

  /**
   * Bind Home Assistant entities to rooms using auto-discovery
   * Call this when Home Assistant connection is established
   *
   * @param {string[]} entityIds - Array of HA entity IDs
   */
  bindHomeAssistantEntities(entityIds) {
    console.log('[RoomsManager] Auto-discovering entity bindings...');

    this.entityBindingRegistry.auto_discover(
      entityIds,
      undefined,
      normalizeTUMRoomId // Use TUM-specific normalization
    );

    const stats = this.entityBindingRegistry.getStats();
    console.log(`  ✓ Bound ${stats.entityCount} entities to ${stats.roomCount} rooms`);
    console.log(`  Average: ${stats.averageEntitiesPerRoom} entities per room`);

    if (this.config.debugMode) {
      this.entityBindingRegistry.printDiagnostics();
    }
  }

  /**
   * Perform raycasting pick at screen coordinates
   *
   * @param {number} screenX - X coordinate in pixels
   * @param {number} screenY - Y coordinate in pixels
   * @returns {Object} Pick result with roomId, hit, worldPosition
   */
  pick(screenX, screenY) {
    if (!this.pickingService) {
      console.warn('[RoomsManager] Picking service not initialized');
      return { roomId: null, hit: false };
    }

    return this.pickingService.pick(screenX, screenY);
  }

  /**
   * Get entities for a room
   *
   * @param {string} roomId - Room ID (e.g., "b.3", "kitchen")
   * @returns {string[]} Array of entity IDs
   */
  getEntitiesForRoom(roomId) {
    return this.entityBindingRegistry.getEntitiesForLocation(roomId);
  }

  /**
   * Get room data from registry
   *
   * @param {string} roomId - Room ID
   * @returns {Object|null} Room data or null if not found
   */
  getRoomData(roomId) {
    return this.roomRegistry[roomId] || null;
  }

  /**
   * Get entity location metadata
   *
   * @param {string} roomId - Room ID
   * @returns {Object|null} Entity location data or null if not found
   */
  getEntityLocation(roomId) {
    return this.entityLocations.find((e) => e.id === roomId) || null;
  }

  /**
   * Get extruded mesh for a room
   *
   * @param {string} roomId - Room ID
   * @returns {THREE.Mesh|null} Extruded mesh or null
   */
  getExtrudedMesh(roomId) {
    // meshRegistry uses normalized IDs (lowercase, no dots)
    const normalizedId = roomId.toLowerCase().replace(/[^a-z0-9]/g, '');
    return this.meshRegistry[normalizedId] || null;
  }

  /**
   * Highlight a room (visual feedback for picking)
   *
   * @param {string} roomId - Room ID to highlight
   * @param {boolean} highlight - True to highlight, false to remove
   */
  highlightRoom(roomId, highlight = true) {
    const mesh = this.getExtrudedMesh(roomId);
    if (!mesh) {
      console.warn(`[RoomsManager] Cannot highlight room "${roomId}" - mesh not found`);
      return;
    }

    if (highlight) {
      // Store original opacity if not already stored
      if (!mesh.userData.originalOpacity) {
        mesh.userData.originalOpacity = mesh.material.opacity;
      }
      mesh.material.opacity = 1.0;
      mesh.material.emissive = new THREE.Color(0x4488ff);
      mesh.material.emissiveIntensity = 0.3;
    } else {
      // Restore original opacity
      if (mesh.userData.originalOpacity !== undefined) {
        mesh.material.opacity = mesh.userData.originalOpacity;
      }
      mesh.material.emissive = new THREE.Color(0x000000);
      mesh.material.emissiveIntensity = 0;
    }

    mesh.material.needsUpdate = true;
  }

  /**
   * Print diagnostics about the rooms system
   */
  printDiagnostics() {
    console.group('[RoomsManager] Diagnostics');
    console.log(`Initialized: ${this.initialized}`);
    console.log(`Registry rooms: ${Object.keys(this.roomRegistry).length}`);
    console.log(`Entity locations: ${this.entityLocations.length}`);
    console.log(`Extruded meshes: ${Object.keys(this.meshRegistry).length}`);
    console.log(`Picking meshes: ${this.roomMeshes.length}`);
    console.log(`Picking service: ${this.pickingService ? 'active' : 'inactive'}`);
    console.log(`Label system: ${this.labelManager ? 'active' : 'inactive'}`);
    if (this.labelManager) {
      const labels = this.labelManager.getLabels();
      const anchors = this.labelManager.getAnchors();
      console.log(`  Labels: ${Object.keys(labels).length}`);
      console.log(`  Anchors: ${Object.keys(anchors).length}`);
      console.log(`  Visible: ${this.labelsVisible}`);
    }

    const entityStats = this.entityBindingRegistry.getStats();
    console.log(`Entity bindings: ${entityStats.entityCount} entities in ${entityStats.roomCount} rooms`);

    // Sample room data
    const sampleId = this.entityLocations[0]?.id;
    if (sampleId) {
      console.log(`\nSample room "${sampleId}":`);
      console.log('  Registry:', this.getRoomData(sampleId));
      console.log('  Entity location:', this.getEntityLocation(sampleId));
      console.log('  Entities:', this.getEntitiesForRoom(sampleId));
      console.log('  Has extruded mesh:', !!this.getExtrudedMesh(sampleId));
    }

    console.groupEnd();
  }

  /**
   * Dispose all room resources
   */
  dispose() {
    console.log('[RoomsManager] Disposing resources...');

    // Dispose labels
    if (this.labelManager) {
      this.labelManager.dispose();
      this.labelManager = null;
    }

    // Dispose picking meshes
    this.roomMeshes.forEach((mesh) => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });
    if (this.pickingGroup) {
      this.scene.remove(this.pickingGroup);
      this.pickingGroup = null;
    }
    this.roomMeshes = [];

    // Dispose extruded group
    if (this.extrudedGroup) {
      this.extrudedGroup.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      this.scene.remove(this.extrudedGroup);
      this.extrudedGroup = null;
    }

    // Reset registries
    this.meshRegistry = {};
    this.entityBindingRegistry.reset();

    this.initialized = false;
    this.labelsVisible = false;
    console.log('  ✓ Resources disposed');
  }
}
