/**
 * RoomDetailView.js
 * 
 * Refactored to "ClassroomHologramView" style.
 * - Left Panel: Room Info + Meters + Chat
 * - Right Panel: Geometry Visualization (Hologram) + Graph
 * - Focus Mode: Camera zooms in, rest of world fades out.
 */

import * as THREE from 'three';
import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';
import { getEntityState } from '@/ha.js';
import { HologramMaterial } from '../materials/HologramMaterial.js';
import { AudioWave } from './components/AudioWave.js';
import { GraphManager } from '../managers/GraphManager.js';
import { CloseButton } from './components/CloseButton.js';

export class RoomDetailView extends Interface {
    constructor() {
        super('.room-detail-view');
        console.log('[RoomDetailView] Initializing...');

        this.visible = false;
        this.currentRoomId = null;
        this.hologramMesh = null;
        this.originalMaterials = new Map();
        this.graphManager = new GraphManager();

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
            zIndex: 5000,
            pointerEvents: 'none',
            display: 'flex',
            justifyContent: 'space-between', // Left and Right panels
            padding: '40px',
            boxSizing: 'border-box'
        });

        document.body.appendChild(this.element);
    }

    initViews() {
        // --- LEFT PANEL (Info, Metrics, Chat) ---
        this.leftPanel = new Interface('.left-panel');
        this.leftPanel.css({
            width: '350px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            opacity: 0,
            transform: 'translateX(-50px)',
            transition: 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
            pointerEvents: 'auto'
        });
        this.add(this.leftPanel);

        // Title Block
        this.titleBlock = new Interface('.title-block');
        this.leftPanel.add(this.titleBlock);

        this.roomTitle = new Interface('.room-title');
        this.roomTitle.css({
            fontFamily: 'var(--ui-font-family)',
            fontSize: '32px',
            fontWeight: '700',
            color: 'var(--ui-color)',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '5px',
            textShadow: '0 0 20px rgba(0, 209, 255, 0.3)'
        });
        this.titleBlock.add(this.roomTitle);

        this.roomSubtitle = new Interface('.room-subtitle');
        this.roomSubtitle.css({
            fontFamily: 'var(--ui-font-family)',
            fontSize: '12px',
            color: 'var(--ui-secondary-color)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
        });
        this.titleBlock.add(this.roomSubtitle);

        // Divider
        this.divider = new Interface('.divider');
        this.divider.css({
            width: '100%',
            height: '1px',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
            margin: '10px 0'
        });
        this.leftPanel.add(this.divider);

        // Metrics Container
        this.metricsContainer = new Interface('.metrics-container');
        this.metricsContainer.css({
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px'
        });
        this.leftPanel.add(this.metricsContainer);

        // History Graph Container
        this.graphContainer = new Interface('.graph-container');
        this.graphContainer.css({
            marginTop: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '10px',
            background: 'rgba(0, 0, 0, 0.2)'
        });
        this.leftPanel.add(this.graphContainer);


        // --- RIGHT PANEL (Agent Interaction) ---
        this.rightPanel = new Interface('.right-panel');
        this.rightPanel.css({
            width: '300px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '20px',
            opacity: 0,
            transform: 'translateX(50px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease'
        });
        this.add(this.rightPanel);

        // Close Button (Floating)
        this.closeBtn = new CloseButton();
        this.closeBtn.css({
            marginBottom: '20px'
        });
        this.closeBtn.element.addEventListener('click', () => this.hide());
        this.rightPanel.add(this.closeBtn);

        // Audio Visualizer
        this.audioWave = new AudioWave({ width: 300, height: 40, color: '#00d1ff' });
        this.rightPanel.add(this.audioWave);

        // Chat History
        this.chatHistory = new Interface('.chat-history');
        this.chatHistory.css({
            flexGrow: 1,
            minHeight: '150px',
            maxHeight: '400px',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '10px',
            fontSize: '13px',
            color: 'var(--ui-secondary-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
        });
        this.rightPanel.add(this.chatHistory);

        // Input Area
        this.inputArea = new Interface('.input-area');
        this.inputArea.css({
            display: 'flex',
            gap: '10px'
        });
        this.rightPanel.add(this.inputArea);

        this.chatInput = new Interface('.chat-input', 'input');
        this.chatInput.element.type = 'text';
        this.chatInput.element.placeholder = 'Ask room agent...';
        this.chatInput.css({
            flexGrow: 1,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            padding: '8px 12px',
            outline: 'none',
            borderRadius: '6px',
            fontFamily: 'var(--ui-font-family)'
        });
        this.inputArea.add(this.chatInput);

        this.micBtn = new Interface('.mic-btn', 'button');
        this.micBtn.html('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>');
        this.micBtn.css({
            background: 'rgba(0, 209, 255, 0.1)',
            border: '1px solid rgba(0, 209, 255, 0.3)',
            borderRadius: '6px',
            width: '36px',
            color: '#00d1ff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        });
        this.inputArea.add(this.micBtn);

        // Description Box (Agent Persona)
        this.descBox = new Interface('.desc-box');
        this.descBox.css({
            textAlign: 'right',
            fontFamily: 'var(--ui-font-family)',
            fontSize: '12px',
            lineHeight: '1.6',
            color: 'var(--ui-secondary-color)',
            maxWidth: '250px',
            background: 'rgba(0,0,0,0.3)',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)'
        });
        this.rightPanel.add(this.descBox);
    }

    show(roomId, roomsManager, sensorManager) {
        if (this.visible && this.currentRoomId === roomId) return;

        this.currentRoomId = roomId;
        this.visible = true;
        this.roomsManager = roomsManager;
        this.sensorManager = sensorManager;

        // 1. Update UI Content
        this.updateContent(roomId);

        // 2. Animate UI In
        this.css({ pointerEvents: 'auto' });
        this.leftPanel.css({ opacity: 1, transform: 'translateX(0)' });
        this.rightPanel.css({ opacity: 1, transform: 'translateX(0)' });

        // 3. Activate Hologram Mode
        this.activateHologram(roomId);

        // 4. Start Audio Wave
        this.audioWave.start();
    }

    updateContent(roomId) {
        const roomData = this.roomsManager?.rooms.get(roomId);
        const displayName = roomData?.name || roomId.replace(/-/g, ' ');

        this.roomTitle.text(displayName);
        this.roomSubtitle.text(`UNIT ID: ${roomId.toUpperCase()}`);

        // Clean description of any potential "Harmony" artifacts
        let description = roomData?.metadata?.description || "No description available for this unit.";
        if (description.includes('<|start_header_id|>')) {
            // Fallback if raw prompt leaked
            description = "Smart Room Agent Active";
        }
        this.descBox.text(description);

        // Clear Metrics & Graphs
        this.metricsContainer.empty();
        this.graphContainer.empty();
        this.chatHistory.empty();
        this.graphManager.clear(); // Clear managed graphs

        // Add Welcome Message
        const welcomeMsg = new Interface('.chat-msg');
        welcomeMsg.text(`System: Connected to ${displayName} agent.`);
        welcomeMsg.css({ color: 'var(--ui-color)', opacity: 0.7 });
        this.chatHistory.add(welcomeMsg);

        // --- SENSORS (Radial Graphs) ---
        let hasSensors = false;

        // Try to get sensors from SensorManager first (real data)
        const realSensors = this.sensorManager?.getRoomSensors(roomId) || {};

        // If we have real sensor data, use it
        if (Object.keys(realSensors).length > 0) {
            Object.entries(realSensors).forEach(([type, data]) => {
                const meta = this.sensorManager?.getSensorMeta(type);
                const label = meta?.label || type;
                const unit = data.unit || meta?.unit || '';

                // Create Graph via GraphManager with smart defaults
                const graphId = `sensor-${roomId}-${type}`;

                // Pass type as the second argument to let GraphManager decide defaults
                const graph = this.graphManager.createGraph(graphId, type, {
                    // Overrides if needed
                    value: parseFloat(data.value)
                });

                // If it's a RadialGraph, we might want to set label manually if not handled by defaults
                // But GraphManager defaults should handle most.
                // We can add a label element if the graph itself doesn't have one built-in like Meter did.
                // Space.js graphs usually don't have external labels, they might have internal text.
                // Let's add a wrapper or label if needed. 
                // For now, let's assume the graph is self-contained or we add a label below it.

                const wrapper = new Interface('.sensor-wrapper');
                wrapper.css({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' });
                wrapper.add(graph);

                const labelDiv = new Interface('.sensor-label');
                labelDiv.text(`${label}`);
                labelDiv.css({ fontSize: '10px', color: 'var(--ui-secondary-color)', textTransform: 'uppercase' });
                wrapper.add(labelDiv);

                this.metricsContainer.add(wrapper);
                hasSensors = true;
            });
        }

        // Fallback: Check room metadata for expected sensors if no real data yet
        if (!hasSensors && roomData?.metadata?.sensors) {
            roomData.metadata.sensors.forEach(sensorType => {
                const graphId = `sensor-fallback-${roomId}-${sensorType}`;
                const graph = this.graphManager.createGraph(graphId, sensorType, {
                    value: 0 // Default value
                });

                const wrapper = new Interface('.sensor-wrapper');
                wrapper.css({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' });
                wrapper.add(graph);

                const labelDiv = new Interface('.sensor-label');
                labelDiv.text(sensorType);
                labelDiv.css({ fontSize: '10px', color: 'var(--ui-secondary-color)', textTransform: 'uppercase' });
                wrapper.add(labelDiv);

                this.metricsContainer.add(wrapper);
            });
            if (roomData.metadata.sensors.length > 0) hasSensors = true;
        }

        if (!hasSensors) {
            const noData = new Interface('.no-data');
            noData.css({ color: 'var(--ui-secondary-color)', fontSize: '12px', fontStyle: 'italic' });
            noData.text('No telemetry link established.');
            this.metricsContainer.add(noData);
        }

        // --- CALENDAR ---
        const calendarSection = new Interface('.calendar-section');
        calendarSection.css({
            marginTop: '15px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '10px'
        });

        const calTitle = new Interface('.cal-title');
        calTitle.css({
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'var(--ui-color)',
            marginBottom: '5px',
            textTransform: 'uppercase'
        });
        calTitle.text('Upcoming Events');
        calendarSection.add(calTitle);

        const eventsList = new Interface('.events-list');
        eventsList.css({
            fontSize: '11px',
            color: 'var(--ui-secondary-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
        });

        // Placeholder events (replace with real data if available)
        const events = roomData?.events || [];
        if (events.length > 0) {
            events.forEach(evt => {
                const eventItem = new Interface('.event-item');
                eventItem.text(`${evt.time} - ${evt.title}`);
                eventsList.add(eventItem);
            });
        } else {
            const noEvents = new Interface('.no-events');
            noEvents.text('No upcoming events scheduled.');
            noEvents.css({ fontStyle: 'italic', opacity: 0.6 });
            eventsList.add(noEvents);
        }

        calendarSection.add(eventsList);
        this.metricsContainer.add(calendarSection);


        // --- HISTORY GRAPH (Line Graph) ---
        const historyGraphId = `history-${roomId}`;
        const historyGraph = this.graphManager.createGraph(historyGraphId, 'line', {
            width: 280,
            height: 120,
            color: '#00d1ff'
        });
        // Simulate some data for now
        for (let i = 0; i < 20; i++) this.graphManager.updateGraph(historyGraphId, Math.random() * 50 + 20);
        this.graphContainer.add(historyGraph);
    }

    activateHologram(roomId) {
        if (!this.roomsManager) return;

        const room = this.roomsManager.rooms.get(roomId);
        const mesh = room?.mesh;

        if (!mesh) return;

        // Store original material
        if (!this.originalMaterials.has(mesh.uuid)) {
            this.originalMaterials.set(mesh.uuid, mesh.material);
        }

        // Apply Hologram Material
        this.hologramMesh = mesh;
        this.hologramMesh.material = new HologramMaterial({
            color: 0x00d1ff,
            rimColor: 0xffffff,
            scanlineScale: 80.0
        });
    }

    hide() {
        if (!this.visible) return;

        this.visible = false;

        // Animate UI Out
        this.css({ pointerEvents: 'none' });
        this.leftPanel.css({ opacity: 0, transform: 'translateX(-50px)' });
        this.rightPanel.css({ opacity: 0, transform: 'translateX(50px)' });

        // Stop Audio Wave
        this.audioWave.stop();

        // Restore Material
        if (this.hologramMesh && this.originalMaterials.has(this.hologramMesh.uuid)) {
            this.hologramMesh.material = this.originalMaterials.get(this.hologramMesh.uuid);
            this.hologramMesh = null;
        }

        this.currentRoomId = null;

        // Dispatch close event
        this.element.dispatchEvent(new CustomEvent('roomdetailview:close', { bubbles: true }));
    }
}
