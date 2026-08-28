/**
 * Deterministic derived series for the traps and sensors dashboards.
 * Pure, seeded by id — no Math.random, safe to call at render time.
 */

function hashSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h || 1;
}

/** Small deterministic PRNG (Lehmer/Park-Miller), same family used by the seed data. */
function rngFor(id: string) {
  let s = hashSeed(id) % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* --------------------------------------------------------- trap history */

export interface TrapWeekPoint {
  /** e.g. "Wk -6" .. "Wk 0" (current week) */
  label: string;
  weekIndex: number;
  count: number;
  etl: number;
}

/**
 * Seven weeks of trap catch counts ending at the current week, trending
 * toward (or away from) the economic threshold depending on the trap id.
 */
export function trapWeeklySeries(trapId: string, etl: number, elevated: boolean): TrapWeekPoint[] {
  const r = rngFor(trapId);
  let level = etl * (elevated ? 0.5 : 0.22);
  const growth = elevated ? 1.16 : 1.02;
  return Array.from({ length: 7 }, (_, i) => {
    level = Math.max(0, level * growth + (r() - 0.42) * etl * 0.2);
    return {
      label: i === 6 ? "This wk" : `Wk -${6 - i}`,
      weekIndex: i,
      count: Math.round(level),
      etl,
    };
  });
}

/** Week-over-week percentage change between the last two points of a series. */
export function weekOverWeekChange(series: { count: number }[]): number {
  if (series.length < 2) return 0;
  const prev = series[series.length - 2]!.count;
  const curr = series[series.length - 1]!.count;
  if (prev <= 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

/* -------------------------------------------------------- sensor history */

export interface SensorHourPoint {
  hour: string;
  hourIndex: number;
  soilMoisture: number;
  tempC: number;
  rhPct: number;
  leafWetnessHrs: number;
}

/**
 * 24 hourly points for the multi-series sensor chart, built around the
 * district's current weather so values stay plausible, offset per sensor.
 */
export function sensorDaySeries(
  sensorId: string,
  base: { tMaxC: number; tMinC: number; rhPct: number; leafWetnessHrs: number },
): SensorHourPoint[] {
  const r = rngFor(sensorId);
  return Array.from({ length: 24 }, (_, h) => {
    const diurnal = Math.sin(((h - 6) / 24) * Math.PI * 2);
    const tempC = Math.round(((base.tMinC + base.tMaxC) / 2 + diurnal * ((base.tMaxC - base.tMinC) / 2) + (r() - 0.5) * 0.8) * 10) / 10;
    const rhPct = Math.round(Math.max(20, Math.min(100, base.rhPct - diurnal * 14 + (r() - 0.5) * 4)));
    const soilMoisture = Math.round(Math.max(5, 26 - h * 0.15 + (r() - 0.5) * 2) * 10) / 10;
    const leafWetnessHrs = Math.round(Math.max(0, (h < 6 || h > 20 ? base.leafWetnessHrs / 6 : 0.2) + (r() - 0.5) * 0.4) * 10) / 10;
    return {
      hour: `${String(h).padStart(2, "0")}:00`,
      hourIndex: h,
      soilMoisture,
      tempC,
      rhPct,
      leafWetnessHrs,
    };
  });
}

/** Battery drain shown as a small 24h line inside the sensor detail view. */
export function sensorBatterySeries(sensorId: string, currentBattery: number): { hour: string; battery: number }[] {
  const r = rngFor(`${sensorId}-batt`);
  let level = Math.min(100, currentBattery + 4);
  return Array.from({ length: 24 }, (_, h) => {
    level = Math.max(0, level - (0.1 + r() * 0.1));
    return { hour: `${String(h).padStart(2, "0")}:00`, battery: Math.round(level * 10) / 10 };
  });
}
