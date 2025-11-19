/**
 * ChatSection Component
 *
 * Chat UI + 3D shader ball placeholder.
 * The shader ball can later be wired to your Three.js stage.
 */

import React from 'react';
import type { ClassroomDefinition, ClassroomSnapshot } from '../types';

interface ChatSectionProps {
  classroom: ClassroomDefinition;
  snapshot?: ClassroomSnapshot;
}

export const ChatSection: React.FC<ChatSectionProps> = ({
  classroom,
  snapshot,
}) => {
  const teacherName = classroom.personas.teacher?.name ?? 'Teacher';
  const activity = snapshot?.inferredActivity ?? 'idle';

  return (
    <div className="classroom-chat">
      <div className="classroom-chat__header">
        <div>
          <h2>Room Chat</h2>
          <p>
            {teacherName} · {activity}
          </p>
        </div>
        {/* Placeholder for shader ball */}
        <div className="classroom-chat__shader-ball">
          <div className="classroom-chat__shader-ball-inner" />
        </div>
      </div>

      <div className="classroom-chat__messages">
        <div className="classroom-chat__message classroom-chat__message--hint">
          This is where classroom conversation, AI guidance, and diary actions
          will show up.
        </div>
      </div>

      <form
        className="classroom-chat__input-row"
        onSubmit={(e) => {
          e.preventDefault();
          // Wire to your agent / backend
        }}
      >
        <input
          className="classroom-chat__input"
          placeholder="Ask the room assistant, teacher, or safety agent…"
        />
        <button className="classroom-chat__send" type="submit">
          Send
        </button>
      </form>
    </div>
  );
};
