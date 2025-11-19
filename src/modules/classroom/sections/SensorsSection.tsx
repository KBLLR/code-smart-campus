/**
 * SensorsSection Component
 *
 * Visualizes core environmental sensors with real-time WebSocket updates:
 * - Temperature, CO2, Occupancy, Noise, Light, Humidity
 *
 * Displays values from real-time stream or falls back to snapshot/classroom.sensors.
 */

import React from 'react';
import type { ClassroomDefinition, ClassroomSnapshot } from '../types';
import { useSensorStream } from '../hooks/useSensorStream';

interface SensorsSectionProps {
  classroom: ClassroomDefinition;
  snapshot?: ClassroomSnapshot;
}

export const SensorsSection: React.FC<SensorsSectionProps> = ({
  classroom,
  snapshot,
}) => {
  // Get real-time sensor updates via WebSocket
  const liveSensors = useSensorStream(classroom.classroomId);

  // Priority: Live sensors > Snapshot sensors > Classroom sensors
  const s = liveSensors ?? snapshot?.sensors ?? classroom.sensors;

  const items = [
    {
      label: 'Temperature',
      value: s.temperatureC != null ? `${s.temperatureC.toFixed(1)}°C` : (s.temperature != null ? `${s.temperature.toFixed(1)}°C` : '—'),
      status: (s.temperatureC ?? s.temperature) != null
        ? ((s.temperatureC ?? s.temperature)! < 18 ? 'cold' : (s.temperatureC ?? s.temperature)! > 24 ? 'hot' : 'good')
        : 'unknown',
    },
    {
      label: 'CO₂',
      value: s.co2ppm != null ? `${s.co2ppm.toFixed(0)} ppm` : (s.co2 != null ? `${s.co2.toFixed(0)} ppm` : '—'),
      status: (s.co2ppm ?? s.co2) != null
        ? ((s.co2ppm ?? s.co2)! > 1200 ? 'bad' : (s.co2ppm ?? s.co2)! > 800 ? 'warning' : 'good')
        : 'unknown',
    },
    {
      label: 'Occupancy',
      value: s.occupancyCount != null ? `${s.occupancyCount}` : '—',
      status: 'neutral',
    },
    {
      label: 'Noise',
      value: s.noiseDb != null ? `${s.noiseDb.toFixed(0)} dB` : (s.noise != null ? `${s.noise.toFixed(0)} dB` : '—'),
      status: (s.noiseDb ?? s.noise) != null
        ? ((s.noiseDb ?? s.noise)! > 70 ? 'bad' : (s.noiseDb ?? s.noise)! > 55 ? 'warning' : 'good')
        : 'unknown',
    },
    {
      label: 'Light',
      value: s.lightLux != null ? `${s.lightLux.toFixed(0)} lux` : (s.light != null ? `${s.light.toFixed(0)} lux` : '—'),
      status: (s.lightLux ?? s.light) != null
        ? ((s.lightLux ?? s.light)! < 200 ? 'dim' : (s.lightLux ?? s.light)! > 800 ? 'bright' : 'good')
        : 'unknown',
    },
    {
      label: 'Humidity',
      value: s.humidityPercent != null ? `${s.humidityPercent.toFixed(0)}%` : (s.humidity != null ? `${s.humidity.toFixed(0)}%` : '—'),
      status: (s.humidityPercent ?? s.humidity) != null
        ? ((s.humidityPercent ?? s.humidity)! < 30 || (s.humidityPercent ?? s.humidity)! > 60 ? 'warning' : 'good')
        : 'unknown',
    },
  ];

  const isLive = liveSensors != null;

  return (
    <div className="classroom-sensors">
      <div className="classroom-sensors__header">
        <h3>Sensors</h3>
        {isLive && (
          <span className="classroom-sensors__live-indicator" title="Real-time updates">
            ● LIVE
          </span>
        )}
      </div>

      <div className="classroom-sensors__grid">
        {items.map((item) => (
          <div
            key={item.label}
            className={`classroom-sensors__item classroom-sensors__item--${item.status}`}
          >
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
