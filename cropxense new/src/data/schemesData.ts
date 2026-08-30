/**
 * CropXense Farmer Schemes Reference Data.
 *
 * Verified government agricultural schemes for Indian farmers.
 * For MVP demonstration — verify eligibility with official agriculture department.
 *
 * Sources: Ministry of Agriculture & Farmers Welfare, Government of India.
 */

import type { SchemeInfo } from "@/types";

export const FARMER_SCHEMES: SchemeInfo[] = [
  {
    id: "pm-kisan",
    name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    description: "Direct income support scheme providing ₹6,000 per year to farmer families in three equal instalments of ₹2,000 each.",
    category: "income_support",
    eligibility: "All landholding farmer families with cultivable land. Certain categories like institutional landholders, income tax payers, and constitutional post holders are excluded.",
    benefits: "₹6,000 per year (₹2,000 every 4 months) directly to farmer's bank account.",
    documents: "Aadhaar card, bank account details, land ownership records, mobile number.",
    applicationMethod: "Apply online at pmkisan.gov.in or through Common Service Centre (CSC). State agriculture officers can also register farmers.",
    officialSource: "https://pmkisan.gov.in",
    lastVerifiedAt: "2026-08-01",
  },
  {
    id: "pmfby",
    name: "PMFBY (Pradhan Mantri Fasal Bima Yojana)",
    description: "Comprehensive crop insurance scheme protecting farmers against crop loss due to natural calamities, pests, and diseases.",
    category: "crop_insurance",
    eligibility: "All farmers growing notified crops in notified areas. Both loanee and non-loanee farmers can enroll. Voluntary for all farmers.",
    benefits: "Coverage for crop loss from sowing to post-harvest. Farmer premium: 2% for Kharif, 1.5% for Rabi, 5% for commercial crops. Government pays the remaining premium.",
    documents: "Aadhaar card, bank account, land records (7/12 extract), sowing certificate, crop details.",
    applicationMethod: "Apply through bank (if loanee), insurance company, CSC, or PMFBY portal. Enroll before cut-off date for each crop season.",
    officialSource: "https://pmfby.gov.in",
    lastVerifiedAt: "2026-08-01",
  },
  {
    id: "soil-health-card",
    name: "Soil Health Card Scheme",
    description: "Government scheme providing soil health cards to farmers with crop-wise nutrient recommendations to improve soil health and productivity.",
    category: "soil_health",
    eligibility: "All farmers. Soil samples are collected from farmland and tested in government laboratories.",
    benefits: "Free soil testing, nutrient status report, crop-wise fertilizer recommendations, soil health improvement advisory.",
    documents: "Land details, Aadhaar card. No documents required for soil testing — contact local agriculture office.",
    applicationMethod: "Contact district agriculture office or Krishi Vigyan Kendra (KVK). Soil samples collected by trained staff.",
    officialSource: "https://soilhealth.dac.gov.in",
    lastVerifiedAt: "2026-08-01",
  },
  {
    id: "kcc",
    name: "KCC (Kisan Credit Card)",
    description: "Provides affordable short-term credit to farmers for cultivation, post-harvest, and consumption needs at subsidized interest rates.",
    category: "agricultural_loans",
    eligibility: "All farmers — individual/joint borrowers who are owner cultivators, tenant farmers, oral lessees, or share croppers. Also covers fisheries and animal husbandry.",
    benefits: "Credit limit up to ₹3 lakh at 4% interest (with prompt repayment). Crop insurance, personal accident insurance included. Flexible withdrawal.",
    documents: "Aadhaar card, PAN card, land records, passport-size photos, bank account. Existing bank customers may need fewer documents.",
    applicationMethod: "Apply at any commercial bank, cooperative bank, or regional rural bank. PM-KISAN beneficiaries get simplified KCC.",
    officialSource: "https://www.pmkisan.gov.in/KCC",
    lastVerifiedAt: "2026-08-01",
  },
  {
    id: "rkvy",
    name: "RKVY-RAFTAAR (Rashtriya Krishi Vikas Yojana)",
    description: "Incentivizes states to increase investment in agriculture and allied sectors. Supports agri-infrastructure, innovation, and agri-entrepreneurs.",
    category: "input_assistance",
    eligibility: "Farmers, farmer producer organisations (FPOs), agri-entrepreneurs. State government nominates beneficiaries through district agriculture plans.",
    benefits: "Grants for agriculture infrastructure, agri-business incubation, farm mechanization, and innovation projects.",
    documents: "Project proposal, Aadhaar, bank details, land/enterprise documents as applicable.",
    applicationMethod: "Apply through state agriculture department or RKVY-RAFTAAR portal. Contact district agriculture officer for guidance.",
    officialSource: "https://rkvy.nic.in",
    lastVerifiedAt: "2026-08-01",
  },
  {
    id: "pmksy",
    name: "PMKSY (Pradhan Mantri Krishi Sinchayee Yojana)",
    description: "Provides end-to-end solutions in irrigation supply chain with a focus on 'Har Khet Ko Paani' (water to every field) and 'More Crop Per Drop'.",
    category: "irrigation",
    eligibility: "All farmers. Priority for small and marginal farmers, SC/ST farmers. Micro-irrigation (drip/sprinkler) subsidy available.",
    benefits: "Subsidy on micro-irrigation systems: 55% for small/marginal farmers, 45% for others. Water harvesting structures, farm ponds.",
    documents: "Aadhaar, land records, bank account, caste certificate if applicable.",
    applicationMethod: "Apply through state agriculture/horticulture department or district irrigation office. Online portal varies by state.",
    officialSource: "https://pmksy.gov.in",
    lastVerifiedAt: "2026-08-01",
  },
  {
    id: "sub-mission-farm-mechanization",
    name: "Sub-Mission on Agricultural Mechanization (SMAM)",
    description: "Promotes farm mechanization by providing subsidies on purchase of agricultural machinery and equipment.",
    category: "equipment_subsidy",
    eligibility: "Individual farmers, FPOs, cooperative societies, self-help groups, and panchayats. Priority for SC/ST/women farmers.",
    benefits: "Subsidy of 40-50% on purchase of tractors, power tillers, harvesting machines, sprayers, and other equipment. Custom Hiring Centres.",
    documents: "Aadhaar, land records, bank account, quotation from authorized dealer.",
    applicationMethod: "Apply online through DBT Agriculture portal or contact district agriculture office. Some states have separate portals.",
    officialSource: "https://agrimachinery.nic.in",
    lastVerifiedAt: "2026-08-01",
  },
  {
    id: "nfsm",
    name: "NFSM (National Food Security Mission)",
    description: "Aims to increase production and productivity of wheat, rice, pulses, coarse cereals, and commercial crops through area expansion and technology dissemination.",
    category: "crop_protection",
    eligibility: "All farmers growing targeted crops (rice, wheat, pulses, coarse cereals, nutri-cereals, cotton, jute, sugarcane).",
    benefits: "Subsidized seeds, plant protection chemicals, micro-nutrients, sprinkler sets, farm machinery, and cropping system demonstrations.",
    documents: "Aadhaar, land records, bank account. Contact local agriculture office for crop-specific benefits.",
    applicationMethod: "Through state agriculture department. Benefits distributed via district agriculture offices during crop season.",
    officialSource: "https://nfsm.gov.in",
    lastVerifiedAt: "2026-08-01",
  },
];

