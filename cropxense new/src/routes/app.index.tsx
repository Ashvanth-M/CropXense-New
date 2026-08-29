import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Drawer } from "@/components/ui/Overlay";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { MetricStrip, type Metric } from "@/components/app/MetricStrip";
import { RankBar, RISK_TONE, Sparkline } from "@/components/app/Sparkline";
import { MicroclimateSimulator } from "@/components/app/MicroclimateSimulator";
import {
  CaseStatusChip,
  ChannelIcons,
  ChannelTag,
  ConfidenceCell,
  Panel,
  RiskChip,
  Updated,
  relTime,
} from "@/components/app/bits";
import { useAsync } from "@/hooks/useAsync";
import {
  TODAY,
  assignFieldVisit,
  farmById,
  getDistrictRanking,
  getOutbreaks,
  getOverviewMetrics,
  getPriorityQueue,
  isoDay,
  latestWeather,
  validateCase,
  subscribe,
} from "@/services";
import type { CropHealthAssessment } from "@/types";
import { useT } from "@/i18n";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Officer overview — CropXense surveillance dashboard" },
      {
        name: "description",
        content:
          "Today's priority crop disease cases, emerging hotspots and district risk ranking for the India surveillance network.",
      },
      { property: "og:title", content: "Officer overview — CropXense" },
      {
        property: "og:description",
        content: "Priority case queue, hotspots and district risk ranking for plant-protection officers.",
      },
    ],
  }),
  component: OverviewPage,
});

type Row = {
  id: string;
  farm: string;
  district: string;
  crop: string;
  suspected: string;
  confidence: number;
  via: string;
  age: string;
  status: string;
  raw: CropHealthAssessment;
};

const METRIC_FILTER: Record<string, (a: CropHealthAssessment) => boolean> = {
  pendingReview: (a) => a.status === "awaiting_validation",
  atRisk: (a) => a.severity <= 3,
  outbreaks: (a) => a.severity >= 4,
  openFieldCases: (a) => a.status === "expert_confirmed",
};

