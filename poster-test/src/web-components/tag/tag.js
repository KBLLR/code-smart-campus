// tag-component.js
class TagComponent extends HTMLElement {
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
                    display: inline-block; /* Behaves like span */
                }
                .tag-wrapper {
                    display: inline-block;
                    padding: 0.25rem 0.75rem; /* py-1 px-3 */
                    background-color: var(--blueprint-light, #172a45);
                    border-radius: 9999px; /* rounded-full */
                    font-size: 0.75rem; /* text-xs */
                    border: 1px solid var(--blueprint-line, #64ffda);
                    color: var(--blueprint-line, #64ffda); /* Text color */
                 }
            </style>
            <span class="tag-wrapper" id="text-content"></span>
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
        const text = this.getAttribute('text') || 'Tag';
        this.textElement.textContent = text;
    }
}
customElements.define('tag-component', TagComponent);
