/**
 * /farmer/crop-care — Unified Crop Care & Action Center.
 *
 * Merges "Advisories" + "Follow-up" into a single connected workflow:
 * - Active Actions: open advisories and pending follow-ups
 * - Follow-ups: scheduled and completed check-ins
 * - Completed: resolved cases
 *
 * Fully localized with useT().
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Camera,
  AlertTriangle,
  ChevronDown,
  UserCheck,
  Phone,
  MessageSquare,
  ArrowRight,
  Send,
  Layers,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Card";
import { CaseStatusChip } from "@/components/app/bits";
import { useAuth } from "@/auth/AuthContext";
import {
  getFarmerFarms,
  getAdvisories,
  getAssessments,
  getFollowUps,
  farmById,
  acknowledgeAdvisory,
  submitFarmerFeedback,
  completeFollowUp,
  resolveCase,
  requestExpertReview,
  getScansForCase,
  getFeedbacksForCase,
  subscribe,
} from "@/services";
import { DEMO_OFFICER } from "@/data/farmerDemo";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/i18n";
import { cx } from "@/lib/cx";
import type { Advisory, CropHealthAssessment, FollowUp, FarmerObservation, Farm } from "@/types";

export const Route = createFileRoute("/farmer/crop-care")({
  head: () => ({
    meta: [
      { title: "Crop Care — CropXense Farmer" },
      {
        name: "description",
        content: "Unified crop health action center: advisories, follow-ups, and case management.",
      },
    ],
  }),
  component: FarmerCropCarePage,
});

type Tab = "active" | "followups" | "completed";

function FarmerCropCarePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t, tCrop, tStage, tDistrict, tRisk } = useT();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [assessments, setAssessments] = useState<CropHealthAssessment[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [f, a, adv, fu] = await Promise.all([
        getFarmerFarms(user),
        getAssessments(),
        getAdvisories(),
        getFollowUps(),
      ]);
      setFarms(f);
      setAssessments(a);
      setAdvisories(adv);
      setFollowUps(fu);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribe(() => {
      loadData();
    });
    return unsub;
  }, [user]);

  const [tab, setTab] = useState<Tab>("active");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedbackCaseId, setFeedbackCaseId] = useState<string | null>(null);
  const [feedbackObs, setFeedbackObs] = useState<FarmerObservation>("improving");
  const [feedbackNotes, setFeedbackNotes] = useState("");

  const farmIds = useMemo(() => new Set(farms.map((f) => f.id)), [farms]);

  // Cases belonging strictly to the farmer's registered fields
  const myCases = useMemo(() => {
    return assessments.filter((a) => farmIds.has(a.farmId));
  }, [assessments, farmIds]);

  // Active: cases not resolved/rejected + unacknowledged advisories
  const activeCases = useMemo(() =>
    myCases.filter((c) => !["resolved", "rejected"].includes(c.status)),
    [myCases],
  );

  // Follow-ups for active cases
  const myFollowUps = useMemo(() => {
    const caseIds = new Set(myCases.map((c) => c.id));
    return followUps.filter((f) => caseIds.has(f.assessmentId));
  }, [followUps, myCases]);

  const pendingFollowUps = myFollowUps.filter((f) => !f.done);
  const doneFollowUps = myFollowUps.filter((f) => f.done);

  // Completed cases
  const completedCases = useMemo(() =>
    myCases.filter((c) => ["resolved", "rejected"].includes(c.status)),
    [myCases],
  );

  const unacknowledged = advisories.filter((a) => !a.acknowledged && farmIds.has(a.farmId));

  function reload() { loadData(); }

  async function handleAcknowledge(id: string) {
    await acknowledgeAdvisory(id);
    toast("Advisory acknowledged.", "healthy");
    reload();
  }

  async function handleCompleteFollowUp(fuId: string) {
    await completeFollowUp(fuId);
    toast("Follow-up marked as completed.", "healthy");
    reload();
  }

  async function handleResolveCase(caseId: string) {
    await resolveCase(caseId);
    toast("Case resolved.", "healthy");
    reload();
  }

  async function handleSubmitFeedback() {
    if (!feedbackCaseId) return;
    const c = myCases.find((x) => x.id === feedbackCaseId);
    await submitFarmerFeedback(feedbackCaseId, c?.farmId ?? "", feedbackObs, feedbackNotes || undefined);
    toast("Feedback recorded. Thank you!", "healthy");
    setFeedbackCaseId(null);
    setFeedbackNotes("");
    reload();
  }

  const tabCounts = {
    active: activeCases.length + unacknowledged.length,
    followups: pendingFollowUps.length,
    completed: completedCases.length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="border border-line bg-surface px-5 py-4 md:px-6">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <span className="text-caption text-forest">{t("nav.cropCare")}</span>
            <h1 className="mt-0.5 font-expanded text-[1.375rem] md:text-[1.625rem]">{t("farmer.cropCareHub")}</h1>
            <p className="mt-0.5 text-[0.8125rem] text-ink-2">
              {t("nav.advisories")}, {t("farmer.followUps")}, and case records.
            </p>
          </div>
          <Link
            to="/farmer/scan"
            className="inline-flex min-h-[40px] items-center gap-1.5 border border-forest bg-forest px-3.5 text-[0.8125rem] font-semibold text-surface hover:bg-[#0e2b20]"
          >
            <Camera className="size-3.5" />
            {t("farmer.scanLeaf")}
          </Link>
        </div>

        {/* Tab Bar */}
        <div className="mt-4 flex items-center gap-1.5 border-t border-line pt-3">
          {(["active", "followups", "completed"] as Tab[]).map((tabKey) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setTab(tabKey)}
              className={cx(
                "inline-flex min-h-[36px] items-center gap-1 rounded-[var(--r)] px-3 text-[0.8125rem] font-semibold transition-colors",
                tab === tabKey
                  ? "bg-forest text-surface"
                  : "border border-line bg-paper text-ink hover:bg-surface-2",
              )}
            >
              <span>
                {tabKey === "active" ? t("farmer.activeActions") : tabKey === "followups" ? t("farmer.followUps") : t("farmer.completed")}
              </span>
              <span className="num ml-0.5 text-[0.6875rem] font-bold">({tabCounts[tabKey]})</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 w-full" />)}
        </div>
      ) : (
        <>
          {/* ── Active Tab ── */}
          {tab === "active" && (
            <div className="space-y-4">
              {activeCases.length === 0 && unacknowledged.length === 0 ? (
                <div className="border border-line bg-surface p-8 text-center">
                  <CheckCircle2 className="mx-auto size-10 text-leaf mb-3" />
                  <p className="font-semibold text-ink">{t("empty.title")}</p>
                  <p className="mt-1 text-[0.875rem] text-ink-2">
                    {t("status.healthy")} — {t("farmer.scanLeaf")}
                  </p>
                </div>
              ) : (
                <>
                  {/* Active cases */}
                  {activeCases.map((c) => {
                    const farm = farmById(c.farmId);
                    const advisory = (advisories ?? []).find((a) => a.assessmentId === c.id);
                    const caseFollowUps = myFollowUps.filter((f) => f.assessmentId === c.id);
                    const isExpanded = expandedId === c.id;
                    const scans = getScansForCase(c.id);

                    return (
                      <div key={c.id} className="border border-line bg-surface overflow-hidden">
                        {/* Case Header */}
                        <div className="flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center border-b border-line bg-paper">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="num text-[0.8125rem] font-bold text-ink-2">{c.id}</span>
                              <CaseStatusChip status={c.status} />
                              <span className="num text-[0.75rem] text-ink-2">{c.detectedAt.slice(0, 10)}</span>
                            </div>
                            <p className="mt-1 font-display text-[1.0625rem] font-bold text-ink">
                              {c.suspected}
                            </p>
                            <p className="text-[0.8125rem] text-ink-2">
                              {farm ? `${farm.name} · ${tCrop(c.cropId)} · ${farm.village}` : tCrop(c.cropId)}
                              {" · "}
                              <span className="num font-semibold text-forest">{c.confidence}%</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Risk badge */}
                            {c.riskAssessment && (
                              <span className={cx(
                                "rounded-[var(--r)] px-2 py-0.5 text-[0.6875rem] font-bold uppercase",
                                c.riskAssessment.overallRisk === "high"
                                  ? "bg-alert/15 text-alert"
                                  : c.riskAssessment.overallRisk === "moderate"
                                    ? "bg-amber/15 text-amber"
                                    : "bg-leaf/15 text-leaf",
                              )}>
                                {tRisk(c.riskAssessment.overallRisk)}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : c.id)}
                              className="inline-flex min-h-[36px] items-center gap-1 border border-line bg-surface px-3 text-[0.8125rem] font-semibold text-ink hover:bg-surface-2"
                            >
                              {isExpanded ? t("action.close") : t("action.viewCase")}
                              <ChevronDown className={cx("size-4 transition-transform", isExpanded && "rotate-180")} />
                            </button>
                          </div>
                        </div>

                        {/* Expanded Detail */}
                        {isExpanded && (
                          <div className="p-4 space-y-4">
                            {/* IPM Steps */}
                            {advisory && (
                              <div className="grid gap-3 md:grid-cols-3 text-[0.8125rem]">
                                <div className="border border-line bg-paper p-3">
                                  <div className="flex items-center gap-2 font-semibold text-forest mb-2">
                                    <span className="flex size-5 items-center justify-center rounded-full bg-forest/10 text-[0.6875rem]">1</span>
                                    Cultural & Mechanical
                                  </div>
                                  <ul className="space-y-1">
                                    {advisory.cultural.map((s, i) => (
                                      <li key={i} className="flex items-start gap-1.5">
                                        <span className="text-forest">•</span> {s}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="border border-line bg-paper p-3">
                                  <div className="flex items-center gap-2 font-semibold text-leaf mb-2">
                                    <span className="flex size-5 items-center justify-center rounded-full bg-leaf/10 text-[0.6875rem]">2</span>
                                    Biological / IPM
                                  </div>
                                  <ul className="space-y-1">
                                    {advisory.biological.map((s, i) => (
                                      <li key={i} className="flex items-start gap-1.5">
                                        <span className="text-leaf">•</span> {s}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="border border-line bg-paper p-3">
                                  <div className="flex items-center gap-2 font-semibold text-amber mb-2">
                                    <span className="flex size-5 items-center justify-center rounded-full bg-amber/10 text-[0.6875rem]">3</span>
                                    Chemical (Officer Only)
                                  </div>
                                  <ul className="space-y-1">
                                    {advisory.chemical.map((s, i) => (
                                      <li key={i} className="flex items-start gap-1.5">
                                        <span className="text-amber">•</span> {s}
                                      </li>
                                    ))}
                                  </ul>
                                  {!advisory.acknowledged && (
                                    <button
                                      type="button"
                                      onClick={() => handleAcknowledge(advisory.id)}
                                      className="mt-2 inline-flex min-h-[32px] w-full items-center justify-center gap-1 border border-forest bg-forest px-2 text-[0.75rem] font-semibold text-surface hover:bg-[#0e2b20]"
                                    >
                                      <CheckCircle2 className="size-3.5" /> {t("action.save")}
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Follow-ups for this case */}
                            {caseFollowUps.length > 0 && (
                              <div className="border border-line bg-paper p-3">
                                <h4 className="font-semibold text-ink text-[0.875rem] mb-2">{t("farmer.followUps")}</h4>
                                <div className="space-y-2">
                                  {caseFollowUps.map((f) => (
                                    <div key={f.id} className="flex items-center justify-between gap-2 border border-line bg-surface p-2 text-[0.8125rem]">
                                      <div>
                                        <p className="text-ink">{f.action}</p>
                                        <p className="num text-[0.75rem] text-ink-2">
                                          Due: {f.dueOn} {f.done ? "· ✓ Completed" : ""}
                                        </p>
                                      </div>
                                      {!f.done && (
                                        <div className="flex items-center gap-1.5">
                                          <Link
                                            to="/farmer/scan"
                                            className="inline-flex min-h-[32px] items-center gap-1 border border-forest bg-forest px-2 text-[0.75rem] font-semibold text-surface hover:bg-[#0e2b20]"
                                          >
                                            <Camera className="size-3" /> {t("farmer.reScan")}
                                          </Link>
                                          <button
                                            type="button"
                                            onClick={() => handleCompleteFollowUp(f.id)}
                                            className="inline-flex min-h-[32px] items-center gap-1 border border-line bg-surface px-2 text-[0.75rem] font-semibold text-ink hover:bg-surface-2"
                                          >
                                            <CheckCircle2 className="size-3" /> {t("status.resolved")}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Scans (before/after) */}
                            {scans.length > 0 && (
                              <div className="border border-line bg-paper p-3">
                                <h4 className="font-semibold text-ink text-[0.875rem] mb-2">Scan Photographs</h4>
                                <div className="flex gap-3 overflow-x-auto">
                                  {scans.map((s, i) => (
                                    <div key={s.id} className="shrink-0 border border-line bg-surface p-1.5">
                                      <img
                                        src={s.imageDataUrl}
                                        alt={`Scan ${i + 1}`}
                                        className="size-[100px] object-cover"
                                      />
                                      <p className="num mt-1 text-center text-[0.6875rem] text-ink-2">
                                        {s.isFollowUp ? "Follow-up" : "Initial"} · {s.scannedAt.slice(0, 10)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Case actions */}
                            <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                              <button
                                type="button"
                                onClick={() => setFeedbackCaseId(c.id)}
                                className="inline-flex min-h-[36px] items-center gap-1.5 border border-line bg-paper px-3 text-[0.8125rem] font-semibold text-ink hover:bg-surface-2"
                              >
                                <MessageSquare className="size-3.5" /> {t("farmer.reportProgress")}
                              </button>
                              <Link
                                to="/farmer/scan"
                                className="inline-flex min-h-[36px] items-center gap-1.5 border border-forest bg-forest px-3 text-[0.8125rem] font-semibold text-surface hover:bg-[#0e2b20]"
                              >
                                <Camera className="size-3.5" /> {t("farmer.reScan")}
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleResolveCase(c.id)}
                                className="inline-flex min-h-[36px] items-center gap-1.5 border border-leaf bg-leaf/10 px-3 text-[0.8125rem] font-semibold text-leaf hover:bg-leaf/20"
                              >
                                <CheckCircle2 className="size-3.5" /> {t("farmer.markResolved")}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* ── Follow-ups Tab ── */}
          {tab === "followups" && (
            <div className="space-y-3">
              {pendingFollowUps.length === 0 ? (
                <div className="border border-line bg-surface p-8 text-center">
                  <Clock className="mx-auto size-10 text-forest mb-3" />
                  <p className="font-semibold text-ink">{t("empty.title")}</p>
                  <p className="mt-1 text-[0.875rem] text-ink-2">
                    {t("status.resolved")} — {t("farmer.scanLeaf")}
                  </p>
                </div>
              ) : (
                pendingFollowUps.map((f) => {
                  const assessment = myCases.find((c) => c.id === f.assessmentId);
                  const farm = assessment ? farmById(assessment.farmId) : null;
                  return (
                    <div key={f.id} className="border border-line bg-surface p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink text-[0.9375rem]">{f.action}</p>
                        <p className="text-[0.8125rem] text-ink-2">
                          {assessment ? `${assessment.suspected} · ` : ""}
                          {farm ? `${farm.name} · ` : ""}
                          <span className="num">Due: {f.dueOn}</span>
                        </p>
                        {f.reason && <p className="mt-1 text-[0.75rem] text-ink-2">{f.reason}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          to="/farmer/scan"
                          className="inline-flex min-h-[36px] items-center gap-1 border border-forest bg-forest px-2.5 text-[0.8125rem] font-semibold text-surface hover:bg-[#0e2b20]"
                        >
                          <Camera className="size-3.5" /> {t("nav.scan")}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleCompleteFollowUp(f.id)}
                          className="inline-flex min-h-[36px] items-center gap-1 border border-line bg-paper px-2.5 text-[0.8125rem] font-semibold text-ink hover:bg-surface-2"
                        >
                          <CheckCircle2 className="size-3.5" /> {t("status.resolved")}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── Completed Tab ── */}
          {tab === "completed" && (
            <div className="space-y-3">
              {completedCases.length === 0 ? (
                <div className="border border-line bg-surface p-8 text-center">
                  <Layers className="mx-auto size-10 text-ink-2 mb-3" />
                  <p className="font-semibold text-ink">{t("empty.title")}</p>
                  <p className="mt-1 text-[0.875rem] text-ink-2">
                    {t("empty.body")}
                  </p>
                </div>
              ) : (
                completedCases.map((c) => {
                  const farm = farmById(c.farmId);
                  return (
                    <div key={c.id} className="border border-line bg-surface p-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-leaf" />
                          <span className="num text-[0.8125rem] font-bold text-ink-2">{c.id}</span>
                          <CaseStatusChip status={c.status} />
                        </div>
                        <p className="mt-1 font-semibold text-ink">{c.suspected}</p>
                        <p className="text-[0.8125rem] text-ink-2">
                          {farm ? `${farm.name} · ` : ""}{tCrop(c.cropId)} · {c.detectedAt.slice(0, 10)}
                        </p>
                      </div>
                      <span className="num text-[0.8125rem] font-semibold text-leaf">{c.confidence}%</span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* IPM Advisory Standards & Plant Clinic Guidelines */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="border border-line bg-surface p-4">
              <h3 className="font-display text-[0.9375rem] font-semibold text-ink flex items-center gap-1.5 mb-2">
                <ShieldCheck className="size-4 text-forest" />
                <span>Integrated Pest Management (IPM) Principles</span>
              </h3>
              <ul className="space-y-1.5 text-[0.8125rem] text-ink-2">
                <li className="flex items-start gap-1.5">
                  <span className="text-forest font-bold">•</span>
                  <span><strong>Biological First:</strong> Release parasitoids or apply Trichoderma before chemical sprays.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-forest font-bold">•</span>
                  <span><strong>Threshold Rule:</strong> Spray chemicals only if trap or crop scouting crosses Economic Thresholds (ETL).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-forest font-bold">•</span>
                  <span><strong>Mode of Action Rotation:</strong> Alternate chemical classes to prevent pest resistance buildup.</span>
                </li>
              </ul>
            </div>

            <div className="border border-line bg-surface p-4 flex flex-col justify-between">
              <div>
                <h3 className="font-display text-[0.9375rem] font-semibold text-ink flex items-center gap-1.5 mb-2">
                  <UserCheck className="size-4 text-forest" />
                  <span>Subdivision Plant Health Clinic</span>
                </h3>
                <p className="text-[0.8125rem] text-ink-2">
                  Have an unidentifiable crop anomaly? Bring leaf samples sealed in a paper envelope to the Akola Taluka Agriculture Office.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-line flex items-center justify-between text-[0.75rem] text-ink-2">
                <span>Working hours: 10:00 AM – 05:30 PM (Mon–Fri)</span>
                <span className="font-semibold text-forest">Toll-free: 1800-180-1551</span>
              </div>
            </div>
          </div>

          {/* Officer contact */}
          <div className="flex flex-col justify-between gap-3 border border-line bg-surface-2 p-3.5 text-[0.8125rem] sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <UserCheck className="size-4 text-forest" />
              <span>Department of Agriculture: <strong>{DEMO_OFFICER.name}</strong></span>
            </div>
            <a
              href={`tel:${DEMO_OFFICER.phone}`}
              className="inline-flex items-center gap-1.5 font-semibold text-forest hover:underline"
            >
              <Phone className="size-3.5" />
              {DEMO_OFFICER.phone}
            </a>
          </div>
        </>
      )}

      {/* Feedback Modal */}
      {feedbackCaseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
          <div className="fixed inset-0 bg-ink/50 backdrop-blur-xs" onClick={() => setFeedbackCaseId(null)} />
          <div className="relative w-full max-w-md border border-line bg-surface p-5 shadow-overlay">
            <h2 className="font-display text-[1.125rem] font-semibold mb-4">{t("farmer.reportProgress")}</h2>
            <p className="text-[0.8125rem] text-ink-2 mb-3">
              {t("field.caseId")}: <strong className="num text-ink">{feedbackCaseId}</strong>
            </p>

            <div className="space-y-2 mb-4">
              {(["improving", "no_change", "worsening"] as FarmerObservation[]).map((obs) => (
                <button
                  key={obs}
                  type="button"
                  onClick={() => setFeedbackObs(obs)}
                  className={cx(
                    "w-full text-left border p-3 text-[0.875rem] font-semibold transition-colors",
                    feedbackObs === obs
                      ? obs === "improving" ? "border-leaf bg-leaf/10 text-leaf"
                        : obs === "worsening" ? "border-alert bg-alert/10 text-alert"
                        : "border-amber bg-amber/10 text-amber"
                      : "border-line bg-paper text-ink hover:bg-surface-2",
                  )}
                >
                  {obs === "improving" ? `✓ ${t("status.improving")}` : obs === "worsening" ? `✗ ${t("status.worsening")}` : `— ${t("status.no_change")}`}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              placeholder="Additional observations..."
              value={feedbackNotes}
              onChange={(e) => setFeedbackNotes(e.target.value)}
              className="w-full border border-line bg-paper p-2 text-[0.8125rem] outline-none focus:border-forest mb-3"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFeedbackCaseId(null)}
                className="flex-1 min-h-[40px] border border-line bg-paper font-semibold text-ink hover:bg-surface-2"
              >
                {t("action.cancel")}
              </button>
              <button
                type="button"
                onClick={handleSubmitFeedback}
                className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 border border-forest bg-forest font-semibold text-surface hover:bg-[#0e2b20]"
              >
                <Send className="size-3.5" /> {t("action.submit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
