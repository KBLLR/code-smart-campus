import { debounce } from "lodash-es";
import * as THREE from "three";

const validationSchema = {
  // Appearance validations
  "appearance.rooms.opacity": {
    type: "number",
    min: 0,
    max: 1,
    transform: (v) => Math.min(Math.max(v, 0), 1),
  },
  "appearance.rooms.outlineWidth": {
    type: "number",
    min: 0,
    transform: (v) => Math.max(v, 0),
  },
  // Performance validations
  "performance.fpsTarget": {
    type: "number",
    min: 1,
    max: 240,
    transform: (v) => Math.min(Math.max(v, 1), 240),
  },
};

export const defaultSettings = {
  // Appearance
  appearance: {
    rooms: {
      defaultColor: 0x888888, // Default room color
      hoverColor: 0xff0000, // Color when hovering over a room
      selectedColor: 0xff0000, // Color when a room is selected
      selectedBlinkRate: 10, // Speed of color pulsing animation when selected
      outlineColor: 0x000000, // Color of room outlines
      outlineWidth: 1, // Width of room outlines
      opacity: 1.0, // Opacity of the rooms (0.0-1.0)
      extrusionHeight: 3, // Height of the extruded rooms
      bevelEnabled: false, // Whether to add bevels to the extrusion
      bevelThickness: 0.2, // Thickness of bevels if enabled
      bevelSize: 0.1, // Size of bevels if enabled
    },

    labels: {
      show: true, // Show room labels
      fontSize: 32, // Font size for room labels
      fontFamily: "Arial", // Font family for room labels
      textColor: "#000000", // Text color for room labels
      backgroundColor: "transparent", // Background color for labels
      opacity: 1.0, // Opacity of the labels when shown
      showOnHover: true, // Show labels only on hover
      showOnSelected: true, // Show labels on selected rooms
      heightOffset: 1.5, // Height offset for text above rooms
      autoScale: true, // Automatically scale text with zoom
    },

    lighting: {
      ambientIntensity: 0.6, // Intensity of ambient light
      ambientColor: 0xffffff, // Color of ambient light
      directionalIntensity: 0.5, // Intensity of directional light
      directionalColor: 0xffffff, // Color of directional light
      shadows: false, // Enable shadows
      shadowResolution: 1024, // Shadow map resolution
    },

    ground: {
      show: true, // Show the ground plane
      color: 0xcccccc, // Color of the ground plane
      roughness: 0.9, // Roughness of the ground material
      metalness: 0.3, // Metalness of the ground material
      size: { width: 80, height: 55 }, // Size of the ground plane
    },
  },

  // Interaction
  interaction: {
    enablePanning: true, // Allow camera panning
    enableZooming: true, // Allow camera zooming
    enableRotation: true, // Allow camera rotation
    panSpeed: 1.0, // Speed of camera panning
    zoomSpeed: 1.0, // Speed of camera zooming
    rotationSpeed: 1.0, // Speed of camera rotation
    invertY: false, // Invert Y axis for controls
    selectMode: "click", // Room selection mode ('click', 'dblclick', 'hover')
    hoverEffects: true, // Enable hover effects
    raycasterPrecision: 0.1, // Precision of the raycaster
    transitionSpeed: 0.1, // Speed of animations and transitions
    maxZoom: 10, // Maximum zoom level
    minZoom: 0.5, // Minimum zoom level
  },

  // Animation
  animation: {
    enable: true, // Enable animations
    selectedRoomLift: 1.0, // How high selected rooms are lifted
    hoveredRoomLift: 0.5, // How high hovered rooms are lifted
    animationDuration: 300, // Duration of animations in milliseconds
    easing: "easeOutQuad", // Easing function for animations
    fadeSpeed: 0.1, // Speed of color fading
    blinkEnabled: true, // Enable blinking for selected rooms
  },

  // Performance
  performance: {
    fpsTarget: 60, // Target FPS
    lowQualityMode: false, // Enable low quality mode for better performance
    antialiasing: true, // Enable antialiasing
    outlineDetail: "high", // Detail level for outlines ('low', 'medium', 'high')
    showFps: false, // Show FPS counter
    throttleEvents: false, // Throttle mouse events for better performance
    throttleDelay: 16, // Delay for throttled events in ms
  },

  // Advanced
  advanced: {
    debugMode: false, // Enable debug mode
    showBoundingBoxes: false, // Show bounding boxes around rooms
    showCentroids: false, // Show room centroids
    logRaycastEvents: false, // Log raycast events to console
    frustumSize: 50, // Size of the camera frustum
    coordinateScale: 1.0, // Scale factor for SVG coordinates
    preventRoomIntersections: true, // Prevent room intersection bugs
    showGrid: false, // Show a coordinate grid
    gridSize: 10, // Size of the grid
    gridDivisions: 10, // Number of grid divisions
  },
};

