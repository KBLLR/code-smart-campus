// --- START OF FILE entityUtils.js (Modified) ---

/**
 * Returns a suggested icon name based on substrings in an entity ID.
 * Prefers more neutral icons where available.
 * @param {string} entityId - The entity ID string (e.g., "sensor.living_room_temperature").
 * @returns {string} An icon name (without the .svg extension).
 */
export function getIconForEntity(entityId) {
  // Ensure input is a string and normalize it
  const id = typeof entityId === "string" ? entityId.toLowerCase() : "";

  // Order checks from more specific to more general if needed
  if (id.includes("temperature")) return "temperature"; // Use neutral 'temperature.svg'
  if (id.includes("humidity")) return "humidity"; // Use neutral 'humidity.svg'
  if (id.includes("occupancy")) return "occupancy"; // 'occupancy.svg' seems specific enough
  if (id.includes("calendar")) return "calendar"; // 'calendar.svg' is specific
  if (id.includes("camera")) return "camera"; // 'camera.svg' is specific
  if (id.includes("light")) return "light"; // Use neutral 'light.svg' (can represent on/off state elsewhere)
  if (id.includes("sun")) return "sun"; // 'sun.svg' is specific
  if (id.includes("air_quality") || id.includes("air") || id.includes("voc"))
    return "air"; // Use neutral 'air.svg'
  if (id.includes("battery")) return "battery-vertical"; // Use base battery icon

  // Add more mappings as needed
  if (id.includes("door")) return "door";
  if (id.includes("window")) return "window";
  if (id.includes("power")) return "plug";
  if (id.includes("motion")) return "run";

  // Fallback icon
  return "help-circle"; // Use 'help-circle.svg' or 'question-mark.svg' as clearer fallback
  // return "unknown"; // Previous fallback
}

// --- END OF FILE entityUtils.js (Modified) ---
