import * as THREE from 'three';

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.clock = new THREE.Clock();
    }

    async init() {
        console.log('[SceneManager] Setting up 3D world...');

        // Renderer Setup
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.body.appendChild(this.renderer.domElement);

        // Camera Setup
        this.camera.position.set(100, 100, 100);
        this.camera.lookAt(0, 0, 0);

        // Lighting
        const ambient = new THREE.AmbientLight(0x404040);
        this.scene.add(ambient);
        const sun = new THREE.DirectionalLight(0xffffff, 1);
        sun.position.set(50, 100, 50);
        this.scene.add(sun);

        // Resize Handler
        window.addEventListener('resize', () => this.onResize());
    }

    start() {
        this.renderer.setAnimationLoop(() => this.render());
    }

    render() {
        const delta = this.clock.getDelta();
        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
