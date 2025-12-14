import * as THREE from 'three';

export class BackgroundView {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.mesh = null;
    this.resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
    this._init();
  }

  _init() {
    const geometry = new THREE.PlaneGeometry(2, 2, 1, 1);
    const uniforms = {
      uLightPosition: { value: new THREE.Vector2(0.5, 0.5) },
      uLightColor: { value: new THREE.Color(0x323850) }, // Alien.js light color
      uPower: { value: 1.5 },
      uAmount: { value: 0.3 },
      uResolution: { value: this.resolution }
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        precision highp float;
        varying vec2 vUv;
        uniform vec2 uLightPosition;
        uniform vec3 uLightColor;
        uniform float uPower;
        uniform float uAmount;
        uniform vec2 uResolution;
        void main() {
          vec3 color = vec3(0.0);
          vec2 uv = vUv - uLightPosition;
          uv.x *= uResolution.x / uResolution.y;
          float amount = length(uv);
          amount = pow(amount, uPower);
          amount *= 1.0 - uAmount;
          color += clamp(uLightColor * (1.0 - amount), 0.0, 1.0);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      transparent: true
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }

  update() {
    // No-op (kept for compatibility with animation loop)
  }

  handleResize(width, height) {
    const res = this.mesh?.material.uniforms.uResolution.value;
    if (res) {
      res.set(width, height);
    }
  }

  dispose() {
    if (!this.mesh) return;
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.mesh = null;
  }
}
