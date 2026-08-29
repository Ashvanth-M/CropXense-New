import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Select } from "@/components/ui/Field";
import { Drawer } from "@/components/ui/Overlay";
import { Skeleton } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { Sparkline, RISK_TONE } from "@/components/app/Sparkline";
import { ChannelTag, Panel, RiskChip, Updated, relTime } from "@/components/app/bits";
import { useAsync } from "@/hooks/useAsync";
import type { LayerKey } from "@/components/map/SurveillanceMap";
import {
  CROPS,
  DISEASES,
  DISTRICTS,
  PESTS,
  TODAY,
  assignFieldVisit,
  farmById,
  getAssessments,
  getFarms,
  getOutbreaks,
  getSensors,
  getTraps,
  isoDay,
} from "@/services";
import type { Outbreak } from "@/types";
import { useT } from "@/i18n";

const SurveillanceMap = lazy(() => import("@/components/map/SurveillanceMap"));

export const Route = createFileRoute("/app/map")({
  head: () => ({
    meta: [
      { title: "Surveillance map — CropXense district GIS" },
      {
        name: "description",
        content:
          "Field boundaries, disease and pest hotspots, sensors, pest traps and risk zones across India.",
      },
      { property: "og:title", content: "Surveillance map — CropXense" },
      {
        property: "og:description",
        content: "District GIS view of crop disease hotspots, sensors and pest traps across India.",
      },
    ],
  }),
  component: MapPage,
});

const LAYERS: { key: LayerKey; label: string; swatch: string; shape: "poly" | "circle" | "square" | "triangle" | "hollow" }[] = [
  { key: "boundaries", label: "Farm boundaries", swatch: "var(--leaf)", shape: "poly" },
  { key: "disease", label: "Disease hotspots", swatch: "var(--alert)", shape: "circle" },
  { key: "pest", label: "Pest hotspots", swatch: "var(--amber)", shape: "circle" },
  { key: "sensors", label: "Sensors", swatch: "var(--water)", shape: "square" },
  { key: "traps", label: "Pest traps", swatch: "var(--soil)", shape: "triangle" },
  { key: "weather", label: "Weather stations", swatch: "var(--water)", shape: "hollow" },
  { key: "risk", label: "Risk zones", swatch: "var(--amber)", shape: "poly" },
  { key: "confirmed", label: "Expert-confirmed cases", swatch: "var(--forest)", shape: "circle" },
];

function Swatch({ shape, color }: { shape: string; color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="shrink-0">
      {shape === "square" && <rect x="2.5" y="2.5" width="9" height="9" fill={color} stroke={color} />}
      {shape === "triangle" && <path d="M7 2 L12.5 12 L1.5 12 Z" fill={color} stroke={color} />}
      {shape === "circle" && <circle cx="7" cy="7" r="4.6" fill={color} fillOpacity="0.3" stroke={color} />}
      {shape === "hollow" && <circle cx="7" cy="7" r="4.6" fill="none" stroke={color} />}
      {shape === "poly" && <rect x="1.5" y="3" width="11" height="8" fill={color} fillOpacity="0.2" stroke={color} />}
    </svg>
  );
}

