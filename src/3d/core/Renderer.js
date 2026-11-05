
import * as THREE from 'three';

export class Renderer {
    constructor({ canvas, width, height, pixelRatio = window.devicePixelRatio, toneMapping = THREE.ACESFilmicToneMapping }) {
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
        });

        this.renderer.setClearColor(0x000000, 0);
        this.renderer.autoClear = false;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = toneMapping;
        this.renderer.toneMappingExposure = 1.0;

        this.setSize(width, height);
        this.setPixelRatio(pixelRatio);
    }

    /** WebGL availability check that does not leave a context behind. */
    static isWebGLAvailable() {
        try {
            const probe = document.createElement('canvas');
            const gl = probe.getContext('webgl2') || probe.getContext('webgl');
            gl?.getExtension('WEBGL_lose_context')?.loseContext();
            return Boolean(gl);
        } catch {
            return false;
        }
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
