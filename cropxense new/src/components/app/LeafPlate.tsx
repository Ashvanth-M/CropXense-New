import { useId, useState } from "react";
import { cx } from "@/lib/cx";

export type Lesion = { cx: number; cy: number; rx: number; ry: number; rot: number; conf: number };

export type Sample = {
  id: string;
  crop: string;
  cropId: string;
  label: string;
  captured: string;
  lesions: Lesion[];
  affected: [number, number];
  threatId: string;
  threat: string;
  confidence: number;
  severity: 1 | 2 | 3 | 4 | 5;
  differentials: { name: string; value: number }[];
};

export const SAMPLES: Sample[] = [
  {
    id: "SMP-01",
    crop: "Cotton",
    cropId: "cotton",
    label: "Cotton leaf, Amravati",
    captured: "2026-08-24 08:12",
    lesions: [
      { cx: 96, cy: 118, rx: 21, ry: 14, rot: -18, conf: 94 },
      { cx: 150, cy: 84, rx: 14, ry: 10, rot: 12, conf: 88 },
      { cx: 134, cy: 168, rx: 17, ry: 11, rot: 26, conf: 91 },
      { cx: 74, cy: 176, rx: 10, ry: 7, rot: -6, conf: 73 },
    ],
    affected: [18, 25],
    threatId: "bacterial_blight",
    threat: "Leaf blight",
    confidence: 92,
    severity: 3,
    differentials: [
      { name: "Bacterial blight", value: 6 },
      { name: "Nutrient deficiency", value: 2 },
    ],
  },
  {
    id: "SMP-02",
    crop: "Soybean",
    cropId: "soybean",
    label: "Soybean leaf, Akola",
    captured: "2026-08-24 09:40",
    lesions: [
      { cx: 118, cy: 96, rx: 24, ry: 16, rot: 8, conf: 86 },
      { cx: 86, cy: 158, rx: 13, ry: 9, rot: -22, conf: 79 },
    ],
    affected: [12, 17],
    threatId: "yellow_mosaic",
    threat: "Yellow mosaic virus",
    confidence: 84,
    severity: 3,
    differentials: [
      { name: "Iron chlorosis", value: 9 },
      { name: "Herbicide injury", value: 4 },
    ],
  },
  {
    id: "SMP-03",
    crop: "Tomato",
    cropId: "tomato",
    label: "Tomato leaf, Nashik",
    captured: "2026-08-23 17:05",
    lesions: [
      { cx: 104, cy: 104, rx: 16, ry: 16, rot: 0, conf: 90 },
      { cx: 152, cy: 140, rx: 12, ry: 12, rot: 0, conf: 83 },
      { cx: 92, cy: 176, rx: 9, ry: 9, rot: 0, conf: 71 },
    ],
    affected: [9, 14],
    threatId: "early_blight",
    threat: "Early blight",
    confidence: 88,
    severity: 2,
    differentials: [
      { name: "Septoria leaf spot", value: 8 },
      { name: "Sun scald", value: 3 },
    ],
  },
  {
    id: "SMP-04",
    crop: "Banana",
    cropId: "banana",
    label: "Banana leaf, Jalgaon",
    captured: "2026-08-23 11:28",
    lesions: [
      { cx: 128, cy: 76, rx: 26, ry: 9, rot: 14, conf: 81 },
      { cx: 108, cy: 132, rx: 30, ry: 8, rot: 10, conf: 77 },
      { cx: 140, cy: 186, rx: 22, ry: 7, rot: 6, conf: 68 },
    ],
    affected: [22, 30],
    threatId: "sigatoka",
    threat: "Sigatoka leaf spot",
    confidence: 79,
    severity: 4,
    differentials: [
      { name: "Cordana leaf spot", value: 12 },
      { name: "Wind tear", value: 5 },
    ],
  },
];

