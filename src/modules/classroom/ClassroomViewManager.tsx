/**
 * ClassroomViewManager Component
 *
 * Main orchestration component for classroom UI.
 * Lays out 6+ sections with CSS Grid, passes ClassroomDefinition data down.
 *
 * Usage:
 *   <ClassroomViewManager
 *     classroom={classroomData}
 *     snapshot={snapshotData}
 *     events={eventsData}
 *     onChangeScene={(sceneKey) => sceneFactory.activate(sceneKey)}
 *   />
 */

import React from 'react';
import type {
  ClassroomDefinition,
  ClassroomSnapshot,
  ClassroomEvent,
} from './types';

import { ChatSection } from './sections/ChatSection';
import { PresenceSection } from './sections/PresenceSection';
import { SensorsSection } from './sections/SensorsSection';
import { CalendarSection } from './sections/CalendarSection';
import { HistorySection } from './sections/HistorySection';
import { IntegrationsSection } from './sections/IntegrationsSection';

import '../../css/classroom-view.css';

export interface ClassroomViewManagerProps {
  classroom: ClassroomDefinition;
  snapshot?: ClassroomSnapshot;
  events?: ClassroomEvent[];
  isLoading?: boolean;
  error?: string | null;
  // Hook into your scene system:
  onChangeScene?: (sceneKey: string | undefined) => void;
}

export const ClassroomViewManager: React.FC<ClassroomViewManagerProps> = ({
  classroom,
  snapshot,
  events = [],
  isLoading = false,
  error = null,
  onChangeScene,
}) => {
  const { ui, stage, sensors } = classroom;
  const comfortScore = snapshot?.comfortScore;
  const inferredActivity = snapshot?.inferredActivity;

  React.useEffect(() => {
    if (onChangeScene) {
      onChangeScene(stage.sceneKey);
    }
  }, [onChangeScene, stage.sceneKey]);

  return (
    <div className={`classroom-view classroom-view--theme-${ui.theme}`}>
      <header className="classroom-view__header">
        <div className="classroom-view__title">
          <h1>{classroom.name}</h1>
          <span className="classroom-view__room-tag">
            {classroom.campus.buildingId.toUpperCase()} · {classroom.campus.roomId}
          </span>
        </div>

        <div className="classroom-view__status">
          {comfortScore != null && (
            <div className="classroom-view__pill">
              Comfort: <strong>{Math.round(comfortScore)}</strong>/100
            </div>
          )}
          {inferredActivity && (
            <div className="classroom-view__pill">
              Activity: <strong>{inferredActivity}</strong>
            </div>
          )}
          {sensors.occupancyCount != null && (
            <div className="classroom-view__pill">
              Occupancy: <strong>{sensors.occupancyCount}</strong>
            </div>
          )}
        </div>
      </header>

      {isLoading && (
        <div className="classroom-view__overlay classroom-view__overlay--loading">
          <span>Loading classroom…</span>
        </div>
      )}

      {error && (
        <div className="classroom-view__overlay classroom-view__overlay--error">
          <span>{error}</span>
        </div>
      )}

      <div className="classroom-view__grid">
        {/* Left column: Chat / main interaction */}
        {ui.enabledSections.chat && (
          <section className="classroom-view__panel classroom-view__panel--chat">
            <ChatSection classroom={classroom} snapshot={snapshot} />
          </section>
        )}

        {/* Right column: stacked panels */}
        <div className="classroom-view__right-column">
          {ui.enabledSections.presence && (
            <section className="classroom-view__panel">
              <PresenceSection classroom={classroom} snapshot={snapshot} />
            </section>
          )}

          {ui.enabledSections.sensors && (
            <section className="classroom-view__panel">
              <SensorsSection classroom={classroom} snapshot={snapshot} />
            </section>
          )}

          {ui.enabledSections.calendar && (
            <section className="classroom-view__panel">
              <CalendarSection classroom={classroom} />
            </section>
          )}

          {ui.enabledSections.history && (
            <section className="classroom-view__panel">
              <HistorySection classroom={classroom} events={events} />
            </section>
          )}

          {ui.enabledSections.integrations && (
            <section className="classroom-view__panel">
              <IntegrationsSection classroom={classroom} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
