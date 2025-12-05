/**
 * SensorSnapshotService - Saves sensor snapshots to dated files
 * Creates timestamped JSON files per classroom for Cerberus analysis
 */

export class SensorSnapshotService {
  constructor(classroomRegistry, { enabled = false } = {}) {
    this.classroomRegistry = classroomRegistry;
    this.snapshotDir = '/data/sensors';
    this.enabled = enabled;

    console.log(`[SensorSnapshotService] Initialized (enabled=${this.enabled})`);
  }

  /**
   * Save current sensor state for all classrooms
   */
  async saveAllSnapshots() {
    if (!this.enabled) {
      console.log('[SensorSnapshotService] Snapshots disabled; skipping saveAllSnapshots');
      return [];
    }

    const classrooms = this.classroomRegistry.getAll();
    const timestamp = new Date();
    const dateStr = this.formatDate(timestamp);
    const snapshots = [];

    for (const classroom of classrooms) {
      const snapshot = await this.saveClassroomSnapshot(classroom, timestamp, dateStr);
      if (snapshot) {
        snapshots.push(snapshot);
      }
    }

    console.log(`[SensorSnapshotService] Saved ${snapshots.length} classroom snapshots`);
    return snapshots;
  }

  /**
   * Save sensor snapshot for a specific classroom
   */
  async saveClassroomSnapshot(classroom, timestamp = new Date(), dateStr = null) {
    if (!this.enabled) return null;

    if (!dateStr) {
      dateStr = this.formatDate(timestamp);
    }

    const snapshot = {
      timestamp: timestamp.toISOString(),
      classroom_id: classroom.id,
      classroom_name: classroom.name,
      sensors: classroom.sensors.map(sensor => ({
        id: sensor.id,
        type: sensor.type,
        entity_id: sensor.entity_id,
        current_value: sensor.current_value,
        unit: sensor.unit,
        status: sensor.status,
        last_updated: sensor.last_updated,
        thresholds: sensor.thresholds
      })),
      metadata: {
        capacity: classroom.metadata.capacity,
        area_sqm: classroom.geometry?.area_sqm,
        features: classroom.metadata.features
      },
      state: classroom.state
    };

    const filename = `${dateStr}-${classroom.id}-sensors.json`;
    const content = JSON.stringify(snapshot, null, 2);

    // Save to file (browser environment - use download)
    this.downloadJSON(content, filename);

    console.log(`[SensorSnapshotService] Saved snapshot: ${filename}`);
    return snapshot;
  }

  /**
   * Format date for filename: YYYY-MM-DD_HH-mm-ss
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  }

  /**
   * Download JSON file (browser environment)
   */
  downloadJSON(content, filename) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Get snapshot summary for all classrooms
   */
  getSnapshotSummary() {
    const classrooms = this.classroomRegistry.getAll();

    return classrooms.map(classroom => ({
      classroom_id: classroom.id,
      classroom_name: classroom.name,
      sensor_count: classroom.sensors.length,
      active_sensors: classroom.sensors.filter(s => s.current_value !== null && s.current_value !== undefined).length,
      last_updates: classroom.sensors.map(s => ({
        type: s.type,
        value: s.current_value,
        unit: s.unit,
        updated: s.last_updated
      }))
    }));
  }
}
