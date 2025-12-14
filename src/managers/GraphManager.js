import { GraphWidget } from '../ui/components/GraphWidget.js';

export class GraphManager {
    constructor() {
        this.graphs = new Map();
    }

    createGraph(id, type = 'line', options = {}) {
        if (this.graphs.has(id)) {
            console.warn(`[GraphManager] Graph ${id} already exists, replacing.`);
            this.removeGraph(id);
        }

        const graph = new GraphWidget({ type, ...options });
        this.graphs.set(id, graph);
        return graph;
    }

    updateGraph(id, value) {
        const graph = this.graphs.get(id);
        if (graph) {
            graph.update(value);
        }
    }

    removeGraph(id) {
        const graph = this.graphs.get(id);
        if (graph) {
            graph.destroy(); // Assumes Interface has destroy
            this.graphs.delete(id);
        }
    }

    clear() {
        this.graphs.forEach(g => g.destroy());
        this.graphs.clear();
    }

    update(dt) {
        // Prepare for any animation updates
    }
}