/** Scheme categories with labels */
export const SCHEME_CATEGORIES: { id: SchemeInfo["category"]; label: string; labelMr: string; labelHi: string; labelTa: string }[] = [
  { id: "crop_insurance", label: "Crop Insurance", labelMr: "पीक विमा", labelHi: "फसल बीमा", labelTa: "பயிர் காப்பீடு" },
  { id: "input_assistance", label: "Input Assistance", labelMr: "निविष्ठा सहाय्य", labelHi: "इनपुट सहायता", labelTa: "உள்ளீடு உதவி" },
  { id: "irrigation", label: "Irrigation", labelMr: "सिंचन", labelHi: "सिंचाई", labelTa: "நீர்ப்பாசனம்" },
  { id: "equipment_subsidy", label: "Equipment & Subsidy", labelMr: "उपकरणे व अनुदान", labelHi: "उपकरण और सब्सिडी", labelTa: "உபகரணம் & மானியம்" },
  { id: "soil_health", label: "Soil Health", labelMr: "माती आरोग्य", labelHi: "मृदा स्वास्थ्य", labelTa: "மண் ஆரோக்கியம்" },
  { id: "income_support", label: "Farmer Income Support", labelMr: "शेतकरी उत्पन्न सहाय्य", labelHi: "किसान आय सहायता", labelTa: "விவசாயி வருமான ஆதரவு" },
  { id: "crop_protection", label: "Crop Protection", labelMr: "पीक संरक्षण", labelHi: "फसल सुरक्षा", labelTa: "பயிர் பாதுகாப்பு" },
  { id: "agricultural_loans", label: "Agricultural Loans", labelMr: "कृषी कर्ज", labelHi: "कृषि ऋण", labelTa: "விவசாய கடன்" },
];

