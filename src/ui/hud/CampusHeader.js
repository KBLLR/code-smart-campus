import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';

const CITY = 'Berlin';

function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getWeekNumber(date) {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = new Date(target.getFullYear(), 0, 4);
    const weekDiff = (target - firstThursday) / 86400000;
    return 1 + Math.floor(weekDiff / 7);
}

export class CampusHeader extends Interface {
    constructor() {
        super('.campus-header');

        this.updateTimer = null;
        this.statusTimer = null;
        this.statusText = 'SYSTEM NOMINAL';
        this.roomContextActive = false;

        this.init();
        this.initViews();
    }

    init() {
        this.css({
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-start', // Align top
            justifyContent: 'space-between',
            pointerEvents: 'none',
            fontFamily: 'var(--ui-font-family)',
            color: 'var(--ui-color)',
            userSelect: 'none'
        });

        document.body.appendChild(this.element);
    }

    initViews() {
        // --- LEFT: Time & Date ---
        this.left = new Interface('.header-left');
        this.left.css({
            display: 'flex',
            gap: '15px',
            fontSize: '11px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            opacity: 0.8
        });
        this.add(this.left);

        this.timeEl = new Interface('.time');
        this.dateEl = new Interface('.date');
        this.cityEl = new Interface('.city');
        this.weekEl = new Interface('.week');
        
        [this.timeEl, this.dateEl, this.cityEl, this.weekEl].forEach(el => this.left.add(el));


        // --- CENTER: Dynamic Title & Status ---
        this.center = new Interface('.header-center');
        this.center.css({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center'
        });
        this.add(this.center);

        this.title = new Interface('.title');
        this.title.css({
            fontSize: '14px',
            fontWeight: '700',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'var(--ui-color)',
            textShadow: '0 0 20px rgba(0, 209, 255, 0.3)',
            transition: 'all 0.5s ease',
            whiteSpace: 'nowrap'
        });
        this.title.text('SMART CAMPUS LIVE');
        this.center.add(this.title);

        this.subtitle = new Interface('.subtitle');
        this.subtitle.css({
            fontSize: '10px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            opacity: 0.7,
            marginTop: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.5s ease'
        });
        this.subtitle.text('ESTABLISHING UPLINK...');
        this.center.add(this.subtitle);
        
        // Pulse Indicator
        this.pulse = new Interface('.pulse');
        this.pulse.css({
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--ui-color-accent)',
            boxShadow: '0 0 8px var(--ui-color-accent)',
            display: 'none'
        });
        this.subtitle.add(this.pulse, 'prepend');


        // --- RIGHT: Navigation Buttons ---
        this.right = new Interface('.header-right');
        this.right.css({
            display: 'flex',
            gap: '10px',
            pointerEvents: 'auto'
        });
        this.add(this.right);

        const items = [
            { label: 'Returns', action: 'returnToApp', id: 'returnBtn', hidden: true, prominent: true },
            { label: 'Sensors', action: 'openSensors' },
            { label: 'Info', action: 'toggleInfo' }
        ];

        this.chips = {};

        items.forEach(item => {
            const chip = new Interface('.chip');
            chip.css({
                padding: '6px 12px',
                border: item.prominent ? '1px solid var(--ui-color)' : '1px solid rgba(255,255,255,0.15)',
                borderRadius: '4px',
                background: item.prominent ? 'rgba(0, 209, 255, 0.1)' : 'rgba(0,0,0,0.3)',
                fontSize: '10px',
                letterSpacing: '1px',
                color: item.prominent ? 'var(--ui-color)' : 'var(--ui-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: item.hidden ? 'none' : 'block',
                textTransform: 'uppercase',
                backdropFilter: 'blur(4px)'
            });
            chip.text(item.label);

            chip.element.addEventListener('mouseenter', () => {
                chip.css({ 
                    background: item.prominent ? 'rgba(0, 209, 255, 0.2)' : 'rgba(255,255,255,0.1)',
                    borderColor: 'var(--ui-color)'
                });
            });
            chip.element.addEventListener('mouseleave', () => {
                chip.css({ 
                    background: item.prominent ? 'rgba(0, 209, 255, 0.1)' : 'rgba(0,0,0,0.3)',
                    borderColor: item.prominent ? 'var(--ui-color)' : 'rgba(255,255,255,0.15)'
                });
            });

            chip.element.addEventListener('click', () => {
                if (this.onAction) this.onAction(item.action);
            });

            this.right.add(chip);
            if (item.id) this.chips[item.id] = chip;
        });

        // Start Loops
        this.updateTime();
        this.updateTimer = setInterval(() => this.updateTime(), 30000);
    }

    updateTime() {
        const now = new Date();
        this.timeEl.text(formatTime(now));
        this.dateEl.text(formatDate(now));
        this.cityEl.text(CITY);
        this.weekEl.text(`W${getWeekNumber(now)}`);
    }

    // --- Dynamic Context Methods ---

    setCampusMessage(text) {
        if (this.roomContextActive) return;
        this.subtitle.text(text);
    }

    setRoomContext({ roomName, agentName }) {
        this.roomContextActive = true;
        
        // Update Title: Room Name
        this.title.text(roomName);
        this.title.css({ color: 'var(--ui-color-accent)' });

        // Update Subtitle: Agent Status
        if (agentName) {
            this.subtitle.text(`AI AGENT: ${agentName}`);
            this.pulse.css({ display: 'block' });
        } else {
            this.subtitle.text('NO AGENT ACTIVE');
            this.pulse.css({ display: 'none' });
        }
    }

    clearRoomContext() {
        this.roomContextActive = false;

        // Revert to Global State
        this.title.text('SMART CAMPUS LIVE');
        this.title.css({ color: 'var(--ui-color)' });
        
        this.subtitle.text(this.statusText); // Restore last system status
        this.pulse.css({ display: 'none' });
    }

    showReturnButton() {
        if (this.chips.returnBtn) this.chips.returnBtn.css({ display: 'block' });
    }

    hideReturnButton() {
        if (this.chips.returnBtn) this.chips.returnBtn.css({ display: 'none' });
    }

    update(dt) {
        // Animation loop if needed
        // e.g. pulsing effect manually if CSS isn't enough
    }
}
