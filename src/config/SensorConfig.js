/**
 * SensorConfig.js
 * Central configuration for sensor types, formatting, and display styles.
 */

export const SensorConfig = {
    // Sensor Domains/Types mapping to display properties
    types: {
        temperature: {
            label: 'Temperature',
            unit: '°C',
            icon: 'thermostat', // Material Symbol
            format: (val) => typeof val === 'number' ? val.toFixed(1) : val,
            color: (val) => {
                if (val < 18) return '#60a5fa'; // Blue
                if (val > 28) return '#f87171'; // Red
                return '#34d399'; // Green
            }
        },
        humidity: {
            label: 'Humidity',
            unit: '%',
            icon: 'water_drop',
            format: (val) => typeof val === 'number' ? Math.round(val) : val,
            color: (val) => {
                if (val < 30 || val > 70) return '#facc15';
                return '#34d399';
            }
        },
        co2: {
            label: 'CO₂',
            unit: 'ppm',
            icon: 'co2', // Specific icon
            format: (val) => Math.round(val),
            color: (val) => {
                if (val > 1000) return '#f87171';
                if (val > 800) return '#facc15';
                return '#34d399';
            }
        },
        pm25: {
            label: 'PM2.5',
            unit: 'µg/m³',
            icon: 'grain', // Better match
            format: (val) => val?.toFixed(1),
            color: (val) => {
                if (val > 25) return '#f87171';
                if (val > 15) return '#facc15';
                return '#34d399';
            }
        },
        occupancy: {
            label: 'Occupancy',
            unit: '',
            icon: 'person',
            format: (val) => {
                if (val === 'on' || val === true || val === 'occupied') return 'Occupied';
                if (val === 'off' || val === false || val === 'clear') return 'Vacant';
                return val;
            },
            color: (val) => (val === 'on' || val === true || val === 'occupied') ? '#f87171' : '#34d399'
        },
        illuminance: {
            label: 'Light',
            unit: 'lx',
            icon: 'light_mode',
            format: (val) => Math.round(val),
            color: () => '#fbbf24'
        },
        noise: {
            label: 'Noise',
            unit: 'dB',
            icon: 'volume_up',
            format: (val) => Math.round(val),
            color: (val) => val > 70 ? '#f87171' : '#34d399'
        },
        power: {
            label: 'Power',
            unit: 'W',
            icon: 'bolt',
            format: (val) => Math.round(val),
            color: () => '#a78bfa'
        },
        battery: {
            label: 'Battery',
            unit: '%',
            icon: 'battery_full', // Generic full, logic could adjust this
            format: (val) => Math.round(val),
            color: (val) => {
                if (val < 20) return '#f87171';
                if (val < 50) return '#fbbf24';
                return '#34d399';
            }
        },
        equipment: {
            label: 'Equipment',
            unit: '',
            icon: 'precision_manufacturing', // More specific
            format: (val) => {
                if (typeof val === 'boolean') return val ? 'Active' : 'Idle';
                if (val === 'on') return 'Active';
                if (val === 'off') return 'Idle';
                return val;
            },
            color: () => '#38bdf8'
        },
        voc: {
            label: 'VOC Index',
            unit: '',
            icon: 'air',
            format: (val) => Math.round(val),
            color: (val) => val > 200 ? '#f87171' : '#34d399'
        },
        celestial: {
            label: 'Celestial',
            unit: '',
            icon: 'bedtime',
            format: (val) => {
                if (val === 'above_horizon') return 'Day';
                if (val === 'below_horizon') return 'Night';
                if (typeof val === 'string' && val.includes('_')) return val.replace(/_/g, ' ');
                // Timestamp parser
                if (typeof val === 'string' && val.startsWith('202')) {
                    try {
                        const date = new Date(val);
                        const hours = date.getHours().toString().padStart(2, '0');
                        const minutes = date.getMinutes().toString().padStart(2, '0');
                        return `${hours}:${minutes}`;
                    } catch (e) { return val; }
                }
                return val;
            },
            color: (val) => (val === 'above_horizon' || val === 'Day') ? '#fbbf24' : '#94a3b8'
        },
        activity: {
            label: 'Activity',
            unit: '',
            icon: 'pulse', // or 'sensors'
            format: (val) => val,
            color: () => '#a78bfa'
        }
    },

    // Helper to get config for a sensor key
    get(key) {
        // Try exact match first
        if (this.types[key]) return this.types[key];

        // Try partial match (e.g. "sensor.temperature_1" -> "temperature")
        const match = Object.keys(this.types).find(type => key.includes(type));
        return match ? this.types[match] : this.getDefault();
    },

    // Default config for unknown sensors
    getDefault() {
        return {
            label: 'Sensor',
            unit: '',
            icon: 'sensors', // Valid Material Symbol
            format: (val) => val,
            color: () => '#94a3b8' // Slate (Neutral)
        };
    },

    // Room ID to Sensor Entity IDs mapping
    // Derived from comprehensive audit
    mappings: {
        // --- A Rooms ---
        'a1': [
            'binary_sensor.a1_occupancy',
            'sensor.a1_occupancy_last_illumination_state_2'
        ],
        'a2': [
            'binary_sensor.presence_sensor', // Friendly Name: A2 Occupancy
            'sensor.sonoff_snzb_02d_temp_humidity_temperature', // Friendly Name: A2 Temperature
            'sensor.sonoff_snzb_02d_temp_humidity_humidity',    // Friendly Name: A2 Humidity
            'sensor.sonoff_snzb_02d_temp_humidity_battery'
        ],
        'a3': [
            'sensor.ikea_of_sweden_vindstyrka_temperature_2', // Friendly Name: A3 temperature
            'sensor.ikea_of_sweden_vindstyrka_humidity_2',
            'sensor.ikea_of_sweden_vindstyrka_pm2_5_2',
            'sensor.ikea_of_sweden_vindstyrka_voc_index_2'
        ],
        'a6': [
            'binary_sensor.a6_occupancy_occupancy_4',
            'sensor.a6_occupancy_last_illumination_state_4',
            'sensor.sonoff_snzb_02d_temperature_2', // Friendly Name: A6 Temperature
            'sensor.sonoff_snzb_02d_humidity_2',
            'sensor.sonoff_snzb_02d_battery_2'
        ],
        'a11': [
            'binary_sensor.a11_occupancy',
            'sensor.a11_occupancy_last_illumination_state_2'
        ],
        'a12': [
            'binary_sensor.a12_occupancy',
            'sensor.a12_occupancy_last_illumination_state_2',
            'sensor.sonoff_snzb_02d_temperature_4', // Friendly Name: A12 temperature
            'sensor.a12_climate' // Friendly Name: A12 humidity
        ],

        // --- B Rooms ---
        'b3': [
            'binary_sensor.b3_occupancy_occupancy',
            'sensor.b3_occupancy_last_illumination_state',
            'sensor.ikea_aq_sensor_temperature', // Friendly Name: B3 Temperature
            'sensor.ikea_aq_sensor_humidity',
            'sensor.ikea_aq_sensor_pm2_5',
            'sensor.ikea_aq_sensor_voc_index',
            'sensor.sonoff_snzb_02d_temp_humidity_battery' // B.3 Sensor Battery
        ],
        'b4': [
            'binary_sensor.b4_occupancy_occupancy',
            'sensor.b4_occupancy_last_illumination_state',
            'sensor.sonoff_snzb_02d_humid_temp_temperature', // Friendly Name: B4 Temperature
            'sensor.sonoff_snzb_02d_humid_temp_humidity',
            'sensor.sonoff_snzb_02d_humid_temp_battery'
        ],
        'b5': [
            'binary_sensor.b5_occupancy',
            'sensor.sonoff_snzb_06p_last_illumination_state', // B5 Last Illumination
            'sensor.sonoff_snzb_02d_temp_humid_temperature', // Friendly Name: B5 Temperature
            'sensor.sonoff_snzb_02d_temp_humid_humidity',
            'sensor.sonoff_snzb_02d_temp_humid_battery'
        ],
        'b6': [
            'binary_sensor.b6_occupancy_occupancy_2',
            'sensor.b6_occupancy_last_illumination_state_2',
            'sensor.sonoff_snzb_02d_temperature', // Friendly Name: B.6 Temperature
            'sensor.sonoff_snzb_02d_humidity',
            'sensor.sonoff_snzb_02d_battery'
        ],
        'b7': [
            'binary_sensor.b7_occupancy_occupancy_2',
            'sensor.b7_occupancy_last_illumination_state_2',
            'sensor.sonoff_snzb_02d_humid_temp_temperature_2', // Friendly Name: B7 Temperature
            'sensor.sonoff_snzb_02d_humid_temp_humidity_2',
            'sensor.sonoff_snzb_02d_humid_temp_battery_2'
        ],
        'b12': [
            'binary_sensor.b12_occupancy_occupancy_3',
            'sensor.b12_occupancy_last_illumination_state_3',
            'sensor.sonoff_snzb_02d_humid_temp_temperature_3', // Friendly Name: B12 Temperature
            'sensor.sonoff_snzb_02d_humid_temp_humidity_3',
            'sensor.sonoff_snzb_02d_humid_temp_battery_3'
        ],
        'b14': [
            'binary_sensor.b14_occupancy',
            'sensor.b14_occupancy_last_illumination_state_2'
        ],

        // --- Common Areas ---
        'makerspace': [
            'binary_sensor.makerspace_occupancy_occupancy',
            'sensor.makerspace_occupancy_last_illumination_state',
            'sensor.aq_sensor_temperature', // Friendly Name: MakerSpace Temperature
            'sensor.aq_sensor_humidity',
            'sensor.aq_sensor_pm2_5',
            'sensor.aq_sensor_voc_index',
            // 3D Printer (Makerspace equipment)
            'sensor.3d_printer_power_socket_power',
            'sensor.octoprint_job_percentage',
            'sensor.octoprint_actual_tool0_temp',
            'sensor.octoprint_actual_bed_temp',
            'binary_sensor.octoprint_printing'
        ],
        'laba': [
            // Lab sensors (Smaller black slab)
            'sensor.smaller_black_slab_battery_level',
            'sensor.smaller_black_slab_battery_state'
        ],
        'cafeteria': [
            // Kitchen loop
            'sensor.sonoff_snzb_02d_temperature_3', // Kitchen Temperature
            'sensor.sonoff_snzb_02d_humidity_3',
            'sensor.sonoff_snzb_02d_battery_3'
        ],
        'teamhq': [
            // Possibly mapped to a specific room or just 'teamhq' if it exists in registry
            'sensor.ikea_of_sweden_vindstyrka_temperature', // Friendly Name: Team HQ
            'sensor.ikea_of_sweden_vindstyrka_humidity',
            'sensor.ikea_of_sweden_vindstyrka_pm2_5',
            'sensor.sonoff_snzb_02d_battery_4' // Team HQ Sensor Battery
        ]
    }
};
