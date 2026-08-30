/**
 * AssistedReportForm — Officer enters a report on behalf of a farmer.
 *
 * For farmers who have no smartphone, no internet, or no digital literacy.
 */

import { useState, useCallback } from "react";
import { UserPlus, Send, CheckCircle2 } from "lucide-react";
import { submitAssistedReport, CROPS } from "@/services/supabaseService";
import { useAuth } from "@/auth/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { cx } from "@/lib/cx";

const SYMPTOM_OPTIONS = [
  "Yellow leaves", "Spots/lesions", "Wilting", "Insect holes",
  "White insects", "Sticky leaves", "Leaf curling", "Stunted growth",
  "Rotting", "Brown patches", "Stem damage", "Other",
];

const AREA_OPTIONS = [
  "Few plants", "Small patch (< 10%)", "Medium area (10-30%)",
  "Large area (30-60%)", "Most of the field (> 60%)",
];

interface Props {
  onReportCreated?: (caseId: string) => void;
}

export function AssistedReportForm({ onReportCreated }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [farmerName, setFarmerName] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [crop, setCrop] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [area, setArea] = useState("");
  const [notes, setNotes] = useState("");
  const [observation, setObservation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdCaseId, setCreatedCaseId] = useState("");

  const toggleSymptom = useCallback((s: string) => {
    setSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!farmerName.trim() && !village.trim()) {
      toast("Please provide at least the farmer's name or village.", "critical");
      return;
    }
    if (symptoms.length === 0 && !notes.trim()) {
      toast("Please select symptoms or add notes about the crop problem.", "critical");
      return;
    }

    setSubmitting(true);
    try {
      const p = phone.trim();
      const c = crop.trim();
      const n = notes.trim();
      const obs = observation.trim();
      const a = area.trim();

      const result = await submitAssistedReport({
        officerId: user?.id || "demo-officer-priya",
        farmerName: farmerName.trim(),
        village: village.trim(),
        symptoms,
        ...(p ? { phone: p } : {}),
        ...(c ? { crop: c } : {}),
        ...(n ? { notes: n } : {}),
        ...(obs ? { officerObservation: obs } : {}),
        ...(a ? { approximateArea: a } : {}),
      });
      setCreatedCaseId(result.caseId);
      setSubmitted(true);
      toast(`Case ${result.caseId} created for farmer ${farmerName || "Unknown"}.`, "healthy");
      onReportCreated?.(result.caseId);
    } catch (err) {
      console.error("Assisted report error:", err);
      toast("Failed to create report.", "critical");
    } finally {
      setSubmitting(false);
    }
  }, [farmerName, phone, village, crop, symptoms, area, notes, observation, user, toast, onReportCreated]);

  const handleReset = useCallback(() => {
    setFarmerName(""); setPhone(""); setVillage(""); setCrop("");
    setSymptoms([]); setArea(""); setNotes(""); setObservation("");
    setSubmitted(false); setCreatedCaseId("");
  }, []);

  if (submitted) {
    return (
      <div className="border border-leaf/30 bg-leaf/5 p-5">
        <div className="flex items-center gap-3 text-leaf">
          <CheckCircle2 className="size-8" />
          <div>
            <h3 className="font-semibold text-lg text-ink">Report Submitted — Case {createdCaseId}</h3>
            <p className="text-sm text-ink-2 mt-1">The case has been created and is now visible in the priority queue.</p>
          </div>
        </div>
        <button onClick={handleReset} className="mt-4 inline-flex items-center gap-2 border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:bg-surface-2 transition-colors">
          <UserPlus className="size-4" /> Create Another Report
        </button>
      </div>
    );
  }

  return (
    <div className="border border-line bg-surface p-5 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <UserPlus className="size-5 text-forest" />
        <h3 className="font-semibold text-ink">Assisted Farmer Report</h3>
        <span className="text-[0.65rem] font-bold uppercase tracking-wider text-amber bg-amber/10 px-2 py-0.5 ml-auto">source: assisted_report</span>
      </div>

      {/* Farmer Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-caption block mb-1">Farmer Name</label>
          <input value={farmerName} onChange={(e) => setFarmerName(e.target.value)} placeholder="e.g. Ramesh Kumar" className="w-full border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-forest focus:outline-none" />
        </div>
        <div>
          <label className="text-caption block mb-1">Phone (if available)</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" className="w-full border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-forest focus:outline-none" />
        </div>
        <div>
          <label className="text-caption block mb-1">Village</label>
          <input value={village} onChange={(e) => setVillage(e.target.value)} placeholder="e.g. Nandgaon Peth" className="w-full border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-forest focus:outline-none" />
        </div>
      </div>

      {/* Crop */}
      <div>
        <label className="text-caption block mb-1">Crop</label>
        <select value={crop} onChange={(e) => setCrop(e.target.value)} className="w-full border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-forest focus:outline-none">
          <option value="">Select crop</option>
          {CROPS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Symptoms */}
      <div>
        <label className="text-caption block mb-1">Symptoms (select all observed)</label>
        <div className="flex flex-wrap gap-2">
          {SYMPTOM_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => toggleSymptom(s)}
              className={cx(
                "px-3 py-1.5 text-xs font-medium border transition-colors",
                symptoms.includes(s) ? "border-forest bg-forest/10 text-forest" : "border-line bg-surface text-ink hover:bg-surface-2"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Approximate Area */}
      <div>
        <label className="text-caption block mb-1">Approximate Affected Area</label>
        <div className="flex flex-wrap gap-2">
          {AREA_OPTIONS.map((a) => (
            <button
              key={a}
              onClick={() => setArea(a)}
              className={cx(
                "px-3 py-1.5 text-xs font-medium border transition-colors",
                area === a ? "border-forest bg-forest/10 text-forest" : "border-line bg-surface text-ink hover:bg-surface-2"
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Notes & Observation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-caption block mb-1">Farmer's Description / Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What the farmer described..." rows={3} className="w-full border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-forest focus:outline-none resize-y" />
        </div>
        <div>
          <label className="text-caption block mb-1">Officer Observation</label>
          <textarea value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Your field observation..." rows={3} className="w-full border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-forest focus:outline-none resize-y" />
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className={cx(
          "inline-flex min-h-[44px] items-center gap-2 px-5 text-sm font-bold transition-colors",
          submitting ? "bg-forest/50 text-surface/50 cursor-not-allowed" : "bg-forest text-surface hover:bg-[#0e2b20]"
        )}
      >
        <Send className="size-4" />
        {submitting ? "Submitting..." : "Submit Assisted Report"}
      </button>
    </div>
  );
}
