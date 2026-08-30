/**
 * CropXense Multilingual Speech Recognition & Voice Audio Core Service.
 *
 * Provides resilient, zero-latency Speech-to-Text (STT) and Text-to-Speech (TTS)
 * across Hindi (हिन्दी), Marathi (मराठी), Tamil (தமிழ்), Telugu (తెలుగు), and Indian English.
 *
 * Features:
 * 1. Web Speech API (webkitSpeechRecognition / SpeechRecognition) with auto-reconnect
 * 2. Real-time Web Audio API frequency analysis for animated waveform visualization
 * 3. MediaRecorder audio blob capture with instant playback URL generation
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

  public isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  /**
   * Start listening with real-time Speech-to-Text and Audio Recording.
   */
  public async startListening(
    langCode: SupportedSpeechLang = "en-IN",
    callbacks: SpeechRecognitionCallbacks = {},
  ): Promise<boolean> {
    if (typeof window === "undefined") return false;

    this.stopListening();
    this.accumulatedText = "";
    this.audioChunks = [];
    this.recordedBlob = null;
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = null;
    }

    // 1. Initialize Microphone Stream & Audio Visualizer
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.micStream = stream;

        // Setup MediaRecorder for audio playback
        try {
          const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : "audio/webm";
          const recorder = new MediaRecorder(stream, { mimeType });
          recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              this.audioChunks.push(event.data);
            }
          };
          recorder.start(200);
          this.mediaRecorder = recorder;
        } catch (recErr) {
          console.warn("MediaRecorder warning:", recErr);
        }

        // Setup Web Audio Analyser
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioCtx();
          this.audioContext = audioCtx;

          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          this.analyser = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
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
            callbacks.onAudioLevel?.(level);
            this.animFrameId = requestAnimationFrame(checkLevel);
          };
          checkLevel();
        } catch (audErr) {
          console.warn("AudioContext visualizer warning:", audErr);
        }
      }
    } catch (micErr: any) {
      console.warn("Microphone access notice:", micErr);
      callbacks.onError?.(micErr.name === "NotAllowedError" ? "permission_denied" : "mic_unavailable");
    }

    // 2. Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = langCode;

        recognition.onresult = (event: any) => {
          let interim = "";
          let finalTranscript = "";

          for (let i = 0; i < event.results.length; i++) {
            const r = event.results[i];
            if (r && r[0]) {
              if (r.isFinal) {
                finalTranscript += r[0].transcript + " ";
              } else {
                interim += r[0].transcript;
              }
            }
          }

          if (finalTranscript) {
            this.accumulatedText = finalTranscript;
          }

          const combined = (this.accumulatedText + interim).trim();
          callbacks.onInterim?.(combined);
          if (finalTranscript) {
            callbacks.onFinal?.(combined);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          if (event.error === "not-allowed") {
            callbacks.onError?.("permission_denied");
          }
        };

        recognition.onend = () => {
          if (this.isListening) {
            try {
              recognition.start();
            } catch {
              /* ignore auto-restart collision */
            }
          }
        };

        this.recognition = recognition;
        recognition.start();
      } catch (recInitErr) {
        console.warn("SpeechRecognition init warning:", recInitErr);
      }
    }

    this.isListening = true;
    return true;
  }

  /**
   * Stop listening and finalize audio recording with playback Blob.
   */
  public async stopListening(): Promise<{ text: string; audioBlob: Blob | null; audioUrl: string | null }> {
    this.isListening = false;

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }

    // Finalize MediaRecorder
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
      this.mediaRecorder = null;
    } else if (this.audioChunks.length > 0 && !this.recordedBlob) {
      this.recordedBlob = new Blob(this.audioChunks, { type: "audio/webm" });
      this.audioUrl = URL.createObjectURL(this.recordedBlob);
    }

    // Release microphone hardware locks
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    return {
      text: this.accumulatedText.trim(),
      audioBlob: this.recordedBlob,
      audioUrl: this.audioUrl,
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

