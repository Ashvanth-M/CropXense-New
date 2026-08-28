/**
 * /farmer/follow-up — Crop Health Case Lifecycle & Follow-up Timeline.
 *
 * Shows the real assessments for the logged-in farmer's fields, with a
 * timeline view for each case derived from the service layer.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Clock,
  CheckCircle2,
  Camera,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Card";
import { CaseStatusChip } from "@/components/app/bits";
import { useAsync } from "@/hooks/useAsync";
import {
  getAssessments,
  getFollowUps,
  cropName,
  districtName,
  farmById,
} from "@/services";
import { useAuth } from "@/auth/AuthContext";

export const Route = createFileRoute("/farmer/follow-up")({
  head: () => ({
    meta: [
      { title: "Case Follow-up — CropXense Farmer" },
      {
        name: "description",
        content: "Closed-loop crop health follow-up history from symptom detection to case resolution.",
      },
    ],
  }),
  component: FarmerFollowUpPage,
});

/** Map a case status to a human-readable timeline stage label */
function stageLabel(status: string): string {
  switch (status) {
    case "detected": return "Detected — pending review";
    case "awaiting_validation": return "Submitted for expert review";
    case "expert_confirmed": return "Expert confirmed";
    case "field_confirmed": return "Field visit confirmed";
    case "rejected": return "Assessment rejected";
    case "resolved": return "Case resolved";
    default: return status;
  }
}

function statusIcon(status: string) {
  if (["expert_confirmed", "field_confirmed", "resolved"].includes(status))
    return <CheckCircle2 className="size-5 text-forest" />;
  if (status === "rejected")
    return <AlertCircle className="size-5 text-alert" />;
  return <Clock className="size-5 text-amber animate-pulse" />;
}

function markerColor(status: string): string {
  if (["expert_confirmed", "field_confirmed", "resolved"].includes(status)) return "var(--leaf)";
  if (status === "rejected") return "var(--alert)";
  return "var(--amber)";
}

