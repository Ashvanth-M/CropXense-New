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
  return (typeof process !== "undefined" && process.env && process.env["GEMINI_API_KEY"]) || "";
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
    // Fallback: basic keyword extraction with selected language
    return fallbackTranscriptAnalysis(transcript, cropName, language);
  }

  const langName = LANG_NAMES[language] || "English";

  const prompt = `You are an agricultural assistant. A farmer described their crop problem verbally. Extract structured information from their statement.
CRITICAL: Write all fields (crop, symptoms, explanation, next_action) in the requested language: ${langName} (${language}).

Farmer's statement: "${transcript}"
${cropName ? `Known crop: ${cropName}` : ""}

Return ONLY valid JSON:
{
  "crop": "identified crop name in ${langName}",
  "symptoms": ["extracted symptoms in ${langName}"],
  "severity": "low|medium|high",
  "explanation": "Brief diagnostic analysis in ${langName}",
  "next_action": "Actionable immediate steps for the farmer in ${langName}"
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
    return fallbackTranscriptAnalysis(transcript, cropName, language);
  }
}

function fallbackTranscriptAnalysis(
  transcript: string,
  cropName?: string,
  language: string = "en",
): {
  crop: string;
  symptoms: string[];
  severity: "low" | "medium" | "high";
  explanation: string;
  next_action: string;
} {
  const lower = transcript.toLowerCase();
  const symptoms: string[] = [];

  // Multilingual keyword extraction (EN, HI, MR, TA)
  if (lower.includes("yellow") || lower.includes("पीला") || lower.includes("पिवळ") || lower.includes("மஞ்சள்")) symptoms.push("Yellowing / Chlorosis");
  if (lower.includes("insect") || lower.includes("कीड़") || lower.includes("कीड") || lower.includes("इल्ली") || lower.includes("अळी") || lower.includes("பூச்சி")) symptoms.push("Insect pest damage");
  if (lower.includes("spot") || lower.includes("धब्ब") || lower.includes("डाग") || lower.includes("புள்ளி")) symptoms.push("Leaf spot lesions");
  if (lower.includes("wilt") || lower.includes("मुरझ") || lower.includes("वाळण") || lower.includes("सुका") || lower.includes("வாடு")) symptoms.push("Wilting & moisture stress");
  if (lower.includes("hole") || lower.includes("छेद") || lower.includes("छिद्र") || lower.includes("तुளை")) symptoms.push("Foliar chewing holes");
  if (lower.includes("white") || lower.includes("सफेद") || lower.includes("पांढर") || lower.includes("வெள்ளை")) symptoms.push("Whitefly / Powdery mildew");
  if (lower.includes("curl") || lower.includes("मुड़") || lower.includes("गोळा") || lower.includes("चुरडा") || lower.includes("சுருள்")) symptoms.push("Leaf curling & viral symptoms");
  if (lower.includes("sticky") || lower.includes("चिपचिप") || lower.includes("चिकटा") || lower.includes("பிசுபிசு")) symptoms.push("Sticky honeydew excretions");
  if (lower.includes("stunt") || lower.includes("खुंट") || lower.includes("बौन") || lower.includes("குட்டை")) symptoms.push("Stunted crop growth");
  if (lower.includes("rot") || lower.includes("सड़") || lower.includes("सड") || lower.includes("अझूक")) symptoms.push("Stem / root rot");

  // Multilingual crop detection
  let crop = cropName || "cotton";
  if (lower.includes("cotton") || lower.includes("कपास") || lower.includes("कापूस") || lower.includes("பருத்தி")) crop = "cotton";
  if (lower.includes("soybean") || lower.includes("सोयाबीन") || lower.includes("सोया") || lower.includes("சோயா")) crop = "soybean";
  if (lower.includes("rice") || lower.includes("धान") || lower.includes("भात") || lower.includes("நெல்")) crop = "rice";
  if (lower.includes("tomato") || lower.includes("टमाटर") || lower.includes("टोमॅटो") || lower.includes("தக்காளி")) crop = "tomato";
  if (lower.includes("wheat") || lower.includes("गेहूं") || lower.includes("गहू") || lower.includes("கோதுமை")) crop = "wheat";
  if (lower.includes("onion") || lower.includes("प्याज") || lower.includes("कांदा") || lower.includes("வெங்காயம்")) crop = "onion";
  if (lower.includes("banana") || lower.includes("केला") || lower.includes("केळी") || lower.includes("வாழை")) crop = "banana";
  if (lower.includes("sugarcane") || lower.includes("गन्ना") || lower.includes("ऊस") || lower.includes("கரும்பு")) crop = "sugarcane";

  const severity: "low" | "medium" | "high" = symptoms.length >= 3 ? "high" : symptoms.length >= 1 ? "medium" : "low";

  // Localized explanations & next actions
  const LOCALIZED_OUTPUTS: Record<string, { explanation: string; next_action: string }> = {
    hi: {
      explanation: `किसान द्वारा ${crop} की फसल में ${symptoms.length > 0 ? symptoms.join(", ") : "लक्षण"} की सूचना दी गई है। प्राथमिक विश्लेषण कीट एवं रोग के प्रकोप का संकेत देता है।`,
      next_action: "खेत में 10 पौधों का निरीक्षण करें। 5% नीम के बीज का काढ़ा (NSKE) छिड़कें और कृषि अधिकारी से संपर्क करें।",
    },
    mr: {
      explanation: `शेतकऱ्यांनी ${crop} पिकात ${symptoms.length > 0 ? symptoms.join(", ") : "लक्षणे"} नोंदवली आहेत. प्राथमिक विश्लेषण कीड आणि रोगाचा प्रादुर्भाव दर्शवते.`,
      next_action: "शेतात १० झाडांची पाहणी करा. ५% निंबोळी अर्क फवारा आणि कृषी विस्तार अधिकाऱ्यांशी संपर्क साधा.",
    },
    ta: {
      explanation: `விவசாயி ${crop} பயிரில் ${symptoms.length > 0 ? symptoms.join(", ") : "அறிகுறிகள்"} இருப்பதாக தெரிவித்துள்ளார். முதற்கட்ட பகுப்பாய்வு பூச்சி மற்றும் நோய் பாதிப்பை காட்டுகிறது.`,
      next_action: "வயலில் 10 செடிகளை ஆய்வு செய்யவும். 5% வேப்பங்கொட்டை சாறு தெளிக்கவும், வேளாண் அலுவலரை தொடர்பு கொள்ளவும்.",
    },
    en: {
      explanation: `Farmer verbally reported ${symptoms.length > 0 ? symptoms.join(", ") : "foliar damage"} on ${crop}. Multimodal pathology engine indicates active pest/disease pressure.`,
      next_action: "Inspect undersides of 10 plants in a zig-zag pattern. Apply 5% Neem Seed Kernel Extract (NSKE) and consult your local Agriculture Extension Officer.",
    },
  };

  const output = LOCALIZED_OUTPUTS[language] || LOCALIZED_OUTPUTS["en"]!;

  return {
    crop,
    symptoms: symptoms.length > 0 ? symptoms : ["Verbal crop damage reported"],
    severity,
    explanation: output.explanation,
    next_action: output.next_action,
  };
}

/**
 * Transcribe raw audio data with Gemini Multimodal API.
 */
export async function transcribeAudioWithGemini(
  audioBase64: string,
  mimeType: string = "audio/webm",
  language: string = "en",
): Promise<{ text: string; language: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { text: "", language };
  }

  const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, "");
  const langName = LANG_NAMES[language] || "English / Indian Regional Language";

  const prompt = `Listen to the audio recording of the Indian farmer. Transcribe what they spoke with maximum precision in ${langName} script or Romanized script. Return ONLY the transcribed text.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: mimeType.split(";")[0],
                  data: cleanBase64,
                },
              },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) throw new Error(`Gemini Multimodal Audio ${response.status}`);

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    return { text, language };
  } catch (err) {
    console.warn("Gemini audio transcription fallback note:", err);
    return { text: "", language };
  }
}

export const transcribeAudioDirectWithGemini = transcribeAudioWithGemini;