function MapPage() {
  const { toast } = useToast();
  const { t, tCrop, tDistrict, tRisk } = useT();
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    boundaries: true, disease: true, pest: true, sensors: true,
    traps: true, weather: false, risk: true, confirmed: false,
  });
  const [districtId, setDistrictId] = useState("");
  const [cropId, setCropId] = useState("");
  const [threatId, setThreatId] = useState("");
  const [risk, setRisk] = useState("");
  const [selected, setSelected] = useState<Outbreak | null>(null);

  const farmsQ = useAsync(
    () => getFarms({ ...(districtId ? { districtId } : {}), ...(cropId ? { cropId } : {}) }),
    [districtId, cropId],
  );
  const outbreaksQ = useAsync(() => getOutbreaks(), []);
  const sensorsQ = useAsync(() => getSensors(districtId || undefined), [districtId]);
  const trapsQ = useAsync(() => getTraps(districtId || undefined), [districtId]);
  const casesQ = useAsync(() => getAssessments(districtId ? { districtId } : {}), [districtId]);

  const outbreaks = useMemo(
    () =>
      (outbreaksQ.data ?? []).filter(
        (o) =>
          (!districtId || o.districtId === districtId) &&
          (!cropId || o.cropId === cropId) &&
          (!threatId || o.threatId === threatId) &&
          (!risk || o.risk === risk),
      ),
    [outbreaksQ.data, districtId, cropId, threatId, risk],
  );

  const farms = farmsQ.data ?? [];
  const nearby = (selected ? (casesQ.data ?? []).filter((c) => c.districtId === selected.districtId) : []).slice(0, 4);

  return (
    <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
      <aside className="flex flex-col gap-3">
        <Panel title={t("nav.survMap")}>
          <ul className="px-3 py-2">
            {LAYERS.map((l) => (
              <li key={l.key} className="flex items-center gap-2 py-0.5">
                <Swatch shape={l.shape} color={l.swatch} />
                <Checkbox
                  label={l.label}
                  checked={layers[l.key]}
                  onChange={(e) => setLayers((s) => ({ ...s, [l.key]: e.target.checked }))}
                />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={t("action.filter")}>
          <div className="space-y-2 px-3 py-2">
            <Select
              label={t("field.district")}
              value={districtId}
              onChange={(e) => setDistrictId(e.target.value)}
              options={[{ value: "", label: t("common.all") }, ...DISTRICTS.map((d) => ({ value: d.id, label: tDistrict(d.id) }))]}
            />
            <Select
              label={t("field.crop")}
              value={cropId}
              onChange={(e) => setCropId(e.target.value)}
              options={[{ value: "", label: t("common.all") }, ...CROPS.map((c) => ({ value: c.id, label: tCrop(c.id) }))]}
            />
            <Select
              label={t("risk.disease")}
              value={threatId}
              onChange={(e) => setThreatId(e.target.value)}
              options={[
                { value: "", label: t("common.all") },
                ...DISEASES.map((d) => ({ value: d.id, label: `${d.name}` })),
                ...PESTS.map((p) => ({ value: p.id, label: `${p.name}` })),
              ]}
            />
            <Select
              label={t("risk.overall")}
              value={risk}
              onChange={(e) => setRisk(e.target.value)}
              options={[
                { value: "", label: t("common.all") },
                { value: "high", label: t("risk.high") },
                { value: "moderate", label: t("risk.moderate") },
                { value: "low", label: t("risk.low") },
              ]}
            />
          </div>
        </Panel>

        <div className="border border-line bg-surface px-3 py-2">
          <p className="text-caption">{t("officer.emergingHotspots")}</p>
          <p className="num text-[1.25rem]">
            {farms.length} {t("common.fields")} · {outbreaks.length} hotspots
          </p>
        </div>
      </aside>

      <Panel
        title={t("nav.survMap")}
        meta={<Updated minutes={9} />}
        bodyClassName="h-[calc(100vh-190px)] min-h-[520px]"
        className="[&_[data-demo]]:h-full"
      >
        <div data-demo="map" className="h-full">
        <ClientOnly fallback={<Skeleton className="h-full w-full" />}>
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <SurveillanceMap
              farms={farms}
              outbreaks={outbreaks}
              sensors={sensorsQ.data ?? []}
              traps={trapsQ.data ?? []}
              layers={layers}
              onSelectOutbreak={setSelected}
            />
          </Suspense>
        </ClientOnly>
        </div>
      </Panel>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.threatName}` : ""}
      >
        {selected ? (
          <div className="space-y-4 text-[0.875rem]">
            <p className="text-ink-2">
              {t("field.district")} {tDistrict(selected.districtId)} · {t("field.area")}{" "}
              <span className="num text-ink">{selected.affectedFields}</span> · {t("risk.overall")} <RiskChip risk={selected.risk} />
            </p>

            <div>
              <p className="text-caption mb-1">{t("field.detectedVia")}</p>
              <div className="flex flex-wrap gap-1">
                {selected.detectedVia.map((c) => (
                  <ChannelTag key={c} channel={c} />
                ))}
              </div>
            </div>

            <p className="text-[0.8125rem] text-ink-2">
              {relTime(selected.lastConfirmedAt, TODAY)}
            </p>

            <div>
              <p className="text-caption mb-1">{t("pests.trend")}</p>
              <Sparkline
                values={selected.trapTrend}
                width={340}
                height={54}
                tone={RISK_TONE[selected.risk] ?? "var(--ink-2)"}
                label={`Trap counts for ${selected.threatName}`}
              />
            </div>

            <div>
              <p className="text-caption mb-1">{t("officer.priorityQueue")}</p>
              <ul className="border border-line">
                {nearby.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 border-b border-line px-2 py-1.5 last:border-0">
                    <span className="min-w-0">
                      <span className="num block text-[0.75rem] text-ink-2">{c.id}</span>
                      <span className="block truncate">{farmById(c.farmId)?.name}</span>
                    </span>
                    <span className="num shrink-0 text-[0.8125rem]">{c.confidence}%</span>
                  </li>
                ))}
                {nearby.length === 0 ? <li className="px-2 py-2 text-ink-2">{t("empty.noCases")}</li> : null}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={async () => {
                  await assignFieldVisit(nearby[0]?.id ?? selected.id, isoDay(1));
                  toast(t("toast.fieldVisitAssigned"), "healthy");
                }}
              >
                {t("officer.assignFieldVisit")}
              </Button>
              <Button variant="secondary" onClick={() => { setDistrictId(selected.districtId); setSelected(null); }}>
                {t("action.viewDetails")}
              </Button>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
