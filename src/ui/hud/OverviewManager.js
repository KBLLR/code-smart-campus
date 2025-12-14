
import { SensorConfig } from '../../config/SensorConfig.js';

export class OverviewManager {
    constructor(sensorManager) {
        this.sensorManager = sensorManager;
    }

    /**
     * Generate a list of widgets sorted by relevance.
     */
    generateWidgets() {
        const sensors = this.sensorManager.getDiscoveredSensors();
        const widgets = [];

        // Generate individual topic widgets
        widgets.push(this.getOccupancyWidget(sensors));
        widgets.push(this.getAirQualityWidget(sensors));
        widgets.push(this.getThermalWidget(sensors));
        widgets.push(this.getCelestialWidget(sensors));
        widgets.push(this.getHealthWidget(sensors));

        // Filter out nulls (if any data is completely missing)
        return widgets.filter(w => w !== null).sort((a, b) => b.relevance - a.relevance);
    }

    getOccupancyWidget(sensors) {
        // Filter occupancy sensors
        const occupancySensors = sensors.filter(s => {
            const type = this.sensorManager._detectSensorType(s);
            return type === 'occupancy';
        });

        // Calculate metrics
        let occupiedCount = 0;
        let totalCount = occupancySensors.length;

        occupancySensors.forEach(s => {
            const val = s.state;
            if (val === 'on' || val === true || val === 'occupied' || val > 0) occupiedCount++;
        });

        // Relevance Logic
        // High if > 50% occupied
        const percentage = totalCount > 0 ? (occupiedCount / totalCount) : 0;
        let relevance = 30; // Base relevance
        if (percentage > 0.1) relevance = 50;
        if (percentage > 0.5) relevance = 90;

        // Size Logic
        let size = '1x1';
        if (relevance >= 90) size = '2x2';
        else if (relevance >= 50) size = '2x1';

        return {
            id: 'occupancy_overview',
            type: 'occupancy',
            title: 'Campus Occupancy',
            size: size,
            relevance: relevance,
            data: {
                occupied: occupiedCount,
                total: totalCount,
                percentage: Math.round(percentage * 100)
            }
        };
    }

    getAirQualityWidget(sensors) {
        // Check CO2 and VOC
        const co2Sensors = sensors.filter(s => this.sensorManager._detectSensorType(s) === 'co2');
        let maxCO2 = 0;
        let avgCO2 = 0;

        if (co2Sensors.length > 0) {
            const values = co2Sensors.map(s => parseFloat(s.state)).filter(v => !isNaN(v));
            if (values.length > 0) {
                maxCO2 = Math.max(...values);
                avgCO2 = values.reduce((a, b) => a + b, 0) / values.length;
            }
        }

        // Relevance
        // CO2 > 1000 is bad
        let relevance = 20;
        if (maxCO2 > 800) relevance = 60;
        if (maxCO2 > 1200) relevance = 95;

        let size = '1x1';
        if (relevance >= 90) size = '2x1'; // Alert mode

        return {
            id: 'air_quality_overview',
            type: 'air_quality',
            title: 'Air Quality',
            size: size,
            relevance: relevance,
            data: {
                maxCO2: Math.round(maxCO2),
                avgCO2: Math.round(avgCO2),
                status: maxCO2 > 1000 ? 'Poor' : (maxCO2 > 800 ? 'Fair' : 'Good')
            }
        };
    }

    getThermalWidget(sensors) {
        const tempSensors = sensors.filter(s => this.sensorManager._detectSensorType(s) === 'temperature');
        let avgTemp = 0;
        let minTemp = 999;
        let maxTemp = -999;

        if (tempSensors.length > 0) {
            const values = tempSensors.map(s => parseFloat(s.state)).filter(v => !isNaN(v));
            if (values.length > 0) {
                avgTemp = values.reduce((a, b) => a + b, 0) / values.length;
                minTemp = Math.min(...values);
                maxTemp = Math.max(...values);
            } else {
                return null;
            }
        } else {
            return null;
        }

        // Relevance: Deviation from 21C
        const deviation = Math.abs(avgTemp - 21);
        let relevance = 25;
        if (deviation > 3) relevance = 60; // Too hot/cold
        if (deviation > 5) relevance = 85;

        // Size
        let size = '1x1';
        if (relevance > 70) size = '2x1';

        return {
            id: 'thermal_overview',
            type: 'thermal',
            title: 'Thermal Comfort',
            size: size,
            relevance: relevance,
            data: {
                avgTemp: avgTemp.toFixed(1),
                range: `${minTemp.toFixed(1)} - ${maxTemp.toFixed(1)}`
            }
        };
    }

    getCelestialWidget(sensors) {
        // Find celestial sensor
        const celestial = sensors.find(s => this.sensorManager._detectSensorType(s) === 'celestial');

        // Mock data if missing, but usually present
        let state = celestial ? celestial.state : 'Unknown';
        let formatted = SensorConfig.get('celestial').format(state);

        // Relevance: Increases near sunrise/sunset
        // Since we don't have easy "minutes until" without parsing, we'll keep base relevance
        let relevance = 40;

        // If "next_dawn" etc, it's just a time.
        // Let's assume medium relevance always as it's a nice clock.

        return {
            id: 'celestial_overview',
            type: 'celestial',
            title: 'Daylight',
            size: '2x1', // Always wide looks good for horizon
            relevance: relevance,
            data: {
                state: state,
                display: formatted
            }
        };
    }

    getHealthWidget(sensors) {
        const batterySensors = sensors.filter(s => this.sensorManager._detectSensorType(s) === 'battery');

        let lowBatCount = 0;
        batterySensors.forEach(s => {
            const val = parseFloat(s.state);
            if (!isNaN(val) && val < 20) lowBatCount++;
        });

        let relevance = 10;
        if (lowBatCount > 0) relevance = 80; // Action needed!
        if (lowBatCount > 5) relevance = 95;

        let size = '1x1';
        if (relevance > 70) size = '1x2'; // Tall list for batteries

        return {
            id: 'system_health',
            type: 'health',
            title: 'System Health',
            size: size,
            relevance: relevance,
            data: {
                lowBatteryCount: lowBatCount,
                totalDevices: batterySensors.length
            }
        };
    }
}