/**
 * Simple rule-based eligibility check for MVP.
 * NOT a guarantee — always advise farmers to verify with the agriculture department.
 */
export function checkSchemeEligibility(
  schemeId: string,
  input: {
    crop?: string;
    landSizeHa?: number;
    district?: string;
    farmerCategory?: string;
    hasIrrigation?: boolean;
  },
): { status: "likely_eligible" | "needs_verification" | "not_enough_info"; reason: string } {
  const scheme = FARMER_SCHEMES.find((s) => s.id === schemeId);
  if (!scheme) return { status: "not_enough_info", reason: "Scheme not found." };

  // If no input provided at all
  if (!input.crop && !input.landSizeHa && !input.district) {
    return { status: "not_enough_info", reason: "Please provide crop, land size, and location details to check eligibility." };
  }

  switch (schemeId) {
    case "pm-kisan":
      if (input.landSizeHa && input.landSizeHa > 0) {
        return { status: "likely_eligible", reason: "As a landholding farmer, you are likely eligible for PM-KISAN. Register at pmkisan.gov.in or your local agriculture office." };
      }
      return { status: "needs_verification", reason: "PM-KISAN requires cultivable land ownership. Verify your land records with the agriculture office." };

    case "pmfby":
      if (input.crop && input.landSizeHa) {
        return { status: "likely_eligible", reason: `You can insure your ${input.crop} crop under PMFBY. Enroll before the season deadline through your bank or insurance company.` };
      }
      return { status: "needs_verification", reason: "PMFBY requires crop and land details. Check if your crop is notified in your district." };

    case "kcc":
      if (input.landSizeHa && input.landSizeHa > 0) {
        return { status: "likely_eligible", reason: "Farmers with cultivable land are eligible for KCC. Apply at your bank branch." };
      }
      return { status: "needs_verification", reason: "KCC eligibility depends on land ownership. Contact your bank for details." };

    case "pmksy":
      if (input.hasIrrigation === false) {
        return { status: "likely_eligible", reason: "Farmers without irrigation facilities are priority beneficiaries for PMKSY micro-irrigation subsidies." };
      }
      if (input.hasIrrigation === true) {
        return { status: "needs_verification", reason: "You may still qualify for upgraded irrigation equipment. Check with your district agriculture office." };
      }
      return { status: "needs_verification", reason: "PMKSY eligibility depends on your irrigation status. Contact the district irrigation office." };

    case "soil-health-card":
      return { status: "likely_eligible", reason: "All farmers can get a free Soil Health Card. Contact your local agriculture office or KVK." };

    case "sub-mission-farm-mechanization":
      if (input.landSizeHa && input.landSizeHa <= 2) {
        return { status: "likely_eligible", reason: "Small and marginal farmers get higher subsidy (50%) on farm equipment under SMAM." };
      }
      if (input.landSizeHa) {
        return { status: "likely_eligible", reason: "You are eligible for 40% subsidy on farm equipment under SMAM." };
      }
      return { status: "needs_verification", reason: "Subsidy rate depends on land size and farmer category. Check with the agriculture office." };

    default:
      return { status: "needs_verification", reason: "Please verify eligibility details with your district agriculture office." };
  }
}
