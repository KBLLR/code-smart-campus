/**
 * ClassroomSelector Component
 *
 * Simple UI for selecting a classroom to enter.
 * Lists available classrooms and triggers ClassroomPage rendering.
 */

import React, { useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { renderClassroomPage } from './ClassroomPage';

interface Classroom {
  id: string;
  name: string;
  building: string;
  room: string;
  description?: string;
}

const AVAILABLE_CLASSROOMS: Classroom[] = [
  {
    id: 'eng-101',
    name: 'Engineering 101',
    building: 'ENG',
    room: '101',
    description: 'Computer Science lecture hall with smart sensors',
  },
  {
    id: 'lab-a',
    name: 'Chemistry Lab A',
    building: 'SCI',
    room: 'LAB-A',
    description: 'Advanced chemistry lab with safety monitoring',
  },
];

export const ClassroomSelector: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleEnterRoom = (classroomId: string) => {
    setSelectedId(classroomId);

    // Find the classroom root container
    const container = document.getElementById('classroom-root');
    if (!container) {
      console.error('[ClassroomSelector] classroom-root container not found');
      return;
    }

    // Hide selector
    const selectorContainer = document.getElementById('classroom-selector-root');
    if (selectorContainer) {
      selectorContainer.style.display = 'none';
    }

    // Show classroom container
    container.style.display = 'block';

    // Render ClassroomPage
    renderClassroomPage(container, classroomId, () => {
      // On exit callback
      container.style.display = 'none';
      if (selectorContainer) {
        selectorContainer.style.display = 'block';
      }
      setSelectedId(null);
    });
  };

  return (
    <div className="classroom-selector">
      <div className="classroom-selector__header">
        <h1>Smart Classrooms</h1>
        <p>Select a classroom to view real-time sensors, chat with AI assistants, and more.</p>
      </div>

      <div className="classroom-selector__grid">
        {AVAILABLE_CLASSROOMS.map(classroom => (
          <div
            key={classroom.id}
            className={`classroom-selector__card ${selectedId === classroom.id ? 'selected' : ''}`}
          >
            <div className="classroom-selector__card-header">
              <h2>{classroom.name}</h2>
              <span className="classroom-selector__location">
                {classroom.building} · {classroom.room}
              </span>
            </div>

            {classroom.description && (
              <p className="classroom-selector__description">
                {classroom.description}
              </p>
            )}

            <button
              className="classroom-selector__enter-btn"
              onClick={() => handleEnterRoom(classroom.id)}
              disabled={selectedId !== null}
            >
              {selectedId === classroom.id ? 'Loading...' : 'Enter Room'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Render ClassroomSelector into a container
 */
let selectorRootInstance: Root | null = null;

export function renderClassroomSelector(container: HTMLElement) {
  if (!selectorRootInstance) {
    selectorRootInstance = createRoot(container);
  }

  selectorRootInstance.render(
    <React.StrictMode>
      <ClassroomSelector />
    </React.StrictMode>
  );
}

/**
 * Unmount ClassroomSelector
 */
export function unmountClassroomSelector() {
  if (selectorRootInstance) {
    selectorRootInstance.unmount();
    selectorRootInstance = null;
  }
}
