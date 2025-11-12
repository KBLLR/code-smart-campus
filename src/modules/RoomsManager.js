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
  svgPath: '/floorplan.svg',
  extrudedHeight: 250, // Height of 3D room blocks
  pickingEnabled: true,
  entityBindingEnabled: true,
  labelsEnabled: false, // Enable integrated label system
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
    console.log(`  SVG source: ${this.config.svgPath}`);
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
   * Load and generate extruded 3D geometry from SVG
   */
  async loadExtrudedGeometry() {
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
   * Create invisible picking meshes positioned at registry coordinates
   */
  createPickingMeshes() {
    console.log('[RoomsManager] Creating picking meshes...');

    try {
      const { meshes, group } = createRoomMeshes(this.roomRegistry, this.entityLocations);

      this.roomMeshes = meshes;
      this.pickingGroup = group;

      // Add group to scene (meshes are children of group)
      this.scene.add(group);

      console.log(`  ✓ Created ${this.roomMeshes.length} picking meshes`);
      console.log(`  ✓ Applied coordinate transform to match extruded geometry`);
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

    console.log('  ✓ Label system ready');
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
