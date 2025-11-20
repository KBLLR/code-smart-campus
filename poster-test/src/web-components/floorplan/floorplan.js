// floor-plan.js
class FloorPlan extends HTMLElement {
    // Expects rooms as JSON string: [{ label: "Room Name", span: 1 }, ...]
    static get observedAttributes() {
        return ['rooms', 'columns']; // columns: number of grid columns
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
                    border: 1px solid var(--blueprint-light, #172a45); /* Container border */
                    padding: 1rem;
                }
                .plan-wrapper {
                    display: grid;
                    /* Grid columns set dynamically */
                    gap: 1rem; /* gap-4 */
                    min-height: 16rem; /* h-64 */
                    /* Optional grid background */
                    background: linear-gradient(to right, rgba(100, 255, 218, 0.05) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(100, 255, 218, 0.05) 1px, transparent 1px);
                    background-size: 30px 30px;
                }
                .room {
                    position: relative;
                    border: 2px solid var(--blueprint-line, #64ffda);
                    background-color: rgba(100, 255, 218, 0.1); /* Slight tint */
                    padding: 0.5rem;
                    /* Column span set dynamically */
                 }
                 .room-label {
                    position: absolute;
                    top: 0.5rem; /* top-2 */
                    left: 0.5rem; /* left-2 */
                    font-size: 0.75rem; /* text-xs */
                    color: var(--blueprint-text, #e6f1ff);
                    background-color: var(--blueprint-bg, #0a192f); /* Ensure readability */
                    padding: 0 0.25rem;
                 }
                 /* Interactive elements styling (optional) */
                 .interactive-dot {
                     position: absolute;
                     width: 1rem; /* w-4 */
                     height: 1rem; /* h-4 */
                     background-color: var(--blueprint-line, #64ffda);
                     border-radius: 50%;
                     animation: pulse 2s infinite ease-in-out;
                     /* Position these dynamically if needed */
                     top: 25%; left: 25%; /* Example */
                 }
                 @keyframes pulse {
                     0%, 100% { transform: scale(0.9); opacity: 0.7; }
                     50% { transform: scale(1.1); opacity: 1; }
                 }
            </style>
            <div class="plan-wrapper" id="plan-container">
                <!-- Rooms will be rendered here -->
                <!-- Example interactive element: -->
                <!-- <div class="interactive-dot" style="top: 25%; left: 25%;"></div> -->
            </div>
        `;
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.container = this.shadowRoot.getElementById('plan-container');
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

        const roomsJson = this.getAttribute('rooms');
        const columns = this.getAttribute('columns') || '3'; // Default to 3 columns

        // Set grid columns
        this.container.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;

        if (!roomsJson) {
            this.container.textContent = 'No room data provided.';
            return;
        }

        try {
            const rooms = JSON.parse(roomsJson);
            if (!Array.isArray(rooms)) throw new Error('Rooms data is not an array.');

            rooms.forEach(room => {
                const roomEl = document.createElement('div');
                roomEl.classList.add('room');

                const span = room.span || 1;
                roomEl.style.gridColumn = `span ${span} / span ${span}`;

                const labelEl = document.createElement('div');
                labelEl.classList.add('room-label');
                labelEl.textContent = room.label || 'Room';

                roomEl.appendChild(labelEl);
                this.container.appendChild(roomEl);
            });

        } catch (e) {
            console.error('FloorPlan: Error parsing JSON data:', e);
            this.container.textContent = 'Error rendering floor plan.';
        }
    }
}
customElements.define('floor-plan', FloorPlan);
