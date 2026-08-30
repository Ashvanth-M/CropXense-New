/**
 * CropAbnormalitySection — "Is Something Unusual in My Crop?"
 *
 * Simple farmer-friendly questionnaire that converts answers into
 * a structured observation with severity: NORMAL / WATCH / ABNORMAL / URGENT.
 */

import { useState, useCallback } from "react";
import { AlertTriangle, CheckCircle2, Eye, AlertCircle, ShieldAlert } from "lucide-react";
import { cx } from "@/lib/cx";
import { useToast } from "@/components/ui/Toast";
import type { AbnormalityLevel, CropAbnormalityAssessment, Farm } from "@/types";

interface Props {
  farms: Farm[];
  onAssessment?: (assessment: CropAbnormalityAssessment) => void;
}

const AFFECTED_OPTIONS = [
  { value: "few", label: "Few plants", score: 1 },
  { value: "some", label: "Some plants", score: 2 },
  { value: "many", label: "Many plants", score: 3 },
  { value: "almost_entire", label: "Almost entire field", score: 4 },
] as const;

const SPREAD_OPTIONS = [
  { value: "not_spreading", label: "Not spreading", score: 0 },
  { value: "slowly", label: "Slowly", score: 1 },
  { value: "quickly", label: "Quickly", score: 3 },
  { value: "very_quickly", label: "Very quickly", score: 4 },
] as const;

const NOTICED_OPTIONS = [
  { value: "today", label: "Today", score: 1 },
  { value: "2_3_days", label: "2–3 days ago", score: 2 },
  { value: "about_week", label: "About a week ago", score: 3 },
  { value: "more_than_week", label: "More than a week ago", score: 4 },
] as const;

const SYMPTOM_OPTIONS = [
  { value: "yellow_leaves", label: "🍂 Yellow leaves" },
  { value: "spots", label: "🔵 Spots" },
  { value: "wilting", label: "🥀 Wilting" },
  { value: "holes", label: "🕳️ Holes" },
  { value: "insects", label: "🐛 Insects" },
  { value: "sticky_leaves", label: "💧 Sticky leaves" },
  { value: "stunted_growth", label: "📏 Stunted growth" },
  { value: "other", label: "❓ Other" },
] as const;

const LEVEL_CONFIG: Record<AbnormalityLevel, { label: string; color: string; bgColor: string; icon: typeof CheckCircle2; description: string }> = {
  normal: { label: "NORMAL", color: "text-leaf", bgColor: "bg-leaf/10 border-leaf/30", icon: CheckCircle2, description: "Your crop appears to be within normal range. Continue regular monitoring." },
  watch: { label: "WATCH", color: "text-amber", bgColor: "bg-amber/10 border-amber/30", icon: Eye, description: "Some signs need attention. Monitor closely over the next few days." },
  abnormal: { label: "ABNORMAL", color: "text-orange-600", bgColor: "bg-orange-50 border-orange-300", icon: AlertCircle, description: "Based on your reported symptoms and field conditions, this observation requires attention. Consider scanning your crop or contacting an officer." },
  urgent: { label: "URGENT", color: "text-alert", bgColor: "bg-alert/10 border-alert/30", icon: ShieldAlert, description: "Multiple serious symptoms detected. Immediate attention recommended. Contact your agriculture officer or use the voice report feature." },
};

function calculateAbnormality(
  affected: string,
  spread: string,
  noticed: string,
  symptoms: string[],
): CropAbnormalityAssessment {
  const affectedScore = AFFECTED_OPTIONS.find((o) => o.value === affected)?.score ?? 0;
  const spreadScore = SPREAD_OPTIONS.find((o) => o.value === spread)?.score ?? 0;
  const noticedScore = NOTICED_OPTIONS.find((o) => o.value === noticed)?.score ?? 0;
  const symptomScore = Math.min(symptoms.length * 1.5, 6);

  const totalScore = affectedScore + spreadScore + noticedScore + symptomScore;

  let result: AbnormalityLevel;
  let explanation: string;

  if (totalScore <= 3) {
    result = "normal";
    explanation = "Few symptoms reported with limited spread. Your crop appears healthy.";
  } else if (totalScore <= 7) {
    result = "watch";
    explanation = "Some symptoms observed. Keep monitoring your field for changes.";
  } else if (totalScore <= 12) {
    result = "abnormal";
    explanation = "Multiple symptoms with notable spread. Consider getting your crop checked by an officer.";
  } else {
    result = "urgent";
    explanation = "Significant damage reported with rapid spread. Immediate professional attention recommended.";
  }

  return {
    affectedCount: affected as CropAbnormalityAssessment["affectedCount"],
    spreadSpeed: spread as CropAbnormalityAssessment["spreadSpeed"],
    firstNoticed: noticed as CropAbnormalityAssessment["firstNoticed"],
    visibleSigns: symptoms,
    result,
    score: Math.round(totalScore),
    explanation,
  };
}

