/**
 * CropXense Web Serial Hardware Singleton Service
 *
 * Connects Arduino / ESP32 sensor nodes directly to the browser via the Web Serial API (115200 baud).
 * Decodes real-time microclimate telemetry (DHT22 Temperature & Humidity + Analog Soil Moisture),
 * detects out-of-bound anomalies & thermal spikes, provides offline simulation with manual calibration,
 * and publishes updates to all subscribing UI components without disconnecting across page transitions.
 */

export interface TelemetryReading {
  temperature: number;      // °C (DHT22)
  humidity: number;         // % RH (DHT22)
  soilMoisture: number;     // % VWC Volumetric Water Content (Analog Soil Probe)
  timestamp: number;        // Epoch millis
  rawLine?: string;         // Last parsed packet string
}

export interface TelemetryAnomaly {
  isAnomaly: boolean;
  level: "none" | "warning" | "critical";
  message: string;
}

export type HardwareStatus = "connected" | "simulated" | "stale" | "offline";

type TelemetryListener = (reading: TelemetryReading, status: HardwareStatus, anomaly: TelemetryAnomaly) => void;

// Web Serial API types declaration for browsers
interface SerialPort {
  open(options: { baudRate: number; dataBits?: number; stopBits?: number; parity?: string; bufferSize?: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
}

declare global {
  interface Navigator {
    serial?: {
      requestPort(options?: { filters?: { usbVendorId?: number; usbProductId?: number }[] }): Promise<SerialPort>;
      getPorts(): Promise<SerialPort[]>;
    };
  }
}

class HardwareSerialService {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private keepReading = false;
  private isConnecting = false;

  private currentReading: TelemetryReading = {
    temperature: 28.5,
    humidity: 74.0,
    soilMoisture: 65.0,
    timestamp: Date.now(),
  };

  private listeners: Set<TelemetryListener> = new Set();
  private rawLogs: string[] = [];
  private isSimulated = false;
  private simulationInterval: ReturnType<typeof setInterval> | null = null;
  private buffer = "";

  // Temporary buffer for multiline Format A parsing
  private partialHumanBlock: { temp?: number; hum?: number; soil?: number } = {};

  // History tracking for rapid thermal spike detection
  private tempHistory: { temp: number; time: number }[] = [];

  constructor() {
    // Check for previous ports on startup in supported browsers
    if (typeof window !== "undefined" && "serial" in navigator) {
      this.tryAutoConnect();
    }
  }

  /** Check if Web Serial API is supported by the current browser */
  public isSupported(): boolean {
    return typeof navigator !== "undefined" && "serial" in navigator;
  }

  /** Current connection state */
  public isConnected(): boolean {
    return this.port !== null && this.keepReading;
  }

  /** Is currently running offline simulation */
  public getIsSimulated(): boolean {
    return this.isSimulated;
  }

  /** Get the latest telemetry reading */
  public getLatestReading(): TelemetryReading {
    return { ...this.currentReading };
  }

  /** Get recent raw serial packet logs */
  public getRawLogs(): string[] {
    return [...this.rawLogs];
  }

  /** Check if data is stale (> 10 seconds without new packet) */
  public isStale(): boolean {
    if (!this.isConnected() && !this.isSimulated) return true;
    return Date.now() - this.currentReading.timestamp > 10000;
  }

  /** Current high-level status */
  public getStatus(): HardwareStatus {
    if (this.isSimulated) return "simulated";
    if (!this.isConnected()) return "offline";
    if (this.isStale()) return "stale";
    return "connected";
  }

  /** Anomaly evaluation against agronomic physiological bounds */
  public getAnomaly(): TelemetryAnomaly {
    const { temperature, humidity, soilMoisture } = this.currentReading;

    // Thermal Spike Check (Delta T > 8°C in 4 seconds)
    const fourSecsAgo = Date.now() - 4000;
    const pastSample = this.tempHistory.find((h) => h.time <= fourSecsAgo);
    if (pastSample && Math.abs(temperature - pastSample.temp) >= 8.0) {
      return {
        isAnomaly: true,
        level: "critical",
        message: `Rapid thermal anomaly detected: ΔT of ${(temperature - pastSample.temp).toFixed(1)}°C in 4s! Check sensor probe.`,
      };
    }

    // Critical Out of Bounds
    if (temperature < 5.0 || temperature > 50.0) {
      return {
        isAnomaly: true,
        level: "critical",
        message: `Extreme temperature (${temperature.toFixed(1)}°C) exceeds safe physiological limits (5°C - 50°C).`,
      };
    }
    if (humidity < 10.0 || humidity > 98.0) {
      return {
        isAnomaly: true,
        level: "critical",
        message: `Extreme relative humidity (${humidity.toFixed(1)}%) indicates saturation or sensor desiccation.`,
      };
    }
    if (soilMoisture < 5.0 || soilMoisture > 95.0) {
      return {
        isAnomaly: true,
        level: "warning",
        message: `Extreme soil moisture reading (${soilMoisture.toFixed(1)}% VWC). Crop root zone at extreme stress.`,
      };
    }

    // Pathogen Favorability Advisory Bounds
    if (humidity >= 85.0 && temperature >= 22.0 && temperature <= 32.0) {
      return {
        isAnomaly: true,
        level: "warning",
        message: `High Disease Window: RH ${humidity.toFixed(0)}% at ${temperature.toFixed(1)}°C creates optimal spore germination conditions.`,
      };
    }

    return { isAnomaly: false, level: "none", message: "Microclimate telemetry within normal agronomic parameters." };
  }

  /** Auto-connect to previously granted serial port if available */
  private async tryAutoConnect() {
    try {
      if (!navigator.serial) return;
      const ports = await navigator.serial.getPorts();
      if (ports.length > 0 && !this.isConnected() && !this.isConnecting) {
        const port = ports[0]!;
        await this.openPort(port);
      }
    } catch {
      // Background auto-reconnect failed silently
    }
  }

  /** User-prompted connection request */
  public async connect(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error("Web Serial API is not supported in this browser. Please use Google Chrome, Edge, or Opera.");
    }

    if (this.isConnected()) return true;

    try {
      this.isConnecting = true;
      if (this.isSimulated) {
        this.stopSimulation();
      }

      const port = await navigator.serial!.requestPort();
      await this.openPort(port);
      this.isConnecting = false;
      return true;
    } catch (err) {
      this.isConnecting = false;
      throw err;
    }
  }

  /** Open port and start the stream reader */
  private async openPort(port: SerialPort) {
    await port.open({ baudRate: 115200 });
    this.port = port;
    this.keepReading = true;
    this.readStreamLoop();
    this.notify();
  }

  /** Read serial byte stream using TextDecoder without locking issues */
  private async readStreamLoop() {
    if (!this.port || !this.port.readable) return;

    const textDecoder = new TextDecoder("utf-8");

    try {
      while (this.port.readable && this.keepReading) {
        this.reader = this.port.readable.getReader();
        try {
          while (this.keepReading) {
            const { value, done } = await this.reader.read();
            if (done) break;
            if (value) {
              const chunk = textDecoder.decode(value, { stream: true });
              this.handleRawData(chunk);
            }
          }
        } catch (err) {
          console.warn("[HardwareSerial] Read error:", err);
        } finally {
          this.reader.releaseLock();
          this.reader = null;
        }
      }
    } catch (err) {
      console.error("[HardwareSerial] Port error:", err);
    } finally {
      await this.cleanupPort();
    }
  }

  /** Process incoming raw text chunks and parse packet lines */
  private handleRawData(chunk: string) {
    this.buffer += chunk;
    const lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop() || "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      this.pushRawLog(line);
      this.parsePacketLine(line);
    }
  }

