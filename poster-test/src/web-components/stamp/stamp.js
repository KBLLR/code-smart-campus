// stamp-component.js
class StampComponent extends HTMLElement {
    static get observedAttributes() {
        return ['text'];
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
                    display: inline-block; /* Allow positioning */
                    transform: rotate(-5deg);
                }
                .stamp-wrapper {
                    border: 4px dashed var(--blueprint-line, #64ffda);
                    box-shadow: 0 0 10px rgba(100, 255, 218, 0.5);
                    padding: 1.5rem 2rem;
                    text-align: center;
                    color: var(--blueprint-line, #64ffda);
                    font-family: var(--font-handwriting, cursive);
                    font-weight: bold;
                    font-size: 1.8em; /* Adjust as needed */
                    text-transform: uppercase;
                }
            </style>
            <div class="stamp-wrapper">
                <span id="text-content"></span>
            </div>
        `;
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.textElement = this.shadowRoot.getElementById('text-content');
    }

    connectedCallback() {
        this._render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'text' && oldValue !== newValue) {
            this._render();
        }
    }

    _render() {
         if (!this.textElement) return;
        const text = this.getAttribute('text') || 'STAMPED';
        this.textElement.textContent = text;
    }
}
customElements.define('stamp-component', StampComponent);
