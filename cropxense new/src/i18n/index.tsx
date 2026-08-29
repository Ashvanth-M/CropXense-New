import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { en, type TranslationKey } from "./en";
import { mr } from "./mr";
import { hi } from "./hi";
import { ta } from "./ta";

export type Lang = "en" | "mr" | "hi" | "ta";

export const LANGS: { code: Lang; label: string; htmlLang: string }[] = [
  { code: "en", label: "English", htmlLang: "en" },
  { code: "mr", label: "मराठी", htmlLang: "mr" },
  { code: "hi", label: "हिन्दी", htmlLang: "hi" },
  { code: "ta", label: "தமிழ்", htmlLang: "ta" },
];

const DICTS: Record<Lang, Record<string, string>> = { en, mr, hi, ta };

/* ── Multilingual Domain Mappings (Crops, Stages, Districts, Symptoms) ── */

const CROP_TRANSLATIONS: Record<string, Record<Lang, string>> = {
  cotton: { en: "Cotton", mr: "कापूस", hi: "कपास", ta: "பருத்தி" },
  soybean: { en: "Soybean", mr: "सोयाबीन", hi: "सोयाबीन", ta: "சோயாபீன்" },
  rice: { en: "Rice", mr: "भात", hi: "धान / चावल", ta: "நெல் / அரிசி" },
  sugarcane: { en: "Sugarcane", mr: "ऊस", hi: "गन्ना", ta: "கரும்பு" },
  tomato: { en: "Tomato", mr: "टोमॅटो", hi: "टमाटर", ta: "தக்காளி" },
  onion: { en: "Onion", mr: "कांदा", hi: "प्याज", ta: "வெங்காயம்" },
  wheat: { en: "Wheat", mr: "गहू", hi: "गेहूं", ta: "கோதுமை" },
  banana: { en: "Banana", mr: "केळी", hi: "केला", ta: "வாழை" },
};

const STAGE_TRANSLATIONS: Record<string, Record<Lang, string>> = {
  sowing: { en: "Sowing", mr: "पेरणी", hi: "बुवाई", ta: "விதைத்தல்" },
  vegetative: { en: "Vegetative", mr: "शाकीय वाढ", hi: "वानस्पतिक", ta: "தாவர வளர்ச்சி" },
  tillering: { en: "Tillering", mr: "फुटवे फुटणे", hi: "कल्ले फूटना", ta: "தூர் கட்டுதல்" },
  flowering: { en: "Flowering", mr: "फुलोरा", hi: "फूल आना", ta: "பூக்கும் நிலை" },
  boll_formation: { en: "Boll / Pod formation", mr: "बोंड निर्मिती", hi: "गूलर / फली बनना", ta: "காய் உருவாக்கம்" },
  pod_fill: { en: "Pod fill", mr: "शेंगा भरणे", hi: "फली भरना", ta: "நெற்று நிரம்புதல்" },
  fruiting: { en: "Fruiting", mr: "फळ धारणा", hi: "फल लगना", ta: "பழம் உருவாக்கம்" },
  bulbing: { en: "Bulbing", mr: "कांदा फुगवण", hi: "कंद विकास", ta: "வெங்காய வளர்ச்சி" },
  grand_growth: { en: "Grand growth", mr: "मुख्य वाढ", hi: "तीव्र वृद्धि", ta: "பெரு வளர்ச்சி" },
  harvest: { en: "Harvest", mr: "काढणी", hi: "कटाई", ta: "அறுவடை" },
};

const DISTRICT_TRANSLATIONS: Record<string, Record<Lang, string>> = {
  akola: { en: "Akola", mr: "अकोला", hi: "अकोला", ta: "அகோலா" },
  amravati: { en: "Amravati", mr: "अमरावती", hi: "अमरावती", ta: "அமராவதி" },
  yavatmal: { en: "Yavatmal", mr: "यवतमाळ", hi: "यवतमाल", ta: "யவத்மால்" },
  nagpur: { en: "Nagpur", mr: "नागपूर", hi: "नागपुर", ta: "நாக்பூர்" },
  wardha: { en: "Wardha", mr: "वर्धा", hi: "वर्धा", ta: "வர்தா" },
  jalgaon: { en: "Jalgaon", mr: "जळगाव", hi: "जलगांव", ta: "ஜல்கான்" },
  nashik: { en: "Nashik", mr: "नाशिक", hi: "नासिक", ta: "நாசிக்" },
  pune: { en: "Pune", mr: "पुणे", hi: "पुणे", ta: "புனே" },
  solapur: { en: "Solapur", mr: "सोलापूर", hi: "सोलापुर", ta: "சோலாப்பூர்" },
};

