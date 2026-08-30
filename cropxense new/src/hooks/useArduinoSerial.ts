/**
 * useArduinoSerial React Hook
 *
 * Provides reactive access to the persistent global Web Serial hardware singleton.
 * Exposes live microclimate sensor telemetry (DHT22 Temperature & Humidity + Soil Moisture),
 * connection management, anomaly flags, raw serial logs, and simulation/calibration controls.
 */

import { useState, useEffect, useCallback } from "react";
import {
  hardwareSerial,
  type TelemetryReading,
  type TelemetryAnomaly,
  type HardwareStatus,
} from "@/services/hardwareSerial";

export function useArduinoSerial() {
  const [reading, setReading] = useState<TelemetryReading>(() => hardwareSerial.getLatestReading());
  const [status, setStatus] = useState<HardwareStatus>(() => hardwareSerial.getStatus());
  const [anomaly, setAnomaly] = useState<TelemetryAnomaly>(() => hardwareSerial.getAnomaly());
  const [rawLogs, setRawLogs] = useState<string[]>(() => hardwareSerial.getRawLogs());
  const [isSupported] = useState<boolean>(() => hardwareSerial.isSupported());

  useEffect(() => {
    const unsubscribe = hardwareSerial.subscribe((newReading, newStatus, newAnomaly) => {
      setReading(newReading);
      setStatus(newStatus);
      setAnomaly(newAnomaly);
      setRawLogs(hardwareSerial.getRawLogs());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const connect = useCallback(async () => {
    return await hardwareSerial.connect();
  }, []);

  const disconnect = useCallback(async () => {
    await hardwareSerial.disconnect();
  }, []);

  const toggleSimulated = useCallback((enable?: boolean) => {
    hardwareSerial.toggleSimulated(enable);
  }, []);

  const setManualReading = useCallback((temp: number, hum: number, soil: number) => {
    hardwareSerial.setManualReading(temp, hum, soil);
  }, []);

  return {
    isSupported,
    isConnected: status === "connected",
    isStale: status === "stale",
    isSimulated: status === "simulated",
    status,
    reading,
    anomaly,
    rawLogs,
    connect,
    disconnect,
    toggleSimulated,
    setManualReading,
  };
}
