import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';

export class Graph extends Interface {
    constructor({ width = 300, height = 100, color = 'var(--ui-color)' }) {
        super('.graph');

        this.width = width;
        this.height = height;
        this.color = color;
        this.dataPoints = [];
        this.maxPoints = 20;

        this.css({
            width: `${width}px`,
            height: `${height}px`,
            position: 'relative',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)'
        });

        // SVG Container
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.style.overflow = 'visible';
        this.element.appendChild(this.svg);

        // Polyline
        this.line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        this.line.setAttribute('fill', 'none');
        this.line.setAttribute('stroke', this.color);
        this.line.setAttribute('stroke-width', '2');
        this.line.setAttribute('stroke-linecap', 'round');
        this.line.setAttribute('stroke-linejoin', 'round');
        this.svg.appendChild(this.line);

        // Markers (Dots)
        this.markersGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.svg.appendChild(this.markersGroup);

        // Initialize with some dummy data if empty
        this.addPoint(0);
    }

    addPoint(value) {
        this.dataPoints.push(value);
        if (this.dataPoints.length > this.maxPoints) {
            this.dataPoints.shift();
        }
        this.draw();
    }

    draw() {
        if (this.dataPoints.length < 2) return;

        const stepX = this.width / (this.maxPoints - 1);
        const minVal = Math.min(...this.dataPoints);
        const maxVal = Math.max(...this.dataPoints);
        const range = maxVal - minVal || 1;

        let pointsStr = '';

        // Clear markers
        while (this.markersGroup.firstChild) {
            this.markersGroup.removeChild(this.markersGroup.firstChild);
        }

        this.dataPoints.forEach((val, i) => {
            const x = i * stepX;
            // Normalize y (0 at bottom, height at top)
            const normalized = (val - minVal) / range;
            const y = this.height - (normalized * this.height * 0.8 + this.height * 0.1); // Padding

            pointsStr += `${x},${y} `;

            // Add marker for last point
            if (i === this.dataPoints.length - 1) {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', x);
                circle.setAttribute('cy', y);
                circle.setAttribute('r', '3');
                circle.setAttribute('fill', this.color);
                this.markersGroup.appendChild(circle);

                // Glow effect
                const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                glow.setAttribute('cx', x);
                glow.setAttribute('cy', y);
                glow.setAttribute('r', '8');
                glow.setAttribute('fill', this.color);
                glow.setAttribute('opacity', '0.3');
                this.markersGroup.appendChild(glow);
            }
        });

        this.line.setAttribute('points', pointsStr);
    }
}
