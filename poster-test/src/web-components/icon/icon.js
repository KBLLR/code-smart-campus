// icon-component.js
class IconComponent extends HTMLElement {
    static get observedAttributes() {
        return ['name', 'size', 'color', 'animation'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._createTemplate();
    }

     _createTemplate() {
         const template = document.createElement('template');
         template.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    line-height: 1; /* Prevent extra space */
                }
                i {
                    font-style: normal; /* Reset Font Awesome default */
                    font-size: var(--icon-size, inherit);
                    color: var(--icon-color, var(--icon-color-default, #64ffda));
                    transition: color 0.3s ease, transform 0.3s ease;
                }
                /* Basic pulse animation */
                @keyframes pulse {
                    50% { opacity: 0.6; }
                }
                .animate-pulse i {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            </style>
            <span class="icon-wrapper"><i class="" aria-hidden="true"></i></span>
        `;
         this.shadowRoot.appendChild(template.content.cloneNode(true));
         this.iconElement = this.shadowRoot.querySelector('i');
         this.wrapperElement = this.shadowRoot.querySelector('.icon-wrapper');
    }

    connectedCallback() {
        this._render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._render();
        }
    }

    _render() {
        if (!this.iconElement) return;

        const name = this.getAttribute('name') || ''; // e.g., "fas fa-brain"
        const size = this.getAttribute('size');
        const color = this.getAttribute('color');
        const animation = this.getAttribute('animation'); // e.g., "pulse"

        // Update icon class
        this.iconElement.className = name; // Directly set Font Awesome classes

        // Update styles via CSS variables or direct style
        if (size) {
            this.iconElement.style.setProperty('--icon-size', size);
        } else {
            this.iconElement.style.removeProperty('--icon-size');
        }
         if (color) {
            this.iconElement.style.setProperty('--icon-color', color);
        } else {
             this.iconElement.style.removeProperty('--icon-color');
        }

        // Handle animation class on wrapper
        this.wrapperElement.classList.toggle('animate-pulse', animation === 'pulse');
        // Add other animation classes if needed
    }
}
customElements.define('icon-component', IconComponent);
