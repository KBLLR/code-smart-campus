import { test } from "node:test";
import assert from "node:assert/strict";

import { SunTelemetry } from "../src/lib/SunTelemetry.js";

test("ingest returns smoothed sample and respects smoothing", () => {
  const telemetry = new SunTelemetry({ smoothingFactor: 0.5, maxStaleness: 60_000 });

  const first = telemetry.ingest({ azimuth: 100, elevation: 20 }, 0);
  assert.ok(first);
  assert.equal(first.azimuth, 100);
  assert.equal(first.elevation, 20);

  const second = telemetry.ingest({ azimuth: 120, elevation: 10 }, 30_000);
  assert.ok(second);
  assert.ok(Math.abs(second.azimuth - 110) < 0.001);
  assert.ok(Math.abs(second.elevation - 15) < 0.001);

  const smoothed = telemetry.getSmoothed(30_000);
  assert.ok(smoothed);
  assert.ok(Math.abs(smoothed.azimuth - 110) < 0.001);
  assert.ok(Math.abs(smoothed.elevation - 15) < 0.001);
});

test("interpolation blends consecutive samples", () => {
  const telemetry = new SunTelemetry({ smoothingFactor: 1.0, maxStaleness: 60_000 });
  telemetry.ingest({ azimuth: 10, elevation: 0 }, 0);
  telemetry.ingest({ azimuth: 40, elevation: 30 }, 60_000);

  const mid = telemetry.getInterpolated(30_000);
  assert.ok(mid);
  assert.ok(Math.abs(mid.azimuth - 25) < 0.001);
  assert.ok(Math.abs(mid.elevation - 15) < 0.001);
});

test("smoothed sample becomes stale", () => {
  const telemetry = new SunTelemetry({ maxStaleness: 10_000 });
  telemetry.ingest({ azimuth: 50, elevation: 5 }, 0);

  assert.ok(telemetry.getSmoothed(5_000));
  assert.equal(telemetry.getSmoothed(20_000), null);
});
