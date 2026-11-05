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
        this.controls.minDistance = 12;
        this.controls.maxDistance = 900;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below ground
        this.controls.screenSpacePanning = true;

        this._tweens = [];
        // tween.js >= 23 no longer adds tweens to the global group automatically, so the
        // previous `new TWEEN.Tween(obj)` transitions never ran. Own the group explicitly.
        this.tweenGroup = new TWEEN.Group();
        // A user drag/zoom takes over from an in-flight transition.
        this.controls.addEventListener('start', () => this._stopTweens());
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
        this.tweenGroup.update();
    }

    dispose() {
        this.controls.dispose();
    }

    /** Place the camera immediately (reduced motion, first frame). */
    jumpTo(targetPosition, targetLookAt) {
        this._stopTweens();
        this.camera.position.copy(targetPosition);
        this.controls.target.copy(targetLookAt);
        this.camera.lookAt(targetLookAt);
        this.controls.update();
    }

    _stopTweens() {
        this._tweens.forEach(t => {
            t.stop();
            this.tweenGroup.remove(t);
        });
        this._tweens = [];
    }

    transitionTo(targetPosition, targetLookAt, duration = 1.0) {
        if (!duration || duration <= 0) {
            this.jumpTo(targetPosition, targetLookAt);
            return;
        }
        // A new selection interrupts the previous move instead of fighting it.
        this._stopTweens();
        const durationMs = duration * 1000;

        // Tween Position
        const positionTween = new TWEEN.Tween(this.camera.position, this.tweenGroup)
            .to({ x: targetPosition.x, y: targetPosition.y, z: targetPosition.z }, durationMs)
            .easing(TWEEN.Easing.Cubic.InOut)
            .start();

        // Tween Target (Controls)
        const targetTween = new TWEEN.Tween(this.controls.target, this.tweenGroup)
            .to({ x: targetLookAt.x, y: targetLookAt.y, z: targetLookAt.z }, durationMs)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onUpdate(() => {
                this.controls.update();
            })
            .onComplete(() => this._stopTweens())
            .start();

        this._tweens = [positionTween, targetTween];
    }
}
