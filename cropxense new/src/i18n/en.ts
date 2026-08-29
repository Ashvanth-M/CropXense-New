export const en = {
  "app.name": "CropXense",
  "app.owner": "Department of Agriculture, Government of India",

  "nav.home": "Home",
  "nav.overview": "Overview",
  "nav.surveillance": "Surveillance",
  "nav.cases": "Cases",
  "nav.advisories": "Advisories",
  "nav.styleguide": "Style guide",
  "nav.notifications": "Notifications",
  "nav.language": "Language",
  "nav.account": "Account",

  "page.overview.title": "District surveillance overview",
  "page.styleguide.title": "Design system",
  "page.styleguide.sub": "Every token, primitive and interaction state used in CropXense.",

  "status.healthy": "Healthy",
  "status.watch": "Watch",
  "status.critical": "Critical",
  "status.unconfirmed": "Unconfirmed",
  "status.resolved": "Resolved",

  "field.confidence": "Confidence",
  "field.updated": "Updated {n} min ago",
  "field.district": "District",
  "field.crop": "Crop",
  "field.caseId": "Case ID",
  "field.area": "Area (ha)",

  "action.review": "Send for expert review",
  "action.reviewDone": "Sent for expert review",
  "action.viewCase": "Open case",
  "action.cancel": "Cancel",
  "action.save": "Save",

  "note.humanCheck": "Assessment is provisional until a plant-protection officer confirms it.",
  "empty.title": "No reports in this range",
  "empty.body": "Change the date range or district filter to see reports.",
} as const;

export type TranslationKey = keyof typeof en;
