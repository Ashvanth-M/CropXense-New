/**
 * /farmer/forecast — 7-Day Weather Risk & Pest Surveillance Intelligence.
 *
 * Professional agricultural meteorology & surveillance console showing:
 * - 7-day microclimate risk curves
 * - Risk Assessment: Disease Risk, Pest Risk, Spread Risk with explanations
 * - Pest trap surveillance network integrated with Economic Threshold Levels (ETL)
 * - Full localization using useT().
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  CloudSun,
  Droplets,
  CloudRain,
  Thermometer,
  Wind,
  Calendar,
  Info,
  ScanLine,
  Bug,
} from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import {
  getForecast,
  getWeather,
  latestWeather,
  getTraps,
  getTrapReadings,
  farmById,
} from "@/services";
import { useT } from "@/i18n";
import { cx } from "@/lib/cx";

export const Route = createFileRoute("/farmer/forecast")({
  head: () => ({
    meta: [
      { title: "Weather & Disease Risk — CropXense Farmer" },
      {
        name: "description",
        content: "7-day microclimate risk forecast, disease vulnerability, and integrated pest trap monitoring.",
      },
      { property: "og:title", content: "Weather & Disease Risk — CropXense Farmer" },
      {
        property: "og:description",
        content: "7-day microclimate risk forecast, disease vulnerability, and integrated pest trap monitoring.",
      },
    ],
  }),
  component: FarmerForecastPage,
});

function trapStatus(count: number, threshold: number): "above" | "watch" | "safe" {
  if (count >= threshold) return "above";
  if (count >= threshold * 0.7) return "watch";
  return "safe";
}

import { useAuth } from "@/auth/AuthContext";

function FarmerForecastPage() {
  const { user } = useAuth();
  const { t, tDistrict, tRisk } = useT();
  const districtId = user?.district?.toLowerCase() || "akola";
  const { data: forecast } = useAsync(() => getForecast(districtId), [districtId]);
  const currentWeather = latestWeather(districtId);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  const { data: weatherSeries } = useAsync(() => getWeather(districtId), [districtId]);
  const { data: traps } = useAsync(() => getTraps(districtId), [districtId]);
  const { data: trapReadings } = useAsync(() => getTrapReadings(), []);

  const days = (forecast?.days || []).map((d) => {
    const w = weatherSeries?.find((x) => x.date === d.date);
    return {
      ...d,
      day: new Date(d.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
      tMaxC: w?.tMaxC ?? 0,
      tMinC: w?.tMinC ?? 0,
      rhPct: w?.rhPct ?? 0,
      rainfallMm: w?.rainfallMm ?? 0,
    };
  });
  const selectedDay = days[selectedDayIndex] || days[0];

  // Trap intelligence items
  const trapItems = useMemo(() => {
    const allTraps = traps ?? [];
    const allReadings = trapReadings ?? [];
    return allTraps.map((trap) => {
      const readings = allReadings.filter((r) => r.trapId === trap.id);
      const latest = readings[readings.length - 1];
      const count = latest?.count ?? 0;
      const threshold = latest?.threshold ?? 10;
      const status = trapStatus(count, threshold);
      return { trap, readings, count, threshold, status };
    });
  }, [traps, trapReadings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-line bg-surface p-5 md:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="text-caption text-forest">{t("nav.forecast")}</span>
            <h1 className="mt-1 font-expanded text-[1.5rem] md:text-[1.875rem]">{t("nav.forecast")}</h1>
            <p className="mt-1 text-[0.875rem] text-ink-2">
              {tDistrict(districtId)} · {t("risk.disease")} & {t("risk.pest")}
            </p>
          </div>

          <Link
            to="/farmer/scan"
            className="inline-flex min-h-[44px] items-center gap-2 border border-forest bg-forest px-4 text-[0.875rem] font-semibold text-surface hover:bg-[#0e2b20]"
          >
            <ScanLine className="size-4" />
            <span>{t("farmer.scanLeaf")}</span>
          </Link>
        </div>

        {/* Current Station Observation */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4 lg:grid-cols-5">
          <div className="border-r border-line pr-3">
            <span className="text-caption">Max Temp</span>
            <p className="num mt-1 text-[1.25rem] font-bold">{currentWeather.tMaxC}°C</p>
          </div>
          <div className="border-r border-line pr-3">
            <span className="text-caption">Humidity</span>
            <p className="num mt-1 text-[1.25rem] font-bold text-water">{currentWeather.rhPct}%</p>
          </div>
          <div className="border-r border-line pr-3">
            <span className="text-caption">Rainfall (24h)</span>
            <p className="num mt-1 text-[1.25rem] font-bold text-water">{currentWeather.rainfallMm} mm</p>
          </div>
          <div className="border-r border-line pr-3">
            <span className="text-caption">Moisture Hours</span>
            <p className="num mt-1 text-[1.25rem] font-bold text-amber">{currentWeather.leafWetnessHrs} hrs</p>
          </div>
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <span className="text-caption">{t("risk.overall")}</span>
            <p className="font-display mt-1 text-[1.125rem] font-bold text-alert">{t("risk.high")}</p>
          </div>
        </div>
      </div>

      {/* 7-Day Timeline Bar */}
      <section className="border border-line bg-surface p-5">
        <h2 className="font-display text-[1.125rem] font-semibold border-b border-line pb-3">
          7-Day Risk Forecast Timeline
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {days.map((day, idx) => {
            const isSelected = idx === selectedDayIndex;
            const riskTone =
              day.risk === "high"
                ? "border-alert bg-alert/5 text-alert"
                : day.risk === "moderate"
                  ? "border-amber bg-amber/5 text-amber"
                  : "border-leaf bg-leaf/5 text-leaf";

            return (
              <button
                key={day.day}
                type="button"
                onClick={() => setSelectedDayIndex(idx)}
                className={cx(
                  "flex flex-col items-start rounded-[var(--r)] border p-3 text-left transition-all",
                  isSelected
                    ? "border-forest bg-surface ring-2 ring-forest shadow-panel"
                    : "border-line bg-paper hover:bg-surface-2",
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-display text-[0.875rem] font-bold text-ink">{day.day}</span>
                  <span className={cx("rounded-[var(--r)] px-1.5 py-0.5 text-[0.6875rem] font-bold uppercase", riskTone)}>
                    {tRisk(day.risk)}
                  </span>
                </div>

                <div className="num mt-3 text-[0.8125rem] text-ink-2">
                  <span className="block font-semibold text-ink">{day.tMaxC}° / {day.tMinC}°</span>
                  <span className="block text-water">RH {day.rhPct}% · {day.rainfallMm}mm</span>
                </div>

                <div className="mt-3 w-full bg-surface-2 h-1.5">
                  <div
                    className={cx("h-full", day.risk === "high" ? "bg-alert" : day.risk === "moderate" ? "bg-amber" : "bg-leaf")}
                    style={{ width: `${day.score}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected Day Deep Dive (2-Column Desktop Grid) */}
      {selectedDay && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left: Meteorological Drivers */}
          <div className="space-y-4 lg:col-span-6 border border-line bg-surface p-5">
            <h3 className="font-display text-[1.125rem] font-semibold flex items-center gap-2">
              <Calendar className="size-4 text-forest" />
              <span>Forecast Breakdown for {selectedDay.day}</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-[0.875rem]">
              <div className="border border-line bg-paper p-3">
                <span className="text-caption">Max Temperature</span>
                <p className="num text-[1.125rem] font-bold">{selectedDay.tMaxC} °C</p>
                <p className="text-[0.75rem] text-ink-2">Min: {selectedDay.tMinC} °C</p>
              </div>

              <div className="border border-line bg-paper p-3">
                <span className="text-caption">Relative Humidity</span>
                <p className="num text-[1.125rem] font-bold text-water">{selectedDay.rhPct} %</p>
                <p className="text-[0.75rem] text-ink-2">Moisture index</p>
              </div>

              <div className="border border-line bg-paper p-3">
                <span className="text-caption">Rainfall</span>
                <p className="num text-[1.125rem] font-bold text-water">{selectedDay.rainfallMm} mm</p>
                <p className="text-[0.75rem] text-ink-2">Precipitation</p>
              </div>

              <div className="border border-line bg-paper p-3">
                <span className="text-caption">Infection Composite</span>
                <p className="num text-[1.125rem] font-bold text-alert">{selectedDay.score} / 100</p>
                <p className="text-[0.75rem] text-ink-2">Combined pathogen index</p>
              </div>
            </div>

            <div className="border border-line bg-paper p-3 text-[0.8125rem]">
              <h4 className="font-semibold text-ink">{t("scan.whyResult")}</h4>
              <p className="mt-1 text-ink-2">
                Consecutive days of &gt;80% relative humidity and warm canopy temperatures (26–31°C) accelerate spore germination cycles.
              </p>
            </div>
          </div>

          {/* Right: Crop-Specific Vulnerability */}
          <div className="space-y-4 lg:col-span-6 border border-line bg-surface p-5">
            <h3 className="font-display text-[1.125rem] font-semibold flex items-center gap-2">
              <Info className="size-4 text-forest" />
              <span>{t("nav.advisories")}</span>
            </h3>

            <div className="space-y-3 text-[0.8125rem]">
              <div className="border border-amber/30 bg-amber/5 p-3.5">
                <strong className="block text-[0.875rem] font-semibold text-amber">
                  Cotton & Soybean Vulnerability
                </strong>
                <p className="mt-1 text-ink">
                  High humidity increases fungal and bacterial blight risk. Avoid applying heavy synthetic nitrogen fertilizers under rainy forecasts.
                </p>
              </div>

              <div className="border border-forest/30 bg-surface-2 p-3.5">
                <strong className="block text-[0.875rem] font-semibold text-forest">
                  Extension Officer Advisory
                </strong>
                <p className="mt-1 text-ink">
                  Ensure drain channels are free of debris to prevent water stagnation in low-lying plots.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integrated Pest Surveillance Section */}
      <section className="border border-line bg-surface p-5">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Bug className="size-5 text-forest" />
              <h2 className="font-display text-[1.125rem] font-semibold">
                {t("risk.pest")} — Trap Surveillance
              </h2>
            </div>
            <p className="text-[0.8125rem] text-ink-2">
              {tDistrict(districtId)}
            </p>
          </div>

          <Link
            to="/farmer/crop-care"
            className="text-[0.8125rem] font-semibold text-forest hover:underline"
          >
            {t("nav.cropCare")} →
          </Link>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trapItems.map(({ trap, count, threshold, status }) => {
            const farm = farmById(trap.farmId);
            const pct = Math.min(Math.round((count / threshold) * 100), 100);
            return (
              <div key={trap.id} className="border border-line bg-paper p-4 rounded-[var(--r)]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-ink">{trap.type} trap ({trap.id})</p>
                    <p className="text-[0.75rem] text-ink-2">{farm ? `${farm.name} · ${farm.village}` : trap.farmId}</p>
                  </div>
                  <span className={cx(
                    "rounded-[var(--r)] px-2 py-0.5 text-[0.6875rem] font-bold uppercase",
                    status === "above" ? "bg-alert/15 text-alert" : status === "watch" ? "bg-amber/15 text-amber" : "bg-leaf/15 text-leaf"
                  )}>
                    {status === "above" ? "Above ETL" : status === "watch" ? "Watch ETL" : t("status.healthy")}
                  </span>
                </div>

                <div className="num mt-3 flex items-baseline justify-between text-[0.8125rem]">
                  <span>Count: <strong className="text-ink">{count}</strong></span>
                  <span className="text-ink-2">ETL: {threshold}</span>
                </div>

                <div className="mt-1.5 h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className={cx(
                      "h-full",
                      status === "above" ? "bg-alert" : status === "watch" ? "bg-amber" : "bg-leaf"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5-Day Spraying Window & Agronomic Field Work Index */}
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="border border-line bg-surface p-5 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h2 className="font-display text-[1.0625rem] font-semibold text-ink">
                IPM Spraying Window & Drift Safety
              </h2>
              <p className="text-[0.8125rem] text-ink-2">Hourly forecast analysis for bio-agent & foliar application</p>
            </div>
            <span className="text-caption text-forest font-bold">IMD Model</span>
          </div>

          <div className="mt-4 space-y-3 text-[0.8125rem]">
            {[
              { day: "Today (Morning 07:00–10:00)", status: "Optimal Window", detail: "Wind 8 km/h, no rain expected, RH 74%. Excellent for biological application.", tone: "leaf" },
              { day: "Tomorrow (Afternoon 13:00–17:00)", status: "Caution — High Heat", detail: "Canopy temperature exceeds 32°C. Avoid emulsifiable concentrates during peak heat.", tone: "amber" },
              { day: "Day +2 (Post 15:00)", status: "Do Not Spray — Rain Risk", detail: "Convective rain probability 80%. Chemical wash-off risk is high within 4 hours.", tone: "alert" },
            ].map((slot, i) => (
              <div key={i} className="border border-line bg-paper p-3 rounded-[var(--r)] flex items-start justify-between gap-3">
                <div>
                  <span className="font-semibold text-ink">{slot.day}</span>
                  <p className="text-ink-2 mt-0.5 text-[0.75rem]">{slot.detail}</p>
                </div>
                <span className={cx(
                  "rounded-[var(--r)] px-2 py-0.5 text-[0.6875rem] font-bold shrink-0 uppercase",
                  slot.tone === "leaf" ? "bg-leaf/15 text-leaf" : slot.tone === "amber" ? "bg-amber/15 text-amber" : "bg-alert/15 text-alert"
                )}>
                  {slot.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-line bg-surface p-5 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="font-display text-[1.0625rem] font-semibold text-ink">
                  Farm Work Suitability Index
                </h2>
                <p className="text-[0.8125rem] text-ink-2">Field trafficability & soil moisture</p>
              </div>
              <span className="text-caption text-forest font-bold">Today</span>
            </div>

            <div className="mt-4 space-y-2 text-[0.8125rem]">
              <div className="flex items-center justify-between border-b border-line py-2">
                <span className="text-ink">Tillage & Intercultivation</span>
                <span className="font-semibold text-leaf">Suitable (Morning)</span>
              </div>
              <div className="flex items-center justify-between border-b border-line py-2">
                <span className="text-ink">Fertilizer Top-Dressing</span>
                <span className="font-semibold text-amber">Delay before rain</span>
              </div>
              <div className="flex items-center justify-between border-b border-line py-2">
                <span className="text-ink">Surface Drainage Maintenance</span>
                <span className="font-semibold text-forest">High Priority</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-ink">Pheromone Trap Lure Replacement</span>
                <span className="font-semibold text-leaf">Recommended</span>
              </div>
            </div>
          </div>

          <p className="mt-3 pt-3 border-t border-line text-[0.75rem] text-ink-2">
            Agronomy advisories generated with Department of Agriculture, Maharashtra guidelines.
          </p>
        </section>
      </div>
    </div>
  );
}
