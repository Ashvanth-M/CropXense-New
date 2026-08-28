export const SIGNALS = [
  { key: "image", label: "IMAGE", text: "lesion pattern consistent with leaf blight" },
  { key: "sensor", label: "SENSOR", text: "leaf wetness 11.2 h  ·  RH 88%" },
  { key: "weather", label: "WEATHER", text: "rainfall 34 mm / 48 h" },
  { key: "trap", label: "PEST TRAP", text: "bollworm 18 vs ETL 12" },
  { key: "history", label: "HISTORY", text: "4 confirmed cases within 6 km" },
] as const;

export const STEPS = ["DETECT", "PREDICT", "ACT", "VERIFY", "LEARN"] as const;

export const ASSESSMENT = "Leaf blight — moderate";
export const CONFIDENCE = 92;
export const STATUS_LINE = "awaiting expert validation";
