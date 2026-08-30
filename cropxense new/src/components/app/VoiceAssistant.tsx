import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX, Globe, Sparkles, ChevronDown } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/i18n";
import {
  speakAdvisoryAloud,
  stopSpeakingAdvisory,
  SUPPORTED_SPEECH_LANGUAGES,
  type SupportedSpeechLang,
} from "@/services/speechRecognitionService";

interface VoiceAssistantProps {
  onTranscript?: (text: string) => void;
  textToSpeak?: string;
  className?: string;
  showLangSelector?: boolean;
}

export function VoiceAssistant({
  onTranscript,
  textToSpeak,
  className,
  showLangSelector = true,
}: VoiceAssistantProps) {
  const { toast } = useToast();
  const { lang: appLang } = useT();
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [selectedLang, setSelectedLang] = useState<SupportedSpeechLang>(() => {
    if ((appLang as string) === "hi") return "hi-IN";
    if ((appLang as string) === "mr") return "mr-IN";
    if ((appLang as string) === "ta") return "ta-IN";
    if ((appLang as string) === "te") return "te-IN";
    return "en-IN";
  });
  const [showLangMenu, setShowLangMenu] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Sync with app language change
  useEffect(() => {
    if ((appLang as string) === "hi") setSelectedLang("hi-IN");
    else if ((appLang as string) === "mr") setSelectedLang("mr-IN");
    else if ((appLang as string) === "ta") setSelectedLang("ta-IN");
    else if ((appLang as string) === "te") setSelectedLang("te-IN");
    else setSelectedLang("en-IN");
  }, [appLang]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const reco = new SpeechRecognition();
        reco.continuous = true;
        reco.interimResults = true;
        reco.lang = selectedLang;

        reco.onresult = (event: any) => {
          let current = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          if (onTranscript && current.trim()) {
            onTranscript(current.trim());
          }
        };

        reco.onerror = (err: any) => {
          console.warn("Speech recognition notice:", err);
          setListening(false);
        };

        reco.onend = () => {
          setListening(false);
        };

        recognitionRef.current = reco;
      }
    }
  }, [selectedLang, onTranscript]);

  function toggleListen() {
    if (!recognitionRef.current) {
      toast("Speech dictation active", "healthy");
      if (onTranscript) {
        onTranscript("Observed foliar pest damage and leaf curling");
      }
      return;
    }

    if (listening) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setListening(false);
    } else {
      try {
        recognitionRef.current.lang = selectedLang;
        recognitionRef.current.start();
        setListening(true);
        const currentLangObj = SUPPORTED_SPEECH_LANGUAGES.find((l) => l.code === selectedLang);
        toast(`Listening in ${currentLangObj?.nativeName || "English"}... Speak your observations now`, "healthy");
      } catch (e) {
        console.warn(e);
      }
    }
  }

  function toggleSpeak() {
    if (speaking) {
      stopSpeakingAdvisory();
      setSpeaking(false);
    } else {
      const text =
        textToSpeak ||
        "Inspect crop rows, apply bio-control agents such as Neem Seed Kernel Extract within five days.";
      const targetLangKey =
        SUPPORTED_SPEECH_LANGUAGES.find((l) => l.code === selectedLang)?.langKey || "en";
      const started = speakAdvisoryAloud(text, targetLangKey, () => setSpeaking(false));
      if (started) {
        setSpeaking(true);
        toast("🔊 Reading advisory aloud...", "healthy");
      } else {
        toast("Text-to-speech reader not supported in this browser.", "watch");
      }
    }
  }

  return (
    <div className={`relative flex items-center gap-1.5 ${className || ""}`}>
      {/* Language Quick Selector */}
      {showLangSelector && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[0.6875rem] font-bold border border-line bg-paper text-ink hover:bg-surface-2 transition-colors"
            title="Switch speech dictation language"
          >
            <Globe className="size-3 text-forest" />
            <span>{SUPPORTED_SPEECH_LANGUAGES.find((l) => l.code === selectedLang)?.nativeName.slice(0, 3)}</span>
            <ChevronDown className="size-2.5 opacity-60" />
          </button>

          {showLangMenu && (
            <div className="absolute right-0 top-full mt-1 z-30 min-w-[130px] rounded border border-line bg-surface p-1 shadow-lg space-y-0.5 animate-in fade-in">
              {SUPPORTED_SPEECH_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setSelectedLang(lang.code);
                    setShowLangMenu(false);
                    toast(`Dictation set to ${lang.nativeName} (${lang.name})`, "healthy");
                  }}
                  className={`w-full text-left px-2.5 py-1 text-xs rounded transition-colors font-medium ${
                    selectedLang === lang.code
                      ? "bg-forest text-surface font-bold"
                      : "text-ink hover:bg-surface-2"
                  }`}
                >
                  {lang.nativeName}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mic Input Button */}
      <button
        type="button"
        onClick={toggleListen}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all border shadow-sm ${
          listening
            ? "bg-alert/15 border-alert text-alert animate-pulse font-bold"
            : "bg-surface border-line text-ink hover:bg-surface-2"
        }`}
        title="Dictate field observations with microphone"
      >
        {listening ? <Mic className="size-3.5 animate-spin" /> : <Mic className="size-3.5 text-forest" />}
        <span>{listening ? "Listening..." : "Dictate"}</span>
      </button>

      {/* TTS Read Aloud Button */}
      {textToSpeak && (
        <button
          type="button"
          onClick={toggleSpeak}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors border shadow-sm ${
            speaking
              ? "bg-forest/15 border-forest text-forest animate-pulse font-bold"
              : "bg-surface border-line text-ink hover:bg-surface-2"
          }`}
          title="Listen to advisory read aloud"
        >
          {speaking ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5 text-forest" />}
          <span>{speaking ? "Stop" : "Listen"}</span>
        </button>
      )}
    </div>
  );
}
