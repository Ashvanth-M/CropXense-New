import type { ReactNode } from "react";
import { Camera, CloudRain, Cpu, History, Bug } from "lucide-react";
import type { CaseStatus, RiskLevel, SignalChannel } from "@/types";
import { cx } from "@/lib/cx";
import { useT } from "@/i18n";

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

export function ChannelIcons({ channels }: { channels: SignalChannel[] }) {
  const { tChannel } = useT();
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Detected via ${channels.map((c) => tChannel(c)).join(", ")}`}>
      {channels.map((c) => {
        const Icon = CHANNEL_ICON[c];
        return <Icon key={c} className="size-[13px] text-ink-2" aria-hidden />;
      })}
    </span>
  );
}

export function ChannelTag({ channel }: { channel: SignalChannel }) {
  const { tChannel } = useT();
  const Icon = CHANNEL_ICON[channel];
  return (
    <span className="inline-flex items-center gap-1 border border-line px-1.5 py-0.5 text-[0.75rem] text-ink-2">
      <Icon className="size-[13px]" aria-hidden />
      {tChannel(channel)}
    </span>
  );
}

/** Case status pill — shape + colour + text, never colour alone. */
export function CaseStatusChip({ status }: { status: CaseStatus }) {
  const { tStatus } = useT();
  const map: Record<CaseStatus, { tone: string; glyph: string }> = {
    detected: { tone: "var(--ink-2)", glyph: "○" },
    awaiting_validation: { tone: "var(--amber)", glyph: "◧" },
    expert_confirmed: { tone: "var(--leaf)", glyph: "✓" },
    field_confirmed: { tone: "var(--forest)", glyph: "✓✓" },
    rejected: { tone: "var(--ink-2)", glyph: "×" },
    resolved: { tone: "var(--water)", glyph: "◼" },
  };
  const s = map[status] ?? { tone: "var(--ink-2)", glyph: "○" };
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap border px-1.5 py-0.5 text-[0.75rem] font-semibold"
      style={{ color: s.tone, borderColor: s.tone }}
    >
      <span aria-hidden>{s.glyph}</span>
      {tStatus(status)}
    </span>
  );
}

export function RiskChip({ risk }: { risk: RiskLevel }) {
  const { tRisk } = useT();
  const map: Record<RiskLevel, { tone: string; glyph: string }> = {
    high: { tone: "var(--alert)", glyph: "▲" },
    moderate: { tone: "var(--amber)", glyph: "■" },
    low: { tone: "var(--leaf)", glyph: "●" },
  };
  const s = map[risk] ?? { tone: "var(--leaf)", glyph: "●" };
  return (
    <span className="inline-flex items-center gap-1 text-[0.8125rem] font-semibold" style={{ color: s.tone }}>
      <span aria-hidden>{s.glyph}</span>
      {tRisk(risk)}
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
