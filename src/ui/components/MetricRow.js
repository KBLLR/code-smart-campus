import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';

export class MetricRow extends Interface {
    constructor({ label, value, unit = '', color = 'var(--ui-color)' } = {}) {
        super('.metric-row');

        this.css({
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            padding: '5px 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            fontFamily: 'var(--ui-font-family)',
            fontSize: '12px'
        });

        this.label = new Interface('.label');
        this.label.text(label);
        this.label.css({
            color: 'var(--ui-secondary-color)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
        });
        this.add(this.label);

        this.valueContainer = new Interface('.value-container');
        this.valueContainer.css({
            display: 'flex',
            gap: '4px',
            alignItems: 'baseline'
        });
        this.add(this.valueContainer);

        this.value = new Interface('.value');
        this.value.text(value);
        this.value.css({
            color: color,
            fontWeight: 'bold'
        });
        this.valueContainer.add(this.value);

        if (unit) {
            this.unit = new Interface('.unit');
            this.unit.text(unit);
            this.unit.css({
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '10px'
            });
            this.valueContainer.add(this.unit);
        }
    }

    update(value, color = null) {
        this.value.text(value);
        if (color) this.value.css({ color });
    }
}
