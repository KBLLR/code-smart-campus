// src/ui/createLabel.js
import * as THREE from "three";
import { makeTextTexture } from "@ui/makeTextTexture.js";

export function createLabel(text = "Label", entityId = "") {
  const texture = makeTextTexture(text, entityId);

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.center.set(0.5, 0.5); // center origin

  // Capsule effect dimensions are derived from texture size
  const width = texture.image.width;
  const height = texture.image.height;
  sprite.scale.set(width * 0.2, height * 0.2, 1); // scaled to match canvas dimensions

  // Glowing aura (invisible by default)
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const glowGeometry = new THREE.RingGeometry(20, 28, 32);
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.1;

  const group = new THREE.Group();
  group.add(sprite);
  group.add(glow);
  group.userData = { sprite, glow, value: text, intensity: 0, room: null };

  group.tick = () => {
    const i = group.userData.intensity || 0;
    glow.material.opacity = 0.05 + i * 0.25;
    glow.scale.setScalar(1 + i * 1.5);
  };

  return group;
}
