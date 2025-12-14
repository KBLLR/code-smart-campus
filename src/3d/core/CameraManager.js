import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import TWEEN from '@tweenjs/tween.js';

export class CameraManager {
    constructor({ width, height, domElement }) {
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
        this.camera.position.set(200, 150, 200);
        this.camera.lookAt(0, 0, 0);

        this.controls = new OrbitControls(this.camera, domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 50;
        this.controls.maxDistance = 800;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below ground
    }

    getCamera() {
        return this.camera;
    }

    resize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    update(dt) {
        this.controls.update();
        TWEEN.update();
    }

    dispose() {
        this.controls.dispose();
    }

    // Future: Transition logic using GSAP/Tween
    transitionTo(targetPosition, targetLookAt, duration = 1.0) {
        const durationMs = duration * 1000;

        // Tween Position
        new TWEEN.Tween(this.camera.position)
            .to({ x: targetPosition.x, y: targetPosition.y, z: targetPosition.z }, durationMs)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();

        // Tween Target (Controls)
        new TWEEN.Tween(this.controls.target)
            .to({ x: targetLookAt.x, y: targetLookAt.y, z: targetLookAt.z }, durationMs)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate(() => {
                this.controls.update();
            })
            .start();
    }
}
