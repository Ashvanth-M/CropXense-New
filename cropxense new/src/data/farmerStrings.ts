/**
 * Every farmer-facing string, in all 4 supported languages.
 * Integrated with the canonical CropXense i18n system.
 */
import { useT, type Lang } from "@/i18n";

export type FarmerStringKey = keyof typeof farmerStrings;

type Quad = { en: string; mr: string; hi: string; ta: string };

export const farmerStrings: Record<string, Quad> = {
  "greeting.morning": { en: "Good morning, Ramesh", mr: "नमस्कार, रमेश", hi: "नमस्कार, रमेश", ta: "காலை வணக்கம், ரமேஷ்" },
  "greeting.farmHealth": { en: "Your farm: {status} risk", mr: "तुमचे शेत: {status} धोका", hi: "आपका खेत: {status} जोखिम", ta: "உங்கள் பண்ணை: {status} ஆபத்து" },

  "risk.low": { en: "Low", mr: "कमी", hi: "कम", ta: "குறைந்த" },
  "risk.moderate": { en: "Moderate", mr: "मध्यम", hi: "मध्यम", ta: "மிதமான" },
  "risk.high": { en: "High", mr: "जास्त", hi: "अधिक", ta: "அதிக" },

  "action.scanCrop": { en: "Scan crop", mr: "पीक तपासा", hi: "फसल जाँचें", ta: "பயிர் ஸ்கேன்" },
  "action.readMore": { en: "Read more", mr: "अधिक वाचा", hi: "और पढ़ें", ta: "மேலும் படிக்க" },
  "action.askExpert": { en: "Ask an expert", mr: "तज्ज्ञांना विचारा", hi: "विशेषज्ञ से पूछें", ta: "நிபுணரிடம் கேளுங்கள்" },
  "action.analyse": { en: "Analyse", mr: "विश्लेषण करा", hi: "विश्लेषण करें", ta: "பகுப்பாய்வு செய்" },
  "action.useSample": { en: "Use sample photo", mr: "नमुना फोटो वापरा", hi: "नमूना फ़ोटो उपयोग करें", ta: "மாதிரி புகைப்படம் பயன்படுத்து" },
  "action.changeCrop": { en: "Change crop", mr: "पीक बदला", hi: "फसल बदलें", ta: "பயிர் மாற்று" },
  "action.switchOfficer": { en: "Switch to officer dashboard", mr: "अधिकारी डॅशबोर्डवर जा", hi: "अधिकारी डैशबोर्ड पर जाएँ", ta: "அதிகாரி டாஷ்போர்டுக்கு மாறு" },

  "home.activeAlerts": { en: "Active alerts", mr: "सक्रिय सूचना", hi: "सक्रिय अलर्ट", ta: "செயலில் எச்சரிக்கைகள்" },
  "home.weatherToday": { en: "Weather today", mr: "आजचे हवामान", hi: "आज का मौसम", ta: "இன்றைய வானிலை" },
  "home.latestAdvisory": { en: "Latest advisory", mr: "ताजे सल्लापत्र", hi: "नवीनतम परामर्श", ta: "சமீபத்திய ஆலோசனை" },
  "home.noAlerts": { en: "No active alerts right now.", mr: "सध्या कोणतीही सक्रिय सूचना नाही.", hi: "फ़िलहाल कोई सक्रिय अलर्ट नहीं है.", ta: "தற்போது எச்சரிக்கைகள் இல்லை." },

  "scan.title": { en: "Scan crop", mr: "पीक तपासा", hi: "फसल जाँचें", ta: "பயிர் ஸ்கேன்" },
  "scan.captureHint": { en: "Take a clear photo of the affected leaf", mr: "प्रभावित पानाचा स्पष्ट फोटो घ्या", hi: "प्रभावित पत्ती की स्पष्ट फ़ोटो लें", ta: "பாதிக்கப்பட்ட இலையின் தெளிவான படம் எடுங்கள்" },
  "scan.cropLabel": { en: "Crop", mr: "पीक", hi: "फसल", ta: "பயிர்" },
  "scan.analysing": { en: "Analysing your photo…", mr: "तुमचा फोटो तपासला जात आहे…", hi: "आपकी फ़ोटो का विश्लेषण हो रहा है…", ta: "உங்கள் படம் பகுப்பாய்வு செய்யப்படுகிறது…" },
  "scan.resultAction": { en: "Inspect 15 plants today", mr: "आज 15 रोपांची तपासणी करा", hi: "आज 15 पौधों की जांच करें", ta: "இன்று 15 தாவரங்களை ஆய்வு செய்யுங்கள்" },
  "scan.suspected": { en: "Possibly", mr: "शक्यतो", hi: "संभवतः", ta: "சாத்தியமாக" },
  "scan.notFinal": { en: "This is not a final diagnosis. An officer will confirm it.", mr: "हे अंतिम निदान नाही. अधिकारी याची पुष्टी करतील.", hi: "यह अंतिम निदान नहीं है। अधिकारी इसकी पुष्टि करेंगे।", ta: "இது இறுதி நோயறிதல் அல்ல. அதிகாரி உறுதிப்படுத்துவார்." },
  "scan.confidence": { en: "Confidence", mr: "विश्वासार्हता", hi: "विश्वास स्तर", ta: "நம்பகத்தன்மை" },

  "fields.title": { en: "Fields", mr: "शेते", hi: "खेत", ta: "வயல்கள்" },
  "fields.lastChecked": { en: "Last checked", mr: "शेवटची तपासणी", hi: "अंतिम जांच", ta: "கடைசி சோதனை" },
  "fields.viewAdvisory": { en: "View advisory", mr: "सल्ला पहा", hi: "परामर्श देखें", ta: "ஆலோசனை பார்க்க" },
  "fields.scanThisField": { en: "Scan this field", mr: "हे शेत तपासा", hi: "यह खेत जाँचें", ta: "இந்த வயலை ஸ்கேன் செய்" },

  "alerts.title": { en: "Alerts", mr: "सूचना", hi: "अलर्ट", ta: "எச்சரிக்கைகள்" },
  "alerts.actionsToTake": { en: "Actions to take", mr: "करावयाच्या कृती", hi: "की जाने वाली कार्रवाई", ta: "எடுக்க வேண்டிய நடவடிக்கைகள்" },

  "profile.title": { en: "Profile", mr: "प्रोफाइल", hi: "प्रोफ़ाइल", ta: "சுயவிவரம்" },
  "profile.village": { en: "Village", mr: "गाव", hi: "गाँव", ta: "கிராமம்" },
  "profile.fields": { en: "Registered fields", mr: "नोंदणीकृत शेते", hi: "पंजीकृत खेत", ta: "பதிவு செய்யப்பட்ட வயல்கள்" },
  "profile.language": { en: "Language", mr: "भाषा", hi: "भाषा", ta: "மொழி" },
  "profile.officer": { en: "Extension officer", mr: "विस्तार अधिकारी", hi: "विस्तार अधिकारी", ta: "விரிவாக்க அதிகாரி" },

  "tab.home": { en: "Home", mr: "मुख्यपृष्ठ", hi: "मुख्यपृष्ठ", ta: "முகப்பு" },
  "tab.scan": { en: "Scan", mr: "तपासा", hi: "जाँचें", ta: "ஸ்கேன்" },
  "tab.fields": { en: "Fields", mr: "शेते", hi: "खेत", ta: "வயல்கள்" },
  "tab.alerts": { en: "Alerts", mr: "सूचना", hi: "अलर्ट", ta: "எச்சரிக்கைகள்" },
  "tab.profile": { en: "Profile", mr: "प्रोफाइल", hi: "प्रोफ़ाइल", ta: "சுயவிவரம்" },

  "frame.caption": { en: "Farmer app — shown at 390 px", mr: "शेतकरी अ‍ॅप — 390 px वर दाखवले", hi: "किसान ऐप — 390 px पर दिखाया गया", ta: "விவசாயி ஆப் — 390 px" },
};

/** Reads the current language from the shared i18n context and resolves a farmer string. */
export function useFarmerT() {
  const { lang } = useT();
  return (key: string, vars?: Record<string, string | number>) => {
    const entry = farmerStrings[key];
    let out = entry ? (entry[lang as Lang] ?? entry.en) : key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
    }
    return out;
  };
}
