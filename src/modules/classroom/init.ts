/**
 * Classroom Module Initializer
 *
 * Initializes the classroom UI by rendering the ClassroomSelector
 * into designated container elements.
 *
 * Usage in main.js:
 *   import { initClassroom } from '@/modules/classroom/init';
 *   initClassroom();
 */

import { renderClassroomSelector } from './ClassroomSelector';

export function initClassroom() {
  // Create containers if they don't exist
  let selectorContainer = document.getElementById('classroom-selector-root');
  let classroomContainer = document.getElementById('classroom-root');

  if (!selectorContainer) {
    selectorContainer = document.createElement('div');
    selectorContainer.id = 'classroom-selector-root';
    document.body.appendChild(selectorContainer);
  }

  if (!classroomContainer) {
    classroomContainer = document.createElement('div');
    classroomContainer.id = 'classroom-root';
    classroomContainer.style.display = 'none'; // Hidden by default
    document.body.appendChild(classroomContainer);
  }

  // Render the classroom selector
  renderClassroomSelector(selectorContainer);

  console.log('[Classroom] Module initialized');
}

/**
 * Cleanup classroom module (for testing/reloading)
 */
export function cleanupClassroom() {
  const selectorContainer = document.getElementById('classroom-selector-root');
  const classroomContainer = document.getElementById('classroom-root');

  if (selectorContainer) {
    selectorContainer.remove();
  }

  if (classroomContainer) {
    classroomContainer.remove();
  }

  console.log('[Classroom] Module cleaned up');
}
