/**
 * GLBLoader - Loads and processes GLTF/GLB models
 * Handles Blender exports correctly
 */

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class GLBLoader {
  constructor(scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
  }

  /**
   * Load a GLB file and return the processed model
   */
  async load(url) {
    console.log(`[GLBLoader] Loading model from: ${url}`);

    try {
      const gltf = await this.loader.loadAsync(url, (progress) => {
        const percent = (progress.loaded / progress.total) * 100;
        console.log(`[GLBLoader] Progress: ${percent.toFixed(1)}%`);
      });

      console.log('[GLBLoader] Model loaded successfully');
      console.log('[GLBLoader] GLTF structure:', {
        hasScene: !!gltf.scene,
        hasScenes: !!gltf.scenes,
        scenesCount: gltf.scenes?.length || 0,
      });

      // Blender exports may have scene in scenes[0] instead of scene
      let modelScene = gltf.scene;
      if (!modelScene && gltf.scenes && gltf.scenes.length > 0) {
        modelScene = gltf.scenes[0];
        console.log('[GLBLoader] Using scenes[0] (Blender export)');
      }

      if (!modelScene) {
        throw new Error('No valid scene found in GLTF file');
      }

      // Process and add to scene
      this.scene.add(modelScene);

      // Extract features (rooms, buttons)
      const { rooms, buttons } = this._extractFeatures(modelScene);

      console.log(`[GLBLoader] ✓ Found ${rooms.length} rooms and ${buttons.length} buttons`);

      return {
        scene: modelScene,
        rooms,
        buttons, // Export buttons
        gltf,
      };
    } catch (error) {
      console.error('[GLBLoader] Failed to load model:', error);
      throw error;
    }
  }

  /**
   * Extract rooms and buttons from the loaded model
   */
  _extractFeatures(modelScene) {
    const rooms = [];
    const buttons = [];
    // Objects to hide or ignore
    const skipObjects = ['projection_live', 'projectionlive', 'walls'];

    modelScene.traverse((object) => {
      if (object.isMesh) {
        const meshName = object.name || 'unnamed';
        const lowerName = meshName.toLowerCase();
        const normId = lowerName.replace(/[^a-z0-9]/g, '');

        // 1. Skip ignored objects
        if (skipObjects.includes(normId)) {
          console.log(`[GLBLoader] Hiding: ${meshName}`);
          object.visible = false;
          return;
        }

        // 2. Identify Buttons (prefix "bttn")
        if (lowerName.startsWith('bttn')) {
          object.castShadow = true;
          object.receiveShadow = true;
          object.userData.isButton = true;
          object.userData.buttonId = meshName; // e.g. "bttn - learning - units"

          buttons.push({
            id: meshName,
            name: meshName, // Keep original name for parsing later
            mesh: object
          });
          console.log(`[GLBLoader] Button found: ${meshName}`);
          return;
        }

        // 3. Identify Rooms
        // We assume anything else interesting in the "rooms" collection or named appropriately is a room.
        // The user tree shows a "rooms" folder. In GLTF, this is an object.
        // We can check if the parent is "rooms" OR just treat remaining meshes as rooms (safest for now).
        // Let's exclude "floormap" explicitly from being a "room" but keep it visible.

        if (normId === 'floormap') {
          object.castShadow = false; // Floor usually receives shadow
          object.receiveShadow = true;
          console.log(`[GLBLoader] Floor map found: ${meshName}`);
          return;
        }

        // It is a room
        object.castShadow = true;
        object.receiveShadow = true;
        object.userData.roomId = normId;
        object.userData.roomName = meshName;

        rooms.push({
          id: normId,
          name: meshName,
          mesh: object,
        });

        // Debug
        // console.log(`[GLBLoader] Room found: ${meshName} → ${normId}`);
      }
    });

    return { rooms, buttons };
  }
}
