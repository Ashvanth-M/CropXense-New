/**
 * CropXense Agronomic Thresholds & Crop Requirement Reference.
 *
 * Configurable environmental requirement ranges for key crops:
 * - Temperature (°C): min, optimal_min, optimal_max, max
 * - Relative Humidity (%): min, optimal_min, optimal_max, max
 * - Soil Moisture (% VWC): min, optimal_min, optimal_max, max
 * - Water Stress Thresholds & Irrigation Triggers
 */

export interface CropAgronomicThreshold {
  id: string;
  name: string;
  vernacular: string;
  season: "kharif" | "rabi" | "zaid" | "perennial";
  temperature: {
    min: number;
    optMin: number;
    optMax: number;
    max: number;
    unit: "°C";
  };
  humidity: {
    min: number;
    optMin: number;
    optMax: number;
    max: number;
    unit: "%";
  };
  soilMoisture: {
    min: number;
    optMin: number;
    optMax: number;
    max: number;
    unit: "% VWC";
  };
  irrigationThresholdVwc: number; // Moisture level at which irrigation is recommended
  criticalStressVwc: number;     // Moisture level indicating severe wilting risk
  favorablePathologyWindow: {
    tempMin: number;
    tempMax: number;
    rhMin: number;
    description: string;
  };
  description: string;
}

