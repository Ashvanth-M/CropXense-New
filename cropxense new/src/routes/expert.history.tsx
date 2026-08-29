/**
 * /expert/history — Plant Protection Expert Validation History & Ledger.
 *
 * Log of scientifically reviewed cases, tracking agreements, corrections,
 * and ground-truth validation records.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  CheckCircle2,
  Edit3,
  FlaskConical,
} from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { getAssessments } from "@/services";
import { useT } from "@/i18n";

export const Route = createFileRoute("/expert/history")({
  head: () => ({
    meta: [
      { title: "Validation History — Expert Validation" },
      {
        name: "description",
        content: "Ledger of expert-confirmed and corrected crop-health assessments.",
      },
    ],
  }),
  component: ExpertHistoryPage,
});

function ExpertHistoryPage() {
  const { t, tCrop } = useT();
  const { data: assessments, loading } = useAsync(() => getAssessments(), []);
  const [filter, setFilter] = useState<"all" | "confirmed" | "corrected">("all");

  const validatedCases = (assessments ?? []).filter((a) => {
    if (filter === "confirmed") return a.status === "expert_confirmed" || a.status === "field_confirmed";
    if (filter === "corrected") return a.status === "resolved";
    return a.status !== "detected" && a.status !== "awaiting_validation";
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-line bg-surface p-5 md:p-6">
        <span className="text-caption text-forest">{t("nav.validationHistory")}</span>
        <h1 className="mt-1 font-expanded text-[1.5rem] md:text-[1.875rem]">{t("expert.historyTitle")}</h1>
        <p className="mt-1 text-[0.875rem] text-ink-2">
          {t("role.expertDesc")}
        </p>

        {/* Filter buttons */}
        <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
          {[
            { id: "all", label: t("common.all") },
            { id: "confirmed", label: t("caseStatus.expert_confirmed") },
            { id: "corrected", label: t("expert.caseCorrected") },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              className={`inline-flex min-h-[36px] items-center rounded-[var(--r)] px-3 text-[0.8125rem] font-semibold transition-colors ${
                filter === tab.id
                  ? "bg-forest text-surface"
                  : "border border-line bg-paper text-ink hover:bg-surface-2"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* History Records Table */}
      <div className="border border-line bg-surface overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-ink-2">{t("common.loading")}</div>
        ) : validatedCases.length === 0 ? (
          <div className="p-8 text-center text-[0.9375rem] text-ink-2">
            {t("empty.noCases")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[0.875rem]">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-caption text-ink-2">
                  <th className="p-3.5 font-semibold">{t("field.caseId")}</th>
                  <th className="p-3.5 font-semibold">{t("field.farm")}</th>
                  <th className="p-3.5 font-semibold">{t("field.crop")}</th>
                  <th className="p-3.5 font-semibold">{t("field.suspected")}</th>
                  <th className="p-3.5 font-semibold">{t("expert.verdict")}</th>
                  <th className="p-3.5 font-semibold">{t("expert.reviewDate")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {validatedCases.map((item) => {
                  const isCorrected = item.status === "resolved";

                  return (
                    <tr key={item.id} className="group transition-colors hover:bg-surface-2">
                      <td className="p-3.5">
                        <span className="num font-bold text-ink">{item.id}</span>
                      </td>
                      <td className="p-3.5 text-ink font-semibold">{item.farmId}</td>
                      <td className="p-3.5 text-ink">{tCrop(item.cropId)}</td>
                      <td className="p-3.5 text-ink-2">{item.suspected}</td>
                      <td className="p-3.5">
                        {isCorrected ? (
                          <span className="inline-flex items-center gap-1 rounded-[var(--r)] border border-amber/30 bg-amber/10 px-2 py-0.5 text-[0.75rem] font-bold text-amber">
                            <Edit3 className="size-3" />
                            <span>{t("expert.caseCorrected")}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-[var(--r)] border border-leaf/30 bg-leaf/10 px-2 py-0.5 text-[0.75rem] font-bold text-leaf">
                            <CheckCircle2 className="size-3" />
                            <span>{t("caseStatus.expert_confirmed")}</span>
                          </span>
                        )}
                      </td>
                      <td className="num p-3.5 text-ink-2">{item.detectedAt.slice(0, 10)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Model Diagnostic Agreement & Calibration Summary */}
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="border border-line bg-surface p-5 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h2 className="font-display text-[1.0625rem] font-semibold text-ink">
                {t("landing.signalsTitle")}
              </h2>
              <p className="text-[0.8125rem] text-ink-2">{t("landing.signalsLead")}</p>
            </div>
            <span className="text-caption text-forest font-bold">2026</span>
          </div>

          <div className="mt-4 space-y-3 text-[0.8125rem]">
            {[
              { crop: `${tCrop("cotton")} (Alternaria & Blight)`, agreement: 94.2, cases: 48 },
              { crop: `${tCrop("soybean")} (Yellow Mosaic & Rust)`, agreement: 91.5, cases: 35 },
              { crop: `${tCrop("tomato")} (Early & Late Blight)`, agreement: 86.8, cases: 22 },
            ].map((stat, i) => (
              <div key={i} className="border border-line bg-paper p-3 rounded-[var(--r)]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">{stat.crop}</span>
                  <span className="num font-bold text-forest text-[0.875rem]">{stat.agreement}%</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-2 flex-1 bg-surface-2 rounded-full overflow-hidden">
                    <div className="h-full bg-forest" style={{ width: `${stat.agreement}%` }} />
                  </div>
                  <span className="text-[0.75rem] text-ink-2">{stat.cases} {t("common.cases")}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-line bg-surface p-5 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="font-display text-[1.0625rem] font-semibold text-ink">
                  {t("expert.knowledgeTitle")}
                </h2>
                <p className="text-[0.8125rem] text-ink-2">{t("role.expertDesc")}</p>
              </div>
              <FlaskConical className="size-4 text-forest" />
            </div>

            <div className="mt-4 space-y-2.5 text-[0.8125rem]">
              <div className="border border-line bg-paper p-2.5">
                <span className="text-caption">{t("expert.expertNotes")}</span>
                <p className="font-semibold text-ink mt-0.5">{t("note.humanCheck")}</p>
              </div>
              <div className="border border-line bg-paper p-2.5">
                <span className="text-caption">{t("status.healthy")}</span>
                <p className="font-semibold text-leaf mt-0.5">{t("landing.noAloneDiagText")}</p>
              </div>
            </div>
          </div>

          <p className="mt-3 pt-3 border-t border-line text-[0.75rem] text-ink-2">
            {t("officer.statusBadge")}
          </p>
        </section>
      </div>
    </div>
  );
}
