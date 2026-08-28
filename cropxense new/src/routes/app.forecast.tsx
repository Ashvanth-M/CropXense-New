import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Select } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Panel, Updated } from "@/components/app/bits";
import { useAsync } from "@/hooks/useAsync";
import { CROPS, DISTRICTS, STAGE_LABEL, cropName, districtName, getWeather } from "@/services";
import {
  DISEASE_THRESHOLD,
  PEST_THRESHOLD,
  diseaseIndex,
  pestIndex,
  primaryThreat,
  sevenDayRisk,
  whyText,
} from "@/data/forecastIndex";
import type { RiskLevel } from "@/types";
import { cx } from "@/lib/cx";

export const Route = createFileRoute("/app/forecast")({
  head: () => ({
    meta: [
      { title: "Risk forecast — 7-day outlook | CropXense" },
      {
        name: "description",
        content: "Seven-day disease and pest risk timeline per district and crop, with the weather drivers behind each day.",
      },
      { property: "og:title", content: "Risk forecast — CropXense" },
      { property: "og:description", content: "District and crop-specific 7-day risk timeline with weather drivers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForecastPage,
});

const RISK_META: Record<RiskLevel, { label: string; tone: string; glyph: string; bg: string }> = {
  high: { label: "High", tone: "var(--alert)", glyph: "▲", bg: "color-mix(in srgb, var(--alert) 22%, var(--surface))" },
  moderate: { label: "Moderate", tone: "var(--amber)", glyph: "■", bg: "color-mix(in srgb, var(--amber) 22%, var(--surface))" },
  low: { label: "Low", tone: "var(--leaf)", glyph: "●", bg: "color-mix(in srgb, var(--leaf) 18%, var(--surface))" },
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function dayLabel(iso: string) {
  const d = new Date(`${iso}T00:00:00+05:30`);
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

function weekdayLong(iso: string) {
  const d = new Date(`${iso}T00:00:00+05:30`);
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()] ?? "";
}

function tickDate(iso: string) {
  return iso.slice(5);
}

function ForecastPage() {
  const [districtId, setDistrictId] = useState(DISTRICTS[0]?.id ?? "");
  const [cropId, setCropId] = useState(CROPS[0]?.id ?? "");
  const [selectedIdx, setSelectedIdx] = useState(0);

  const weatherQ = useAsync(() => getWeather(districtId), [districtId]);
  const weather = weatherQ.data ?? [];

  const days = useMemo(() => sevenDayRisk(districtId, cropId), [districtId, cropId]);
  const disease = useMemo(() => diseaseIndex(districtId, cropId), [districtId, cropId]);
  const pest = useMemo(() => pestIndex(districtId, cropId), [districtId, cropId]);
  const { disease: threatDisease, pest: threatPest } = primaryThreat(cropId);
  const threatName = threatDisease?.name ?? threatPest?.name ?? "monitored threat";
  const stage = CROPS.find((c) => c.id === cropId)?.currentStage ?? "vegetative";
  const stageLabel = STAGE_LABEL[stage] ?? stage;

  const selected = days[Math.min(selectedIdx, days.length - 1)];
  const selectedWeather = weather.find((w) => w.date === selected?.date);

  const why = selected
    ? whyText({
        dayLabel: weekdayLong(selected.date),
        risk: selected.risk,
        districtWeather: weather,
        date: selected.date,
        cropId,
        stageLabel,
      })
    : null;

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setSelectedIdx(Math.min(days.length - 1, i + 1));
      (document.getElementById(`fc-day-${Math.min(days.length - 1, i + 1)}`) as HTMLElement | null)?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSelectedIdx(Math.max(0, i - 1));
      (document.getElementById(`fc-day-${Math.max(0, i - 1)}`) as HTMLElement | null)?.focus();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <header className="border border-line bg-surface p-3">
        <h1 className="font-display text-[1.375rem] font-semibold">Risk forecast</h1>
        <p className="mt-1 text-[0.9375rem] text-ink-2">
          Seven-day disease and pest risk for {cropName(cropId)} ({stageLabel}) in {districtName(districtId)}, built from
          weather windows, crop stage and threat history.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Updated minutes={35} />
          <span className="text-[0.8125rem] text-ink-2">
            Forecasts are guidance — a field check confirms before any action is taken.
          </span>
        </div>
      </header>

      <div className="grid gap-2 border border-line bg-surface p-3 sm:grid-cols-2">
        <Select
          label="District"
          value={districtId}
          onChange={(e) => setDistrictId(e.target.value)}
          options={DISTRICTS.map((d) => ({ value: d.id, label: `${d.name} — ${d.region}` }))}
        />
        <Select
          label="Crop"
          value={cropId}
          onChange={(e) => setCropId(e.target.value)}
          options={CROPS.map((c) => ({ value: c.id, label: c.name }))}
        />
      </div>

      <Alert tone="info" title={`Named threat for ${cropName(cropId)}: ${threatName}`}>
        Risk levels, drivers and the indices below are specific to {cropName(cropId)} at {stageLabel.toLowerCase()} —
        changing the crop changes the whole outlook because different crops and stages respond to different weather
        windows.
      </Alert>

      <Panel title="Seven-day risk timeline" meta={<Updated minutes={35} />}>
        {weatherQ.loading ? (
          <div className="grid gap-2 p-3 sm:grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : (
          <ol className="grid gap-2 p-3 sm:grid-cols-7" aria-label="Seven day risk timeline, use arrow keys to move between days">
            {days.map((d, i) => {
              const w = weather.find((x) => x.date === d.date);
              const meta = RISK_META[d.risk];
              const isSelected = i === selectedIdx;
              return (
                <li key={d.date}>
                  <button
                    id={`fc-day-${i}`}
                    type="button"
                    aria-pressed={isSelected}
                    aria-current={isSelected ? "true" : undefined}
                    onClick={() => setSelectedIdx(i)}
                    onKeyDown={(e) => onKeyDown(e, i)}
                    className={cx(
                      "flex min-h-[44px] w-full flex-col border bg-surface text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                      isSelected ? "border-[3px] border-ink" : "border-line",
                    )}
                    style={{ outlineColor: "var(--focus)" }}
                  >
                    <span
                      className={cx(
                        "px-2 py-1 text-[0.75rem] font-semibold",
                        isSelected ? "bg-ink text-paper" : "bg-surface-2 text-ink",
                      )}
                    >
                      {dayLabel(d.date)}
                    </span>
                    <span
                      className="flex flex-col items-center justify-center gap-1 px-2 py-4 text-caption"
                      style={{ background: meta.bg, color: meta.tone, minHeight: 96 }}
                    >
                      <span aria-hidden className="text-[1.125rem] leading-none">
                        {meta.glyph}
                      </span>
                      <span className="font-semibold">{meta.label}</span>
                      <span className="num text-[0.75rem]">{d.score}</span>
                    </span>
                    <span className="grid grid-cols-1 gap-0.5 border-t border-line px-2 py-1.5 text-[0.75rem]">
                      <span className="num flex justify-between">
                        <span className="text-ink-2">Temp</span>
                        <span>
                          {w ? `${w.tMaxC}/${w.tMinC}°` : "—"}
                        </span>
                      </span>
                      <span className="num flex justify-between">
                        <span className="text-ink-2">RH</span>
                        <span>{w ? `${w.rhPct}%` : "—"}</span>
                      </span>
                      <span className="num flex justify-between">
                        <span className="text-ink-2">Rain</span>
                        <span>{w ? `${w.rainfallMm}mm` : "—"}</span>
                      </span>
                      <span className="num flex justify-between">
                        <span className="text-ink-2">Wind</span>
                        <span>{w ? `${w.windKph}kph` : "—"}</span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>

      <Panel title={`Why — ${selected ? dayLabel(selected.date) : ""}`}>
        <div className="p-3">
          {weatherQ.loading || !why ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <>
              <p className="text-[0.9375rem]">{why.sentence}</p>
              {why.drivers.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {why.drivers.map((driver) => (
                    <li key={driver} className="border border-line px-2 py-1 text-[0.8125rem] text-ink-2">
                      {driver}
                    </li>
                  ))}
                </ul>
              )}
              {selectedWeather && (
                <p className="num mt-2 text-[0.75rem] text-ink-2">
                  Max {selectedWeather.tMaxC}°C / Min {selectedWeather.tMinC}°C · RH {selectedWeather.rhPct}% · Rain{" "}
                  {selectedWeather.rainfallMm} mm · Leaf wetness {selectedWeather.leafWetnessHrs} h · Wind{" "}
                  {selectedWeather.windKph} kph
                </p>
              )}
            </>
          )}
        </div>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title={`Disease risk index — ${cropName(cropId)}`}>
          {weatherQ.loading ? (
            <Skeleton className="m-3 h-56" />
          ) : (
            <div className="p-3">
              <div
                role="img"
                aria-label={`Fourteen day disease pressure index for ${threatName} on ${cropName(cropId)}, ranging from ${Math.min(...disease.map((d) => d.value))} to ${Math.max(...disease.map((d) => d.value))}, threshold at ${DISEASE_THRESHOLD}`}
                style={{ width: "100%", height: 220 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={disease} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="diseaseFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--alert)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--alert)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--line)" strokeDasharray="2 2" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={tickDate} tick={{ fontSize: 11, fill: "var(--ink-2)" }} className="num" />
                    <YAxis tick={{ fontSize: 11, fill: "var(--ink-2)" }} className="num" width={34} />
                    <RTooltip
                      contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 3, fontSize: 12 }}
                      labelFormatter={(v) => tickDate(String(v))}
                    />
                    <ReferenceLine y={DISEASE_THRESHOLD} stroke="var(--alert)" strokeDasharray="4 3" />
                    <Area type="monotone" dataKey="value" stroke="var(--alert)" fill="url(#diseaseFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-[0.8125rem] text-ink-2">
                Crossing {DISEASE_THRESHOLD} means conditions have sustained the humidity and leaf wetness that {threatName.toLowerCase()}{" "}
                needs to establish — step up scouting and consider the cultural steps below.
              </p>
            </div>
          )}
        </Panel>

        <Panel title={`Pest pressure index — ${cropName(cropId)}`}>
          {weatherQ.loading ? (
            <Skeleton className="m-3 h-56" />
          ) : (
            <div className="p-3">
              <div
                role="img"
                aria-label={`Fourteen day pest pressure index for ${cropName(cropId)}, ranging from ${Math.min(...pest.map((d) => d.value))} to ${Math.max(...pest.map((d) => d.value))}, threshold at ${PEST_THRESHOLD}`}
                style={{ width: "100%", height: 220 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pest} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pestFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--amber)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--amber)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--line)" strokeDasharray="2 2" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={tickDate} tick={{ fontSize: 11, fill: "var(--ink-2)" }} className="num" />
                    <YAxis tick={{ fontSize: 11, fill: "var(--ink-2)" }} className="num" width={34} />
                    <RTooltip
                      contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 3, fontSize: 12 }}
                      labelFormatter={(v) => tickDate(String(v))}
                    />
                    <ReferenceLine y={PEST_THRESHOLD} stroke="var(--amber)" strokeDasharray="4 3" />
                    <Area type="monotone" dataKey="value" stroke="var(--amber)" fill="url(#pestFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-[0.8125rem] text-ink-2">
                Crossing {PEST_THRESHOLD} means trap counts are likely nearing the economic threshold — check pheromone
                traps and be ready to escalate from cultural to biological control.
              </p>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
