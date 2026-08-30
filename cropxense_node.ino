/**
 * CropXense Microclimate Node Reference Firmware
 * Target: Arduino Uno / Nano / ESP32 / ESP8266 / Raspberry Pi Pico
 * Sensors:
 *  - DHT22 / DHT11 Digital Temperature & Humidity Sensor (Pin D4)
 *  - Analog Capacitive / Resistive Soil Moisture Sensor (Pin A0)
 * Baud Rate: 115200
 */

#include <DHT.h>

#define DHTPIN 4
#define DHTTYPE DHT22
#define SOIL_PIN A0

// Soil Moisture Calibration Constants (Analog ADC range)
// Dry air value ~580 (0% moisture), Submerged in water ~240 (100% moisture)
#define DRY_VALUE 580
#define WET_VALUE 240

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  pinMode(SOIL_PIN, INPUT);
  dht.begin();
  
  // Warm-up delay for DHT sensor stabilization
  delay(1000);
  Serial.println("[CROPXENSE_NODE_READY] Baud: 115200, DHT22 Pin 4, Soil Pin A0");
}

void loop() {
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  int rawSoil = analogRead(SOIL_PIN);
  
  // Constrain and map soil analog reading to Volumetric Water Content % (0-100%)
  int constrainedSoil = constrain(rawSoil, min(DRY_VALUE, WET_VALUE), max(DRY_VALUE, WET_VALUE));
  float soilMoisturePct = constrain(map(constrainedSoil, DRY_VALUE, WET_VALUE, 0, 100), 0.0, 100.0);

  // Check for sensor read failure
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("ERR,ERR,ERR");
    delay(2000);
    return;
  }

  // Format A: Human-Readable Telemetry Block
  Serial.println("------------------------");
  Serial.print("Temperature : "); Serial.print(temperature, 2); Serial.println(" °C");
  Serial.print("Humidity : "); Serial.print(humidity, 2); Serial.println(" %");
  Serial.print("Soil Moisture: "); Serial.print((int)round(soilMoisturePct)); Serial.println(" %");
  Serial.println("------------------------");

  // Format B: Compact High-Throughput CSV
  Serial.print("TEMP:"); Serial.print(temperature, 2);
  Serial.print(",HUM:"); Serial.print(humidity, 2);
  Serial.print(",SOIL:"); Serial.println(soilMoisturePct, 2);

  delay(2000);
}
