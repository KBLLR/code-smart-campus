/**
 * HistorySection Component
 *
 * Displays classroom events (from append_classroom_event calls).
 * Shows recent activity: lessons, discussions, sensor alerts, etc.
 * Sorted by timestamp (most recent first).
 */

import React from 'react';
import type { ClassroomDefinition, ClassroomEvent } from '../types';

interface HistorySectionProps {
  classroom: ClassroomDefinition;
  events: ClassroomEvent[];
}

export const HistorySection: React.FC<HistorySectionProps> = ({
  classroom,
  events,
}) => {
  const sorted = [...events].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <div className="classroom-history">
      <h3>History</h3>
      {sorted.length === 0 ? (
        <p className="classroom-history__empty">
          No events recorded yet for this classroom.
        </p>
      ) : (
        <ul className="classroom-history__list">
          {sorted.slice(0, 10).map((e) => (
            <li key={e.id} className="classroom-history__item">
              <div className="classroom-history__row">
                <span className="classroom-history__type">{e.type}</span>
                <span className="classroom-history__time">
                  {new Date(e.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="classroom-history__summary">{e.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
