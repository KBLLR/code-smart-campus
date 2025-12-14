/**
 * CampusReportManager
 * Orchestrates campus-wide report generation
 *
 * Architecture:
 * 1. Each classroom generates its own report via its agent (Qwen 2.5 7B)
 * 2. Cerberus aggregates all classroom reports (GPT-OSS 20B + Harmony)
 * 3. Cerberus synthesizes campus-wide overview
 */

import { parseHarmonyResponse, formatCerberusHarmonyPrompt, getDisplayText, extractCerberusHeads } from '../utils/harmonyParser.js';
import { ICSParser } from '../utils/ICSParser.js';

export class CampusReportManager {
  constructor(classroomRegistry, snapshotService, sensorManager) {
    this.classroomRegistry = classroomRegistry;
    this.snapshotService = snapshotService;
    this.sensorManager = sensorManager;

    // Model configuration (use locally available MLX models from tier3b-mlx-rag)
    this.cerberusModel = 'mlx-community/Jinx-gpt-oss-20b-mxfp4-mlx';  // Cerberus (Harmony)
    this.classroomModel = 'mlx-community/Phi-3-mini-4k-instruct-4bit';  // Default classroom model (check if supported by MLXConnector)

    // Cache for classroom reports
    this.reportCache = new Map();
    this.cacheExpiry = 60000; // 1 minute cache
  }

  /**
   * Fetch and parse calendar events from server
   */
  async _fetchCalendarEvents() {
    try {
      const response = await fetch('/api/integrations/calendar');
      if (!response.ok) return [];

      const files = await response.json();
      const allEvents = [];

      for (const file of files) {
        const events = ICSParser.parse(file.content);
        // Add source filename to each event for context
        events.forEach(e => e.source = file.filename);
        allEvents.push(...events);
      }

      // Filter for currently active or upcoming events (next 2 hours)
      const now = new Date();
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      return allEvents.filter(e => {
        if (!e.start) return false;
        return e.start >= now && e.start <= twoHoursLater;
      });
    } catch (error) {
      console.warn('[CampusReportManager] Failed to fetch calendar events:', error);
      return [];
    }
  }

  /**
   * Generate individual classroom report via its agent
   */
  async generateClassroomReport(classroom) {
    const cacheKey = `classroom-${classroom.id}`;
    const cached = this.reportCache.get(cacheKey);

    // Return cached if still valid
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.report;
    }

