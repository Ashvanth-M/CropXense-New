import { useState } from "react";
import { cx } from "@/lib/cx";

type Day = {
  label: string;
  date: string;
  risk: number; // 0-100
  driver: string;
  rain: number;
  rh: number;
};

const DAYS: Day[] = [
  { label: "Tue", date: "25 Aug", risk: 41, driver: "Leaf wetness 6 h", rain: 4, rh: 74 },
  { label: "Wed", date: "26 Aug", risk: 58, driver: "Leaf wetness 9 h", rain: 11, rh: 81 },
  { label: "Thu", date: "27 Aug", risk: 76, driver: "Rain + RH above threshold", rain: 26, rh: 89 },
  { label: "Fri", date: "28 Aug", risk: 84, driver: "Continuous wetness 13 h", rain: 31, rh: 92 },
  { label: "Sat", date: "29 Aug", risk: 69, driver: "Wetness easing", rain: 12, rh: 85 },
  { label: "Sun", date: "30 Aug", risk: 44, driver: "Drying spell", rain: 3, rh: 71 },
  { label: "Mon", date: "31 Aug", risk: 32, driver: "Low humidity", rain: 0, rh: 63 },
];

function band(risk: number) {
  if (risk >= 70) return { name: "High", color: "var(--alert)" } as const;
  if (risk >= 45) return { name: "Moderate", color: "var(--amber)" } as const;
  return { name: "Low", color: "var(--leaf)" } as const;
}

const H = 132;

export function RiskForecast() {
  const [active, setActive] = useState(3);
  const sel = DAYS[active]!;
  const selBand = band(sel.risk);

  return (
    <div className="border border-line bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2 px-3 py-2">
        <span className="text-caption">
          7-day infection risk — cotton bacterial blight · Jalgaon block
        </span>
        <span className="num text-[0.75rem] text-ink-2">Updated 12 min ago</span>
      </header>

      <div className="p-3">
        <div className="flex items-end gap-1" style={{ height: H }}>
          {DAYS.map((d, i) => {
            const b = band(d.risk);
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={i === active}
                aria-label={`${d.label} ${d.date}: risk ${d.risk} percent, ${b.name}`}
                className={cx(
                  "group relative flex flex-1 flex-col justify-end self-stretch border-b border-line",
                  i === active && "bg-surface-2",
                )}
              >
                <span
                  className="num absolute inset-x-0 text-center text-[0.6875rem] text-ink-2"
                  style={{ bottom: `calc(${(d.risk / 100) * (H - 22)}px + 4px)` }}
                >
                  {d.risk}
                </span>
                <span
                  className="mx-auto w-full max-w-[38px]"
                  style={{
                    height: (d.risk / 100) * (H - 22),
                    background: b.color,
                    opacity: i === active ? 1 : 0.62,
                  }}
                />
              </button>
            );
          })}
        </div>
        <div className="flex gap-1">
          {DAYS.map((d, i) => (
            <div key={d.date} className="flex-1 pt-1 text-center">
              <p className={cx("text-[0.75rem] font-semibold", i === active && "text-ink")}>
                {d.label}
              </p>
              <p className="num text-[0.6875rem] text-ink-2">{d.date}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-3 border-t border-line pt-3 md:grid-cols-[1fr_1fr_1fr]">
          <div>
            <p className="text-caption">Selected day</p>
            <p className="mt-1 text-[0.9375rem]">
              {sel.label} {sel.date} —{" "}
              <span style={{ color: selBand.color }} className="font-semibold">
                {selBand.name} risk
              </span>
            </p>
            <p className="text-[0.875rem] text-ink-2">{sel.driver}</p>
          </div>
          <div>
            <p className="text-caption">Inputs</p>
            <p className="num mt-1 text-[0.875rem]">
              rainfall {sel.rain} mm · RH {sel.rh}%
            </p>
            <p className="text-[0.875rem] text-ink-2">IMD grid forecast + in-field node</p>
          </div>
          <div>
            <p className="text-caption">Suggested window</p>
            <p className="mt-1 text-[0.875rem] text-ink-2">
              Complete field inspection before 27 Aug. Forecast risk is a probability, not a
              prediction of infection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
