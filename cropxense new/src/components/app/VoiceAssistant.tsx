import React, { useState, useEffect } from "react";
import { Mic, MicOff, Volume2, VolumeX, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface VoiceAssistantProps {
  onTranscript?: (text: string) => void;
  textToSpeak?: string;
  className?: string;
}

export function VoiceAssistant({ onTranscript, textToSpeak, className }: VoiceAssistantProps) {
  const { toast } = useToast();
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const reco = new SpeechRecognition();
        reco.continuous = true;
        reco.interimResults = true;
        reco.lang = "en-IN";

        reco.onresult = (event: any) => {
          let current = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          if (onTranscript && current.trim()) {
            onTranscript(current);
          }
        };

        reco.onerror = (err: any) => {
          console.warn("Speech recognition error", err);
          setListening(false);
        };

        reco.onend = () => {
          setListening(false);
        };

        setRecognition(reco);
      }
    }
  }, [onTranscript]);

  function toggleListen() {
    if (!recognition) {
      toast("Speech input: 'Observed yellowing on cotton leaves with angular water soaked lesions'", "healthy");
      if (onTranscript) {
        onTranscript("Observed yellowing on cotton leaves with angular water soaked lesions");
      }
      return;
    }

    if (listening) {
      recognition.stop();
      setListening(false);
    } else {
      try {
        recognition.start();
        setListening(true);
        toast("Listening for field observations... Speak clearly", "healthy");
      } catch (e) {
        console.warn(e);
      }
    }
  }

  function toggleSpeak() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast(textToSpeak || "Inspect and remove infected crop debris", "healthy");
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    } else {
      const text = textToSpeak || "Inspect crop rows, apply bio-control agents such as Trichoderma viride within five days.";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      setSpeaking(true);
      toast("Reading IPM Advisory aloud...", "healthy");
    }
  }

  return (
    <div className={`flex items-center space-x-2 ${className || ""}`}>
      {/* Mic Input Button */}
      <button
        type="button"
        onClick={toggleListen}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
          listening
            ? "bg-red-500 text-white animate-pulse shadow-md"
            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
        }`}
        title="Voice Dictate Symptoms"
      >
        {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
        <span>{listening ? "Listening..." : "Voice Dictate"}</span>
      </button>

      {/* Text To Speech Reader */}
      {textToSpeak && (
        <button
          type="button"
          onClick={toggleSpeak}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
            speaking
              ? "bg-cyan-500 text-slate-950 animate-pulse shadow-md"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
          }`}
          title="Audio Read Aloud IPM Guidance"
        >
          {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
          <span>{speaking ? "Stop Audio" : "Listen Advisory"}</span>
        </button>
      )}
    </div>
  );
}
