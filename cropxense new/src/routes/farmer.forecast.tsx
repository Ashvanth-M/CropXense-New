/**
 * /farmer/forecast — 7-Day Weather Risk & Disease Forecasting.
 *
 * Professional agricultural meteorology dashboard showing disease infection
 * probability curve, relative humidity, leaf wetness, rainfall, and crop-stage
 * susceptibility explanations for farmers.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  CloudSun,
  Droplets,
  CloudRain,
  Thermometer,
  Wind,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Info,
  ScanLine,
} from "lucide-react";
import { StatusChip } from "@/components/ui/Status";
import { useAsync } from "@/hooks/useAsync";
import { getForecast, getWeather, latestWeather } from "@/services";
import { cx } from "@/lib/cx";

export const Route = createFileRoute("/farmer/forecast")({
  head: () => ({
    meta: [
      { title: "Weather & Disease Risk — CropXense Farmer" },
      {
        name: "description",
        content: "7-day microclimate risk forecast and disease vulnerability curves for Maharashtra farmers.",
      },
      { property: "og:title", content: "Weather & Disease Risk — CropXense Farmer" },
      {
        property: "og:description",
        content: "7-day microclimate risk forecast and disease vulnerability curves for Maharashtra farmers.",
      },
    ],
  }),
  component: FarmerForecastPage,
});

function FarmerForecastPage() {
  const districtId = "akola";
  const { data: forecast, loading } = useAsync(() => getForecast(districtId), [districtId]);
  const currentWeather = latestWeather(districtId);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  const { data: weatherSeries } = useAsync(() => getWeather(districtId), [districtId]);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-line bg-surface p-5 md:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="text-caption text-forest">Microclimate Forecasting</span>
            <h1 className="mt-1 font-expanded text-[1.5rem] md:text-[1.875rem]">7-Day Weather & Disease Risk</h1>
            <p className="mt-1 text-[0.875rem] text-ink-2">
              Combined IMD meteorological grid and in-field sensor signals calculating infection vulnerability for Akola district.
            </p>
          </div>

          <Link
            to="/farmer/scan"
            className="inline-flex min-h-[44px] items-center gap-2 border border-forest bg-forest px-4 text-[0.875rem] font-semibold text-surface hover:bg-[#0e2b20]"
          >
            <ScanLine className="size-4" />
            <span>Scan Crop Today</span>
          </Link>
        </div>

        {/* Current Station Observation */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4 lg:grid-cols-5">
          <div className="border-r border-line pr-3">
            <span className="text-caption">Current Station Temp</span>
            <p className="num mt-1 text-[1.25rem] font-bold">{currentWeather.tMaxC}°C</p>
          </div>
          <div className="border-r border-line pr-3">
            <span className="text-caption">Relative Humidity</span>
            <p className="num mt-1 text-[1.25rem] font-bold text-water">{currentWeather.rhPct}%</p>
          </div>
          <div className="border-r border-line pr-3">
            <span className="text-caption">24h Rainfall</span>
            <p className="num mt-1 text-[1.25rem] font-bold text-water">{currentWeather.rainfallMm} mm</p>
          </div>
          <div className="border-r border-line pr-3">
            <span className="text-caption">Leaf Wetness</span>
            <p className="num mt-1 text-[1.25rem] font-bold text-amber">{currentWeather.leafWetnessHrs} hrs</p>
          </div>
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <span className="text-caption">Outbreak Threat</span>
            <p className="font-display mt-1 text-[1.125rem] font-bold text-alert">High Fungal Risk</p>
          </div>
        </div>
      </div>

      {/* 7-Day Timeline Bar */}
      <section className="border border-line bg-surface p-5">
        <h2 className="font-display text-[1.125rem] font-semibold border-b border-line pb-3">
          Weekly Disease Vulnerability Timeline
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
                    {day.risk}
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
                <p className="text-[0.75rem] text-ink-2">Night minimum: {selectedDay.tMinC} °C</p>
              </div>

              <div className="border border-line bg-paper p-3">
                <span className="text-caption">Relative Humidity</span>
                <p className="num text-[1.125rem] font-bold text-water">{selectedDay.rhPct} %</p>
                <p className="text-[0.75rem] text-ink-2">High moisture duration: 11 hrs</p>
              </div>

              <div className="border border-line bg-paper p-3">
                <span className="text-caption">Precipitation Volume</span>
                <p className="num text-[1.125rem] font-bold text-water">{selectedDay.rainfallMm} mm</p>
                <p className="text-[0.75rem] text-ink-2">Scattered convective showers</p>
              </div>

              <div className="border border-line bg-paper p-3">
                <span className="text-caption">Infection Composite Score</span>
                <p className="num text-[1.125rem] font-bold text-alert">{selectedDay.score} / 100</p>
                <p className="text-[0.75rem] text-ink-2">Combined pathogen index</p>
              </div>
            </div>

            <div className="border border-line bg-paper p-3 text-[0.8125rem]">
              <h4 className="font-semibold text-ink">Why is this risk level assigned?</h4>
              <p className="mt-1 text-ink-2">
                Consecutive days of &gt;85% relative humidity and warm canopy temperatures (26–31°C) accelerate spore germination cycles of fungal pathogens like Downy Mildew and Alternaria.
              </p>
            </div>
          </div>

          {/* Right: Crop-Specific Vulnerability */}
          <div className="space-y-4 lg:col-span-6 border border-line bg-surface p-5">
            <h3 className="font-display text-[1.125rem] font-semibold flex items-center gap-2">
              <Info className="size-4 text-forest" />
              <span>Crop Vulnerability & Farm Advisory</span>
            </h3>

            <div className="space-y-3 text-[0.8125rem]">
              <div className="border border-amber/30 bg-amber/5 p-3.5">
                <strong className="block text-[0.875rem] font-semibold text-amber">
                  Cotton (Flowering & Squaring Stage)
                </strong>
                <p className="mt-1 text-ink">
                  High humidity increases boll shedding and bacterial blight risk. Avoid applying heavy synthetic nitrogen fertilizers under rainy forecasts.
                </p>
              </div>

              <div className="border border-line bg-paper p-3.5">
                <strong className="block text-[0.875rem] font-semibold text-ink">
                  Soybean (Pod Fill Stage)
                </strong>
                <p className="mt-1 text-ink-2">
                  Monitor for Yellow Mosaic vectors (whiteflies) emerging after brief rainfall intervals. Inspect undersides of leaves.
                </p>
              </div>

              <div className="border border-forest/30 bg-surface-2 p-3.5">
                <strong className="block text-[0.875rem] font-semibold text-forest">
                  Extension Officer Advisory
                </strong>
                <p className="mt-1 text-ink">
                  Drain excess standing rainwater from furrows within 12 hours of precipitation to prevent root rot and damping-off.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
