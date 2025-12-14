
export const SCENE_STATES = {
    ORBIT: {
        name: 'orbit',
        camera: {
            distance: 200,
            fov: 45,
            lockToRoom: false
        },
        ui: {
            showGlobalHud: true,
            showRoomPanel: false
        }
    },
    ROOM: {
        name: 'room',
        camera: {
            distance: 30, // Closer zoom
            fov: 50,
            lockToRoom: true
        },
        ui: {
            showGlobalHud: false,
            showRoomPanel: true
        }
    }
};
