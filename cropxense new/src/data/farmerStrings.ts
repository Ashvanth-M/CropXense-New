/**
 * Every farmer-facing string, in all three languages.
 * Keep keys flat and descriptive; add new ones here, never inline literals
 * in the farmer route tree.
 */
import { useT } from "@/i18n";

export type FarmerStringKey = keyof typeof farmerStrings;

type Tri = { en: string; mr: string; hi: string };

export const farmerStrings: Record<string, Tri> = {
  "greeting.morning": { en: "Good morning, Ramesh", mr: "नमस्कार, रमेश", hi: "नमस्कार, रमेश" },
  "greeting.farmHealth": { en: "Your farm: {status} risk", mr: "तुमचे शेत: {status} धोका", hi: "आपका खेत: {status} जोखिम" },

  "risk.low": { en: "Low", mr: "कमी", hi: "कम" },
  "risk.moderate": { en: "Moderate", mr: "मध्यम", hi: "मध्यम" },
  "risk.high": { en: "High", mr: "जास्त", hi: "अधिक" },

  "action.scanCrop": { en: "Scan crop", mr: "पीक तपासा", hi: "फसल जाँचें" },
  "action.readMore": { en: "Read more", mr: "अधिक वाचा", hi: "और पढ़ें" },
  "action.askExpert": { en: "Ask an expert", mr: "तज्ज्ञांना विचारा", hi: "विशेषज्ञ से पूछें" },
  "action.analyse": { en: "Analyse", mr: "विश्लेषण करा", hi: "विश्लेषण करें" },
  "action.useSample": { en: "Use sample photo", mr: "नमुना फोटो वापरा", hi: "नमूना फ़ोटो उपयोग करें" },
  "action.changeCrop": { en: "Change crop", mr: "पीक बदला", hi: "फसल बदलें" },
  "action.switchOfficer": { en: "Switch to officer dashboard", mr: "अधिकारी डॅशबोर्डवर जा", hi: "अधिकारी डैशबोर्ड पर जाएँ" },

  "home.activeAlerts": { en: "Active alerts", mr: "सक्रिय सूचना", hi: "सक्रिय अलर्ट" },
  "home.weatherToday": { en: "Weather today", mr: "आजचे हवामान", hi: "आज का मौसम" },
  "home.latestAdvisory": { en: "Latest advisory", mr: "ताजे सल्लापत्र", hi: "नवीनतम परामर्श" },
  "home.noAlerts": { en: "No active alerts right now.", mr: "सध्या कोणतीही सक्रिय सूचना नाही.", hi: "फ़िलहाल कोई सक्रिय अलर्ट नहीं है." },

  "scan.title": { en: "Scan crop", mr: "पीक तपासा", hi: "फसल जाँचें" },
  "scan.captureHint": { en: "Take a clear photo of the affected leaf", mr: "प्रभावित पानाचा स्पष्ट फोटो घ्या", hi: "प्रभावित पत्ती की स्पष्ट फ़ोटो लें" },
  "scan.cropLabel": { en: "Crop", mr: "पीक", hi: "फसल" },
  "scan.analysing": { en: "Analysing your photo…", mr: "तुमचा फोटो तपासला जात आहे…", hi: "आपकी फ़ोटो का विश्लेषण हो रहा है…" },
  "scan.resultAction": { en: "Inspect 15 plants today", mr: "आज 15 रोपांची तपासणी करा", hi: "आज 15 पौधों की जांच करें" },
  "scan.suspected": { en: "Possibly", mr: "शक्यतो", hi: "संभवतः" },
  "scan.notFinal": { en: "This is not a final diagnosis. An officer will confirm it.", mr: "हे अंतिम निदान नाही. अधिकारी याची पुष्टी करतील.", hi: "यह अंतिम निदान नहीं है। अधिकारी इसकी पुष्टि करेंगे।" },
  "scan.confidence": { en: "Confidence", mr: "विश्वासार्हता", hi: "विश्वास स्तर" },

  "fields.title": { en: "Fields", mr: "शेते", hi: "खेत" },
  "fields.lastChecked": { en: "Last checked", mr: "शेवटची तपासणी", hi: "अंतिम जांच" },
  "fields.viewAdvisory": { en: "View advisory", mr: "सल्ला पहा", hi: "परामर्श देखें" },
  "fields.scanThisField": { en: "Scan this field", mr: "हे शेत तपासा", hi: "यह खेत जाँचें" },

  "alerts.title": { en: "Alerts", mr: "सूचना", hi: "अलर्ट" },
  "alerts.actionsToTake": { en: "Actions to take", mr: "करावयाच्या कृती", hi: "की जाने वाली कार्रवाई" },

  "profile.title": { en: "Profile", mr: "प्रोफाइल", hi: "प्रोफ़ाइल" },
  "profile.village": { en: "Village", mr: "गाव", hi: "गाँव" },
  "profile.fields": { en: "Registered fields", mr: "नोंदणीकृत शेते", hi: "पंजीकृत खेत" },
  "profile.language": { en: "Language", mr: "भाषा", hi: "भाषा" },
  "profile.officer": { en: "Extension officer", mr: "विस्तार अधिकारी", hi: "विस्तार अधिकारी" },

  "tab.home": { en: "Home", mr: "मुख्यपृष्ठ", hi: "मुख्यपृष्ठ" },
  "tab.scan": { en: "Scan", mr: "तपासा", hi: "जाँचें" },
  "tab.fields": { en: "Fields", mr: "शेते", hi: "खेत" },
  "tab.alerts": { en: "Alerts", mr: "सूचना", hi: "अलर्ट" },
  "tab.profile": { en: "Profile", mr: "प्रोफाइल", hi: "प्रोफ़ाइल" },

  "frame.caption": { en: "Farmer app — shown at 390 px", mr: "शेतकरी अ‍ॅप — 390 px वर दाखवले", hi: "किसान ऐप — 390 px पर दिखाया गया" },
};

/** Reads the current language from the shared i18n context and resolves a farmer string. */
export function useFarmerT() {
  const { lang } = useT();
  return (key: string, vars?: Record<string, string | number>) => {
    const entry = farmerStrings[key];
    let out = entry ? ((entry as Record<string, string>)[lang] ?? entry.en) : key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
    }
    return out;
  };
}
