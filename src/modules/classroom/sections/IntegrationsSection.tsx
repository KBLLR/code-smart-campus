/**
 * IntegrationsSection Component
 *
 * Displays external service integrations for this classroom:
 * - Notion (syllabus, notes)
 * - Slack (announcements, discussions)
 * - GitHub (code, assignments)
 * - Figma (design work)
 *
 * Shows connection status and IDs from classroom.integrations.
 */

import React from 'react';
import type { ClassroomDefinition } from '../types';

interface IntegrationsSectionProps {
  classroom: ClassroomDefinition;
}

export const IntegrationsSection: React.FC<IntegrationsSectionProps> = ({
  classroom,
}) => {
  const { integrations } = classroom;

  const items = [
    {
      label: 'Notion',
      value: integrations.notionDatabaseId,
    },
    {
      label: 'Slack',
      value: integrations.slackChannelId,
    },
    {
      label: 'GitHub',
      value: integrations.githubRepo,
    },
    {
      label: 'Figma',
      value: integrations.figmaFileId,
    },
  ];

  return (
    <div className="classroom-integrations">
      <h3>Integrations</h3>
      <ul className="classroom-integrations__list">
        {items.map((item) => (
          <li key={item.label} className="classroom-integrations__item">
            <span className="classroom-integrations__label">{item.label}</span>
            {item.value ? (
              <span className="classroom-integrations__value">
                {item.value}
              </span>
            ) : (
              <span className="classroom-integrations__value classroom-integrations__value--missing">
                Not connected
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
