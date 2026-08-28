import { useState } from "react";
import { cx } from "@/lib/cx";

export type RiskLevel = "High" | "Moderate" | "Low";

type District = { id: string; name: string; level: RiskLevel; cases: number };

const GRID: District[][] = [
  [
    { id: "dhule", name: "Dhule", level: "Moderate", cases: 7 },
    { id: "jalgaon", name: "Jalgaon", level: "High", cases: 16 },
    { id: "akola", name: "Akola", level: "High", cases: 19 },
    { id: "amravati", name: "Amravati", level: "High", cases: 14 },
    { id: "nagpur", name: "Nagpur", level: "Moderate", cases: 9 },
  ],
  [
    { id: "nashik", name: "Nashik", level: "Low", cases: 4 },
    { id: "sambhajinagar", name: "Chh. Sambhajinagar", level: "Moderate", cases: 6 },
    { id: "yavatmal", name: "Yavatmal", level: "High", cases: 13 },
    { id: "wardha", name: "Wardha", level: "Moderate", cases: 8 },
    { id: "chandrapur", name: "Chandrapur", level: "Moderate", cases: 6 },
  ],
  [
    { id: "pune", name: "Pune", level: "Low", cases: 3 },
    { id: "beed", name: "Beed", level: "Low", cases: 3 },
    { id: "latur", name: "Latur", level: "Moderate", cases: 5 },
    { id: "solapur", name: "Solapur", level: "Low", cases: 2 },
    { id: "kolhapur", name: "Kolhapur", level: "Low", cases: 1 },
  ],
];

const COLS = 5;
const ROWS = 3;
const MW = 440;
const MH = 250;

/** Shared, deterministically perturbed lattice — cells tile with no gaps. */
function corner(r: number, c: number) {
  const seed = Math.sin(r * 37.19 + c * 11.7) * 43758.5453;
  const jx = ((seed - Math.floor(seed)) - 0.5) * 26;
  const seed2 = Math.sin(r * 13.3 + c * 71.9) * 24634.6345;
  const jy = ((seed2 - Math.floor(seed2)) - 0.5) * 22;
  let x = 10 + (c / COLS) * MW + (c === 0 || c === COLS ? 0 : jx);
  let y = 12 + (r / ROWS) * MH + (r === 0 || r === ROWS ? 0 : jy);
  // shape the outer hull so the block reads as a landmass, not a rectangle
  if (r === 0) y += Math.abs(c - 2) * 9 + (c === 0 ? 10 : 0);
  if (r === ROWS) y -= Math.abs(c - 1) * 13;
  if (c === 0) x += r * 16;
  if (c === COLS) x -= r === ROWS ? 62 : r * 8;
  return { x: Math.round(x), y: Math.round(y) };
}

function cellPoints(r: number, c: number) {
  return [corner(r, c), corner(r, c + 1), corner(r + 1, c + 1), corner(r + 1, c)]
    .map((p) => `${p.x},${p.y}`)
    .join(" ");
}

function centroid(r: number, c: number) {
  const pts = [corner(r, c), corner(r, c + 1), corner(r + 1, c + 1), corner(r + 1, c)];
  return {
    x: pts.reduce((a, p) => a + p.x, 0) / 4,
    y: pts.reduce((a, p) => a + p.y, 0) / 4,
  };
}

export const DISTRICTS: (District & { points: string; label: { x: number; y: number } })[] =
  GRID.flatMap((row, r) =>
    row.map((d, c) => ({ ...d, points: cellPoints(r, c), label: centroid(r, c) })),
  );

const FILL: Record<RiskLevel, string> = {
  High: "var(--alert)",
  Moderate: "var(--amber)",
  Low: "var(--leaf)",
};

const HATCH: Record<RiskLevel, string> = {
  High: "url(#hx-dense)",
  Moderate: "url(#hx-mid)",
  Low: "url(#hx-open)",
};

