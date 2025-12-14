
import * as THREE from 'three';

export class RoomView {
    constructor(mesh, entity) {
        this.mesh = mesh;
        this.entity = entity; // Reference to model

        // Store original material properties if needed
        this.originalMaterial = mesh.material;

        // Setup userData for Raycasting
        this.mesh.userData = {
            ...this.mesh.userData,
            isRoom: true,
            roomId: entity.id
        };
    }

    update(dt, time) {
        this._updateAppearance();
    }

    _updateAppearance() {
        if (!this.mesh.material) return;
        const material = this.mesh.material;

        // Check if material supports emissive
        if (!material.emissive || typeof material.emissive.setHex !== 'function') return;

        if (this.entity.isSelected) {
            material.emissive.setHex(0xffaa00);
            material.emissiveIntensity = 0.5;
        } else if (this.entity.isHovered) {
            material.emissive.setHex(0x38bdf8);
            material.emissiveIntensity = 0.3;
        } else {
            material.emissive.setHex(0x000000);
            material.emissiveIntensity = 0;
        }
    }
}
