import { useMemo, useState } from "react";
import { cx } from "@/lib/cx";
import { buildLattice, buildParcels, polyline, type Pt } from "./geometry";
import { ASSESSMENT, CONFIDENCE, SIGNALS, STATUS_LINE, STEPS } from "./data";
import { CYCLE_TICKS, useCycle, useInView, usePrefersReducedMotion } from "./useCycle";

type Variant = "hero" | "band" | "static";

const CHANNEL_COLOR: Record<string, string> = {
  image: "var(--ink-2)",
  sensor: "var(--soil)",
  weather: "var(--water)",
  trap: "var(--amber)",
  history: "var(--leaf)",
};

/* ---------- geometry per variant ---------- */

function heroGeometry() {
  const W = 720;
  const H = 520;
  const rows = 4;
  const cols = 4;
  const lat = buildLattice(rows, cols, W, H, 26, 36, 11);
  const parcels = buildParcels(lat, rows, cols);
  const target = parcels.find((p) => p.r === 2 && p.c === 2)!;
  const P = (r: number, c: number) => lat[r]![c]!;

  const routes: { key: string; label: string; entry: Pt; pts: Pt[] }[] = [
    {
      key: "image",
      label: "IMAGE",
      entry: { x: P(0, 1).x, y: -6 },
      pts: [P(0, 1), P(1, 1), P(1, 2), P(2, 2), target.centroid],
    },
    {
      key: "sensor",
      label: "SENSOR",
      entry: { x: -6, y: P(3, 0).y },
      pts: [P(3, 0), P(3, 1), P(3, 2), target.centroid],
    },
    {
      key: "weather",
      label: "WEATHER",
      entry: { x: P(0, 3).x, y: -6 },
      pts: [P(0, 3), P(1, 3), P(2, 3), target.centroid],
    },
    {
      key: "trap",
      label: "PEST TRAP",
      entry: { x: P(4, 3).x, y: H + 6 },
      pts: [P(4, 3), P(3, 3), target.centroid],
    },
    {
      key: "history",
      label: "HISTORY",
      entry: { x: W + 6, y: P(2, 4).y },
      pts: [P(2, 4), P(3, 4), P(3, 3), target.centroid],
    },
  ];

  const channels = routes.map((r) => ({ ...r, d: polyline([r.entry, ...r.pts]) }));

  const canal = `M${-4} ${H * 0.68} C ${W * 0.22} ${H * 0.58}, ${W * 0.32} ${H * 0.86}, ${W * 0.55} ${H * 0.74} S ${W * 0.86} ${H * 0.5}, ${W + 4} ${H * 0.6}`;

  return { W, H, parcels, channels, target, canal };
}

function bandGeometry() {
  const W = 960;
  const H = 120;
  const rows = 1;
  const cols = 9;
  const lat = buildLattice(rows, cols, W, H, 14, 9, 23);
  const parcels = buildParcels(lat, rows, cols);
  const target = parcels[4]!;
  const P = (r: number, c: number) => lat[r]![c]!;

  const channels = [0, 2, 4, 6, 8].map((c, i) => {
    const entryCol = P(1, c);
    const pts: Pt[] = [
      { x: entryCol.x, y: H + 6 },
      entryCol,
      P(1, 4),
      target.centroid,
    ];
    return {
      key: SIGNALS[i]!.key,
      label: SIGNALS[i]!.label,
      entry: { x: entryCol.x, y: H + 6 },
      pts,
      d: polyline(pts),
    };
  });

  const canal = `M-4 ${H * 0.5} C ${W * 0.3} ${H * 0.3}, ${W * 0.6} ${H * 0.8}, ${W + 4} ${H * 0.45}`;
  return { W, H, parcels, channels, target, canal };
}

/* ---------- fills ---------- */

function parcelFill(i: number, isTarget: boolean) {
  if (isTarget) return "color-mix(in srgb, var(--alert) 14%, transparent)";
  if (i === 1 || i === 7 || i === 12) return "color-mix(in srgb, var(--leaf) 8%, transparent)";
  if (i === 3) return "color-mix(in srgb, var(--amber) 12%, transparent)";
  return "none";
}

/* ---------- component ---------- */

