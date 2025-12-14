
import * as THREE from 'three';
import { RoomView } from './RoomView.js';
import { RoomEntity } from '../models/RoomEntity.js';

export class CampusView {
    constructor(model) {
        this.group = model.scene; // The loaded GLB scene group
        this.roomViews = new Map(); // id -> RoomView

        // Auto-process rooms from the model
        // This logic replaces parts of RoomManager
    }

    /**
     * Initialize RoomViews based on found meshes and data
     * @param {Map} roomDataMap - Map of normalized ID -> Room Data
     */
    initRooms(roomDataMap) {
        this.group.traverse((child) => {
            // Logic to identify rooms, similar to RoomManager
            // For now, we assume RoomManager might still do the heavy lifting of *identifying* 
            // which mesh is which room, or we port that logic here.
            // 
            // Let's assume passed in logic or re-implement simple discovery
        });
    }

    // Wrapper to add a room view explicitly (called by RoomManager for now during refactor)
    addRoomView(id, mesh, data) {
        const entity = new RoomEntity(data);
        const view = new RoomView(mesh, entity);
        this.roomViews.set(id, view);
    }

    getRoomView(id) {
        return this.roomViews.get(id);
    }

    getAllMeshes() {
        return Array.from(this.roomViews.values()).map(v => v.mesh);
    }

    getObject3D() {
        return this.group;
    }

    update(dt, time) {
        this.roomViews.forEach(view => view.update(dt, time));
    }
}
