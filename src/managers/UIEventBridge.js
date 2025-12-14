export class UIEventBridge {
    constructor({ roomViewLayer, audioManager, graphManager, campusMetrics }) {
        this.roomViewLayer = roomViewLayer;
        this.audioManager = audioManager;
        this.graphManager = graphManager;
        this.campusMetrics = campusMetrics;
    }

    init() {
        window.addEventListener('message', this.handleMessage.bind(this));
        
        // Listen for custom events if dispatched internally
        document.addEventListener('SMARTCAMPUS_ROOM_ENTER', (e) => this.handleRoomEnter(e.detail));
        document.addEventListener('SMARTCAMPUS_ROOM_EXIT', (e) => this.handleRoomExit(e.detail));
        document.addEventListener('SMARTCAMPUS_SENSOR_UPDATE', (e) => this.handleSensorUpdate(e.detail));
    }

    handleMessage(event) {
        // Validate origin if needed
        const { type, payload } = event.data;
        if (!type) return;

        switch (type) {
            case 'ROOM_ENTER':
                this.handleRoomEnter(payload);
                break;
            case 'ROOM_LEAVE':
                this.handleRoomExit(payload);
                break;
            case 'SENSOR_UPDATE':
                this.handleSensorUpdate(payload);
                break;
            case 'VOICE_START':
                this.audioManager.startVoice(payload.voiceId, payload);
                break;
            case 'VOICE_LEVEL':
                this.audioManager.updateVoiceLevel(payload.voiceId, payload.level);
                break;
            case 'VOICE_STOP':
                this.audioManager.stopVoice(payload.voiceId);
                break;
        }
    }

    handleRoomEnter(data) {
        // data: { roomId, roomTyp, ... }
        this.roomViewLayer.onRoomEnter(data.roomId, data);
    }

    handleRoomExit(data) {
        this.roomViewLayer.onRoomExit(data?.roomId);
    }

    handleSensorUpdate(data) {
        // data: { id, value, roomId, type }
        // Update Graphs
        if (data.id) {
            this.graphManager.updateGraph(data.id, data.value);
        }
        
        // Update HUD Metrics if relevant (e.g. global)
        // logic to aggregate or pass to Metrics
    }
}
