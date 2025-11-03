// src/lib/SunPathArc.js
import * as THREE from "three";

const MAX_POINTS = 96;
const ARC_OPACITY = 0.35;
const ARC_COLOR = "#ffd48a";

export class SunPathArc {
  constructor() {
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.LineBasicMaterial({
      color: new THREE.Color(ARC_COLOR),
      transparent: true,
      opacity: ARC_OPACITY,
      linewidth: 2,
    });
    this.line = new THREE.Line(this.geometry, this.material);
    this.line.name = "SunPathArc";
    this.line.visible = false;
  }

  /**
   * Updates the path with the latest samples.
   * @param {Array<{ azimuth: number, elevation: number }>} samples
   * @param {(azimuth: number, elevation: number) => THREE.Vector3} computePosition
   */
  update(samples, computePosition) {
    if (!samples || samples.length < 2) {
      this.#setVisible(false);
      return;
    }

    const points = samples
      .slice(-MAX_POINTS)
      .map((sample) => computePosition(sample.azimuth, sample.elevation));

    if (points.length < 2) {
      this.#setVisible(false);
      return;
    }

    const newGeometry = new THREE.BufferGeometry();
    newGeometry.setFromPoints(points);

    const oldGeometry = this.line.geometry;
    this.line.geometry = newGeometry;
    this.geometry = newGeometry;
    if (oldGeometry) oldGeometry.dispose();
    this.#setVisible(true);
  }

  /**
   * Adjusts line opacity for day/night blending.
   * @param {number} value
   */
  setOpacity(value) {
    this.material.opacity = THREE.MathUtils.clamp(value, 0, 1);
    this.material.needsUpdate = true;
  }

  setColor(color) {
    this.material.color.set(color);
    this.material.needsUpdate = true;
  }

  #setVisible(visible) {
    if (!visible) {
      this.line.visible = false;
      return;
    }
    this.line.visible = true;
  }
}
