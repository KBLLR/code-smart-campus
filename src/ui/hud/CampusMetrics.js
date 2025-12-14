import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';
import { MetricRow } from '../components/MetricRow.js';

export class CampusMetrics extends Interface {
    constructor() {
        super('.campus-metrics');

        this.init();
        this.initViews();
    }

    init() {
        this.css({
            position: 'absolute',
            right: '40px',
            bottom: '40px',
            zIndex: 90,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            width: '240px',
            background: 'rgba(0, 0, 0, 0.2)', // Slight backdrop
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
        });

        document.body.appendChild(this.element);
    }

    initViews() {
        this.header = new Interface('.metrics-header');
        this.header.css({
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
            marginBottom: '5px',
            letterSpacing: '1px'
        });
        this.header.text('GLOBAL TELEMETRY');
        this.add(this.header);

        // Pre-create metric slots
        this.metrics = {
            occupancy: new MetricRow({ label: 'Occupancy', value: '--', unit: 'PPL' }),
            temp: new MetricRow({ label: 'Avg Temp', value: '--', unit: '°C' }),
            co2: new MetricRow({ label: 'Air Quality', value: '--', unit: 'PPM' }),
            active: new MetricRow({ label: 'Active Zones', value: '--', unit: '' })
        };

        Object.values(this.metrics).forEach(m => this.add(m));
    }

    setGlobalMetrics({ occupancy, temp, co2, activeRooms }) {
        this.header.text('GLOBAL TELEMETRY');
        this.css({ borderColor: 'rgba(255, 255, 255, 0.05)' });

        this.metrics.occupancy.update(occupancy ?? '--');
        this.metrics.temp.update(temp ?? '--');
        this.metrics.co2.update(co2 ?? '--');
        this.metrics.active.update(activeRooms ?? '--');
        
        // Show all
        Object.values(this.metrics).forEach(m => m.css({ display: 'flex' }));
    }

    setRoomMetrics({ temp, co2, occupancy, power }) {
        this.header.text('LOCAL SENSORS');
        this.css({ borderColor: 'var(--ui-color)' });

        // Update with available room data
        this.metrics.temp.update(temp ?? '--');
        this.metrics.co2.update(co2 ?? '--');
        this.metrics.occupancy.update(occupancy ?? '--');
        
        // Re-purpose "active" slot for power if provided, or hide it
        if (power) {
            this.metrics.active.label.text('Power');
            this.metrics.active.update(power);
            this.metrics.active.unit.text('W');
            this.metrics.active.css({ display: 'flex' });
        } else {
            this.metrics.active.css({ display: 'none' });
        }
    }

    clearRoomMetrics() {
        // Revert to global state or empty state? 
        // Usually the system will call setGlobalMetrics immediately after.
        // But we can reset visual cues here.
        this.header.text('WAITING FOR DATA...');
        this.css({ borderColor: 'rgba(255, 255, 255, 0.05)' });
    }

    update(dt) {
        // Optional animation
    }
}
