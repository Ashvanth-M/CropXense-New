/**
 * Full English / Marathi / Hindi advisory text, and the composer templates
 * and lightweight metadata generators used by /app/advisories.
 * A NEW file — nothing in src/data/seed.ts or src/services is edited here.
 */

export interface AdvisoryLangBlock {
  title: string;
  situation: string;
  cultural: string[];
  biological: string[];
  chemical: string[];
}

export interface AdvisoryTranslation {
  en: AdvisoryLangBlock;
  mr: AdvisoryLangBlock;
  hi: AdvisoryLangBlock;
}

export type Lang3 = "en" | "mr" | "hi";
export const LANG3: { code: Lang3; label: string }[] = [
  { code: "en", label: "English" },
  { code: "mr", label: "मराठी" },
  { code: "hi", label: "हिन्दी" },
];

/** Keyed by the Advisory.id produced deterministically in src/data/seed.ts. */
export const ADVISORY_CONTENT: Record<string, AdvisoryTranslation> = {
  "ADV-001": {
    en: {
      title: "Bacterial blight — cotton management advisory",
      situation:
        "Angular leaf spots with yellow haloes are spreading after two days of continuous drizzle. Humidity in the canopy stayed above 80% overnight.",
      cultural: [
        "Remove and burn infected leaves and crop debris away from the field",
        "Stop overhead irrigation until the canopy dries out",
      ],
      biological: ["Apply a Pseudomonas fluorescens foliar spray in the evening"],
      chemical: [
        "A copper-based bactericide is registered for this crop — confirm product and dose with your extension officer before spraying",
      ],
    },
    mr: {
      title: "जिवाणूजन्य करपा — कापूस व्यवस्थापन सल्ला",
      situation:
        "सलग दोन दिवसांच्या रिमझिम पावसानंतर पानांवर पिवळ्या कडेचे कोनीय ठिपके पसरत आहेत. रात्रभर आर्द्रता ८०% पेक्षा जास्त राहिली.",
      cultural: [
        "संक्रमित पाने व पिकांचे अवशेष शेतापासून दूर नेऊन जाळून टाका",
        "पर्णसंभार सुकेपर्यंत वरून पाणी देणे थांबवा",
      ],
      biological: ["संध्याकाळी स्यूडोमोनास फ्लुरोसन्सची फवारणी करा"],
      chemical: [
        "या पिकासाठी तांबेयुक्त जीवाणूनाशक नोंदणीकृत आहे — फवारणीपूर्वी उत्पादन व मात्रा कृषी विस्तार अधिकाऱ्याकडून निश्चित करा",
      ],
    },
    hi: {
      title: "जीवाणु अंगमारी — कपास प्रबंधन सलाह",
      situation:
        "लगातार दो दिन की बूंदाबांदी के बाद पत्तियों पर पीले किनारे वाले कोणीय धब्बे फैल रहे हैं। रातभर आर्द्रता 80% से अधिक रही।",
      cultural: [
        "संक्रमित पत्तियों और फसल अवशेषों को खेत से दूर ले जाकर जला दें",
        "पत्तियां सूखने तक ऊपर से सिंचाई बंद रखें",
      ],
      biological: ["शाम के समय स्यूडोमोनास फ्लोरोसेंस का पर्णीय छिड़काव करें"],
      chemical: [
        "इस फसल के लिए तांबा आधारित जीवाणुनाशक पंजीकृत है — छिड़काव से पहले उत्पाद और मात्रा अपने कृषि विस्तार अधिकारी से तय करें",
      ],
    },
  },
  "ADV-002": {
    en: {
      title: "Pink bollworm — cotton management advisory",
      situation:
        "Pheromone traps recorded 9 moths per night for three consecutive nights, above the action threshold for this stage of boll formation.",
      cultural: [
        "Pick and destroy rosette flowers and shed bolls every week",
        "Do not extend the cotton season past the recommended closing date",
      ],
      biological: [
        "Release Trichogramma bactrae at 1.5 lakh per hectare",
        "Install pheromone traps at 5 per hectare for mass trapping",
      ],
      chemical: [
        "Rotate an approved insecticide group only now that the threshold is crossed — confirm the product and dose with your extension officer",
      ],
    },
    mr: {
      title: "गुलाबी बोंडअळी — कापूस व्यवस्थापन सल्ला",
      situation:
        "सलग तीन रात्री फेरोमोन सापळ्यात रात्री ९ पतंग आढळले, जे बोंड धारणेच्या या टप्प्यासाठी कृती मर्यादेपेक्षा जास्त आहे.",
      cultural: [
        "दर आठवड्याला गुलाबाच्या आकाराची फुले व गळलेली बोंडे वेचून नष्ट करा",
        "शिफारस केलेल्या तारखेनंतर कापूस हंगाम वाढवू नका",
      ],
      biological: [
        "हेक्टरी १.५ लाख ट्रायकोग्रामा बॅक्ट्री सोडा",
        "सामूहिक सापळ्यासाठी हेक्टरी ५ फेरोमोन सापळे लावा",
      ],
      chemical: [
        "मर्यादा ओलांडल्यानंतरच मंजूर कीटकनाशक गटाची फेरपालट करा — उत्पादन व मात्रा कृषी विस्तार अधिकाऱ्याकडून निश्चित करा",
      ],
    },
    hi: {
      title: "गुलाबी सुंडी — कपास प्रबंधन सलाह",
      situation:
        "लगातार तीन रातों तक फेरोमोन ट्रैप में प्रति रात 9 पतंगे मिले, जो बोंड बनने की इस अवस्था की कार्रवाई सीमा से अधिक है।",
      cultural: [
        "हर सप्ताह गुलाब के आकार के फूल और गिरे हुए बोंड चुनकर नष्ट करें",
        "अनुशंसित तिथि के बाद कपास का मौसम न बढ़ाएं",
      ],
      biological: [
        "प्रति हेक्टेयर 1.5 लाख ट्राइकोग्रामा बैक्ट्री छोड़ें",
        "सामूहिक ट्रैपिंग हेतु प्रति हेक्टेयर 5 फेरोमोन ट्रैप लगाएं",
      ],
      chemical: [
        "सीमा पार होने पर ही स्वीकृत कीटनाशक समूह को बदल-बदल कर उपयोग करें — उत्पाद और मात्रा अपने कृषि विस्तार अधिकारी से तय करें",
      ],
    },
  },
  "ADV-003": {
    en: {
      title: "Yellow mosaic virus — soybean management advisory",
      situation:
        "Whitefly counts on the top three leaves have risen sharply in dry, warm weather, and mosaic mottling is visible on new growth.",
      cultural: [
        "Rogue out infected plants as soon as symptoms appear",
        "Keep field bunds weed-free to remove alternate whitefly hosts",
      ],
      biological: [
        "Install yellow sticky traps at 10 per hectare against the whitefly vector",
        "Conserve Encarsia parasitoids by avoiding blanket sprays",
      ],
      chemical: [
        "Vector management only, on your extension officer's advice — no chemical controls the virus itself",
      ],
    },
    mr: {
      title: "पिवळा मोझॅक विषाणू — सोयाबीन व्यवस्थापन सल्ला",
      situation:
        "कोरड्या, उष्ण हवामानात वरील तीन पानांवरील पांढरी माशीची संख्या झपाट्याने वाढली असून नवीन वाढीवर मोझॅकचे ठिपके दिसत आहेत.",
      cultural: [
        "लक्षणे दिसताच संक्रमित रोपे उपटून नष्ट करा",
        "पर्यायी यजमान दूर करण्यासाठी बांध तणमुक्त ठेवा",
      ],
      biological: [
        "पांढऱ्या माशीसाठी हेक्टरी १० पिवळे चिकट सापळे लावा",
        "सरसकट फवारणी टाळून एन्कार्सिया परोपजीवी कीटक जपून ठेवा",
      ],
      chemical: [
        "केवळ वाहक नियंत्रण, कृषी विस्तार अधिकाऱ्याच्या सल्ल्यानेच — कोणतेही रसायन विषाणूवर थेट नियंत्रण करत नाही",
      ],
    },
    hi: {
      title: "पीला मोज़ेक विषाणु — सोयाबीन प्रबंधन सलाह",
      situation:
        "शुष्क, गर्म मौसम में ऊपरी तीन पत्तियों पर सफेद मक्खी की संख्या तेज़ी से बढ़ी है और नई वृद्धि पर मोज़ेक धब्बे दिखाई दे रहे हैं।",
      cultural: [
        "लक्षण दिखते ही संक्रमित पौधों को उखाड़कर नष्ट करें",
        "वैकल्पिक मेज़बानों को हटाने के लिए मेड़ों को खरपतवार-मुक्त रखें",
      ],
      biological: [
        "सफेद मक्खी वाहक के विरुद्ध प्रति हेक्टेयर 10 पीले चिपचिपे ट्रैप लगाएं",
        "सामान्य छिड़काव से बचकर एनकार्सिया परजीवी कीटों को सुरक्षित रखें",
      ],
      chemical: [
        "केवल वाहक नियंत्रण, अपने कृषि विस्तार अधिकारी की सलाह पर — कोई भी रसायन विषाणु को सीधे नियंत्रित नहीं करता",
      ],
    },
  },
  "ADV-004": {
    en: {
      title: "Brown planthopper — rice management advisory",
      situation:
        "Hopper counts near the base of the tillers have crossed 10 per hill in the dense, waterlogged plots inspected this week.",
      cultural: [
        "Switch to alternate wetting and drying to reduce base humidity",
        "Maintain a 30 cm alley every 3 metres for airflow and inspection",
      ],
      biological: ["Conserve mirid bugs and spiders by avoiding broad-spectrum sprays"],
      chemical: [
        "A basal-directed application after the threshold is confirmed — confirm the product and dose with your extension officer",
      ],
    },
    mr: {
      title: "तपकिरी तुडतुडे — भात व्यवस्थापन सल्ला",
      situation:
        "या आठवड्यात पाहणी केलेल्या दाट, पाणी साचलेल्या प्लॉट्समध्ये फुटव्यांच्या तळाशी तुडतुड्यांची संख्या प्रति चूड १० पेक्षा जास्त झाली आहे.",
      cultural: [
        "तळाशी आर्द्रता कमी करण्यासाठी आलटून-पालटून ओलसर व कोरडे पद्धत वापरा",
        "हवा खेळती राहण्यासाठी व पाहणीसाठी दर ३ मीटरला ३० सेमी वाट ठेवा",
      ],
      biological: ["व्यापक फवारणी टाळून मिरीड बग व कोळी जपून ठेवा"],
      chemical: [
        "मर्यादा निश्चित झाल्यावरच तळाशी लक्ष्य करून फवारणी — उत्पादन व मात्रा कृषी विस्तार अधिकाऱ्याकडून निश्चित करा",
      ],
    },
    hi: {
      title: "भूरा फुदका — धान प्रबंधन सलाह",
      situation:
        "इस सप्ताह जांचे गए घने, जलभराव वाले खेतों में कल्लों के आधार पर फुदकों की संख्या प्रति गुच्छा 10 से अधिक हो गई है।",
      cultural: [
        "आधार की नमी घटाने के लिए बारी-बारी गीला-सूखा (AWD) तरीका अपनाएं",
        "हवा और निरीक्षण के लिए हर 3 मीटर पर 30 सेमी की गली रखें",
      ],
      biological: ["व्यापक स्पेक्ट्रम छिड़काव से बचकर मिरिड बग और मकड़ियों को सुरक्षित रखें"],
      chemical: [
        "सीमा की पुष्टि होने के बाद ही आधार-लक्षित छिड़काव करें — उत्पाद और मात्रा अपने कृषि विस्तार अधिकारी से तय करें",
      ],
    },
  },
};

