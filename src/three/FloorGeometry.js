import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

export class Floor {
  constructor(width = 320, height = 250, color = 0x2b2b2b) {
    const geometry = new THREE.PlaneGeometry(width, height);
    geometry.rotateX(Math.PI * -0.5);

    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 1.0,
      metalness: 0.6,
      emissiveIntensity: 1.0,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, -14, 0);
  }

  getMesh() {
    return this.mesh;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
