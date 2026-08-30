/**
 * CropXense Agricultural IoT Decision Engine.
 *
 * Converts raw microclimate hardware telemetry (DHT22 Temp, RH%, Capacitive Soil Moisture % VWC)
 * into agronomic decision intelligence:
 * 1. Soil Moisture Condition Classification (Never claims pH/NPK from capacitive moisture sensor)
 * 2. Crop Suitability Evaluation (Matches against configurable requirement ranges)
 * 3. Irrigation Recommendation (Soil moisture + crop thresholds)
 * 4. 3-Vector Crop Stress Analysis (Water, Heat, Humidity stress)
 * 5. Microclimate Pathology & Spore Risk (Fungal pressure, Heat stress, Moisture stress)
 * 6. Smart Sensor Out-of-Bounds Alerts
 */

import { AGRONOMIC_CROP_THRESHOLDS, type CropAgronomicThreshold } from "@/data/agronomicThresholds";

export type SoilConditionClass = "Very Dry" | "Dry" | "Optimal" | "Wet" | "Waterlogged";

export interface SoilConditionResult {
  condition: SoilConditionClass;
  moistureVwc: number;
  severity: "critical" | "warning" | "optimal" | "info";
  badgeColor: string;
  summary: string;
  recommendation: string;
}

export type SuitabilityCategory = "Suitable" | "Moderate" | "Poor";

export interface ParameterSuitability {
  param: "Temperature" | "Relative Humidity" | "Soil Moisture";
  currentValue: string;
  expectedRange: string;
  status: "optimal" | "acceptable" | "stress";
  icon: "check" | "alert" | "warning";
  explanation: string;
}

export interface CropSuitabilityResult {
  cropId: string;
  cropName: string;
  overall: SuitabilityCategory;
  suitabilityScore: number; // 0 - 100
  parameters: ParameterSuitability[];
  summary: string;
  disclaimer: string;
}

export type IrrigationState =
  | "Irrigation Recommended"
  | "Monitor"
  | "No Irrigation Required"
  | "Check Sensor";

export interface IrrigationRecommendationResult {
  state: IrrigationState;
  urgency: "urgent" | "moderate" | "none" | "sensor_check";
  badgeColor: string;
  reason: string;
  action: string;
  deficitPct: number;
}

export type StressLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export interface CropStressResult {
  waterStress: StressLevel;
  heatStress: StressLevel;
  humidityStress: StressLevel;
  overallStress: "NORMAL" | "MODERATE STRESS" | "HIGH WATER STRESS" | "CRITICAL HEAT STRESS" | "SEVERE MULTI-STRESS";
  primarySignal: string;
  vpdKpa: number; // Vapor Pressure Deficit approximation
}

export interface MicroclimatePathologyRiskResult {
  fungalPressure: "LOW" | "MODERATE" | "HIGH";
  heatStressRisk: "LOW" | "MODERATE" | "HIGH";
  moistureStressRisk: "LOW" | "MODERATE" | "HIGH";
  drivers: string[];
}

export interface SmartSensorAlert {
  id: string;
  type: "low_moisture" | "high_temp" | "excess_humidity" | "sensor_offline" | "probe_fault";
  severity: "critical" | "warning" | "info";
  title: string;
  currentValue: string;
  evidence: string;
  recommendation: string;
  timestamp: string;
}

/* ────────────────────────── 1. Soil Condition ────────────────────────── */

export function classifySoilMoisture(vwcPct: number): SoilConditionResult {
  if (vwcPct < 15) {
    return {
      condition: "Very Dry",
      moistureVwc: vwcPct,
      severity: "critical",
      badgeColor: "text-alert bg-alert/10 border-alert/30",
      summary: "⚠ Critical water deficit in root zone",
      recommendation: "Inspect irrigation line and root-zone moisture immediately. Probe may be unseated or root zone is desiccated.",
    };
  }

  if (vwcPct < 30) {
    return {
      condition: "Dry",
      moistureVwc: vwcPct,
      severity: "warning",
      badgeColor: "text-amber bg-amber/10 border-amber/30",
      summary: "Mild moisture deficit approaching crop wilting point",
      recommendation: "Schedule irrigation within the next watering cycle to maintain active physiological uptake.",
    };
  }

  if (vwcPct <= 65) {
    return {
      condition: "Optimal",
      moistureVwc: vwcPct,
      severity: "optimal",
      badgeColor: "text-forest bg-forest/10 border-forest/30",
      summary: "Field capacity ideal for active crop transpiration & nutrient transport",
      recommendation: "Maintain current irrigation cadence. Soil water tension is in the optimal vegetative range.",
    };
  }

  if (vwcPct <= 85) {
    return {
      condition: "Wet",
      moistureVwc: vwcPct,
      severity: "info",
      badgeColor: "text-water bg-water/10 border-water/30",
      summary: "Elevated soil moisture with reduced pore air space",
      recommendation: "Withhold irrigation. Monitor field drainage to preserve adequate root-zone oxygenation.",
    };
  }

  return {
    condition: "Waterlogged",
    moistureVwc: vwcPct,
    severity: "critical",
    badgeColor: "text-alert bg-alert/10 border-alert/30",
    summary: "⚠ Soil saturation risk: potential root asphyxiation & fungal rots",
    recommendation: "Check field drainage channels to prevent standing water accumulation and root rots (Pythium/Phytophthora).",
  };
}

