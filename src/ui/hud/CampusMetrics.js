/**
 * CampusMetrics - Real-Time Campus Statistics (Space.js Style)
 * Displays occupancy, temperature, CO2, and active rooms
 */

import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';

export class CampusMetrics extends Interface {
  constructor(classroomRegistry) {
    super('.campus-metrics');

    this.classroomRegistry = classroomRegistry;
    this.animatedIn = false;

    this.init();
    this.initViews();
  }

  init() {
    this.css({
      position: 'absolute',
      right: 20,
      bottom: 20,
      zIndex: 1000,
      pointerEvents: 'auto',
      webkitUserSelect: 'none',
      userSelect: 'none'
    });

    // CRITICAL: Add the metrics to the DOM!
    document.body.appendChild(this.element);
  }

  initViews() {
    // Container for all metrics
    this.container = new Interface('.container');
    this.container.css({
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    });
    this.add(this.container);

    // Create metric rows
    this.metrics = {
      occupancy: this.createMetric('OCCUPANCY', '15/30'),
      temperature: this.createMetric('TEMPERATURE', '22.5°C'),
      co2: this.createMetric('CO₂', '650ppm'),
      active: this.createMetric('ACTIVE', '1/1 rooms')
    };

    Object.values(this.metrics).forEach(metric => {
      this.container.add(metric);
    });

    // Initial update
    this.update();

    // Update every 5 seconds
    this.updateInterval = setInterval(() => this.update(), 5000);

    // Animate in (after initialization completes)
    setTimeout(() => this.animateIn(), 0);
  }

  createMetric(label, initialValue) {
    const row = new Interface('.metric-row');
    row.css({
      display: 'flex',
      justifyContent: 'space-between',
      gap: 20,
      fontFamily: 'var(--ui-font-family)',
      fontSize: '11px',
      letterSpacing: 1,
      color: 'var(--ui-color)'
    });

    const labelEl = new Interface('.label');
    labelEl.css({
      textTransform: 'uppercase',
      color: 'var(--ui-color)',
      opacity: 0.5
    });
    labelEl.text(label);
    row.add(labelEl);

    const valueEl = new Interface('.value');
    valueEl.css({
      textAlign: 'right',
      color: 'var(--ui-color)',
      opacity: 0.7,
      minWidth: 80
    });
    valueEl.text(initialValue);
    row.add(valueEl);

    // Store reference for updates
    row.valueEl = valueEl;

    return row;
  }

  update() {
    const data = this.getAggregateData();

    // Update occupancy
    if (data.totalOccupancy === null) {
      this.metrics.occupancy.valueEl.text('—');
    } else if (data.totalCapacity > 0) {
      this.metrics.occupancy.valueEl.text(`${data.totalOccupancy}/${data.totalCapacity}`);
    } else {
      this.metrics.occupancy.valueEl.text(`${data.totalOccupancy}`);
    }

    // Update temperature
    if (data.avgTemperature === null) {
      this.metrics.temperature.valueEl.text('—');
    } else {
      this.metrics.temperature.valueEl.text(`${data.avgTemperature.toFixed(1)}°C`);
    }

    // Update CO2
    if (data.avgCO2 === null) {
      this.metrics.co2.valueEl.text('—');
    } else {
      this.metrics.co2.valueEl.text(`${data.avgCO2}ppm`);
    }

    // Update active rooms
    const total = this.classroomRegistry.count;
    if (total === 0) {
      this.metrics.active.valueEl.text('—');
    } else {
      this.metrics.active.valueEl.text(`${data.activeRooms}/${total} rooms`);
    }
  }

  getAggregateData() {
    const classrooms = this.classroomRegistry.getAll();

    let totalOccupancy = 0;
    let totalCapacity = 0;
    let tempSum = 0;
    let tempCount = 0;
    let co2Sum = 0;
    let co2Count = 0;
    let activeRooms = 0;

    classrooms.forEach(classroom => {
      // Occupancy
      const occupancySensor = classroom.getSensor('occupancy');
      if (occupancySensor) {
        if (typeof occupancySensor.current_value === 'number') {
          totalOccupancy += occupancySensor.current_value;
        }
      }
      if (typeof classroom.metadata.capacity === 'number') {
        totalCapacity += classroom.metadata.capacity;
      }

      // Temperature
      const tempSensor = classroom.getSensor('temperature');
      if (tempSensor && typeof tempSensor.current_value === 'number') {
        tempSum += tempSensor.current_value;
        tempCount++;
      }

      // CO2
      const co2Sensor = classroom.getSensor('co2');
      if (co2Sensor && typeof co2Sensor.current_value === 'number') {
        co2Sum += co2Sensor.current_value;
        co2Count++;
      }

      // Active rooms
      if (classroom.state.occupied) {
        activeRooms++;
      }
    });

    return {
      totalOccupancy: tempCount === 0 && co2Count === 0 && totalOccupancy === 0 && totalCapacity === 0 ? null : totalOccupancy,
      totalCapacity,
      avgTemperature: tempCount > 0 ? tempSum / tempCount : null,
      avgCO2: co2Count > 0 ? Math.round(co2Sum / co2Count) : null,
      activeRooms
    };
  }

  animateIn() {
    const duration = 1000;
    const stagger = 100;

    this.container.children.forEach((child, i) => {
      child.css({ x: 10, opacity: 0 });
      child.clearTween().tween({ x: 0, opacity: 1 }, duration, 'easeOutQuart', i * stagger);
    });

    this.animatedIn = true;
  }

  animateOut() {
    this.container.children.forEach(child => {
      child.clearTween().tween({ opacity: 0 }, 500, 'easeInCubic');
    });
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    super.destroy();
  }
}
