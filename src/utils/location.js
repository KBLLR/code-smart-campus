// src/utils/location.js
// Provides campus coordinates with environment overrides.

const DEFAULT_LAT = 52.467; // Berlin (approx campus)
const DEFAULT_LNG = 13.45;

function parseEnvNumber(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const SITE_COORDINATES = Object.freeze({
  lat: parseEnvNumber(import.meta.env.VITE_SITE_LAT, DEFAULT_LAT),
  lng: parseEnvNumber(import.meta.env.VITE_SITE_LNG, DEFAULT_LNG),
});

