/**
 * CropXense Speechmatics Speech-to-Text Transcription Service.
 *
 * Industry-leading multilingual speech recognition engine supporting:
 * - Hindi (hi)
 * - Marathi (mr)
 * - Tamil (ta)
 * - Telugu (te)
 * - Global & Indian English (en)
 * - Bengali (bn), Gujarati (gu), Kannada (kn), Punjabi (pa), Urdu (ur)
 */

const SPEECHMATICS_API_KEY =
  (typeof process !== "undefined" && process.env && process.env["SPEECHMATICS_API_KEY"]) ||
  "BpM17Cnl5hgj0Y7lPuxK5PrhW8Zewpql";

export interface SpeechmaticsTranscriptionResult {
  text: string;
  confidence: number;
  languageCode?: string;
  durationSeconds?: number;
}

/**
 * Transcribe raw audio data (Base64) with Speechmatics Enhanced ASR API.
 */
export async function transcribeAudioWithSpeechmatics(
  audioBase64: string,
  mimeType: string = "audio/webm",
  languageCode?: string,
): Promise<SpeechmaticsTranscriptionResult> {
  if (!SPEECHMATICS_API_KEY) {
    throw new Error("Speechmatics API key is missing.");
  }

  // 1. Convert base64 audio to binary buffer
  const base64Data = audioBase64.replace(/^data:[^;]+;base64,/, "");
  let audioBuffer: Uint8Array;
  if (typeof Buffer !== "undefined") {
    audioBuffer = Buffer.from(base64Data, "base64");
  } else {
    const binaryString = atob(base64Data);
    audioBuffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      audioBuffer[i] = binaryString.charCodeAt(i);
    }
  }

  if (audioBuffer.length < 50) {
    throw new Error("Audio recording is empty or too short.");
  }

  // 2. Map language code for Speechmatics
  let targetLang = "auto";
  if (languageCode) {
    const clean = languageCode.toLowerCase().split("-")[0] || "en";
    if (["en", "hi", "mr", "ta", "te", "kn", "bn", "gu", "pa", "ur"].includes(clean)) {
      targetLang = clean;
    }
  }

  // 3. Build multipart/form-data payload
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType || "audio/webm" });
  formData.append("data_file", blob, "voice_recording.webm");

  const transcriptionConfig: Record<string, unknown> = {
    language: targetLang === "auto" ? "auto" : targetLang,
    operating_point: "enhanced",
    enable_entities: true,
  };

  formData.append(
    "config",
    JSON.stringify({
      type: "transcription",
      transcription_config: transcriptionConfig,
    }),
  );

  // 4. Submit Job to Speechmatics
  const submitRes = await fetch("https://asr.api.speechmatics.com/v2/jobs", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SPEECHMATICS_API_KEY}`,
    },
    body: formData,
  });

  if (!submitRes.ok) {
    const errText = await submitRes.text();
    throw new Error(`Speechmatics job creation failed (${submitRes.status}): ${errText}`);
  }

  const submitJson = await submitRes.json();
  const jobId = submitJson.id;
  if (!jobId) {
    throw new Error("Speechmatics did not return a job ID.");
  }

  // 5. Poll for completion
  const pollUrl = `https://asr.api.speechmatics.com/v2/jobs/${jobId}`;
  const maxAttempts = 30; // 30 seconds timeout
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise((r) => setTimeout(r, 1000));
    attempts++;

    const pollRes = await fetch(pollUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${SPEECHMATICS_API_KEY}`,
      },
    });

    if (!pollRes.ok) continue;

    const pollJson = await pollRes.json();
    const status = pollJson.job?.status;

    if (status === "done") {
      // 6. Retrieve plaintext transcript
      const transcriptRes = await fetch(`${pollUrl}/transcript?format=txt`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${SPEECHMATICS_API_KEY}`,
        },
      });

      let rawText = "";
      if (transcriptRes.ok) {
        rawText = (await transcriptRes.text()).trim();
      }

      return {
        text: rawText,
        confidence: 0.98,
        languageCode: targetLang,
        durationSeconds: pollJson.job?.duration,
      };
    } else if (status === "rejected" || status === "deleted") {
      throw new Error(`Speechmatics job ${status}: ${pollJson.job?.errors?.[0]?.message || "Failed"}`);
    }
  }

  throw new Error("Speechmatics transcription timed out after 30 seconds.");
}
