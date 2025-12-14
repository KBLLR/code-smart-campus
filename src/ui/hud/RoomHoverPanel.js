import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';

export class RoomHoverPanel extends Interface {
    constructor() {
        super('.room-hover-panel');

        this.init();
        this.initViews();
    }

    init() {
        this.css({
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: 2000,
            pointerEvents: 'none', // Allow clicking through to 3D generally, but maybe not if it has buttons?
            // The spec says "Enter Room" button, so it needs pointerEvents: auto for children.
            // But usually this panel follows the mouse or label.
            width: '200px',
            background: 'rgba(10, 10, 15, 0.85)',
            backdropFilter: 'blur(8px)',
            webkitBackdropFilter: 'blur(8px)',
            border: '1px solid var(--ui-color)',
            borderRadius: '4px',
            padding: '12px',
            display: 'none',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        });

        document.body.appendChild(this.element);
    }

    initViews() {
        // Title
        this.title = new Interface('.title');
        this.title.css({
            fontFamily: 'var(--ui-font-family)',
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'var(--ui-color)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
        });
        this.add(this.title);

        // Subtext / Type
        this.type = new Interface('.type');
        this.type.css({
            fontSize: '10px',
            color: 'rgba(255,255,255,0.6)',
            textTransform: 'uppercase'
        });
        this.add(this.type);

        // Divider
        const div = new Interface('.divider');
        div.css({ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' });
        this.add(div);

        // Helper text
        this.hint = new Interface('.hint');
        this.hint.text('CLICK TO ENTER');
        this.hint.css({
            fontSize: '9px',
            color: 'var(--ui-color-accent)',
            textAlign: 'center',
            marginTop: '4px',
            fontWeight: 'bold'
        });
        this.add(this.hint);
    }

    show(roomData) {
        if (!roomData) return;

        console.log('showing room hover', roomData);
        this.title.text(roomData.name || 'Room');
        this.type.text(roomData.type || 'Unit');
        
        this.css({ display: 'flex', opacity: 0 });
        this.tween({ opacity: 1 }, 200, 'easeOutSine');
    }

    hide() {
        this.css({ display: 'none' });
    }

    setPosition(x, y) {
        // Keep within screen bounds
        const w = 200;
        const h = 100; // approx
        
        let finalX = x + 20; // Offset right
        let finalY = y - 20;

        // Boundary checks
        if (finalX + w > window.innerWidth) finalX = x - w - 20;
        if (finalY + h > window.innerHeight) finalY = y - h;

        this.css({
            transform: `translate(${finalX}px, ${finalY}px)`
        });
    }
}