export const AGRONOMIC_CROP_THRESHOLDS: Record<string, CropAgronomicThreshold> = {
  cotton: {
    id: "cotton",
    name: "Cotton",
    vernacular: "कपास (Kapas)",
    season: "kharif",
    temperature: { min: 18, optMin: 24, optMax: 34, max: 42, unit: "°C" },
    humidity: { min: 45, optMin: 55, optMax: 75, max: 90, unit: "%" },
    soilMoisture: { min: 25, optMin: 40, optMax: 65, max: 85, unit: "% VWC" },
    irrigationThresholdVwc: 30,
    criticalStressVwc: 18,
    favorablePathologyWindow: {
      tempMin: 22,
      tempMax: 30,
      rhMin: 75,
      description: "High humidity (>75% RH) with moderate temperatures promotes Bacterial Blight and Alternaria leaf spot.",
    },
    description: "Deep-rooted, warm-season crop requiring adequate root-zone moisture during flowering and boll formation.",
  },
  soybean: {
    id: "soybean",
    name: "Soybean",
    vernacular: "सोयाबीन (Soybean)",
    season: "kharif",
    temperature: { min: 18, optMin: 22, optMax: 30, max: 38, unit: "°C" },
    humidity: { min: 50, optMin: 60, optMax: 80, max: 92, unit: "%" },
    soilMoisture: { min: 30, optMin: 45, optMax: 70, max: 88, unit: "% VWC" },
    irrigationThresholdVwc: 35,
    criticalStressVwc: 22,
    favorablePathologyWindow: {
      tempMin: 20,
      tempMax: 28,
      rhMin: 80,
      description: "Continuous wet foliage and high humidity accelerate Asian Rust and Charcoal Rot development.",
    },
    description: "Sensitive to moisture stress at flowering and pod filling. Susceptible to waterlogging during early vegetative phase.",
  },
  rice: {
    id: "rice",
    name: "Rice / Paddy",
    vernacular: "धान / भात (Dhan)",
    season: "kharif",
    temperature: { min: 20, optMin: 25, optMax: 35, max: 42, unit: "°C" },
    humidity: { min: 60, optMin: 70, optMax: 90, max: 98, unit: "%" },
    soilMoisture: { min: 60, optMin: 75, optMax: 95, max: 100, unit: "% VWC" },
    irrigationThresholdVwc: 65,
    criticalStressVwc: 45,
    favorablePathologyWindow: {
      tempMin: 24,
      tempMax: 32,
      rhMin: 85,
      description: "High relative humidity combined with intermittent rain triggers Rice Blast and Bacterial Leaf Blight.",
    },
    description: "Semi-aquatic cereal requiring continuous high moisture availability and high relative humidity.",
  },
  wheat: {
    id: "wheat",
    name: "Wheat",
    vernacular: "गेहूं (Gehun)",
    season: "rabi",
    temperature: { min: 10, optMin: 15, optMax: 25, max: 32, unit: "°C" },
    humidity: { min: 35, optMin: 45, optMax: 65, max: 80, unit: "%" },
    soilMoisture: { min: 25, optMin: 38, optMax: 60, max: 80, unit: "% VWC" },
    irrigationThresholdVwc: 28,
    criticalStressVwc: 18,
    favorablePathologyWindow: {
      tempMin: 15,
      tempMax: 24,
      rhMin: 70,
      description: "Cool humid mornings favor Yellow and Brown Rust spore germination.",
    },
    description: "Cool-season grain sensitive to terminal heat stress above 30°C during grain filling.",
  },
  tomato: {
    id: "tomato",
    name: "Tomato",
    vernacular: "टमाटर (Tamatar)",
    season: "zaid",
    temperature: { min: 15, optMin: 20, optMax: 28, max: 36, unit: "°C" },
    humidity: { min: 45, optMin: 55, optMax: 70, max: 85, unit: "%" },
    soilMoisture: { min: 35, optMin: 50, optMax: 72, max: 90, unit: "% VWC" },
    irrigationThresholdVwc: 40,
    criticalStressVwc: 25,
    favorablePathologyWindow: {
      tempMin: 18,
      tempMax: 27,
      rhMin: 80,
      description: "High humidity and wet leaves create ideal conditions for Early and Late Blight.",
    },
    description: "High-value solanaceous crop requiring consistent soil moisture to prevent blossom-end rot and fruit cracking.",
  },
  onion: {
    id: "onion",
    name: "Onion",
    vernacular: "प्याज / कांदा (Pyaaz)",
    season: "rabi",
    temperature: { min: 13, optMin: 18, optMax: 26, max: 35, unit: "°C" },
    humidity: { min: 40, optMin: 50, optMax: 68, max: 82, unit: "%" },
    soilMoisture: { min: 30, optMin: 42, optMax: 65, max: 85, unit: "% VWC" },
    irrigationThresholdVwc: 35,
    criticalStressVwc: 20,
    favorablePathologyWindow: {
      tempMin: 16,
      tempMax: 25,
      rhMin: 75,
      description: "High humidity fosters Purple Blotch and Stemphylium leaf blight outbreaks.",
    },
    description: "Shallow-rooted bulb crop needing frequent, light irrigations without waterlogging.",
  },
  banana: {
    id: "banana",
    name: "Banana",
    vernacular: "केला (Kela)",
    season: "perennial",
    temperature: { min: 18, optMin: 26, optMax: 35, max: 42, unit: "°C" },
    humidity: { min: 60, optMin: 70, optMax: 90, max: 98, unit: "%" },
    soilMoisture: { min: 45, optMin: 60, optMax: 85, max: 95, unit: "% VWC" },
    irrigationThresholdVwc: 50,
    criticalStressVwc: 30,
    favorablePathologyWindow: {
      tempMin: 23,
      tempMax: 32,
      rhMin: 80,
      description: "Warm, humid conditions promote rapid spread of Sigatoka Leaf Spot and Panama Wilt.",
    },
    description: "Large, high-transpiration crop requiring abundant, consistent root-zone moisture and warm temperatures.",
  },
  sugarcane: {
    id: "sugarcane",
    name: "Sugarcane",
    vernacular: "गन्ना (Ganna)",
    season: "perennial",
    temperature: { min: 20, optMin: 28, optMax: 38, max: 45, unit: "°C" },
    humidity: { min: 50, optMin: 65, optMax: 85, max: 95, unit: "%" },
    soilMoisture: { min: 40, optMin: 55, optMax: 80, max: 95, unit: "% VWC" },
    irrigationThresholdVwc: 45,
    criticalStressVwc: 28,
    favorablePathologyWindow: {
      tempMin: 25,
      tempMax: 34,
      rhMin: 75,
      description: "High humidity during grand growth phase increases susceptibility to Red Rot and Smut.",
    },
    description: "Long-duration, heavy biomass crop demanding substantial irrigation throughout tillering and grand growth phases.",
  },
};