export class SettingsManager {
  constructor() {
    this.settings = structuredClone(defaultSettings);
    this.subscribers = new Map();
    this.notificationQueue = new Set();
    this.debouncedNotify = debounce(this.processNotifications, 100);
  }

  // Core Methods
  updateSettings(updates) {
    const prevSettings = structuredClone(this.settings);
    const validated = this.validateUpdates(updates);

    this.settings = this.mergeSettings(this.settings, validated);
    this.queueNotifications(prevSettings, this.settings);
    this.debouncedNotify();
    return this.settings;
  }

  validateUpdates(updates) {
    const validated = {};

    for (const [category, values] of Object.entries(updates)) {
      validated[category] = {};

      for (const [key, value] of Object.entries(values)) {
        const path = `${category}.${key}`;
        const schema = validationSchema[path];

        validated[category][key] = schema ? schema.transform(value) : value;
      }
    }

    return validated;
  }

  mergeSettings(target, source) {
    return Object.keys(source).reduce((acc, key) => {
      if (source[key] instanceof Object && key in target) {
        acc[key] = this.mergeSettings(target[key], source[key]);
      } else {
        acc[key] = source[key];
      }
      return acc;
    }, structuredClone(target));
  }

  // Subscription System
  subscribe(path, callback) {
    const keys = path.split(".");
    const finalKey = keys.pop();
    let current = this.subscribers;

    keys.forEach((key) => {
      if (!current.has(key)) current.set(key, new Map());
      current = current.get(key);
    });

    if (!current.has(finalKey)) current.set(finalKey, new Set());
    current.get(finalKey).add(callback);

    return () => this.unsubscribe(path, callback);
  }

  unsubscribe(path, callback) {
    const keys = path.split(".");
    let current = this.subscribers;

    for (const key of keys) {
      if (!current.has(key)) return;
      current = current.get(key);
    }

    current?.delete(callback);
  }

  // Notification System
  queueNotifications(prev, current, path = "") {
    for (const [key, value] of Object.entries(current)) {
      const currentPath = path ? `${path}.${key}` : key;
      const prevValue = prev?.[key];

      if (typeof value === "object" && value !== null) {
        this.queueNotifications(prevValue || {}, value, currentPath);
      } else if (!Object.is(prevValue, value)) {
        this.notificationQueue.add(currentPath);
      }
    }
  }

  processNotifications() {
    for (const path of this.notificationQueue) {
      const keys = path.split(".");
      let current = this.subscribers;
      let value = this.getNestedValue(path);

      for (const key of keys) {
        if (!current.has(key)) break;
        current = current.get(key);

        if (current instanceof Set) {
          current.forEach((cb) => cb(value, path));
        }
      }
    }

    this.notificationQueue.clear();
  }

  // Helper Methods
  getNestedValue(path) {
    return path.split(".").reduce((obj, key) => obj?.[key], this.settings);
  }

  save() {
    localStorage.setItem("appSettings", JSON.stringify(this.settings));
  }

  load() {
    const saved = localStorage.getItem("appSettings");
    if (saved) this.updateSettings(JSON.parse(saved));
  }

  reset() {
    this.settings = structuredClone(defaultSettings);
    this.queueNotifications({}, this.settings); // Notify all changes
    this.debouncedNotify();
  }
}

// Application Integration Layer
export class SettingsApplier {
  constructor(app, settingsManager) {
    this.app = app;
    this.settings = settingsManager;

    // Subscribe to relevant settings
    this.settings.subscribe("appearance", () => this.applyAppearanceSettings());
    this.settings.subscribe("interaction", () =>
      this.applyInteractionSettings(),
    );
    this.settings.subscribe("animation", () => this.applyAnimationSettings());
    this.settings.subscribe("performance", () =>
      this.applyPerformanceSettings(),
    );
    this.settings.subscribe("advanced", () => this.applyAdvancedSettings());
  }