export function DistrictMap({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div className="border border-line bg-surface">
      <header className="flex items-center justify-between gap-2 border-b border-line bg-surface-2 px-3 py-2">
        <span className="text-caption">Maharashtra — district risk, current week</span>
        <span className="num text-[0.75rem] text-ink-2">Updated 38 min ago</span>
      </header>
      <div className="p-3">
        <svg
          viewBox="0 0 470 280"
          className="block h-auto w-full"
          role="img"
          aria-label="Choropleth map of Maharashtra districts shaded and hatched by crop risk level"
        >
          <defs>
            <pattern id="hx-dense" width="4" height="4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="4" stroke="var(--alert)" strokeWidth="2" />
            </pattern>
            <pattern id="hx-mid" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--amber)" strokeWidth="1.6" />
            </pattern>
            <pattern id="hx-open" width="9" height="9" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="9" stroke="var(--leaf)" strokeWidth="1" />
            </pattern>
          </defs>

          {DISTRICTS.map((d) => {
            const on = selected === d.id || hover === d.id;
            return (
              <g key={d.id}>
                <polygon points={d.points} fill="var(--surface-2)" />
                <polygon points={d.points} fill={HATCH[d.level]} fillOpacity={on ? 0.95 : 0.6} />
                <polygon
                  points={d.points}
                  fill="none"
                  stroke={on ? "var(--ink)" : "var(--line)"}
                  strokeWidth={on ? 1.8 : 0.9}
                  tabIndex={0}
                  role="button"
                  aria-label={`${d.name}: ${d.level} risk, ${d.cases} open reports`}
                  onFocus={() => setHover(d.id)}
                  onBlur={() => setHover(null)}
                  onMouseEnter={() => setHover(d.id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => onSelect(d.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(d.id);
                    }
                  }}
                  className="cursor-pointer"
                />
                <text
                  x={d.label.x}
                  y={d.label.y}
                  textAnchor="middle"
                  fontSize="8"
                  fill="var(--ink)"
                  className="pointer-events-none"
                  style={{ letterSpacing: "0.04em" }}
                >
                  {d.name.length > 12 ? d.name.slice(0, 11) + "\u2026" : d.name}
                </text>
                <text
                  x={d.label.x}
                  y={d.label.y + 10}
                  textAnchor="middle"
                  fontSize="7.5"
                  fill="var(--ink-2)"
                  className="num pointer-events-none"
                >
                  {d.cases}
                </text>
              </g>
            );
          })}
        </svg>

        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {(["High", "Moderate", "Low"] as RiskLevel[]).map((l) => (
            <li key={l} className="flex items-center gap-2 text-[0.75rem]">
              <svg width="14" height="14" aria-hidden>
                <rect width="14" height="14" fill="var(--surface-2)" />
                <rect width="14" height="14" fill={HATCH[l]} />
                <rect width="14" height="14" fill="none" stroke="var(--line)" />
              </svg>
              <span style={{ color: FILL[l] }} className="font-semibold">
                {l}
              </span>
            </li>
          ))}
          <li className="text-[0.75rem] text-ink-2">
            Schematic district boundaries — representative demonstration data.
          </li>
        </ul>
      </div>
    </div>
  );
}

export function DistrictRanking({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const rows = [...DISTRICTS]
    .sort((a, b) => b.cases - a.cases)
    .slice(0, 6);
  return (
    <div className="overflow-x-auto border border-line bg-surface">
      <table className="w-full border-collapse text-[0.875rem]">
        <caption className="text-caption border-b border-line bg-surface-2 px-3 py-2 text-start">
          District ranking — field-visit priority
        </caption>
        <thead>
          <tr>
            {["District", "Risk", "Open reports", "Priority"].map((h, i) => (
              <th
                key={h}
                scope="col"
                className={cx("text-caption border-b border-line px-3 py-2", i > 1 ? "text-right" : "text-left")}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((d, i) => (
            <tr
              key={d.id}
              onClick={() => onSelect(d.id)}
              className={cx(
                "cursor-pointer border-b border-line last:border-b-0",
                selected === d.id ? "bg-surface-2" : "hover:bg-surface-2",
              )}
            >
              <th scope="row" className="px-3 py-2 text-left font-semibold">
                {d.name}
              </th>
              <td className="px-3 py-2">
                <span className="inline-flex items-center gap-1.5">
                  <svg width="10" height="10" aria-hidden>
                    {d.level === "High" && <path d="M5 0 L10 10 L0 10 Z" fill={FILL.High} />}
                    {d.level === "Moderate" && <rect width="10" height="10" fill={FILL.Moderate} />}
                    {d.level === "Low" && <circle cx="5" cy="5" r="5" fill={FILL.Low} />}
                  </svg>
                  <span style={{ color: FILL[d.level] }} className="font-semibold">
                    {d.level}
                  </span>
                </span>
              </td>
              <td className="num px-3 py-2 text-right">{d.cases}</td>
              <td className="num px-3 py-2 text-right">{i + 1}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
