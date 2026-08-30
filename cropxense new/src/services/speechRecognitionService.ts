/**
 * CropXense Multilingual Speech Recognition & Voice Audio Core Service.
 *
 * Provides resilient, zero-latency Speech-to-Text (STT) and Text-to-Speech (TTS)
 * across Hindi (हिन्दी), Marathi (मराठी), Tamil (தமிழ்), Telugu (తెలుగు), and Indian English.
 *
 * Features:
 * 1. Web Speech API (webkitSpeechRecognition / SpeechRecognition) with auto-reconnect
 * 2. Real-time Web Audio API frequency analysis for animated waveform visualization
 * 3. MediaRecorder audio blob capture for Gemini server-side fallback transcription
 * 4. Text-to-Speech (TTS) speech synthesis for reading advisories aloud in the farmer's native tongue
 */

export type SupportedSpeechLang = "hi-IN" | "mr-IN" | "ta-IN" | "te-IN" | "en-IN";

export interface SpeechLangConfig {
  code: SupportedSpeechLang;
  langKey: "hi" | "mr" | "ta" | "te" | "en";
  name: string;
  nativeName: string;
  flag: string;
  ttsVoiceLang: string;
}

export const SUPPORTED_SPEECH_LANGUAGES: SpeechLangConfig[] = [
  {
    code: "hi-IN",
    langKey: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    ttsVoiceLang: "hi-IN",
  },
  {
    code: "mr-IN",
    langKey: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    flag: "🇮🇳",
    ttsVoiceLang: "mr-IN",
  },
  {
    code: "ta-IN",
    langKey: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    flag: "🇮🇳",
    ttsVoiceLang: "ta-IN",
  },
  {
    code: "te-IN",
    langKey: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    flag: "🇮🇳",
    ttsVoiceLang: "te-IN",
  },
  {
    code: "en-IN",
    langKey: "en",
    name: "English (India)",
    nativeName: "English",
    flag: "🇮🇳",
    ttsVoiceLang: "en-IN",
  },
];

export interface SpeechRecognitionCallbacks {
  onInterim?: (interimText: string) => void;
  onFinal?: (finalText: string) => void;
  onError?: (error: string) => void;
  onAudioLevel?: (level: number) => void;
  onEnd?: () => void;
}

export class MultilingualVoiceManager {
  private recognition: any | null = null;
  private isListening: boolean = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private recordedBlob: Blob | null = null;
  private audioUrl: string | null = null;
  private accumulatedText: string = "";
  private currentCallbacks: SpeechRecognitionCallbacks = {};
  private webSpeechSupported: boolean | null = null;

