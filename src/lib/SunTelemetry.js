// src/lib/SunTelemetry.js
// Maintains a rolling buffer of sun telemetry samples and exposes smoothed/interpolated values.

const DEFAULT_BUFFER_SIZE = 12;
const DEFAULT_SMOOTHING_FACTOR = 0.45;
const DEFAULT_MAX_STALENESS_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Represents a sanitised sun telemetry sample.
 * @typedef {{ azimuth: number, elevation: number, timestamp: number }} SunSample
 */

export class SunTelemetry {
  /**
   * @param {{ bufferSize?: number, smoothingFactor?: number, maxStaleness?: number }} [options]
   */
  constructor({
    bufferSize = DEFAULT_BUFFER_SIZE,
    smoothingFactor = DEFAULT_SMOOTHING_FACTOR,
    maxStaleness = DEFAULT_MAX_STALENESS_MS,
  } = {}) {
    this.bufferSize = bufferSize;
    this.smoothingFactor = smoothingFactor;
    this.maxStaleness = maxStaleness;

    /** @type {SunSample[]} */
    this.samples = [];
    /** @type {SunSample|null} */
    this.smoothedSample = null;
  }

  /**
   * Normalises raw attributes into a telemetry sample.
   * @param {object} attributes
   * @param {number} timestamp
   * @returns {SunSample|null}
   */
  static normalise(attributes = {}, timestamp) {
    const azimuth = Number(attributes.azimuth ?? attributes.azimuth_deg);
    const elevation = Number(attributes.elevation ?? attributes.elevation_deg);
    if (!Number.isFinite(azimuth) || !Number.isFinite(elevation)) return null;
    const clampedElevation = Math.max(-90, Math.min(90, elevation));
    return {
      azimuth: ((azimuth % 360) + 360) % 360, // wrap around
      elevation: clampedElevation,
      timestamp,
    };
  }

  /**
   * Adds a new telemetry sample and updates the smoothed state.
   * @param {object} attributes
  * @param {number} [timestamp]
  * @returns {SunSample|null} The latest smoothed sample.
   */
  ingest(attributes, timestamp = Date.now()) {
    const numericTimestamp = Number(timestamp);
    const resolvedTimestamp = Number.isFinite(numericTimestamp) ? numericTimestamp : Date.now();
    const sample = SunTelemetry.normalise(attributes, resolvedTimestamp);
    if (!sample) return null;

    this.samples.push(sample);
    if (this.samples.length > this.bufferSize) this.samples.shift();

    if (!this.smoothedSample) {
      this.smoothedSample = { ...sample };
    } else {
      const alpha = this.smoothingFactor;
      this.smoothedSample = {
        azimuth: this.smoothedSample.azimuth + alpha * this.angularDelta(this.smoothedSample.azimuth, sample.azimuth),
        elevation:
          this.smoothedSample.elevation +
          alpha * (sample.elevation - this.smoothedSample.elevation),
        timestamp: sample.timestamp,
      };
      this.smoothedSample.azimuth = ((this.smoothedSample.azimuth % 360) + 360) % 360;
    }

    return this.smoothedSample;
  }

  /**
   * Returns the latest smoothed sample if it is not stale.
   * @param {number} [now]
   * @returns {SunSample|null}
   */
  getSmoothed(now = Date.now()) {
    if (!this.smoothedSample) return null;
    if (now - this.smoothedSample.timestamp > this.maxStaleness) return null;
    return { ...this.smoothedSample };
  }

  /**
   * Returns an interpolated sample for the requested time.
   * Falls back to the smoothed sample if interpolation is not possible.
   * @param {number} [time]
   * @returns {SunSample|null}
   */
  getInterpolated(time = Date.now()) {
    if (this.samples.length === 0) return null;
    if (this.samples.length === 1) return this.getSmoothed(time);

    const samples = this.samples;
    const last = samples[samples.length - 1];
    if (time >= last.timestamp) return this.getSmoothed(time);

    for (let i = samples.length - 1; i > 0; i--) {
      const curr = samples[i];
      const prev = samples[i - 1];
      if (time >= prev.timestamp) {
        const span = curr.timestamp - prev.timestamp || 1;
        const t = (time - prev.timestamp) / span;
        return {
          azimuth: this.interpolateAngle(prev.azimuth, curr.azimuth, t),
          elevation: prev.elevation + (curr.elevation - prev.elevation) * t,
          timestamp: time,
        };
      }
    }

    // If time is before oldest sample, return the oldest smoothed value.
    const first = samples[0];
    if (time < first.timestamp) {
      return {
        azimuth: first.azimuth,
        elevation: first.elevation,
        timestamp: time,
      };
    }

    return this.getSmoothed(time);
  }

  /**
   * Returns a shallow copy of the stored samples.
   * @returns {SunSample[]}
   */
  getSamples() {
    return this.samples.map((sample) => ({ ...sample }));
  }

  /**
   * Returns the latest raw sample regardless of staleness.
   * @returns {SunSample|null}
   */
  getLatest() {
    const last = this.samples[this.samples.length - 1];
    return last ? { ...last } : null;
  }

  /**
   * Calculates the smallest angular difference (degrees) from a to b.
   * @private
   */
  angularDelta(a, b) {
    let diff = ((b - a + 540) % 360) - 180;
    if (diff < -180) diff += 360;
    return diff;
  }

  /**
   * Linearly interpolates between two angles (degrees) accounting for wrap-around.
   * @private
   */
  interpolateAngle(start, end, t) {
    const delta = this.angularDelta(start, end);
    const value = start + delta * t;
    return ((value % 360) + 360) % 360;
  }
}
