import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Input, Select } from "@/components/ui/Field";
import { Drawer } from "@/components/ui/Overlay";
import { Skeleton } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/Status";
import { useToast } from "@/components/ui/Toast";
import { Sparkline } from "@/components/app/Sparkline";
import { CaseStatusChip, ConfidenceCell, Panel, Updated, relTime } from "@/components/app/bits";
import { useAsync } from "@/hooks/useAsync";
import {
  CROPS,
  DISTRICTS,
  STAGE_LABEL,
  TODAY,
  assignFieldVisit,
  cropName,
  districtName,
  getAdvisories,
  getAssessments,
  getFarms,
  getSensors,
  getTrapReadings,
  getTraps,
  isoDay,
  latestWeather,
  subscribe,
} from "@/services";
import type { Farm } from "@/types";

export const Route = createFileRoute("/app/fields")({
  head: () => ({
    meta: [
      { title: "Fields — CropXense farm register" },
      {
        name: "description",
        content: "Searchable register of monitored fields across India with crop, stage, area and current health.",
      },
      { property: "og:title", content: "Fields — CropXense" },
      { property: "og:description", content: "Farm register with crop, stage, area, health and case history." },
    ],
  }),
  component: FieldsPage,
});

const HEALTH_STATUS = { healthy: "healthy", at_risk: "watch", affected: "critical" } as const;
const HEALTH_LABEL = { healthy: "Healthy", at_risk: "At risk", affected: "Affected" } as const;

type Row = {
  id: string;
  name: string;
  owner: string;
  village: string;
  district: string;
  crop: string;
  stage: string;
  area: number;
  health: Farm["health"];
  sown: string;
  raw: Farm;
};

function FieldsPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [cropId, setCropId] = useState("");
  const [health, setHealth] = useState("");
  const [open, setOpen] = useState<Farm | null>(null);
  const [visitBusy, setVisitBusy] = useState(false);

  function exportFarmCsv(farm: Farm) {
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

  async function requestFieldVisit(farm: Farm) {
    if (visitBusy) return;
    setVisitBusy(true);
    try {
      const cases = await getAssessments({ farmId: farm.id });
      const openCase = cases.find((c) => !["resolved", "rejected"].includes(c.status));
      if (openCase) {
        await assignFieldVisit(openCase.id, isoDay(1));
        toast(`Field visit scheduled for ${farm.name} tomorrow`, "healthy");
      } else {
        toast(`No open case found for ${farm.name} — visit request noted`);
      }
    } catch {
      toast("Could not schedule visit — please try again");
    } finally {
      setVisitBusy(false);
    }
  }

  const farmsQ = useAsync(
    () =>
      getFarms({
        ...(districtId ? { districtId } : {}),
        ...(cropId ? { cropId } : {}),
        ...(health ? { health: health as Farm["health"] } : {}),
        ...(query ? { query } : {}),
      }),
    [districtId, cropId, health, query],
  );

  useEffect(() => {
<<<<<<< HEAD
    const unsub = subscribe(() => {
      farmsQ.reload?.();
    });
    return unsub;
=======
    return subscribe(() => {
      farmsQ.reload();
    });
>>>>>>> origin/anirudh
  }, [farmsQ.reload]);

  const casesQ = useAsync(() => (open ? getAssessments({ farmId: open.id }) : Promise.resolve([])), [open?.id]);
  const sensorsQ = useAsync(() => getSensors(open?.districtId), [open?.districtId]);
  const trapsQ = useAsync(() => getTraps(open?.districtId), [open?.districtId]);
  const trapReadingsQ = useAsync(() => getTrapReadings(), []);
  const advisoriesQ = useAsync(() => (open ? getAdvisories(open.id) : Promise.resolve([])), [open?.id]);

  const rows: Row[] = useMemo(
    () =>
      (farmsQ.data ?? []).map((f) => ({
        id: f.id,
        name: f.name,
        owner: f.ownerName,
        village: f.village,
        district: districtName(f.districtId),
        crop: cropName(f.cropId),
        stage: STAGE_LABEL[f.stage] ?? f.stage,
        area: f.areaHa,
        health: f.health,
        sown: f.sowingDate,
        raw: f,
      })),
    [farmsQ.data],
  );

  const columns: Column<Row>[] = [
    { key: "id", header: "Field ID", width: "110px", render: (r) => <span className="num text-[0.8125rem]">{r.id}</span> },
    { key: "name", header: "Field", sortable: true },
    { key: "owner", header: "Cultivator", sortable: true },
    { key: "village", header: "Village", sortable: true },
    { key: "district", header: "District", sortable: true },
    { key: "crop", header: "Crop", sortable: true },
    { key: "stage", header: "Stage" },
    {
      key: "area",
      header: "Area (ha)",
      numeric: true,
      sortable: true,
      render: (r) => <span className="num">{r.area.toFixed(1)}</span>,
    },
    {
      key: "health",
      header: "Health",
      render: (r) => <StatusChip status={HEALTH_STATUS[r.health]} />,
    },
    { key: "sown", header: "Sown", render: (r) => <span className="num text-[0.8125rem]">{r.sown}</span> },
    {
      key: "raw",
      header: "Action",
      render: (r) => (
        <span className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setOpen(r.raw)}>
            Quick view
          </Button>
          <Link
            to="/app/farms/$id"
            params={{ id: r.raw.id }}
            className="inline-flex min-h-[36px] items-center border border-ink/70 px-3 text-[0.875rem] font-semibold hover:bg-surface-2"
          >
            Full record
          </Link>
        </span>
      ),
    },
  ];

  const farmSensors = open ? (sensorsQ.data ?? []).filter((s) => s.farmId === open.id) : [];
  const farmTraps = open ? (trapsQ.data ?? []).filter((t) => t.farmId === open.id) : [];
  const weather = open ? latestWeather(open.districtId) : null;

  return (
    <div className="flex flex-col gap-3">
      <h1 className="sr-only">Field register</h1>

      <div className="grid gap-2 border border-line bg-surface p-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Search field, cultivator or village"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Wadgaon or Pawar"
        />
        <Select
          label="District"
          value={districtId}
          onChange={(e) => setDistrictId(e.target.value)}
          options={[{ value: "", label: "All districts" }, ...DISTRICTS.map((d) => ({ value: d.id, label: d.name }))]}
        />
        <Select
          label="Crop"
          value={cropId}
          onChange={(e) => setCropId(e.target.value)}
          options={[{ value: "", label: "All crops" }, ...CROPS.map((c) => ({ value: c.id, label: c.name }))]}
        />
        <Select
          label="Health"
          value={health}
          onChange={(e) => setHealth(e.target.value)}
          options={[
            { value: "", label: "Any health state" },
            { value: "healthy", label: "Healthy" },
            { value: "at_risk", label: "At risk" },
            { value: "affected", label: "Affected" },
          ]}
        />
      </div>

      <Panel title="Monitored fields" meta={<Updated minutes={22} />}>
        {farmsQ.loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="p-6 text-center text-ink-2">No fields match these filters.</p>
        ) : (
          <div data-demo="register"><DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            caption="Registered fields with crop, stage, area and current health state"
          /></div>
        )}
      </Panel>
      <p className="num text-[0.75rem] text-ink-2">{rows.length} of 120 registered fields shown</p>

      <Drawer open={Boolean(open)} onClose={() => setOpen(null)} title={open ? open.name : ""}>
        {open ? (
          <div className="space-y-4 text-[0.875rem]">
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 border border-line p-2">
              {[
                ["Field ID", open.id],
                ["Cultivator", open.ownerName],
                ["Village", `${open.village}, ${districtName(open.districtId)}`],
                ["Crop", `${cropName(open.cropId)} — ${STAGE_LABEL[open.stage] ?? open.stage}`],
                ["Area", `${open.areaHa.toFixed(1)} ha`],
                ["Sown on", open.sowingDate],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-caption">{k}</dt>
                  <dd className="num">{v}</dd>
                </div>
              ))}
            </dl>

            <div>
              <p className="text-caption mb-1">Current state</p>
              <span className="flex items-center gap-2"><StatusChip status={HEALTH_STATUS[open.health]} /><span className="text-ink-2">{HEALTH_LABEL[open.health]}</span></span>
            </div>

            {weather ? (
              <div className="border border-line p-2">
                <p className="text-caption mb-1">District weather today</p>
                <p className="num">
                  {weather.tMaxC}°/{weather.tMinC}°C · RH {weather.rhPct}% · {weather.rainfallMm} mm ·{" "}
                  {weather.leafWetnessHrs} h leaf wetness
                </p>
              </div>
            ) : null}

            <div>
              <p className="text-caption mb-1">Case history</p>
              <ul className="border border-line">
                {(casesQ.data ?? []).map((c) => (
                  <li key={c.id} className="space-y-1 border-b border-line px-2 py-2 last:border-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="num text-[0.75rem] text-ink-2">{c.id}</span>
                      <span className="num text-[0.75rem] text-ink-2">{relTime(c.detectedAt, TODAY)} ago</span>
                    </div>
                    <p>{c.suspected}</p>
                    <div className="flex items-center gap-2">
                      <ConfidenceCell value={c.confidence} />
                      <CaseStatusChip status={c.status} />
                    </div>
                  </li>
                ))}
                {(casesQ.data ?? []).length === 0 ? (
                  <li className="px-2 py-2 text-ink-2">No assessments recorded for this field.</li>
                ) : null}
              </ul>
            </div>

            <div>
              <p className="text-caption mb-1">Instruments on this field</p>
              <ul className="border border-line">
                {farmSensors.map((s) => (
                  <li key={s.id} className="flex justify-between border-b border-line px-2 py-1.5 last:border-0">
                    <span>{s.type.replace(/_/g, " ")}</span>
                    <span className="num text-[0.8125rem] text-ink-2">
                      {s.status} · {s.battery}%
                    </span>
                  </li>
                ))}
                {farmTraps.map((t) => {
                  const series = (trapReadingsQ.data ?? []).filter((r) => r.trapId === t.id).map((r) => r.count);
                  return (
                    <li key={t.id} className="flex items-center justify-between gap-2 border-b border-line px-2 py-1.5 last:border-0">
                      <span>{t.type} trap</span>
                      {series.length > 0 ? <Sparkline values={series} label={`Trap counts for ${t.id}`} /> : null}
                    </li>
                  );
                })}
                {farmSensors.length + farmTraps.length === 0 ? (
                  <li className="px-2 py-2 text-ink-2">No instruments installed here yet.</li>
                ) : null}
              </ul>
            </div>

            <div>
              <p className="text-caption mb-1">Advisories issued</p>
              <ul className="space-y-1">
                {(advisoriesQ.data ?? []).map((a) => (
                  <li key={a.id} className="border border-line px-2 py-1.5">
                    {a.title} <span className="num text-[0.75rem] text-ink-2">· {a.window}</span>
                  </li>
                ))}
                {(advisoriesQ.data ?? []).length === 0 ? (
                  <li className="text-ink-2">None issued for this field.</li>
                ) : null}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => requestFieldVisit(open)} disabled={visitBusy}>
                {visitBusy ? "Scheduling…" : "Request field visit"}
              </Button>
              <Button variant="secondary" onClick={() => exportFarmCsv(open)}>
                Export record
              </Button>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
