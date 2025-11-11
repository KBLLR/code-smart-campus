/**
 * AssetManager.ts
 * Reference-counted asset caching for shared resources
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

interface AssetEntry {
  asset: THREE.Texture | THREE.BufferGeometry | THREE.Group | any;
  refCount: number;
  type: "texture" | "geometry" | "model";
  url: string;
}

export interface IAssetManager {
  getTexture(key: string, url?: string): Promise<THREE.Texture>;
  getGeometry(key: string, url?: string): Promise<THREE.BufferGeometry>;
  getModel(key: string, url: string): Promise<THREE.Group>;
  release(key: string): void;
  preload(key: string, url: string, type: "texture" | "geometry" | "model"): Promise<void>;
  getStats(): { cached: Array<{ key: string; type: string; refCount: number }>; memoryEstimate: number };
  forceDispose(key: string): void;
  clearUnused(): void;
  dispose(): void;
}

export class AssetManager implements IAssetManager {
  private cache: Map<string, AssetEntry> = new Map();
  private loaders = {
    texture: new THREE.TextureLoader(),
    gltf: new GLTFLoader(),
  };

  async getTexture(key: string, url?: string): Promise<THREE.Texture> {
    let entry = this.cache.get(key);

    if (!entry && url) {
      try {
        const texture = await this.loaders.texture.loadAsync(url);
        entry = { asset: texture, refCount: 0, type: "texture", url };
        this.cache.set(key, entry);
        console.log(`[AssetManager] Loaded texture: ${key}`);
      } catch (e) {
        console.error(`[AssetManager] Failed to load texture ${key}:`, e);
        throw e;
      }
    }

    if (entry) {
      entry.refCount++;
      console.debug(`[AssetManager] Referenced texture ${key} (refCount=${entry.refCount})`);
      return entry.asset as THREE.Texture;
    }

    throw new Error(`Texture "${key}" not found in cache`);
  }

  async getGeometry(key: string, url?: string): Promise<THREE.BufferGeometry> {
    let entry = this.cache.get(key);

    if (!entry && url) {
      try {
        // Placeholder: Load geometry from URL
        // In practice, you might load from GLTF or custom format
        console.warn(`[AssetManager] Geometry loading not yet implemented for ${key}`);
        throw new Error("Geometry loading not implemented");
      } catch (e) {
        console.error(`[AssetManager] Failed to load geometry ${key}:`, e);
        throw e;
      }
    }

    if (entry) {
      entry.refCount++;
      return entry.asset as THREE.BufferGeometry;
    }

    throw new Error(`Geometry "${key}" not found in cache`);
  }

  async getModel(key: string, url: string): Promise<THREE.Group> {
    let entry = this.cache.get(key);

    if (!entry) {
      try {
        const gltf = await this.loaders.gltf.loadAsync(url);
        entry = { asset: gltf.scene, refCount: 0, type: "model", url };
        this.cache.set(key, entry);
        console.log(`[AssetManager] Loaded model: ${key}`);
      } catch (e) {
        console.error(`[AssetManager] Failed to load model ${key}:`, e);
        throw e;
      }
    }

    if (entry) {
      entry.refCount++;
      console.debug(`[AssetManager] Referenced model ${key} (refCount=${entry.refCount})`);
      return entry.asset as THREE.Group;
    }

    throw new Error(`Model "${key}" not found in cache`);
  }

  release(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      entry.refCount--;
      console.debug(`[AssetManager] Released ${entry.type} ${key} (refCount=${entry.refCount})`);
      if (entry.refCount < 0) {
        console.warn(`[AssetManager] WARNING: Negative refCount for ${key}`);
      }
    }
  }

  async preload(
    key: string,
    url: string,
    type: "texture" | "geometry" | "model"
  ): Promise<void> {
    if (!this.cache.has(key)) {
      try {
        if (type === "texture") {
          const tex = await this.getTexture(key, url);
          this.release(key); // Preload adds ref, so release it
        } else if (type === "geometry") {
          const geo = await this.getGeometry(key, url);
          this.release(key);
        } else if (type === "model") {
          const model = await this.getModel(key, url);
          this.release(key);
        }
        console.log(`[AssetManager] Preloaded ${type}: ${key}`);
      } catch (e) {
        console.error(`[AssetManager] Preload failed for ${key}:`, e);
      }
    }
  }

  getStats(): {
    cached: Array<{ key: string; type: string; refCount: number }>;
    memoryEstimate: number;
  } {
    const cached = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      type: entry.type,
      refCount: entry.refCount,
    }));
    const memoryEstimate = this.estimateMemory();
    return { cached, memoryEstimate };
  }

  forceDispose(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      (entry.asset as any).dispose?.();
      this.cache.delete(key);
      console.log(`[AssetManager] Force disposed: ${key}`);
    }
  }

  clearUnused(): void {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.refCount <= 0) {
        (entry.asset as any).dispose?.();
        this.cache.delete(key);
        count++;
      }
    }
    console.log(`[AssetManager] Cleared ${count} unused assets`);
  }

  dispose(): void {
    for (const [, entry] of this.cache.entries()) {
      (entry.asset as any).dispose?.();
    }
    this.cache.clear();
    console.log("[AssetManager] Disposed all assets");
  }

  private estimateMemory(): number {
    let total = 0;
    for (const entry of this.cache.values()) {
      if (entry.type === "texture") {
        const tex = entry.asset as THREE.Texture;
        const w = tex.image?.width || 0;
        const h = tex.image?.height || 0;
        total += w * h * 4; // RGBA, 1 byte per channel
      } else if (entry.type === "geometry") {
        const geo = entry.asset as THREE.BufferGeometry;
        for (const attr of Object.values(geo.attributes)) {
          total += (attr as any).array.byteLength;
        }
      } else if (entry.type === "model") {
        total += 1024 * 1024; // 1MB placeholder
      }
    }
    return total;
  }
}
