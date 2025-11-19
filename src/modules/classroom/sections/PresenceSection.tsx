/**
 * PresenceSection Component
 *
 * Shows who is in the room (personas: teacher, assistants, students).
 * For now displays static data from ClassroomDefinition.
 * Can be enhanced with real-time WebSocket updates later.
 */

import React from 'react';
import type { ClassroomDefinition, ClassroomSnapshot } from '../types';

interface PresenceSectionProps {
  classroom: ClassroomDefinition;
  snapshot?: ClassroomSnapshot;
}

export const PresenceSection: React.FC<PresenceSectionProps> = ({
  classroom,
  snapshot,
}) => {
  const { teacher, assistants, students } = classroom.personas;
  const studentCount =
    snapshot?.personasSummary?.studentCount ?? students.length;

  return (
    <div className="classroom-presence">
      <h3>Presence</h3>
      <div className="classroom-presence__group">
        <span className="classroom-presence__label">Teacher</span>
        {teacher ? (
          <span className="classroom-presence__pill classroom-presence__pill--role-teacher">
            {teacher.name}
          </span>
        ) : (
          <span className="classroom-presence__empty">No teacher set</span>
        )}
      </div>

      {assistants.length > 0 && (
        <div className="classroom-presence__group">
          <span className="classroom-presence__label">Assistants</span>
          <div className="classroom-presence__pill-row">
            {assistants.map((a) => (
              <span
                key={a.id}
                className="classroom-presence__pill classroom-presence__pill--role-assistant"
              >
                {a.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="classroom-presence__group">
        <span className="classroom-presence__label">Students</span>
        <span className="classroom-presence__count">
          {studentCount} enrolled
        </span>
      </div>
    </div>
  );
};