/* ────────────────────────── 2. Crop Suitability Engine ────────────────────────── */

export function evaluateCropSuitability(
  cropId: string,
  temp: number,
  rh: number,
  soilMoisture: number,
): CropSuitabilityResult {
  const crop = AGRONOMIC_CROP_THRESHOLDS[cropId] || AGRONOMIC_CROP_THRESHOLDS.cotton!;
  let score = 100;
  const parameters: ParameterSuitability[] = [];

  // 1. Temperature evaluation
  const tCfg = crop.temperature;
  let tStatus: ParameterSuitability["status"] = "optimal";
  let tExplanation = "Within optimal physiological range";

  if (temp < tCfg.min) {
    tStatus = "stress";
    tExplanation = `Temperature (${temp.toFixed(1)}°C) is below minimum baseline (${tCfg.min}°C)`;
    score -= 25;
  } else if (temp > tCfg.max) {
    tStatus = "stress";
    tExplanation = `Temperature (${temp.toFixed(1)}°C) exceeds thermal ceiling (${tCfg.max}°C)`;
    score -= 30;
  } else if (temp < tCfg.optMin || temp > tCfg.optMax) {
    tStatus = "acceptable";
    tExplanation = `Temperature (${temp.toFixed(1)}°C) is acceptable but outside preferred range (${tCfg.optMin}–${tCfg.optMax}°C)`;
    score -= 10;
  }

  parameters.push({
    param: "Temperature",
    currentValue: `${temp.toFixed(1)}°C`,
    expectedRange: `${tCfg.optMin}–${tCfg.optMax}°C (Opt)`,
    status: tStatus,
    icon: tStatus === "optimal" ? "check" : tStatus === "acceptable" ? "warning" : "alert",
    explanation: tExplanation,
  });

  // 2. Humidity evaluation
  const hCfg = crop.humidity;
  let hStatus: ParameterSuitability["status"] = "optimal";
  let hExplanation = "Within optimal transpiration range";

  if (rh < hCfg.min) {
    hStatus = "stress";
    hExplanation = `Relative humidity (${rh.toFixed(0)}%) is too dry, increasing atmospheric evaporative demand`;
    score -= 20;
  } else if (rh > hCfg.max) {
    hStatus = "stress";
    hExplanation = `Relative humidity (${rh.toFixed(0)}%) is excessively high, reducing transpiration and elevating fungal risk`;
    score -= 25;
  } else if (rh < hCfg.optMin || rh > hCfg.optMax) {
    hStatus = "acceptable";
    hExplanation = `Humidity (${rh.toFixed(0)}%) is acceptable but outside preferred band (${hCfg.optMin}–${hCfg.optMax}%)`;
    score -= 10;
  }

  parameters.push({
    param: "Relative Humidity",
    currentValue: `${rh.toFixed(0)}%`,
    expectedRange: `${hCfg.optMin}–${hCfg.optMax}% (Opt)`,
    status: hStatus,
    icon: hStatus === "optimal" ? "check" : hStatus === "acceptable" ? "warning" : "alert",
    explanation: hExplanation,
  });

  // 3. Soil Moisture evaluation
  const sCfg = crop.soilMoisture;
  let sStatus: ParameterSuitability["status"] = "optimal";
  let sExplanation = "Soil moisture within optimal field capacity band";

  if (soilMoisture < crop.criticalStressVwc) {
    sStatus = "stress";
    sExplanation = `Soil moisture (${soilMoisture.toFixed(0)}%) is below critical threshold (${crop.criticalStressVwc}% VWC)`;
    score -= 35;
  } else if (soilMoisture > sCfg.max) {
    sStatus = "stress";
    sExplanation = `Soil moisture (${soilMoisture.toFixed(0)}%) exceeds upper threshold (${sCfg.max}% VWC)`;
    score -= 30;
  } else if (soilMoisture < sCfg.optMin || soilMoisture > sCfg.optMax) {
    sStatus = "acceptable";
    sExplanation = `Soil moisture (${soilMoisture.toFixed(0)}%) is acceptable but outside preferred range (${sCfg.optMin}–${sCfg.optMax}%)`;
    score -= 15;
  }

  parameters.push({
    param: "Soil Moisture",
    currentValue: `${soilMoisture.toFixed(0)}% VWC`,
    expectedRange: `${sCfg.optMin}–${sCfg.optMax}% VWC (Opt)`,
    status: sStatus,
    icon: sStatus === "optimal" ? "check" : sStatus === "acceptable" ? "warning" : "alert",
    explanation: sExplanation,
  });

  score = Math.max(0, Math.min(100, score));

  const overall: SuitabilityCategory = score >= 75 ? "Suitable" : score >= 45 ? "Moderate" : "Poor";

  const summary =
    overall === "Suitable"
      ? `Current microclimate and root-zone moisture are well-aligned with ${crop.name} physiological requirements.`
      : overall === "Moderate"
        ? `Current conditions support ${crop.name} with minor environmental friction (review highlighted parameters).`
        : `Current conditions indicate severe environmental stress for ${crop.name}. Immediate management intervention required.`;

  return {
    cropId: crop.id,
    cropName: crop.name,
    overall,
    suitabilityScore: score,
    parameters,
    summary,
    disclaimer: "These are environmental suitability recommendations based on real-time microclimate thresholds, NOT guaranteed yield predictions.",
  };
}

