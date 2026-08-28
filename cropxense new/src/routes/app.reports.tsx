import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { Panel, Updated, CaseStatusChip } from "@/components/app/bits";
import { RankBar } from "@/components/app/Sparkline";
import { useAsync } from "@/hooks/useAsync";
import {
  CROPS,
  DISTRICTS,
  STATUS_LABEL,
  cropName,
  districtName,
  getAssessments,
  getFieldVisits,
  getOutbreaks,
  threatName,
} from "@/services";
import type { CropHealthAssessment } from "@/types";

export const Route = createFileRoute("/app/reports")({
  head: () => ({
    meta: [
      { title: "Reports — CropXense surveillance summaries" },
      {
        name: "description",
        content:
          "District, crop and threat summaries of the surveillance record, with validation outcomes and field visit completion, ready for departmental reporting.",
      },
      { property: "og:title", content: "Reports — CropXense" },
      {
        property: "og:description",
        content: "Departmental summaries of detections, validations and field visits by district and crop.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportsPage,
});

type DistrictRow = {
  district: string;
  cases: number;
  confirmed: number;
  pending: number;
  rejected: number;
  area: number;
  share: number;
};

type ThreatRow = {
  threat: string;
  crop: string;
  cases: number;
  avgConfidence: number;
  severe: number;
};

function ReportsPage() {
  const { toast } = useToast();
  const [districtId, setDistrictId] = useState("");
  const [cropId, setCropId] = useState("");

  const casesQ = useAsync(() => getAssessments(), []);
  const visitsQ = useAsync(() => getFieldVisits(), []);
  const outbreaksQ = useAsync(() => getOutbreaks(), []);

  const cases: CropHealthAssessment[] = useMemo(
    () =>
      (casesQ.data ?? []).filter(
        (c) => (!districtId || c.districtId === districtId) && (!cropId || c.cropId === cropId),
      ),
    [casesQ.data, districtId, cropId],
  );

  const visits = visitsQ.data ?? [];
  const completed = visits.filter((v) => v.status === "completed").length;
  const confirmed = cases.filter((c) =>
    ["expert_confirmed", "field_confirmed", "resolved"].includes(c.status),
  ).length;
  const rejected = cases.filter((c) => c.status === "rejected").length;
  const reviewed = confirmed + rejected;
  const agreement = reviewed ? Math.round((confirmed / reviewed) * 100) : 0;
  const affectedArea = Math.round(cases.reduce((n, c) => n + c.affectedAreaHa, 0));

  const districtRows: DistrictRow[] = useMemo(() => {
    const rows = DISTRICTS.map((d) => {
      const list = cases.filter((c) => c.districtId === d.id);
      return {
        district: d.name,
        cases: list.length,
        confirmed: list.filter((c) =>
          ["expert_confirmed", "field_confirmed", "resolved"].includes(c.status),
        ).length,
        pending: list.filter((c) => ["detected", "awaiting_validation"].includes(c.status)).length,
        rejected: list.filter((c) => c.status === "rejected").length,
        area: Math.round(list.reduce((n, c) => n + c.affectedAreaHa, 0)),
        share: 0,
      };
    }).filter((r) => r.cases > 0);
    const max = Math.max(1, ...rows.map((r) => r.cases));
    return rows
      .map((r) => ({ ...r, share: Math.round((r.cases / max) * 100) }))
      .sort((a, b) => b.cases - a.cases);
  }, [cases]);

  const threatRows: ThreatRow[] = useMemo(() => {
    const byThreat = new Map<string, CropHealthAssessment[]>();
    cases.forEach((c) => {
      const key = `${c.threatId}|${c.cropId}`;
      byThreat.set(key, [...(byThreat.get(key) ?? []), c]);
    });
    return [...byThreat.entries()]
      .map(([key, list]) => {
        const [threatId, crop] = key.split("|");
        return {
          threat: threatName(threatId ?? ""),
          crop: cropName(crop ?? ""),
          cases: list.length,
          avgConfidence: Math.round(list.reduce((n, c) => n + c.confidence, 0) / list.length),
          severe: list.filter((c) => c.severity >= 3).length,
        };
      })
      .sort((a, b) => b.cases - a.cases);
  }, [cases]);

  const statusRows = useMemo(
    () =>
      (Object.keys(STATUS_LABEL) as CropHealthAssessment["status"][]).map((s) => ({
        status: s,
        label: STATUS_LABEL[s],
        count: cases.filter((c) => c.status === s).length,
      })),
    [cases],
  );

  const districtColumns: Column<DistrictRow>[] = [
    { key: "district", header: "District", sortable: true },
    { key: "cases", header: "Cases", numeric: true, sortable: true, render: (r) => <span className="num">{r.cases}</span> },
    { key: "confirmed", header: "Confirmed", numeric: true, sortable: true, render: (r) => <span className="num">{r.confirmed}</span> },
    { key: "pending", header: "Pending review", numeric: true, sortable: true, render: (r) => <span className="num">{r.pending}</span> },
    { key: "rejected", header: "Rejected", numeric: true, sortable: true, render: (r) => <span className="num">{r.rejected}</span> },
    { key: "area", header: "Area (ha)", numeric: true, sortable: true, render: (r) => <span className="num">{r.area}</span> },
    {
      key: "share",
      header: "Relative load",
      width: "140px",
      render: (r) => <RankBar value={r.share} max={100} tone="var(--water)" />,
    },
  ];

  const threatColumns: Column<ThreatRow>[] = [
    { key: "threat", header: "Threat", sortable: true },
    { key: "crop", header: "Crop", sortable: true },
    { key: "cases", header: "Cases", numeric: true, sortable: true, render: (r) => <span className="num">{r.cases}</span> },
    {
      key: "avgConfidence",
      header: "Mean confidence",
      numeric: true,
      sortable: true,
      render: (r) => <span className="num">{r.avgConfidence}%</span>,
    },
    {
      key: "severe",
      header: "Severity 3+",
      numeric: true,
      sortable: true,
      render: (r) => <span className="num">{r.severe}</span>,
    },
  ];

  const loading = casesQ.loading || visitsQ.loading || outbreaksQ.loading;

  function exportCsv() {
    const header = ["District", "Cases", "Confirmed", "Pending review", "Rejected", "Area (ha)"];
    const body = districtRows.map((r) => [r.district, r.cases, r.confirmed, r.pending, r.rejected, r.area]);
    const csv = [header, ...body]
      .map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `cropxense-district-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("District summary downloaded as CSV");
  }

  return (
    <div className="flex flex-col gap-3" data-demo="reports">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.5rem]">Reports</h1>
          <p className="text-[0.875rem] text-ink-2">
            Summaries of the surveillance record for departmental reporting. Every figure is drawn from
            the case register, not from projections.
          </p>
        </div>
        <Updated minutes={20} />
      </header>

      <div className="flex flex-wrap items-end gap-2 print:hidden">
        <div className="w-56">
          <Select
            label="District"
            value={districtId}
            onChange={(e) => setDistrictId(e.currentTarget.value)}
            options={[{ value: "", label: "All districts" }, ...DISTRICTS.map((d) => ({ value: d.id, label: d.name }))]}
          />
        </div>
        <div className="w-56">
          <Select
            label="Crop"
            value={cropId}
            onChange={(e) => setCropId(e.currentTarget.value)}
            options={[{ value: "", label: "All crops" }, ...CROPS.map((c) => ({ value: c.id, label: c.name }))]}
          />
        </div>
        <Button variant="secondary" onClick={exportCsv}>
          Export CSV
        </Button>
        <Button variant="secondary" onClick={() => window.print()}>
          Print / save as PDF
        </Button>
        <Button
          onClick={() => {
            const subject = encodeURIComponent(`CropXense District Report — ${new Date().toISOString().slice(0, 10)}`);
            const body = encodeURIComponent(
              `District Report Summary\n` +
              `Date: ${new Date().toLocaleDateString("en-IN")}\n` +
              `Cases recorded: ${cases.length}\n` +
              `Expert agreement: ${agreement}%\n` +
              `Area under watch: ${affectedArea} ha\n` +
              `Field visits completed: ${completed}/${visits.length}\n\n` +
              `Please find the full district summary attached (use Export CSV to generate the attachment).`,
            );
            window.open(`mailto:?subject=${subject}&body=${body}`);
            toast("Email draft opened — attach the CSV and send to your district office");
          }}
        >
          Send to district office
        </Button>
      </div>


      <div className="grid grid-cols-2 border border-line bg-surface md:grid-cols-5">
        {[
          { label: "Cases recorded", value: cases.length, note: "in current selection" },
          { label: "Expert agreement", value: `${agreement}%`, note: `${reviewed} cases reviewed` },
          { label: "Area under watch", value: `${affectedArea} ha`, note: "sum of case areas" },
          { label: "Field visits completed", value: `${completed}/${visits.length}`, note: "assigned this season" },
          { label: "Active outbreaks", value: (outbreaksQ.data ?? []).filter((o) => o.risk === "high").length, note: "high risk clusters" },
        ].map((m) => (
          <div key={m.label} className="border-b border-r border-line p-3 last:border-r-0">
            <p className="text-caption">{m.label}</p>
            <p className="num text-[1.5rem] leading-tight">{m.value}</p>
            <p className="text-[0.75rem] text-ink-2">{m.note}</p>
          </div>
        ))}
      </div>

      <Panel title="District summary" meta={`${districtRows.length} districts reporting`} bodyClassName="p-3">
        {loading ? (
          <Skeleton className="h-56 w-full" />
        ) : (
          <DataTable
            columns={districtColumns}
            rows={districtRows}
            rowKey={(r) => r.district}
            caption="Cases by district"
          />
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Threat summary" meta={`${threatRows.length} threat–crop pairs`} bodyClassName="p-3">
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <DataTable
              columns={threatColumns}
              rows={threatRows}
              rowKey={(r) => `${r.threat}-${r.crop}`}
              caption="Cases by threat and crop"
            />
          )}
        </Panel>

        <Panel title="Validation outcomes" meta="case register" bodyClassName="p-3">
          <ul className="flex flex-col gap-2">
            {statusRows.map((r) => (
              <li key={r.status} className="flex items-center justify-between gap-3 border-b border-line pb-2 last:border-b-0">
                <CaseStatusChip status={r.status} />
                <span className="num text-[0.9375rem]">{r.count}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[0.75rem] text-ink-2">
            Detections are never reported as confirmed disease until an expert or a field visit records a
            verdict.
          </p>
        </Panel>
      </div>
    </div>
  );
}
