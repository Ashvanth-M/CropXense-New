/**
 * Deterministic crop-specific risk derivation for the forecast page.
 * Pure functions only — seeded by district+crop, no Math.random at render.
 */
import { CROPS, DISEASES, PESTS } from "@/data/reference";
import { isoDay, WEATHER } from "@/data/seed";
import type { RiskLevel, WeatherObservation } from "@/types";

/** Small deterministic PRNG, seeded from a string. */
function seededRng(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = (h >>> 0) || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export interface DayRisk {
  date: string;
  risk: RiskLevel;
  score: number;
}

export interface IndexPoint {
  date: string;
  value: number;
}

const cropDiseaseId = (cropId: string) => CROPS.find((c) => c.id === cropId)?.diseaseIds[0];
const cropPestId = (cropId: string) => CROPS.find((c) => c.id === cropId)?.pestIds[0];

/** The primary disease/pest named for a crop, used to describe the threat driving the score. */
export function primaryThreat(cropId: string) {
  const diseaseId = cropDiseaseId(cropId);
  const pestId = cropPestId(cropId);
  const disease = DISEASES.find((d) => d.id === diseaseId);
  const pest = PESTS.find((p) => p.id === pestId);
  return { disease, pest };
}

function weatherOn(districtId: string, date: string): WeatherObservation {
  return (
    WEATHER.find((w) => w.districtId === districtId && w.date === date) ??
    WEATHER.filter((w) => w.districtId === districtId).slice(-1)[0]!
  );
}

/** Crop-specific weight applied to the raw weather signal — different crops read the same weather differently. */
function cropWeights(cropId: string) {
  const disease = DISEASES.find((d) => d.id === cropDiseaseId(cropId));
  const wetLoving = /RH above 8|wetness above|RH above 9|leaf wetness/i.test(disease?.favourable ?? "");
  return {
    rh: wetLoving ? 0.34 : 0.22,
    leafWetness: wetLoving ? 2.8 : 1.6,
    rain: wetLoving ? 0.6 : 0.3,
    base: wetLoving ? 18 : 10,
  };
}

export function dailyRisk(districtId: string, cropId: string, dayOffset: number): DayRisk {
  const date = isoDay(dayOffset);
  const w = weatherOn(districtId, date);
  const r = seededRng(`${districtId}:${cropId}:${date}`);
  const wt = cropWeights(cropId);
  const score = Math.round(
    Math.min(98, wt.base + w.rhPct * wt.rh + w.leafWetnessHrs * wt.leafWetness + w.rainfallMm * wt.rain * 0.5 + r() * 8),
  );
  const risk: RiskLevel = score >= 70 ? "high" : score >= 45 ? "moderate" : "low";
  return { date, risk, score };
}

export function sevenDayRisk(districtId: string, cropId: string): DayRisk[] {
  return Array.from({ length: 7 }, (_, i) => dailyRisk(districtId, cropId, i));
}

/** 14-day disease pressure index, seeded by district+crop, trending with weather + a crop-specific offset. */
export function diseaseIndex(districtId: string, cropId: string): IndexPoint[] {
  const r = seededRng(`disease:${districtId}:${cropId}`);
  return Array.from({ length: 14 }, (_, i) => {
    const dayOffset = i - 6;
    const date = isoDay(dayOffset);
    const w = weatherOn(districtId, date);
    const wt = cropWeights(cropId);
    const value = Math.round(
      Math.min(100, Math.max(2, wt.base * 0.8 + w.rhPct * (wt.rh * 0.9) + w.leafWetnessHrs * wt.leafWetness * 0.9 + (r() - 0.4) * 10)),
    );
    return { date, value };
  });
}

/** 14-day pest pressure index — driven more by temperature/wind than humidity. */
export function pestIndex(districtId: string, cropId: string): IndexPoint[] {
  const r = seededRng(`pest:${districtId}:${cropId}`);
  const pestId = cropPestId(cropId) ?? "generic";
  const pest = PESTS.find((p) => p.id === pestId);
  const heatLoving = /dry|heat/i.test(pest?.etl ?? "") || !/RH|wetness/i.test(pest?.etl ?? "");
  return Array.from({ length: 14 }, (_, i) => {
    const dayOffset = i - 6;
    const date = isoDay(dayOffset);
    const w = weatherOn(districtId, date);
    const base = heatLoving ? w.tMaxC * 1.6 + w.windKph * 0.4 : w.rhPct * 0.5 + w.leafWetnessHrs * 1.2;
    const value = Math.round(Math.min(100, Math.max(2, base * 0.55 + (r() - 0.4) * 12)));
    return { date, value };
  });
}

export const DISEASE_THRESHOLD = 62;
export const PEST_THRESHOLD = 55;

/** Build the "Why" prose paragraph for a given day from the actual weather + crop stage data. */
export function whyText(params: {
  dayLabel: string;
  risk: RiskLevel;
  districtWeather: WeatherObservation[];
  date: string;
  cropId: string;
  stageLabel: string;
}): { sentence: string; drivers: string[] } {
  const { dayLabel, risk, districtWeather, date, cropId, stageLabel } = params;
  const idx = districtWeather.findIndex((w) => w.date === date);
  const today = districtWeather[idx];
  const prevDay = districtWeather[idx - 1];
  const { disease, pest } = primaryThreat(cropId);
  const threatName = disease?.name ?? pest?.name ?? "the monitored threat";
  const riskWord = risk === "high" ? "High" : risk === "moderate" ? "Moderate" : "Low";

  if (!today) {
    return { sentence: `${dayLabel} — ${riskWord}. Weather data is not yet available for this day.`, drivers: [] };
  }

  const drivers: string[] = [];
  const twoNightWetness = prevDay && today.leafWetnessHrs > 10 && prevDay.leafWetnessHrs > 10;
  if (twoNightWetness) drivers.push("Leaf wetness above 10 h for two consecutive nights");
  else if (today.leafWetnessHrs > 8) drivers.push(`Leaf wetness ${today.leafWetnessHrs} h last night`);
  drivers.push(`RH ${today.rhPct}%`);
  if (today.rainfallMm > 5) drivers.push(`${today.rainfallMm} mm rain`);
  drivers.push(`${cropName(cropId)} at ${stageLabel.toLowerCase()}`);

  const consequence =
    risk === "high"
      ? `Conditions favour ${threatName.toLowerCase()} development.`
      : risk === "moderate"
        ? `Conditions are marginal for ${threatName.toLowerCase()} — watch closely over the next 2 days.`
        : `Conditions do not currently favour ${threatName.toLowerCase()}.`;

  const sentence = `${dayLabel} — ${riskWord}. ${drivers.join(", ")}. ${consequence}`;
  return { sentence, drivers };
}

function cropName(cropId: string) {
  return CROPS.find((c) => c.id === cropId)?.name ?? cropId;
}
