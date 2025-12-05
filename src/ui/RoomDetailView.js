/**
 * RoomDetailView.js
 * 
 * Refactored to "ClassroomHologramView" style with 3-Column Layout.
 * - Left Panel: Room Info + Meters (Sensors) + History Graph
 * - Center Panel: Agent Persona + Chat + OCEAN Profile
 * - Right Panel: Audio Visualizer + Calendar/Events + Close Button
 * - Focus Mode: Camera zooms in, rest of world fades out.
 */

import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';
import { HologramMaterial } from '../materials/HologramMaterial.js';
import { AudioWave } from './components/AudioWave.js';
import { GraphManager } from '../managers/GraphManager.js';
import { CloseButton } from './components/CloseButton.js';
import { VoiceChatService } from '../services/VoiceChatService.js';
import { RadialAudioGraph } from './components/RadialAudioGraph.js';
import { personalityLoader } from '../data/personalities/PersonalityLoader.js';

export class RoomDetailView extends Interface {
    constructor() {
        super('.room-detail-view');
        console.log('[RoomDetailView] Initializing...');

        this.visible = false;
        this.currentRoomId = null;
        this.hologramMesh = null;
        this.originalMaterials = new Map();
        this.graphManager = new GraphManager();
        this.voiceService = new VoiceChatService();
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recording = false;
        this.voiceConfigured = Boolean(import.meta.env.VITE_VOICE_API_URL);

        this.init();
        this.initViews();
        this._bindEvents();
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
            display: 'grid',
            gridTemplateColumns: '350px 1fr 300px', // 3-Column Layout
            gap: '40px',
            padding: '40px',
            boxSizing: 'border-box'
        });

        document.body.appendChild(this.element);
    }

    initViews() {
        // --- LEFT PANEL (Info, Metrics/Sensors) ---
        this.leftPanel = new Interface('.left-panel');
        this.leftPanel.css({
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

        // Metrics Container (Sensors)
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


        // --- CENTER PANEL (Agent Interaction, Personality, Chat) ---
        this.centerPanel = new Interface('.center-panel');
        this.centerPanel.css({
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            opacity: 0,
            transform: 'translateY(20px)',
            transition: 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.1s', // Slight delay
            pointerEvents: 'auto',
            maxWidth: '600px',
            margin: '0 auto', // Center horizontally in the grid cell
            width: '100%'
        });
        this.add(this.centerPanel);

        // Personality Header (Name & Icon) - Moved from Right Panel
        this.personalityHeader = new Interface('.personality-header');
        this.personalityHeader.css({
            width: '100%',
            textAlign: 'center',
            marginBottom: '5px'
        });
        this.centerPanel.add(this.personalityHeader);

        // Chat History - Moved from Right Panel
        this.chatHistory = new Interface('.chat-history');
        this.chatHistory.css({
            flexGrow: 1,
            minHeight: '200px',
            maxHeight: '400px', // Taller chat
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '15px',
            fontSize: '13px',
            color: 'var(--ui-secondary-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            borderRadius: '8px'
        });
        this.centerPanel.add(this.chatHistory);

        // Input Area - Moved from Right Panel
        this.inputArea = new Interface('.input-area');
        this.inputArea.css({
            display: 'flex',
            gap: '10px'
        });
        this.centerPanel.add(this.inputArea);

        this.chatInput = new Interface('.chat-input', 'input');
        this.chatInput.element.type = 'text';
        this.chatInput.element.placeholder = 'Ask room agent...';
        this.chatInput.css({
            flexGrow: 1,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            padding: '10px 15px',
            outline: 'none',
            borderRadius: '6px',
            fontFamily: 'var(--ui-font-family)',
            fontSize: '14px'
        });
        this.inputArea.add(this.chatInput);

        this.micBtn = new Interface('.mic-btn', 'button');
        this.micBtn.html('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>');
        this.micBtn.css({
            background: 'rgba(0, 209, 255, 0.1)',
            border: '1px solid rgba(0, 209, 255, 0.3)',
            borderRadius: '6px',
            width: '42px',
            color: '#00d1ff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        });
        this.inputArea.add(this.micBtn);

        // Description Box (Agent Persona) - Moved from Right Panel
        this.descBox = new Interface('.desc-box');
        this.descBox.css({
            textAlign: 'left', // Changed to left for center panel
            fontFamily: 'var(--ui-font-family)',
            fontSize: '12px',
            lineHeight: '1.6',
            color: 'var(--ui-secondary-color)',
            background: 'rgba(0,0,0,0.3)',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            marginTop: '10px'
        });
        this.centerPanel.add(this.descBox);


        // --- RIGHT PANEL (Audio, Calendar, Close) ---
        this.rightPanel = new Interface('.right-panel');
        this.rightPanel.css({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '20px',
            opacity: 0,
            transform: 'translateX(50px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
            pointerEvents: 'auto'
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

        // Radial Audio Graph
        this.radialGraph = new RadialAudioGraph({ size: 160 });
        this.rightPanel.add(this.radialGraph);

        // Calendar Section - Moved from Left Panel
        this.calendarSection = new Interface('.calendar-section');
        this.calendarSection.css({
            width: '100%',
            marginTop: '15px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '10px'
        });
        this.rightPanel.add(this.calendarSection);

        this.calTitle = new Interface('.cal-title');
        this.calTitle.css({
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'var(--ui-color)',
            marginBottom: '5px',
            textTransform: 'uppercase',
            textAlign: 'right' // Align right for right panel
        });
        this.calTitle.text('Upcoming Events');
        this.calendarSection.add(this.calTitle);

        this.eventsList = new Interface('.events-list');
        this.eventsList.css({
            fontSize: '11px',
            color: 'var(--ui-secondary-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            alignItems: 'flex-end' // Align right
        });
        this.calendarSection.add(this.eventsList);
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
        this.centerPanel.css({ opacity: 1, transform: 'translateY(0)' });
        this.rightPanel.css({ opacity: 1, transform: 'translateX(0)' });

        // 3. Activate Hologram Mode
        this.activateHologram(roomId);

        // 4. Start Audio Wave
        this.audioWave.start();
    }

    _bindEvents() {
        this.micBtn.element.addEventListener('click', () => {
            if (this.recording) {
                this._stopRecording();
            } else {
                this._startRecording();
            }
        });

        // Text chat input
        this.chatInput.element.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.chatInput.element.value.trim()) {
                this._sendTextMessage(this.chatInput.element.value.trim());
                this.chatInput.element.value = '';
            }
        });
    }

    async _startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioChunks = [];
            this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            // Attach analyser to stream for radial graph
            this.radialGraph.attachStream(stream);
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.audioChunks.push(e.data);
            };
            this.mediaRecorder.onstop = () => {
                stream.getTracks().forEach(t => t.stop());
                this._sendVoiceMessage();
                this.radialGraph.stop();
            };
            this.mediaRecorder.start();
            this.recording = true;
            this.micBtn.css({ background: 'rgba(255, 99, 99, 0.15)', border: '1px solid rgba(255,99,99,0.4)', color: '#ff6b6b' });
        } catch (error) {
            console.error('[RoomDetailView] Mic access failed:', error);
        }
    }

    _stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        this.recording = false;
        this.micBtn.css({ background: 'rgba(0, 209, 255, 0.1)', border: '1px solid rgba(0, 209, 255, 0.3)', color: '#00d1ff' });
    }

    async _sendTextMessage(text) {
        if (!this.currentRoomId || !text) return;

        // Add user message
        const userMsg = new Interface('.chat-msg');
        userMsg.text(`You: ${text}`);
        userMsg.css({ color: 'var(--ui-color)', opacity: 0.8 });
        this.chatHistory.add(userMsg);

        // Get room personality data with fallback
        let personality = personalityLoader.getMergedPersonality(this.currentRoomId);

        // Fallback to generic agent personality if custom personality not found
        if (!personality) {
            const classroom = this.classroomRegistry?.get(this.currentRoomId);
            if (classroom?.agent?.personality) {
                const agentPersonality = classroom.agent.personality;
                personality = {
                    'room-avatar': agentPersonality.name,
                    'room-name': classroom.name || this.currentRoomId,
                    trait: agentPersonality.archetype || 'Agent',
                    want: agentPersonality.expertise || 'To assist',
                    flaw: agentPersonality.communication_style || 'Standard responses',
                    base_story: agentPersonality.description || 'A campus AI agent',
                    ocean: { temperature: 0.7 }
                };
            }
        }

        try {
            // Call MLX chat endpoint
            const response = await fetch('/api/mlx/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'mlx-community/Jinx-gpt-oss-20b-mxfp4-mlx',
                    messages: [
                        {
                            role: 'system',
                            content: `You are ${personality?.['room-avatar'] || 'an agent'}, the ${personality?.trait || 'intelligent assistant'} of ${personality?.['room-name'] || this.currentRoomId}. ${personality?.base_story || ''} Your personality: ${personality?.want || ''} ${personality?.flaw || ''}`
                        },
                        {
                            role: 'user',
                            content: text
                        }
                    ],
                    temperature: personality?.ocean?.temperature || 0.7,
                    maxTokens: 150
                })
            });

            const result = await response.json();

            if (result.completion) {
                const agentMsg = new Interface('.chat-msg');
                agentMsg.text(`${personality?.['room-avatar'] || 'Agent'}: ${result.completion}`);
                agentMsg.css({ color: '#7dd3fc' });
                this.chatHistory.add(agentMsg);

                // Scroll to bottom
                this.chatHistory.element.scrollTop = this.chatHistory.element.scrollHeight;
            }
        } catch (error) {
            console.error('[RoomDetailView] Text chat failed:', error);
            const errMsg = new Interface('.chat-msg');
            errMsg.text(`System: Chat request failed (${error.message})`);
            errMsg.css({ color: '#fca5a5' });
            this.chatHistory.add(errMsg);
        }
    }

    async _sendVoiceMessage() {
        if (!this.voiceConfigured) {
            const warn = new Interface('.chat-msg');
            warn.text('System: Voice service not configured. Set VITE_VOICE_API_URL / VOICE_API_URL.');
            warn.css({ color: '#fca5a5' });
            this.chatHistory.add(warn);
            return;
        }

        if (!this.currentRoomId || this.audioChunks.length === 0) return;

        const pending = new Interface('.chat-msg');
        pending.text('You: (voice message)');
        pending.css({ color: 'var(--ui-color)', opacity: 0.8 });
        this.chatHistory.add(pending);

        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const roomData = this.roomsManager?.rooms.get(this.currentRoomId);
        const voiceId = roomData?.agent?.personality?.voice || 'af_bella';

        try {
            const result = await this.voiceService.sendAudio({
                roomId: this.currentRoomId,
                agentId: roomData?.agent?.id || this.currentRoomId,
                voiceId,
                audioBlob: blob
            });

            if (result.transcript) {
                const userMsg = new Interface('.chat-msg');
                userMsg.text(`You: ${result.transcript}`);
                userMsg.css({ color: 'var(--ui-color)', opacity: 0.8 });
                this.chatHistory.add(userMsg);
            }

            if (result.response_text) {
                const agentMsg = new Interface('.chat-msg');
                agentMsg.text(`${roomData?.agent?.name || 'Agent'}: ${result.response_text}`);
                agentMsg.css({ color: '#7dd3fc' });
                this.chatHistory.add(agentMsg);
            }

            if (result.model === 'placeholder') {
                const warn = new Interface('.chat-msg');
                warn.text('System: Voice backend returned placeholder. Check VOICE_API_URL.');
                warn.css({ color: '#fca5a5' });
                this.chatHistory.add(warn);
            }

            if (result.audio_base64) {
                const audio = new Audio(`data:audio/wav;base64,${result.audio_base64}`);
                audio.play().catch(err => console.warn('Audio play failed:', err));
            } else if (result.audio_url) {
                const audio = new Audio(result.audio_url);
                audio.play().catch(err => console.warn('Audio play failed:', err));
            }
        } catch (error) {
            console.error('[RoomDetailView] Voice send failed:', error);
            const errMsg = new Interface('.chat-msg');
            errMsg.text(`System: Voice request failed (${error.message})`);
            errMsg.css({ color: '#fca5a5' });
            this.chatHistory.add(errMsg);
        }
    }

    updateContent(roomId) {
        const roomData = this.roomsManager?.rooms.get(roomId);
        const displayName = roomData?.name || roomId.replace(/-/g, ' ');

        // Try to get custom personality from PersonalityLoader first
        let personality = personalityLoader.getMergedPersonality(roomId);

        // Fallback to generic agent personality from classroom registry
        if (!personality) {
            const classroom = this.classroomRegistry?.get(roomId);
            if (classroom?.agent?.personality) {
                const agentPersonality = classroom.agent.personality;
                personality = {
                    'room-avatar': agentPersonality.name || displayName,
                    'room-name': displayName,
                    icon: '🤖',
                    trait: agentPersonality.archetype || 'Agent',
                    want: agentPersonality.expertise || 'To monitor and assist',
                    flaw: agentPersonality.communication_style || 'Standard responses',
                    base_story: `${agentPersonality.name} is ${agentPersonality.description || 'a campus AI agent'}.`,
                    ocean: {
                        Openness: agentPersonality.ffm?.O || 0.5,
                        Conscientiousness: agentPersonality.ffm?.C || 0.7,
                        Extraversion: agentPersonality.ffm?.E || 0.4,
                        Agreeableness: agentPersonality.ffm?.A || 0.6,
                        Neuroticism: agentPersonality.ffm?.N || 0.3,
                        temperature: 0.7
                    }
                };
            }
        }

        this.roomTitle.text(displayName);
        this.roomSubtitle.text(`UNIT ID: ${roomId.toUpperCase()}`);

        // Clear Metrics & Graphs
        this.metricsContainer.empty();
        this.graphContainer.empty();
        this.chatHistory.empty();
        this.eventsList.empty();
        this.graphManager.clear(); // Clear managed graphs

        // Clear center panel personality sections
        this.personalityHeader.empty();
        // Remove old personality boxes if they exist (we'll rebuild them)
        const oldTraits = this.centerPanel.element.querySelector('.traits-box');
        if (oldTraits) oldTraits.remove();
        const oldOcean = this.centerPanel.element.querySelector('.ocean-box');
        if (oldOcean) oldOcean.remove();

        // --- PERSONALITY TRAITS (Center Panel) ---
        if (personality) {
            // Personality Header
            const agentName = new Interface('.agent-name');
            agentName.text(personality['room-avatar'] || displayName);
            agentName.css({
                fontFamily: 'var(--ui-font-family)',
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'var(--ui-color)',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginBottom: '5px'
            });
            this.personalityHeader.add(agentName);

            const agentIcon = new Interface('.agent-icon');
            agentIcon.text(personality.icon || '🤖');
            agentIcon.css({
                fontSize: '32px',
                marginBottom: '10px'
            });
            this.personalityHeader.add(agentIcon);

            // 3 Personality Traits Box
            const traitsBox = new Interface('.traits-box');
            traitsBox.css({
                width: '100%',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(0, 209, 255, 0.3)',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '15px',
                pointerEvents: 'auto'
            });

            const traitsTitle = new Interface('.traits-title');
            traitsTitle.text('Personality Profile');
            traitsTitle.css({
                fontFamily: 'var(--ui-font-family)',
                fontSize: '11px',
                fontWeight: 'bold',
                color: 'var(--ui-color)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '12px',
                textAlign: 'center'
            });
            traitsBox.add(traitsTitle);

            // Trait 1: Core Trait
            this._addTraitRow(traitsBox, 'Trait', personality.trait || 'Unknown');

            // Trait 2: Want/Flow
            this._addTraitRow(traitsBox, 'Flow', personality.want || 'Unknown desires');

            // Trait 3: Flaw
            this._addTraitRow(traitsBox, 'Want', personality.flaw || 'Unknown flaw');

            // Insert traits box after header
            this.centerPanel.add(traitsBox, 1); // Index 1 (after header)

            // OCEAN Scores
            if (personality.ocean) {
                const oceanBox = new Interface('.ocean-box');
                oceanBox.css({
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '15px',
                    pointerEvents: 'auto'
                });

                const oceanTitle = new Interface('.ocean-title');
                oceanTitle.text('OCEAN Framework');
                oceanTitle.css({
                    fontFamily: 'var(--ui-font-family)',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: 'var(--ui-secondary-color)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '10px',
                    textAlign: 'center'
                });
                oceanBox.add(oceanTitle);

                const ffm = personality.ocean.ffm;
                this._addOceanBar(oceanBox, 'O', 'Openness', ffm.O);
                this._addOceanBar(oceanBox, 'C', 'Conscientiousness', ffm.C);
                this._addOceanBar(oceanBox, 'E', 'Extraversion', ffm.E);
                this._addOceanBar(oceanBox, 'A', 'Agreeableness', ffm.A);
                this._addOceanBar(oceanBox, 'N', 'Neuroticism', ffm.N);

                // Insert ocean box after traits
                this.centerPanel.add(oceanBox, 2);
            }

            // Base Story / Description
            const storyText = personality.base_story || roomData?.metadata?.description || "No origin story available.";
            this.descBox.text(storyText);
        } else {
            this.descBox.text(roomData?.metadata?.description || "Smart Room Agent Active");
        }

        // Add Welcome Message
        const welcomeMsg = new Interface('.chat-msg');
        welcomeMsg.text(`System: Connected to ${personality?.['room-avatar'] || displayName} agent.`);
        welcomeMsg.css({ color: 'var(--ui-color)', opacity: 0.7 });
        this.chatHistory.add(welcomeMsg);

        // --- SENSORS (Left Panel) ---
        let hasSensors = false;

        // Try to get sensors from SensorManager first (real data)
        const realSensors = this.sensorManager?.getRoomSensors(roomId) || {};

        // If we have real sensor data, use it
        if (Object.keys(realSensors).length > 0) {
            Object.entries(realSensors).forEach(([type, data]) => {
                const meta = this.sensorManager?.getSensorMeta(type);
                const label = meta?.label || type;
                const graphId = `sensor-${roomId}-${type}`;

                const graph = this.graphManager.createGraph(graphId, type, {
                    value: parseFloat(data.value)
                });

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

        // --- EVENTS (Right Panel) ---
        const events = roomData?.events || [];
        if (events.length > 0) {
            events.forEach(evt => {
                const eventItem = new Interface('.event-item');
                eventItem.text(`${evt.time} - ${evt.title}`);
                this.eventsList.add(eventItem);
            });
        } else {
            const noEvents = new Interface('.no-events');
            noEvents.text('No upcoming events scheduled.');
            noEvents.css({ fontStyle: 'italic', opacity: 0.6 });
            this.eventsList.add(noEvents);
        }

        // --- HISTORY GRAPH (Left Panel) ---
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

    _addTraitRow(container, label, value) {
        const row = new Interface('.trait-row');
        row.css({
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '8px',
            gap: '10px'
        });

        const labelEl = new Interface('.trait-label');
        labelEl.text(label);
        labelEl.css({
            fontFamily: 'var(--ui-font-family)',
            fontSize: '10px',
            fontWeight: 'bold',
            color: 'var(--ui-color)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            minWidth: '50px'
        });
        row.add(labelEl);

        const valueEl = new Interface('.trait-value');
        valueEl.text(value);
        valueEl.css({
            fontFamily: 'var(--ui-font-family)',
            fontSize: '10px',
            color: 'var(--ui-secondary-color)',
            lineHeight: '1.4',
            textAlign: 'right',
            flex: '1'
        });
        row.add(valueEl);

        container.add(row);
    }

    _addOceanBar(container, code, label, value) {
        const row = new Interface('.ocean-row');
        row.css({
            marginBottom: '8px'
        });

        const labelRow = new Interface('.ocean-label-row');
        labelRow.css({
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '3px'
        });

        const labelEl = new Interface('.ocean-label');
        labelEl.text(`${code} - ${label}`);
        labelEl.css({
            fontFamily: 'var(--ui-font-family)',
            fontSize: '9px',
            color: 'var(--ui-secondary-color)',
            textTransform: 'uppercase'
        });
        labelRow.add(labelEl);

        const scoreEl = new Interface('.ocean-score');
        scoreEl.text((value * 100).toFixed(0) + '%');
        scoreEl.css({
            fontFamily: 'var(--ui-font-family)',
            fontSize: '9px',
            color: 'var(--ui-color)',
            fontWeight: 'bold'
        });
        labelRow.add(scoreEl);

        row.add(labelRow);

        // Progress bar
        const barBg = new Interface('.ocean-bar-bg');
        barBg.css({
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden'
        });

        const barFill = new Interface('.ocean-bar-fill');
        barFill.css({
            width: `${value * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, rgba(0, 209, 255, 0.5), rgba(0, 209, 255, 0.8))',
            borderRadius: '2px'
        });
        barBg.add(barFill);

        row.add(barBg);
        container.add(row);
    }

    hide() {
        if (!this.visible) return;

        this.visible = false;

        // Animate UI Out
        this.css({ pointerEvents: 'none' });
        this.leftPanel.css({ opacity: 0, transform: 'translateX(-50px)' });
        this.centerPanel.css({ opacity: 0, transform: 'translateY(20px)' });
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
