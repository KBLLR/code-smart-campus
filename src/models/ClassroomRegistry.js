/**
 * ClassroomRegistry
 * Central registry for all classroom instances
 */

import { Classroom } from './Classroom.js';

export class ClassroomRegistry {
  constructor() {
    this.classrooms = new Map();
  }

  /**
   * Register a classroom
   */
  register(classroomData) {
    const classroom = new Classroom(classroomData);

    const validation = classroom.validate();
    if (!validation.valid) {
      throw new Error(`Invalid classroom data: ${validation.errors.join(', ')}`);
    }

    this.classrooms.set(classroom.id, classroom);
    return classroom;
  }

  /**
   * Get classroom by ID
   */
  get(id) {
    return this.classrooms.get(id);
  }

  /**
   * Get all classrooms
   */
  getAll() {
    return Array.from(this.classrooms.values());
  }

  /**
   * Get classrooms by category
   */
  getByCategory(category) {
    return this.getAll().filter(c => c.category === category);
  }

  /**
   * Get classrooms by building
   */
  getByBuilding(building) {
    return this.getAll().filter(c => c.building === building);
  }

  /**
   * Get classrooms by floor
   */
  getByFloor(floor) {
    return this.getAll().filter(c => c.floor === floor);
  }

  /**
   * Search classrooms
   */
  search(query) {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(c =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.metadata.description.toLowerCase().includes(lowerQuery) ||
      c.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Update sensor across all classrooms
   */
  updateSensorByEntity(entityId, value, status = 'ok') {
    for (const classroom of this.classrooms.values()) {
      if (classroom.updateSensorByEntity(entityId, value, status)) {
        return classroom;
      }
    }
    return null;
  }

  /**
   * Get all snapshots (for tier2-orchestrator)
   */
  toSnapshots() {
    return this.getAll().map(c => c.toSnapshot());
  }

  /**
   * Export to JSON
   */
  toJSON() {
    return {
      version: '2025.1',
      timestamp: new Date().toISOString(),
      classrooms: this.getAll().map(c => c.toJSON())
    };
  }

  /**
   * Load from JSON
   */
  loadJSON(data) {
    if (data.classrooms && Array.isArray(data.classrooms)) {
      data.classrooms.forEach(classroomData => {
        this.register(classroomData);
      });
    }
  }

  /**
   * Clear all classrooms
   */
  clear() {
    this.classrooms.clear();
  }

  /**
   * Get count
   */
  get count() {
    return this.classrooms.size;
  }
}

// Singleton instance
export const classroomRegistry = new ClassroomRegistry();
