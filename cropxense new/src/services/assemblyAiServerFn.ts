/**
 * TanStack Start Server Function for AssemblyAI Voice Transcription.
 */

import { createServerFn } from "@tanstack/react-start";
import {
  transcribeAudioWithAssemblyAI,
  type AssemblyAiTranscriptionResult,
} from "./assemblyAiService";

export const transcribeVoiceWithAssemblyAI = createServerFn({ method: "POST" })
  .validator(
    (data: {
      audioBase64: string;
      mimeType?: string;
      languageCode?: string;
    }) => data,
  )
  .handler(async ({ data }): Promise<AssemblyAiTranscriptionResult> => {
    return transcribeAudioWithAssemblyAI(
      data.audioBase64,
      data.mimeType || "audio/webm",
      data.languageCode,
    );
  });
