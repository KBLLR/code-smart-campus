import { RoomDetailView } from './RoomDetailView.js';

export class PanelManager {
    constructor(dependencies) {
        this.deps = dependencies; // { graphManager, audioManager, etc }
        this.roomDetail = null;
    }

    showRoomDetail(roomId, roomData) {
        if (!this.roomDetail) {
            this.roomDetail = new RoomDetailView(this.deps);
        }
        
        this.roomDetail.show(roomId, roomData);
    }

    hideRoomDetail() {
        if (this.roomDetail) {
            this.roomDetail.hide();
        }
    }

    update(dt) {
        if (this.roomDetail) {
            this.roomDetail.update(dt);
        }
    }
}
