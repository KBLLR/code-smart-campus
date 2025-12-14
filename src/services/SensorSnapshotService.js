export class SensorSnapshotService {
    constructor(sensorManager) {
        this.sensorManager = sensorManager;
    }

    getRoomSnapshot(roomId) {
        // Mock or proxy to sensorManager
        return {
            temp: 21,
            co2: 450,
            occupancy: 5
        };
    }
}
