import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Select, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { ConfidenceBar, SeverityMeter } from "@/components/ui/Status";
import { useToast } from "@/components/ui/Toast";
import { Panel } from "@/components/app/bits";
import { HeatLegend, LeafPlate, SAMPLES, SampleThumb, ViewToggle, type Sample } from "@/components/app/LeafPlate";
import { RealCVCanvas, type CVLayer } from "@/components/app/RealCVCanvas";
import { VoiceAssistant } from "@/components/app/VoiceAssistant";
import {
  CROPS,
  DISEASES,
  PESTS,
  STAGE_LABEL,
  assignFieldVisit,
  getFarms,
  isoDay,
  issueAdvisory,
  latestWeather,
  submitAssessment,
} from "@/services";
import { useAsync } from "@/hooks/useAsync";
import { cx } from "@/lib/cx";
import type { CropHealthAssessment } from "@/types";

export const Route = createFileRoute("/app/crop-health")({
  head: () => ({
    meta: [
      { title: "Crop health check — CropXense guided assessment" },
      {
        name: "description",
        content:
          "Five-step crop health check: submit a leaf image, name the crop and growth stage, add symptoms, and read an assessment with confidence, evidence and IPM-first action.",
      },
      { property: "og:title", content: "Crop health check — CropXense" },
      {
        property: "og:description",
        content: "Guided assessment with confidence, differentials, evidence weights and IPM-first recommended action.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CropHealthPage,
});

const STEPS = [
  { n: 1, label: "Image", hint: "Photograph of the affected leaf" },
  { n: 2, label: "Crop", hint: "What is growing in this field" },
  { n: 3, label: "Growth stage", hint: "Stage at the time of capture" },
  { n: 4, label: "Symptoms", hint: "Optional observations and notes" },
  { n: 5, label: "Run analysis", hint: "Combine image, weather and history" },
];

const SYMPTOMS = [
  "Leaf spots",
  "Wilting",
  "Yellowing",
  "Holes in leaves",
  "Stunted growth",
  "Boll damage",
  "Leaf curling",
  "White powdery growth",
  "Sticky honeydew",
];

const STAGES = [
  "sowing",
  "vegetative",
  "tillering",
  "flowering",
  "boll_formation",
  "pod_fill",
  "fruiting",
  "bulbing",
  "grand_growth",
  "harvest",
];

const RUN_STEPS = [
  "Reading image",
  "Segmenting leaf area",
  "Matching lesion patterns",
  "Checking local outbreak history",
  "Combining weather and sensor risk",
];

const EVIDENCE_WEIGHTS = [
  { label: "Visible lesion pattern", weight: 38, detail: "Angular water-soaked margins on four regions" },
  { label: "Leaf discolouration", weight: 24, detail: "Chlorotic halo consistent with the reference set" },
  { label: "Recent humidity", weight: 22, detail: "RH above 80% for 3 of the last 5 nights" },
  { label: "Local outbreak history", weight: 16, detail: "4 confirmed cases within 12 km in the last 14 days" },
];

function ipmFor(threatId: string) {
  const d = DISEASES.find((x) => x.id === threatId);
  if (d) return { cultural: d.cultural, biological: d.biological, chemical: d.chemical, note: d.favourable };
  const p = PESTS.find((x) => x.id === threatId);
  if (p) return { cultural: p.cultural, biological: p.biological, chemical: p.chemical, note: `Threshold: ${p.etl}` };
  return { cultural: [], biological: [], chemical: [], note: "" };
}

type Phase = "form" | "running" | "result";

function CropHealthPage() {
  const { toast } = useToast();
  const farmsQ = useAsync(() => getFarms(), []);

  const [sample, setSample] = useState<Sample | null>(null);
  const [fileName, setFileName] = useState("");
  const [cropId, setCropId] = useState("");
  const [stage, setStage] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [farmId, setFarmId] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [runIndex, setRunIndex] = useState(0);
  const [analysis, setAnalysis] = useState(true);
  const [why, setWhy] = useState(false);
  const [saved, setSaved] = useState<CropHealthAssessment | null>(null);
  const [busy, setBusy] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const farms = farmsQ.data ?? [];
  useEffect(() => {
    if (!farmId && farms.length) setFarmId(farms[0]!.id);
  }, [farms, farmId]);

  const done = {
    1: Boolean(sample),
    2: Boolean(cropId),
    3: Boolean(stage),
    4: symptoms.length > 0 || notes.trim().length > 0,
    5: phase === "result",
  } as Record<number, boolean>;

  const ready = Boolean(sample && cropId && stage);
  const weather = latestWeather(farms.find((f) => f.id === farmId)?.districtId ?? "amravati");

  function run() {
    setPhase("running");
    setRunIndex(0);
    timers.current.forEach(clearTimeout);
    timers.current = RUN_STEPS.map((_, i) =>
      setTimeout(() => {
        setRunIndex(i + 1);
        if (i === RUN_STEPS.length - 1) setTimeout(() => setPhase("result"), 500);
      }, 700 * (i + 1)),
    );
  }

  function reset() {
    setPhase("form");
    setSample(null);
    setFileName("");
    setCropId("");
    setStage("");
    setSymptoms([]);
    setNotes("");
    setSaved(null);
    setWhy(false);
  }

  const ipm = sample ? ipmFor(sample.threatId) : null;

  const riskFactors = useMemo(
    () => [
      {
        label: "Humidity",
        state: weather.rhPct >= 80 ? "High" : "Moderate",
        value: `${weather.rhPct}%`,
        why: "Blight spreads fastest when leaves stay wet through the night.",
      },
      {
        label: "Rainfall",
        state: weather.rainfallMm >= 20 ? "Elevated" : "Normal",
        value: `${Math.round(weather.rainfallMm * 1.6)} mm/48h`,
        why: "Splash from rain carries bacteria between neighbouring plants.",
      },
      {
        label: "Crop stage",
        state: "Susceptible",
        value: STAGE_LABEL[stage] ?? "Flowering",
        why: "Losses at this stage translate directly into yield.",
      },
      {
        label: "Nearby confirmed cases",
        state: "Within 12 km",
        value: "4",
        why: "Confirmed cases nearby raise the chance this is the same problem.",
      },
    ],
    [weather, stage],
  );

  async function saveRecord() {
    if (!sample) return;
    setBusy(true);
    const created = await submitAssessment({
      farmId,
      cropId: cropId || sample.cropId,
      threatId: sample.threatId,
      confidence: sample.confidence,
      severity: sample.severity,
      ...(notes ? { notes } : {}),
    });
    setSaved(created);
    setBusy(false);
    toast(`Saved to the farm record as ${created.id}`);
    return created;
  }

  return (
    <div className="flex flex-col gap-3" data-demo="wizard">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.5rem]">Crop health check</h1>
          <p className="max-w-2xl text-[0.875rem] text-ink-2">
            A guided check on one field. The result is an assessment with its confidence and evidence, not a
            confirmed diagnosis — an expert or a field visit closes that gap.
          </p>
        </div>
        <Link
          to="/app/validation"
          className="min-h-[44px] self-end border border-ink/70 px-3 text-[0.875rem] font-semibold leading-[44px] text-ink hover:bg-surface-2"
        >
          Open validation console
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
        <ol className="flex flex-row gap-2 overflow-x-auto border border-line bg-surface p-3 lg:sticky lg:top-[112px] lg:h-fit lg:flex-col">
          {STEPS.map((s) => {
            const complete = done[s.n];
            return (
              <li key={s.n} className="flex min-w-[140px] gap-2 lg:min-w-0">
                <span
                  aria-hidden
                  className={cx(
                    "num mt-[2px] flex size-6 shrink-0 items-center justify-center border text-[0.75rem]",
                    complete ? "border-forest bg-forest text-surface" : "border-line text-ink-2",
                  )}
                >
                  {s.n}
                </span>
                <span className="flex flex-col">
                  <span className="text-[0.875rem] font-semibold">{s.label}</span>
                  <span className="text-[0.75rem] leading-tight text-ink-2">{s.hint}</span>
                </span>
              </li>
            );
          })}
        </ol>

        <div className="flex flex-col gap-3">
          {phase === "form" ? (
            <>
              <Panel title="1 · Upload image" bodyClassName="p-3 flex flex-col gap-3">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f) {
                      setFileName(f.name);
                      setSample(SAMPLES[0]!);
                    }
                  }}
                  className="flex flex-col items-center gap-2 border border-dashed border-line bg-surface-2 px-4 py-6 text-center"
                >
                  <Upload className="size-5 text-ink-2" aria-hidden />
                  <p className="text-[0.875rem]">Drag a photograph here, or choose one</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <label className="inline-flex min-h-[44px] cursor-pointer items-center border border-ink/70 px-3 text-[0.875rem] font-semibold hover:bg-surface">
                      Choose file
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.currentTarget.files?.[0];
                          if (f) {
                            setFileName(f.name);
                            setSample(SAMPLES[0]!);
                          }
                        }}
                      />
                    </label>
                    <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 border border-ink/70 px-3 text-[0.875rem] font-semibold hover:bg-surface">
                      <Camera className="size-4" aria-hidden />
                      Use camera
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.currentTarget.files?.[0];
                          if (f) {
                            setFileName(f.name);
                            setSample(SAMPLES[0]!);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {fileName ? <p className="num text-[0.75rem] text-ink-2">{fileName} attached</p> : null}
                </div>

                <div>
                  <p className="text-caption mb-2">Or use a sample image</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {SAMPLES.map((s) => (
                      <SampleThumb
                        key={s.id}
                        sample={s}
                        selected={sample?.id === s.id}
                        onSelect={() => {
                          setSample(s);
                          setFileName(`${s.id}.jpg`);
                          if (!cropId) setCropId(s.cropId);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </Panel>

              <Panel title="2 · Crop and field" bodyClassName="p-3 grid gap-2 sm:grid-cols-2">
                <Select
                  label="Crop"
                  value={cropId}
                  onChange={(e) => setCropId(e.currentTarget.value)}
                  options={[{ value: "", label: "Select a crop" }, ...CROPS.map((c) => ({ value: c.id, label: c.name }))]}
                />
                <Select
                  label="Field"
                  value={farmId}
                  onChange={(e) => setFarmId(e.currentTarget.value)}
                  options={farms.slice(0, 40).map((f) => ({ value: f.id, label: `${f.name} — ${f.village}` }))}
                />
              </Panel>

              <Panel title="3 · Growth stage" bodyClassName="p-3">
                <div className="flex flex-wrap gap-2">
                  {STAGES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={stage === s}
                      onClick={() => setStage(s)}
                      className={cx(
                        "min-h-[44px] border px-3 text-[0.875rem] font-semibold transition-colors",
                        stage === s ? "border-forest bg-forest text-surface" : "border-line text-ink hover:bg-surface-2",
                      )}
                    >
                      {STAGE_LABEL[s]}
                    </button>
                  ))}
                </div>
              </Panel>

              <Panel title="4 · Symptoms observed (optional)" bodyClassName="p-3 flex flex-col gap-3">
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
                  {SYMPTOMS.map((s) => (
                    <Checkbox
                      key={s}
                      label={s}
                      checked={symptoms.includes(s)}
                      onChange={() =>
                        setSymptoms((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))
                      }
                    />
                  ))}
                </div>
                <Textarea
                  label="Field notes"
                  rows={3}
                  value={notes}
                  placeholder="What did you see in the field — which rows, how many plants, when it started"
                  onChange={(e) => setNotes(e.currentTarget.value)}
                />
              </Panel>

              <Panel title="5 · Run analysis" bodyClassName="p-3 flex flex-wrap items-center gap-3">
                <Button disabled={!ready} onClick={run}>
                  Run analysis
                </Button>
                <p className="text-[0.875rem] text-ink-2">
                  {ready
                    ? "Image, crop and growth stage are set. The check takes a few seconds."
                    : "Add an image, a crop and a growth stage to run the check."}
                </p>
              </Panel>
            </>
          ) : null}

          {phase === "running" ? (
            <Panel title="Analysis in progress" bodyClassName="p-4">
              <ol aria-live="polite" className="flex flex-col gap-2">
                {RUN_STEPS.map((s, i) => {
                  const state = i < runIndex ? "done" : i === runIndex ? "active" : "waiting";
                  return (
                    <li key={s} className="flex items-center gap-2 text-[0.9375rem]">
                      <span
                        aria-hidden
                        className={cx(
                          "num flex size-5 items-center justify-center border text-[0.6875rem]",
                          state === "done"
                            ? "border-leaf text-leaf"
                            : state === "active"
                              ? "border-amber text-amber"
                              : "border-line text-ink-2",
                        )}
                      >
                        {state === "done" ? "✓" : i + 1}
                      </span>
                      <span className={state === "waiting" ? "text-ink-2" : ""}>{s}</span>
                      {state === "done" ? <span className="num text-[0.75rem] text-ink-2">complete</span> : null}
                    </li>
                  );
                })}
              </ol>
            </Panel>
          ) : null}

          {phase === "result" && sample ? (
            <>
              <Panel title="A · Assessment" meta={sample.id} bodyClassName="p-3">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
                  <div className="flex flex-col gap-3">
                    <Alert tone="info" title="Assessment, not a confirmed diagnosis">
                      This result is a suspected identification. It stays a working assessment until an expert
                      reviews it or a field visit confirms it.
                    </Alert>

                    <div>
                      <p className="text-caption">Likely disease</p>
                      <p className="text-[1.5rem] leading-tight">{sample.threat}</p>
                    </div>

                    <ConfidenceBar value={sample.confidence} label="Confidence" />

                    <div className="flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-2 text-[0.875rem]">
                        <span className="text-caption">Severity</span>
                        <SeverityMeter level={sample.severity} />
                        <span>{sample.severity >= 4 ? "Severe" : sample.severity >= 3 ? "Moderate" : "Mild"}</span>
                      </span>
                      <span className="text-[0.875rem]">
                        <span className="text-caption">Affected area</span>{" "}
                        <span className="num">
                          {sample.affected[0]}–{sample.affected[1]}%
                        </span>{" "}
                        estimated
                      </span>
                    </div>

                    <div className="border border-line p-2 text-[0.875rem]">
                      <span className="text-caption">Also considered</span>
                      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        {sample.differentials.map((d) => (
                          <li key={d.name}>
                            {d.name} <span className="num text-ink-2">{d.value}%</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border border-line">
                      <button
                        type="button"
                        aria-expanded={why}
                        onClick={() => setWhy((v) => !v)}
                        className="flex min-h-[44px] w-full items-center justify-between px-3 text-left text-[0.9375rem] font-semibold hover:bg-surface-2"
                      >
                        Why this result?
                        <span aria-hidden className="num text-ink-2">
                          {why ? "−" : "+"}
                        </span>
                      </button>
                      {why ? (
                        <ul className="border-t border-line p-3">
                          {EVIDENCE_WEIGHTS.map((e) => (
                            <li key={e.label} className="border-b border-line py-2 last:border-b-0">
                              <div className="flex items-baseline justify-between gap-3">
                                <span className="text-[0.875rem] font-semibold">{e.label}</span>
                                <span className="num text-[0.8125rem] text-ink-2">{e.weight}% of the signal</span>
                              </div>
                              <span className="mt-1 block h-[6px] w-full bg-surface-2" aria-hidden>
                                <span
                                  className="block h-full"
                                  style={{ width: `${e.weight * 2}%`, background: "var(--water)" }}
                                />
                              </span>
                              <p className="mt-1 text-[0.8125rem] text-ink-2">{e.detail}</p>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <RealCVCanvas
                      imageSrc={`/samples/${sample.cropId || "cotton"}.jpg`}
                      activeLayer={analysis ? "bounding_boxes" : "none"}
                      onLayerChange={(layer) => setAnalysis(layer !== "none")}
                      cropType={sample.crop}
                    />
                    <HeatLegend />
                  </div>
                </div>
              </Panel>

              <Panel title="B · Risk factors" meta="at the time of capture" bodyClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {riskFactors.map((r) => (
                  <div key={r.label} className="border-b border-r border-line p-3 last:border-r-0">
                    <p className="text-caption">{r.label}</p>
                    <p className="text-[0.9375rem] font-semibold">{r.state}</p>
                    <p className="num text-[1.25rem] leading-tight">{r.value}</p>
                    <p className="mt-1 text-[0.75rem] text-ink-2">{r.why}</p>
                  </div>
                ))}
              </Panel>

              <Panel title="C · Recommended action" bodyClassName="p-3 flex flex-col gap-3">
                <ol className="flex flex-col gap-3">
                  <li className="border-l-2 border-alert pl-3">
                    <p className="text-caption">Immediate — within 24 hours</p>
                    <p className="text-[0.9375rem]">
                      Inspect 15 plants across three rows in the affected patch and record how many carry the same
                      lesions.
                    </p>
                  </li>
                  <li className="border-l-2 border-amber pl-3">
                    <p className="text-caption">Next — within 3 days</p>
                    <p className="text-[0.9375rem]">
                      Remove and destroy heavily infected leaves where the plant can spare them. Keep irrigation off
                      the canopy and clean tools between rows.
                    </p>
                  </li>
                  <li className="border-l-2 border-leaf pl-3">
                    <p className="text-caption">Treatment — IPM ladder</p>
                    <ol className="mt-1 flex flex-col gap-2 text-[0.875rem]">
                      {[
                        { h: "1. Cultural", items: ipm?.cultural ?? [] },
                        { h: "2. Biological", items: ipm?.biological ?? [] },
                        { h: "3. Chemical — only if the threshold is crossed", items: ipm?.chemical ?? [] },
                      ].map((b) => (
                        <li key={b.h}>
                          <p className="font-semibold">{b.h}</p>
                          <ul className="list-disc pl-4">
                            {b.items.map((i) => (
                              <li key={i}>{i}</li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ol>
                    <p className="mt-2 text-[0.8125rem] text-ink-2">
                      Confirm product and dose with your extension officer before spraying. This system does not
                      prescribe a dose.{" "}
                      <Link to="/app/validation" className="underline">
                        Send this case for expert review
                      </Link>
                      .
                    </p>
                  </li>
                </ol>

                <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                  <Button
                    loading={busy}
                    onClick={async () => {
                      const created = saved ?? (await saveRecord());
                      if (created) {
                        await assignFieldVisit(created.id, isoDay(1));
                        toast("Sent for expert review");
                      }
                    }}
                  >
                    Send for expert review
                  </Button>
                  <Button
                    variant="secondary"
                    loading={busy}
                    onClick={async () => {
                      const created = saved ?? (await saveRecord());
                      if (created) {
                        await issueAdvisory(created.id);
                        toast("Advisory generated and queued for the farmer");
                      }
                    }}
                  >
                    Generate advisory
                  </Button>
                  <Button variant="secondary" loading={busy} onClick={() => void saveRecord()}>
                    Save to farm record
                  </Button>
                  <Button variant="ghost" onClick={reset}>
                    Start another check
                  </Button>
                </div>
                {saved ? (
                  <p className="num text-[0.8125rem] text-ink-2">
                    Case {saved.id} · awaiting validation ·{" "}
                    <Link to="/app/farms/$id" params={{ id: saved.farmId }} className="underline">
                      open farm record
                    </Link>
                  </p>
                ) : null}
              </Panel>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
