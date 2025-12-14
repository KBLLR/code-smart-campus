import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';

/**
 * GraphWidget
 * Wrapper for Space.js PanelItem or custom canvas graph.
 * For now, simple canvas implementation for Line/Meter.
 */
export class GraphWidget extends Interface {
    constructor({ type = 'line', width = 200, height = 100, color = 'var(--ui-color)' } = {}) {
        super('.graph-widget', 'canvas');
        
        this.type = type;
        this.width = width;
        this.height = height;
        this.color = color;
        
        this.css({
            width: '100%',
            height: `${height}px`,
            display: 'block'
        });
        
        this.element.width = width;
        this.element.height = height;
        this.ctx = this.element.getContext('2d');
        
        this.data = [];
        this.maxPoints = 50;
        switch (type) {
            case 'meter': this.maxPoints = 1; break;
            default: this.maxPoints = 50;
        }
    }
    
    update(value) {
        if (typeof value !== 'number') return;
        
        this.data.push(value);
        if (this.data.length > this.maxPoints) {
            this.data.shift();
        }
        
        this.draw();
    }
    
    clear() {
        this.data = [];
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
    
    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        
        ctx.clearRect(0, 0, w, h);
        
        if (this.data.length === 0) return;
        
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
        
        if (this.type === 'meter') {
            // Draw horizontal or circular meter
            const val = this.data[this.data.length - 1];
            // Normalize assuming 0-100 for now, or just show bar
            const pct = Math.min(Math.max(val / 100, 0), 1);
            
            ctx.globalAlpha = 0.2;
            ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = 1.0;
            ctx.fillRect(0, 0, w * pct, h);
            
        } else if (this.type === 'line') {
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            // Auto-scale
            let min = Math.min(...this.data, 0);
            let max = Math.max(...this.data, 10); // Minimum scale
            let range = max - min || 1;
            
            const step = w / (this.maxPoints - 1);
            
            this.data.forEach((val, i) => {
                const x = i * step;
                const normalized = (val - min) / range;
                const y = h - (normalized * h);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            
            ctx.stroke();
            
            // Fill area
            ctx.lineTo(this.data.length * step, h);
            ctx.lineTo(0, h);
            ctx.globalAlpha = 0.1;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }
}
