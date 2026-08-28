import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "@/lib/cx";
import { Button } from "@/components/ui/Button";
import { ConfidenceBar, StatusChip } from "@/components/ui/Status";
import { useToast } from "@/components/ui/Toast";

const LESIONS = [
  { cx: 96, cy: 118, rx: 21, ry: 14, rot: -18 },
  { cx: 150, cy: 84, rx: 14, ry: 10, rot: 12 },
  { cx: 134, cy: 168, rx: 17, ry: 11, rot: 26 },
  { cx: 74, cy: 176, rx: 10, ry: 7, rot: -6 },
];

/** Schematic cotton leaf. Not a photograph — a diagram of the sample. */
function LeafPlate({ analysis }: { analysis: boolean }) {
  return (
    <svg
      viewBox="0 0 240 240"
      className="block h-auto w-full"
      role="img"
      aria-label={
        analysis
          ? "Analysis view: four lesion regions marked on the cotton leaf sample"
          : "Original view: cotton leaf sample as submitted"
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

      {LESIONS.map((l, i) => (
        <ellipse
          key={i}
          cx={l.cx}
          cy={l.cy}
          rx={l.rx}
          ry={l.ry}
          transform={`rotate(${l.rot} ${l.cx} ${l.cy})`}
          fill="var(--soil)"
          fillOpacity={analysis ? 0.5 : 0.42}
          stroke="var(--soil)"
          strokeWidth="0.8"
        />
      ))}

      {analysis &&
        LESIONS.map((l, i) => {
          const x = l.cx - l.rx - 8;
          const y = l.cy - l.ry - 8;
          const w = (l.rx + 8) * 2;
          const h = (l.ry + 8) * 2;
          return (
            <g key={`b${i}`}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill="none"
                stroke="var(--alert)"
                strokeWidth="1.2"
              />
              {([
                [x, y, 1, 1],
                [x + w, y, -1, 1],
                [x, y + h, 1, -1],
                [x + w, y + h, -1, -1],
              ] as const).map(([px, py, sx, sy], k) => (
                <path
                  key={k}
                  d={`M${px} ${py + sy * 7} L${px} ${py} L${px + sx * 7} ${py}`}
                  stroke="var(--alert)"
                  strokeWidth="2.4"
                  fill="none"
                />
              ))}
              <text
                x={x}
                y={y - 4}
                className="num"
                fontSize="8"
                fill="var(--alert)"
                letterSpacing="0.06em"
              >
                L{i + 1}
              </text>
            </g>
          );
        })}

      {analysis && (
        <text x="8" y="232" className="num" fontSize="8.5" fill="var(--ink-2)">
          affected area 11.4% · 4 regions
        </text>
      )}
    </svg>
  );
}

const EVIDENCE = [
  ["Lesion morphology", "Angular, vein-bounded lesions with tan centres — consistent with bacterial blight, not target spot."],
  ["Leaf wetness", "11.2 h continuous wetness in the last 24 h, above the 10 h infection threshold."],
  ["Weather", "34 mm rainfall over 48 h with RH 88% — infection-favourable."],
  ["Local history", "4 confirmed bacterial blight cases within 6 km in the last 21 days."],
  ["Counter-evidence", "No water-soaked margins visible at this resolution; target spot cannot be fully excluded."],
];

export function LeafAnalysisCard() {
  const [view, setView] = useState<"original" | "analysis">("analysis");
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const panelId = useId();

  return (
    <div className="grid gap-0 border border-line bg-surface md:grid-cols-2">
      <div className="border-b border-line p-3 md:border-b-0 md:border-e">
        <div
          role="tablist"
          aria-label="Sample view"
          className="mb-3 inline-flex border border-line"
        >
          {(["original", "analysis"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cx(
                "min-h-[36px] px-3 text-[0.8125rem] font-semibold capitalize transition-colors",
                view === v ? "bg-forest text-surface" : "bg-surface text-ink-2 hover:bg-surface-2",
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <LeafPlate analysis={view === "analysis"} />
        <p className="mt-2 text-[0.75rem] text-ink-2">
          Sample MH-JAL-24118 · cotton · uploaded by field officer · schematic rendering of the
          submitted image.
        </p>
      </div>

      <div className="p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-caption">Assessment</p>
            <h3 className="mt-1 text-[1.25rem]">Cotton bacterial blight — moderate</h3>
          </div>
          <StatusChip status="unconfirmed" />
        </div>

        <div className="mt-3">
          <ConfidenceBar value={86} label="Model confidence" />
        </div>
        <p className="mt-2 text-[0.875rem] text-ink-2">
          Provisional. This assessment is not a diagnosis until a plant-protection officer confirms
          it.
        </p>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          className="mt-3 flex min-h-[44px] w-full items-center justify-between border border-line bg-surface-2 px-3 text-[0.9375rem] font-semibold"
        >
          Why this result?
          <ChevronDown
            aria-hidden
            className={cx("size-4 transition-transform", open && "rotate-180")}
          />
        </button>
        <div id={panelId} hidden={!open} className="border border-t-0 border-line px-3 py-2">
          <dl className="grid gap-2 text-[0.875rem]">
            {EVIDENCE.map(([k, v]) => (
              <div key={k}>
                <dt className="text-caption">{k}</dt>
                <dd className="text-ink-2">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-3 border-t border-line pt-3">
          <p className="text-caption">Suggested response — IPM order</p>
          <ol className="mt-1 list-decimal space-y-1 ps-5 text-[0.875rem] text-ink-2">
            <li>Remove and destroy infected leaves; avoid overhead irrigation for 5 days.</li>
            <li>Use certified acid-delinted seed for the next sowing; rotate away from cotton.</li>
            <li>
              Chemical control only if spread continues after inspection — consult your extension
              officer for the product and dose approved for your district.
            </li>
          </ol>
        </div>

        <Button
          className="mt-3 w-full"
          disabled={sent}
          onClick={() => {
            setSent(true);
            toast("Sent for expert review", "healthy");
          }}
        >
          {sent ? "Sent for expert review" : "Send for expert review"}
        </Button>
      </div>
    </div>
  );
}
