import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';

export class Meter extends Interface {
    constructor({ label, value, unit, min = 0, max = 100, color = 'var(--ui-color)' }) {
        super('.meter');

        this.min = min;
        this.max = max;
        this.color = color;

        this.css({
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            marginBottom: '15px'
        });

        // Header
        this.header = new Interface('.meter-header');
        this.header.css({
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            fontFamily: 'var(--ui-font-family)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            opacity: 0.7
        });
        this.add(this.header);

        this.labelEl = new Interface('.meter-label');
        this.labelEl.text(label);
        this.header.add(this.labelEl);

        this.valueEl = new Interface('.meter-value');
        this.valueEl.css({ fontWeight: 'bold', color: this.color });
        this.valueEl.text(`${value} ${unit}`);
        this.header.add(this.valueEl);

        // Bar Container
        this.barContainer = new Interface('.meter-bar-bg');
        this.barContainer.css({
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
            position: 'relative'
        });
        this.add(this.barContainer);

        // Active Bar
        this.bar = new Interface('.meter-bar-fill');
        this.bar.css({
            height: '100%',
            background: this.color,
            width: '0%', // Start at 0
            transition: 'width 1s cubic-bezier(0.2, 0.8, 0.2, 1)',
            boxShadow: `0 0 10px ${this.color}`
        });
        this.barContainer.add(this.bar);

        // Set initial value
        requestAnimationFrame(() => this.update(value));
    }

    update(value) {
        const percent = Math.min(Math.max((value - this.min) / (this.max - this.min), 0), 1) * 100;
        this.bar.css({ width: `${percent}%` });

        // Update text if needed (assuming unit is static for now)
        const currentText = this.valueEl.element.innerText;
        const unit = currentText.split(' ').pop();
        this.valueEl.text(`${value} ${unit}`);
    }
}
