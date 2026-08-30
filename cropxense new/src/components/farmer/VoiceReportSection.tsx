/**
 * VoiceReportSection — "Call & Speak Your Crop Problem"
 *
 * Uses browser Web Speech API for speech-to-text.
 * Large touch-friendly controls for farmers who may not be tech-literate.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Pause, Play, Square, RotateCcw, Send, Phone, Edit3, CheckCircle2 } from "lucide-react";
import { useT } from "@/i18n";
import { useAuth } from "@/auth/AuthContext";
import { cx } from "@/lib/cx";
import type { Farm } from "@/types";
import { submitVoiceReport } from "@/services/supabaseService";
import { saveOfflineRecord, getOfflineStatus } from "@/services/offlineService";
import { useToast } from "@/components/ui/Toast";

interface Props {
  farms: Farm[];
  onCaseCreated?: (caseId: string) => void;
  compact?: boolean;
}

type RecordingState = "idle" | "recording" | "paused" | "stopped";

export function VoiceReportSection({ farms, onCaseCreated, compact = false }: Props) {
  const { t } = useT();
  const { user } = useAuth();
  const { toast } = useToast();

  const [state, setState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState(farms[0]?.id || "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const accumulatedRef = useRef("");

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
    }
  }, []);

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN"; // Support Indian English + Hindi mix

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        if (r && r[0]) {
          if (r.isFinal) {
            final += r[0].transcript + " ";
          } else {
            interim += r[0].transcript;
          }
        }
      }
      if (final) accumulatedRef.current = final;
      setTranscript((accumulatedRef.current + interim).trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.debug("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast({ title: "Microphone access denied", description: "Please allow microphone access to use voice recording.", variant: "destructive" });
      }
    };

    recognition.onend = () => {
      // If still recording (not manually stopped), restart
      if (state === "recording") {
        try { recognition.start(); } catch { /* ignore */ }
      }
    };

    recognitionRef.current = recognition;
    accumulatedRef.current = "";
    recognition.start();
    setState("recording");
  }, [state, toast]);

  const pauseRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setState("paused");
  }, []);

  const resumeRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        if (r && r[0]) {
          if (r.isFinal) {
            final += r[0].transcript + " ";
          } else {
            interim += r[0].transcript;
          }
        }
      }
      if (final) accumulatedRef.current += final;
      setTranscript((accumulatedRef.current + interim).trim());
    };

    recognitionRef.current = recognition;
    recognition.start();
    setState("recording");
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setState("stopped");
  }, []);

  const resetRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setTranscript("");
    accumulatedRef.current = "";
    setState("idle");
    setSubmitted(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!transcript.trim()) {
      toast({ title: "No voice report", description: "Please record your crop problem first.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const field = farms.find((f) => f.id === selectedFieldId);

    try {
      const offlineStatus = getOfflineStatus();
      if (offlineStatus === "offline") {
        // Save offline
        await saveOfflineRecord({
          userId: user?.id,
          recordType: "voice_report",
          payload: {
            farmerId: user?.id,
            fieldId: selectedFieldId || undefined,
            transcript: transcript.trim(),
            language: "en",
            crop: field?.cropId,
          },
        });
        toast({ title: "Saved offline", description: "Your voice report will be submitted when internet is available." });
      } else {
        const result = await submitVoiceReport({
          farmerId: user?.id,
          fieldId: selectedFieldId || undefined,
          transcript: transcript.trim(),
          language: "en",
          crop: field?.cropId,
        });
        toast({ title: "Report submitted", description: `Case ${result.caseId} created. An officer will review your report.` });
        onCaseCreated?.(result.caseId);
      }
      setSubmitted(true);
    } catch (err) {
      console.error("Voice report submission error:", err);
      toast({ title: "Error", description: "Failed to submit report. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [transcript, selectedFieldId, farms, user, toast, onCaseCreated]);

  if (submitted) {
    return (
      <section className="border border-leaf/30 bg-leaf/5 p-5 md:p-6 shadow-panel">
        <div className="flex items-center gap-3 text-leaf">
          <CheckCircle2 className="size-8" />
          <div>
            <h3 className="font-expanded text-lg font-bold text-ink">Report Submitted Successfully</h3>
            <p className="text-sm text-ink-2 mt-1">An agriculture officer will review your crop problem and contact you.</p>
          </div>
        </div>
        <button onClick={resetRecording} className="mt-4 inline-flex items-center gap-2 border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-2 transition-colors">
          <RotateCcw className="size-4" />
          Report Another Problem
        </button>
      </section>
    );
  }

  return (
    <section className="border border-line bg-surface p-5 md:p-6 shadow-panel">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex size-10 items-center justify-center bg-forest/10 shrink-0">
          <Mic className="size-5 text-forest" />
        </div>
        <div>
          <h3 className="font-expanded text-lg font-bold text-ink">Call & Speak Your Crop Problem</h3>
          <p className="text-sm text-ink-2 mt-0.5">No smartphone knowledge required. Tell us what is happening in your field.</p>
        </div>
      </div>

      {/* Field Selection */}
      {farms.length > 0 && (
        <div className="mb-4">
          <label className="text-caption block mb-1.5">Which field is affected?</label>
          <select
            value={selectedFieldId}
            onChange={(e) => setSelectedFieldId(e.target.value)}
            className="w-full border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-forest focus:outline-none"
          >
            <option value="">Select a field</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} — {f.cropId} ({f.village})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Browser Support Warning */}
      {!supported && (
        <div className="border border-amber/30 bg-amber/5 p-4 mb-4">
          <p className="text-sm text-ink font-medium">Voice recording is not supported in this browser.</p>
          <p className="text-sm text-ink-2 mt-1">Please use Chrome, Edge, or Safari, or type your problem below.</p>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Type your crop problem here..."
            className="mt-3 w-full border border-line bg-surface px-3 py-2.5 text-sm text-ink min-h-[100px] focus:border-forest focus:outline-none resize-y"
          />
        </div>
      )}

      {/* Recording Controls */}
      {supported && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {state === "idle" && (
            <button
              onClick={startRecording}
              className="inline-flex min-h-[52px] items-center gap-2.5 bg-forest px-6 text-base font-bold text-surface hover:bg-[#0e2b20] transition-colors shadow-sm"
            >
              <Mic className="size-5" />
              🎙 Speak Your Problem
            </button>
          )}

          {state === "recording" && (
            <>
              <button onClick={pauseRecording} className="inline-flex min-h-[48px] items-center gap-2 bg-amber px-4 text-sm font-semibold text-ink hover:bg-amber/80 transition-colors">
                <Pause className="size-4" /> Pause
              </button>
              <button onClick={stopRecording} className="inline-flex min-h-[48px] items-center gap-2 bg-alert px-4 text-sm font-semibold text-surface hover:bg-alert/80 transition-colors">
                <Square className="size-4" /> Stop
              </button>
              <span className="flex items-center gap-2 text-sm text-alert font-semibold animate-pulse">
                <span className="size-2.5 rounded-full bg-alert" /> Recording...
              </span>
            </>
          )}

          {state === "paused" && (
            <>
              <button onClick={resumeRecording} className="inline-flex min-h-[48px] items-center gap-2 bg-forest px-4 text-sm font-semibold text-surface hover:bg-[#0e2b20] transition-colors">
                <Play className="size-4" /> Resume
              </button>
              <button onClick={stopRecording} className="inline-flex min-h-[48px] items-center gap-2 bg-alert px-4 text-sm font-semibold text-surface hover:bg-alert/80 transition-colors">
                <Square className="size-4" /> Stop
              </button>
              <span className="text-sm text-amber font-semibold">Paused</span>
            </>
          )}

          {state === "stopped" && (
            <button onClick={resetRecording} className="inline-flex min-h-[48px] items-center gap-2 border border-line bg-surface px-4 text-sm font-semibold text-ink hover:bg-surface-2 transition-colors">
              <RotateCcw className="size-4" /> Record Again
            </button>
          )}
        </div>
      )}

      {/* Transcript Display */}
      {transcript && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-caption">Your Statement</label>
            <button onClick={() => setIsEditing(!isEditing)} className="text-xs text-forest font-semibold hover:underline flex items-center gap-1">
              <Edit3 className="size-3" /> {isEditing ? "Done" : "Edit"}
            </button>
          </div>
          {isEditing ? (
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full border border-forest/30 bg-surface px-3 py-2.5 text-sm text-ink min-h-[100px] focus:border-forest focus:outline-none resize-y"
            />
          ) : (
            <div className="border border-line bg-surface-2 px-4 py-3 text-sm text-ink leading-relaxed italic">
              "{transcript}"
            </div>
          )}
        </div>
      )}

      {/* Submit & Call Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {transcript.trim() && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={cx(
              "inline-flex min-h-[48px] items-center gap-2.5 px-6 text-base font-bold transition-colors shadow-sm",
              submitting ? "bg-forest/50 text-surface/50 cursor-not-allowed" : "bg-forest text-surface hover:bg-[#0e2b20]"
            )}
          >
            <Send className="size-4" />
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        )}

        <a
          href="tel:1800-180-1551"
          className="inline-flex min-h-[48px] items-center gap-2.5 border border-forest bg-forest/5 px-5 text-sm font-semibold text-forest hover:bg-forest/10 transition-colors"
        >
          <Phone className="size-4" />
          📞 Call Agriculture Support
        </a>
      </div>
    </section>
  );
}
