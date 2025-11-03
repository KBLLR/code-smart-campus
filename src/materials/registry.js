import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

const MATERIAL_PRESETS = {
  roomBase: {
    type: "standard",
    color: "#243649",
    roughness: 0.55,
    metalness: 0.15,
    envMapIntensity: 0.45,
  },
  roomHighlight: {
    type: "standard",
    color: "#5eead4",
    roughness: 0.35,
    metalness: 0.05,
    envMapIntensity: 0.35,
    emissive: "#22d3ee",
    emissiveIntensity: 1.2,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  },
  floorPlate: {
    type: "standard",
    color: "#1b2535",
    roughness: 0.65,
    metalness: 0.05,
    envMapIntensity: 0.25,
    receiveShadow: true,
  },
  glassShell: {
    type: "physical",
    color: "#9ec1d9",
    roughness: 0.15,
    metalness: 0.9,
    envMapIntensity: 0.75,
    transparent: true,
    opacity: 0.55,
    transmission: 0.4,
    thickness: 0.3,
  },
  metalTrim: {
    type: "standard",
    color: "#6b7280",
    roughness: 0.4,
    metalness: 0.6,
    envMapIntensity: 0.6,
  },
  sensorNode: {
    type: "standard",
    color: "#38bdf8",
    roughness: 0.2,
    metalness: 0.4,
    envMapIntensity: 0.55,
    emissive: "#0ea5e9",
    emissiveIntensity: 1.1,
  },
};

const toColor = (value, fallback) => {
  if (value instanceof THREE.Color) return value.clone();
  try {
    return new THREE.Color(value ?? fallback ?? "#ffffff");
  } catch {
    return new THREE.Color(fallback ?? "#ffffff");
  }
};

class MaterialRegistry {
  constructor() {
    this.envMap = null;
    this.renderer = null;
    this.pmremGenerator = null;
    this.initPromise = null;
    this.trackedMaterials = new Map();
    this.proceduralTextures = {};
  }

  async init({ renderer } = {}) {
    if (renderer) {
      this.renderer = renderer;
    }
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve) => {
      const loader = new RGBELoader();
      loader.setPath("/hdri/");
      loader.load(
        "night1k.hdr",
        (texture) => {
          if (this.renderer) {
            try {
              this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
              this.pmremGenerator.compileEquirectangularShader();
              const envRT = this.pmremGenerator.fromEquirectangular(texture);
              this.envMap = envRT.texture;
              this.pmremGenerator.dispose();
            } catch (error) {
              console.warn(
                "[MaterialRegistry] PMREM generation failed, using raw HDR as environment.",
                error,
              );
              texture.mapping = THREE.EquirectangularReflectionMapping;
              this.envMap = texture;
            }
          } else {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            this.envMap = texture;
          }
          texture.dispose?.();
          this._applyEnvMapToTracked();
          resolve(this.envMap);
        },
        undefined,
        (err) => {
          console.warn(
            "[MaterialRegistry] Failed to load environment map (/hdri/night1k.hdr). Reflections disabled.",
            err,
          );
          resolve(null);
        },
      );
    });

    return this.initPromise;
  }

  getEnvironmentMap() {
    return this.envMap;
  }

  create(key, overrides = {}) {
    const preset = MATERIAL_PRESETS[key];
    if (!preset) {
      throw new Error(`[MaterialRegistry] Unknown material key: ${key}`);
    }

    const baseParams = {
      color: toColor(overrides.color ?? preset.color, preset.color),
      roughness: overrides.roughness ?? preset.roughness ?? 0.5,
      metalness: overrides.metalness ?? preset.metalness ?? 0,
      side: overrides.side ?? preset.side ?? THREE.FrontSide,
      transparent: overrides.transparent ?? preset.transparent ?? false,
      opacity: overrides.opacity ?? preset.opacity ?? 1,
      depthWrite: overrides.depthWrite ?? preset.depthWrite ?? true,
    };

    let material;
    if (preset.type === "physical") {
      const params = {
        ...baseParams,
        transmission: overrides.transmission ?? preset.transmission ?? 0,
        thickness: overrides.thickness ?? preset.thickness ?? 0.1,
        ior: overrides.ior ?? preset.ior ?? 1.4,
      };
      material = new THREE.MeshPhysicalMaterial(params);
    } else {
      material = new THREE.MeshStandardMaterial(baseParams);
    }

    if (preset.blending) material.blending = preset.blending;
    if (preset.receiveShadow !== undefined) {
      material.receiveShadow = preset.receiveShadow;
    }

    const emissive = overrides.emissive ?? preset.emissive;
    if (emissive) {
      material.emissive = toColor(emissive, preset.emissive);
      material.emissiveIntensity =
        overrides.emissiveIntensity ?? preset.emissiveIntensity ?? 1;
    }

    if (overrides.map) {
      material.map = overrides.map;
      material.map.colorSpace = overrides.map.colorSpace ?? THREE.SRGBColorSpace;
    } else if (key === "floorPlate") {
      const floorTex = this._getProceduralFloorTexture();
      if (floorTex) {
        material.map = floorTex;
      }
    }

    if (overrides.aoMap) material.aoMap = overrides.aoMap;
    if (overrides.normalMap) material.normalMap = overrides.normalMap;
    if (overrides.metalnessMap) material.metalnessMap = overrides.metalnessMap;

    return this.register(material, key, overrides);
  }

  register(material, key, overrides = {}) {
    if (!(material instanceof THREE.Material)) return material;
    let set = this.trackedMaterials.get(key);
    if (!set) {
      set = new Set();
      this.trackedMaterials.set(key, set);
    }
    set.add(material);

    material.userData = material.userData || {};
    const preset = MATERIAL_PRESETS[key] || {};
    material.userData.__materialRegistry = {
      key,
      envMapIntensity:
        overrides.envMapIntensity ??
        preset.envMapIntensity ??
        material.envMapIntensity ??
        0.5,
    };

    if (this.envMap) {
      this._applyEnvMap(material);
    }

    return material;
  }

  decorate(material, key, overrides = {}) {
    return this.register(material, key, overrides);
  }

  refresh() {
    this._applyEnvMapToTracked();
  }

  _applyEnvMap(material) {
    if (!material || !this.envMap) return;
    const meta = material.userData?.__materialRegistry;
    material.envMap = this.envMap;
    if (meta?.envMapIntensity !== undefined) {
      material.envMapIntensity = meta.envMapIntensity;
    }
    material.needsUpdate = true;
  }

  _applyEnvMapToTracked() {
    if (!this.envMap) return;
    this.trackedMaterials.forEach((set) => {
      set.forEach((material) => this._applyEnvMap(material));
    });
  }

  _getProceduralFloorTexture() {
    if (this.proceduralTextures.floor) return this.proceduralTextures.floor;
    if (typeof document === "undefined") return null;

    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#1d2533";
    ctx.fillRect(0, 0, size, size);

    const squares = 18;
    for (let y = 0; y < squares; y++) {
      for (let x = 0; x < squares; x++) {
        const offset = (x + y) % 2 === 0 ? 0.06 : -0.06;
        const lightness = 28 + offset * 100;
        ctx.fillStyle = `hsl(213, 22%, ${lightness}%)`;
        const tileSize = size / squares;
        ctx.fillRect(
          x * tileSize,
          y * tileSize,
          tileSize,
          tileSize,
        );
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    texture.anisotropy = 4;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.proceduralTextures.floor = texture;
    return texture;
  }
}

export const materialRegistry = new MaterialRegistry();
