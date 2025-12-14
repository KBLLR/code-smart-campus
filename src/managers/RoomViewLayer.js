export class RoomViewLayer {
    constructor(panelManager, campusHeader) {
        this.panelManager = panelManager;
        this.campusHeader = campusHeader;
        this.currentRoom = null;
    }

    update(dt) {
        // transition logic if needed
    }

    onRoomEnter(roomId, roomData) {
        if (this.currentRoom === roomId) return;
        this.currentRoom = roomId;

        console.log('[RoomViewLayer] Entered', roomId);

        // 1. Update Header
        const name = roomData?.name || roomId;
        const agent = roomData?.agent ? roomData.agent.name : null;
        this.campusHeader.setRoomContext({ roomName: name, agentName: agent });

        // 2. Determine Interaction Level
        // If it's a Tier 2 room (interactive), show detail view
        // For now, assume all rooms triggered here are interactive
        this.panelManager.showRoomDetail(roomId, roomData);
    }

    onRoomExit(roomId) {
        if (!this.currentRoom) return;
        
        console.log('[RoomViewLayer] Left', this.currentRoom);
        this.currentRoom = null;

        // 1. Reset Header
        this.campusHeader.clearRoomContext();

        // 2. Hide Detail View
        this.panelManager.hideRoomDetail();
    }
}
