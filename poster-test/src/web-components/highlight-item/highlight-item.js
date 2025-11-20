// highlight-item.js
class HighlightItem extends HTMLElement {
    static get observedAttributes() {
        return ['category', 'text', 'icon'];
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
                    display: block;
                    margin-bottom: 1rem; /* mb-4 */
                }
                 .highlight-wrapper {
                    display: flex;
                    align-items: center;
                 }
                .icon-container {
                    margin-right: 1rem; /* mr-4 */
                    font-size: 1.5rem; /* text-2xl */
                    flex-shrink: 0;
                    /* Color set dynamically */
                 }
                 .text-container {
                    flex-grow: 1;
                 }
                 .category {
                     font-weight: bold;
                     color: var(--blueprint-text, #e6f1ff);
                 }
                 .text {
                     font-size: 0.875rem; /* text-sm */
                     color: var(--blueprint-line, #64ffda); /* Example color */
                 }
            </style>
            <div class="highlight-wrapper">
                <div class="icon-container" id="icon-container">
                    <icon-component name="fas fa-star"></icon-component> <!-- Default -->
                </div>
                <div class="text-container">
                    <p id="category-content" class="category"></p>
                    <p id="text-content" class="text"></p>
                </div>
            </div>
        `;
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.iconComponent = this.shadowRoot.querySelector('icon-component');
        this.categoryElement = this.shadowRoot.getElementById('category-content');
        this.textElement = this.shadowRoot.getElementById('text-content');
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
         if (!this.iconComponent || !this.categoryElement || !this.textElement) return;

        const category = this.getAttribute('category') || 'Highlight';
        const text = this.getAttribute('text') || 'Highlight details.';
        const iconClass = this.getAttribute('icon') || 'fas fa-star';

        // Determine icon color based on known highlight icons (or pass as attribute)
        let iconColor = 'var(--blueprint-line)'; // Default
        if (iconClass.includes('fa-check-circle')) iconColor = 'var(--color-green-icon)';
        if (iconClass.includes('fa-lightbulb')) iconColor = 'var(--color-yellow-icon)';
        if (iconClass.includes('fa-graduation-cap')) iconColor = 'var(--blueprint-line)'; // Or another specific color

        this.iconComponent.setAttribute('name', iconClass);
        this.iconComponent.setAttribute('color', iconColor);
        this.categoryElement.textContent = category;
        this.textElement.textContent = text;
    }
}
customElements.define('highlight-item', HighlightItem);
