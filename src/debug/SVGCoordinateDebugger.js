/**
 * SVGCoordinateDebugger - Visual debugging tool for SVG vs 3D coordinate alignment
 *
 * Displays the SVG floor plan at multiple heights to check orientation
 * and coordinate mapping between:
 * - SVG paths (2D source)
 * - Extruded room geometry (3D blocks)
 * - Picking mesh shells (invisible raycasting targets)
 *
 * Shows orthographic views: Top, Front, Isometric
 */

import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

export class SVGCoordinateDebugger {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.svgGroups = []; // SVG overlays at different heights
    this.debugMeshes = []; // Visual debugging meshes
    this.views = {}; // Multiple camera views

    // Configuration
    this.config = {
      svgHeights: [0, 20, 40], // Heights to display SVG overlay
      svgScale: 0.1, // Match RoundedBlockGenerator scale
      svgOpacity: 0.5,
      colors: {
        bottom: 0xff0000, // Red - ground level
        middle: 0x00ff00, // Green - picking height (y=20)
        top: 0x0000ff,    // Blue - top of blocks
      }
    };
  }

  /**
   * Load SVG and create overlays at multiple heights
   */
  async loadSVGOverlays(svgPath = '/dbug/dbugmap-1.svg') {
    const loader = new SVGLoader();

    return new Promise((resolve, reject) => {
      loader.load(
        svgPath,
        (svgData) => {
          console.log('[SVGDebugger] SVG loaded, creating overlays...');

          // Create overlay at each configured height
          this.config.svgHeights.forEach((height, idx) => {
            const group = this.createSVGOverlay(svgData, height, idx);
            this.svgGroups.push(group);
            this.scene.add(group);
          });

          console.log(`[SVGDebugger] Created ${this.svgGroups.length} SVG overlays`);
          resolve(this.svgGroups);
        },
        (xhr) => {
          console.log(`[SVGDebugger] Loading: ${(xhr.loaded / xhr.total * 100).toFixed(0)}%`);
        },
        (error) => {
          console.error('[SVGDebugger] Failed to load SVG:', error);
          reject(error);
        }
      );
    });
  }

  /**
   * Create SVG overlay at specific height with wireframe
   */
  createSVGOverlay(svgData, height, index) {
    const group = new THREE.Group();
    group.name = `SVG_Overlay_Y${height}`;

    // Get color based on height level
    const colorKeys = Object.keys(this.config.colors);
    const color = this.config.colors[colorKeys[index]] || 0xffffff;

    svgData.paths.forEach((path) => {
      const shapes = path.toShapes(true);

      shapes.forEach((shape) => {
        // Create wireframe from SVG path
        const points = shape.getPoints();
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const material = new THREE.LineBasicMaterial({
          color: color,
          opacity: this.config.svgOpacity,
          transparent: true,
          linewidth: 2,
        });

        const line = new THREE.LineLoop(geometry, material);

        // Apply scale and position
        line.scale.set(this.config.svgScale, this.config.svgScale, 1);
        line.position.y = height;

        // Rotate to match 3D coordinate system (SVG Y → 3D Z)
        line.rotation.x = -Math.PI / 2;

        // Store metadata
        line.userData = {
          type: 'svg-overlay',
          height: height,
          pathId: path.userData.node?.getAttribute('id') || 'unknown'
        };

        group.add(line);
      });
    });

    return group;
  }

  /**
   * Create coordinate system axes for reference
   */
  createAxisHelper(size = 100) {
    const axesHelper = new THREE.AxesHelper(size);
    axesHelper.name = 'WorldAxes';
    this.scene.add(axesHelper);

    // Add grid at y=0
    const gridHelper = new THREE.GridHelper(200, 20, 0x444444, 0x222222);
    gridHelper.name = 'GroundGrid';
    this.scene.add(gridHelper);

    // Add grids at other heights
    this.config.svgHeights.slice(1).forEach(height => {
      const grid = new THREE.GridHelper(200, 20, 0x333333, 0x111111);
      grid.position.y = height;
      grid.name = `Grid_Y${height}`;
      this.scene.add(grid);
    });

    console.log('[SVGDebugger] Added axis and grid helpers');
  }

  /**
   * Create markers for picking mesh positions from roomRegistry
   */
  createPickingMarkers(roomRegistry) {
    const markers = new THREE.Group();
    markers.name = 'PickingMarkers';

    Object.entries(roomRegistry).forEach(([roomId, data]) => {
      if (!data.center) return;

      const [x, y, z] = data.center;

      // Create sphere marker at picking position
      const geometry = new THREE.SphereGeometry(2, 16, 16);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        opacity: 0.7,
        transparent: true,
      });
      const marker = new THREE.Mesh(geometry, material);
      marker.position.set(x, y, z);
      marker.userData = { roomId, type: 'picking-marker' };

      // Add vertical line showing height
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0, z),
        new THREE.Vector3(x, y + 5, z),
      ]);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, opacity: 0.5, transparent: true });
      const line = new THREE.Line(lineGeometry, lineMaterial);

      markers.add(marker);
      markers.add(line);
    });

    this.scene.add(markers);
    console.log(`[SVGDebugger] Created ${markers.children.length / 2} picking markers`);
    return markers;
  }

  /**
   * Setup multiple orthographic views
   */
  setupOrthographicViews() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    // Top view (looking down Y-axis)
    this.views.top = new THREE.OrthographicCamera(
      -100 * aspect, 100 * aspect, 100, -100, 0.1, 1000
    );
    this.views.top.position.set(0, 200, 0);
    this.views.top.lookAt(0, 0, 0);
    this.views.top.name = 'TopView';

    // Front view (looking along Z-axis)
    this.views.front = new THREE.OrthographicCamera(
      -100 * aspect, 100 * aspect, 100, -100, 0.1, 1000
    );
    this.views.front.position.set(0, 50, 200);
    this.views.front.lookAt(0, 50, 0);
    this.views.front.name = 'FrontView';

    // Isometric view
    this.views.isometric = new THREE.OrthographicCamera(
      -100 * aspect, 100 * aspect, 100, -100, 0.1, 1000
    );
    this.views.isometric.position.set(100, 100, 100);
    this.views.isometric.lookAt(0, 20, 0);
    this.views.isometric.name = 'IsometricView';

    console.log('[SVGDebugger] Orthographic views created');
  }

  /**
   * Render split viewport with multiple views
   */
  renderSplitViews() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const viewWidth = Math.floor(width / 3);
    const viewHeight = height;

    // Clear
    this.renderer.clear();

    // Top view (left third)
    this.renderer.setViewport(0, 0, viewWidth, viewHeight);
    this.renderer.setScissor(0, 0, viewWidth, viewHeight);
    this.renderer.setScissorTest(true);
    this.renderer.render(this.scene, this.views.top);

    // Front view (middle third)
    this.renderer.setViewport(viewWidth, 0, viewWidth, viewHeight);
    this.renderer.setScissor(viewWidth, 0, viewWidth, viewHeight);
    this.renderer.render(this.scene, this.views.front);

    // Isometric view (right third)
    this.renderer.setViewport(viewWidth * 2, 0, viewWidth, viewHeight);
    this.renderer.setScissor(viewWidth * 2, 0, viewWidth, viewHeight);
    this.renderer.render(this.scene, this.views.isometric);

    this.renderer.setScissorTest(false);
  }

  /**
   * Add labels to views
   */
  addViewLabels() {
    const createLabel = (text, x, y) => {
      const label = document.createElement('div');
      label.textContent = text;
      label.style.position = 'absolute';
      label.style.left = x + 'px';
      label.style.top = y + 'px';
      label.style.color = 'white';
      label.style.fontFamily = 'monospace';
      label.style.fontSize = '14px';
      label.style.padding = '8px';
      label.style.background = 'rgba(0,0,0,0.7)';
      label.style.borderRadius = '4px';
      label.style.pointerEvents = 'none';
      document.body.appendChild(label);
      return label;
    };

    const width = window.innerWidth / 3;
    createLabel('TOP VIEW (Y-axis)', 20, 20);
    createLabel('FRONT VIEW (Z-axis)', width + 20, 20);
    createLabel('ISOMETRIC VIEW', width * 2 + 20, 20);
  }

  /**
   * Toggle visibility of SVG overlays
   */
  toggleOverlay(index) {
    if (this.svgGroups[index]) {
      this.svgGroups[index].visible = !this.svgGroups[index].visible;
      console.log(`[SVGDebugger] Overlay ${index} at Y=${this.config.svgHeights[index]}: ${this.svgGroups[index].visible ? 'visible' : 'hidden'}`);
    }
  }

  /**
   * Print diagnostic info
   */
  printDiagnostics(roomRegistry, extrudedGeometry) {
    console.group('[SVGDebugger] Coordinate System Diagnostics');

    console.log('SVG Configuration:');
    console.log('  - Scale factor:', this.config.svgScale);
    console.log('  - Overlay heights:', this.config.svgHeights);
    console.log('  - Coordinate mapping: SVG X → World X, SVG Y → World Z');

    console.log('\nRoom Registry Sample:');
    const sample = Object.entries(roomRegistry).slice(0, 3);
    sample.forEach(([id, data]) => {
      console.log(`  ${id}:`, data.center);
    });

    console.log('\nExpected Transformations:');
    console.log('  1. SVG coordinates (px) × 0.1 = World coordinates (m)');
    console.log('  2. SVG Y-axis → World Z-axis');
    console.log('  3. Fixed Y = 20 for picking meshes');
    console.log('  4. Rotation: -90° around X-axis');

    console.groupEnd();
  }

  /**
   * Cleanup
   */
  dispose() {
    this.svgGroups.forEach(group => {
      group.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      this.scene.remove(group);
    });
    this.svgGroups = [];
    console.log('[SVGDebugger] Disposed all overlays');
  }
}

/**
 * Quick setup function for testing
 */
export async function setupDebugVisualization(scene, camera, renderer, roomRegistry) {
  console.log('=== SVG Coordinate Debugger ===');

  const debugger = new SVGCoordinateDebugger(scene, camera, renderer);

  // Setup views
  debugger.setupOrthographicViews();
  debugger.addViewLabels();

  // Add reference helpers
  debugger.createAxisHelper(100);

  // Load SVG overlays at 3 heights
  await debugger.loadSVGOverlays();

  // Add picking mesh markers
  debugger.createPickingMarkers(roomRegistry);

  // Print diagnostics
  debugger.printDiagnostics(roomRegistry);

  console.log('\n=== Controls ===');
  console.log('Toggle overlays: debugger.toggleOverlay(0|1|2)');
  console.log('Render views: debugger.renderSplitViews()');
  console.log('  - Red overlay: Y=0 (ground)');
  console.log('  - Green overlay: Y=20 (picking height)');
  console.log('  - Blue overlay: Y=40 (top of blocks)');
  console.log('  - Yellow spheres: Picking mesh centers');

  // Expose to window for console access
  window.svgDebugger = debugger;

  return debugger;
}