/* ────────────────────────── 3. Irrigation Recommendation ────────────────────────── */

export function computeIrrigationRecommendation(
  soilMoisture: number,
  cropId: string,
  temp: number,
): IrrigationRecommendationResult {
  const crop = AGRONOMIC_CROP_THRESHOLDS[cropId] || AGRONOMIC_CROP_THRESHOLDS.cotton!;
  const threshold = crop.irrigationThresholdVwc;
  const critical = crop.criticalStressVwc;

  if (soilMoisture <= 0) {
    return {
      state: "Check Sensor",
      urgency: "sensor_check",
      badgeColor: "bg-amber/10 border-amber text-amber",
      reason: "Sensor reading 0% VWC. Probe may be disconnected, unseated, or in open air.",
      action: "Verify physical sensor placement in soil before initiating heavy irrigation.",
      deficitPct: 100,
    };
  }

  if (soilMoisture <= critical) {
    return {
      state: "Irrigation Recommended",
      urgency: "urgent",
      badgeColor: "bg-alert/10 border-alert text-alert",
      reason: `Soil moisture (${soilMoisture.toFixed(0)}% VWC) is below the critical stress threshold (${critical}% VWC) for ${crop.name}.`,
      action: "Inspect irrigation system and apply root-zone watering to prevent permanent crop wilting.",
      deficitPct: Math.round(((crop.soilMoisture.optMin - soilMoisture) / crop.soilMoisture.optMin) * 100),
    };
  }

  if (soilMoisture < threshold) {
    return {
      state: "Irrigation Recommended",
      urgency: "moderate",
      badgeColor: "bg-water/10 border-water text-water",
      reason: `Soil moisture (${soilMoisture.toFixed(0)}% VWC) has fallen below preferred threshold (${threshold}% VWC)${temp > 32 ? " during high thermal demand" : ""}.`,
      action: "Schedule irrigation in the next available watering window.",
      deficitPct: Math.round(((crop.soilMoisture.optMin - soilMoisture) / crop.soilMoisture.optMin) * 100),
    };
  }

  if (soilMoisture <= crop.soilMoisture.optMax) {
    return {
      state: "No Irrigation Required",
      urgency: "none",
      badgeColor: "bg-forest/10 border-forest text-forest",
      reason: `Soil moisture (${soilMoisture.toFixed(0)}% VWC) is in the optimal range (${crop.soilMoisture.optMin}–${crop.soilMoisture.optMax}% VWC) for ${crop.name}.`,
      action: "Maintain current irrigation cadence. No supplemental water required at this time.",
      deficitPct: 0,
    };
  }

  return {
    state: "Monitor",
    urgency: "none",
    badgeColor: "bg-amber/10 border-amber text-amber",
    reason: `Soil moisture (${soilMoisture.toFixed(0)}% VWC) is elevated above optimal field capacity band.`,
    action: "Withhold irrigation and monitor surface drainage channels.",
    deficitPct: 0,
  };
}

