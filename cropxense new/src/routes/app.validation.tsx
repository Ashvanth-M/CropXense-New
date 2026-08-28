import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { ConfidenceBar, SeverityMeter } from "@/components/ui/Status";
import { useToast } from "@/components/ui/Toast";
import { CaseStatusChip, ChannelTag, ConfidenceCell, Panel, Updated, relTime } from "@/components/app/bits";
import { LeafPlate, SAMPLES, ViewToggle } from "@/components/app/LeafPlate";
import { RealCVCanvas, type CVLayer } from "@/components/app/RealCVCanvas";
import { VoiceAssistant } from "@/components/app/VoiceAssistant";
import { useAsync } from "@/hooks/useAsync";
import {
  CROPS,
  DISEASES,
  DISTRICTS,
  PESTS,
  STATUS_LABEL,
  TODAY,
  advanceCase,
  assignFieldVisit,
  cropName,
  districtName,
  farmById,
  getAssessments,
  getOutbreaks,
  getReviews,
  isoDay,
  latestWeather,
  validateCase,
} from "@/services";
import type { CropHealthAssessment } from "@/types";

export const Route = createFileRoute("/app/validation")({
  head: () => ({
    meta: [
      { title: "Expert validation — CropXense review console" },
      {
        name: "description",
        content:
          "Two-pane review console where plant pathologists confirm, correct or return crop health cases, with evidence, sensor readings and nearby cases on one screen.",
      },
      { property: "og:title", content: "Expert validation — CropXense" },
      {
        property: "og:description",
        content: "Review queue and case console: confirm, correct, request lab confirmation or assign a field visit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ValidationPage,
});

const THREATS = [
  ...DISEASES.map((d) => ({ id: d.id, name: d.name })),
  ...PESTS.map((p) => ({ id: p.id, name: p.name })),
];

type Row = {
  id: string;
  field: string;
  district: string;
  crop: string;
  suspected: string;
  confidence: number;
  age: string;
  status: string;
  raw: CropHealthAssessment;
};

function ValidationPage() {
  const { toast } = useToast();
  const [districtId, setDistrictId] = useState("");
  const [cropId, setCropId] = useState("");
  const [maxConfidence, setMaxConfidence] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [corrected, setCorrected] = useState("");
  const [threatQuery, setThreatQuery] = useState("");
  const [analysis, setAnalysis] = useState(true);
  const [busy, setBusy] = useState(false);

  const casesQ = useAsync(
    () =>
      getAssessments({
        ...(districtId ? { districtId } : {}),
        ...(cropId ? { cropId } : {}),
      }),
    [districtId, cropId],
  );
  const reviewsQ = useAsync(() => (selectedId ? getReviews(selectedId) : Promise.resolve([])), [selectedId]);
  const outbreaksQ = useAsync(() => getOutbreaks(), []);

  const cases = casesQ.data ?? [];
  const selected = cases.find((c) => c.id === selectedId) ?? null;

  const rows: Row[] = useMemo(
    () =>
      cases
        .filter((c) => !maxConfidence || c.confidence <= Number(maxConfidence))
        .map((c) => ({
          id: c.id,
          field: farmById(c.farmId)?.name ?? c.farmId,
          district: districtName(c.districtId),
          crop: cropName(c.cropId),
          suspected: c.suspected,
          confidence: c.confidence,
          age: `${relTime(c.detectedAt, TODAY)} ago`,
          status: c.status,
          raw: c,
        })),
    [cases, maxConfidence],
  );

  const columns: Column<Row>[] = [
    { key: "id", header: "Case", width: "128px", render: (r) => <span className="num text-[0.8125rem]">{r.id}</span> },
    { key: "field", header: "Field", sortable: true },
    { key: "crop", header: "Crop", sortable: true },
    { key: "suspected", header: "Suspected", sortable: true },
    { key: "confidence", header: "Conf.", numeric: true, sortable: true, render: (r) => <ConfidenceCell value={r.confidence} /> },
    { key: "age", header: "Age", render: (r) => <span className="num text-[0.8125rem]">{r.age}</span> },
    { key: "status", header: "State", render: (r) => <CaseStatusChip status={r.raw.status} /> },
    {
      key: "raw",
      header: "",
      width: "92px",
      render: (r) => (
        <Button
          size="sm"
          variant={selectedId === r.id ? "primary" : "secondary"}
          onClick={() => {
            setSelectedId(r.id);
            setComment("");
            setCorrected("");
            setThreatQuery("");
          }}
        >
          Review
        </Button>
      ),
    },
  ];

  const sample = selected ? SAMPLES[selected.id.length % SAMPLES.length]! : SAMPLES[0]!;
  const weather = selected ? latestWeather(selected.districtId) : null;
  const nearby = (outbreaksQ.data ?? []).filter((o) => o.districtId === selected?.districtId);
  const correctedReview = (reviewsQ.data ?? []).find((r) => r.verdict === "corrected");

  const filteredThreats = THREATS.filter((t) =>
    t.name.toLowerCase().includes(threatQuery.trim().toLowerCase()),
  ).slice(0, 8);

  async function act(fn: () => Promise<unknown>, message: string) {
    setBusy(true);
    await fn();
    setBusy(false);
    setComment("");
    toast(message);
  }

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.5rem]">Expert validation</h1>
          <p className="max-w-2xl text-[0.875rem] text-ink-2">
            Every case here is a model assessment waiting on a human verdict. Actions are recorded against the
            case with a timestamp and the reviewer's name.
          </p>
        </div>
        <Updated minutes={4} />
      </header>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div data-demo="queue" className="flex min-w-0 flex-col">
        <Panel className="flex-1" title="Review queue" meta={`${rows.length} cases`} bodyClassName="p-3 flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Select
              label="District"
              value={districtId}
              onChange={(e) => setDistrictId(e.currentTarget.value)}
              options={[{ value: "", label: "All districts" }, ...DISTRICTS.map((d) => ({ value: d.id, label: d.name }))]}
            />
            <Select
              label="Crop"
              value={cropId}
              onChange={(e) => setCropId(e.currentTarget.value)}
              options={[{ value: "", label: "All crops" }, ...CROPS.map((c) => ({ value: c.id, label: c.name }))]}
            />
            <Select
              label="Confidence"
              value={maxConfidence}
              onChange={(e) => setMaxConfidence(e.currentTarget.value)}
              options={[
                { value: "", label: "Any confidence" },
                { value: "70", label: "70% and below" },
                { value: "85", label: "85% and below" },
              ]}
            />
          </div>
          {casesQ.loading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} caption="Cases awaiting expert validation" />
          )}
        </Panel>
        </div>

        <Panel
          title={selected ? `${selected.id} — ${selected.suspected}` : "Case review"}
          meta={selected ? <CaseStatusChip status={selected.status} /> : "select a case"}
          bodyClassName="p-3"
        >
          {!selected ? (
            <p className="p-6 text-center text-[0.9375rem] text-ink-2">
              Select a case from the queue to open the full record.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {correctedReview ? (
                <p className="border border-amber px-2 py-1 text-[0.8125rem] text-amber">
                  Corrected by expert — added to training queue.
                </p>
              ) : null}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-[280px_minmax(0,1fr)]">
                <div className="flex flex-col gap-2">
                  <RealCVCanvas
                    imageSrc={`/samples/${selected.cropId || "cotton"}.jpg`}
                    activeLayer={analysis ? "bounding_boxes" : "none"}
                    onLayerChange={(l) => setAnalysis(l !== "none")}
                    cropType={selected.cropId}
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <ConfidenceBar value={selected.confidence} label="Model confidence" />
                  <div className="flex flex-wrap items-center gap-3 text-[0.875rem]">
                    <SeverityMeter level={selected.severity} />
                    <span>
                      <span className="text-caption">Area</span>{" "}
                      <span className="num">{selected.affectedAreaHa.toFixed(1)} ha</span>
                    </span>
                    <span>
                      <span className="text-caption">Detected</span>{" "}
                      <span className="num">{relTime(selected.detectedAt, TODAY)} ago</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selected.detectedVia.map((c) => (
                      <ChannelTag key={c} channel={c} />
                    ))}
                  </div>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 border border-line p-2 text-[0.875rem]">
                    <div>
                      <dt className="text-caption">Field</dt>
                      <dd>
                        <Link to="/app/farms/$id" params={{ id: selected.farmId }} className="underline">
                          {farmById(selected.farmId)?.name ?? selected.farmId}
                        </Link>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-caption">District</dt>
                      <dd>{districtName(selected.districtId)}</dd>
                    </div>
                    <div>
                      <dt className="text-caption">Crop</dt>
                      <dd>{cropName(selected.cropId)}</dd>
                    </div>
                    <div>
                      <dt className="text-caption">Weather window</dt>
                      <dd className="num">
                        {weather ? `RH ${weather.rhPct}% · ${weather.rainfallMm} mm · LW ${weather.leafWetnessHrs} h` : "—"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <section className="border border-line">
                <header className="border-b border-line px-3 py-2">
                  <h3 className="text-caption">Evidence at capture</h3>
                </header>
                <ul>
                  {selected.evidence.map((e) => (
                    <li key={e.channel + e.label} className="border-b border-line px-3 py-2 text-[0.875rem] last:border-b-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{e.label}</span>
                        <span className="text-[0.75rem] text-ink-2">{e.supports ? "supports" : "counts against"}</span>
                      </div>
                      <p className="text-[0.8125rem] text-ink-2">{e.detail}</p>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="border border-line p-3">
                  <h3 className="text-caption">Nearby confirmed clusters</h3>
                  {nearby.length ? (
                    <ul className="mt-1 flex flex-col gap-1 text-[0.875rem]">
                      {nearby.map((o) => (
                        <li key={o.id} className="flex justify-between gap-2">
                          <span>{o.threatName}</span>
                          <span className="num text-ink-2">{o.affectedFields} fields</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-[0.875rem] text-ink-2">No active cluster in this district.</p>
                  )}
                </div>
                <div className="border border-line p-3">
                  <h3 className="text-caption">Review trail</h3>
                  {reviewsQ.data?.length ? (
                    <ul className="mt-1 flex flex-col gap-1 text-[0.8125rem]">
                      {reviewsQ.data.map((r) => (
                        <li key={r.id}>
                          <span className="num text-ink-2">{r.reviewedAt.replace("T", " ").slice(0, 16)}</span>{" "}
                          {r.reviewerName}: {r.comment}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-[0.875rem] text-ink-2">No expert has looked at this case yet.</p>
                  )}
                </div>
              </section>

              <Alert tone="info" title="Correction requires a note">
                A corrected diagnosis is added to the training queue, so the note explaining the correction is
                mandatory.
              </Alert>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <Input
                    label="Correct diagnosis — search"
                    value={threatQuery}
                    placeholder="Type a disease or pest name"
                    onChange={(e) => setThreatQuery(e.currentTarget.value)}
                  />
                  {threatQuery ? (
                    <ul className="mt-1 max-h-40 overflow-y-auto border border-line">
                      {filteredThreats.map((t) => (
                        <li key={t.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setCorrected(t.id);
                              setThreatQuery(t.name);
                            }}
                            className="min-h-[36px] w-full px-2 text-left text-[0.875rem] hover:bg-surface-2"
                          >
                            {t.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {corrected ? (
                    <p className="num mt-1 text-[0.75rem] text-ink-2">Correction selected: {corrected}</p>
                  ) : null}
                </div>
                <Textarea
                  label="Reviewer note"
                  rows={4}
                  value={comment}
                  placeholder="What did you see in the image and the supporting readings"
                  onChange={(e) => setComment(e.currentTarget.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                <Button
                  loading={busy}
                  onClick={() =>
                    act(
                      () => validateCase(selected.id, "confirmed", comment || "Confirmed against submitted evidence"),
                      "Diagnosis confirmed",
                    )
                  }
                >
                  Confirm diagnosis
                </Button>
                <Button
                  variant="secondary"
                  loading={busy}
                  disabled={!corrected || !comment.trim()}
                  onClick={() =>
                    act(
                      () => validateCase(selected.id, "corrected", comment, corrected),
                      "Diagnosis corrected — case added to the training queue",
                    )
                  }
                >
                  Correct diagnosis
                </Button>
                <Button
                  variant="secondary"
                  loading={busy}
                  onClick={() =>
                    act(
                      () =>
                        advanceCase(
                          selected.id,
                          "awaiting_validation",
                          comment || "Lab confirmation requested from the district plant clinic",
                        ),
                      "Lab confirmation requested",
                    )
                  }
                >
                  Request lab confirmation
                </Button>
                <Button
                  variant="secondary"
                  loading={busy}
                  onClick={() => act(() => assignFieldVisit(selected.id, isoDay(1)), "Field visit assigned for tomorrow")}
                >
                  Assign field visit
                </Button>
                <Button
                  variant="ghost"
                  loading={busy}
                  onClick={() =>
                    act(
                      () =>
                        advanceCase(
                          selected.id,
                          "detected",
                          comment || "Returned to the farmer with questions about the affected rows",
                        ),
                      "Returned to farmer with questions",
                    )
                  }
                >
                  Return to farmer with questions
                </Button>
              </div>

              <p className="text-[0.75rem] text-ink-2">
                Case lifecycle: detected → awaiting validation → expert confirmed → field confirmed → resolved.
                Statuses recorded here: {Object.values(STATUS_LABEL).join(" · ")}.
              </p>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
