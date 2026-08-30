/**
 * CropXense Multi-Source Weighted Pathology Scoring Engine
 *
 * Combines multi-modal inputs into a unified epidemiological risk score:
 *   Final Risk Score = 0.50 * S_Visual + 0.20 * S_RH + 0.15 * S_Temp + 0.15 * S_Soil
 *
 * Implements Dynamic Re-normalization:
 * If physical hardware is disconnected or omitted, the scoring engine dynamically
 * re-normalizes weights across available channels (or falls back to district Open-Meteo weather),
 * ensuring hardware connectivity remains strictly non-compulsory.
 */

export interface MultiSourceInput {
  visualScore?: number;        // 0-100: from Computer Vision necrosis/chlorosis & symptom matching
  temperature?: number;        // °C: from Arduino DHT22 or Open-Meteo fallback
  humidity?: number;           // % RH: from Arduino DHT22 or Open-Meteo fallback
  soilMoisture?: number;       // % VWC: from Arduino Soil Probe (optional)
  isHardwareLive?: boolean;    // true if reading is from live/simulated microcontroller
}

export interface MultiSourceRiskResult {
  finalRiskScore: number;      // 0 - 100
  riskLevel: "low" | "moderate" | "high" | "critical";
  isHardwareSourced: boolean;
  weights: {
    visual: number;
    humidity: number;
    temperature: number;
    soil: number;
  };
  subScores: {
    visual: number;
    humidity: number;
    temperature: number;
    soil: number;
  };
  drivers: string[];
}

/**
 * Calculate Temperature Risk Sub-score S_Temp (0-100)
 * Optimal pathogen proliferation occurs between 24°C and 32°C.
 */
export function calculateTemperatureSubScore(temp: number): number {
  if (temp >= 24 && temp <= 32) {
    // Peak proliferation window (e.g. 28°C -> 95)
    const distFromPeak = Math.abs(temp - 28);
    return Math.round(95 - distFromPeak * 5);
  } else if (temp > 32 && temp <= 38) {
    return Math.round(75 - (temp - 32) * 6);
  } else if (temp >= 18 && temp < 24) {
    return Math.round(65 - (24 - temp) * 5);
  } else if (temp < 18) {
    return Math.max(15, Math.round(40 - (18 - temp) * 3));
  } else {
    // Extreme heat > 38°C (pest pressure may persist, but fungal spores dry)
    return Math.max(20, Math.round(40 - (temp - 38) * 4));
  }
}

/**
 * Calculate Relative Humidity Risk Sub-score S_RH (0-100)
 * High humidity (RH >= 75%) drastically accelerates fungal & bacterial infection rates.
 */
export function calculateHumiditySubScore(rh: number): number {
  if (rh >= 88) return 96;
  if (rh >= 80) return Math.round(80 + (rh - 80) * 2);
  if (rh >= 70) return Math.round(60 + (rh - 70) * 2);
  if (rh >= 55) return Math.round(35 + (rh - 55) * 1.6);
  return Math.max(10, Math.round(rh * 0.6));
}

/**
 * Calculate Soil Moisture Risk Sub-score S_Soil (0-100)
 * Excessive water-logging (> 75% VWC) promotes Pythium/Phytophthora root rot & damping off.
 * Extreme moisture stress (< 25% VWC) weakens plant immunity.
 */
export function calculateSoilMoistureSubScore(soilPct: number): number {
  if (soilPct >= 80) {
    // Severe waterlogging -> high root rot risk
    return Math.min(95, Math.round(70 + (soilPct - 80) * 1.5));
  } else if (soilPct >= 65) {
    // Elevated moisture
    return Math.round(50 + (soilPct - 65) * 1.2);
  } else if (soilPct >= 40) {
    // Optimum field capacity (35-60%) -> lowest physiological disease predisposition
    return 20;
  } else if (soilPct >= 20) {
    // Moderate moisture stress
    return Math.round(35 + (40 - soilPct) * 1.2);
  } else {
    // Severe desiccation stress -> predisposes to opportunistic pests/wilt
    return Math.min(85, Math.round(60 + (20 - soilPct) * 2));
  }
}

/**
 * Multi-Source Weighted Scoring Engine with Dynamic Re-normalization
 */
export function computeMultiSourceRiskScore(input: MultiSourceInput): MultiSourceRiskResult {
  const visual = Math.max(0, Math.min(100, input.visualScore ?? 50));
  const temp = input.temperature ?? 28;
  const rh = input.humidity ?? 70;
  const hasSoil = input.soilMoisture !== undefined && !isNaN(input.soilMoisture);

  const sVisual = visual;
  const sRH = calculateHumiditySubScore(rh);
  const sTemp = calculateTemperatureSubScore(temp);
  const sSoil = hasSoil ? calculateSoilMoistureSubScore(input.soilMoisture!) : 0;

  // Base Ideal Weights: 0.50 Visual, 0.20 RH, 0.15 Temp, 0.15 Soil
  let wVisual = 0.50;
  let wRH = 0.20;
  let wTemp = 0.15;
  let wSoil = hasSoil ? 0.15 : 0.0;

  // Dynamic Re-normalization so weights strictly sum to 1.00
  const totalWeight = wVisual + wRH + wTemp + wSoil;
  wVisual = parseFloat((wVisual / totalWeight).toFixed(3));
  wRH = parseFloat((wRH / totalWeight).toFixed(3));
  wTemp = parseFloat((wTemp / totalWeight).toFixed(3));
  wSoil = parseFloat((wSoil / totalWeight).toFixed(3));

  const finalScore = Math.round(
    wVisual * sVisual +
    wRH * sRH +
    wTemp * sTemp +
    wSoil * sSoil
  );

  const clampedScore = Math.max(5, Math.min(99, finalScore));

  let riskLevel: MultiSourceRiskResult["riskLevel"] = "low";
  if (clampedScore >= 75) riskLevel = "critical";
  else if (clampedScore >= 55) riskLevel = "high";
  else if (clampedScore >= 35) riskLevel = "moderate";
  else riskLevel = "low";

  // Generate actionable agronomic risk drivers
  const drivers: string[] = [];
  if (sVisual >= 60) {
    drivers.push(`Visual pathology indicates significant necrotic lesion/chlorosis coverage (${visual}% match score).`);
  }
  if (rh >= 75) {
    drivers.push(`Favorable humidity (${rh}% RH) exceeds the 75% threshold for active fungal spore germination.`);
  }
  if (temp >= 24 && temp <= 32) {
    drivers.push(`Canopy temperature (${temp.toFixed(1)}°C) is within peak pathogen reproduction band.`);
  }
  if (hasSoil && input.soilMoisture! >= 75) {
    drivers.push(`Soil saturation (${input.soilMoisture!.toFixed(1)}% VWC) elevates root rot and damping-off predisposition.`);
  } else if (hasSoil && input.soilMoisture! <= 25) {
    drivers.push(`Soil moisture deficit (${input.soilMoisture!.toFixed(1)}% VWC) is inducing plant stress.`);
  }

  if (drivers.length === 0) {
    drivers.push("Microclimate and foliar parameters are within stable baseline limits.");
  }

  return {
    finalRiskScore: clampedScore,
    riskLevel,
    isHardwareSourced: !!input.isHardwareLive,
    weights: {
      visual: wVisual,
      humidity: wRH,
      temperature: wTemp,
      soil: wSoil,
    },
    subScores: {
      visual: sVisual,
      humidity: sRH,
      temperature: sTemp,
      soil: sSoil,
    },
    drivers,
  };
}