/* ------------------------------------------------------------- composer templates */

export interface AdvisoryTemplate {
  id: string;
  label: string;
  crop: string;
  content: AdvisoryTranslation;
}

export const ADVISORY_TEMPLATES: AdvisoryTemplate[] = [
  { id: "tpl-blight", label: "Bacterial blight (cotton)", crop: "cotton", content: ADVISORY_CONTENT["ADV-001"]! },
  { id: "tpl-pbw", label: "Pink bollworm (cotton)", crop: "cotton", content: ADVISORY_CONTENT["ADV-002"]! },
  { id: "tpl-ymv", label: "Yellow mosaic virus (soybean)", crop: "soybean", content: ADVISORY_CONTENT["ADV-003"]! },
  { id: "tpl-bph", label: "Brown planthopper (rice)", crop: "rice", content: ADVISORY_CONTENT["ADV-004"]! },
  {
    id: "tpl-blank",
    label: "Blank advisory",
    crop: "",
    content: {
      en: { title: "", situation: "", cultural: [], biological: [], chemical: [] },
      mr: { title: "", situation: "", cultural: [], biological: [], chemical: [] },
      hi: { title: "", situation: "", cultural: [], biological: [], chemical: [] },
    },
  },
];

/* -------------------------------------------------------------------- metadata */

