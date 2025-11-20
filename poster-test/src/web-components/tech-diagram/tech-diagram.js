// tech-diagram.js
class TechDiagram extends HTMLElement {
    // Expects nodes and connections as JSON strings
    static get observedAttributes() {
        return ['nodes', 'connections'];
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
                    padding: 1rem;
                }
                .diagram-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem; /* Adjust gap */
                    flex-wrap: wrap; /* Allow wrapping */
                    border: 2px solid var(--blueprint-line, #64ffda); /* Sketchy box imitation */
                    border-radius: 255px 15px 225px 15px/15px 225px 15px 255px;
                    padding: 2rem; /* p-8 */
                    margin-bottom: 2rem; /* mb-8 */
                 }
                .node {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    position: relative;
                 }
                .node-icon-box {
                    border: 2px solid var(--blueprint-line, #64ffda);
                    border-radius: 9999px; /* rounded-full */
                    padding: 1rem; /* p-4 */
                    margin-bottom: 1.5rem; /* Space for label below */
                    font-size: 1.5rem; /* text-2xl */
                }
                .node-label {
                    position: absolute;
                    bottom: -1.5rem; /* -bottom-6 */
                    left: 0;
                    right: 0;
                    font-size: 0.75rem; /* text-xs */
                    white-space: nowrap;
                    color: var(--blueprint-text, #e6f1ff);
                }
                 .connector {
                    height: 4px; /* h-1 */
                    background-color: var(--blueprint-line, #64ffda);
                    flex-grow: 1;
                    min-width: 4rem; /* w-16 */
                    position: relative;
                    margin: 0 1rem; /* Basic spacing */
                 }
                 /* Simple arrow head (can be improved) */
                 .connector::after {
                     content: '';
                     position: absolute;
                     top: 50%;
                     right: -4px; /* Position at the end */
                     transform: translateY(-50%) rotate(45deg);
                     width: 0.75rem; /* w-3? approximation */
                     height: 0.75rem; /* h-3? approximation */
                     background-color: var(--blueprint-line, #64ffda);
                 }
                 /* Hide connector after the last node */
                 .node:last-of-type + .connector {
                     display: none;
                 }
            </style>
            <div class="diagram-wrapper" id="diagram-container">
                <!-- Nodes and connectors will be rendered here -->
            </div>
        `;
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.container = this.shadowRoot.getElementById('diagram-container');
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
        if (!this.container) return;
        this.container.innerHTML = ''; // Clear previous render

        const nodesJson = this.getAttribute('nodes');
        // const connectionsJson = this.getAttribute('connections'); // Use if needed for complex links

        if (!nodesJson) {
            this.container.textContent = 'No diagram data provided.';
            return;
        }

        try {
            const nodes = JSON.parse(nodesJson);
            // const connections = connectionsJson ? JSON.parse(connectionsJson) : [];

            if (!Array.isArray(nodes)) throw new Error('Nodes data is not an array.');

            nodes.forEach((node, index) => {
                // Create Node Element
                const nodeEl = document.createElement('div');
                nodeEl.classList.add('node');
                nodeEl.innerHTML = `
                    <div class="node-icon-box">
                        <icon-component name="${node.icon || 'fas fa-question-circle'}" color="var(--blueprint-line)"></icon-component>
                    </div>
                    <span class="node-label">${node.label || 'Unknown'}</span>
                `;
                this.container.appendChild(nodeEl);

                // Create Connector (if not the last node)
                if (index < nodes.length - 1) {
                    const connectorEl = document.createElement('div');
                    connectorEl.classList.add('connector');
                    this.container.appendChild(connectorEl);
                }
            });

        } catch (e) {
            console.error('TechDiagram: Error parsing JSON data:', e);
            this.container.textContent = 'Error rendering diagram data.';
        }
    }
}
customElements.define('tech-diagram', TechDiagram);
