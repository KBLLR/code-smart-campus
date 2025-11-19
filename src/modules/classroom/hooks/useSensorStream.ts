/**
 * useSensorStream Hook
 *
 * Connects to Server-Sent Events (SSE) sensor stream for a classroom
 * and provides real-time sensor updates.
 *
 * Usage:
 *   const sensors = useSensorStream(classroomId);
 */

import { useState, useEffect, useRef } from 'react';
import type { ClassroomSensors } from '../types';

interface SensorUpdate {
  type: 'sensor_update';
  classroomId: string;
  timestamp: string;
  sensors: ClassroomSensors;
}

export function useSensorStream(classroomId: string): ClassroomSensors | null {
  const [sensors, setSensors] = useState<ClassroomSensors | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    if (!classroomId) return;

    function connect() {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Create EventSource for Server-Sent Events
      const url = `/api/classrooms/${classroomId}/sensors`;
      console.log(`[useSensorStream] Connecting to ${url}`);

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log(`[useSensorStream] Connected to ${classroomId}`);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const update: SensorUpdate = JSON.parse(event.data);
          if (update.type === 'sensor_update' && update.sensors) {
            setSensors(update.sensors);
          }
        } catch (err) {
          console.error('[useSensorStream] Failed to parse message:', err);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[useSensorStream] EventSource error:', error);
        eventSource.close();

        // Attempt to reconnect with exponential backoff
        const maxAttempts = 5;
        if (reconnectAttemptsRef.current < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`[useSensorStream] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };
    }

    connect();

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [classroomId]);

  return sensors;
}
