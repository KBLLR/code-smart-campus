// sketchy-box.js
class SketchyBox extends HTMLElement {
    static get observedAttributes() {
        return ['padding'];
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
                    display: block; /* Or inline-block */
                }
                .sketchy-wrapper {
                    border: 2px solid var(--blueprint-line, #64ffda);
                    border-radius: 255px 15px 225px 15px/15px 225px 15px 255px;
                    /* Use CSS var for padding, provide default */
                    padding: var(--padding, 1.5rem);
                }
            </style>
            <div class="sketchy-wrapper">
                <slot></slot> <!-- Allow content projection -->
            </div>
        `;
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.wrapperElement = this.shadowRoot.querySelector('.sketchy-wrapper');
    }

     connectedCallback() {
        this._updatePadding();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'padding' && oldValue !== newValue) {
            this._updatePadding();
        }
    }

    _updatePadding() {
         if (!this.wrapperElement) return;
        const paddingValue = this.getAttribute('padding');
        if (paddingValue) {
            // Set the CSS variable on the host element or wrapper
            this.wrapperElement.style.setProperty('--padding', paddingValue);
        } else {
            // Remove the variable override to use the CSS default
            this.wrapperElement.style.removeProperty('--padding');
        }
    }
}
customElements.define('sketchy-box', SketchyBox);
