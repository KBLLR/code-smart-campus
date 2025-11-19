/**
 * SensorsSection Component
 *
 * Visualizes core environmental sensors:
 * - Temperature, CO2, Occupancy, Noise, Light, Humidity
 *
 * Displays values from snapshot (if available) or falls back to classroom.sensors.
 */

import React from 'react';
import type { ClassroomDefinition, ClassroomSnapshot } from '../types';

interface SensorsSectionProps {
  classroom: ClassroomDefinition;
  snapshot?: ClassroomSnapshot;
}

export const SensorsSection: React.FC<SensorsSectionProps> = ({
  classroom,
  snapshot,
}) => {
  const s = snapshot?.sensors ?? classroom.sensors;

  const items = [
    {
      label: 'Temperature',
      value: s.temperatureC != null ? `${s.temperatureC.toFixed(1)}°C` : '—',
    },
    {
      label: 'CO₂',
      value: s.co2ppm != null ? `${s.co2ppm} ppm` : '—',
    },
    {
      label: 'Occupancy',
      value: s.occupancyCount != null ? `${s.occupancyCount}` : '—',
    },
    {
      label: 'Noise',
      value: s.noiseDb != null ? `${s.noiseDb} dB` : '—',
    },
    {
      label: 'Light',
      value: s.lightLux != null ? `${s.lightLux} lux` : '—',
    },
    {
      label: 'Humidity',
      value:
        s.humidityPercent != null ? `${s.humidityPercent.toFixed(0)}%` : '—',
    },
  ];

  return (
    <div className="classroom-sensors">
      <h3>Sensors</h3>
      <div className="classroom-sensors__grid">
        {items.map((item) => (
          <div key={item.label} className="classroom-sensors__item">
            <span className="classroom-sensors__label">{item.label}</span>
            <span className="classroom-sensors__value">{item.value}</span>
          </div>
        ))}
      </div>
      {s.lastUpdated && (
        <div className="classroom-sensors__updated">
          Updated {new Date(s.lastUpdated).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};
