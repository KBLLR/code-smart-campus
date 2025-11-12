/**
 * Entity Binding Registry - Maps room locations to Home Assistant entities
 *
 * Implements HADS-R02 hybrid entity binding strategy:
 * - Convention-based: Extract room ID from entity name patterns
 * - Registry-based: Explicit mapping config (optional, for overrides)
 * - Mobile entity support: Track current vs. home location
 *
 * Usage:
 *   const entities = registry.getEntitiesForLocation('b.3');
 *   // Returns: ['sensor.b3_temperature', 'sensor.b3_humidity', ...]
 */

export interface EntityBinding {
  entity_id: string;
  location_id: string;
  location_name?: string;
  device_type?: string;
  is_mobile?: boolean;
  home_location_id?: string;
  current_location_id?: string;
}

export interface EntityBindingConfig {
  fixed_entities: EntityBinding[];
  mobile_entities: EntityBinding[];
}

class EntityBindingRegistry {
  private bindings: Map<string, EntityBinding[]> = new Map();
  private entityMap: Map<string, EntityBinding> = new Map();

  /**
   * Initialize registry from explicit config
   * @param config Entity binding configuration
   */
  initializeFromConfig(config: EntityBindingConfig) {
    this.bindings.clear();
    this.entityMap.clear();

    // Register fixed entities
    config.fixed_entities.forEach((binding) => {
      this.registerBinding(binding);
    });

    // Register mobile entities
    config.mobile_entities.forEach((binding) => {
      binding.is_mobile = true;
      this.registerBinding(binding);
    });

    console.log(
      `[EntityBindingRegistry] Initialized with ${config.fixed_entities.length} fixed + ${config.mobile_entities.length} mobile entities`
    );
  }

  /**
   * Register a single entity binding
   */
  private registerBinding(binding: EntityBinding) {
    const locationId = binding.location_id;

    // Add to bindings map (location -> entities)
    if (!this.bindings.has(locationId)) {
      this.bindings.set(locationId, []);
    }
    this.bindings.get(locationId)!.push(binding);

    // Add to entity map (entity_id -> binding)
    this.entityMap.set(binding.entity_id, binding);
  }

  /**
   * Auto-discover entity bindings from HA entity list
   * Uses convention-based extraction (strategy A from HADS-R02)
   *
   * @param entities Array of HA entity IDs
   * @param entityStates Optional map of entity states for validation (reserved for future use)
   * @param normalizeRoomId Optional function to normalize room ID (e.g., "b3" → "b.3")
   */
  auto_discover(
    entities: string[],
    _entityStates?: Record<string, any>,
    normalizeRoomId?: (rawId: string) => string
  ) {
    const discovered = new Map<string, string[]>();

    entities.forEach((entityId) => {
      let roomId = this.extractRoomIdFromEntityName(entityId);
      if (!roomId) return;

      // Apply normalization if provided
      if (normalizeRoomId) {
        roomId = normalizeRoomId(roomId);
      }

      if (!discovered.has(roomId)) {
        discovered.set(roomId, []);
      }
      discovered.get(roomId)!.push(entityId);

      // Register binding
      const binding: EntityBinding = {
        entity_id: entityId,
        location_id: roomId,
        device_type: this.extractDeviceType(entityId),
      };
      this.registerBinding(binding);
    });

    console.log(
      `[EntityBindingRegistry] Auto-discovered ${entities.length} entities for ${discovered.size} locations`
    );

    return discovered;
  }

  /**
   * Get all entities for a location
   * @param locationId Room ID (e.g., 'b.3', 'kitchen')
   * @returns Array of entity IDs associated with this location
   */
  getEntitiesForLocation(locationId: string): string[] {
    const bindings = this.bindings.get(locationId) || [];
    return bindings.map((b) => b.entity_id);
  }

  /**
   * Get all bindings (with metadata) for a location
   * @param locationId Room ID
   * @returns Array of binding objects with full metadata
   */
  getBindingsForLocation(locationId: string): EntityBinding[] {
    return this.bindings.get(locationId) || [];
  }

  /**
   * Get binding for a specific entity
   * @param entityId Entity ID
   * @returns Binding object or null if not found
   */
  getBindingForEntity(entityId: string): EntityBinding | null {
    return this.entityMap.get(entityId) || null;
  }

  /**
   * Get all locations with entities
   * @returns Set of all location IDs that have entities
   */
  getAllLocations(): Set<string> {
    return new Set(this.bindings.keys());
  }

  /**
   * Check if location has any entities
   * @param locationId Room ID
   * @returns True if location has at least one entity
   */
  hasEntitiesForLocation(locationId: string): boolean {
    const bindings = this.bindings.get(locationId);
    return bindings !== undefined && bindings.length > 0;
  }

