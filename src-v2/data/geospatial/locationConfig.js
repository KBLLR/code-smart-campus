/**
 * Geospatial Configuration
 * Campus location coordinates and timezone for sun/moon/atmosphere calculations
 *
 * Sources:
 * - SITE_COORDINATES from src/utils/location.js (Berlin, Germany approx. coordinates)
 * - Campus timezone: Europe/Berlin (configurable via env)
 */

export const LOCATION_CONFIG = Object.freeze({
  // Campus geographic coordinates (WGS84)
  latitude: parseFloat(import.meta.env.VITE_SITE_LAT ?? 52.467),
  longitude: parseFloat(import.meta.env.VITE_SITE_LNG ?? 13.45),

  // Campus timezone (IANA timezone string)
  // Used for sun/moon calculations and atmospheric conditions
  timezone: import.meta.env.VITE_SITE_TIMEZONE ?? 'Europe/Berlin',

  // Campus elevation (meters above sea level, optional for future atmospheric pressure calculations)
  elevation: parseFloat(import.meta.env.VITE_SITE_ELEVATION ?? 0),

  // Campus name (for UI display)
  name: import.meta.env.VITE_SITE_NAME ?? 'Smart Campus',

  // Reference location (can differ from actual campus coords for testing)
  // When enabled, all calculations use this instead of the actual campus location
  useTestLocation: import.meta.env.VITE_GEOSPATIAL_TEST_LOCATION === 'true',
  testLocation: {
    latitude: 40.7128, // New York (example)
    longitude: -74.006,
    timezone: 'America/New_York',
  },
});

/**
 * Get the effective location config (uses test location if enabled)
 */
export function getEffectiveLocation() {
  if (LOCATION_CONFIG.useTestLocation) {
    return LOCATION_CONFIG.testLocation;
  }
  return {
    latitude: LOCATION_CONFIG.latitude,
    longitude: LOCATION_CONFIG.longitude,
    timezone: LOCATION_CONFIG.timezone,
  };
}
