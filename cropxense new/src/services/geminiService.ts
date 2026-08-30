/**
 * CropXense Gemini AI Service.
 *
 * Server-side only — the API key is never exposed to the browser.
 * This module is imported by the API route handler, not by frontend components.
 *
 * Sends crop images + structured observations to Google's Gemini API
 * and returns structured analysis results.
 */

import type { GeminiAnalysisResult } from "@/types";

const GEMINI_MODEL = "gemini-2.0-flash";

function getApiKey(): string {
  // Server-side environment variable (not VITE_ prefixed = server only)
  return process.env.GEMINI_API_KEY || "";
}

/** Language codes to full language names for prompting */
const LANG_NAMES: Record<string, string> = {
  en: "English",
  ta: "Tamil",
  hi: "Hindi",
  mr: "Marathi",
};

/**
 * Build the system prompt for crop health analysis.
 */
function buildCropAnalysisPrompt(language: string): string {
  const langName = LANG_NAMES[language] || "English";
  return `You are an agricultural crop health analysis assistant for CropXense, an Indian agricultural decision-support platform.

IMPORTANT RULES:
1. You are NOT a doctor or certified plant pathologist. You provide decision support only.
2. NEVER fabricate a definitive diagnosis. Always distinguish between:
   - What you can visibly see in the image (raw evidence)
   - What the possible issues MIGHT be (with uncertainty)
   - What the farmer should do next
3. If the image does NOT show a crop leaf or plant part, set "leaf_detected" to false and explain.
4. Express confidence as a percentage (0-100). Be honest about uncertainty.
5. Respond in ${langName} language for the "explanation", "next_action", "uncertainty", and "raw_visible_evidence" fields.
6. Keep explanations simple — the farmer may have limited education. Use field terminology, not scientific jargon.

Return ONLY valid JSON matching this exact structure:
{
  "leaf_detected": boolean,
  "crop": "identified crop name or 'unknown'",
  "symptoms": ["list of visible symptoms"],
  "possible_issues": [
    {"name": "issue name", "likelihood": "high|medium|low", "evidence": "what supports this"}
  ],
  "confidence": number (0-100),
  "severity": "low|medium|high",
  "explanation": "Simple explanation in ${langName}",
  "next_action": "What the farmer should do next, in ${langName}",
  "uncertainty": "What we are NOT sure about, in ${langName}",
  "raw_visible_evidence": "Description of what is actually visible in the image, in ${langName}"
}`;
}

/**
 * Analyse a crop image with Gemini Vision API.
 *
 * @param imageBase64 - Base64-encoded image data (without data: prefix)
 * @param mimeType - Image MIME type (e.g., "image/jpeg")
 * @param observations - Structured farmer observations
 * @param language - Language code for response (en, ta, hi, mr)
 * @param cropName - Selected crop name
 */
