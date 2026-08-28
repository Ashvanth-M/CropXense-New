import { createFileRoute, Link } from "@tanstack/react-router";
import { Tabs } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/ui/Card";
import { StatusChip, SeverityMeter, ConfidenceBar } from "@/components/ui/Status";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { CaseStatusChip, Panel, Updated, relTime } from "@/components/app/bits";
import { Sparkline } from "@/components/app/Sparkline";
import { LeafPlate, SAMPLES } from "@/components/app/LeafPlate";
import { useAsync } from "@/hooks/useAsync";
import {
  STAGE_LABEL,
  TODAY,
  cropName,
  districtName,
  farmById,
  getAdvisories,
  getAssessments,
  getFarmVisits,
  getFollowUps,
  getSensorReadings,
  getSensors,
  getTrapReadings,
  getTraps,
  getWeather,
  latestWeather,
} from "@/services";
import type { CropHealthAssessment, Farm } from "@/types";

export const Route = createFileRoute("/app/farms/$id")({
  head: () => ({
    meta: [
      { title: "Field record — CropXense farm health history" },
      {
        name: "description",
        content:
          "Full health record for a monitored field: current status, sensors, pest activity, weather risk, disease history, advisories and the follow-up timeline.",
      },
      { property: "og:title", content: "Field record — CropXense" },
      {
        property: "og:description",
        content: "One field, one record: health, instruments, pest activity, advisories and follow-up timeline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FarmDetailPage,
});

const HEALTH_MAP = {
  healthy: "healthy",
  at_risk: "watch",
  affected: "critical",
} as const;

function LocatorMap({ farm }: { farm: Farm }) {
  return (
    <svg viewBox="0 0 160 100" className="block h-auto w-[160px] border border-line" role="img" aria-label={`Locator map for ${farm.name}`}>
      <rect width="160" height="100" fill="var(--surface-2)" />
      <g stroke="var(--line)" strokeWidth="0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="100" />
        ))}
        {[0, 1, 2].map((i) => (
          <line key={`h${i}`} x1="0" y1={i * 40} x2="160" y2={i * 40} />
        ))}
      </g>
      <polygon
        points="20,20 132,14 146,72 34,86"
        fill="none"
        stroke="var(--ink-2)"
        strokeWidth="0.8"
        strokeDasharray="3 2"
      />
      <circle cx="86" cy="48" r="5" fill="none" stroke="var(--alert)" strokeWidth="1.4" />
      <path d="M86 38 L86 58 M76 48 L96 48" stroke="var(--alert)" strokeWidth="0.8" />
      <text x="6" y="95" className="num" fontSize="6" fill="var(--ink-2)">
        {farm.lat.toFixed(3)}, {farm.lon.toFixed(3)}
      </text>
    </svg>
  );
}

function TimelineRail({ nodes }: { nodes: { day: string; date: string; label: string; detail: string; tone: string; thumb?: boolean }[] }) {
  return (
    <ol className="relative flex flex-col gap-4 pl-6">
      <span aria-hidden className="absolute left-[7px] top-1 h-[calc(100%-8px)] w-px bg-line" />
      {nodes.map((n) => (
        <li key={n.day + n.label} className="relative">
          <span
            aria-hidden
            className="absolute -left-6 top-1 block size-[15px] border-2"
            style={{ borderColor: n.tone, background: "var(--surface)" }}
          />
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="num text-[0.75rem] text-ink-2">
              {n.day} · {n.date}
            </span>
            <span className="text-[0.9375rem] font-semibold">{n.label}</span>
          </div>
          <p className="text-[0.8125rem] text-ink-2">{n.detail}</p>
          {n.thumb ? (
            <span className="mt-1 block w-[92px] border border-line">
              <LeafPlate sample={SAMPLES[0]!} analysis={false} />
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function FarmDetailPage() {
  const { id } = Route.useParams();
  const { toast } = useToast();
  const farm = farmById(id);

  function exportFarmRecord() {
    if (!farm) return;
    const rows = [
      ["Field ID", farm.id],
      ["Name", farm.name],
      ["Owner", farm.ownerName],
      ["Village", farm.village],
      ["District", districtName(farm.districtId)],
      ["Crop", cropName(farm.cropId)],
      ["Stage", STAGE_LABEL[farm.stage] ?? farm.stage],
      ["Area (ha)", farm.areaHa.toFixed(1)],
      ["Health", farm.health],
      ["Sown on", farm.sowingDate],
      ["Coordinates", `${farm.lat.toFixed(5)}, ${farm.lon.toFixed(5)}`],
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `field-${farm.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast(`Field record for ${farm.name} downloaded`);
  }

  const casesQ = useAsync(() => getAssessments({ farmId: id }), [id]);
  const sensorsQ = useAsync(() => getSensors(farm?.districtId), [farm?.districtId]);
  const trapsQ = useAsync(() => getTraps(farm?.districtId), [farm?.districtId]);
  const trapReadingsQ = useAsync(() => getTrapReadings(), []);
  const weatherQ = useAsync(() => getWeather(farm?.districtId ?? ""), [farm?.districtId]);
  const advisoriesQ = useAsync(() => getAdvisories(id), [id]);
  const visitsQ = useAsync(() => getFarmVisits(id), [id]);
  const followUpsQ = useAsync(() => getFollowUps(), []);

  if (!farm) {
    return (
      <div className="border border-line bg-surface p-6">
        <h1 className="text-[1.5rem]">Field not found</h1>
        <p className="text-[0.875rem] text-ink-2">
          No field is registered under {id}.{" "}
          <Link to="/app/fields" className="underline">
            Return to the field register
          </Link>
          .
        </p>
      </div>
    );
  }

  const cases = casesQ.data ?? [];
  const sensors = (sensorsQ.data ?? []).filter((s) => s.farmId === farm.id);
  const traps = (trapsQ.data ?? []).filter((t) => t.farmId === farm.id);
  const weather = weatherQ.data ?? [];
  const today = latestWeather(farm.districtId);
  const advisories = advisoriesQ.data ?? [];
  const visits = visitsQ.data ?? [];
  const followUps = (followUpsQ.data ?? []).filter((f) => cases.some((c) => c.id === f.assessmentId));
  const openCase: CropHealthAssessment | undefined = cases.find(
    (c) => !["resolved", "rejected"].includes(c.status),
  );

  const timeline = [
    { day: "Day 0", date: "18 Aug", label: "Detected from a field image", detail: `${openCase?.suspected ?? "Leaf blight"} suspected at ${openCase?.confidence ?? 88}% confidence`, tone: "var(--amber)" },
    { day: "Day 1", date: "19 Aug", label: "Expert reviewed", detail: "Dr. S. Kulkarni confirmed the assessment against the submitted image", tone: "var(--leaf)" },
    { day: "Day 2", date: "20 Aug", label: "Advisory issued", detail: "IPM guidance sent to the farmer in Marathi by SMS", tone: "var(--water)" },
    { day: "Day 5", date: "23 Aug", label: "Follow-up image uploaded", detail: "Same rows re-photographed; lesion count unchanged", tone: "var(--ink-2)", thumb: true },
    { day: "Day 7", date: "25 Aug", label: "Risk reduced", detail: "Trap counts fell below threshold; humidity window closed", tone: "var(--leaf)" },
    { day: "Day 10", date: "28 Aug", label: "Case scheduled for closure", detail: "Awaiting the final field visit record", tone: "var(--ink-2)" },
  ];

  const tabs = [
    {
      label: "Current health",
      content: (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Panel title="Working assessment" bodyClassName="p-3">
            {casesQ.loading ? (
              <Skeleton className="h-32 w-full" />
            ) : openCase ? (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[1.125rem]">{openCase.suspected}</span>
                  <CaseStatusChip status={openCase.status} />
                </div>
                <ConfidenceBar value={openCase.confidence} label="Confidence" />
                <div className="flex flex-wrap items-center gap-3 text-[0.875rem]">
                  <SeverityMeter level={openCase.severity} />
                  <span className="num">{openCase.affectedAreaHa.toFixed(1)} ha affected</span>
                  <span className="num">{relTime(openCase.detectedAt, TODAY)} ago</span>
                </div>
                <Link to="/app/validation" className="text-[0.875rem] underline">
                  Open in the validation console
                </Link>
              </div>
            ) : (
              <p className="text-[0.875rem] text-ink-2">No open case. The last check found nothing to act on.</p>
            )}
          </Panel>
          <Panel title="Field particulars" bodyClassName="p-3">
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[0.875rem]">
              {[
                ["Owner", farm.ownerName],
                ["Village", farm.village],
                ["District", districtName(farm.districtId)],
                ["Crop", cropName(farm.cropId)],
                ["Area", `${farm.areaHa.toFixed(1)} ha`],
                ["Stage", STAGE_LABEL[farm.stage] ?? farm.stage],
                ["Sown on", farm.sowingDate],
                ["Instruments", `${sensors.length} sensors · ${traps.length} traps`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-caption">{k}</dt>
                  <dd className="num">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      ),
    },
    {
      label: "Sensors",
      content: sensors.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sensors.map((s) => (
            <SensorCard key={s.id} sensorId={s.id} type={s.type} battery={s.battery} status={s.status} />
          ))}
        </div>
      ) : (
        <p className="p-3 text-[0.875rem] text-ink-2">No instruments installed on this field yet.</p>
      ),
    },
    {
      label: "Pest activity",
      content: traps.length ? (
        <ul className="border border-line">
          {traps.map((t) => {
            const series = (trapReadingsQ.data ?? []).filter((r) => r.trapId === t.id);
            const last = series[series.length - 1];
            const over = (last?.count ?? 0) >= (last?.threshold ?? 1);
            return (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-3 py-2 last:border-b-0">
                <span className="text-[0.875rem]">
                  <span className="num text-ink-2">{t.id}</span> · {t.type} trap
                </span>
                <Sparkline values={series.map((r) => r.count)} label={`Counts for trap ${t.id}`} tone={over ? "var(--alert)" : "var(--leaf)"} />
                <span className="num text-[0.875rem]">
                  {last?.count ?? 0} / {last?.threshold ?? 0} ETL
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="p-3 text-[0.875rem] text-ink-2">No traps installed on this field.</p>
      ),
    },
    {
      label: "Weather risk",
      content: (
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-[0.875rem]">
            <caption className="sr-only">District weather over the last 7 days</caption>
            <thead className="bg-surface-2">
              <tr>
                {["Date", "Max °C", "Min °C", "RH %", "Rain mm", "Leaf wetness h"].map((h) => (
                  <th key={h} scope="col" className="text-caption px-3 py-2 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weather.map((w) => (
                <tr key={w.date} className="border-t border-line">
                  <td className="num px-3 py-1.5">{w.date}</td>
                  <td className="num px-3 py-1.5">{w.tMaxC}</td>
                  <td className="num px-3 py-1.5">{w.tMinC}</td>
                  <td className="num px-3 py-1.5">{w.rhPct}</td>
                  <td className="num px-3 py-1.5">{w.rainfallMm}</td>
                  <td className="num px-3 py-1.5">{w.leafWetnessHrs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      label: "Disease history",
      content: cases.length ? (
        <ul className="border border-line">
          {cases.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2 last:border-b-0">
              <span className="text-[0.875rem]">
                <span className="num text-ink-2">{c.id}</span> · {c.suspected}
              </span>
              <span className="num text-[0.8125rem] text-ink-2">{c.detectedAt.slice(0, 10)}</span>
              <CaseStatusChip status={c.status} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-3 text-[0.875rem] text-ink-2">No cases have been recorded against this field.</p>
      ),
    },
    {
      label: "Recommendations",
      content: advisories.length ? (
        <div className="flex flex-col gap-3">
          {advisories.map((a) => (
            <Panel key={a.id} title={a.title} meta={a.acknowledged ? "Acknowledged" : "Awaiting acknowledgement"} bodyClassName="p-3">
              <ol className="flex flex-col gap-2 text-[0.875rem]">
                {[
                  ["1. Cultural", a.cultural],
                  ["2. Biological", a.biological],
                  ["3. Chemical — officer confirms product and dose", a.chemical],
                ].map(([h, items]) => (
                  <li key={h as string}>
                    <p className="font-semibold">{h as string}</p>
                    <ul className="list-disc pl-4">
                      {(items as string[]).map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </Panel>
          ))}
        </div>
      ) : (
        <p className="p-3 text-[0.875rem] text-ink-2">No advisory has been issued for this field.</p>
      ),
    },
    {
      label: "Follow-up timeline",
      content: (
        <div className="border border-line p-4">
          <TimelineRail nodes={timeline} />
          {followUps.length ? (
            <ul className="mt-4 border-t border-line pt-3 text-[0.875rem]">
              {followUps.map((f) => (
                <li key={f.id} className="flex justify-between gap-2 py-1">
                  <span>{f.action}</span>
                  <span className="num text-ink-2">
                    {f.dueOn} · {f.done ? "done" : "due"}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ),
    },
    {
      label: "Expert visits",
      content: visits.length ? (
        <ul className="border border-line">
          {visits.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2 last:border-b-0">
              <span className="text-[0.875rem]">
                {v.officerName} · <span className="num text-ink-2">{v.scheduledFor}</span>
              </span>
              <span className="text-[0.8125rem] text-ink-2">{v.finding ?? v.status}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-3 text-[0.875rem] text-ink-2">No field visit has been scheduled for this field.</p>
      ),
    },
    {
      label: "Images",
      content: (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SAMPLES.map((s) => (
            <figure key={s.id} className="border border-line">
              <LeafPlate sample={s} analysis={false} />
              <figcaption className="num border-t border-line px-2 py-1 text-[0.75rem] text-ink-2">
                {s.id} · {s.captured}
              </figcaption>
            </figure>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Breadcrumb" className="text-[0.8125rem] text-ink-2">
        <Link to="/app/fields" className="underline">
          Fields
        </Link>{" "}
        / <span className="num">{farm.id}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-3 border border-line bg-surface p-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-[1.5rem] leading-tight">{farm.name}</h1>
          <p className="text-[0.875rem] text-ink-2">
            {farm.village}, {districtName(farm.districtId)} · {cropName(farm.cropId)} ·{" "}
            <span className="num">{farm.areaHa.toFixed(1)} ha</span> · {STAGE_LABEL[farm.stage] ?? farm.stage}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <StatusChip status={HEALTH_MAP[farm.health]} />
            <span className="num text-[0.8125rem] text-ink-2">
              RH {today.rhPct}% · {today.rainfallMm} mm today
            </span>
            <Updated minutes={9} />
          </div>
        </div>
        <div className="flex items-start gap-3">
          <LocatorMap farm={farm} />
          <div className="flex flex-col gap-2">
            <Link
              to="/app/crop-health"
              className="min-h-[44px] border border-forest bg-forest px-3 text-[0.875rem] font-semibold leading-[44px] text-surface"
            >
              Run a health check
            </Link>
            <Button variant="secondary" onClick={exportFarmRecord}>
              Export record
            </Button>
          </div>
        </div>
      </header>

      <div data-demo="timeline"><Tabs tabs={tabs} /></div>
    </div>
  );
}

function SensorCard({
  sensorId,
  type,
  battery,
  status,
}: {
  sensorId: string;
  type: string;
  battery: number;
  status: string;
}) {
  const readingsQ = useAsync(() => getSensorReadings(sensorId), [sensorId]);
  const readings = readingsQ.data ?? [];
  const last = readings[readings.length - 1];
  return (
    <div className="border border-line bg-surface p-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[0.9375rem] font-semibold">{type.replace(/_/g, " ")}</p>
        <span className="num text-[0.75rem] text-ink-2">{sensorId}</span>
      </div>
      <p className="num text-[1.5rem] leading-tight">
        {last ? `${last.value} ${last.unit}` : "—"}
      </p>
      <Sparkline values={readings.map((r) => r.value)} label={`Readings for ${sensorId}`} tone="var(--water)" />
      <p className="num text-[0.75rem] text-ink-2">
        {status} · battery {battery}%
      </p>
    </div>
  );
}
