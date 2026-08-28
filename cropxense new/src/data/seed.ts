import type {
  Advisory,
  CropHealthAssessment,
  Evidence,
  CropStage,
  ExpertReview,
  Farm,
  FieldVisit,
  FollowUp,
  Outbreak,
  PestTrap,
  RiskForecast,
  RiskLevel,
  Sensor,
  SensorReading,
  Severity,
  SignalChannel,
  TrapReading,
  WeatherObservation,
} from "@/types";
import {
  CROPS,
  DISEASES,
  DISTRICTS,
  FARM_PREFIX,
  FARM_SUFFIX,
  OWNER_FIRST,
  OWNER_LAST,
  PESTS,
  VILLAGES,
} from "./reference";

/** The demo is fixed to late August so every crop stage and weather figure lines up. */
export const TODAY = new Date("2026-08-25T09:30:00+05:30");

export function isoDay(offsetDays: number, base: Date = TODAY) {
  const d = new Date(base);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function isoTime(offsetHours: number, base: Date = TODAY) {
  const d = new Date(base);
  d.setHours(d.getHours() + offsetHours);
  return d.toISOString();
}

/** Deterministic PRNG so every reload of the demo shows the same district totals. */
function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const pick = <T,>(arr: T[], r: number) => arr[Math.floor(r * arr.length) % arr.length]!;

/* ------------------------------------------------------------------ weather */

/**
 * Districts under an active monsoon spell carry the humidity and leaf wetness
 * that justify a "high" risk anywhere downstream. Dry districts cannot.
 */
const WET_DISTRICTS = new Set(["amravati", "yavatmal", "akola", "wardha", "nagpur"]);

export const WEATHER: WeatherObservation[] = DISTRICTS.flatMap((d, di) => {
  const r = rng(101 + di * 17);
  const wet = WET_DISTRICTS.has(d.id);
  return Array.from({ length: 13 }, (_, i) => {
    const day = i - 6; // -6 .. +6
    const rain = wet ? Math.round(r() * 34 + 6) : Math.round(r() * 6);
    return {
      districtId: d.id,
      date: isoDay(day),
      tMaxC: Math.round((wet ? 29 + r() * 3 : 32 + r() * 4) * 10) / 10,
      tMinC: Math.round((wet ? 22 + r() * 2 : 23 + r() * 2) * 10) / 10,
      rhPct: Math.round(wet ? 82 + r() * 10 : 54 + r() * 12),
      rainfallMm: rain,
      leafWetnessHrs: wet ? Math.round(7 + r() * 5) : Math.round(r() * 3),
      windKph: Math.round(6 + r() * 12),
    };
  });
});

export const latestWeather = (districtId: string = "akola"): WeatherObservation => {
  const norm = districtId ? districtId.trim().toLowerCase() : "akola";
  const found = WEATHER.filter((w) => w.districtId.toLowerCase() === norm && w.date <= isoDay(0)).slice(-1)[0];
  return found || WEATHER.filter((w) => w.districtId === "akola" && w.date <= isoDay(0)).slice(-1)[0] || WEATHER[0]!;
};

/* -------------------------------------------------------------------- farms */

const STAGE_BY_CROP: Record<string, CropStage> = Object.fromEntries(
  CROPS.map((c) => [c.id, c.currentStage]),
);

/** 118 monitored fields: 74 healthy, 31 at risk, 13 affected. */
const HEALTH_PLAN: Farm["health"][] = [
  ...Array<Farm["health"]>(74).fill("healthy"),
  ...Array<Farm["health"]>(31).fill("at_risk"),
  ...Array<Farm["health"]>(13).fill("affected"),
];

const CROP_MIX: Record<string, string[]> = {
  akola: ["cotton", "soybean", "cotton", "tomato"],
  amravati: ["cotton", "cotton", "soybean", "onion"],
  yavatmal: ["cotton", "soybean", "cotton", "rice"],
  nagpur: ["soybean", "rice", "cotton", "banana"],
  wardha: ["cotton", "soybean", "tomato", "cotton"],
  jalgaon: ["banana", "cotton", "onion", "banana"],
  nashik: ["onion", "tomato", "onion", "banana"],
  pune: ["sugarcane", "onion", "tomato", "sugarcane"],
  solapur: ["sugarcane", "onion", "sugarcane", "tomato"],
};

function parcelFor(lat: number, lon: number, areaHa: number, r: () => number): [number, number][] {
  const s = Math.sqrt(areaHa) * 0.0011;
  return [
    [lat + s * (0.8 + r() * 0.4), lon - s * (0.9 + r() * 0.3)],
    [lat + s * (0.7 + r() * 0.4), lon + s * (1.0 + r() * 0.3)],
    [lat - s * (0.9 + r() * 0.3), lon + s * (0.8 + r() * 0.4)],
    [lat - s * (0.8 + r() * 0.3), lon - s * (1.0 + r() * 0.3)],
  ];
}

export const FARMS: Farm[] = (() => {
  const out: Farm[] = [];
  const r = rng(7717);
  // more fields in the cotton belt, fewer in the west
  const weights: Record<string, number> = {
    amravati: 20, yavatmal: 19, akola: 16, wardha: 12, nagpur: 12,
    jalgaon: 13, nashik: 10, pune: 8, solapur: 8,
  };
  const shuffledHealth = [...HEALTH_PLAN];
  // deterministic shuffle so unhealthy fields are spread across districts
  for (let i = shuffledHealth.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [shuffledHealth[i], shuffledHealth[j]] = [shuffledHealth[j]!, shuffledHealth[i]!];
  }
  let n = 0;
  DISTRICTS.forEach((d) => {
    const count = weights[d.id] ?? 10;
    for (let i = 0; i < count; i++) {
      const mix = CROP_MIX[d.id]!;
      const cropId = mix[i % mix.length]!;
      const areaHa = Math.round((0.4 + r() * 11.6) * 10) / 10;
      const lat = d.lat + (r() - 0.5) * 0.5;
      const lon = d.lon + (r() - 0.5) * 0.6;
      out.push({
        id: `F-${d.id.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
        name: `${pick(FARM_PREFIX, r())} ${pick(FARM_SUFFIX, r())}`,
        ownerName: `${pick(OWNER_FIRST, r())} ${pick(OWNER_LAST, r())}`,
        village: pick(VILLAGES[d.id]!, r()),
        districtId: d.id,
        areaHa,
        cropId,
        stage: STAGE_BY_CROP[cropId]!,
        lat,
        lon,
        parcel: parcelFor(lat, lon, areaHa, r),
        health: shuffledHealth[n % shuffledHealth.length] ?? ("healthy" as const),
        sowingDate: isoDay(-(58 + Math.floor(r() * 24))),
      });
      n++;
    }
  });
  return out;
})();

/* ------------------------------------------------------------ sensors/traps */

const SENSOR_TYPES: Sensor["type"][] = ["soil_moisture", "leaf_wetness", "air_temp", "humidity", "canopy_temp"];

export const SENSORS: Sensor[] = FARMS.filter((_, i) => i % 3 === 0).map((f, i) => {
  const r = rng(3300 + i);
  const status: Sensor["status"] = i % 17 === 0 ? "offline" : i % 23 === 0 ? "calibration" : "online";
  return {
    id: `S-${String(i + 1).padStart(3, "0")}`,
    farmId: f.id,
    districtId: f.districtId,
    type: SENSOR_TYPES[i % SENSOR_TYPES.length]!,
    status,
    lat: f.lat + (r() - 0.5) * 0.01,
    lon: f.lon + (r() - 0.5) * 0.01,
    lastSeen: status === "offline" ? isoTime(-31) : isoTime(-Math.round(r() * 2) - 1),
    battery: Math.round(38 + r() * 60),
  };
});

const UNIT: Record<Sensor["type"], string> = {
  soil_moisture: "%vwc",
  leaf_wetness: "h/day",
  air_temp: "°C",
  humidity: "%RH",
  canopy_temp: "°C",
};

export const SENSOR_READINGS: SensorReading[] = SENSORS.flatMap((s, si) => {
  const r = rng(900 + si);
  const w = latestWeather(s.districtId);
  return Array.from({ length: 24 }, (_, h) => {
    const base =
      s.type === "humidity" ? w.rhPct
      : s.type === "leaf_wetness" ? w.leafWetnessHrs
      : s.type === "soil_moisture" ? (w.rainfallMm > 10 ? 34 : 19)
      : s.type === "air_temp" ? w.tMaxC - 3
      : w.tMaxC - 1;
    return {
      sensorId: s.id,
      t: isoTime(-(23 - h)),
      value: Math.round((base + (r() - 0.5) * base * 0.12) * 10) / 10,
      unit: UNIT[s.type],
    };
  });
});

export const TRAPS: PestTrap[] = FARMS.filter((_, i) => i % 2 === 0).map((f, i) => {
  const crop = CROPS.find((c) => c.id === f.cropId)!;
  const r = rng(5100 + i);
  return {
    id: `T-${String(i + 1).padStart(3, "0")}`,
    farmId: f.id,
    districtId: f.districtId,
    pestId: crop.pestIds[i % crop.pestIds.length]!,
    type: i % 3 === 0 ? "light" : i % 3 === 1 ? "pheromone" : "sticky",
    installedOn: isoDay(-(20 + Math.floor(r() * 30))),
    lat: f.lat + (r() - 0.5) * 0.01,
    lon: f.lon + (r() - 0.5) * 0.01,
    status: i % 19 === 0 ? "needs_lure" : i % 29 === 0 ? "damaged" : "active",
  };
});

const TRAP_THRESHOLD: Record<string, number> = {
  pink_bollworm: 8, american_bollworm: 8, whitefly: 20, girdle_beetle: 6,
  aphids: 25, bph: 10, shoot_borer: 12, fruit_borer: 8, thrips: 30, pseudostem_weevil: 4,
};

export const TRAP_READINGS: TrapReading[] = TRAPS.flatMap((t, ti) => {
  const r = rng(200 + ti);
  const wet = WET_DISTRICTS.has(t.districtId);
  const threshold = TRAP_THRESHOLD[t.pestId] ?? 8;
  let level = threshold * (wet ? 0.55 : 0.25);
  return Array.from({ length: 7 }, (_, i) => {
    level = Math.max(0, level * (wet ? 1.14 : 1.01) + (r() - 0.45) * threshold * 0.22);
    return { trapId: t.id, date: isoDay(i - 6), count: Math.round(level), threshold };
  });
});

export const trapSeries = (trapId: string) =>
  TRAP_READINGS.filter((t) => t.trapId === trapId).map((t) => t.count);

/* --------------------------------------------------------------- assessments */

const threatName = (id: string) =>
  DISEASES.find((d) => d.id === id)?.name ?? PESTS.find((p) => p.id === id)?.name ?? id;

function threatFor(cropId: string, i: number) {
  const crop = CROPS.find((c) => c.id === cropId)!;
  const all = [...crop.pestIds, ...crop.diseaseIds];
  return all[i % all.length]!;
}

function evidenceFor(
  channels: SignalChannel[],
  districtId: string,
  threatId: string,
  confidence: number,
): Evidence[] {
  const w = latestWeather(districtId);
  const ev: Evidence[] = [];
  if (channels.includes("image"))
    ev.push({ channel: "image", label: "Image regions marked", detail: `${2 + (confidence % 4)} lesion regions matched the reference set for ${threatName(threatId)}`, supports: true });
  if (channels.includes("trap"))
    ev.push({ channel: "trap", label: "Pest trap count", detail: `Nearest pheromone trap above the economic threshold for 3 consecutive nights`, supports: true });
  if (channels.includes("sensor"))
    ev.push({ channel: "sensor", label: "Canopy sensor", detail: `Leaf wetness ${w.leafWetnessHrs} h/day sustained over the last 4 days`, supports: true });
  if (channels.includes("weather"))
    ev.push({ channel: "weather", label: "Weather window", detail: `RH ${w.rhPct}%, ${w.rainfallMm} mm rain, max ${w.tMaxC} °C — favourable`, supports: true });
  ev.push({ channel: "history", label: "District history", detail: `${threatName(threatId)} confirmed in this block in 2 of the last 3 kharif seasons`, supports: true });
  if (confidence < 80)
    ev.push({ channel: "image", label: "Counter-evidence", detail: "Two marked regions are also consistent with nutrient deficiency; a field check is needed to separate them", supports: false });
  return ev;
}

const STATUS_PLAN: CropHealthAssessment["status"][] = [
  ...Array<CropHealthAssessment["status"]>(9).fill("awaiting_validation"),
  ...Array<CropHealthAssessment["status"]>(8).fill("expert_confirmed"),
  ...Array<CropHealthAssessment["status"]>(5).fill("field_confirmed"),
  ...Array<CropHealthAssessment["status"]>(6).fill("detected"),
  ...Array<CropHealthAssessment["status"]>(4).fill("resolved"),
  ...Array<CropHealthAssessment["status"]>(2).fill("rejected"),
];

const CHANNEL_SETS: SignalChannel[][] = [
  ["image", "weather"],
  ["image", "trap", "weather"],
  ["sensor", "weather"],
  ["image", "sensor", "trap", "weather"],
  ["trap", "weather"],
  ["image"],
];

export const ASSESSMENTS: CropHealthAssessment[] = (() => {
  const affected = FARMS.filter((f) => f.health !== "healthy");
  const r = rng(4242);
  return STATUS_PLAN.map((status, i) => {
    const farm = affected[(i * 3) % affected.length]!;
    const threatId = threatFor(farm.cropId, i);
    const channels = CHANNEL_SETS[i % CHANNEL_SETS.length]!;
    const wet = WET_DISTRICTS.has(farm.districtId);
    const confidence = Math.round((wet ? 68 : 52) + r() * 28);
    const severity = (Math.min(5, Math.max(1, Math.round(confidence / 22))) as Severity);
    return {
      id: `MH-${farm.districtId.slice(0, 3).toUpperCase()}-${24100 + i}`,
      farmId: farm.id,
      districtId: farm.districtId,
      cropId: farm.cropId,
      threatId,
      suspected: threatName(threatId),
      confidence,
      severity,
      status,
      detectedVia: channels,
      detectedAt: isoTime(-(2 + i * 5)),
      affectedAreaHa: Math.round(farm.areaHa * (0.15 + r() * 0.5) * 10) / 10,
      evidence: evidenceFor(channels, farm.districtId, threatId, confidence),
    };
  });
})();

export const REVIEWS: ExpertReview[] = ASSESSMENTS.filter((a) =>
  ["expert_confirmed", "field_confirmed", "resolved", "rejected"].includes(a.status),
).map((a, i) => ({
  id: `R-${String(i + 1).padStart(3, "0")}`,
  assessmentId: a.id,
  reviewerId: i % 2 ? "u-expert-2" : "u-expert-1",
  reviewerName: i % 2 ? "Dr. R. Pawar" : "Dr. S. Kulkarni",
  verdict: a.status === "rejected" ? "rejected" : "confirmed",
  comment:
    a.status === "rejected"
      ? "Marked regions are abiotic scorch, not a pathogen. Advise irrigation scheduling instead."
      : "Symptoms and trap data agree with the candidate finding. Advisory released to the farmer.",
  reviewedAt: isoTime(-(1 + i * 4)),
}));

export const ADVISORIES: Advisory[] = ASSESSMENTS.filter((a) =>
  ["expert_confirmed", "field_confirmed", "resolved"].includes(a.status),
).map((a, i) => {
  const d = DISEASES.find((x) => x.id === a.threatId);
  const p = PESTS.find((x) => x.id === a.threatId);
  const src = d ?? p!;
  return {
    id: `ADV-${String(i + 1).padStart(3, "0")}`,
    assessmentId: a.id,
    farmId: a.farmId,
    title: `${a.suspected} — management for ${CROPS.find((c) => c.id === a.cropId)!.name}`,
    window: "Act within 48 hours; re-inspect after 5 days",
    cultural: src.cultural,
    biological: src.biological,
    chemical: src.chemical,
    issuedAt: isoTime(-(3 + i * 6)),
    acknowledged: i % 3 !== 0,
  };
});

export const FIELD_VISITS: FieldVisit[] = ASSESSMENTS.filter((a) =>
  ["expert_confirmed", "field_confirmed", "awaiting_validation"].includes(a.status),
)
  .slice(0, 13)
  .map((a, i) => ({
    id: `FV-${String(i + 1).padStart(3, "0")}`,
    assessmentId: a.id,
    farmId: a.farmId,
    officerId: i % 2 ? "u-officer-2" : "u-officer-1",
    officerName: i % 2 ? "M. Jadhav" : "A. Deshmukh",
    scheduledFor: isoDay(i % 4),
    status: (a.status === "field_confirmed" ? "completed" : i % 7 === 0 ? "missed" : "scheduled") as FieldVisit["status"],
    ...(a.status === "field_confirmed"
      ? { finding: `${a.suspected} present on ${a.affectedAreaHa} ha` }
      : {}),
  }));

export const FOLLOW_UPS: FollowUp[] = ASSESSMENTS.slice(0, 10).map((a, i) => ({
  id: `FU-${String(i + 1).padStart(3, "0")}`,
  assessmentId: a.id,
  dueOn: isoDay(i % 6),
  action: i % 2 ? "Re-photograph the same rows and compare lesion spread" : "Check trap counts against threshold",
  done: i % 3 === 0,
}));

/* ---------------------------------------------------------------- outbreaks */

const OUTBREAK_SPEC: { districtId: string; cropId: string; threatId: string; risk: RiskLevel; fields: number; newest?: boolean }[] = [
  { districtId: "amravati", cropId: "cotton", threatId: "american_bollworm", risk: "high", fields: 27, newest: true },
  { districtId: "yavatmal", cropId: "cotton", threatId: "pink_bollworm", risk: "high", fields: 21, newest: true },
  { districtId: "akola", cropId: "soybean", threatId: "yellow_mosaic", risk: "high", fields: 16 },
  { districtId: "wardha", cropId: "cotton", threatId: "bacterial_blight", risk: "high", fields: 12 },
  { districtId: "nagpur", cropId: "rice", threatId: "rice_blast", risk: "moderate", fields: 9 },
  { districtId: "jalgaon", cropId: "banana", threatId: "sigatoka", risk: "moderate", fields: 8 },
  { districtId: "nashik", cropId: "onion", threatId: "thrips", risk: "moderate", fields: 6 },
  { districtId: "pune", cropId: "sugarcane", threatId: "shoot_borer", risk: "low", fields: 3 },
];

export const OUTBREAKS: Outbreak[] = OUTBREAK_SPEC.map((o, i) => {
  const d = DISTRICTS.find((x) => x.id === o.districtId)!;
  const r = rng(600 + i);
  const base = o.risk === "high" ? 9 : o.risk === "moderate" ? 5 : 2;
  let v = base * 0.6;
  const trend = Array.from({ length: 7 }, () => {
    v = Math.max(0, v * (o.risk === "high" ? 1.16 : 1.04) + (r() - 0.4) * 2);
    return Math.round(v);
  });
  return {
    id: `OB-${String(i + 1).padStart(3, "0")}`,
    districtId: o.districtId,
    cropId: o.cropId,
    threatId: o.threatId,
    threatName: threatName(o.threatId),
    risk: o.risk,
    affectedFields: o.fields,
    detectedVia: (i % 2
      ? ["image", "trap", "weather"]
      : ["image", "sensor", "weather"]) as SignalChannel[],
    lastConfirmedAt: isoTime(-(2 + i * 3)),
    trapTrend: trend,
    lat: d.lat + (r() - 0.5) * 0.12,
    lon: d.lon + (r() - 0.5) * 0.12,
    newest: Boolean(o.newest),
    recommendedAction:
      o.risk === "high" ? "Field inspection required" : o.risk === "moderate" ? "Increase scouting frequency" : "Monitor trap counts",
  };
});

/* ---------------------------------------------------------------- forecasts */

export const FORECASTS: RiskForecast[] = DISTRICTS.map((d, di) => {
  const ob = OUTBREAKS.find((o) => o.districtId === d.id) ?? OUTBREAKS[0]!;
  const r = rng(7000 + di);
  const wet = WET_DISTRICTS.has(d.id);
  return {
    districtId: d.id,
    cropId: ob.cropId,
    threatId: ob.threatId,
    threatName: ob.threatName,
    updatedAt: isoTime(-1),
    days: Array.from({ length: 7 }, (_, i) => {
      const w = WEATHER.find((x) => x.districtId === d.id && x.date === isoDay(i)) ?? latestWeather(d.id);
      const score = Math.round(
        Math.min(98, (wet ? 52 : 22) + w.rhPct * 0.28 + w.leafWetnessHrs * 2.4 + r() * 10),
      );
      const risk: RiskLevel = score >= 72 ? "high" : score >= 48 ? "moderate" : "low";
      return {
        date: isoDay(i),
        risk,
        score,
        drivers: [
          `RH ${w.rhPct}%`,
          `Leaf wetness ${w.leafWetnessHrs} h`,
          `Rain ${w.rainfallMm} mm`,
          `Max ${w.tMaxC} °C`,
        ],
      };
    }),
  };
});

