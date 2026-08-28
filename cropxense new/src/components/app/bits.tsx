import type { ReactNode } from "react";
import { Camera, CloudRain, Cpu, History, Bug } from "lucide-react";
import type { CaseStatus, RiskLevel, SignalChannel } from "@/types";
import { cx } from "@/lib/cx";

/** Shared chrome for every dashboard panel: hairline box, caption header. */
export function Panel({
  title,
  meta,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cx("flex min-h-0 flex-col border border-line bg-surface", className)}>
      <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <h2 className="text-caption">{title}</h2>
        {meta ? <span className="text-[0.75rem] text-ink-2">{meta}</span> : null}
      </header>
      <div className={cx("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}

const CHANNEL_ICON: Record<SignalChannel, typeof Camera> = {
  image: Camera,
  sensor: Cpu,
  trap: Bug,
  weather: CloudRain,
  history: History,
};

const CHANNEL_LABEL: Record<SignalChannel, string> = {
  image: "Image",
  sensor: "Sensor",
  trap: "Pest trap",
  weather: "Weather",
  history: "History",
};

export function ChannelIcons({ channels }: { channels: SignalChannel[] }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Detected via ${channels.map((c) => CHANNEL_LABEL[c]).join(", ")}`}>
      {channels.map((c) => {
        const Icon = CHANNEL_ICON[c];
        return <Icon key={c} className="size-[13px] text-ink-2" aria-hidden />;
      })}
    </span>
  );
}

export function ChannelTag({ channel }: { channel: SignalChannel }) {
  const Icon = CHANNEL_ICON[channel];
  return (
    <span className="inline-flex items-center gap-1 border border-line px-1.5 py-0.5 text-[0.75rem] text-ink-2">
      <Icon className="size-[13px]" aria-hidden />
      {CHANNEL_LABEL[channel]}
    </span>
  );
}

/** Case status pill — shape + colour + text, never colour alone. */
export function CaseStatusChip({ status }: { status: CaseStatus }) {
  const map: Record<CaseStatus, { label: string; tone: string; glyph: string }> = {
    detected: { label: "Detected", tone: "var(--ink-2)", glyph: "○" },
    awaiting_validation: { label: "Awaiting validation", tone: "var(--amber)", glyph: "◧" },
    expert_confirmed: { label: "Expert confirmed", tone: "var(--leaf)", glyph: "✓" },
    field_confirmed: { label: "Field confirmed", tone: "var(--forest)", glyph: "✓✓" },
    rejected: { label: "Rejected", tone: "var(--ink-2)", glyph: "×" },
    resolved: { label: "Resolved", tone: "var(--water)", glyph: "◼" },
  };
  const s = map[status];
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap border px-1.5 py-0.5 text-[0.75rem] font-semibold"
      style={{ color: s.tone, borderColor: s.tone }}
    >
      <span aria-hidden>{s.glyph}</span>
      {s.label}
    </span>
  );
}

export function RiskChip({ risk }: { risk: RiskLevel }) {
  const map: Record<RiskLevel, { label: string; tone: string; glyph: string }> = {
    high: { label: "High", tone: "var(--alert)", glyph: "▲" },
    moderate: { label: "Moderate", tone: "var(--amber)", glyph: "■" },
    low: { label: "Low", tone: "var(--leaf)", glyph: "●" },
  };
  const s = map[risk];
  return (
    <span className="inline-flex items-center gap-1 text-[0.8125rem] font-semibold" style={{ color: s.tone }}>
      <span aria-hidden>{s.glyph}</span>
      {s.label}
    </span>
  );
}

export function ConfidenceCell({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="block h-[6px] w-14 bg-surface-2" aria-hidden>
        <span
          className="block h-full"
          style={{
            width: `${value}%`,
            background: value >= 80 ? "var(--leaf)" : value >= 60 ? "var(--amber)" : "var(--ink-2)",
          }}
        />
      </span>
      <span className="num text-[0.8125rem]">{value}%</span>
    </span>
  );
}

export function relTime(iso: string, now: Date) {
  const mins = Math.max(1, Math.round((now.getTime() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs} h`;
  return `${Math.round(hrs / 24)} d`;
}

export function Updated({ minutes }: { minutes: number }) {
  const label =
    minutes < 90
      ? `${minutes} min ago`
      : minutes < 2880
        ? `${Math.round(minutes / 60)} h ago`
        : `${Math.round(minutes / 1440)} days ago`;
  return <span className="num text-[0.75rem] text-ink-2">Updated {label}</span>;
}

