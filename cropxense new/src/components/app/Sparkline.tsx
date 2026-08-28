/** 7-point hairline sparkline. Colour is passed in as a token var name. */
export function Sparkline({
  values,
  width = 76,
  height = 22,
  tone = "var(--ink-2)",
  label,
}: {
  values: number[];
  width?: number;
  height?: number;
  tone?: string;
  label: string;
}) {
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const y = (v: number) => height - 2 - ((v - min) / (max - min || 1)) * (height - 4);
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const last = values[values.length - 1] ?? 0;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <path d={d} fill="none" stroke={tone} strokeWidth="1.25" />
      <circle cx={(values.length - 1) * step} cy={y(last)} r="2" fill={tone} />
    </svg>
  );
}

/** Horizontal hairline bar used in ranked lists. */
export function RankBar({ value, max, tone }: { value: number; max: number; tone: string }) {
  const pct = Math.max(2, Math.round((value / (max || 1)) * 100));
  return (
    <span className="block h-[6px] w-full bg-surface-2" aria-hidden>
      <span className="block h-full" style={{ width: `${pct}%`, background: tone }} />
    </span>
  );
}

export const RISK_TONE: Record<string, string> = {
  high: "var(--alert)",
  moderate: "var(--amber)",
  low: "var(--leaf)",
};
