import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';
import { CloseButton } from '../components/CloseButton.js';
import { RadialAudioGraph } from '../components/RadialAudioGraph.js';

export class RoomDetailView extends Interface {
    constructor({ graphManager, audioManager }) {
        super('.room-detail-view');
        
        this.graphManager = graphManager;
        this.audioManager = audioManager;
        this.currentRoomId = null;

        this.init();
        this.initViews();
    }

    init() {
        this.css({
            position: 'fixed',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            zIndex: 1000,
            display: 'none',
            gridTemplateColumns: 'minmax(300px, 1fr) 2fr minmax(300px, 1fr)', // Better ratios
            gap: '40px',
            padding: '40px',
            boxSizing: 'border-box',
            pointerEvents: 'none' // wrapper is none
        });

        document.body.appendChild(this.element);
    }

    initViews() {
        // --- LEFT PANEL (Metrics) ---
        this.leftPanel = new Interface('.left-panel');
        this.leftPanel.css({
            display: 'flex', 
            flexDirection: 'column', 
            gap: '20px',
            pointerEvents: 'auto',
            transform: 'translateX(-50px)',
            opacity: 0,
            transition: 'all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)'
        });
        this.add(this.leftPanel);

        this.roomTitle = new Interface('.room-title');
        this.roomTitle.css({
            fontFamily: 'var(--ui-font-family)',
            fontSize: '32px',
            fontWeight: 'bold',
            color: 'var(--ui-color)',
            textTransform: 'uppercase'
        });
        this.leftPanel.add(this.roomTitle);

        this.desc = new Interface('.room-desc');
        this.desc.css({
            fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5'
        });
        this.leftPanel.add(this.desc);

        this.sensorsContainer = new Interface('.sensors-container');
        this.sensorsContainer.css({ display: 'flex', flexDirection: 'column', gap: '10px' });
        this.leftPanel.add(this.sensorsContainer);


        // --- CENTER PANEL (Chat / Agent) ---
        this.centerPanel = new Interface('.center-panel');
        this.centerPanel.css({
            display: 'flex', flexDirection: 'column',
            pointerEvents: 'auto',
            transform: 'translateY(50px)',
            opacity: 0,
            transition: 'all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.1s'
        });
        this.add(this.centerPanel);

        // Chat placeholder
        this.chatBox = new Interface('.chat-box');
        this.chatBox.css({
            flex: 1,
            background: 'var(--bg-color)', // Use theme bg
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            border: '1px solid var(--ui-border-color)',
            padding: '24px',
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
        });
        this.centerPanel.add(this.chatBox);
        
        this.placeHolderMsg = new Interface('.msg');
        this.placeHolderMsg.text('Agent online. Listening...');
        this.placeHolderMsg.css({ color: 'var(--ui-color-accent)', fontStyle: 'italic', letterSpacing: '0.5px' });
        this.chatBox.add(this.placeHolderMsg);


        // --- RIGHT PANEL (Graphs / Audio) ---
        this.rightPanel = new Interface('.right-panel');
        this.rightPanel.css({
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '20px',
            pointerEvents: 'auto',
            transform: 'translateX(50px)',
            opacity: 0,
            transition: 'all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s'
        });
        this.add(this.rightPanel);

        this.closeBtn = new CloseButton();
        this.closeBtn.element.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('SMARTCAMPUS_ROOM_LEAVE', { detail: { roomId: this.currentRoomId } }));
        });
        this.rightPanel.add(this.closeBtn);

        this.radialAudio = new RadialAudioGraph({ size: 180 });
        this.rightPanel.add(this.radialAudio);
        
        // Register wave
        // this.audioManager.registerWave('room-detail', this.radialAudio);
    }

    show(roomId, roomData) {
        if (this.visible && this.currentRoomId === roomId) return;
        
        this.currentRoomId = roomId;
        this.roomTitle.text(roomData?.name || roomId);
        this.desc.text(roomData?.metadata?.description || 'No data access.');

        // Initialize Graphs
        this.sensorsContainer.empty();
        // create sensors... (This part still needs actual sensor population logic)

        this.css({ display: 'grid' });
        
        // Animate In
        requestAnimationFrame(() => {
            this.leftPanel.css({ transform: 'translateX(0)', opacity: 1 });
            this.centerPanel.css({ transform: 'translateY(0)', opacity: 1 });
            this.rightPanel.css({ transform: 'translateX(0)', opacity: 1 });
        });

        // this.radialAudio.start(); // Needs stream attachments
        this.visible = true;
    }

    hide() {
        if (!this.visible) return;

        this.leftPanel.css({ transform: 'translateX(-50px)', opacity: 0 });
        this.centerPanel.css({ transform: 'translateY(50px)', opacity: 0 });
        this.rightPanel.css({ transform: 'translateX(50px)', opacity: 0 });

        setTimeout(() => {
            this.css({ display: 'none' });
            this.visible = false;
            this.radialAudio.stop();
        }, 600);
    }

    update(dt) {
        // if (this.visible) {
        //     this.radialAudio.update(dt);
        // }
    }
}