  applyAppearanceSettings() {
    const { rooms, labels, lighting, ground } =
      this.settings.getNestedValue("appearance");

    // Update scene constants
    window.DEFAULT_COLOR = rooms.defaultColor;
    window.HOVER_COLOR = rooms.hoverColor;

    // Update room materials
    if (this.app.scene?.roomData) {
      this.app.scene.roomData.forEach((room) => {
        if (room.mesh) {
          room.mesh.material.opacity = rooms.opacity;
          room.mesh.material.transparent = rooms.opacity < 1;

          // Update outline
          const outline = room.mesh.children.find(
            (child) => child instanceof THREE.LineSegments,
          );
          if (outline) {
            outline.material.color.set(rooms.outlineColor);
            outline.material.linewidth = rooms.outlineWidth;
          }

          // Update labels
          if (room.nameTag) {
            const showLabel =
              labels.show &&
              ((room.id === this.app.scene.hoveredRoomId &&
                labels.showOnHover) ||
                (room.id === this.app.scene.selectedRoomId &&
                  labels.showOnSelected) ||
                (!labels.showOnHover && !labels.showOnSelected));

            room.nameTag.material.opacity = showLabel ? labels.opacity : 0;
            room.nameTag.position.y =
              rooms.extrusionHeight + labels.heightOffset;
          }
        }
      });
    }

    // Update lighting
    if (this.app.scene) {
      const ambientLight = this.app.scene.getObjectByType(THREE.AmbientLight);
      if (ambientLight) {
        ambientLight.color.set(lighting.ambientColor);
        ambientLight.intensity = lighting.ambientIntensity;
      }

      const directionalLight = this.app.scene.getObjectByType(
        THREE.DirectionalLight,
      );
      if (directionalLight) {
        directionalLight.color.set(lighting.directionalColor);
        directionalLight.intensity = lighting.directionalIntensity;
        directionalLight.castShadow = lighting.shadows;
        if (directionalLight.shadow) {
          directionalLight.shadow.mapSize.set(
            lighting.shadowResolution,
            lighting.shadowResolution,
          );
        }
      }

      // Update ground plane
      const plane = this.app.scene.children.find(
        (child) =>
          child instanceof THREE.Mesh &&
          child.geometry instanceof THREE.PlaneGeometry,
      );
      if (plane) {
        plane.visible = ground.show;
        plane.material.color.set(ground.color);
        plane.material.roughness = ground.roughness;
        plane.material.metalness = ground.metalness;
        plane.scale.set(ground.size.width, ground.size.height, 1);
      }
      if (this.app.materialManager) {
        this.app.materialManager.updateMaterialSettings(
          this.settings.getNestedValue("appearance"),
        );
        this.app.materialManager.applyToAllRooms(this.app.scene);
      }
    }
  }

  applyInteractionSettings() {
    const interaction = this.settings.getNestedValue("interaction");

    // Camera controls
    if (this.app.controls) {
      this.app.controls.enablePan = interaction.enablePanning;
      this.app.controls.enableZoom = interaction.enableZooming;
      this.app.controls.enableRotate = interaction.enableRotation;
      this.app.controls.panSpeed = interaction.panSpeed;
      this.app.controls.zoomSpeed = interaction.zoomSpeed;
      this.app.controls.rotateSpeed = interaction.rotationSpeed;
      this.app.controls.invertY = interaction.invertY;
      this.app.controls.maxZoom = interaction.maxZoom;
      this.app.controls.minZoom = interaction.minZoom;
    }

    // Raycaster
    if (this.app.raycasterHandler) {
      this.app.raycasterHandler.raycaster.params.Line.threshold =
        interaction.raycasterPrecision;
      this.app.raycasterHandler.raycaster.params.Points.threshold =
        interaction.raycasterPrecision;
      this.app.raycasterHandler.selectMode = interaction.selectMode;
      this.app.raycasterHandler.enableHoverEffects = interaction.hoverEffects;
    }
  }

