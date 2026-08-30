/**
 * TanStack Start Server Function for Speechmatics Voice Transcription.
 */

import { createServerFn } from "@tanstack/react-start";
import {
  transcribeAudioWithSpeechmatics,
  type SpeechmaticsTranscriptionResult,
} from "./speechmaticsService";

export const transcribeVoiceWithSpeechmatics = createServerFn({ method: "POST" })
  .validator(
    (data: {
      audioBase64: string;
      mimeType?: string;
      languageCode?: string;
    }) => data,
  )
  .handler(async ({ data }): Promise<SpeechmaticsTranscriptionResult> => {
    return transcribeAudioWithSpeechmatics(
      data.audioBase64,
      data.mimeType || "audio/webm",
      data.languageCode,
    );
  });
