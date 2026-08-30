/**
 * CropXense Agricultural IoT Decision System (ArduinoStatusCard).
 *
 * Converts live DHT22 and Capacitive Soil Moisture hardware telemetry into
 * agronomic intelligence:
 * 1. Live Hardware Panel (Web Serial API, 115200 baud, Simulator, Calibration, Raw Terminal)
 * 2. Soil Moisture Condition Classification (0-100% VWC -> Very Dry, Dry, Optimal, Wet, Waterlogged)
 * 3. Crop Suitability Engine (Cotton, Soybean, Rice, Wheat, Tomato, Onion, Banana, Sugarcane)
 * 4. Irrigation Recommendation (Soil moisture + crop requirements)
 * 5. 3-Vector Crop Stress Analysis (Water, Heat, Humidity stress + Primary Driving Signal)
 * 6. Microclimate Pathology & Spore Risk (Fungal Pressure, Heat Stress, Moisture Stress)
 * 7. Crop-Wise Sensor Interpretation (Current vs Agronomic Baseline Ranges)
 * 8. Sensor History Analytics (24h / 7d Min, Max, Avg, Current without fabricated data)
 * 9. Smart Sensor Alerts Center
 * 10. Sensor Data -> CropXense Pipeline Visualizer
 */

import { useState, useEffect, useMemo } from "react";
import {
  Cpu,
  Thermometer,
  Droplets,
  Sprout,
  Radio,
  Terminal,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  Square,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  Zap,
  Info,
  ShieldAlert,
  Flame,
  Waves,
  ArrowRight,
  TrendingUp,
  Clock,
  Database,
  Layers,
  HelpCircle,
  Activity,
  Calendar,
  Check,
} from "lucide-react";
import { useArduinoSerial } from "@/hooks/useArduinoSerial";
import {
  classifySoilMoisture,
  evaluateCropSuitability,
  computeIrrigationRecommendation,
  computeCropStress,
  computeMicroclimatePathologyRisk,
  generateSmartSensorAlerts,
  type SoilConditionResult,
  type CropSuitabilityResult,
  type IrrigationRecommendationResult,
  type CropStressResult,
  type MicroclimatePathologyRiskResult,
  type SmartSensorAlert,
} from "@/services/iotDecisionEngine";
import {
  recordSensorReading,
  getFieldSensorHistory,
  computeTelemetryStats,
  type FieldSensorReadingRecord,
  type TelemetryStats,
} from "@/services/sensorTelemetryService";
import { AGRONOMIC_CROP_THRESHOLDS } from "@/data/agronomicThresholds";
import { CROPS } from "@/data/reference";
import { cx } from "@/lib/cx";
import { useAuth } from "@/auth/AuthContext";

interface ArduinoStatusCardProps {
  className?: string;
  cropId?: string;
  fieldId?: string;
  onCropChange?: (cropId: string) => void;
}

