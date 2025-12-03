import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';

export class AudioWave extends Interface {
    constructor(options = {}) {
        super('.audio-wave', 'canvas');

        this.options = {
            width: 300,
            height: 60,
            color: '#00d1ff',
            lineWidth: 2,
            ...options
        };

        this.init();
    }

    init() {
        this.element.width = this.options.width;
        this.element.height = this.options.height;
        this.ctx = this.element.getContext('2d');

        this.css({
            width: '100%',
            height: `${this.options.height}px`,
            opacity: 0.8
        });

        this.points = [];
        this.running = false;

        // Initialize flat line
        for (let i = 0; i < 50; i++) {
            this.points.push(0);
        }
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.animate();
    }

    stop() {
        this.running = false;
    }

    update(amplitude = 0) {
        // Shift points
        this.points.shift();
        // Add new point based on amplitude + noise
        this.points.push(amplitude * (Math.random() - 0.5));
    }

    animate() {
        if (!this.running) return;

        requestAnimationFrame(() => this.animate());

        // Simulate audio input if no external update
        this.update(Math.random() * 0.5);

        this.draw();
    }

    draw() {
        const { width, height } = this.element;
        const ctx = this.ctx;
        const centerY = height / 2;

        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.strokeStyle = this.options.color;
        ctx.lineWidth = this.options.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const step = width / (this.points.length - 1);

        for (let i = 0; i < this.points.length; i++) {
            const x = i * step;
            const y = centerY + this.points[i] * (height / 2);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        ctx.stroke();
    }
}
