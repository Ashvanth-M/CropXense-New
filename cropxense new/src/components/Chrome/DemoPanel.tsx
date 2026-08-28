import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { ListOrdered, RotateCcw, X } from "lucide-react";
import { resetStore } from "@/services";
import { useToast } from "@/components/ui/Toast";

type Step = {
  n: number;
  label: string;
  detail: string;
  to: string;
  /** element carrying data-demo="<key>" on the destination page */
  target?: string;
};

const STEPS: Step[] = [
  { n: 1, label: "District overview", detail: "Start on the officer overview: 118 fields monitored, 31 at risk, 12 cases awaiting a human verdict.", to: "/app", target: "metrics" },
  { n: 2, label: "Open a field register", detail: "Find Shree Ganesh Farm in Akola in the field register and open its full record.", to: "/app/fields", target: "register" },
  { n: 3, label: "Run a crop health check", detail: "Walk the five steps with the sample cotton image: image, crop, stage, symptoms, analysis.", to: "/app/crop-health", target: "wizard" },
  { n: 4, label: "Read the assessment", detail: "Confidence, differentials and the evidence behind them — an assessment, not a confirmed diagnosis.", to: "/app/crop-health", target: "wizard" },
  { n: 5, label: "Weather risk for the district", detail: "The 7-day timeline shows why the risk is rising: leaf wetness, RH and rainfall against the crop stage.", to: "/app/forecast", target: "timeline" },
  { n: 6, label: "Nearby trap activity", detail: "Trap counts against the economic threshold corroborate the image finding.", to: "/app/traps", target: "traps" },
  { n: 7, label: "Generate an advisory", detail: "IPM guidance in Marathi, Hindi and English — cultural and biological before chemical.", to: "/app/advisories", target: "advisories" },
  { n: 8, label: "Send for expert validation", detail: "The case leaves the field and enters the pathologist's queue.", to: "/app/crop-health", target: "wizard" },
  { n: 9, label: "Surveillance map hotspot", detail: "The case joins the district cluster on the GIS map alongside sensors and traps.", to: "/app/map", target: "map" },
  { n: 10, label: "Officer queue", detail: "The case is waiting in the review console with its evidence attached.", to: "/app/validation", target: "queue" },
  { n: 11, label: "Validate the case", detail: "Confirm, correct with a mandatory note, or return it to the farmer with questions.", to: "/app/validation", target: "queue" },
  { n: 12, label: "Follow-up timeline", detail: "The field record shows the whole chain: detection, review, advisory, follow-up.", to: "/app/farms/F-AKO-001", target: "timeline" },
];

function highlight(target: string) {
  let tries = 0;
  const tick = () => {
    const el = document.querySelector<HTMLElement>(`[data-demo="${target}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("demo-highlight");
      window.setTimeout(() => el.classList.remove("demo-highlight"), 2600);
      return;
    }
    if (tries++ < 12) window.setTimeout(tick, 250);
  };
  tick();
}

export function DemoPanel() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(1);
  const router = useRouter();
  const { toast } = useToast();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const run = useCallback(
    (s: Step) => {
      setCurrent(s.n);
      void router.navigate({ to: s.to }).then(() => {
        if (s.target) highlight(s.target);
      });
    },
    [router],
  );

  const next = STEPS.find((s) => s.n === current + 1);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--r)] border border-amber px-3 text-[0.875rem] font-semibold text-amber transition-colors hover:bg-amber/15"
      >
        <ListOrdered className="size-4" aria-hidden />
        Demo
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Guided demo"
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[380px] flex-col border-l border-line bg-surface text-ink"
        >
          <header className="flex items-start justify-between gap-2 border-b border-line px-4 py-3">
            <div>
              <h2 className="font-display text-[1.125rem] leading-tight">Guided demo</h2>
              <p className="text-[0.8125rem] text-ink-2">
                One case, end to end: field photograph to validated record.
              </p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close guided demo"
              className="inline-flex size-11 items-center justify-center rounded-[var(--r)] border border-line"
            >
              <X className="size-4" aria-hidden />
            </button>
          </header>

          <ol className="min-h-0 flex-1 overflow-y-auto">
            {STEPS.map((s) => {
              const active = s.n === current;
              return (
                <li key={s.n} className="border-b border-line">
                  <button
                    type="button"
                    onClick={() => run(s)}
                    aria-current={active ? "step" : undefined}
                    className="flex w-full min-h-[44px] gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2"
                    style={active ? { background: "var(--surface-2)", boxShadow: "inset 3px 0 0 var(--forest)" } : undefined}
                  >
                    <span className="num mt-[2px] inline-flex size-6 shrink-0 items-center justify-center border border-line text-[0.75rem]">
                      {s.n}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.9375rem] font-semibold">{s.label}</span>
                      <span className="block text-[0.8125rem] text-ink-2">{s.detail}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <footer className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3">
            {next ? (
              <button
                type="button"
                onClick={() => run(next)}
                className="inline-flex min-h-[44px] items-center rounded-[var(--r)] bg-forest px-3 text-[0.875rem] font-semibold text-paper"
              >
                Next — {next.n}. {next.label}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => run(STEPS[0]!)}
                className="inline-flex min-h-[44px] items-center rounded-[var(--r)] bg-forest px-3 text-[0.875rem] font-semibold text-paper"
              >
                Start again
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                resetStore();
                setCurrent(1);
                toast("Demo data reset to the seeded state");
              }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--r)] border border-line px-3 text-[0.875rem] font-semibold"
            >
              <RotateCcw className="size-4" aria-hidden />
              Reset demo data
            </button>
          </footer>
        </div>
      ) : null}
    </>
  );
}