  /** Push raw line to ring buffer */
  private pushRawLog(line: string) {
    this.rawLogs.unshift(`[${new Date().toLocaleTimeString()}] ${line}`);
    if (this.rawLogs.length > 50) this.rawLogs.pop();
  }

  /** Parse line supporting Format A (Human-Readable) and Format B (CSV / Compact) */
  private parsePacketLine(line: string) {
    let parsed = false;

    // Check for sensor error packet
    if (line.includes("ERR,ERR,ERR")) {
      this.notify();
      return;
    }

    // Format B: Compact CSV (TEMP:28.50,HUM:74.00,SOIL:65.00 or CSV format)
    const compactMatch = line.match(/TEMP:([\d.]+).*?HUM:([\d.]+).*?SOIL:([\d.]+)/i);
    if (compactMatch && compactMatch[1] && compactMatch[2] && compactMatch[3]) {
      const t = parseFloat(compactMatch[1]);
      const h = parseFloat(compactMatch[2]);
      const s = parseFloat(compactMatch[3]);
      if (!isNaN(t) && !isNaN(h) && !isNaN(s)) {
        this.updateReading(t, h, s, line);
        parsed = true;
      }
    }

    // Format A: Human-Readable Multiline Telemetry Block
    if (!parsed) {
      const tempMatch = line.match(/Temperature\s*:\s*([\d.]+)/i);
      if (tempMatch && tempMatch[1]) {
        this.partialHumanBlock.temp = parseFloat(tempMatch[1]);
      }

      const humMatch = line.match(/Humidity\s*:\s*([\d.]+)/i);
      if (humMatch && humMatch[1]) {
        this.partialHumanBlock.hum = parseFloat(humMatch[1]);
      }

      const soilMatch = line.match(/Soil Moisture\s*:\s*([\d.]+)/i);
      if (soilMatch && soilMatch[1]) {
        this.partialHumanBlock.soil = parseFloat(soilMatch[1]);
      }

      if (
        this.partialHumanBlock.temp !== undefined &&
        this.partialHumanBlock.hum !== undefined &&
        this.partialHumanBlock.soil !== undefined
      ) {
        this.updateReading(
          this.partialHumanBlock.temp,
          this.partialHumanBlock.hum,
          this.partialHumanBlock.soil,
          `HumanBlock -> T:${this.partialHumanBlock.temp}°C, H:${this.partialHumanBlock.hum}%, S:${this.partialHumanBlock.soil}%`,
        );
        this.partialHumanBlock = {};
        parsed = true;
      }
    }
  }