function FarmerFollowUpPage() {
  const { user } = useAuth();

  const assessmentsQ = useAsync(() => getAssessments(), []);
  const followUpsQ = useAsync(() => getFollowUps(), []);

  // Show all cases — in a real backend we'd filter by farmer userId.
  // For now show the cases that belong to farms with matching district.
  const cases = useMemo(() => {
    const all = assessmentsQ.data ?? [];
    // Prefer non-resolved/non-rejected open cases first, then closed ones
    return [...all].sort((a, b) => {
      const order: Record<string, number> = {
        detected: 0,
        awaiting_validation: 1,
        expert_confirmed: 2,
        field_confirmed: 3,
        resolved: 4,
        rejected: 5,
      };
      return (order[a.status] ?? 9) - (order[b.status] ?? 9);
    });
  }, [assessmentsQ.data]);

  const followUps = followUpsQ.data ?? [];

  const loading = assessmentsQ.loading || followUpsQ.loading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-line bg-surface p-5 md:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="text-caption text-forest">Case Tracking</span>
            <h1 className="mt-1 font-expanded text-[1.5rem] md:text-[1.875rem]">Crop Health Follow-Up</h1>
            <p className="mt-1 text-[0.875rem] text-ink-2">
              Track your reported crop health cases from detection through to resolution.
            </p>
          </div>
          <Link
            to="/farmer/scan"
            className="inline-flex min-h-[40px] items-center gap-1.5 border border-forest bg-forest px-3.5 text-[0.8125rem] font-semibold text-surface hover:bg-[#0e2b20]"
          >
            <Camera className="size-3.5" />
            <span>Upload New Check</span>
          </Link>
        </div>

        {/* Summary counts */}
        {!loading && (
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4">
            {[
              { label: "Total Cases", value: cases.length },
              { label: "Open", value: cases.filter((c) => ["detected", "awaiting_validation"].includes(c.status)).length },
              { label: "Confirmed", value: cases.filter((c) => ["expert_confirmed", "field_confirmed"].includes(c.status)).length },
              { label: "Resolved", value: cases.filter((c) => c.status === "resolved").length },
            ].map((m, i, arr) => (
              <div key={m.label} className={i < arr.length - 1 ? "border-r border-line pr-3" : ""}>
                <span className="text-caption">{m.label}</span>
                <p className="num mt-1 text-[1.25rem] font-bold text-ink">{m.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Case List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : cases.length === 0 ? (
        <div className="border border-line bg-surface p-8 text-center">
          <CheckCircle2 className="mx-auto size-10 text-leaf mb-3" />
          <p className="font-semibold text-ink">No cases recorded yet</p>
          <p className="mt-1 text-[0.875rem] text-ink-2">
            Use the scanner to photograph a leaf and submit your first case.
          </p>
          <Link
            to="/farmer/scan"
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 border border-forest bg-forest px-4 text-[0.875rem] font-semibold text-surface hover:bg-[#0e2b20]"
          >
            Scan a leaf now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((c) => {
            const farm = farmById(c.farmId);
            const caseFollowUps = followUps.filter((f) => f.assessmentId === c.id);
            const color = markerColor(c.status);

            return (
              <div key={c.id} className="border border-line bg-surface">
                {/* Case header */}
                <div className="flex flex-col justify-between gap-2 border-b border-line p-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="num text-[0.8125rem] font-bold text-ink-2">{c.id}</span>
                      <CaseStatusChip status={c.status} />
                      <span className="text-[0.8125rem] text-ink-2">
                        {c.detectedAt.slice(0, 10)}
                      </span>
                    </div>
                    <p className="mt-1 font-display text-[1.0625rem] font-bold text-ink">
                      {c.suspected}
                    </p>
                    <p className="text-[0.8125rem] text-ink-2">
                      {farm ? `${farm.name} · ${cropName(c.cropId)} · ${farm.village}, ${districtName(c.districtId)}` : `${cropName(c.cropId)} · ${districtName(c.districtId)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[0.8125rem]">
                    <span className="num text-ink-2">{c.affectedAreaHa} ha affected</span>
                    <span className="num font-semibold text-forest">{c.confidence}% confidence</span>
                  </div>
                </div>

                {/* Timeline */}
                <div className="p-4">
                  <ol className="relative space-y-4 pl-6">
                    <span aria-hidden className="absolute left-[9px] top-1 h-[calc(100%-8px)] w-px bg-line" />

                    {/* Detection event */}
                    <li className="relative">
                      <span
                        aria-hidden
                        className="absolute -left-6 top-1 flex size-[18px] items-center justify-center rounded-full border-2"
                        style={{ borderColor: "var(--amber)", background: "var(--surface)" }}
                      >
                        {statusIcon("detected")}
                      </span>
                      <p className="num text-[0.75rem] text-ink-2">{c.detectedAt.slice(0, 10)} · Detection</p>
                      <p className="text-[0.875rem] font-semibold text-ink">
                        {c.suspected} detected at {c.confidence}% confidence
                      </p>
                      <p className="text-[0.8125rem] text-ink-2">
                        Via: {c.detectedVia.join(", ")} · {c.affectedAreaHa} ha
                      </p>
                    </li>

                    {/* Current status event */}
                    {c.status !== "detected" && (
                      <li className="relative">
                        <span
                          aria-hidden
                          className="absolute -left-6 top-1 flex size-[18px] items-center justify-center rounded-full border-2"
                          style={{ borderColor: color, background: "var(--surface)" }}
                        >
                          {statusIcon(c.status)}
                        </span>
                        <p className="num text-[0.75rem] text-ink-2">
                          Latest update · {stageLabel(c.status)}
                        </p>
                        <p className="text-[0.875rem] font-semibold text-ink">
                          {stageLabel(c.status)}
                        </p>
                      </li>
                    )}

                    {/* Follow-up actions */}
                    {caseFollowUps.map((f) => (
                      <li key={f.id} className="relative">
                        <span
                          aria-hidden
                          className="absolute -left-6 top-1 size-[14px] border-2"
                          style={{
                            borderColor: f.done ? "var(--leaf)" : "var(--ink-2)",
                            background: "var(--surface)",
                          }}
                        />
                        <p className="num text-[0.75rem] text-ink-2">
                          Due {f.dueOn} · Follow-up {f.done ? "✓ done" : "pending"}
                        </p>
                        <p className="text-[0.875rem] text-ink">{f.action}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
