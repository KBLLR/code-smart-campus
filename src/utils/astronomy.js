// src/utils/astronomy.js
// Minimal astronomical helpers derived from SunCalc (https://github.com/mourner/suncalc) under the MIT License.
// Copyright © 2011–2024 Vladimir Agafonkin.

const RAD = Math.PI / 180;
const DAY_MS = 1000 * 60 * 60 * 24;
const J2000 = 2451545; // Julian date at 2000-01-01 12:00 UTC

function toJulian(date) {
  return date.valueOf() / DAY_MS - 0.5 + 2440588;
}

function fromJulian(j) {
  return new Date((j + 0.5 - 2440588) * DAY_MS);
}

function toDays(date) {
  return toJulian(date) - J2000;
}

// General celestial mechanics helpers
const e = RAD * 23.4397; // obliquity of the Earth

function rightAscension(l, b) {
  return Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
}

function declination(l, b) {
  return Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
}

function azimuth(H, phi, dec) {
  return Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
}

function altitude(H, phi, dec) {
  return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
}

function siderealTime(d, lw) {
  return RAD * (280.16 + 360.9856235 * d) - lw;
}

// Moon calculations
function moonCoords(d) {
  // geocentric ecliptic coordinates of the moon
  const L = RAD * (218.316 + 13.176396 * d);
  const M = RAD * (134.963 + 13.064993 * d);
  const F = RAD * (93.272 + 13.229350 * d);

  const l = L + RAD * 6.289 * Math.sin(M);
  const b = RAD * 5.128 * Math.sin(F);
  const dt = 385001 - 20905 * Math.cos(M);

  return {
    ra: rightAscension(l, b),
    dec: declination(l, b),
    dist: dt,
  };
}

export function getMoonPosition(date, lat, lng) {
  const lw = -lng * RAD;
  const phi = lat * RAD;
  const d = toDays(date);

  const c = moonCoords(d);
  const H = siderealTime(d, lw) - c.ra;

  const h = altitude(H, phi, c.dec);
  const az = azimuth(H, phi, c.dec);

  // altitude correction for atmospheric refraction
  const hRef = h + RAD * 0.017 / Math.tan(h + RAD * 10.26 / (h + RAD * 5.10));

  return {
    azimuth: az,
    altitude: hRef,
    distance: c.dist,
  };
}

export function getMoonIllumination(date) {
  const d = toDays(date);
  const s = sunCoords(d);
  const m = moonCoords(d);

  const sdist = 149598000; // distance from Earth to Sun in km

  const phi = Math.acos(
    Math.sin(s.dec) * Math.sin(m.dec) +
      Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra),
  );
  const inc = Math.atan2(sdist * Math.sin(phi), m.dist - sdist * Math.cos(phi));
  const angle = Math.atan2(
    Math.cos(s.dec) * Math.sin(m.ra - s.ra),
    Math.sin(m.dec) * Math.cos(s.dec) - Math.cos(m.dec) * Math.sin(s.dec) * Math.cos(m.ra - s.ra),
  );

  return {
    fraction: (1 + Math.cos(inc)) / 2,
    phase: 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI,
    angle,
  };
}

function sunCoords(d) {
  const M = RAD * (357.5291 + 0.98560028 * d);
  const L = RAD * (280.1470 + 360.9856235 * d) + RAD * 1.9148 * Math.sin(M) + RAD * 0.0200 * Math.sin(2 * M);
  const b = 0;
  return {
    ra: rightAscension(L, b),
    dec: declination(L, b),
  };
}

export function normalizeAzimuthDegrees(radAzimuth) {
  const deg = (radAzimuth * 180) / Math.PI + 180;
  return ((deg % 360) + 360) % 360;
}

export function toDegrees(rad) {
  return (rad * 180) / Math.PI;
}