export function ArduinoStatusCard({
  className,
  cropId: controlledCropId,
  fieldId = "F-AKO-001",
  onCropChange,
}: ArduinoStatusCardProps) {
  const { user } = useAuth();
  const {
    isSupported,
    isConnected,
    isStale,
    isSimulated,
    status,
    reading,
    anomaly,
    rawLogs,
    connect,
    disconnect,
    toggleSimulated,
    setManualReading,
  } = useArduinoSerial();

  const safeTemp = typeof reading?.temperature === "number" ? reading.temperature : 28.5;
  const safeHum = typeof reading?.humidity === "number" ? reading.humidity : 74.0;
  const safeSoil = typeof reading?.soilMoisture === "number" ? reading.soilMoisture : 65.0;

  // Internal crop selection if not controlled externally
  const [internalCropId, setInternalCropId] = useState<string>(controlledCropId || "cotton");
  const activeCropId = controlledCropId || internalCropId;

  function handleSelectCrop(id: string) {
    setInternalCropId(id);
    if (onCropChange) onCropChange(id);
  }

  // UI Drawer states
  const [showTerminal, setShowTerminal] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [showPipeline, setShowPipeline] = useState(false);
  const [showAllCrops, setShowAllCrops] = useState(false);
  const [historyTimeframe, setHistoryTimeframe] = useState<"24h" | "7d">("24h");
  const [calibTemp, setCalibTemp] = useState<number>(safeTemp);
  const [calibHum, setCalibHum] = useState<number>(safeHum);
  const [calibSoil, setCalibSoil] = useState<number>(safeSoil);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Historical Telemetry State
  const [historyRecords, setHistoryRecords] = useState<FieldSensorReadingRecord[]>([]);

  // Periodic Telemetry Logging
  useEffect(() => {
    if (isConnected || isSimulated) {
      recordSensorReading(
        { temperature: safeTemp, humidity: safeHum, soilMoisture: safeSoil },
        {
          ...(user?.id ? { farmerId: user.id } : {}),
          fieldId,
          source: isConnected ? "hardware" : "simulated",
        },
      ).then((rec) => {
        if (rec) {
          setHistoryRecords((prev) => [...prev, rec]);
        }
      });
    }
  }, [isConnected, isSimulated, safeTemp, safeHum, safeSoil, fieldId, user?.id]);

  // Load History on Mount and Timeframe switch
  useEffect(() => {
    getFieldSensorHistory(fieldId, historyTimeframe).then((data) => {
      setHistoryRecords(data);
    });
  }, [fieldId, historyTimeframe]);

  // Telemetry Summary Stats
  const stats: TelemetryStats = useMemo(() => {
    return computeTelemetryStats(historyRecords, { temperature: safeTemp, humidity: safeHum, soilMoisture: safeSoil });
  }, [historyRecords, safeTemp, safeHum, safeSoil]);

  // 1. Soil Condition Evaluation
  const soilCondition: SoilConditionResult = useMemo(() => {
    return classifySoilMoisture(safeSoil);
  }, [safeSoil]);

  // 2. Selected Crop Suitability
  const cropSuitability: CropSuitabilityResult = useMemo(() => {
    return evaluateCropSuitability(activeCropId, safeTemp, safeHum, safeSoil);
  }, [activeCropId, safeTemp, safeHum, safeSoil]);

  // All Crops Suitability Comparison
  const allCropsSuitability = useMemo(() => {
    return Object.keys(AGRONOMIC_CROP_THRESHOLDS).map((cId) =>
      evaluateCropSuitability(cId, safeTemp, safeHum, safeSoil),
    );
  }, [safeTemp, safeHum, safeSoil]);

  // 3. Irrigation Recommendation
  const irrigationRec: IrrigationRecommendationResult = useMemo(() => {
    return computeIrrigationRecommendation(safeSoil, activeCropId, safeTemp);
  }, [safeSoil, activeCropId, safeTemp]);

  // 4. Crop Stress Analysis
  const cropStress: CropStressResult = useMemo(() => {
    return computeCropStress(safeTemp, safeHum, safeSoil, activeCropId);
  }, [safeTemp, safeHum, safeSoil, activeCropId]);

  // 5. Microclimate Pathology Risk
  const pathologyRisk: MicroclimatePathologyRiskResult = useMemo(() => {
    return computeMicroclimatePathologyRisk(safeTemp, safeHum, safeSoil);
  }, [safeTemp, safeHum, safeSoil]);

  // 6. Smart Sensor Alerts
  const alerts: SmartSensorAlert[] = useMemo(() => {
    return generateSmartSensorAlerts(safeTemp, safeHum, safeSoil, status, activeCropId);
  }, [safeTemp, safeHum, safeSoil, status, activeCropId]);

  async function handleConnect() {
    setConnectError(null);
    setIsConnecting(true);
    try {
      await connect();
    } catch (err: any) {
      if (err.name !== "NotFoundError" && err.name !== "AbortError") {
        setConnectError(err.message || "Failed to establish serial connection.");
      }
    } finally {
      setIsConnecting(false);
    }
  }

  function handleApplyCalibration() {
    setManualReading(calibTemp, calibHum, calibSoil);
    setShowCalibration(false);
  }

  // Status Badge Configuration
  const statusConfig = {
    connected: {
      label: "Connected (Live Hardware)",
      badgeBg: "bg-forest/10 border-forest text-forest",
      dot: "bg-forest animate-pulse",
      icon: <CheckCircle2 className="size-3.5 text-forest" />,
    },
    simulated: {
      label: "SIMULATION MODE",
      badgeBg: "bg-water/10 border-water text-water font-bold",
      dot: "bg-water animate-ping",
      icon: <Radio className="size-3.5 text-water" />,
    },
    stale: {
      label: "Stale Telemetry (>10s)",
      badgeBg: "bg-amber/10 border-amber text-amber",
      dot: "bg-amber animate-ping",
      icon: <AlertTriangle className="size-3.5 text-amber" />,
    },
    offline: {
      label: "SENSOR NODE OFFLINE",
      badgeBg: "bg-paper border-line text-ink-2",
      dot: "bg-ink-2/50",
      icon: <XCircle className="size-3.5 text-ink-2" />,
    },
  }[status];

  return (
    <div className={cx("border border-line bg-surface overflow-hidden rounded-[var(--r)] shadow-panel space-y-0", className)}>
      {/* ══════════════════════════════════════════════════════════════════════════════
          1. LIVE HARDWARE CONSOLE HEADER (Preserved intact with full control)
          ══════════════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-2 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded bg-forest text-surface shadow">
            <Cpu className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-[0.9375rem] font-bold text-ink">
                Microclimate Hardware Node &amp; IoT Decision System
              </h3>
              <span className="num text-[0.6875rem] font-mono text-ink-2">115,200 baud · ESP32 + DHT22</span>
            </div>
            <p className="text-[0.75rem] text-ink-2">
              Real-time physiological telemetry converted into actionable agronomic intelligence
            </p>
          </div>
        </div>

        {/* Status Badge & Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cx(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.75rem] font-semibold",
              statusConfig.badgeBg,
            )}
          >
            <span className={cx("size-2 rounded-full", statusConfig.dot)} />
            <span>{statusConfig.label}</span>
          </span>

          {isConnected ? (
            <button
              type="button"
              onClick={disconnect}
              className="inline-flex items-center gap-1 border border-alert/40 bg-alert/10 px-2.5 py-1 text-[0.75rem] font-semibold text-alert hover:bg-alert/20 rounded transition-colors"
            >
              <Square className="size-3" />
              <span>Disconnect</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isConnecting}
              onClick={handleConnect}
              className="inline-flex items-center gap-1.5 bg-forest px-3 py-1 text-[0.75rem] font-semibold text-surface hover:bg-[#0e2b20] rounded shadow transition-colors"
            >
              {isConnecting ? <RefreshCw className="size-3 animate-spin" /> : <Zap className="size-3" />}
              <span>{isConnecting ? "Connecting…" : "Connect Hardware"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => toggleSimulated()}
            className={cx(
              "inline-flex items-center gap-1 border px-2.5 py-1 text-[0.75rem] font-semibold rounded transition-colors",
              isSimulated
                ? "border-water bg-water/20 text-water"
                : "border-line bg-paper text-ink hover:bg-surface-2",
            )}
            title="Toggle simulated telemetry stream"
          >
            <Radio className="size-3" />
            <span>{isSimulated ? "Stop Sim" : "Simulate"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCalibTemp(reading.temperature);
              setCalibHum(reading.humidity);
              setCalibSoil(reading.soilMoisture);
              setShowCalibration(!showCalibration);
            }}
            className={cx(
              "inline-flex items-center gap-1 border px-2 py-1 text-[0.75rem] font-semibold rounded transition-colors",
              showCalibration ? "border-forest bg-forest/10 text-forest" : "border-line bg-paper text-ink-2 hover:text-ink",
            )}
            title="Manual calibration overrides"
          >
            <Sliders className="size-3" />
            <span>Calibrate</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTerminal(!showTerminal)}
            className={cx(
              "inline-flex items-center gap-1 border px-2 py-1 text-[0.75rem] font-semibold rounded transition-colors",
              showTerminal ? "border-forest bg-forest/10 text-forest" : "border-line bg-paper text-ink-2 hover:text-ink",
            )}
            title="View raw serial packets"
          >
            <Terminal className="size-3" />
            <span>{showTerminal ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}</span>
          </button>
        </div>
      </div>

      {/* Offline Status Warning Bar */}
      {status === "offline" && (
        <div className="border-b border-line bg-surface-2 px-4 py-2 text-xs text-ink-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="size-3.5 text-ink-2" />
            <span>
              <strong>Sensor Node Offline:</strong> Last recorded reading was {safeTemp.toFixed(1)}°C · {safeHum.toFixed(0)}% RH · {safeSoil.toFixed(0)}% VWC.
            </span>
          </div>
          <span className="text-[0.6875rem] font-mono text-ink-2/80">Pending Live Sync</span>
        </div>
      )}

      {/* Connection Errors & Anomaly Alerts */}
      {connectError && (
        <div className="border-b border-alert/30 bg-alert/10 px-4 py-2 text-[0.75rem] text-alert flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{connectError}</span>
          </div>
          <button type="button" onClick={() => setConnectError(null)}>
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {anomaly.isAnomaly && (
        <div
          className={cx(
            "border-b px-4 py-2 text-[0.8125rem] flex items-center gap-2 font-medium",
            anomaly.level === "critical"
              ? "border-alert/40 bg-alert/10 text-alert"
              : "border-amber/40 bg-amber/10 text-amber",
          )}
        >
          <AlertTriangle className="size-4 shrink-0" />
          <span>{anomaly.message}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════════
          2. LIVE SENSOR GAUGES STRIP
          ══════════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0 divide-line bg-surface">
        {/* Gauge 1: Ambient Temperature */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-alert/10 text-alert border border-alert/20">
              <Thermometer className="size-5" />
            </div>
            <div>
              <span className="text-caption text-ink-2 block">Ambient Temperature</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="num text-[1.5rem] font-bold text-ink">
                  {safeTemp.toFixed(1)}
                </span>
                <span className="text-[0.875rem] font-semibold text-ink-2">°C</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[0.6875rem] font-semibold text-ink-2 block uppercase">DHT22 Digital</span>
            <span
              className={cx(
                "num text-[0.75rem] font-bold",
                safeTemp >= 24 && safeTemp <= 32 ? "text-amber font-semibold" : "text-forest",
              )}
            >
              {safeTemp >= 24 && safeTemp <= 32 ? "Pathogen Active" : "Normal"}
            </span>
          </div>
        </div>

        {/* Gauge 2: Relative Humidity */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-water/10 text-water border border-water/20">
              <Droplets className="size-5" />
            </div>
            <div>
              <span className="text-caption text-ink-2 block">Relative Humidity</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="num text-[1.5rem] font-bold text-water">
                  {safeHum.toFixed(1)}
                </span>
                <span className="text-[0.875rem] font-semibold text-ink-2">% RH</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[0.6875rem] font-semibold text-ink-2 block uppercase">Capacitive</span>
            <span
              className={cx(
                "num text-[0.75rem] font-bold",
                safeHum >= 75 ? "text-alert" : safeHum >= 65 ? "text-amber" : "text-forest",
              )}
            >
              {safeHum >= 75 ? "High Spore Risk" : "Stable"}
            </span>
          </div>
        </div>

        {/* Gauge 3: Soil Moisture VWC % */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-leaf/10 text-leaf border border-leaf/20">
              <Sprout className="size-5" />
            </div>
            <div>
              <span className="text-caption text-ink-2 block">Soil Moisture (VWC)</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="num text-[1.5rem] font-bold text-leaf">
                  {safeSoil.toFixed(0)}
                </span>
                <span className="text-[0.875rem] font-semibold text-ink-2">% VWC</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[0.6875rem] font-semibold text-ink-2 block uppercase">Analog Probe A0</span>
            <span className={cx("num text-[0.75rem] font-bold", soilCondition.badgeColor)}>
              {soilCondition.condition}
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════════
          3. SOIL MOISTURE CONDITION & IRRIGATION DECISION
          ══════════════════════════════════════════════════════════════════════════════ */}
      <div className="border-t border-line grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-line bg-surface">
        {/* Card 1: Soil Moisture Condition */}
        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-caption text-forest font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sprout className="size-3.5 text-forest" /> Soil Moisture Condition
            </span>
            <span className={cx("px-2 py-0.5 rounded text-xs font-bold border", soilCondition.badgeColor)}>
              {soilCondition.condition}
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-ink font-semibold">{soilCondition.summary}</div>
            <p className="text-xs text-ink-2 leading-relaxed">
              <strong>Recommendation:</strong> {soilCondition.recommendation}
            </p>
          </div>

          <p className="text-[0.6875rem] text-ink-2/70 italic border-t border-line/60 pt-1.5">
            * Note: Capacitive sensor measures volumetric water content (% VWC) in the root zone. It does not measure soil pH, NPK, or chemical fertility.
          </p>
        </div>

        {/* Card 2: Irrigation Recommendation */}
        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-caption text-water font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="size-3.5 text-water" /> Irrigation Recommendation
            </span>
            <span className={cx("px-2 py-0.5 rounded text-xs font-bold border", irrigationRec.badgeColor)}>
              💧 {irrigationRec.state}
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-ink">{irrigationRec.reason}</p>
            <p className="text-xs text-ink-2 leading-relaxed">
              <strong>Action:</strong> {irrigationRec.action}
            </p>
          </div>

          {irrigationRec.deficitPct > 0 && (
            <div className="text-[0.6875rem] text-alert font-semibold border-t border-line/60 pt-1.5 flex items-center justify-between">
              <span>Root-Zone Deficit: ~{irrigationRec.deficitPct}% below optimal</span>
              <span className="font-mono">Crop: {cropSuitability.cropName}</span>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════════
          4. CROP STRESS & MICROCLIMATE PATHOLOGY RISK
          ══════════════════════════════════════════════════════════════════════════════ */}
      <div className="border-t border-line grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-line bg-surface-2 p-4 gap-4">
        {/* Left: 3-Vector Crop Stress */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="font-display text-xs font-bold text-ink uppercase tracking-wide flex items-center gap-1.5">
              <Flame className="size-3.5 text-alert" /> 3-Vector Crop Stress Analysis
            </h4>
            <span
              className={cx(
                "text-[0.6875rem] font-bold px-2 py-0.5 rounded uppercase",
                cropStress.overallStress.includes("HIGH") || cropStress.overallStress.includes("CRITICAL")
                  ? "bg-alert/15 text-alert font-bold"
                  : cropStress.overallStress.includes("MODERATE")
                    ? "bg-amber/15 text-amber"
                    : "bg-forest/15 text-forest",
              )}
            >
              {cropStress.overallStress}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="border border-line bg-surface p-2 rounded">
              <span className="text-caption text-ink-2 block">Water Stress</span>
              <span
                className={cx(
                  "num font-bold block mt-0.5",
                  cropStress.waterStress === "CRITICAL" || cropStress.waterStress === "HIGH"
                    ? "text-alert"
                    : cropStress.waterStress === "MODERATE"
                      ? "text-amber"
                      : "text-forest",
                )}
              >
                {cropStress.waterStress}
              </span>
            </div>

            <div className="border border-line bg-surface p-2 rounded">
              <span className="text-caption text-ink-2 block">Heat Stress</span>
              <span
                className={cx(
                  "num font-bold block mt-0.5",
                  cropStress.heatStress === "CRITICAL" || cropStress.heatStress === "HIGH"
                    ? "text-alert"
                    : cropStress.heatStress === "MODERATE"
                      ? "text-amber"
                      : "text-forest",
                )}
              >
                {cropStress.heatStress}
              </span>
            </div>

            <div className="border border-line bg-surface p-2 rounded">
              <span className="text-caption text-ink-2 block">Humidity Stress</span>
              <span
                className={cx(
                  "num font-bold block mt-0.5",
                  cropStress.humidityStress === "HIGH"
                    ? "text-alert"
                    : cropStress.humidityStress === "MODERATE"
                      ? "text-amber"
                      : "text-forest",
                )}
              >
                {cropStress.humidityStress}
              </span>
            </div>
          </div>

          <p className="text-[0.75rem] text-ink-2 leading-tight">
            <strong>Signal breakdown:</strong> {cropStress.primarySignal} (VPD: {cropStress.vpdKpa.toFixed(2)} kPa).
          </p>
        </div>

        {/* Right: Microclimate Pathology Risk */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="font-display text-xs font-bold text-ink uppercase tracking-wide flex items-center gap-1.5">
              <ShieldAlert className="size-3.5 text-forest" /> Microclimate Pathology Risk
            </h4>
            <span className="text-[0.6875rem] text-ink-2">DHT22 Evidence</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="border border-line bg-surface p-2 rounded">
              <span className="text-caption text-ink-2 block">Fungal Pressure</span>
              <span
                className={cx(
                  "num font-bold block mt-0.5",
                  pathologyRisk.fungalPressure === "HIGH" ? "text-alert" : pathologyRisk.fungalPressure === "MODERATE" ? "text-amber" : "text-forest",
                )}
              >
                {pathologyRisk.fungalPressure}
              </span>
            </div>

            <div className="border border-line bg-surface p-2 rounded">
              <span className="text-caption text-ink-2 block">Heat Stress</span>
              <span
                className={cx(
                  "num font-bold block mt-0.5",
                  pathologyRisk.heatStressRisk === "HIGH" ? "text-alert" : pathologyRisk.heatStressRisk === "MODERATE" ? "text-amber" : "text-forest",
                )}
              >
                {pathologyRisk.heatStressRisk}
              </span>
            </div>

            <div className="border border-line bg-surface p-2 rounded">
              <span className="text-caption text-ink-2 block">Moisture Deficit</span>
              <span
                className={cx(
                  "num font-bold block mt-0.5",
                  pathologyRisk.moistureStressRisk === "HIGH" ? "text-alert" : pathologyRisk.moistureStressRisk === "MODERATE" ? "text-amber" : "text-forest",
                )}
              >
                {pathologyRisk.moistureStressRisk}
              </span>
            </div>
          </div>

          <div className="space-y-1 text-[0.75rem] text-ink-2">
            {pathologyRisk.drivers.slice(0, 2).map((d, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <Check className="size-3 text-forest shrink-0 mt-0.5" />
                <span>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════════
          5. CROP SUITABILITY ENGINE & CROP-WISE SENSOR INTERPRETATION
          ══════════════════════════════════════════════════════════════════════════════ */}
      <div className="border-t border-line p-4 bg-surface space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
          <div>
            <span className="text-caption text-forest font-bold uppercase tracking-wider">
              Agronomic Decision Support
            </span>
            <h4 className="font-display text-sm font-bold text-ink">
              Crop Suitability &amp; Environmental Baseline Comparison
            </h4>
          </div>

          {/* Crop Selector Tabs */}
          <div className="flex flex-wrap gap-1">
            {Object.keys(AGRONOMIC_CROP_THRESHOLDS).map((cId) => (
              <button
                key={cId}
                type="button"
                onClick={() => handleSelectCrop(cId)}
                className={cx(
                  "px-2.5 py-1 text-xs font-semibold rounded capitalize transition-colors",
                  activeCropId === cId
                    ? "bg-forest text-surface shadow-sm"
                    : "border border-line bg-paper text-ink-2 hover:bg-surface-2 hover:text-ink",
                )}
              >
                {cId}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Crop Evaluation Card */}
        <div className="border border-line bg-surface-2 p-3.5 rounded space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-ink text-sm">
                Selected Crop: <strong className="text-forest">{cropSuitability.cropName}</strong>
              </span>
              <span className="text-[0.6875rem] text-ink-2">
                ({AGRONOMIC_CROP_THRESHOLDS[activeCropId]?.vernacular})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-caption text-ink-2">Overall Environmental Suitability:</span>
              <span
                className={cx(
                  "px-2.5 py-0.5 text-xs font-bold rounded uppercase",
                  cropSuitability.overall === "Suitable"
                    ? "bg-forest text-surface"
                    : cropSuitability.overall === "Moderate"
                      ? "bg-amber text-surface"
                      : "bg-alert text-surface",
                )}
              >
                {cropSuitability.overall} ({cropSuitability.suitabilityScore}%)
              </span>
            </div>
          </div>

          {/* Parameter-by-Parameter Baseline Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {cropSuitability.parameters.map((p) => (
              <div key={p.param} className="border border-line bg-surface p-2.5 rounded space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">{p.param}</span>
                  <span
                    className={cx(
                      "text-[0.6875rem] font-bold uppercase",
                      p.status === "optimal" ? "text-forest" : p.status === "acceptable" ? "text-amber" : "text-alert",
                    )}
                  >
                    {p.status}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-ink">
                  <span className="num font-bold text-sm">{p.currentValue}</span>
                  <span className="text-[0.6875rem] text-ink-2">Target: {p.expectedRange}</span>
                </div>
                <p className="text-[0.6875rem] text-ink-2 leading-tight">{p.explanation}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-ink-2 gap-2 border-t border-line/60 pt-2">
            <p className="italic">{cropSuitability.summary}</p>
            <button
              type="button"
              onClick={() => setShowAllCrops(!showAllCrops)}
              className="text-forest font-semibold hover:underline shrink-0 text-left"
            >
              {showAllCrops ? "Hide other crops ▲" : "Compare all 8 crops ▼"}
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════════
              WHICH CROPS ARE SUITABLE & NOT SUITABLE (SOIL & CLIMATE MATRIX)
              ══════════════════════════════════════════════════════════════════════════ */}
          <div className="border-t border-line/80 pt-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <span className="text-caption text-forest font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sprout className="size-3.5 text-forest" /> Real-time Crop Soil &amp; Microclimate Compatibility Matrix
                </span>
                <h5 className="font-display text-sm font-bold text-ink">
                  Which crops are suitable and NOT suitable for this soil condition?
                </h5>
              </div>
              <span className="text-[0.6875rem] font-mono text-ink-2 bg-paper border border-line px-2 py-0.5 rounded">
                Live Sensor Telemetry: {safeSoil.toFixed(0)}% Soil VWC · {safeTemp.toFixed(1)}°C · {safeHum.toFixed(0)}% RH
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* 🟢 SUITABLE CROPS */}
              <div className="border border-forest/30 bg-forest/5 p-3.5 rounded space-y-2.5">
                <div className="flex items-center justify-between border-b border-forest/20 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-forest text-xs uppercase tracking-wide">
                    <CheckCircle2 className="size-4" />
                    <span>Suitable Crops Now ({allCropsSuitability.filter(c => c.overall === "Suitable" || (c.overall === "Moderate" && c.suitabilityScore >= 70)).length})</span>
                  </div>
                  <span className="text-[0.6875rem] text-forest font-semibold bg-forest/10 px-2 py-0.5 rounded">
                    Good to Cultivate
                  </span>
                </div>

                <div className="space-y-2">
                  {allCropsSuitability
                    .filter((c) => c.overall === "Suitable" || (c.overall === "Moderate" && c.suitabilityScore >= 70))
                    .map((cs) => {
                      const thresh = AGRONOMIC_CROP_THRESHOLDS[cs.cropId];
                      return (
                        <div
                          key={cs.cropId}
                          onClick={() => handleSelectCrop(cs.cropId)}
                          className={cx(
                            "border p-2.5 rounded bg-surface transition-all cursor-pointer",
                            activeCropId === cs.cropId ? "border-forest ring-1 ring-forest/50" : "border-line hover:border-forest/40",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-ink capitalize flex items-center gap-1">
                              🌱 {cs.cropName} <span className="text-[0.6875rem] text-ink-2">({thresh?.vernacular})</span>
                            </span>
                            <span className="text-[0.6875rem] font-bold bg-forest/10 text-forest px-2 py-0.5 rounded">
                              {cs.suitabilityScore}% Match · {cs.overall}
                            </span>
                          </div>
                          <p className="text-[0.75rem] text-ink-2 mt-1 leading-snug">
                            <strong>Why Suitable:</strong> {cs.summary} Soil moisture ({safeSoil.toFixed(0)}% VWC) is within target field capacity ({thresh?.soilMoisture.optMin}–{thresh?.soilMoisture.optMax}% VWC).
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* 🔴 NOT SUITABLE / HIGH STRESS CROPS */}
              <div className="border border-alert/30 bg-alert/5 p-3.5 rounded space-y-2.5">
                <div className="flex items-center justify-between border-b border-alert/20 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-alert text-xs uppercase tracking-wide">
                    <XCircle className="size-4" />
                    <span>Not Suitable / High Stress Crops ({allCropsSuitability.filter(c => c.overall === "Poor" || (c.overall === "Moderate" && c.suitabilityScore < 70)).length})</span>
                  </div>
                  <span className="text-[0.6875rem] text-alert font-semibold bg-alert/10 px-2 py-0.5 rounded">
                    Requires Soil Adjustment
                  </span>
                </div>

                <div className="space-y-2">
                  {allCropsSuitability
                    .filter((c) => c.overall === "Poor" || (c.overall === "Moderate" && c.suitabilityScore < 70))
                    .map((cs) => {
                      const thresh = AGRONOMIC_CROP_THRESHOLDS[cs.cropId];
                      const stressParams = cs.parameters.filter((p) => p.status === "stress");
                      return (
                        <div
                          key={cs.cropId}
                          onClick={() => handleSelectCrop(cs.cropId)}
                          className={cx(
                            "border p-2.5 rounded bg-surface transition-all cursor-pointer",
                            activeCropId === cs.cropId ? "border-alert ring-1 ring-alert/50" : "border-line hover:border-alert/40",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-ink capitalize flex items-center gap-1">
                              ⚠ {cs.cropName} <span className="text-[0.6875rem] text-ink-2">({thresh?.vernacular})</span>
                            </span>
                            <span className="text-[0.6875rem] font-bold bg-alert/10 text-alert px-2 py-0.5 rounded">
                              {cs.suitabilityScore}% Match · Poor Conditions
                            </span>
                          </div>
                          <div className="text-[0.75rem] text-ink mt-1 leading-snug space-y-1">
                            <p className="text-alert font-medium">
                              <strong>Why NOT Suitable:</strong> {stressParams.length > 0 ? stressParams.map((sp) => sp.explanation).join("; ") : cs.summary}
                            </p>
                            <p className="text-ink-2 text-[0.6875rem]">
                              <strong>Requirement:</strong> Needs {thresh?.soilMoisture.optMin}–{thresh?.soilMoisture.optMax}% VWC soil moisture and {thresh?.temperature.optMin}–{thresh?.temperature.optMax}°C temperature.
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════════
          6. SMART SENSOR ALERTS CENTER
          ══════════════════════════════════════════════════════════════════════════════ */}
      {alerts.length > 0 && (
        <div className="border-t border-line p-4 bg-surface space-y-2.5">
          <h4 className="font-display text-xs font-bold text-ink uppercase tracking-wide flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 text-amber" /> Smart Sensor Alerts &amp; Threshold Violations ({alerts.length})
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {alerts.map((al) => (
              <div
                key={al.id}
                className={cx(
                  "border p-3 rounded space-y-1",
                  al.severity === "critical"
                    ? "border-alert/30 bg-alert/5 text-alert"
                    : "border-amber/30 bg-amber/5 text-amber",
                )}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{al.title}</span>
                  <span className="font-mono text-[0.6875rem]">{al.currentValue}</span>
                </div>
                <p className="text-ink text-[0.75rem]">{al.evidence}</p>
                <p className="text-ink-2 text-[0.6875rem]">
                  <strong>Action:</strong> {al.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════════
          7. SENSOR TELEMETRY HISTORY (24h / 7d)
          ══════════════════════════════════════════════════════════════════════════════ */}
      <div className="border-t border-line p-4 bg-surface space-y-3">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-forest" />
            <h4 className="font-display text-xs font-bold text-ink uppercase tracking-wide">
              Sensor Telemetry History &amp; Statistical Bounds
            </h4>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setHistoryTimeframe("24h")}
              className={cx(
                "px-2.5 py-0.5 text-xs font-semibold rounded",
                historyTimeframe === "24h" ? "bg-forest text-surface" : "border border-line bg-paper text-ink-2 hover:bg-surface-2",
              )}
            >
              24 Hours
            </button>
            <button
              type="button"
              onClick={() => setHistoryTimeframe("7d")}
              className={cx(
                "px-2.5 py-0.5 text-xs font-semibold rounded",
                historyTimeframe === "7d" ? "bg-forest text-surface" : "border border-line bg-paper text-ink-2 hover:bg-surface-2",
              )}
            >
              7 Days
            </button>
          </div>
        </div>

        {/* Statistical Bounds Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          {/* Temperature Bounds */}
          <div className="border border-line bg-surface-2 p-3 rounded space-y-1.5">
            <span className="font-semibold text-ink flex items-center justify-between">
              <span>Temperature</span>
              <span className="font-bold text-alert">{(stats?.current?.temp ?? reading?.temperature ?? 28.5).toFixed(1)}°C</span>
            </span>
            <div className="grid grid-cols-3 gap-1 text-[0.6875rem] text-center border-t border-line/60 pt-1">
              <div>
                <span className="text-caption text-ink-2 block">Min</span>
                <span className="font-bold text-ink">{(stats?.min?.temp ?? reading?.temperature ?? 20).toFixed(1)}°C</span>
              </div>
              <div>
                <span className="text-caption text-ink-2 block">Avg</span>
                <span className="font-bold text-ink">{(stats?.avg?.temp ?? reading?.temperature ?? 28.5).toFixed(1)}°C</span>
              </div>
              <div>
                <span className="text-caption text-ink-2 block">Max</span>
                <span className="font-bold text-ink">{(stats?.max?.temp ?? reading?.temperature ?? 35).toFixed(1)}°C</span>
              </div>
            </div>
          </div>

          {/* Humidity Bounds */}
          <div className="border border-line bg-surface-2 p-3 rounded space-y-1.5">
            <span className="font-semibold text-ink flex items-center justify-between">
              <span>Humidity</span>
              <span className="font-bold text-water">{(stats?.current?.hum ?? reading?.humidity ?? 70).toFixed(0)}% RH</span>
            </span>
            <div className="grid grid-cols-3 gap-1 text-[0.6875rem] text-center border-t border-line/60 pt-1">
              <div>
                <span className="text-caption text-ink-2 block">Min</span>
                <span className="font-bold text-ink">{(stats?.min?.hum ?? reading?.humidity ?? 45).toFixed(0)}%</span>
              </div>
              <div>
                <span className="text-caption text-ink-2 block">Avg</span>
                <span className="font-bold text-ink">{(stats?.avg?.hum ?? reading?.humidity ?? 70).toFixed(0)}%</span>
              </div>
              <div>
                <span className="text-caption text-ink-2 block">Max</span>
                <span className="font-bold text-ink">{(stats?.max?.hum ?? reading?.humidity ?? 90).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Soil Moisture Bounds */}
          <div className="border border-line bg-surface-2 p-3 rounded space-y-1.5">
            <span className="font-semibold text-ink flex items-center justify-between">
              <span>Soil Moisture</span>
              <span className="font-bold text-leaf">{(stats?.current?.soil ?? reading?.soilMoisture ?? 50).toFixed(0)}% VWC</span>
            </span>
            <div className="grid grid-cols-3 gap-1 text-[0.6875rem] text-center border-t border-line/60 pt-1">
              <div>
                <span className="text-caption text-ink-2 block">Min</span>
                <span className="font-bold text-ink">{(stats?.min?.soil ?? reading?.soilMoisture ?? 30).toFixed(0)}%</span>
              </div>
              <div>
                <span className="text-caption text-ink-2 block">Avg</span>
                <span className="font-bold text-ink">{(stats?.avg?.soil ?? reading?.soilMoisture ?? 50).toFixed(0)}%</span>
              </div>
              <div>
                <span className="text-caption text-ink-2 block">Max</span>
                <span className="font-bold text-ink">{(stats?.max?.soil ?? reading?.soilMoisture ?? 75).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {!stats.hasEnoughData && (
          <p className="text-[0.6875rem] text-ink-2 italic bg-forest/5 border border-forest/20 p-2 rounded">
            📊 Collecting historical readings... Live recordings are synchronized with Supabase every 15s while hardware or simulator is active.
          </p>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════════
          8. CROPXENSE INTERPRETATION PIPELINE
          ══════════════════════════════════════════════════════════════════════════════ */}
      <div className="border-t border-line p-3 bg-surface-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Database className="size-3.5 text-forest" />
          <span className="font-semibold text-ink">How CropXense Interprets Your Field Telemetry</span>
        </div>
        <button
          type="button"
          onClick={() => setShowPipeline(!showPipeline)}
          className="text-forest font-semibold hover:underline"
        >
          {showPipeline ? "Hide pipeline ▲" : "View pipeline flow ▼"}
        </button>
      </div>

      {showPipeline && (
        <div className="border-t border-line bg-surface p-4 text-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-center text-ink font-semibold">
            <span className="border border-line bg-paper px-2.5 py-1 rounded">ESP32 Hardware</span>
            <ArrowRight className="size-3 text-ink-2" />
            <span className="border border-line bg-paper px-2.5 py-1 rounded">DHT22 + Soil Probe</span>
            <ArrowRight className="size-3 text-ink-2" />
            <span className="border border-line bg-paper px-2.5 py-1 rounded">Web Serial API</span>
            <ArrowRight className="size-3 text-ink-2" />
            <span className="border border-line bg-paper px-2.5 py-1 rounded">Sensor Telemetry Service</span>
            <ArrowRight className="size-3 text-ink-2" />
            <span className="border border-line bg-paper px-2.5 py-1 rounded">Supabase Storage</span>
            <ArrowRight className="size-3 text-ink-2" />
            <span className="border border-forest bg-forest/10 text-forest px-2.5 py-1 rounded font-bold">
              Farmer Decision Engine
            </span>
          </div>
          <p className="text-[0.6875rem] text-ink-2 leading-relaxed">
            Raw voltage pulses and digital one-wire packets are parsed in real time in the browser, calibrated against crop agronomic thresholds, persisted in Supabase for cross-role officer and expert visibility, and integrated with the leaf scanner for multi-source pathology fusion.
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════════
          MANUAL CALIBRATION DRAWER
          ══════════════════════════════════════════════════════════════════════════════ */}
      {showCalibration && (
        <div className="border-t border-line bg-surface-2 p-4 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div className="flex items-center gap-2">
              <Sliders className="size-4 text-forest" />
              <h4 className="font-display text-[0.875rem] font-bold text-ink">
                Manual Microclimate Calibration &amp; Stress Sliders
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowCalibration(false)}
              className="text-ink-2 hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 text-[0.8125rem]">
            {/* Temp Slider */}
            <div>
              <div className="flex justify-between font-medium mb-1">
                <span>Temperature:</span>
                <span className="font-mono font-bold text-alert">{calibTemp.toFixed(1)}°C</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="0.5"
                value={calibTemp}
                onChange={(e) => setCalibTemp(parseFloat(e.target.value))}
                className="w-full accent-alert cursor-pointer"
              />
              <div className="flex justify-between text-[0.6875rem] text-ink-2 mt-0.5">
                <span>5°C</span>
                <span>28°C (Peak Spore)</span>
                <span>50°C</span>
              </div>
            </div>

            {/* Humidity Slider */}
            <div>
              <div className="flex justify-between font-medium mb-1">
                <span>Relative Humidity:</span>
                <span className="font-mono font-bold text-water">{calibHum.toFixed(0)}% RH</span>
              </div>
              <input
                type="range"
                min="10"
                max="98"
                step="1"
                value={calibHum}
                onChange={(e) => setCalibHum(parseFloat(e.target.value))}
                className="w-full accent-water cursor-pointer"
              />
              <div className="flex justify-between text-[0.6875rem] text-ink-2 mt-0.5">
                <span>10%</span>
                <span>75% (Threshold)</span>
                <span>98%</span>
              </div>
            </div>

            {/* Soil Moisture Slider */}
            <div>
              <div className="flex justify-between font-medium mb-1">
                <span>Soil Moisture VWC:</span>
                <span className="font-mono font-bold text-leaf">{calibSoil.toFixed(0)}% VWC</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={calibSoil}
                onChange={(e) => setCalibSoil(parseFloat(e.target.value))}
                className="w-full accent-leaf cursor-pointer"
              />
              <div className="flex justify-between text-[0.6875rem] text-ink-2 mt-0.5">
                <span>0% (Desiccation)</span>
                <span>50% (Ideal)</span>
                <span>100% (Rot)</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line/60">
            <button
              type="button"
              onClick={() => {
                setCalibTemp(28.5);
                setCalibHum(74.0);
                setCalibSoil(65.0);
              }}
              className="px-3 py-1 border border-line bg-paper text-[0.75rem] font-semibold text-ink hover:bg-surface rounded"
            >
              Reset Defaults
            </button>
            <button
              type="button"
              onClick={handleApplyCalibration}
              className="px-4 py-1 bg-forest text-surface text-[0.75rem] font-semibold rounded hover:bg-[#0e2b20]"
            >
              Apply Calibration Override
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════════
          RAW SERIAL TERMINAL
          ══════════════════════════════════════════════════════════════════════════════ */}
      {showTerminal && (
        <div className="border-t border-line bg-[#0a0f0c] p-3 text-[0.75rem] font-mono text-[#00ff88]">
          <div className="flex items-center justify-between border-b border-[#00ff88]/20 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5">
              <Terminal className="size-3.5 text-[#00ff88]" />
              <span className="font-bold">Raw Serial Stream Monitor (115200 baud)</span>
            </div>
            <span className="text-[0.6875rem] text-surface/60">
              {rawLogs.length} packets logged
            </span>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[0.6875rem] text-[#9dfcbe]">
            {rawLogs.length === 0 ? (
              <p className="text-surface/40 italic">Waiting for incoming serial packets from ESP32 node…</p>
            ) : (
              rawLogs.map((log, idx) => (
                <div key={idx} className="leading-tight">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
