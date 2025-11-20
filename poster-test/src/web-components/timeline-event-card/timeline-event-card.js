// timeline-event-card.js
class TimelineEventCard extends HTMLElement {
    // Expect key-elements and visuals as JSON strings
    static get observedAttributes() {
        return ['date', 'title', 'description', 'key-elements', 'visuals'];
    }

     constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._createTemplate();
    }

    _createTemplate() {
        const template = document.createElement('template');
        // Note: This is a complex component, structure is simplified here
        // Real implementation might need more intricate layout based on visuals
        template.innerHTML = `
            <style>
                :host {
                    display: block;
                    padding: 2rem 1rem;
                    border-left: 3px solid var(--blueprint-line, #64ffda); /* Example timeline indicator */
                    margin-left: 2rem;
                    margin-bottom: 3rem;
                    position: relative;
                }
                .marker {
                    position: absolute;
                    left: -2.5rem; /* Adjust based on line thickness and desired position */
                    top: 0;
                    background-color: var(--blueprint-light, #172a45);
                    padding: 0.5rem 1rem;
                    border-radius: 9999px;
                    border: 1px solid var(--blueprint-line, #64ffda);
                    color: var(--blueprint-line, #64ffda);
                    font-size: 0.875rem;
                    white-space: nowrap;
                }
                .card-content {
                    max-width: 56rem; /* max-w-4xl */
                    margin-left: auto;
                    margin-right: auto;
                }
                .title {
                    font-family: var(--font-handwriting, cursive);
                    font-size: 1.5rem; /* text-2xl */
                    font-weight: bold;
                    color: var(--blueprint-line, #64ffda);
                    margin-bottom: 1rem; /* mb-4 */
                    text-align: center; /* Added */
                 }
                .description {
                    margin-bottom: 1rem;
                    color: var(--blueprint-text, #e6f1ff);
                 }
                .key-elements-list {
                    list-style: disc;
                    margin-left: 1.5rem;
                    margin-bottom: 1.5rem;
                    font-size: 0.9em;
                    color: var(--blueprint-line, #64ffda);
                }
                 .visuals-container {
                     display: flex;
                     flex-wrap: wrap;
                     gap: 1.5rem; /* gap-6 */
                     justify-content: center; /* Center visuals */
                     margin-top: 1.5rem;
                     padding: 1rem;
                     /* border: 1px dashed var(--blueprint-light); Optional separator */
                 }
            </style>
            <div class="card-wrapper">
                <div id="marker-content" class="marker"></div>
                <div class="card-content">
                    <h2 id="title-content" class="title"></h2>
                    <p id="description-content" class="description"></p>
                    <ul id="key-elements-list" style="display: none;"></ul>
                    <div id="visuals-container" class="visuals-container">
                        <!-- Visual components rendered here -->
                    </div>
                </div>
            </div>
        `;
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.markerElement = this.shadowRoot.getElementById('marker-content');
        this.titleElement = this.shadowRoot.getElementById('title-content');
        this.descriptionElement = this.shadowRoot.getElementById('description-content');
        this.keyElementsList = this.shadowRoot.getElementById('key-elements-list');
        this.visualsContainer = this.shadowRoot.getElementById('visuals-container');
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
        if (!this.markerElement || !this.titleElement || !this.descriptionElement || !this.keyElementsList || !this.visualsContainer) {
            console.warn('TimelineEventCard elements not ready for render.');
            return;
        }

        // --- Render Basic Info ---
        const date = this.getAttribute('date') || '';
        const title = this.getAttribute('title') || 'Timeline Event';
        const description = this.getAttribute('description') || '';

        this.markerElement.textContent = date;
        this.titleElement.textContent = title;
        this.descriptionElement.textContent = description;

        // --- Render Key Elements ---
        const keyElementsJson = this.getAttribute('key-elements');
        this.keyElementsList.innerHTML = ''; // Clear previous
        if (keyElementsJson) {
            try {
                const keyElements = JSON.parse(keyElementsJson);
                if (Array.isArray(keyElements) && keyElements.length > 0) {
                    this.keyElementsList.innerHTML = keyElements.map(item => `<li>${item}</li>`).join('');
                    this.keyElementsList.style.display = 'block';
                } else {
                    this.keyElementsList.style.display = 'none';
                }
            } catch (e) {
                console.error('TimelineEventCard: Invalid JSON for key-elements:', keyElementsJson, e);
                this.keyElementsList.style.display = 'none';
            }
        } else {
            this.keyElementsList.style.display = 'none';
        }

        // --- Render Visuals ---
        this.visualsContainer.innerHTML = ''; // Clear previous
        const visualsJson = this.getAttribute('visuals');
        if (visualsJson) {
            try {
                const visuals = JSON.parse(visualsJson);
                if (Array.isArray(visuals)) {
                    visuals.forEach(visual => {
                        this._createVisualElement(visual);
                    });
                }
            } catch (e) {
                console.error('TimelineEventCard: Invalid JSON for visuals:', visualsJson, e);
            }
        }
    }

     _createVisualElement(visual) {
         if (!visual || !visual.type) return;

         let element;
        const visualType = visual.type.toLowerCase();

         // Map visual type to corresponding web component tag
        switch (visualType) {
            case 'stamp':
                element = document.createElement('stamp-component');
                element.setAttribute('text', visual.text || '');
                break;
            case 'sticky-note':
                element = document.createElement('sticky-note');
                 if (visual.text) element.setAttribute('text', visual.text);
                 if (visual.title) element.setAttribute('title', visual.title);
                 if (visual.items && Array.isArray(visual.items)) {
                    element.setAttribute('items', JSON.stringify(visual.items));
                 }
                 if (visual.pinColor) element.setAttribute('pin-color', visual.pinColor);
                break;
             case 'sketch': // Represented by SketchyBox for simplicity here
             case 'sketchy-box':
                 element = document.createElement('sketchy-box');
                 // Content might need specific rendering based on description
                 const content = document.createElement('div');
                 content.style.minHeight = '100px'; // Example placeholder size
                 content.style.textAlign = 'center';
                 content.style.color = 'var(--blueprint-line)';
                 if (visual.icon) { // Render icon if specified
                     const iconEl = document.createElement('icon-component');
                     iconEl.setAttribute('name', visual.icon);
                     iconEl.setAttribute('size', '2rem'); // Example size
                     content.appendChild(iconEl);
                     content.appendChild(document.createElement('br'));
                 }
                 content.appendChild(document.createTextNode(visual.text || visual.description || 'Sketchy Content'));

                 element.appendChild(content);
                break;
            case 'file-folder':
                element = document.createElement('file-folder');
                element.setAttribute('label', visual.text || '');
                 if (visual.icon) element.setAttribute('icon', visual.icon);
                 element.classList.add('animate-float'); // Add animation class
                break;
            case 'persona-card':
                element = document.createElement('persona-card');
                element.setAttribute('name', visual.name || '');
                element.setAttribute('description', visual.description || '');
                element.setAttribute('icon', visual.icon || '');
                 element.classList.add('animate-float'); // Add animation class
                break;
            case 'diagram': // Render TechDiagram
                 element = document.createElement('tech-diagram');
                 // Assuming visual.nodes and visual.connections hold the data
                 if (visual.nodes && Array.isArray(visual.nodes)) {
                     element.setAttribute('nodes', JSON.stringify(visual.nodes));
                 }
                 // Add connections if needed
                break;
             case 'speech-bubble':
                 element = document.createElement('speech-bubble');
                 element.setAttribute('text', visual.text || '');
                 if (visual.direction) element.setAttribute('direction', visual.direction);
                 break;
             case 'floorplan':
                 element = document.createElement('floor-plan');
                 if (visual.rooms && Array.isArray(visual.rooms)) {
                     element.setAttribute('rooms', JSON.stringify(visual.rooms));
                 }
                 if (visual.columns) element.setAttribute('columns', visual.columns);
                 break;
             case 'feedback-item':
                 element = document.createElement('feedback-item');
                 element.setAttribute('source', visual.source || '');
                 element.setAttribute('text', visual.text || '');
                 if (visual.icon) element.setAttribute('icon', visual.icon);
                 break;
             case 'highlight': // Renamed from HighlightItem for visual type
             case 'highlight-item':
                 element = document.createElement('highlight-item');
                 element.setAttribute('category', visual.category || '');
                 element.setAttribute('text', visual.text || '');
                 element.setAttribute('icon', visual.icon || '');
                 break;
             case 'tag':
                 element = document.createElement('tag-component');
                 element.setAttribute('text', visual.text || '');
                 break;
             case 'label': // Simple text label
             case 'text':
                 element = document.createElement('p');
                 element.textContent = visual.text || '';
                 element.style.color = 'var(--blueprint-text)'; // Basic styling
                 element.style.fontFamily = 'var(--font-handwriting)';
                 element.style.textAlign = 'center';
                 break;
             case 'icon': // Standalone icon visual
                 element = document.createElement('icon-component');
                 element.setAttribute('name', visual.name || '');
                 element.setAttribute('size', visual.size || '2rem');
                 element.setAttribute('color', visual.color || 'var(--blueprint-line)');
                 if (visual.animation) element.setAttribute('animation', visual.animation);
                 break;

            // Add cases for other visual types if needed ('effect', etc.)
             case 'effect':
                 if (visual.name === 'Confetti') {
                     // Maybe trigger a confetti function defined globally?
                     // Or just add a placeholder text.
                     element = document.createElement('div');
                     element.textContent = '[Confetti Effect]';
                     element.style.color = 'var(--blueprint-line)';
                     element.style.textAlign = 'center';
                     element.style.fontStyle = 'italic';
                 }
                 break;

            default:
                console.warn(`TimelineEventCard: Unknown visual type "${visual.type}"`);
                // element = document.createElement('div');
                // element.textContent = `[Unknown Visual: ${visual.type}]`;
        }

        if (element) {
             // Apply common visual styles if needed (e.g., animations)
             if (visual.animation === 'float' && element.classList) {
                 element.classList.add('animate-float');
             }
             if (visual.animation === 'wiggle' && element.classList) {
                 element.classList.add('animate-wiggle'); // Assuming wiggle CSS is defined
             }
             this.visualsContainer.appendChild(element);
        }
    }
}
customElements.define('timeline-event-card', TimelineEventCard);
