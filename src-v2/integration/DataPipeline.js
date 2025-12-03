export class DataPipeline {
    constructor() {
        this.rooms = new Map();
        this.sensors = new Map();
    }

    async init() {
        console.log('[DataPipeline] Loading authoritative data...');
        // TODO: Load JSON files from ../data/
        // This will be implemented in the next step
    }

    getRoom(id) {
        return this.rooms.get(id);
    }
}
