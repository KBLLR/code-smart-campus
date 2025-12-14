
import * as THREE from 'three';

export class World {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x13243d, 0.0009);

        this.updatables = new Set();

        // Default Lighting
        this._setupLighting();
    }

    _setupLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0x404040, 1.5);
        this.scene.add(ambient);

        // Main directional light (sun)
        const sun = new THREE.DirectionalLight(0xffffff, 1.2);
        sun.position.set(100, 200, 100);
        sun.castShadow = true;
        sun.shadow.camera.left = -200;
        sun.shadow.camera.right = 200;
        sun.shadow.camera.top = 200;
        sun.shadow.camera.bottom = -200;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 500;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        this.scene.add(sun);

        // Fill light
        const fill = new THREE.DirectionalLight(0x7799ff, 0.3);
        fill.position.set(-100, 50, -100);
        this.scene.add(fill);
    }

    add(object) {
        if (object.isObject3D) {
            this.scene.add(object);
        }
        // Auto-register if it has an update method
        if (typeof object.update === 'function') {
            this.updatables.add(object);
        }
    }

    remove(object) {
        if (object.isObject3D) {
            this.scene.remove(object);
        }
        if (this.updatables.has(object)) {
            this.updatables.delete(object);
        }
    }

    update(dt, time) {
        this.updatables.forEach(item => {
            item.update(dt, time);
        });
    }

    dispose() {
        // Traverse and dispose geometries/materials if needed?
        // For now, clear updatables
        this.updatables.clear();
    }
}