/* ────────────────────────── 4. Crop Stress Analysis ────────────────────────── */

export function computeCropStress(
  temp: number,
  rh: number,
  soilMoisture: number,
  cropId: string,
): CropStressResult {
  const crop = AGRONOMIC_CROP_THRESHOLDS[cropId] || AGRONOMIC_CROP_THRESHOLDS.cotton!;

  // Approximate Vapor Pressure Deficit (VPD in kPa)
  const svp = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
  const avp = svp * (rh / 100);
  const vpdKpa = Math.max(0, svp - avp);

  // 1. Water stress
  let waterStress: StressLevel = "LOW";
  if (soilMoisture <= crop.criticalStressVwc) waterStress = "CRITICAL";
  else if (soilMoisture < crop.irrigationThresholdVwc) waterStress = "HIGH";
  else if (soilMoisture < crop.soilMoisture.optMin) waterStress = "MODERATE";

  // 2. Heat stress
  let heatStress: StressLevel = "LOW";
  if (temp > crop.temperature.max) heatStress = "CRITICAL";
  else if (temp > crop.temperature.optMax + 3) heatStress = "HIGH";
  else if (temp > crop.temperature.optMax) heatStress = "MODERATE";

  // 3. Humidity stress (too dry -> high VPD transpiration stress; too humid -> fungal spore stagnation)
  let humidityStress: StressLevel = "LOW";
  if (rh < 35 || rh > 92) humidityStress = "HIGH";
  else if (rh < crop.humidity.optMin || rh > crop.humidity.optMax) humidityStress = "MODERATE";

  // Overall stress classification & primary signal
  let overallStress: CropStressResult["overallStress"] = "NORMAL";
  let primarySignal = "All microclimate telemetry indicators are within physiological safety boundaries.";

  if (waterStress === "CRITICAL" || waterStress === "HIGH") {
    overallStress = "HIGH WATER STRESS";
    primarySignal = `Primary signal: critically low soil moisture (${soilMoisture.toFixed(0)}% VWC vs ${crop.soilMoisture.optMin}% min).`;
  } else if (heatStress === "CRITICAL" || heatStress === "HIGH") {
    overallStress = "CRITICAL HEAT STRESS";
    primarySignal = `Primary signal: elevated canopy temperature (${temp.toFixed(1)}°C vs ${crop.temperature.optMax}°C max).`;
  } else if (waterStress === "MODERATE" && heatStress === "MODERATE") {
    overallStress = "MODERATE STRESS";
    primarySignal = "Combined moisture deficit and elevated ambient thermal load.";
  } else if (waterStress !== "LOW" || heatStress !== "LOW" || humidityStress !== "LOW") {
    overallStress = "MODERATE STRESS";
    primarySignal = `Primary signal: ${waterStress !== "LOW" ? "moisture deficit" : heatStress !== "LOW" ? "heat load" : "humidity fluctuation"}.`;
  }

  return {
    waterStress,
    heatStress,
    humidityStress,
    overallStress,
    primarySignal,
    vpdKpa,
  };
}

/* ────────────────────────── 5. Microclimate Pathology & Spore Risk ────────────────────────── */

export function computeMicroclimatePathologyRisk(
  temp: number,
  rh: number,
  soilMoisture: number,
): MicroclimatePathologyRiskResult {
  const drivers: string[] = [];

  // Fungal spore germination pressure
  let fungalPressure: "LOW" | "MODERATE" | "HIGH" = "LOW";
  if (rh >= 78 && temp >= 22 && temp <= 32) {
    fungalPressure = "HIGH";
    drivers.push(`High relative humidity (${rh.toFixed(0)}%) & warm temperature (${temp.toFixed(1)}°C) create peak fungal spore incubation conditions.`);
  } else if (rh >= 68 && temp >= 20 && temp <= 34) {
    fungalPressure = "MODERATE";
    drivers.push(`Moderate relative humidity (${rh.toFixed(0)}%) supports foliar disease development.`);
  } else {
    drivers.push(`Humidity (${rh.toFixed(0)}%) is currently unfavorable for rapid fungal spore germination.`);
  }

  // Heat stress risk
  let heatStressRisk: "LOW" | "MODERATE" | "HIGH" = "LOW";
  if (temp >= 38) {
    heatStressRisk = "HIGH";
    drivers.push(`Ambient temperature (${temp.toFixed(1)}°C) exceeds upper thermal tolerance ceiling.`);
  } else if (temp >= 33) {
    heatStressRisk = "MODERATE";
    drivers.push(`Elevated ambient temperature (${temp.toFixed(1)}°C) increases evapotranspiration demand.`);
  }

  // Moisture / Desiccation risk
  let moistureStressRisk: "LOW" | "MODERATE" | "HIGH" = "LOW";
  if (soilMoisture <= 18) {
    moistureStressRisk = "HIGH";
    drivers.push(`Soil moisture (${soilMoisture.toFixed(0)}% VWC) is in critical desiccation zone.`);
  } else if (soilMoisture >= 85) {
    moistureStressRisk = "HIGH";
    drivers.push(`Soil moisture (${soilMoisture.toFixed(0)}% VWC) indicates saturation and root rot vulnerability.`);
  } else if (soilMoisture <= 30) {
    moistureStressRisk = "MODERATE";
    drivers.push(`Soil moisture (${soilMoisture.toFixed(0)}% VWC) is below preferred moisture reserves.`);
  }

  return {
    fungalPressure,
    heatStressRisk,
    moistureStressRisk,
    drivers,
  };
}

