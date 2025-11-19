/**
 * CalendarSection Component
 *
 * Stub for calendar integration.
 * Will show class times, reservations, exams, etc.
 * Hook to external calendar backend later.
 */

import React from 'react';
import type { ClassroomDefinition } from '../types';

interface CalendarSectionProps {
  classroom: ClassroomDefinition;
}

export const CalendarSection: React.FC<CalendarSectionProps> = ({
  classroom,
}) => {
  return (
    <div className="classroom-calendar">
      <h3>Schedule</h3>
      <p className="classroom-calendar__hint">
        Calendar integration for <strong>{classroom.id}</strong> goes here
        (class times, reservations, exams, etc).
      </p>
    </div>
  );
};