  /**
   * Extract room ID from entity name using convention-based patterns
   *
   * Supported patterns:
   * - sensor.{room_id}_{metric}
   * - sensor.{room_friendly_name}_{metric}
   * - {room_id}_{metric}
   * - {metric}_{room_id}
   */
  private extractRoomIdFromEntityName(entityId: string): string | null {
    // Normalize: remove entity domain prefix (sensor., binary_sensor., etc.)
    let name = entityId.includes(".")
      ? entityId.split(".")[1]
      : entityId;

    // Pattern 1: {room_id}_{metric} (e.g., b3_temperature, a1_humidity)
    const pattern1 = /^([a-z0-9]+?)_([a-z_]+)$/i;
    const match1 = name.match(pattern1);
    if (match1) {
      return match1[1]; // Return the room identifier
    }

    // Pattern 2: Just room ID alone (e.g., sensor_b3, sensor_kitchen)
    const pattern2 = /^([a-z0-9]+)$/i;
    const match2 = name.match(pattern2);
    if (match2 && !this.isCommonMetricName(match2[1])) {
      return match2[1];
    }

    return null;
  }

  /**
   * Extract device type from entity name
   * @param entityId Entity ID
   * @returns Device type string (e.g., 'temperature', 'humidity', 'occupancy')
   */
  private extractDeviceType(entityId: string): string {
    const name = entityId.includes(".")
      ? entityId.split(".")[1]
      : entityId;

    // Extract metric/device type from pattern
    const match = name.match(/_([a-z_]+)$/i);
    return match ? match[1] : "unknown";
  }

  /**
   * Check if a string is a common metric name (not a room ID)
   */
  private isCommonMetricName(name: string): boolean {
    const commonMetrics = [
      "temperature",
      "humidity",
      "occupancy",
      "co2",
      "air_quality",
      "illumination",
      "motion",
      "pressure",
      "light",
      "switch",
    ];
    return commonMetrics.includes(name.toLowerCase());
  }

  /**
   * Get the room ID for a given entity ID (reverse lookup)
   *
   * @param entityId - Home Assistant entity ID
   * @returns Room ID or null if not found
   */
  getRoomForEntity(entityId: string): string | null {
    const binding = this.entityMap.get(entityId);
    return binding?.location_id || null;
  }

  /**
   * Get statistics about bindings
   */
  getStats(): {
    roomCount: number;
    entityCount: number;
    averageEntitiesPerRoom: number;
  } {
    const roomCount = this.bindings.size;
    const entityCount = this.entityMap.size;
    const averageEntitiesPerRoom =
      roomCount > 0 ? entityCount / roomCount : 0;

    return {
      roomCount,
      entityCount,
      averageEntitiesPerRoom: Number(averageEntitiesPerRoom.toFixed(2)),
    };
  }

  /**
   * Print diagnostics to console
   */
  printDiagnostics(): void {
    const stats = this.getStats();

    console.group("[EntityBindingRegistry] Diagnostics");
    console.log(`Rooms with entities: ${stats.roomCount}`);
    console.log(`Total entities bound: ${stats.entityCount}`);
    console.log(`Average entities per room: ${stats.averageEntitiesPerRoom}`);

    // Sample bindings
    const sample = Array.from(this.bindings.entries()).slice(0, 5);
    if (sample.length > 0) {
      console.log("\nSample bindings:");
      sample.forEach(([roomId, bindings]) => {
        console.log(`  "${roomId}": ${bindings.length} entities`);
        bindings.slice(0, 3).forEach((b) => console.log(`    - ${b.entity_id}`));
        if (bindings.length > 3) {
          console.log(`    ... and ${bindings.length - 3} more`);
        }
      });
    }

    console.groupEnd();
  }

  /**
   * Reset registry
   */
  reset() {
    this.bindings.clear();
    this.entityMap.clear();
  }
}

// Export singleton instance
export const entityBindingRegistry = new EntityBindingRegistry();

/**
 * Room ID normalization for TUM campus
 * Converts entity naming conventions to floorplan SVG IDs
 *
 * Examples:
 * - "b3" → "b.3"
 * - "a12" → "a.12"
 * - "a11_a12" → "a.11" (combined rooms use first ID)
 * - "kitchen" → "kitchen" (unchanged)
 */
export function normalizeTUMRoomId(rawId: string): string {
  // Pattern: letter + digits → letter + "." + digits
  const match = rawId.match(/^([a-z])(\d+)$/i);
  if (match) {
    return `${match[1].toLowerCase()}.${match[2]}`;
  }

  // Handle special cases like "a11_a12" → "a.11"
  const rangeMatch = rawId.match(/^([a-z])(\d+)_[a-z]\d+$/i);
  if (rangeMatch) {
    return `${rangeMatch[1].toLowerCase()}.${rangeMatch[2]}`;
  }

  // Return as-is for non-standard IDs (kitchen, library, etc.)
  return rawId.toLowerCase();
}
