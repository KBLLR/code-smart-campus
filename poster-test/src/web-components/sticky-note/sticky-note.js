// sticky-note.js
class StickyNote extends HTMLElement {
    static get observedAttributes() {
        return ['text', 'title', 'items', 'pin-color']; // items as JSON string
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
                    display: inline-block; /* Adjust as needed */
                    position: relative;
                    transform: rotate(-2deg);
                    min-width: 150px; /* Example */
                }
                .note-wrapper {
                    background: var(--color-yellow-note, #fffacd);
                    color: #333;
                    box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.3);
                    padding: 1rem;
                    font-family: var(--font-handwriting, cursive);
                    min-height: 80px; /* Example */
                }
                .title {
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                    color: var(--title-color, #333); /* Example custom prop */
                }
                ul {
                    list-style: disc;
                    list-style-position: inside;
                    margin: 0;
                    padding: 0;
                    font-size: 0.9em;
                 }
                li {
                     margin-bottom: 0.25rem;
                }
                 .pin {
                    position: absolute;
                    bottom: 4px;
                    right: 4px;
                    font-size: 1.2em;
                    /* Use CSS var for color, fallback provided */
                    color: var(--pin-color, var(--pin-color-default, #f87171));
                    /* Requires Font Awesome loaded globally */
                 }
            </style>
            <div class="note-wrapper">
                <div id="title-content" class="title" style="display: none;"></div>
                <div id="text-content"></div>
                <ul id="items-list" style="display: none;"></ul>
                <div class="pin">
                     <icon-component name="fas fa-thumbtack"></icon-component>
                 </div>
            </div>
        `;
         this.shadowRoot.appendChild(template.content.cloneNode(true));
         this.textElement = this.shadowRoot.getElementById('text-content');
         this.titleElement = this.shadowRoot.getElementById('title-content');
         this.listElement = this.shadowRoot.getElementById('items-list');
         this.pinElement = this.shadowRoot.querySelector('.pin');
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
         if (!this.textElement || !this.titleElement || !this.listElement || !this.pinElement) return;

        const text = this.getAttribute('text');
        const title = this.getAttribute('title');
        const itemsJson = this.getAttribute('items');
        const pinColor = this.getAttribute('pin-color');

        // Simple text mode
        if (text && !title && !itemsJson) {
            this.textElement.textContent = text;
            this.textElement.style.display = 'block';
            this.titleElement.style.display = 'none';
            this.listElement.style.display = 'none';
        }
        // Title and items list mode
        else if (title || itemsJson) {
            this.textElement.style.display = 'none';

            if (title) {
                 this.titleElement.textContent = title;
                 this.titleElement.style.display = 'block';
            } else {
                 this.titleElement.style.display = 'none';
            }

             if (itemsJson) {
                try {
                    const items = JSON.parse(itemsJson);
                    if (Array.isArray(items)) {
                         this.listElement.innerHTML = items.map(item => `<li>${item}</li>`).join('');
                         this.listElement.style.display = 'block';
                    } else {
                         this.listElement.style.display = 'none';
                    }
                } catch (e) {
                    console.error('StickyNote: Invalid JSON for items attribute:', itemsJson, e);
                    this.listElement.style.display = 'none';
                }
            } else {
                 this.listElement.style.display = 'none';
            }

        }
        // Default or error case
        else {
            this.textElement.textContent = 'Sticky Note';
            this.textElement.style.display = 'block';
            this.titleElement.style.display = 'none';
            this.listElement.style.display = 'none';
        }

        // Update pin color via CSS variable
        if (pinColor) {
            this.pinElement.style.setProperty('--pin-color', pinColor);
        } else {
             // Reset to default defined in CSS
             this.pinElement.style.removeProperty('--pin-color');
        }
    }
}
customElements.define('sticky-note', StickyNote);
