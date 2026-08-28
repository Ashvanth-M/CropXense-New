import { useId, useState } from "react";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export function Tabs({
  tabs,
  initial = 0,
}: {
  tabs: { label: string; content: ReactNode }[];
  initial?: number;
}) {
  const [active, setActive] = useState(initial);
  const base = useId();

  return (
    <div>
      <div role="tablist" className="flex flex-wrap gap-1 border-b border-line">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            role="tab"
            id={`${base}-tab-${i}`}
            aria-selected={active === i}
            aria-controls={`${base}-panel-${i}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") setActive((a) => (a + 1) % tabs.length);
              if (e.key === "ArrowLeft") setActive((a) => (a - 1 + tabs.length) % tabs.length);
            }}
            className={cx(
              "min-h-[44px] px-3 text-[0.9375rem] font-semibold -mb-px border-b-2 transition-colors",
              active === i
                ? "border-forest text-ink"
                : "border-transparent text-ink-2 hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div
          key={t.label}
          role="tabpanel"
          id={`${base}-panel-${i}`}
          aria-labelledby={`${base}-tab-${i}`}
          hidden={active !== i}
          className="pt-3"
        >
          {active === i ? t.content : null}
        </div>
      ))}
    </div>
  );
}
