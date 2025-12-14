
import * as THREE from 'three';

export class Renderer {
    constructor({ canvas, width, height, pixelRatio = window.devicePixelRatio }) {
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
        });

        this.renderer.setClearColor(0x000000, 0);
        this.renderer.autoClear = false;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        this.setSize(width, height);
        this.setPixelRatio(pixelRatio);
    }

    setSize(width, height) {
        this.renderer.setSize(width, height);
    }

    setPixelRatio(ratio) {
        this.renderer.setPixelRatio(Math.min(ratio, 2));
    }

    render(scene, camera) {
        this.renderer.render(scene, camera);
    }

    clear() {
        this.renderer.clear();
    }

    clearDepth() {
        this.renderer.clearDepth();
    }

    get domElement() {
        return this.renderer.domElement;
    }

    dispose() {
        this.renderer.dispose();
    }
}
