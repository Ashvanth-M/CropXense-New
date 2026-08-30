/**
 * CropXense Hardware Status Console (ArduinoStatusCard)
 *
 * Real-time hardware status console for connected Arduino / ESP32 microclimate nodes:
 * - Live gauges for Temperature, Relative Humidity, and Soil Moisture VWC %
 * - Connection status badges (Live Hardware, Simulated, Stale, Offline)
 * - 1-Click Connect & Disconnect via Web Serial API (115200 baud)
 * - Interactive Telemetry Simulator & Manual Calibration Sliders
 * - Collapsible Live Raw Serial Terminal packet monitor
 * - Agronomic Physiological Anomaly Banner
 */

import { useState } from "react";
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
} from "lucide-react";
import { useArduinoSerial } from "@/hooks/useArduinoSerial";
import { cx } from "@/lib/cx";

interface ArduinoStatusCardProps {
  className?: string;
  compact?: boolean;
}

export function ArduinoStatusCard({ className, compact = false }: ArduinoStatusCardProps) {
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

  const [showTerminal, setShowTerminal] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [calibTemp, setCalibTemp] = useState<number>(reading.temperature || 28.5);
  const [calibHum, setCalibHum] = useState<number>(reading.humidity || 74.0);
  const [calibSoil, setCalibSoil] = useState<number>(reading.soilMoisture || 65.0);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

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

  // Determine status color and label
  const statusConfig = {
    connected: {
      label: "Connected (Live Hardware)",
      badgeBg: "bg-forest/10 border-forest text-forest",
      dot: "bg-forest animate-pulse",
      icon: <CheckCircle2 className="size-3.5 text-forest" />,
    },
    simulated: {
      label: "Simulated Telemetry Active",
      badgeBg: "bg-water/10 border-water text-water",
      dot: "bg-water animate-pulse",
      icon: <Radio className="size-3.5 text-water" />,
    },
    stale: {
      label: "Stale Telemetry (>10s)",
      badgeBg: "bg-amber/10 border-amber text-amber",
      dot: "bg-amber animate-ping",
      icon: <AlertTriangle className="size-3.5 text-amber" />,
    },
    offline: {
      label: "Sensor Node Offline",
      badgeBg: "bg-paper border-line text-ink-2",
      dot: "bg-ink-2/50",
      icon: <XCircle className="size-3.5 text-ink-2" />,
    },
  }[status];

  return (
    <div className={cx("border border-line bg-surface overflow-hidden rounded-[var(--r)] shadow-sm", className)}>
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-2 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded bg-forest text-surface shadow">
            <Cpu className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-[0.9375rem] font-bold text-ink">
                Microclimate Hardware Node (DHT22 + Soil VWC)
              </h3>
              <span className="num text-[0.6875rem] font-mono text-ink-2">115,200 baud</span>
            </div>
            <p className="text-[0.75rem] text-ink-2">
              Web Serial API direct serial stream connection
            </p>
          </div>
        </div>

        {/* Status Badge & Primary Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Badge */}
          <span
            className={cx(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.75rem] font-semibold",
              statusConfig.badgeBg,
            )}
          >
            <span className={cx("size-2 rounded-full", statusConfig.dot)} />
            <span>{statusConfig.label}</span>
          </span>

          {/* Connect / Disconnect Buttons */}
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

          {/* Toggle Simulator */}
          <button
            type="button"
            onClick={() => toggleSimulated()}
            className={cx(
              "inline-flex items-center gap-1 border px-2.5 py-1 text-[0.75rem] font-semibold rounded transition-colors",
              isSimulated
                ? "border-water bg-water/20 text-water"
                : "border-line bg-paper text-ink hover:bg-surface-2",
            )}
            title="Toggle offline simulated telemetry without hardware"
          >
            <Radio className="size-3" />
            <span>{isSimulated ? "Stop Sim" : "Simulate"}</span>
          </button>

          {/* Calibrate Sliders Button */}
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
            title="Manual microclimate calibration sliders"
          >
            <Sliders className="size-3" />
            <span>Calibrate</span>
          </button>

          {/* Toggle Raw Terminal */}
          <button
            type="button"
            onClick={() => setShowTerminal(!showTerminal)}
            className={cx(
              "inline-flex items-center gap-1 border px-2 py-1 text-[0.75rem] font-semibold rounded transition-colors",
              showTerminal ? "border-forest bg-forest/10 text-forest" : "border-line bg-paper text-ink-2 hover:text-ink",
            )}
            title="View raw serial byte packets"
          >
            <Terminal className="size-3" />
            <span>{showTerminal ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}</span>
          </button>
        </div>
      </div>

      {/* Browser Support Warning */}
      {!isSupported && (
        <div className="border-b border-amber/30 bg-amber/10 px-4 py-2 text-[0.75rem] text-amber flex items-center gap-2">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            Web Serial API is not supported in this browser. Please use Chrome, Edge, or Opera to connect physical USB hardware. You can still use the <strong>Simulate</strong> and <strong>Calibrate</strong> features!
          </span>
        </div>
      )}

      {/* Connection Error Notification */}
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

      {/* Agronomic Anomaly Alert Banner */}
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

      {/* Live Physical Gauge Meters Strip */}
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
                  {reading.temperature.toFixed(1)}
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
                reading.temperature >= 24 && reading.temperature <= 32 ? "text-amber font-semibold" : "text-forest",
              )}
            >
              {reading.temperature >= 24 && reading.temperature <= 32 ? "Pathogen Active" : "Normal"}
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
                  {reading.humidity.toFixed(1)}
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
                reading.humidity >= 75 ? "text-alert" : reading.humidity >= 65 ? "text-amber" : "text-forest",
              )}
            >
              {reading.humidity >= 75 ? "High Spore Risk" : "Stable"}
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
                  {reading.soilMoisture.toFixed(0)}
                </span>
                <span className="text-[0.875rem] font-semibold text-ink-2">% VWC</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[0.6875rem] font-semibold text-ink-2 block uppercase">Analog Probe A0</span>
            <span
              className={cx(
                "num text-[0.75rem] font-bold",
                reading.soilMoisture >= 75 ? "text-alert" : reading.soilMoisture <= 25 ? "text-amber" : "text-forest",
              )}
            >
              {reading.soilMoisture >= 75 ? "Waterlogged" : reading.soilMoisture <= 25 ? "Dry Stress" : "Optimal"}
            </span>
          </div>
        </div>
      </div>

      {/* Manual Microclimate Calibration Sliders Drawer */}
      {showCalibration && (
        <div className="border-t border-line bg-surface-2 p-4 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div className="flex items-center gap-2">
              <Sliders className="size-4 text-forest" />
              <h4 className="font-display text-[0.875rem] font-bold text-ink">
                Manual Microclimate Calibration & Stress Sliders
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
                min="5"
                max="95"
                step="1"
                value={calibSoil}
                onChange={(e) => setCalibSoil(parseFloat(e.target.value))}
                className="w-full accent-leaf cursor-pointer"
              />
              <div className="flex justify-between text-[0.6875rem] text-ink-2 mt-0.5">
                <span>5% (Desiccation)</span>
                <span>50% (Ideal)</span>
                <span>95% (Rot)</span>
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

      {/* Raw Serial Terminal View */}
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
              <p className="text-surface/40 italic">Waiting for incoming serial packets from Arduino node…</p>
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