  applyAnimationSettings() {
    const animation = this.settings.getNestedValue("animation");
    this.app.animationSettings = animation;

    if (!animation.enable && this.app.scene?.roomData) {
      this.app.scene.roomData.forEach((room) => {
        if (room.mesh) {
          room.mesh.position.y = 0;
          room.mesh.material.color.set(
            this.settings.getNestedValue("appearance.rooms.defaultColor"),
          );
        }
      });
    }
  }

  applyPerformanceSettings() {
    const performance = this.settings.getNestedValue("performance");

    if (this.app.renderer) {
      this.app.renderer.antialias = performance.antialiasing;
      this.app.renderer.setPixelRatio(
        performance.lowQualityMode ? 1 : Math.min(window.devicePixelRatio, 2),
      );

      if (this.app.stats) {
        this.app.stats.dom.style.display = performance.showFps
          ? "block"
          : "none";
      }
    }

    if (this.app.raycasterHandler) {
      this.app.raycasterHandler.throttleEvents = performance.throttleEvents;
      this.app.raycasterHandler.throttleDelay = performance.throttleDelay;
    }
  }

  applyAdvancedSettings() {
    const advanced = this.settings.getNestedValue("advanced");

    // Debug visualization
    if (this.app.scene) {
      // Wireframe mode
      this.app.scene.traverse((child) => {
        if (child.material) child.material.wireframe = advanced.debugMode;
      });

      // Grid helper
      let grid = this.app.scene.getObjectByType(THREE.GridHelper);
      if (advanced.showGrid) {
        if (!grid) {
          grid = new THREE.GridHelper(
            advanced.gridSize,
            advanced.gridDivisions,
          );
          grid.name = "debug-grid";
          this.app.scene.add(grid);
        }
        grid.visible = true;
      } else if (grid) {
        grid.visible = false;
      }

      // Bounding boxes and centroids
      if (this.app.scene.roomData) {
        this.app.scene.roomData.forEach((room) => {
          if (room.mesh) {
            // Bounding boxes
            let bbox = room.mesh.getObjectByName("bounding-box");
            if (advanced.showBoundingBoxes) {
              if (!bbox) {
                const box = new THREE.BoxHelper(room.mesh, 0xffff00);
                box.name = "bounding-box";
                room.mesh.add(box);
              }
            } else if (bbox) {
              bbox.removeFromParent();
            }

            // Centroids
            let centroid = room.mesh.getObjectByName("centroid");
            if (advanced.showCentroids) {
              if (!centroid) {
                const geometry = new THREE.SphereGeometry(0.2);
                const material = new THREE.MeshBasicMaterial({
                  color: 0xff00ff,
                });
                centroid = new THREE.Mesh(geometry, material);
                centroid.name = "centroid";
                centroid.position.set(
                  room.centroid.x,
                  room.mesh.position.y + 1,
                  room.centroid.y,
                );
                room.mesh.add(centroid);
              }
            } else if (centroid) {
              centroid.removeFromParent();
            }
          }
        });
      }
    }

    // Raycast logging
    if (this.app.raycasterHandler) {
      if (advanced.logRaycastEvents) {
        if (!this.app.raycasterHandler._originalOnPointerMove) {
          this.app.raycasterHandler._originalOnPointerMove =
            this.app.raycasterHandler.onPointerMove;
          this.app.raycasterHandler._originalOnClick =
            this.app.raycasterHandler.onClick;

          this.app.raycasterHandler.onPointerMove = (event) => {
            console.log("Raycast Event:", event);
            this.app.raycasterHandler._originalOnPointerMove(event);
          };

          this.app.raycasterHandler.onClick = (event) => {
            console.log("Raycast Click:", event);
            this.app.raycasterHandler._originalOnClick(event);
          };
        }
      } else if (this.app.raycasterHandler._originalOnPointerMove) {
        this.app.raycasterHandler.onPointerMove =
          this.app.raycasterHandler._originalOnPointerMove;
        this.app.raycasterHandler.onClick =
          this.app.raycasterHandler._originalOnClick;
        delete this.app.raycasterHandler._originalOnPointerMove;
        delete this.app.raycasterHandler._originalOnClick;
      }
    }
  }
}
