/**
 * CropXense AssemblyAI Audio-to-Text Transcription Service.
 *
 * Provides high-accuracy speech recognition for rural Indian farmers across
 * Hindi, Marathi, Tamil, and Indian English using AssemblyAI's Universal models.
 */

const ASSEMBLYAI_API_KEY =
  (typeof process !== "undefined" && process.env && process.env["ASSEMBLYAI_API_KEY"]) ||
  "c2a27b47564247428935d00e29f78f08";

export interface AssemblyAiTranscriptionResult {
  text: string;
  confidence: number;
  languageCode?: string;
  durationSeconds?: number;
}

/**
 * Transcribe raw audio data (Base64) with AssemblyAI.
 */
export async function transcribeAudioWithAssemblyAI(
  audioBase64: string,
  mimeType: string = "audio/webm",
  languageCode?: string,
): Promise<AssemblyAiTranscriptionResult> {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error("AssemblyAI API key is missing.");
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

  if (audioBuffer.length < 100) {
    throw new Error("Audio buffer is too short to transcribe.");
  }

  // 2. Upload audio payload to AssemblyAI
  const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: "application/octet-stream" });
  const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
    method: "POST",
    headers: {
      Authorization: ASSEMBLYAI_API_KEY,
      "Content-Type": "application/octet-stream",
    },
    body: audioBlob,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`AssemblyAI upload error (${uploadRes.status}): ${errText}`);
  }

  const uploadJson = await uploadRes.json();
  const audioUrl = uploadJson.upload_url;
  if (!audioUrl) {
    throw new Error("AssemblyAI upload failed: No upload_url returned.");
  }

  // 3. Configure Multilingual Universal Models
  let targetLangCode: string | undefined = undefined;
  if (languageCode === "hi" || languageCode === "hi-IN") targetLangCode = "hi";
  else if (languageCode === "mr" || languageCode === "mr-IN") targetLangCode = "mr";
  else if (languageCode === "ta" || languageCode === "ta-IN") targetLangCode = "ta";
  else if (languageCode === "en" || languageCode === "en-IN") targetLangCode = "en";

  const transcriptPayload: Record<string, unknown> = {
    audio_url: audioUrl,
    speech_models: ["universal-3-5-pro", "universal-2"],
  };

  if (targetLangCode) {
    transcriptPayload["language_code"] = targetLangCode;
  } else {
    transcriptPayload["language_detection"] = true;
  }

  const startRes = await fetch("https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    headers: {
      Authorization: ASSEMBLYAI_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(transcriptPayload),
  });

  if (!startRes.ok) {
    const errText = await startRes.text();
    throw new Error(`AssemblyAI transcribe request error (${startRes.status}): ${errText}`);
  }

  const startJson = await startRes.json();
  const transcriptId = startJson.id;
  if (!transcriptId) {
    throw new Error("AssemblyAI did not return a transcript ID.");
  }

  // 4. Poll for transcription completion
  const pollUrl = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;
  const maxAttempts = 30; // 30 seconds max timeout
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise((r) => setTimeout(r, 1000));
    attempts++;

    const pollRes = await fetch(pollUrl, {
      method: "GET",
      headers: {
        Authorization: ASSEMBLYAI_API_KEY,
      },
    });

    if (!pollRes.ok) {
      continue;
    }

    const pollJson = await pollRes.json();
    if (pollJson.status === "completed") {
      return {
        text: pollJson.text || "",
        confidence: pollJson.confidence || 0.95,
        languageCode: pollJson.language_code || targetLangCode,
        durationSeconds: pollJson.audio_duration,
      };
    } else if (pollJson.status === "error") {
      throw new Error(`AssemblyAI transcription error: ${pollJson.error || "Unknown error"}`);
    }
  }

  throw new Error("AssemblyAI transcription timed out after 30 seconds.");
}