export type AdvisorySeverity = "critical" | "high" | "moderate" | "low";
export type DeliveryChannel = "sms" | "app" | "voice";
export type ReadState = "delivered" | "read" | "unread";

export interface AdvisoryMeta {
  severity: AdvisorySeverity;
  officer: string;
  channel: DeliveryChannel;
  readState: ReadState;
  deliveredAt: string;
  readAt?: string;
}

const OFFICERS = ["A. Deshmukh", "M. Jadhav", "Dr. S. Kulkarni", "Dr. R. Pawar", "P. Solanke"];
const CHANNELS: DeliveryChannel[] = ["sms", "app", "voice"];
const READ_STATES: ReadState[] = ["delivered", "read", "unread"];

function hash(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic per-advisory delivery metadata, derived from severity and id. */
export function deriveAdvisoryMeta(id: string, severityLevel: number, issuedAt: string): AdvisoryMeta {
  const h = hash(id);
  const severity: AdvisorySeverity =
    severityLevel >= 5 ? "critical" : severityLevel >= 4 ? "high" : severityLevel >= 2 ? "moderate" : "low";
  const officer = OFFICERS[h % OFFICERS.length]!;
  const channel = CHANNELS[h % CHANNELS.length]!;
  const readState = READ_STATES[(h >> 3) % READ_STATES.length]!;
  const issued = new Date(issuedAt).getTime();
  const deliveredAt = new Date(issued + 4 * 60000).toISOString();
  const readAt = readState === "read" ? new Date(issued + 47 * 60000).toISOString() : undefined;
  return { severity, officer, channel, readState, deliveredAt, ...(readAt ? { readAt } : {}) };
}

export const SEVERITY_LABEL: Record<AdvisorySeverity, string> = {
  critical: "Critical",
  high: "High priority",
  moderate: "Moderate",
  low: "Low",
};

export const SEVERITY_TONE: Record<AdvisorySeverity, string> = {
  critical: "var(--alert)",
  high: "var(--amber)",
  moderate: "var(--water)",
  low: "var(--leaf)",
};

export const CHANNEL_LABEL: Record<DeliveryChannel, string> = {
  sms: "SMS",
  app: "App",
  voice: "Voice call",
};

export const READ_LABEL: Record<ReadState, string> = {
  delivered: "Delivered",
  read: "Read",
  unread: "Unread",
};
