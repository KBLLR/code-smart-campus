// file-folder.js
class FileFolder extends HTMLElement {
    static get observedAttributes() {
        return ['label', 'icon'];
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
                    width: 12rem; /* Approx w-48 */
                    height: 8rem; /* Approx h-32 */
                }
                .folder-wrapper {
                    border: 2px solid var(--blueprint-line, #64ffda);
                    border-radius: 255px 15px 225px 15px/15px 225px 15px 255px; /* Sketchy border */
                    background-color: var(--blueprint-light, #172a45);
                    padding: 1rem;
                    position: relative;
                    width: 100%;
                    height: 100%;
                    box-sizing: border-box; /* Include padding/border in size */
                    font-family: var(--font-handwriting, cursive);
                    color: var(--blueprint-line, #64ffda);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                .label {
                    font-size: 1.1em;
                }
                .icon-container {
                    position: absolute;
                    bottom: 0.5rem;
                    right: 0.5rem;
                    font-size: 1.5em; /* Adjust icon size */
                }
                /* Add float animation if desired */
                 :host(.animate-float) .folder-wrapper {
                     animation: float 3s ease-in-out infinite;
                 }
                 @keyframes float {
                     0%, 100% { transform: translateY(0px); }
                     50% { transform: translateY(-8px); }
                 }

            </style>
            <div class="folder-wrapper">
                <div id="label-content" class="label"></div>
                <div id="icon-container" class="icon-container" style="display: none;">
                    <icon-component name="fas fa-file-alt"></icon-component> <!-- Default icon -->
                </div>
            </div>
        `;
         this.shadowRoot.appendChild(template.content.cloneNode(true));
         this.labelElement = this.shadowRoot.getElementById('label-content');
         this.iconContainer = this.shadowRoot.getElementById('icon-container');
         this.iconComponent = this.shadowRoot.querySelector('icon-component');
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
         if (!this.labelElement || !this.iconContainer || !this.iconComponent) return;

        const label = this.getAttribute('label') || 'Folder';
        const iconClass = this.getAttribute('icon'); // e.g., "fas fa-microchip"

        this.labelElement.textContent = label;

        if (iconClass) {
             this.iconComponent.setAttribute('name', iconClass);
             this.iconContainer.style.display = 'block';
        } else {
            // Use default icon if needed or hide
            this.iconComponent.setAttribute('name', 'fas fa-file-alt'); // Set default
             this.iconContainer.style.display = 'block'; // Show default? Or hide?
             // this.iconContainer.style.display = 'none'; // <-- To hide if no icon attr provided
        }
    }
}
customElements.define('file-folder', FileFolder);
