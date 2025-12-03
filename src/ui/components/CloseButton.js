import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';
import { tween } from '@alienkitty/space.js/src/tween/Tween.js';

export class CloseButton extends Interface {
    constructor() {
        super(null, 'div');

        this.css({
            position: 'relative',
            width: 60,
            height: 60,
            cursor: 'pointer',
            pointerEvents: 'auto'
        });

        this.rotation = 0;
        this.initSVG();
        this.addListeners();
    }

    initSVG() {
        const ns = 'http://www.w3.org/2000/svg';

        this.svg = document.createElementNS(ns, 'svg');
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.setAttribute('viewBox', '0 0 60 60');
        this.element.appendChild(this.svg);

        // Circle
        this.circle = document.createElementNS(ns, 'circle');
        this.circle.setAttribute('cx', 30);
        this.circle.setAttribute('cy', 30);
        this.circle.setAttribute('r', 24);
        this.circle.style.fill = 'none';
        this.circle.style.stroke = 'var(--ui-color)';
        this.circle.style.strokeWidth = '1.5';
        this.circle.style.opacity = '0.5';
        this.circle.style.transition = 'opacity 0.3s ease, stroke-width 0.3s ease';
        this.svg.appendChild(this.circle);

        // Icon Group (X)
        this.iconGroup = document.createElementNS(ns, 'g');
        // Center the 22x22 X icon: (60-22)/2 = 19
        this.iconGroup.setAttribute('transform', 'translate(19, 19) rotate(0, 11, 11)');
        this.iconGroup.style.fill = 'none';
        this.iconGroup.style.stroke = 'var(--ui-color)';
        this.iconGroup.style.strokeWidth = '1.5';
        this.iconGroup.style.transition = 'stroke-width 0.3s ease';
        this.svg.appendChild(this.iconGroup);

        // Line 1
        const line1 = document.createElementNS(ns, 'line');
        line1.setAttribute('x1', 0);
        line1.setAttribute('y1', 0);
        line1.setAttribute('x2', 22);
        line1.setAttribute('y2', 22);
        this.iconGroup.appendChild(line1);

        // Line 2
        const line2 = document.createElementNS(ns, 'line');
        line2.setAttribute('x1', 22);
        line2.setAttribute('y1', 0);
        line2.setAttribute('x2', 0);
        line2.setAttribute('y2', 22);
        this.iconGroup.appendChild(line2);
    }

    addListeners() {
        this.element.addEventListener('mouseenter', () => {
            this.circle.style.opacity = '1';
            this.circle.style.strokeWidth = '2';
            this.iconGroup.style.strokeWidth = '2';

            // Animate rotation
            tween(this, { rotation: 90 }, 400, 'easeOutCubic', (val) => {
                this.iconGroup.setAttribute('transform', `translate(19, 19) rotate(${this.rotation}, 11, 11)`);
            });
        });

        this.element.addEventListener('mouseleave', () => {
            this.circle.style.opacity = '0.5';
            this.circle.style.strokeWidth = '1.5';
            this.iconGroup.style.strokeWidth = '1.5';

            // Animate rotation back
            tween(this, { rotation: 0 }, 400, 'easeOutCubic', (val) => {
                this.iconGroup.setAttribute('transform', `translate(19, 19) rotate(${this.rotation}, 11, 11)`);
            });
        });
    }

    animateIn() {
        this.css({ opacity: 0, transform: 'scale(0.8)' });
        this.tween({ opacity: 1, scale: 1 }, 600, 'easeOutBack');
    }

    animateOut() {
        this.tween({ opacity: 0, scale: 0.8 }, 400, 'easeInBack');
    }
}