export function SignalWeave({
  variant = "hero",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>();
  const [paused, setPaused] = useState(false);

  const isStatic = variant === "static" || reduced;
  const running = !isStatic && !paused && inView;
  const tick = useCycle(running);
  const frame = isStatic ? CYCLE_TICKS - 1 : tick;

  const geo = useMemo(() => (variant === "band" ? bandGeometry() : heroGeometry()), [variant]);
  const { W, H, parcels, channels, target, canal } = geo;

  const activeStep = Math.min(4, Math.max(0, Math.floor((frame - 8) / 10)));

  const svg = (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block h-auto w-full"
      role="img"
      aria-label="Village parcel map with five signal channels converging on one plot under observation."
    >
      <g>
        {parcels.map((p, i) => {
          const isTarget = p === target;
          return (
            <path
              key={`${p.r}-${p.c}`}
              d={p.d}
              fill={parcelFill(i, isTarget)}
              stroke="var(--line)"
              strokeWidth={variant === "band" ? 1.1 : 1.2}
            />
          );
        })}
      </g>

      <path
        d={canal}
        fill="none"
        stroke="var(--water)"
        strokeWidth="1"
        strokeDasharray="5 4"
        opacity="0.65"
      />

      {variant !== "band" &&
        parcels.map((p) => (
          p === target ? null : <text
            key={`t-${p.r}-${p.c}`}
            x={p.centroid.x}
            y={p.centroid.y}
            textAnchor="middle"
            fontSize="9"
            fill="var(--ink-2)"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {p.id}
          </text>
        ))}

      <g>
        {channels.map((ch, i) => (
          <g key={ch.key}>
            <path d={ch.d} fill="none" stroke={CHANNEL_COLOR[ch.key]} strokeWidth="1" opacity="0.5" />
            {!isStatic && (
              <>
                <path
                  d={ch.d}
                  pathLength={100}
                  fill="none"
                  stroke={CHANNEL_COLOR[ch.key]}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  className={cx("sw-tail", !running && "sw-paused")}
                  style={{ animationDelay: `${i * 0.4}s` }}
                />
                <circle
                  r="3"
                  fill={CHANNEL_COLOR[ch.key]}
                  className={cx("sw-dot", !running && "sw-paused")}
                  style={{ offsetPath: `path("${ch.d}")`, animationDelay: `${i * 0.4}s` }}
                />
              </>
            )}
          </g>
        ))}
      </g>

      {variant !== "band" &&
        channels.map((ch) => (
          <text
            key={`l-${ch.key}`}
            x={Math.min(Math.max(ch.entry.x, 34), W - 34)}
            y={Math.min(Math.max(ch.entry.y, 14), H - 6)}
            textAnchor={ch.entry.x > W - 10 ? "end" : ch.entry.x < 10 ? "start" : "middle"}
            fontSize="9"
            fill="var(--ink-2)"
            letterSpacing="0.08em"
            style={{ fontFamily: "var(--font-sans)", fontWeight: 600 }}
          >
            {ch.label}
          </text>
        ))}

      {/* convergence node — same geometry as the logo mark */}
      <g
        transform={`translate(${target.centroid.x} ${target.centroid.y})`}
        className={cx("sw-reticle", !running && "sw-paused")}
      >
        <rect x="-24" y="-24" width="48" height="48" fill="none" stroke="var(--alert)" strokeWidth="1.5" pathLength={100} />
        <path d="M-24 -24 L24 24 M24 -24 L-24 24" stroke="var(--alert)" strokeWidth="1" pathLength={100} />
        <circle cx="-3" cy="3" r="3.2" fill="var(--alert)" />
      </g>
    </svg>
  );

  if (variant === "band") {
    return (
      <div ref={ref} className={cx("border-y border-line bg-paper", className)}>
        {svg}
      </div>
    );
  }

  return (
    <div ref={ref} className={cx("relative", className)}>
      <div className="grid gap-3 lg:grid-cols-[3fr_2fr]">
        <div className="border border-line bg-paper p-2">{svg}</div>
        <Readout frame={frame} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1 sm:grid-cols-5">
        {STEPS.map((s, i) => (
          <div
            key={s}
            aria-current={i === activeStep ? "step" : undefined}
            className={cx(
              "border border-line px-2 py-2 text-center text-[0.75rem] font-semibold uppercase tracking-[0.08em] transition-colors rounded-[var(--r)]",
              i === activeStep ? "bg-forest text-paper border-forest" : "bg-surface text-ink-2",
            )}
          >
            {s}
          </div>
        ))}
      </div>

      {!isStatic && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            className="min-h-[44px] px-2 text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-ink-2 hover:text-ink"
          >
            {paused ? "Play" : "Pause"} signal cycle
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- readout ---------- */

function typed(text: string, start: number, frame: number) {
  if (frame < start) return "";
  const p = Math.min(1, (frame - start) / 4);
  return text.slice(0, Math.ceil(text.length * p));
}

function Readout({ frame }: { frame: number }) {
  const confShown = frame >= 44 ? Math.round(CONFIDENCE * Math.min(1, (frame - 44) / 4)) : 0;

  return (
    <div className="flex flex-col border border-line bg-surface p-3" aria-live="polite">
      <p className="text-caption">Field readout</p>
      <dl className="mt-2 space-y-2">
        {SIGNALS.map((s, i) => {
          const start = 6 + i * 8;
          return (
            <div key={s.key} className="grid grid-cols-[96px_1fr] gap-2">
              <dt className="text-caption pt-[2px]">{s.label}</dt>
              <dd className="num text-[0.8125rem] leading-snug text-ink min-h-[1.2em]">
                {typed(s.text, start, frame)}
                {frame >= start && frame < start + 4 ? (
                  <span className="text-ink-2">▌</span>
                ) : null}
              </dd>
            </div>
          );
        })}
      </dl>

      <hr className="my-3 border-0 border-t border-line" />

      <dl className="space-y-2">
        <div className="grid grid-cols-[96px_1fr] gap-2">
          <dt className="text-caption pt-[2px]">Assessment</dt>
          <dd className="num text-[0.8125rem] text-ink min-h-[1.2em]">
            {frame >= 44 ? `${ASSESSMENT}  ·  confidence ${confShown}%` : ""}
          </dd>
        </div>
        <div className="grid grid-cols-[96px_1fr] gap-2">
          <dt className="text-caption pt-[2px]">Status</dt>
          <dd className="num text-[0.8125rem] text-amber min-h-[1.2em]">
            {frame >= 50 ? STATUS_LINE : ""}
          </dd>
        </div>
      </dl>
    </div>
  );
}
