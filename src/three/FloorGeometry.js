import * as THREE from "three";
import { materialRegistry } from "@/materials/registry.js";

export class Floor {
  constructor(width = 320, height = 250, color = 0x2b2b2b) {
    const geometry = new THREE.PlaneGeometry(width, height);
    geometry.rotateX(Math.PI * -0.5);

    const material = materialRegistry.create("floorPlate", {
      color,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, -14, 0);
    this.mesh.receiveShadow = true;
  }

  getMesh() {
    return this.mesh;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
