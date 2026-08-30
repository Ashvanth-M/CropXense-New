/**
 * CropXense Gemini API Server Functions.
 *
 * TanStack Start server functions that proxy Gemini API calls.
 * The GEMINI_API_KEY is only available server-side and NEVER sent to the browser.
 */

import { createServerFn } from "@tanstack/react-start";
import type { GeminiAnalysisResult } from "@/types";

/**
 * Server function: Analyze crop image with Gemini Vision API.
 * Called from the browser but executes on the server.
 */
export const analyzeImageWithGemini = createServerFn({ method: "POST" })
  .validator(
    (data: {
      imageBase64: string;
      mimeType: string;
      observations: {
        symptoms?: string[];
        affectedCount?: string;
        spreadSpeed?: string;
        firstNoticed?: string;
        cropStage?: string;
        notes?: string;
      };
      language: string;
      cropName?: string;
    }) => data,
  )
  .handler(async ({ data }): Promise<GeminiAnalysisResult> => {
    const { analyzeWithGemini } = await import("@/services/geminiService");
    return analyzeWithGemini(
      data.imageBase64,
      data.mimeType,
      data.observations,
      data.language,
      data.cropName,
    );
  });

/**
 * Server function: Analyze voice transcript with Gemini.
 */
export const analyzeVoiceWithGemini = createServerFn({ method: "POST" })
  .validator(
    (data: {
      transcript: string;
      language: string;
      cropName?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { analyzeVoiceTranscriptWithGemini } = await import("@/services/geminiService");
    return analyzeVoiceTranscriptWithGemini(data.transcript, data.language, data.cropName);
  });

/**
 * Server function: Transcribe raw audio with Gemini Multimodal API.
 */
export const transcribeAudioWithGeminiFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      audioBase64: string;
      mimeType?: string;
      language?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { transcribeAudioWithGemini } = await import("@/services/geminiService");
    return transcribeAudioWithGemini(data.audioBase64, data.mimeType || "audio/webm", data.language || "en");
  });

export const transcribeAudioDirectWithGeminiFn = transcribeAudioWithGeminiFn;


