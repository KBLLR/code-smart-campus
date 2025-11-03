import * as THREE from "three";
import { materialRegistry } from "@/materials/registry.js";

export class RoomMaterialManager {
  constructor(settings) {
    this.settings = settings;
    this.cache = {};
    this.textureLoader = new THREE.TextureLoader();
  }

  getMaterialForRoom(roomMeta) {
    const key = roomMeta.vectorId || "default";

    if (this.cache[key]) return this.cache[key];

    const type = this.settings.materialStyle || "color";

    let material;
    switch (type) {
      case "tile":
        material = this.loadTexturedMaterial("/textures/tile.jpg");
        break;
      case "grid":
        material = this.loadTexturedMaterial("/textures/grid.png", true);
        break;
      case "brushed":
        material = this.loadTexturedMaterial("/textures/brushed-metal.jpg");
        break;
      case "random":
        material = materialRegistry.create("roomBase", {
          color: this.getRandomColor(roomMeta),
          roughness: 0.6,
          metalness: 0.2,
        });
        break;
      case "color":
      default:
        material = materialRegistry.create("roomBase", {
          color: this.generateColor(roomMeta),
          roughness: 0.7,
          metalness: 0.1,
        });
    }

    this.cache[key] = material;
    return material;
  }

  generateColor(roomMeta) {
    if (roomMeta.name?.toLowerCase().includes("server")) return 0xff0000;
    if (roomMeta.width > 1000) return 0x3b82f6;
    return 0x64748b;
  }

  getRandomColor(roomMeta) {
    const seed = roomMeta.vectorId?.length || 1;
    const hue = (seed * 47) % 360;
    return new THREE.Color(`hsl(${hue}, 50%, 60%)`);
  }

  loadTexturedMaterial(texturePath, repeat = false) {
    const material = materialRegistry.create("roomBase", {
      roughness: 0.55,
      metalness: 0.12,
    });
    this.textureLoader.load(
      texturePath,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        if (repeat) {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(4, 4);
        }
        material.map = texture;
        material.needsUpdate = true;
      },
      undefined,
      (error) => {
        console.warn(
          `[RoomMaterialManager] Failed to load texture '${texturePath}':`,
          error,
        );
      },
    );
    return material;
  }

  setMaterialForRoom(mesh, roomMeta) {
    mesh.material = this.getMaterialForRoom(roomMeta);
  }

  updateMaterialSettings(newSettings) {
    this.settings = newSettings;
    this.cache = {};
  }
}