function OverviewPage() {
  const { toast } = useToast();
  const { t, tCrop, tDistrict } = useT();
  const [selected, setSelected] = useState<string | null>(null);
  const [openCase, setOpenCase] = useState<CropHealthAssessment | null>(null);

  const metricsQ = useAsync(() => getOverviewMetrics(), []);
  const queueQ = useAsync(() => getPriorityQueue(), []);
  const outbreaksQ = useAsync(() => getOutbreaks(), []);
  const rankQ = useAsync(() => getDistrictRanking(), []);

  useEffect(() => {
    const unsub = subscribe(() => {
      metricsQ.reload?.();
      queueQ.reload?.();
    });
    return unsub;
  }, [metricsQ.reload, queueQ.reload]);

  const m = metricsQ.data;
  const metrics: Metric[] = [
    { id: "fields", label: t("officer.fieldsMonitored"), value: m?.fieldsMonitored ?? 0, delta: `+3 ${t("common.sinceYesterday")}` },
    { id: "healthy", label: t("officer.healthy"), value: m?.healthy ?? 0, delta: `+5 ${t("common.sinceYesterday")}` },
    { id: "atRisk", label: t("officer.atRisk"), value: m?.atRisk ?? 0, delta: `−2 ${t("common.sinceYesterday")}` },
    { id: "outbreaks", label: t("officer.activeOutbreaks"), value: m?.activeOutbreaks ?? 0, delta: `+1 ${t("common.thisWeek")}` },
    { id: "pendingReview", label: t("officer.pendingExpertReview"), value: m?.pendingReview ?? 0, delta: `+2 ${t("common.sinceYesterday")}` },
    { id: "openFieldCases", label: t("officer.openFieldCases"), value: m?.openFieldCases ?? 0, delta: `3 ${t("common.dueToday")}` },
  ];

  const rows: Row[] = useMemo(() => {
    const filterFn = selected ? METRIC_FILTER[selected] : undefined;
    return (queueQ.data ?? [])
      .filter((a) => (filterFn ? filterFn(a) : true))
      .slice(0, 14)
      .map((a) => ({
        id: a.id,
        farm: farmById(a.farmId)?.name ?? a.farmId,
        district: tDistrict(a.districtId),
        crop: tCrop(a.cropId),
        suspected: a.suspected,
        confidence: a.confidence,
        via: a.detectedVia.join(","),
        age: relTime(a.detectedAt, TODAY),
        status: a.status,
        raw: a,
      }));
  }, [queueQ.data, selected, tCrop, tDistrict]);

  const columns: Column<Row>[] = [
    { key: "id", header: t("field.caseId"), width: "132px", render: (r) => <span className="num text-[0.8125rem]">{r.id}</span> },
    { key: "farm", header: t("field.farm"), sortable: true },
    { key: "district", header: t("field.district"), sortable: true },
    { key: "crop", header: t("field.crop"), sortable: true },
    { key: "suspected", header: t("field.suspected") },
    { key: "confidence", header: t("field.confidence"), numeric: true, sortable: true, render: (r) => <ConfidenceCell value={r.confidence} /> },
    { key: "via", header: t("field.detectedVia"), render: (r) => <ChannelIcons channels={r.raw.detectedVia} /> },
    { key: "age", header: t("field.age"), render: (r) => <span className="num text-[0.8125rem]">{r.age}</span> },
    { key: "status", header: t("field.health"), render: (r) => <CaseStatusChip status={r.raw.status} /> },
    {
      key: "raw",
      header: t("action.viewCase"),
      render: (r) => (
        <Button size="sm" variant="secondary" onClick={() => setOpenCase(r.raw)}>
          {t("action.viewCase")}
        </Button>
      ),
    },
  ];

  const hotspots = (outbreaksQ.data ?? []).slice(0, 3);
  const ranking = (rankQ.data ?? []).slice(0, 6);
  const weather = latestWeather("amravati");

  return (
    <div className="flex flex-col gap-3">
      <h1 className="sr-only">{t("page.overview.title")}</h1>

      <div data-demo="metrics">
        <MetricStrip metrics={metrics} selected={selected} onSelect={setSelected} loading={metricsQ.loading} />
      </div>

      <MicroclimateSimulator />

      <div className="grid gap-3 lg:grid-cols-12">
        <Panel
          className="lg:col-span-8"
          title={t("officer.priorityQueue")}
          meta={selected ? t("officer.filteredLabel", { label: metrics.find((x) => x.id === selected)?.label ?? "" }) : t("officer.casesCount", { n: rows.length })}
        >
          {queueQ.loading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(r) => r.id}
              caption="Cases ranked by a composite of confidence, severity, age and outbreak overlap"
            />
          )}
        </Panel>

        <div className="flex flex-col gap-3 lg:col-span-4">
          <Panel title={t("officer.emergingHotspots")} meta={<Updated minutes={12} />}>
            <ul>
              {outbreaksQ.loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <li key={i} className="border-b border-line p-3 last:border-0">
                      <Skeleton className="h-8 w-full" />
                    </li>
                  ))
                : hotspots.map((o) => (
                    <li key={o.id} className="flex items-center gap-3 border-b border-line px-3 py-2 last:border-0">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.875rem] font-semibold">{o.threatName}</span>
                        <span className="block text-[0.75rem] text-ink-2">
                          {tDistrict(o.districtId)} · <span className="num">{o.affectedFields}</span> {t("common.fields")}
                        </span>
                      </span>
                      <Sparkline
                        values={o.trapTrend}
                        tone={RISK_TONE[o.risk] ?? "var(--ink-2)"}
                        label={`7-day trend for ${o.threatName} in ${tDistrict(o.districtId)}`}
                      />
                      <RiskChip risk={o.risk} />
                    </li>
                  ))}
            </ul>
          </Panel>

          <Panel title={t("officer.districtRisk")} meta={t("common.today")}>
            <ul className="px-3 py-2">
              {ranking.map((d) => (
                <li key={d.districtId} className="py-1.5">
                  <span className="flex items-baseline justify-between gap-2 text-[0.8125rem]">
                    <span className="font-semibold">{tDistrict(d.districtId)}</span>
                    <span className="num text-ink-2">
                      {d.score} · {d.openCases} {t("common.cases")}
                    </span>
                  </span>
                  <RankBar value={d.score} max={100} tone={RISK_TONE[d.risk] ?? "var(--ink-2)"} />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title={t("farmer.weatherRisk")} meta={<Updated minutes={12} />}>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 px-3 py-2 text-[0.8125rem]">
              {[
                [t("weather.rh"), `${weather.rhPct}%`],
                [t("weather.leafWet"), `${weather.leafWetnessHrs} ${t("common.hr")}`],
                [t("weather.rain"), `${weather.rainfallMm} mm`],
                [t("weather.maxTemp"), `${weather.tMaxC} °C`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-2 border-b border-line py-1">
                  <dt className="text-ink-2">{k}</dt>
                  <dd className="num">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="px-3 pb-2 text-[0.75rem] text-ink-2">
              {tDistrict("amravati")} — the conditions behind today's high-risk ranking.
            </p>
          </Panel>
        </div>
      </div>

      {/* Subdivision Operational Readiness & Extension Coverage Strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-line bg-surface p-3.5 flex items-center justify-between">
          <div>
            <span className="text-caption">Field Assistants On Duty</span>
            <p className="num font-bold text-[1.125rem] text-ink mt-0.5">14 Officers Active</p>
          </div>
          <span className="rounded-[var(--r)] bg-leaf/15 px-2 py-0.5 text-[0.6875rem] font-bold text-leaf">93% Coverage</span>
        </div>

        <div className="border border-line bg-surface p-3.5 flex items-center justify-between">
          <div>
            <span className="text-caption">Assigned Scouting Visits</span>
            <p className="num font-bold text-[1.125rem] text-ink mt-0.5">8 Scheduled Today</p>
          </div>
          <span className="rounded-[var(--r)] bg-amber/15 px-2 py-0.5 text-[0.6875rem] font-bold text-amber">3 Pending</span>
        </div>

        <div className="border border-line bg-surface p-3.5 flex items-center justify-between">
          <div>
            <span className="text-caption">Surveillance Traps Active</span>
            <p className="num font-bold text-[1.125rem] text-forest mt-0.5">48 Network Units</p>
          </div>
          <span className="rounded-[var(--r)] bg-forest/15 px-2 py-0.5 text-[0.6875rem] font-bold text-forest">Online</span>
        </div>

        <div className="border border-line bg-surface p-3.5 flex items-center justify-between">
          <div>
            <span className="text-caption">Emergency Broadcast Status</span>
            <p className="num font-bold text-[1.125rem] text-ink mt-0.5">Active — 4.2k Farmers</p>
          </div>
          <span className="rounded-[var(--r)] bg-leaf/15 px-2 py-0.5 text-[0.6875rem] font-bold text-leaf">Delivered</span>
        </div>
      </div>

      <CaseDrawer
        assessment={openCase}
        onClose={() => setOpenCase(null)}
        onValidated={(label) => {
          toast(label);
          setOpenCase(null);
        }}
      />
    </div>
  );
}

function CaseDrawer({
  assessment,
  onClose,
  onValidated,
}: {
  assessment: CropHealthAssessment | null;
  onClose: () => void;
  onValidated: (label: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const { t, tCrop, tDistrict } = useT();
  if (!assessment) return null;
  const farm = farmById(assessment.farmId);

  return (
    <Drawer open onClose={onClose} title={assessment.suspected}>
      <div className="space-y-4 text-[0.875rem]">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
          {[
            [t("field.caseId"), assessment.id],
            [t("field.farm"), farm ? `${farm.name}, ${farm.village}` : assessment.farmId],
            [t("field.district"), tDistrict(assessment.districtId)],
            [t("field.crop"), tCrop(assessment.cropId)],
            [t("field.area"), `${assessment.affectedAreaHa} ha`],
            [t("field.severity"), `${assessment.severity} ${t("common.of")} 5`],
          ].map(([k, v]) => (
            <div key={k} className="border-b border-line py-1">
              <dt className="text-caption">{k}</dt>
              <dd className="num text-[0.8125rem]">{v}</dd>
            </div>
          ))}
        </dl>

        <div>
          <p className="text-caption mb-1">{t("field.confidence")}</p>
          <ConfidenceCell value={assessment.confidence} />
          <p className="mt-1 text-[0.8125rem] text-ink-2">
            {t("note.humanCheck")}
          </p>
        </div>

        <div>
          <p className="text-caption mb-1">{t("field.detectedVia")}</p>
          <div className="flex flex-wrap gap-1">
            {assessment.detectedVia.map((c) => (
              <ChannelTag key={c} channel={c} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-caption mb-1">Evidence</p>
          <ul className="space-y-1">
            {assessment.evidence.map((e, i) => (
              <li key={i} className="border border-line px-2 py-1.5">
                <span className="block text-[0.8125rem] font-semibold">
                  {e.supports ? "Supports" : "Against"} · {e.label}
                </span>
                <span className="block text-[0.8125rem] text-ink-2">{e.detail}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await validateCase(assessment.id, "confirmed", "Confirmed on the evidence shown.");
              onValidated(t("toast.saved"));
            }}
          >
            {t("officer.confirmCase")}
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await assignFieldVisit(assessment.id, isoDay(1));
              onValidated(t("toast.fieldVisitAssigned"));
            }}
          >
            {t("officer.assignFieldVisit")}
          </Button>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await validateCase(assessment.id, "rejected", "Symptoms are abiotic; no pathogen recorded.");
              onValidated(t("officer.rejectCase"));
            }}
          >
            {t("action.reject")}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