export function CropAbnormalitySection({ farms, onAssessment }: Props) {
  const { toast } = useToast();
  const [affected, setAffected] = useState("");
  const [spread, setSpread] = useState("");
  const [noticed, setNoticed] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [assessment, setAssessment] = useState<CropAbnormalityAssessment | null>(null);

  const toggleSymptom = useCallback((value: string) => {
    setSymptoms((prev) => prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]);
  }, []);

  const handleAssess = useCallback(() => {
    if (!affected || !spread || !noticed) {
      toast({ title: "Incomplete", description: "Please answer all questions before checking.", variant: "destructive" });
      return;
    }

    const result = calculateAbnormality(affected, spread, noticed, symptoms);
    setAssessment(result);
    onAssessment?.(result);
  }, [affected, spread, noticed, symptoms, toast, onAssessment]);

  const handleReset = useCallback(() => {
    setAffected("");
    setSpread("");
    setNoticed("");
    setSymptoms([]);
    setAssessment(null);
  }, []);

  return (
    <section className="border border-line bg-surface p-5 md:p-6 shadow-panel">
      <div className="flex items-start gap-3 mb-5">
        <div className="flex size-10 items-center justify-center bg-amber/10 shrink-0">
          <Eye className="size-5 text-amber" />
        </div>
        <div>
          <h3 className="font-expanded text-lg font-bold text-ink">Is Something Unusual in My Crop?</h3>
          <p className="text-sm text-ink-2 mt-0.5">Answer simple questions to check if your crop needs attention.</p>
        </div>
      </div>

      {!assessment ? (
        <div className="space-y-5">
          {/* Q1: Affected Count */}
          <div>
            <p className="text-sm font-semibold text-ink mb-2">How many plants are affected?</p>
            <div className="grid grid-cols-2 gap-2">
              {AFFECTED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAffected(opt.value)}
                  className={cx(
                    "border px-3 py-3 text-sm font-medium transition-colors text-left",
                    affected === opt.value
                      ? "border-forest bg-forest/10 text-forest"
                      : "border-line bg-surface text-ink hover:bg-surface-2"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q2: Spread Speed */}
          <div>
            <p className="text-sm font-semibold text-ink mb-2">How quickly is it spreading?</p>
            <div className="grid grid-cols-2 gap-2">
              {SPREAD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSpread(opt.value)}
                  className={cx(
                    "border px-3 py-3 text-sm font-medium transition-colors text-left",
                    spread === opt.value
                      ? "border-forest bg-forest/10 text-forest"
                      : "border-line bg-surface text-ink hover:bg-surface-2"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q3: First Noticed */}
          <div>
            <p className="text-sm font-semibold text-ink mb-2">When did you first notice it?</p>
            <div className="grid grid-cols-2 gap-2">
              {NOTICED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setNoticed(opt.value)}
                  className={cx(
                    "border px-3 py-3 text-sm font-medium transition-colors text-left",
                    noticed === opt.value
                      ? "border-forest bg-forest/10 text-forest"
                      : "border-line bg-surface text-ink hover:bg-surface-2"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q4: Visible Signs */}
          <div>
            <p className="text-sm font-semibold text-ink mb-2">What do you see? (Select all that apply)</p>
            <div className="grid grid-cols-2 gap-2">
              {SYMPTOM_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleSymptom(opt.value)}
                  className={cx(
                    "border px-3 py-3 text-sm font-medium transition-colors text-left",
                    symptoms.includes(opt.value)
                      ? "border-forest bg-forest/10 text-forest"
                      : "border-line bg-surface text-ink hover:bg-surface-2"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleAssess}
            className="inline-flex min-h-[48px] items-center gap-2.5 bg-forest px-6 text-base font-bold text-surface hover:bg-[#0e2b20] transition-colors shadow-sm w-full justify-center"
          >
            <AlertTriangle className="size-5" />
            Check My Crop
          </button>
        </div>
      ) : (
        <div>
          {/* Result Card */}
          <div className={cx("border p-5", LEVEL_CONFIG[assessment.result].bgColor)}>
            <div className="flex items-center gap-3 mb-3">
              {(() => { const Icon = LEVEL_CONFIG[assessment.result].icon; return <Icon className={cx("size-8", LEVEL_CONFIG[assessment.result].color)} />; })()}
              <div>
                <span className={cx("font-expanded text-2xl font-bold uppercase", LEVEL_CONFIG[assessment.result].color)}>
                  {LEVEL_CONFIG[assessment.result].label}
                </span>
              </div>
            </div>
            <p className="text-sm text-ink leading-relaxed">{assessment.explanation}</p>
            <p className="text-xs text-ink-2 mt-3 italic">
              ⚠️ This is not a scientific diagnosis. Based on your reported symptoms and field conditions, this observation assessment helps prioritize attention.
            </p>
          </div>

          {/* Summary */}
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="border border-line bg-surface-2 px-3 py-2">
              <span className="text-caption">Plants Affected</span>
              <p className="font-semibold text-ink capitalize">{assessment.affectedCount.replace("_", " ")}</p>
            </div>
            <div className="border border-line bg-surface-2 px-3 py-2">
              <span className="text-caption">Spread Speed</span>
              <p className="font-semibold text-ink capitalize">{assessment.spreadSpeed.replace("_", " ")}</p>
            </div>
            <div className="border border-line bg-surface-2 px-3 py-2">
              <span className="text-caption">First Noticed</span>
              <p className="font-semibold text-ink capitalize">{assessment.firstNoticed.replace(/_/g, " ")}</p>
            </div>
            <div className="border border-line bg-surface-2 px-3 py-2">
              <span className="text-caption">Symptoms</span>
              <p className="font-semibold text-ink">{assessment.visibleSigns.length} reported</p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="mt-4 inline-flex items-center gap-2 border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-2 transition-colors"
          >
            Check Again
          </button>
        </div>
      )}
    </section>
  );
}