  public isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  /**
   * Fully release all hardware resources (mic, audio context, recognition engine).
   * Must be awaited before starting a new session.
   */
  private async releaseResources(): Promise<void> {
    this.isListening = false;

    // Cancel animation frame
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    // Stop Web Speech recognition
    if (this.recognition) {
      try {
        this.recognition.onend = null; // Prevent auto-restart during teardown
        this.recognition.onerror = null;
        this.recognition.onresult = null;
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }

    // Stop MediaRecorder
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        if (!this.mediaRecorder) return resolve();
        this.mediaRecorder.onstop = () => {
          if (this.audioChunks.length > 0) {
            this.recordedBlob = new Blob(this.audioChunks, { type: "audio/webm" });
            this.audioUrl = URL.createObjectURL(this.recordedBlob);
          }
          resolve();
        };
        try {
          this.mediaRecorder.stop();
        } catch {
          resolve();
        }
      });
    } else if (this.audioChunks.length > 0 && !this.recordedBlob) {
      this.recordedBlob = new Blob(this.audioChunks, { type: "audio/webm" });
      this.audioUrl = URL.createObjectURL(this.recordedBlob);
    }
    this.mediaRecorder = null;

    // Release microphone hardware
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }

    // Close audio context
    if (this.audioContext) {
      try {
        await this.audioContext.close();
      } catch {}
      this.audioContext = null;
      this.analyser = null;
    }
  }

  /**
   * Start listening with real-time Speech-to-Text and Audio Recording.
   * Requests microphone permission, starts Web Speech API for live transcription,
   * and records audio via MediaRecorder for Gemini fallback.
   */
  public async startListening(
    langCode: SupportedSpeechLang = "en-IN",
    callbacks: SpeechRecognitionCallbacks = {},
  ): Promise<boolean> {
    if (typeof window === "undefined") return false;

    // 0. Clean up any previous session FULLY before starting new one
    await this.releaseResources();

    this.accumulatedText = "";
    this.audioChunks = [];
    this.recordedBlob = null;
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = null;
    }
    this.currentCallbacks = callbacks;

    // 1. Request Microphone Permission & Initialize Audio Pipeline
    let micStream: MediaStream | null = null;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        callbacks.onError?.("mic_unavailable");
        return false;
      }
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.micStream = micStream;
    } catch (micErr: any) {
      console.warn("Microphone access denied or unavailable:", micErr);
      const errorType = micErr.name === "NotAllowedError" ? "permission_denied" : "mic_unavailable";
      callbacks.onError?.(errorType);
      return false;
    }

    // Mark as listening BEFORE starting engines so callbacks work
    this.isListening = true;

    // 2. Setup MediaRecorder for audio blob capture (Gemini fallback)
    try {
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";
      if (mimeType) {
        const recorder = new MediaRecorder(micStream, { mimeType });
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };
        recorder.start(250);
        this.mediaRecorder = recorder;
      }
    } catch (recErr) {
      console.warn("MediaRecorder init notice:", recErr);
    }

    // 3. Setup Web Audio Analyser for live waveform visualization
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        this.audioContext = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.6;
        this.analyser = analyser;

        const source = audioCtx.createMediaStreamSource(micStream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkLevel = () => {
          if (!this.isListening) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i]!;
          }
          const avg = sum / dataArray.length;
          const level = Math.min(100, Math.round((avg / 128) * 100));
          this.currentCallbacks.onAudioLevel?.(level);
          this.animFrameId = requestAnimationFrame(checkLevel);
        };
        checkLevel();
      }
    } catch (audErr) {
      console.warn("AudioContext visualizer notice:", audErr);
    }

    // 4. Initialize Web Speech API for live streaming transcription
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionCtor) {
      this.webSpeechSupported = true;
      try {
        const recognition = new SpeechRecognitionCtor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.lang = langCode;

        recognition.onresult = (event: any) => {
          let interim = "";
          let finalPart = "";

          for (let i = 0; i < event.results.length; i++) {
            const r = event.results[i];
            if (r && r[0]) {
              if (r.isFinal) {
                finalPart += r[0].transcript + " ";
              } else {
                interim += r[0].transcript;
              }
            }
          }

          if (finalPart) {
            this.accumulatedText = finalPart;
          }

          const combined = (this.accumulatedText + interim).trim();
          if (combined) {
            this.currentCallbacks.onInterim?.(combined);
          }
          if (finalPart) {
            this.currentCallbacks.onFinal?.((this.accumulatedText + interim).trim());
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          // 'no-speech' is not fatal — just means silence, keep listening
          if (event.error === "no-speech" || event.error === "aborted") {
            return;
          }
          if (event.error === "not-allowed") {
            this.currentCallbacks.onError?.("permission_denied");
          } else if (event.error === "network") {
            this.currentCallbacks.onError?.("network_error");
          }
        };

        recognition.onend = () => {
          // Auto-restart if still actively listening (handles browser timeouts)
          if (this.isListening) {
            try {
              recognition.start();
            } catch {
              /* ignore collision if start() is called while already running */
            }
          } else {
            this.currentCallbacks.onEnd?.();
          }
        };

        this.recognition = recognition;
        recognition.start();
      } catch (recInitErr) {
        console.warn("SpeechRecognition init error:", recInitErr);
        this.webSpeechSupported = false;
      }
    } else {
      this.webSpeechSupported = false;
      console.warn("Web Speech API not supported in this browser. Audio will be sent to Gemini for transcription.");
    }

    return true;
  }

  /**
   * Stop listening and finalize audio recording.
   * Returns the accumulated transcript text and audio blob for Gemini fallback.
   */
  public async stopListening(): Promise<{
    text: string;
    audioBlob: Blob | null;
    audioUrl: string | null;
    webSpeechWorked: boolean;
  }> {
    const hadWebSpeech = this.webSpeechSupported === true;
    const hadText = !!this.accumulatedText.trim();

    await this.releaseResources();

    return {
      text: this.accumulatedText.trim(),
      audioBlob: this.recordedBlob,
      audioUrl: this.audioUrl,
      webSpeechWorked: hadWebSpeech && hadText,
    };
  }

  public getRecordedAudioUrl(): string | null {
    return this.audioUrl;
  }
}

export const voiceManager = new MultilingualVoiceManager();

/**
 * Multilingual Text-to-Speech (TTS) Reader for agricultural advisories.
 */
export function speakAdvisoryAloud(
  text: string,
  languageCode: "hi" | "mr" | "ta" | "te" | "en" = "en",
  onEnd?: () => void,
): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  window.speechSynthesis.cancel(); // Stop any active speech

  if (!text || !text.trim()) return false;

  const utterance = new SpeechSynthesisUtterance(text);
  const targetVoiceLang =
    languageCode === "hi"
      ? "hi-IN"
      : languageCode === "mr"
        ? "mr-IN"
        : languageCode === "ta"
          ? "ta-IN"
          : languageCode === "te"
            ? "te-IN"
            : "en-IN";

  utterance.lang = targetVoiceLang;
  utterance.rate = 0.95; // Slightly slower pace for optimal rural comprehension
  utterance.pitch = 1.0;

  // Pick suitable voice if available
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice =
    voices.find((v) => v.lang === targetVoiceLang) ||
    voices.find((v) => v.lang.startsWith(languageCode)) ||
    null;

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
  return true;
}

/**
 * Stop any currently playing TTS speech.
 */
export function stopSpeakingAdvisory(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export const speakTextAloud = speakAdvisoryAloud;
export const stopSpeaking = stopSpeakingAdvisory;