/* ────────────────────────── 6. Smart Sensor Alerts ────────────────────────── */

export function generateSmartSensorAlerts(
  temp: number,
  rh: number,
  soilMoisture: number,
  status: "connected" | "simulated" | "stale" | "offline",
  cropId: string = "cotton",
): SmartSensorAlert[] {
  const alerts: SmartSensorAlert[] = [];
  const now = new Date().toISOString();
  const crop = AGRONOMIC_CROP_THRESHOLDS[cropId] || AGRONOMIC_CROP_THRESHOLDS.cotton!;

  // 1. Connection / Offline Alert
  if (status === "offline") {
    alerts.push({
      id: "alert-offline",
      type: "sensor_offline",
      severity: "warning",
      title: "Sensor Node Offline",
      currentValue: "Offline",
      evidence: "No active serial telemetry connection detected on Web Serial port.",
      recommendation: "Connect USB hardware or enable simulation mode to stream live microclimate readings.",
      timestamp: now,
    });
  }

  // 2. Low Soil Moisture Alert
  if (soilMoisture <= crop.criticalStressVwc) {
    alerts.push({
      id: "alert-moisture-crit",
      type: "low_moisture",
      severity: "critical",
      title: "Low Soil Moisture Alert",
      currentValue: `${soilMoisture.toFixed(0)}% VWC`,
      evidence: `Soil moisture (${soilMoisture.toFixed(0)}% VWC) is below critical threshold (${crop.criticalStressVwc}% VWC) for ${crop.name}.`,
      recommendation: "Inspect irrigation line and verify physical sensor probe placement in the active root zone.",
      timestamp: now,
    });
  } else if (soilMoisture < crop.irrigationThresholdVwc) {
    alerts.push({
      id: "alert-moisture-warn",
      type: "low_moisture",
      severity: "warning",
      title: "Soil Moisture Below Target",
      currentValue: `${soilMoisture.toFixed(0)}% VWC`,
      evidence: `Soil moisture has fallen below the configured irrigation trigger (${crop.irrigationThresholdVwc}% VWC).`,
      recommendation: "Schedule irrigation in the upcoming watering window.",
      timestamp: now,
    });
  }

  // 3. High Temperature Alert
  if (temp > crop.temperature.optMax + 2) {
    alerts.push({
      id: "alert-temp-high",
      type: "high_temp",
      severity: temp > crop.temperature.max ? "critical" : "warning",
      title: temp > crop.temperature.max ? "Critical Heat Stress" : "High Canopy Temperature",
      currentValue: `${temp.toFixed(1)}°C`,
      evidence: `Temperature (${temp.toFixed(1)}°C) exceeds preferred upper limit (${crop.temperature.optMax}°C).`,
      recommendation: "Ensure adequate root-zone hydration to support evaporative canopy cooling.",
      timestamp: now,
    });
  }

  // 4. Excess Humidity Alert
  if (rh >= 80) {
    alerts.push({
      id: "alert-humidity-high",
      type: "excess_humidity",
      severity: "warning",
      title: "Excess Foliar Humidity",
      currentValue: `${rh.toFixed(0)}% RH`,
      evidence: `Relative humidity (${rh.toFixed(0)}%) creates high disease spore germination pressure.`,
      recommendation: "Inspect crop foliage for early foliar lesion hotspots; avoid overhead sprinkling.",
      timestamp: now,
    });
  }

  return alerts;
}