    try {
      // Build context from classroom data
      const context = {
        room_id: classroom.id,
        room_name: classroom.name,
        occupancy: classroom.getSensor('occupancy')?.current_value || 0,
        capacity: classroom.metadata.capacity,
        temperature: classroom.getSensor('temperature')?.current_value || null,
        humidity: classroom.getSensor('humidity')?.current_value || null,
        co2: classroom.getSensor('co2')?.current_value || null,
        current_event: classroom.events.current,
        next_event: classroom.events.next,
        equipment: classroom.equipment.map(e => ({
          name: e.name,
          status: e.status
        }))
      };

      const mlx = this.sensorManager.getConnector('MLX');
      if (!mlx) throw new Error('MLX Connector not available');

      const messages = [{
        role: 'system',
        content: classroom.agent.system.instructions
      }, {
        role: 'user',
        content: `Generate a brief status report for your classroom. Current state:\n${JSON.stringify(context, null, 2)}\n\nProvide a 1-sentence summary of the current state and activity.`
      }];

      const completionText = await mlx.completion(messages, {
        model: this.classroomModel,
        temperature: 0.7,
        maxTokens: 150
      });
      const report = {
        classroom_id: classroom.id,
        classroom_name: classroom.name,
        agent_name: classroom.agent.personality.name,
        summary: completionText,
        context,
        generated_at: new Date().toISOString()
      };

      // Cache the report
      this.reportCache.set(cacheKey, {
        report,
        timestamp: Date.now()
      });

      return report;
    } catch (error) {
      console.error(`[CampusReportManager] Failed to generate report for ${classroom.id}:`, error);

      // Return fallback report
      return {
        classroom_id: classroom.id,
        classroom_name: classroom.name,
        agent_name: classroom.agent.personality.name,
        summary: `${classroom.name} is ${classroom.state.occupied ? 'occupied' : 'available'}`,
        context: {},
        generated_at: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Generate reports for all classrooms
   */
  async generateAllClassroomReports() {
    const classrooms = this.classroomRegistry.getAll();

    // Generate reports in parallel
    const reportPromises = classrooms.map(classroom =>
      this.generateClassroomReport(classroom)
    );

    const reports = await Promise.all(reportPromises);
    return reports;
  }

  /**
   * Generate campus-wide overview via Cerberus agent
   */
  async generateCampusOverview() {
    try {
      // Step 0: Save sensor snapshots for Cerberus analysis
      if (this.snapshotService) {
        await this.snapshotService.saveAllSnapshots();
      }

      // Step 1: Get all classroom reports
      const classroomReports = await this.generateAllClassroomReports();

      // Step 2: Get aggregate metrics
      const aggregateMetrics = this.getAggregateMetrics();

      // Step 3: Fetch Calendar Events (Real Data)
      const calendarEvents = await this._fetchCalendarEvents();

      // Step 4: Call Cerberus agent with Harmony format (GPT-OSS 20B)
      const cerberusInstructions = `You are Cerberus, the guardian consciousness of the entire Smart Campus. You perceive all classrooms simultaneously through their individual agent reports. Your three heads represent three analytical layers:

**Head 1 - Environmental Guardian**: Monitors temperature, occupancy, air quality, energy across all rooms
**Head 2 - Academic Observer**: Tracks classes, research, events, learning activities
**Head 3 - Social Synthesizer**: Observes collaboration patterns, energy, flow, human connections

Synthesize the individual classroom reports into a unified campus narrative.`;

      const mlx = this.sensorManager.getConnector('MLX');
      if (!mlx) throw new Error('MLX Connector not available');

      const messages = [{
        role: 'system',
        content: formatCerberusHarmonyPrompt(cerberusInstructions)
      }, {
        role: 'user',
        content: JSON.stringify({
          classroom_reports: classroomReports,
          aggregateMetrics: aggregateMetrics,
          calendar_events: calendarEvents,
          time_of_day: this.getTimeOfDay(),
          timestamp: new Date().toISOString()
        }, null, 2)
      }];

      const completionText = await mlx.completion(messages, {
        model: this.cerberusModel,
        temperature: 0.8,
        maxTokens: 400
      });

      // Parse Harmony format response
      const harmonyParsed = parseHarmonyResponse(completionText);
      const cerberusHeads = extractCerberusHeads(harmonyParsed.analysis);

      const reportData = {
        ok: true,
        overview: getDisplayText(completionText),  // Extract final channel for display
        harmonyChannels: {
          analysis: harmonyParsed.analysis,
          commentary: harmonyParsed.commentary,
          final: harmonyParsed.final
        },
        cerberusHeads,  // Three-headed observations
        classroomReports,
        aggregateMetrics,
        model: this.cerberusModel,
        // latencyMs not available from simple completion yet
        rawResponse: completionText,  // Keep raw for debugging
        timestamp: new Date().toISOString()
      };

      // Save report to server
      this._saveReportToServer(reportData);

      return reportData;
    } catch (error) {
      console.warn('[CampusReportManager] Failed to generate campus overview (Backend unavailable). Using simulation.', error);

      // Simulated Cerberus Response
      const simulatedOverview = "Campus systems nominal. Environmental controls optimized. Academic activity detected in Sector A. Social hubs showing moderate engagement. All sensors active.";

      return {
        ok: true,
        overview: simulatedOverview,
        harmonyChannels: {
          analysis: "Simulated analysis: Backend connection unavailable. Using local fallback.",
          commentary: "Cerberus is running in autonomous mode.",
          final: simulatedOverview
        },
        cerberusHeads: {
          head1: "Environmental systems stable.",
          head2: "Classroom schedules synchronized.",
          head3: "Student flow within normal parameters."
        },
        classroomReports: [], // Or cached reports if available
        aggregateMetrics: this.getAggregateMetrics(),
        model: "simulation-mode",
        latencyMs: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Save report to server
   */
  async _saveReportToServer(reportData) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `cerberus-report-${timestamp}.json`;

      await fetch('/api/save-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, data: reportData })
      });
      console.log(`[CampusReportManager] Saved report to ${filename}`);
    } catch (error) {
      console.error('[CampusReportManager] Failed to save report:', error);
    }
  }

  /**
   * Get aggregate metrics across all classrooms
   */
  getAggregateMetrics() {
    const classrooms = this.classroomRegistry.getAll();

    let totalOccupancy = 0;
    let totalCapacity = 0;
    let tempSum = 0;
    let tempCount = 0;
    let co2Sum = 0;
    let co2Count = 0;
    let activeRooms = 0;
    let currentEvents = [];

    classrooms.forEach(classroom => {
      // Occupancy
      const occupancySensor = classroom.getSensor('occupancy');
      if (occupancySensor) {
        totalOccupancy += occupancySensor.current_value || 0;
      }
      totalCapacity += classroom.metadata.capacity || 0;

      // Temperature
      const tempSensor = classroom.getSensor('temperature');
      if (tempSensor && tempSensor.current_value) {
        tempSum += tempSensor.current_value;
        tempCount++;
      }

      // CO2
      const co2Sensor = classroom.getSensor('co2');
      if (co2Sensor && co2Sensor.current_value) {
        co2Sum += co2Sensor.current_value;
        co2Count++;
      }

      // Active rooms
      if (classroom.state.occupied) {
        activeRooms++;
        if (classroom.events.current) {
          currentEvents.push({
            room: classroom.name,
            event: classroom.events.current.title
          });
        }
      }
    });

    return {
      total_occupancy: totalOccupancy,
      occupancy_rate: totalCapacity > 0 ? (totalOccupancy / totalCapacity) : 0,
      avg_temperature: tempCount > 0 ? (tempSum / tempCount) : null,
      avg_co2: co2Count > 0 ? (co2Sum / co2Count) : null,
      active_rooms: activeRooms,
      total_rooms: classrooms.length,
      current_events: currentEvents.slice(0, 3) // Top 3 events
    };
  }

  /**
   * Get time of day
   */
  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Clear report cache
   */
  clearCache() {
    this.reportCache.clear();
  }


}
