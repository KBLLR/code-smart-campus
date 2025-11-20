// persona-card.js
class PersonaCard extends HTMLElement {
    static get observedAttributes() {
        return ['name', 'description', 'icon'];
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
                    width: 12rem; /* w-48 */
                    height: 12rem; /* h-48 */
                 }
                /* Add float animation if desired */
                 :host(.animate-float) .card-wrapper {
                     animation: float 3s ease-in-out infinite;
                 }
                 @keyframes float {
                     0%, 100% { transform: translateY(0px); }
                     50% { transform: translateY(-8px); }
                 }

                .card-wrapper {
                    border: 2px solid var(--blueprint-line, #64ffda);
                    border-radius: 255px 15px 225px 15px/15px 225px 15px 255px; /* Sketchy */
                    padding: 1rem;
                    width: 100%;
                    height: 100%;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                     color: var(--blueprint-text, #e6f1ff);
                }
                 .icon-container {
                    font-size: 2.5rem; /* text-4xl */
                    margin-bottom: 0.5rem; /* mb-2 */
                    /* Color will be set by icon-component */
                 }
                .name {
                    font-family: var(--font-handwriting, cursive);
                    font-size: 1.1em;
                    color: var(--blueprint-text, #e6f1ff);
                }
                .description {
                    font-size: 0.75rem; /* text-xs */
                    margin-top: 0.5rem; /* mt-2 */
                    color: var(--blueprint-line, #64ffda); /* Example color */
                 }
            </style>
            <div class="card-wrapper">
                <div id="icon-container" class="icon-container">
                    <icon-component name="fas fa-user"></icon-component> <!-- Default -->
                </div>
                <p id="name-content" class="name"></p>
                <p id="description-content" class="description"></p>
            </div>
        `;
         this.shadowRoot.appendChild(template.content.cloneNode(true));
         this.iconComponent = this.shadowRoot.querySelector('icon-component');
         this.nameElement = this.shadowRoot.getElementById('name-content');
         this.descriptionElement = this.shadowRoot.getElementById('description-content');
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
        if (!this.iconComponent || !this.nameElement || !this.descriptionElement) return;

        const name = this.getAttribute('name') || 'Persona Name';
        const description = this.getAttribute('description') || 'Persona description.';
        const iconClass = this.getAttribute('icon') || 'fas fa-user'; // e.g., "fas fa-hat-wizard"

        // Determine icon color based on known persona icons (or pass as attribute)
        let iconColor = 'var(--blueprint-line)'; // Default
        if (iconClass.includes('fa-hat-wizard')) iconColor = 'var(--color-purple-icon)';
        if (iconClass.includes('fa-mug-hot')) iconColor = 'var(--color-orange-icon)';
        if (iconClass.includes('fa-coffee')) iconColor = 'var(--color-brown-icon)';

        this.iconComponent.setAttribute('name', iconClass);
        this.iconComponent.setAttribute('color', iconColor); // Set color attribute on icon
        this.nameElement.textContent = name;
        this.descriptionElement.textContent = description;
    }
}
customElements.define('persona-card', PersonaCard);