/** Schematic leaf plate. A diagram of the submitted sample, never a stock photograph. */
export function LeafPlate({
  sample,
  analysis,
  className,
}: {
  sample: Sample;
  analysis: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 240 240"
      className={cx("block h-auto w-full", className)}
      role="img"
      aria-label={
        analysis
          ? `Analysis view: ${sample.lesions.length} lesion regions marked on the ${sample.crop.toLowerCase()} leaf sample`
          : `Original view: ${sample.crop.toLowerCase()} leaf sample as submitted`
      }
    >
      <rect width="240" height="240" fill="var(--surface-2)" />
      <g stroke="var(--line)" strokeWidth="0.5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={`v${i}`} x1={i * 48} y1="0" x2={i * 48} y2="240" />
        ))}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={`h${i}`} x1="0" y1={i * 48} x2="240" y2={i * 48} />
        ))}
      </g>

      <path
        d="M120 20 C64 46 34 92 40 140 C46 190 84 216 120 224 C156 216 194 190 200 140 C206 92 176 46 120 20 Z"
        fill="var(--leaf)"
        fillOpacity="0.22"
        stroke="var(--leaf)"
        strokeWidth="1.2"
      />
      <path d="M120 26 L120 222" stroke="var(--leaf)" strokeWidth="1.2" fill="none" />
      {[60, 96, 132, 168].map((y, i) => (
        <g key={y} stroke="var(--leaf)" strokeWidth="0.8" strokeOpacity="0.7" fill="none">
          <path d={`M120 ${y} C96 ${y + 6} 70 ${y + 18} ${52 + i * 3} ${y + 34}`} />
          <path d={`M120 ${y} C144 ${y + 6} 170 ${y + 18} ${188 - i * 3} ${y + 34}`} />
        </g>
      ))}

      {sample.lesions.map((l, i) => (
        <ellipse
          key={i}
          cx={l.cx}
          cy={l.cy}
          rx={l.rx}
          ry={l.ry}
          transform={`rotate(${l.rot} ${l.cx} ${l.cy})`}
          fill={analysis ? "var(--alert)" : "var(--soil)"}
          fillOpacity={analysis ? 0.32 : 0.42}
          stroke={analysis ? "var(--alert)" : "var(--soil)"}
          strokeWidth={analysis ? 1.2 : 0.8}
        />
      ))}

      {analysis &&
        sample.lesions.map((l, i) => {
          const x = l.cx - l.rx - 8;
          const y = l.cy - l.ry - 8;
          const w = (l.rx + 8) * 2;
          const h = (l.ry + 8) * 2;
          return (
            <g key={`b${i}`}>
              <rect x={x} y={y} width={w} height={h} fill="none" stroke="var(--alert)" strokeWidth="1" />
              <text x={x} y={y - 4} className="num" fontSize="8" fill="var(--alert)" letterSpacing="0.06em">
                L{i + 1} {l.conf}%
              </text>
            </g>
          );
        })}

      {analysis ? (
        <text x="8" y="232" className="num" fontSize="8.5" fill="var(--ink-2)">
          affected area {sample.affected[0]}–{sample.affected[1]}% · {sample.lesions.length} regions
        </text>
      ) : (
        <text x="8" y="232" className="num" fontSize="8.5" fill="var(--ink-2)">
          {sample.id} · {sample.captured}
        </text>
      )}
    </svg>
  );
}

/** Segmented Original | Analysis control. */
export function ViewToggle({
  analysis,
  onChange,
}: {
  analysis: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div role="group" aria-label="Image view" className="inline-flex border border-line">
      {[
        { label: "Original", v: false },
        { label: "Analysis", v: true },
      ].map((o) => (
        <button
          key={o.label}
          type="button"
          id={`${id}-${o.label}`}
          aria-pressed={analysis === o.v}
          onClick={() => onChange(o.v)}
          className={cx(
            "min-h-[36px] px-3 text-[0.8125rem] font-semibold transition-colors",
            analysis === o.v ? "bg-forest text-surface" : "bg-surface text-ink-2 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Severity heat legend used beside the analysis view. */
export function HeatLegend() {
  return (
    <div className="flex items-center gap-2 text-[0.75rem] text-ink-2">
      <span>Lesion severity</span>
      <span className="flex" aria-hidden>
        {["#F0E4C8", "#E2C489", "#CFA24B", "#B8820C", "#A6331E"].map((c) => (
          <span key={c} className="block h-[10px] w-6" style={{ background: c }} />
        ))}
      </span>
      <span className="num">low → high</span>
    </div>
  );
}

/** Thumbnail button for the sample picker. */
export function SampleThumb({
  sample,
  selected,
  onSelect,
}: {
  sample: Sample;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cx(
        "flex min-h-[44px] flex-col items-start gap-1 border p-1 text-left transition-colors",
        selected ? "border-forest bg-surface-2" : "border-line bg-surface hover:bg-surface-2",
      )}
    >
      <span className="block w-full">
        <LeafPlate sample={sample} analysis={false} />
      </span>
      <span className="px-1 pb-1 text-[0.75rem] leading-tight text-ink-2">{sample.label}</span>
    </button>
  );
}
