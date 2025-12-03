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

      // Extract room meshes
      const rooms = this._extractRooms(modelScene);

      console.log(`[GLBLoader] ✓ Found ${rooms.length} room meshes`);

      return {
        scene: modelScene,
        rooms,
        gltf,
      };
    } catch (error) {
      console.error('[GLBLoader] Failed to load model:', error);
      throw error;
    }
  }

  /**
   * Extract room meshes from the loaded model
   */
  _extractRooms(modelScene) {
    const rooms = [];
    const skipObjects = ['projection_live', 'projectionlive', 'walls', 'floor'];

    modelScene.traverse((object) => {
      if (object.isMesh) {
        const meshName = object.name || 'unnamed';
        const normId = meshName.toLowerCase().replace(/[^a-z0-9]/g, '');

        // Skip non-room objects
        if (skipObjects.includes(normId)) {
          console.log(`[GLBLoader] Hiding: ${meshName}`);
          object.visible = false;
          return;
        }

        // Enable shadows
        object.castShadow = true;
        object.receiveShadow = true;

        // Store room data
        object.userData.roomId = normId;
        object.userData.roomName = meshName;

        rooms.push({
          id: normId,
          name: meshName,
          mesh: object,
        });

        console.log(`[GLBLoader] Room found: ${meshName} → ${normId}`);
      }
    });

    return rooms;
  }
}
