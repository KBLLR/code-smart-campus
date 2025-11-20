// feedback-item.js
class FeedbackItem extends HTMLElement {
    static get observedAttributes() {
        return ['source', 'text', 'icon'];
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
                    display: block; /* Takes full width */
                    margin-bottom: 1rem; /* Space between items */
                }
                .feedback-wrapper {
                    display: flex;
                    align-items: center;
                    /* border: 1px solid var(--blueprint-light); Example border */
                    padding: 0.5rem;
                }
                .icon-container {
                    width: 2.5rem; /* w-10 */
                    height: 2.5rem; /* h-10 */
                    border-radius: 50%;
                    background-color: var(--blueprint-line, #64ffda);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 1rem; /* mr-4 */
                    flex-shrink: 0; /* Prevent icon shrinking */
                    font-size: 1.2rem; /* Icon size */
                 }
                .text-container {
                    flex-grow: 1;
                }
                .source {
                    font-weight: bold;
                    color: var(--blueprint-text, #e6f1ff);
                }
                .text {
                    font-size: 0.875rem; /* text-sm */
                    color: var(--blueprint-line, #64ffda); /* Example text color */
                    margin-top: 0.1rem;
                }
            </style>
            <div class="feedback-wrapper">
                <div class="icon-container" id="icon-container">
                    <!-- Default icon -->
                    <icon-component name="fas fa-user" color="var(--blueprint-bg)"></icon-component>
                </div>
                <div class="text-container">
                    <p id="source-content" class="source"></p>
                    <p id="text-content" class="text"></p>
                </div>
            </div>
        `;
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.iconComponent = this.shadowRoot.querySelector('icon-component');
        this.sourceElement = this.shadowRoot.getElementById('source-content');
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
         if (!this.iconComponent || !this.sourceElement || !this.textElement) return;

        const source = this.getAttribute('source') || 'Feedback';
        const text = this.getAttribute('text') || 'No feedback text.';
        let iconClass = this.getAttribute('icon');

        // Determine default icon based on source if not provided
        if (!iconClass) {
             if (source.toLowerCase().includes('student')) {
                 iconClass = 'fas fa-user';
            } else if (source.toLowerCase().includes('faculty') || source.toLowerCase().includes('teacher')) {
                 iconClass = 'fas fa-chalkboard-teacher';
            } else {
                 iconClass = 'fas fa-comment-dots'; // Generic feedback
            }
        }

        this.iconComponent.setAttribute('name', iconClass);
         // Keep icon color contrasting with background
        this.iconComponent.setAttribute('color', 'var(--blueprint-bg)');
        this.sourceElement.textContent = source;
        this.textElement.textContent = text;
    }
}
customElements.define('feedback-item', FeedbackItem);
