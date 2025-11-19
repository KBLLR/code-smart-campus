/**
 * ClassroomPage Component
 *
 * Main entry point for classroom experience.
 * Fetches classroom data and renders ClassroomViewManager.
 *
 * Usage:
 *   ClassroomPage.render(document.getElementById('root'), 'eng-101');
 */

import React, { useEffect, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ClassroomViewManager } from './ClassroomViewManager';
import type {
  ClassroomDefinition,
  ClassroomSnapshot,
  ClassroomEvent,
} from './types';
import { SceneManager } from '@shared/ui/SceneManager';

interface ClassroomPageProps {
  classroomId: string;
  onExit?: () => void;
}

/**
 * Fetch classroom data from API
 */
async function fetchClassroom(classroomId: string): Promise<ClassroomDefinition> {
  const response = await fetch(`/api/classrooms/${classroomId}`);
  if (!response.ok) {
    throw new Error(`Failed to load classroom: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch classroom snapshot from API
 */
async function fetchSnapshot(classroomId: string): Promise<ClassroomSnapshot> {
  const response = await fetch(`/api/classrooms/${classroomId}/snapshot`);
  if (!response.ok) {
    throw new Error(`Failed to load snapshot: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch classroom events from API
 */
async function fetchEvents(classroomId: string): Promise<ClassroomEvent[]> {
  const response = await fetch(`/api/classrooms/${classroomId}/events`);
  if (!response.ok) {
    throw new Error(`Failed to load events: ${response.statusText}`);
  }
  return response.json();
}

/**
 * ClassroomPage Component
 */
export const ClassroomPage: React.FC<ClassroomPageProps> = ({
  classroomId,
  onExit,
}) => {
  const [classroom, setClassroom] = useState<ClassroomDefinition | null>(null);
  const [snapshot, setSnapshot] = useState<ClassroomSnapshot | null>(null);
  const [events, setEvents] = useState<ClassroomEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load classroom data on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        const [classroomData, snapshotData, eventsData] = await Promise.all([
          fetchClassroom(classroomId),
          fetchSnapshot(classroomId),
          fetchEvents(classroomId),
        ]);

        if (!cancelled) {
          setClassroom(classroomData);
          setSnapshot(snapshotData);
          setEvents(eventsData);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [classroomId]);

  // Handle scene changes
  const handleChangeScene = async (sceneKey: string | undefined) => {
    if (!sceneKey) return;

    try {
      const sceneManager = SceneManager.getInstance();
      await sceneManager.activateScene(sceneKey);
      console.log(`[ClassroomPage] Activated scene: ${sceneKey}`);
    } catch (err) {
      console.error('[ClassroomPage] Failed to change scene:', err);
    }
  };

  // Handle exit
  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      // Default behavior: hide the classroom view
      const container = document.getElementById('classroom-root');
      if (container) {
        container.style.display = 'none';
      }
    }
  };

  if (!classroom) {
    return (
      <div className="classroom-page classroom-page--loading">
        {isLoading && <div className="classroom-page__spinner">Loading {classroomId}...</div>}
        {error && (
          <div className="classroom-page__error">
            <h2>Error Loading Classroom</h2>
            <p>{error}</p>
            <button onClick={handleExit}>Go Back</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="classroom-page">
      <button className="classroom-page__exit-btn" onClick={handleExit} aria-label="Exit classroom">
        ← Exit
      </button>
      <ClassroomViewManager
        classroom={classroom}
        snapshot={snapshot || undefined}
        events={events}
        isLoading={isLoading}
        error={error}
        onChangeScene={handleChangeScene}
      />
    </div>
  );
};

/**
 * Static render method for easy integration
 */
let rootInstance: Root | null = null;

export function renderClassroomPage(
  container: HTMLElement,
  classroomId: string,
  onExit?: () => void
) {
  if (!rootInstance) {
    rootInstance = createRoot(container);
  }

  rootInstance.render(
    <React.StrictMode>
      <ClassroomPage classroomId={classroomId} onExit={onExit} />
    </React.StrictMode>
  );
}

/**
 * Unmount classroom page
 */
export function unmountClassroomPage() {
  if (rootInstance) {
    rootInstance.unmount();
    rootInstance = null;
  }
}
