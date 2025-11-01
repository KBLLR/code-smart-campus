import * as THREE from "three";
import { makeTextTexture } from "@ui/makeTextTexture.js";

export class Label {
  constructor({
    text = "Label",
    position = [0, 0, 0],
    intensity = 0,
    visible = true,
  }) {
    this.text = text;
    this.intensity = intensity;
    this.visible = visible;

    this.sprite = this.createSprite(text);
    this.glow = this.createGlow();

    this.group = new THREE.Group();
    this.group.add(this.sprite);
    this.group.add(this.glow);
    this.group.position.set(...position);
    this.group.visible = visible;
  }

  createSprite(text) {
    const texture = makeTextTexture(text);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(80, 40, 1);
    return sprite;
  }

  createGlow() {
    const geometry = new THREE.RingGeometry(30, 40, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(geometry, material);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.1;
    return glow;
  }

  update(text) {
    this.text = text;
    this.sprite.material.map.dispose();
    this.sprite.material.map = makeTextTexture(text);
  }

  setPosition(x, y, z) {
    this.group.position.set(x, y, z);
  }

  setIntensity(value) {
    this.intensity = value;
    this.glow.material.opacity = 0.05 + value * 0.25;
    this.glow.scale.setScalar(1 + value * 2);
  }

  show() {
    this.group.visible = true;
  }

  hide() {
    this.group.visible = false;
  }

  get object3D() {
    return this.group;
  }
}
