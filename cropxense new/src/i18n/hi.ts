import type { en } from "./en";

export const hi: Record<keyof typeof en, string> = {
  "app.name": "क्रॉपएक्सेंस",
  "app.owner": "कृषि विभाग, महाराष्ट्र सरकार",

  "nav.home": "मुख्यपृष्ठ",
  "nav.overview": "अवलोकन",
  "nav.surveillance": "निगरानी",
  "nav.cases": "प्रकरण",
  "nav.advisories": "परामर्श",
  "nav.styleguide": "शैली गाइड",
  "nav.notifications": "सूचनाएँ",
  "nav.language": "भाषा",
  "nav.account": "खाता",

  "page.overview.title": "जिला निगरानी अवलोकन",
  "page.styleguide.title": "डिज़ाइन प्रणाली",
  "page.styleguide.sub": "क्रॉपएक्सेंस में प्रयुक्त सभी टोकन, घटक और अवस्थाएँ.",

  "status.healthy": "स्वस्थ",
  "status.watch": "निगरानी",
  "status.critical": "गंभीर",
  "status.unconfirmed": "अपुष्ट",
  "status.resolved": "निपटाया गया",

  "field.confidence": "विश्वास स्तर",
  "field.updated": "{n} मिनट पहले अद्यतन",
  "field.district": "जिला",
  "field.crop": "फसल",
  "field.caseId": "प्रकरण संख्या",
  "field.area": "क्षेत्र (हे.)",

  "action.review": "विशेषज्ञ समीक्षा हेतु भेजें",
  "action.reviewDone": "विशेषज्ञ समीक्षा हेतु भेजा गया",
  "action.viewCase": "प्रकरण खोलें",
  "action.cancel": "रद्द करें",
  "action.save": "सहेजें",

  "note.humanCheck":
    "पादप संरक्षण अधिकारी की पुष्टि तक यह आकलन अनंतिम है.",
  "empty.title": "इस अवधि में कोई रिपोर्ट नहीं",
  "empty.body": "रिपोर्ट देखने के लिए तिथि सीमा या जिला बदलें.",
};
