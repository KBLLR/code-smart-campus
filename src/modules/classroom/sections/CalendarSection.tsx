/**
 * CalendarSection Component
 *
 * Displays upcoming classroom events/schedule from the calendar API.
 */

import React, { useEffect, useState } from 'react';
import type { ClassroomDefinition } from '../types';

interface CalendarSectionProps {
  classroom: ClassroomDefinition;
}

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: string;
  location: string;
  instructor?: string;
  description?: string;
  safetyLevel?: string;
}

export const CalendarSection: React.FC<CalendarSectionProps> = ({ classroom }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCalendar() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/classrooms/${classroom.id}/calendar`);
        if (!response.ok) {
          throw new Error(`Failed to load calendar: ${response.statusText}`);
        }

        const data = await response.json();

        if (!cancelled) {
          setEvents(data);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    }

    fetchCalendar();

    return () => {
      cancelled = true;
    };
  }, [classroom.id]);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const groupEventsByDate = (events: CalendarEvent[]) => {
    const grouped: Record<string, CalendarEvent[]> = {};

    events.forEach(event => {
      const dateKey = formatDate(event.startTime);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    return grouped;
  };

  if (isLoading) {
    return (
      <div className="classroom-calendar">
        <h2>Schedule</h2>
        <div className="classroom-calendar__loading">Loading schedule...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="classroom-calendar">
        <h2>Schedule</h2>
        <div className="classroom-calendar__error">Error: {error}</div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="classroom-calendar">
        <h2>Schedule</h2>
        <div className="classroom-calendar__empty">No upcoming events</div>
      </div>
    );
  }

  const groupedEvents = groupEventsByDate(events);

  return (
    <div className="classroom-calendar">
      <h2>Schedule</h2>

      {Object.entries(groupedEvents).map(([date, dayEvents]) => (
        <div key={date} className="classroom-calendar__day">
          <h3 className="classroom-calendar__date">{date}</h3>

          {dayEvents.map(event => (
            <div key={event.id} className={`classroom-calendar__event classroom-calendar__event--${event.type}`}>
              <div className="classroom-calendar__event-header">
                <span className="classroom-calendar__event-time">
                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                </span>
                <span className={`classroom-calendar__event-type classroom-calendar__event-type--${event.type}`}>
                  {event.type}
                </span>
              </div>

              <div className="classroom-calendar__event-title">{event.title}</div>

              {event.instructor && (
                <div className="classroom-calendar__event-instructor">
                  {event.instructor}
                </div>
              )}

              {event.description && (
                <div className="classroom-calendar__event-description">
                  {event.description}
                </div>
              )}

              {event.safetyLevel && (
                <div className={`classroom-calendar__safety-badge classroom-calendar__safety-badge--${event.safetyLevel}`}>
                  Safety: {event.safetyLevel}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
