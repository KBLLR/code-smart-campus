
import * as THREE from 'three';

export class InputManager {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();

        // Layers: { id: string, objects: Object3D[], callback: fn }
        this.layers = new Map();
        this.hoverHandlers = new Map();
        this.clickHandlers = new Map();

        this.dragStart = new THREE.Vector2();
        this.isDragging = false;

        // Use bound methods
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);

        this.enabled = true;
        this._attachListeners();
    }

    _attachListeners() {
        this.domElement.addEventListener('pointermove', this._onPointerMove);
        this.domElement.addEventListener('pointerdown', this._onPointerDown);
        this.domElement.addEventListener('pointerup', this._onPointerUp);
    }

    registerLayer(id, objects) {
        this.layers.set(id, objects);
    }

    on(event, handler) {
        if (event === 'hover') {
            this.hoverHandlers.set(handler, handler);
        } else if (event === 'click') {
            this.clickHandlers.set(handler, handler);
        }
    }

    _updatePointer(event) {
        const rect = this.domElement.getBoundingClientRect();
        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    _raycast() {
        if (!this.camera) return [];

        this.raycaster.setFromCamera(this.pointer, this.camera);

        // Gather all objects from all layers
        let allObjects = [];
        this.layers.forEach((objects) => {
            allObjects = allObjects.concat(objects);
        });

        return this.raycaster.intersectObjects(allObjects, true);
    }

    _onPointerMove(event) {
        if (!this.enabled) return;
        this._updatePointer(event);

        // Notify hover handlers
        const intersects = this._raycast();
        const firstHit = intersects.length > 0 ? intersects[0] : null;

        this.hoverHandlers.forEach(handler => handler(firstHit, event));

        // Cleanup cursor if nothing hit (or let handler decide)
        this.domElement.style.cursor = firstHit ? 'pointer' : 'default';
    }

    _onPointerDown(event) {
        if (!this.enabled) return;
        this.dragStart.set(event.clientX, event.clientY);
        this.isDragging = false;
    }

    _onPointerUp(event) {
        if (!this.enabled) return;
        // Check for drag (simple threshold)
        if (Math.abs(event.clientX - this.dragStart.x) > 3 ||
            Math.abs(event.clientY - this.dragStart.y) > 3) {
            this.isDragging = true;
        }

        if (!this.isDragging) {
            this._onClick(event);
        }
        this.isDragging = false;
    }

    _onClick(event) {
        this._updatePointer(event);
        const intersects = this._raycast();
        const firstHit = intersects.length > 0 ? intersects[0] : null;

        this.clickHandlers.forEach(handler => handler(firstHit, event));
    }

    dispose() {
        this.domElement.removeEventListener('pointermove', this._onPointerMove);
        this.domElement.removeEventListener('pointerdown', this._onPointerDown);
        this.domElement.removeEventListener('pointerup', this._onPointerUp);
        this.layers.clear();
        this.hoverHandlers.clear();
        this.clickHandlers.clear();
    }
}
