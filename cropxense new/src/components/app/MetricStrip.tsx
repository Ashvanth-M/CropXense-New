import { cx } from "@/lib/cx";

export type Metric = {
  id: string;
  label: string;
  value: number;
  delta: string;
};

/**
 * One hairline band divided into compartments — not a row of cards.
 * Selecting a compartment filters the screen below it.
 */
export function MetricStrip({
  metrics,
  selected,
  onSelect,
  loading,
}: {
  metrics: Metric[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  loading?: boolean;
}) {
  return (
    <div
      className="grid grid-cols-2 border border-line bg-surface sm:grid-cols-3 lg:grid-cols-6"
      role="group"
      aria-label="Surveillance totals"
    >
      {metrics.map((m, i) => {
        const active = selected === m.id;
        return (
          <button
            key={m.id}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(active ? null : m.id)}
            className={cx(
              "min-h-[64px] border-line px-3 py-2 text-left transition-colors",
              i > 0 && "border-t lg:border-t-0 lg:border-l",
              i % 2 === 1 && "border-l sm:border-l",
              i % 3 === 0 && "sm:border-l-0 lg:border-l",
              active ? "bg-surface-2" : "hover:bg-surface-2/60",
            )}
          >
            <span className="text-caption block">{m.label}</span>
            <span className="num block text-[1.75rem] leading-[1.15] text-ink">
              {loading ? "—" : m.value}
            </span>
            <span className="block text-[0.75rem] text-ink-2">{m.delta}</span>
          </button>
        );
      })}
    </div>
  );
}
