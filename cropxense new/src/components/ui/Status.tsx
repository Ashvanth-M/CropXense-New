import { cx } from "@/lib/cx";
import { useT } from "@/i18n";
import type { TranslationKey } from "@/i18n/en";

export type Status = "healthy" | "watch" | "critical" | "unconfirmed" | "resolved";

const color: Record<Status, string> = {
  healthy: "var(--leaf)",
  watch: "var(--amber)",
  critical: "var(--alert)",
  unconfirmed: "var(--ink-2)",
  resolved: "var(--water)",
};

/** 8px shape: circle / square / triangle / hollow circle / check */
export function StatusShape({ status, size = 8 }: { status: Status; size?: number }) {
  const c = color[status];
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 8 8" aria-hidden focusable="false" className="shrink-0">
      {status === "healthy" && <circle cx="4" cy="4" r="4" fill={c} />}
      {status === "watch" && <rect x="0" y="0" width="8" height="8" fill={c} />}
      {status === "critical" && <path d="M4 0 L8 8 L0 8 Z" fill={c} />}
      {status === "unconfirmed" && (
        <circle cx="4" cy="4" r="3.2" fill="none" stroke={c} strokeWidth="1.4" />
      )}
      {status === "resolved" && (
        <path d="M0.5 4.2 L3 6.8 L7.5 1.2" fill="none" stroke={c} strokeWidth="1.6" />
      )}
    </svg>
  );
}

export function StatusDot({ status, size = 10 }: { status: Status; size?: number }) {
  return (
    <span
      className="inline-block rounded-full"
      style={{ width: size, height: size, background: color[status] }}
      aria-hidden
    />
  );
}

export function StatusChip({ status, className }: { status: Status; className?: string }) {
  const { t } = useT();
  const label = t(`status.${status}` as TranslationKey);
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-[var(--r)] border border-line bg-surface px-2 py-1 text-[0.75rem] font-semibold",
        className,
      )}
    >
      <StatusShape status={status} />
      <span style={{ color: color[status] }}>{label}</span>
    </span>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "leaf" | "amber" | "alert" | "water" | "soil";
}) {
  const tones = {
    neutral: "border-line bg-surface-2 text-ink-2",
    leaf: "border-leaf/40 bg-leaf/10 text-leaf",
    amber: "border-amber/40 bg-amber/10 text-amber",
    alert: "border-alert/40 bg-alert/10 text-alert",
    water: "border-water/40 bg-water/10 text-water",
    soil: "border-soil/40 bg-soil/10 text-soil",
  } as const;
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-[var(--r)] border px-2 py-[2px] text-[0.75rem] font-semibold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function SeverityMeter({ level, max = 5 }: { level: number; max?: number }) {
  const tone = level >= 4 ? "var(--alert)" : level >= 2 ? "var(--amber)" : "var(--leaf)";
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex gap-[2px]" role="img" aria-label={`Severity ${level} of ${max}`}>
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            className="h-3 w-2 rounded-[1px] border"
            style={{
              background: i < level ? tone : "transparent",
              borderColor: i < level ? tone : "var(--line)",
            }}
          />
        ))}
      </span>
      <span className="num text-[0.75rem] text-ink-2">
        {level}/{max}
      </span>
    </span>
  );
}

export function ConfidenceBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const tone = pct >= 80 ? "var(--leaf)" : pct >= 55 ? "var(--amber)" : "var(--alert)";
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-caption">{label ?? "Confidence"}</span>
        <span className="num text-[0.875rem]">{pct}%</span>
      </div>
      <div
        className="mt-1 h-2 w-full border border-line bg-surface-2"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Confidence"}
      >
        <div className="h-full" style={{ width: `${pct}%`, background: tone }} />
      </div>
    </div>
  );
}