  /** Update reading with spike tracking & subscriber notification */
  private updateReading(temperature: number, humidity: number, soilMoisture: number, rawLine?: string) {
    const now = Date.now();
    this.currentReading = {
      temperature,
      humidity,
      soilMoisture,
      timestamp: now,
      rawLine,
    };

    // Track temperature for thermal spike detection
    this.tempHistory.push({ temp: temperature, time: now });
    this.tempHistory = this.tempHistory.filter((h) => now - h.time <= 10000);

    this.notify();
  }

  /** Disconnect and release locks safely */
  public async disconnect() {
    this.keepReading = false;
    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch {
        // reader cancel ignored
      }
    }
    await this.cleanupPort();
    this.notify();
  }

  private async cleanupPort() {
    if (this.port) {
      try {
        await this.port.close();
      } catch {
        // port close ignored
      }
      this.port = null;
    }
    this.notify();
  }

  /** Toggle offline simulated telemetry generator */
  public toggleSimulated(enable?: boolean) {
    const target = enable !== undefined ? enable : !this.isSimulated;
    if (target) {
      this.startSimulation();
    } else {
      this.stopSimulation();
    }
  }

  public startSimulation() {
    if (this.isConnected()) {
      this.disconnect();
    }
    this.isSimulated = true;
    if (this.simulationInterval) clearInterval(this.simulationInterval);

    this.simulationInterval = setInterval(() => {
      // Natural microclimate drift simulation
      const tempDrift = (Math.random() - 0.5) * 0.4;
      const humDrift = (Math.random() - 0.5) * 0.8;
      const soilDrift = (Math.random() - 0.5) * 0.3;

      const newTemp = Math.max(18, Math.min(38, this.currentReading.temperature + tempDrift));
      const newHum = Math.max(45, Math.min(95, this.currentReading.humidity + humDrift));
      const newSoil = Math.max(30, Math.min(85, this.currentReading.soilMoisture + soilDrift));

      const packet = `TEMP:${newTemp.toFixed(2)},HUM:${newHum.toFixed(2)},SOIL:${newSoil.toFixed(2)}`;
      this.pushRawLog(`[SIMULATED] ${packet}`);
      this.updateReading(parseFloat(newTemp.toFixed(2)), parseFloat(newHum.toFixed(2)), parseFloat(newSoil.toFixed(2)), packet);
    }, 2000);

    this.notify();
  }

  public stopSimulation() {
    this.isSimulated = false;
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.notify();
  }

  /** Manual microclimate calibration slider override */
  public setManualReading(temp: number, hum: number, soil: number) {
    const packet = `MANUAL_CALIBRATION -> T:${temp.toFixed(1)}°C, H:${hum.toFixed(1)}%, S:${soil.toFixed(1)}%`;
    this.pushRawLog(`[CALIBRATION] ${packet}`);
    this.updateReading(temp, hum, soil, packet);
  }

  /** Subscribe to telemetry events */
  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    // Emit immediate current state
    listener(this.getLatestReading(), this.getStatus(), this.getAnomaly());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const reading = this.getLatestReading();
    const status = this.getStatus();
    const anomaly = this.getAnomaly();
    for (const listener of this.listeners) {
      listener(reading, status, anomaly);
    }
  }
}

// Global persistent singleton instance
export const hardwareSerial = new HardwareSerialService();
