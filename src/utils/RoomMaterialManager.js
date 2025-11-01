import * as THREE from "three";

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
        material = new THREE.MeshStandardMaterial({
          color: this.getRandomColor(roomMeta),
          roughness: 0.6,
          metalness: 0.2,
        });
        break;
      case "color":
      default:
        material = new THREE.MeshStandardMaterial({
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
    const texture = this.textureLoader.load(texturePath);
    if (repeat) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(4, 4);
    }
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.5,
      metalness: 0.1,
    });
  }

  setMaterialForRoom(mesh, roomMeta) {
    mesh.material = this.getMaterialForRoom(roomMeta);
  }

  updateMaterialSettings(newSettings) {
    this.settings = newSettings;
    this.cache = {};
  }
}
