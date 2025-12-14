
import { SCENE_STATES } from '../models/SceneStates.js';

export class SceneController {
    constructor({ cameraManager, roomManager, campusView, classroomRegistry, callbacks }) {
        this.cameraManager = cameraManager;
        this.roomManager = roomManager;
        this.campusView = campusView; // Direct access for specialized view updates if needed
        this.classroomRegistry = classroomRegistry;

        // Callbacks for UI updates (passed from App)
        this.onStateChange = callbacks.onStateChange || (() => { });

        this.currentState = SCENE_STATES.ORBIT;
        this.currentRoomId = null;
    }

    /**
     * Transition to a specific room
     * @param {string} roomId 
     */
    async enterRoom(roomId) {
        if (this.currentState === SCENE_STATES.ROOM && this.currentRoomId === roomId) return;

        console.log(`[SceneController] Entering room: ${roomId}`);

        const roomView = this.campusView.getRoomView(roomId);
        if (!roomView) {
            console.warn(`[SceneController] Room not found: ${roomId}`);
            return;
        }

        // 1. Update State
        this.currentState = SCENE_STATES.ROOM;
        this.currentRoomId = roomId;

        // 2. Select Room (Visuals)
        this.roomManager.clearAllHighlights();
        this.roomManager.highlightRoom(roomId, true, true); // Persistent highlight

        // 3. Move Camera
        // Get room position
        const targetPos = new THREE.Vector3();
        roomView.mesh.getWorldPosition(targetPos);

        // Calculate safe camera offset (e.g. slightly above and back)
        // In a real impl, we'd use geometry size to calculate distance
        const offset = new THREE.Vector3(20, 30, 20);
        const finalCamPos = targetPos.clone().add(offset);

        // Call CameraManager to tween
        this.cameraManager.transitionTo(finalCamPos, targetPos, 1.5);

        // 4. Notify UI
        this.onStateChange({
            state: 'ROOM',
            roomId: roomId
        });

        // 5. Notify Parent (Tier 2 Integration)
        if (this.classroomRegistry) {
            const classroom = this.classroomRegistry.get(roomId);
            const agentId = classroom?.agent || null;

            if (window.parent) {
                window.parent.postMessage({
                    type: 'ROOM_ENTER',
                    payload: { roomId, agentId }
                }, '*');
            }
        }
    }

    /**
     * Return to orbit overview
     */
    async exitRoom() {
        if (this.currentState === SCENE_STATES.ORBIT) return;

        console.log('[SceneController] Exiting room mode');

        // Capture room ID before clearing
        const roomId = this.currentRoomId;

        // 1. Update State
        this.currentState = SCENE_STATES.ORBIT;
        this.currentRoomId = null;

        // 2. Clear Selection
        this.roomManager.clearAllHighlights();

        // 3. Move Camera (Back to default orbit)
        // CameraManager should know its "default" or we pass it
        const defaultPos = new THREE.Vector3(200, 150, 200);
        const defaultTarget = new THREE.Vector3(0, 0, 0);
        this.cameraManager.transitionTo(defaultPos, defaultTarget, 1.5);

        // 4. Notify UI
        this.onStateChange({
            state: 'ORBIT',
            roomId: null
        });

        // 5. Notify Parent (Tier 2 Integration)
        if (window.parent) {
            window.parent.postMessage({
                type: 'ROOM_LEAVE',
                payload: { roomId }
            }, '*');
        }
    }
    /**
     * Update loop (called per frame)
     * @param {number} dt Delta time
     */
    update(dt) {
        // Reserved for future state transitions or animation management
    }
}

// Helper for Camera
import * as THREE from 'three';
