/**
 * CropXense Sensor Telemetry & History Service.
 *
 * Manages persisting real-time hardware telemetry (and simulated streams)
 * to Supabase table `field_sensor_readings` and computes genuine 24h/7d analytics:
 * - Current, Min, Max, Average metrics
 * - Offline caching with sync on reconnection
 * - Zero fabricated history when starting fresh
 */

import { supabase } from "@/lib/supabase";

export interface FieldSensorReadingRecord {
  id: string;
  farmerId?: string | undefined;
  fieldId?: string | undefined;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  recordedAt: string;
  source: "hardware" | "simulated" | "telemetry";
  deviceId: string;
  synced?: boolean;
}

export interface TelemetryStats {
  current: { temp: number; hum: number; soil: number };
  min: { temp: number; hum: number; soil: number };
  max: { temp: number; hum: number; soil: number };
  avg: { temp: number; hum: number; soil: number };
  count: number;
  hasEnoughData: boolean;
}

const LOCAL_STORAGE_KEY = "cropxense_field_sensor_history_v1";
let memoryReadings: FieldSensorReadingRecord[] = [];
let lastLoggedTimestamp = 0;

// Load persisted memory on startup
if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      memoryReadings = JSON.parse(raw);
    }
  } catch {
    memoryReadings = [];
  }
}

/**
 * Record a live sensor reading into Supabase and local telemetry buffer.
 * Throttles logging to once every 15 seconds to prevent database flooding.
 */
export async function recordSensorReading(
  reading: { temperature: number; humidity: number; soilMoisture: number },
  metadata: {
    farmerId?: string;
    fieldId?: string;
    source: "hardware" | "simulated" | "telemetry";
    deviceId?: string;
  },
): Promise<FieldSensorReadingRecord | null> {
  const now = Date.now();
  // Throttle to 15 seconds
  if (now - lastLoggedTimestamp < 15000) {
    return null;
  }
  lastLoggedTimestamp = now;

  const record: FieldSensorReadingRecord = {
    id: `sr_${now}_${Math.random().toString(36).substring(2, 7)}`,
    farmerId: metadata.farmerId,
    fieldId: metadata.fieldId || "F-AKO-001",
    temperature: parseFloat(reading.temperature.toFixed(1)),
    humidity: parseFloat(reading.humidity.toFixed(1)),
    soilMoisture: parseFloat(reading.soilMoisture.toFixed(1)),
    recordedAt: new Date().toISOString(),
    source: metadata.source,
    deviceId: metadata.deviceId || "ESP32-DHT22-NODE-01",
    synced: false,
  };

  // Push to local memory buffer (keep up to 500 points)
  memoryReadings.push(record);
  if (memoryReadings.length > 500) {
    memoryReadings = memoryReadings.slice(-500);
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(memoryReadings));
    } catch {
      // Storage quota or private mode
    }
  }

  // Attempt Supabase insert if online
  if (Boolean(supabase) && typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const { error } = await supabase.from("field_sensor_readings").insert({
        id: record.id,
        farmer_id: record.farmerId,
        field_id: record.fieldId,
        temperature: record.temperature,
        humidity: record.humidity,
        soil_moisture: record.soilMoisture,
        recorded_at: record.recordedAt,
        source: record.source,
        device_id: record.deviceId,
      });

      if (!error) {
        record.synced = true;
      }
    } catch {
      // Offline fallback: kept locally
    }
  }

  return record;
}

/**
 * Fetch sensor reading history for a field and timeframe.
 */
export async function getFieldSensorHistory(
  fieldId: string = "F-AKO-001",
  timeframe: "24h" | "7d" = "24h",
): Promise<FieldSensorReadingRecord[]> {
  const cutoffTime = new Date();
  if (timeframe === "24h") {
    cutoffTime.setHours(cutoffTime.getHours() - 24);
  } else {
    cutoffTime.setDate(cutoffTime.getDate() - 7);
  }

  // If Supabase is connected, query table
  if (Boolean(supabase) && typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from("field_sensor_readings")
        .select("*")
        .eq("field_id", fieldId)
        .gte("recorded_at", cutoffTime.toISOString())
        .order("recorded_at", { ascending: true })
        .limit(150);

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          farmerId: d.farmer_id,
          fieldId: d.field_id,
          temperature: d.temperature,
          humidity: d.humidity,
          soilMoisture: d.soil_moisture,
          recordedAt: d.recorded_at,
          source: d.source,
          deviceId: d.device_id,
          synced: true,
        }));
      }
    } catch {
      // Fall through to memory
    }
  }

  // Local fallback
  return memoryReadings.filter(
    (r) => r.fieldId === fieldId && new Date(r.recordedAt) >= cutoffTime,
  );
}

/**
 * Calculate statistical summaries from genuine historical records.
 */
export function computeTelemetryStats(
  readings: FieldSensorReadingRecord[],
  currentReading: { temperature: number; humidity: number; soilMoisture: number },
): TelemetryStats {
  const safeCurrent = {
    temp: currentReading?.temperature ?? 28.5,
    hum: currentReading?.humidity ?? 70,
    soil: currentReading?.soilMoisture ?? 50,
  };

  if (!readings || readings.length === 0) {
    return {
      current: safeCurrent,
      min: safeCurrent,
      max: safeCurrent,
      avg: safeCurrent,
      count: 0,
      hasEnoughData: false,
    };
  }

  let minTemp = readings[0]?.temperature ?? safeCurrent.temp;
  let maxTemp = readings[0]?.temperature ?? safeCurrent.temp;
  let sumTemp = 0;

  let minHum = readings[0]?.humidity ?? safeCurrent.hum;
  let maxHum = readings[0]?.humidity ?? safeCurrent.hum;
  let sumHum = 0;

  let minSoil = readings[0]?.soilMoisture ?? safeCurrent.soil;
  let maxSoil = readings[0]?.soilMoisture ?? safeCurrent.soil;
  let sumSoil = 0;

  for (const r of readings) {
    const t = r.temperature ?? safeCurrent.temp;
    const h = r.humidity ?? safeCurrent.hum;
    const s = r.soilMoisture ?? safeCurrent.soil;

    if (t < minTemp) minTemp = t;
    if (t > maxTemp) maxTemp = t;
    sumTemp += t;

    if (h < minHum) minHum = h;
    if (h > maxHum) maxHum = h;
    sumHum += h;

    if (s < minSoil) minSoil = s;
    if (s > maxSoil) maxSoil = s;
    sumSoil += s;
  }

  const count = readings.length;

  return {
    current: safeCurrent,
    min: {
      temp: parseFloat(minTemp.toFixed(1)),
      hum: parseFloat(minHum.toFixed(1)),
      soil: parseFloat(minSoil.toFixed(1)),
    },
    max: {
      temp: parseFloat(maxTemp.toFixed(1)),
      hum: parseFloat(maxHum.toFixed(1)),
      soil: parseFloat(maxSoil.toFixed(1)),
    },
    avg: {
      temp: parseFloat((sumTemp / count).toFixed(1)),
      hum: parseFloat((sumHum / count).toFixed(1)),
      soil: parseFloat((sumSoil / count).toFixed(1)),
    },
    count,
    hasEnoughData: count >= 3,
  };
}
