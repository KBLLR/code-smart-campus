import { Graph } from '../ui/space/Graph.js';
import { RadialGraph } from '../ui/space/RadialGraph.js';

export class GraphManager {
    constructor() {
        this.graphs = new Map(); // id -> graph instance
    }

    /**
     * Create a graph for a specific sensor
     * @param {string} id - Unique ID for the graph
     * @param {string} type - 'line' or 'radial' (or sensor type for auto-config)
     * @param {object} config - Configuration options
     * @returns {Graph|RadialGraph}
     */
    createGraph(id, type, config = {}) {
        let graph;
        let graphType = type;
        let graphConfig = { ...config };

        // Smart defaults based on sensor type
        if (!['line', 'radial'].includes(type)) {
            const defaults = this.getSensorDefaults(type);
            graphType = defaults.type;
            graphConfig = { ...defaults.config, ...config };
        }

        if (graphType === 'radial') {
            graph = new RadialGraph(graphConfig);
        } else {
            graph = new Graph(graphConfig);
        }

        // Initialize with default value if provided
        if (graphConfig.value !== undefined) {
            if (graph instanceof Graph && Array.isArray(graphConfig.value)) {
                graph.setArray(graphConfig.value);
            } else if (graph instanceof RadialGraph && Array.isArray(graphConfig.value)) {
                graph.setArray(graphConfig.value);
            }
        }

        this.graphs.set(id, graph);
        return graph;
    }

    getSensorDefaults(sensorType) {
        const type = sensorType.toLowerCase();

        if (type.includes('temperature')) {
            return {
                type: 'radial',
                config: {
                    range: 40,
                    suffix: '°C',
                    precision: 1,
                    width: 120,
                    height: 120,
                    start: -135, // Gauge style
                    graphHeight: 20
                }
            };
        } else if (type.includes('humidity')) {
            return {
                type: 'radial',
                config: {
                    range: 100,
                    suffix: '%',
                    precision: 0,
                    width: 120,
                    height: 120,
                    start: -135,
                    graphHeight: 20
                }
            };
        } else if (type.includes('co2') || type.includes('quality') || type.includes('aqi') || type.includes('volatile')) {
            return {
                type: 'radial', // or line
                config: {
                    range: 500, // AQI usually 0-500, CO2 400-2000. Might need dynamic range.
                    suffix: '', // Unit varies
                    precision: 0,
                    width: 120,
                    height: 120,
                    start: -135,
                    graphHeight: 20
                }
            };
        } else if (type.includes('occupancy') || type.includes('motion')) {
            return {
                type: 'line',
                config: {
                    range: 1,
                    suffix: '',
                    precision: 0,
                    width: 280,
                    height: 60,
                    noGradient: true
                }
            };
        } else if (type.includes('history') || type.includes('power') || type.includes('energy') || type.includes('voltage')) {
            return {
                type: 'line',
                config: {
                    range: 250, // Voltage usually 110-240
                    width: 280,
                    height: 80,
                    suffix: type.includes('voltage') ? ' V' : ' W'
                }
            };
        }

        // Default
        return {
            type: 'radial',
            config: {
                range: 100,
                width: 120,
                height: 120
            }
        };
    }

    /**
     * Update a specific graph with a new value
     * @param {string} id - Graph ID
     * @param {number} value - New value
     */
    updateGraph(id, value) {
        const graph = this.graphs.get(id);
        if (graph) {
            graph.update(value);
        }
    }

    /**
     * Clear all graphs
     */
    clear() {
        this.graphs.forEach(graph => graph.destroy());
        this.graphs.clear();
    }

    /**
     * Get a graph instance
     */
    get(id) {
        return this.graphs.get(id);
    }
}