export async function analyzeWithGemini(
  imageBase64: string,
  mimeType: string,
  observations: {
    symptoms?: string[];
    affectedCount?: string;
    spreadSpeed?: string;
    firstNoticed?: string;
    cropStage?: string;
    notes?: string;
  },
  language: string = "en",
  cropName?: string,
): Promise<GeminiAnalysisResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const systemPrompt = buildCropAnalysisPrompt(language);

  const userMessage = [
    `Analyse this crop image for health issues.`,
    cropName ? `Farmer reports this is: ${cropName}` : "",
    observations.symptoms?.length ? `Farmer-reported symptoms: ${observations.symptoms.join(", ")}` : "",
    observations.affectedCount ? `Affected plants: ${observations.affectedCount}` : "",
    observations.spreadSpeed ? `Spread rate: ${observations.spreadSpeed}` : "",
    observations.firstNoticed ? `First noticed: ${observations.firstNoticed}` : "",
    observations.cropStage ? `Growth stage: ${observations.cropStage}` : "",
    observations.notes ? `Farmer notes: ${observations.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
          {
            text: userMessage,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      topP: 0.8,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini API error:", response.status, errText);
    throw new Error(`Gemini API returned ${response.status}`);
  }

  const data = await response.json();
  const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textContent) {
    throw new Error("Empty response from Gemini API");
  }

  try {
    const parsed = JSON.parse(textContent) as GeminiAnalysisResult;
    // Ensure required fields have defaults
    return {
      leaf_detected: parsed.leaf_detected ?? false,
      crop: parsed.crop || "unknown",
      symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
      possible_issues: Array.isArray(parsed.possible_issues) ? parsed.possible_issues : [],
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
      severity: parsed.severity || "low",
      explanation: parsed.explanation || "",
      next_action: parsed.next_action || "",
      uncertainty: parsed.uncertainty || "",
      raw_visible_evidence: parsed.raw_visible_evidence || "",
    };
  } catch {
    console.error("Failed to parse Gemini JSON response:", textContent);
    throw new Error("Invalid JSON response from Gemini");
  }
}

/**
 * Analyse a voice transcript with Gemini to extract structured crop health information.
 */
export async function analyzeVoiceTranscriptWithGemini(
  transcript: string,
  language: string = "en",
  cropName?: string,
): Promise<{
  crop: string;
  symptoms: string[];
  severity: "low" | "medium" | "high";
  explanation: string;
  next_action: string;
}> {
  const apiKey = getApiKey();
  if (!apiKey) {
    // Fallback: basic keyword extraction
    return fallbackTranscriptAnalysis(transcript, cropName);
  }

  const langName = LANG_NAMES[language] || "English";

  const prompt = `You are an agricultural assistant. A farmer described their crop problem verbally. Extract structured information from their statement.

Farmer's statement: "${transcript}"
${cropName ? `Known crop: ${cropName}` : ""}

Return ONLY valid JSON:
{
  "crop": "identified crop or 'unknown'",
  "symptoms": ["extracted symptoms"],
  "severity": "low|medium|high",
  "explanation": "Brief analysis in ${langName}",
  "next_action": "What the farmer should do next, in ${langName}"
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) throw new Error(`Gemini API ${response.status}`);

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty response");

    return JSON.parse(text);
  } catch (err) {
    console.error("Gemini voice analysis error:", err);
    return fallbackTranscriptAnalysis(transcript, cropName);
  }
}

function fallbackTranscriptAnalysis(
  transcript: string,
  cropName?: string,
): {
  crop: string;
  symptoms: string[];
  severity: "low" | "medium" | "high";
  explanation: string;
  next_action: string;
} {
  const lower = transcript.toLowerCase();
  const symptoms: string[] = [];

  if (lower.includes("yellow") || lower.includes("पीला") || lower.includes("மஞ்சள்")) symptoms.push("Yellowing / chlorosis");
  if (lower.includes("insect") || lower.includes("कीड़") || lower.includes("பூச்சி")) symptoms.push("Insect damage");
  if (lower.includes("spot") || lower.includes("धब्ब") || lower.includes("புள்ளி")) symptoms.push("Leaf spots");
  if (lower.includes("wilt") || lower.includes("मुरझ") || lower.includes("வாடு")) symptoms.push("Wilting");
  if (lower.includes("hole") || lower.includes("छेद") || lower.includes("துளை")) symptoms.push("Insect holes");
  if (lower.includes("white") || lower.includes("सफेद") || lower.includes("வெள்ளை")) symptoms.push("White coating/insects");
  if (lower.includes("curl") || lower.includes("मुड़") || lower.includes("சுருள்")) symptoms.push("Leaf curling");
  if (lower.includes("sticky") || lower.includes("चिपचिप") || lower.includes("பிசுபிசு")) symptoms.push("Sticky honeydew");
  if (lower.includes("stunt") || lower.includes("बौन") || lower.includes("குட்டை")) symptoms.push("Stunted growth");

  // Try to detect crop from transcript
  let crop = cropName || "unknown";
  if (lower.includes("cotton") || lower.includes("कपास") || lower.includes("பருத்தி")) crop = "cotton";
  if (lower.includes("soybean") || lower.includes("सोयाबीन") || lower.includes("சோயா")) crop = "soybean";
  if (lower.includes("rice") || lower.includes("धान") || lower.includes("நெல்")) crop = "rice";
  if (lower.includes("tomato") || lower.includes("टमाटर") || lower.includes("தக்காளி")) crop = "tomato";

  return {
    crop,
    symptoms,
    severity: symptoms.length >= 3 ? "high" : symptoms.length >= 1 ? "medium" : "low",
    explanation: `Farmer reported ${symptoms.length} symptom(s) in ${crop} crop. An officer should investigate.`,
    next_action: "Request officer field visit for confirmation.",
  };
}
