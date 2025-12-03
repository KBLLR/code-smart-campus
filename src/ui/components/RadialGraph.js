import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';

export class RadialGraph extends Interface {
    constructor({ width = 100, height = 100, color = 'var(--ui-color)', label = '', unit = '', min = 0, max = 100 }) {
        super('.radial-graph');

        this.width = width;
        this.height = height;
        this.color = color;
        this.label = label;
        this.unit = unit;
        this.min = min;
        this.max = max;
        this.value = min;

        this.css({
            width: `${width}px`,
            height: `${height}px`,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        });

        // SVG Container
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.setAttribute('viewBox', '0 0 100 100');
        this.svg.style.position = 'absolute';
        this.svg.style.top = '0';
        this.svg.style.left = '0';
        this.element.appendChild(this.svg);

        // Background Circle
        this.bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.bgCircle.setAttribute('cx', '50');
        this.bgCircle.setAttribute('cy', '50');
        this.bgCircle.setAttribute('r', '45');
        this.bgCircle.setAttribute('fill', 'none');
        this.bgCircle.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
        this.bgCircle.setAttribute('stroke-width', '5');
        this.svg.appendChild(this.bgCircle);

        // Progress Circle
        this.progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.progressCircle.setAttribute('cx', '50');
        this.progressCircle.setAttribute('cy', '50');
        this.progressCircle.setAttribute('r', '45');
        this.progressCircle.setAttribute('fill', 'none');
        this.progressCircle.setAttribute('stroke', this.color);
        this.progressCircle.setAttribute('stroke-width', '5');
        this.progressCircle.setAttribute('stroke-linecap', 'round');
        this.progressCircle.setAttribute('stroke-dasharray', '283'); // 2 * PI * 45
        this.progressCircle.setAttribute('stroke-dashoffset', '283');
        this.progressCircle.style.transition = 'stroke-dashoffset 0.5s ease';
        this.progressCircle.style.transform = 'rotate(-90deg)';
        this.progressCircle.style.transformOrigin = '50% 50%';
        this.svg.appendChild(this.progressCircle);

        // Value Text
        this.valueText = new Interface('.value-text');
        this.valueText.css({
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'var(--ui-color)',
            zIndex: 1
        });
        this.add(this.valueText);

        // Label Text
        this.labelText = new Interface('.label-text');
        this.labelText.css({
            fontSize: '10px',
            textTransform: 'uppercase',
            color: 'var(--ui-secondary-color)',
            marginTop: '2px',
            zIndex: 1
        });
        this.labelText.text(this.label);
        this.add(this.labelText);

        this.update(this.value);
    }

    update(value) {
        this.value = Math.max(this.min, Math.min(this.max, value));

        // Update Circle
        const range = this.max - this.min;
        const percent = (this.value - this.min) / range;
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (percent * circumference);
        this.progressCircle.setAttribute('stroke-dashoffset', offset);

        // Update Text
        this.valueText.text(`${this.value.toFixed(1)}${this.unit}`);
    }
}
