/**
 * CaseTimeline — Visual timeline for crop-health case progression.
 *
 * Shows: Farmer Reported → AI Assessment → Officer Review → Field Visit
 *        → Expert Validation → Advisory Issued → Farmer Follow-up → Resolved
 */

import { CheckCircle2, Circle, Clock, Mic, Users, MapPin, Microscope, FileText, UserCheck, Flag } from "lucide-react";
import { getCaseTimeline } from "@/services/supabaseService";
import { cx } from "@/lib/cx";
import type { CaseTimelineEvent } from "@/types";

interface Props {
  caseId: string;
  compact?: boolean;
}

const EVENT_ICONS: Record<string, typeof CheckCircle2> = {
  farmer_reported: Mic,
  voice_reported: Mic,
  assisted_reported: Users,
  ai_assessment: Circle,
  officer_review: UserCheck,
  field_visit: MapPin,
  expert_validation: Microscope,
  advisory_issued: FileText,
  farmer_followup: Clock,
  resolved: Flag,
};

const EVENT_COLORS: Record<string, string> = {
  farmer_reported: "text-forest bg-forest/10 border-forest/30",
  voice_reported: "text-forest bg-forest/10 border-forest/30",
  assisted_reported: "text-blue-600 bg-blue-50 border-blue-200",
  ai_assessment: "text-purple-600 bg-purple-50 border-purple-200",
  officer_review: "text-amber bg-amber/10 border-amber/30",
  field_visit: "text-orange-600 bg-orange-50 border-orange-200",
  expert_validation: "text-forest bg-forest/10 border-forest/30",
  advisory_issued: "text-leaf bg-leaf/10 border-leaf/30",
  farmer_followup: "text-blue-600 bg-blue-50 border-blue-200",
  resolved: "text-leaf bg-leaf/10 border-leaf/30",
};

/** Static step definitions for showing the full expected pipeline */
const PIPELINE_STEPS: { type: CaseTimelineEvent["eventType"]; label: string }[] = [
  { type: "farmer_reported", label: "Farmer Reported" },
  { type: "ai_assessment", label: "AI Assessment" },
  { type: "officer_review", label: "Officer Review" },
  { type: "field_visit", label: "Field Visit" },
  { type: "expert_validation", label: "Expert Validation" },
  { type: "advisory_issued", label: "Advisory Issued" },
  { type: "farmer_followup", label: "Farmer Follow-up" },
  { type: "resolved", label: "Resolved" },
];

export function CaseTimeline({ caseId, compact = false }: Props) {
  const events = getCaseTimeline(caseId);
  const completedTypes = new Set(events.map((e) => e.eventType));

  if (compact) {
    // Show pipeline progress bar
    return (
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {PIPELINE_STEPS.map((step, i) => {
          const done = completedTypes.has(step.type);
          const isVoice = step.type === "farmer_reported" && completedTypes.has("voice_reported");
          const isAssisted = step.type === "farmer_reported" && completedTypes.has("assisted_reported");
          return (
            <div key={step.type} className="flex items-center gap-1 shrink-0">
              <div className={cx(
                "flex items-center gap-1 px-2 py-1 border text-[0.65rem] font-semibold",
                done ? "border-leaf/30 bg-leaf/10 text-leaf" : "border-line bg-surface-2 text-ink-2"
              )}>
                {done ? <CheckCircle2 className="size-3" /> : <Circle className="size-3" />}
                <span>{isVoice ? "Voice Report" : isAssisted ? "Assisted Report" : step.label}</span>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <span className={cx("text-xs", done ? "text-leaf" : "text-line")}>→</span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Full timeline view
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[18px] top-4 bottom-4 w-px bg-line" />

      <div className="space-y-4">
        {events.length > 0 ? events.map((event) => {
          const Icon = EVENT_ICONS[event.eventType] || Circle;
          const colorClass = EVENT_COLORS[event.eventType] || "text-ink-2 bg-surface-2 border-line";
          const [textColor] = colorClass.split(" ");

          return (
            <div key={event.id} className="flex gap-3 relative">
              <div className={cx("flex size-9 items-center justify-center border shrink-0 z-10", colorClass)}>
                <Icon className="size-4" />
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <p className={cx("text-sm font-semibold", textColor)}>{event.title}</p>
                {event.detail && (
                  <p className="text-xs text-ink-2 mt-0.5 line-clamp-2">{event.detail}</p>
                )}
                <p className="text-[0.65rem] text-ink-2 mt-1">
                  {new Date(event.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  {event.actorRole && <span className="ml-2 uppercase font-semibold">· {event.actorRole}</span>}
                </p>
              </div>
            </div>
          );
        }) : (
          <p className="text-sm text-ink-2 pl-12">No timeline events yet.</p>
        )}
      </div>
    </div>
  );
}
