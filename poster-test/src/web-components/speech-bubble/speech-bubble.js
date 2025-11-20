// speech-bubble.js
class SpeechBubble extends HTMLElement {
    static get observedAttributes() {
        return ['text', 'direction']; // direction: top, bottom, left, right (default: bottom)
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
                    display: inline-block; /* Or block */
                    position: relative;
                    margin: 1rem; /* Add some default margin */
                }
                .bubble-wrapper {
                    background: var(--blueprint-light, #172a45);
                    border: 2px solid var(--blueprint-line, #64ffda);
                    border-radius: 10px;
                    padding: 1rem;
                    font-family: var(--font-handwriting, cursive);
                     color: var(--blueprint-text, #e6f1ff);
                }
                /* Tail Base Styles */
                .bubble-wrapper::after,
                .bubble-wrapper::before {
                    content: "";
                    position: absolute;
                    border-style: solid;
                    border-color: transparent; /* Default */
                 }
                 /* Tail - Bottom (Default) */
                :host(:not([direction])) .bubble-wrapper::after, /* Background */
                :host([direction="bottom"]) .bubble-wrapper::after {
                    bottom: -10px;
                    left: 20px; /* Adjust as needed */
                    border-width: 10px 10px 0;
                    border-top-color: var(--blueprint-light, #172a45);
                 }
                 :host(:not([direction])) .bubble-wrapper::before, /* Border */
                :host([direction="bottom"]) .bubble-wrapper::before {
                    bottom: -13px; /* Adjusted for border */
                    left: 19px; /* Adjusted for border */
                    border-width: 11px 11px 0;
                    border-top-color: var(--blueprint-line, #64ffda);
                    z-index: -1; /* Behind background */
                 }
                /* Tail - Top */
                 :host([direction="top"]) .bubble-wrapper::after {
                    top: -10px; left: 20px; border-width: 0 10px 10px; border-bottom-color: var(--blueprint-light, #172a45);
                 }
                 :host([direction="top"]) .bubble-wrapper::before {
                    top: -13px; left: 19px; border-width: 0 11px 11px; border-bottom-color: var(--blueprint-line, #64ffda); z-index: -1;
                 }
                 /* Tail - Left */
                 :host([direction="left"]) .bubble-wrapper::after {
                    left: -10px; top: 20px; border-width: 10px 10px 10px 0; border-right-color: var(--blueprint-light, #172a45);
                 }
                 :host([direction="left"]) .bubble-wrapper::before {
                    left: -13px; top: 19px; border-width: 11px 11px 11px 0; border-right-color: var(--blueprint-line, #64ffda); z-index: -1;
                 }
                  /* Tail - Right */
                 :host([direction="right"]) .bubble-wrapper::after {
                    right: -10px; top: 20px; border-width: 10px 0 10px 10px; border-left-color: var(--blueprint-light, #172a45);
                 }
                 :host([direction="right"]) .bubble-wrapper::before {
                    right: -13px; top: 19px; border-width: 11px 0 11px 11px; border-left-color: var(--blueprint-line, #64ffda); z-index: -1;
                 }
            </style>
            <div class="bubble-wrapper">
                <div id="text-content"></div>
            </div>
        `;
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.textElement = this.shadowRoot.getElementById('text-content');
        this.wrapperElement = this.shadowRoot.querySelector('.bubble-wrapper');
    }

     connectedCallback() {
        this._render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            // Direction change affects the host attribute, CSS handles it.
            // Only need to re-render text if text changes.
            if (name === 'text') {
                 this._renderText();
            }
        }
    }

     _render() {
         this._renderText();
         // Direction is handled by the host attribute and CSS selectors
    }

     _renderText() {
        if (!this.textElement) return;
        const text = this.getAttribute('text') || '...';
        this.textElement.textContent = text;
    }
}
customElements.define('speech-bubble', SpeechBubble);