const SYMPTOM_TRANSLATIONS: Record<string, Record<Lang, string>> = {
  "Leaf lesions": { en: "Leaf lesions", mr: "पानावरील डाग", hi: "पत्तियों पर घाव / धब्बे", ta: "இலை புண்கள்" },
  "Yellow margins": { en: "Yellow margins", mr: "पिवळ्या कडा", hi: "पीले किनारे", ta: "மஞ்சள் ஓரங்கள்" },
  "Angular spots": { en: "Angular spots", mr: "कोनीय डाग", hi: "कोणीय धब्बे", ta: "கோணப் புள்ளிகள்" },
  "Powdery coating": { en: "Powdery coating", mr: "पांढरी बुरशी / पावडर", hi: "सफेद पाउडर जैसी परत", ta: "வெள்ளை மாவு படிவு" },
  "Wilting": { en: "Wilting", mr: "झाड सुकणे / कोमेजणे", hi: "मुरझाना", ta: "வாடுதல்" },
  "Insect holes": { en: "Insect holes", mr: "किडीने पाडलेली छिद्रे", hi: "कीटों द्वारा छेद", ta: "பூச்சி துளைகள்" },
  "Sticky honeydew": { en: "Sticky honeydew", mr: "चिकट द्रव", hi: "चिपचिपा रस", ta: "பிசுபிசுப்பான திரவம்" },
  "Rolled leaves": { en: "Rolled leaves", mr: "पाने गुंडाळणे", hi: "मुड़ी हुई पत्तियां", ta: "சுருண்ட இலைகள்" },
  "Dark spots/rings": { en: "Dark spots/rings", mr: "काळे डाग / वलये", hi: "काले धब्बे / छल्ले", ta: "கருப்பு புள்ளிகள்" },
  "Stem girdling": { en: "Stem girdling", mr: "खोडावर चक्री भुंगा खूण", hi: "तने पर छल्ला पड़ना", ta: "தண்டு வளையம்" },
  "Yellowing / chlorosis": { en: "Yellowing / chlorosis", mr: "पाने पिवळी पडणे", hi: "पत्तियों का पीलापन", ta: "இலைகள் மஞ்சளாதல்" },
  "Dark spots / lesions": { en: "Dark spots / lesions", mr: "काळे ठिपके", hi: "काले धब्बे", ta: "கருப்பு திட்டுகள்" },
  "Leaf browning": { en: "Leaf browning", mr: "पाने तांबूस होणे", hi: "पत्तियों का भूरापन", ta: "இலைகள் பழுப்பாதல்" },
  "Marginal yellowing": { en: "Marginal yellowing", mr: "कडेने पिवळेपणा", hi: "किनारों पर पीलापन", ta: "ஓரங்களில் மஞ்சளாதல்" },
  "Irregular patches": { en: "Irregular patches", mr: "अनियमित ठिपके", hi: "अनियमित चकत्ते", ta: "ஒழுங்கற்ற திட்டுகள்" },
  "Possible leaf curling": { en: "Possible leaf curling", mr: "पानांची चुरड", hi: "पत्ती मुड़ना", ta: "இலை சுருட்டு" },
  "Leaf appears healthy": { en: "Leaf appears healthy", mr: "पान निरोगी दिसत आहे", hi: "पत्ती स्वस्थ दिख रही है", ta: "இலை ஆரோக்கியமாக உள்ளது" },
};

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  cycle: () => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  tCrop: (cropId: string) => string;
  tStage: (stage: string) => string;
  tDistrict: (districtId: string) => string;
  tSymptom: (symptom: string) => string;
  tRisk: (risk: string) => string;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("cropxense.lang") as Lang | null;
    if (stored && stored in DICTS) setLang(stored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("cropxense.lang", lang);
    document.documentElement.lang = LANGS.find((l) => l.code === lang)?.htmlLang ?? "en";
  }, [lang]);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      let out = DICTS[lang]?.[key] ?? en[key] ?? String(key);
      if (vars) {
        for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
      }
      return out;
    },
    [lang],
  );

  const tCrop = useCallback(
    (cropId: string) => {
      const norm = cropId?.toLowerCase();
      return CROP_TRANSLATIONS[norm]?.[lang] ?? CROP_TRANSLATIONS[norm]?.en ?? cropId;
    },
    [lang],
  );

  const tStage = useCallback(
    (stage: string) => {
      const norm = stage?.toLowerCase();
      return STAGE_TRANSLATIONS[norm]?.[lang] ?? STAGE_TRANSLATIONS[norm]?.en ?? stage?.replace("_", " ");
    },
    [lang],
  );

  const tDistrict = useCallback(
    (districtId: string) => {
      const norm = districtId?.toLowerCase();
      return DISTRICT_TRANSLATIONS[norm]?.[lang] ?? DISTRICT_TRANSLATIONS[norm]?.en ?? districtId;
    },
    [lang],
  );

  const tSymptom = useCallback(
    (symptom: string) => {
      return SYMPTOM_TRANSLATIONS[symptom]?.[lang] ?? SYMPTOM_TRANSLATIONS[symptom]?.en ?? symptom;
    },
    [lang],
  );

  const tRisk = useCallback(
    (risk: string) => {
      const norm = risk?.toLowerCase();
      if (norm === "high") return t("risk.high");
      if (norm === "moderate") return t("risk.moderate");
      if (norm === "low") return t("risk.low");
      return risk;
    },
    [lang, t],
  );

  const cycle = useCallback(() => {
    setLang((cur) => {
      const next = LANGS[(LANGS.findIndex((l) => l.code === cur) + 1) % LANGS.length];
      return next ? next.code : "en";
    });
  }, []);

  const value = useMemo(
    () => ({ lang, setLang, cycle, t, tCrop, tStage, tDistrict, tSymptom, tRisk }),
    [lang, cycle, t, tCrop, tStage, tDistrict, tSymptom, tRisk],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used inside <I18nProvider>");
  return ctx;
}
