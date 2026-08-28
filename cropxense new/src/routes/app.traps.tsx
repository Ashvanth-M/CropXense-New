import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Select, Checkbox } from "@/components/ui/Field";
import { Drawer } from "@/components/ui/Overlay";
import { Skeleton, EmptyState } from "@/components/ui/Card";
import { Panel, Updated } from "@/components/app/bits";
import { useAsync } from "@/hooks/useAsync";
import { trapWeeklySeries, weekOverWeekChange } from "@/data/instrumentSeries";
import { DISTRICTS, PESTS, districtName, farmById, getTrapReadings, getTraps, threatName } from "@/services";
import type { PestTrap } from "@/types";
import { cx } from "@/lib/cx";

export const Route = createFileRoute("/app/traps")({
  head: () => ({
    meta: [
      { title: "Pest traps — CropXense trap network" },
      {
        name: "description",
        content:
          "Pheromone, light and sticky trap counts against economic threshold levels, with weekly trend and flagged hotspots.",
      },
      { property: "og:title", content: "Pest traps — CropXense" },
      {
        property: "og:description",
        content: "Trap counts against economic threshold levels district by district, with hotspot clusters.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrapsPage,
});

type Level = "below" | "approaching" | "above";

function levelFor(count: number, etl: number): Level {
  if (count >= etl) return "above";
  if (count >= etl * 0.8) return "approaching";
  return "below";
}

const LEVEL: Record<Level, { label: string; tone: string; glyph: string }> = {
  below: { label: "Below threshold", tone: "var(--leaf)", glyph: "●" },
  approaching: { label: "Approaching", tone: "var(--amber)", glyph: "■" },
  above: { label: "Above threshold", tone: "var(--alert)", glyph: "▲" },
};

function TrapLevelChip({ level }: { level: Level }) {
  const s = LEVEL[level];
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap border px-1.5 py-0.5 text-[0.75rem] font-semibold uppercase tracking-wide"
      style={{ color: s.tone, borderColor: s.tone }}
    >
      <span aria-hidden>{s.glyph}</span>
      {s.label}
    </span>
  );
}

function Trend({ pct }: { pct: number }) {
  const up = pct > 0;
  const flat = pct === 0;
  const tone = flat ? "var(--ink-2)" : up ? "var(--alert)" : "var(--leaf)";
  const Icon = flat ? Minus : up ? ArrowUp : ArrowDown;
  return (
    <span className="num inline-flex items-center gap-1 text-[0.8125rem] font-semibold" style={{ color: tone }}>
      <Icon className="size-3.5" aria-hidden />
      {up ? "+" : ""}
      {pct}% vs last week
    </span>
  );
}

type Row = {
  id: string;
  village: string;
  districtId: string;
  species: string;
  count: number;
  etl: number;
  level: Level;
  wow: number;
  raw: PestTrap;
};

function TrapsPage() {
  const [districtId, setDistrictId] = useState("");
  const [pestId, setPestId] = useState("");
  const [overOnly, setOverOnly] = useState(false);
  const [open, setOpen] = useState<PestTrap | null>(null);

  const trapsQ = useAsync(() => getTraps(districtId || undefined), [districtId]);
  const readingsQ = useAsync(() => getTrapReadings(), []);

  const rows: Row[] = useMemo(() => {
    const readings = readingsQ.data ?? [];
    return (trapsQ.data ?? [])
      .filter((t) => !pestId || t.pestId === pestId)
      .map((t) => {
        const series = readings.filter((r) => r.trapId === t.id);
        const last = series[series.length - 1];
        const count = last?.count ?? 0;
        const etl = last?.threshold ?? 1;
        const level = levelFor(count, etl);
        const weekly = trapWeeklySeries(t.id, etl, level !== "below");
        const farm = farmById(t.farmId);
        return {
          id: t.id,
          village: farm?.village ?? "—",
          districtId: t.districtId,
          species: threatName(t.pestId),
          count,
          etl,
          level,
          wow: weekOverWeekChange(weekly),
          raw: t,
        };
      })
      .filter((r) => !overOnly || r.level === "above");
  }, [trapsQ.data, readingsQ.data, pestId, overOnly]);

  const hotspots = useMemo(() => {
    const above = rows.filter((r) => r.level === "above");
    const groups = new Map<string, { village: string; district: string; count: number }>();
    for (const r of above) {
      const key = `${r.districtId}-${r.village}`;
      const g = groups.get(key) ?? { village: r.village, district: districtName(r.districtId), count: 0 };
      g.count += 1;
      groups.set(key, g);
    }
    return [...groups.values()].sort((a, b) => b.count - a.count).slice(0, 6);
  }, [rows]);

  const overThreshold = rows.filter((r) => r.level === "above").length;

  const detailFarm = open ? farmById(open.farmId) : undefined;
  const detailReadings = readingsQ.data?.filter((r) => r.trapId === open?.id) ?? [];
  const detailLast = detailReadings[detailReadings.length - 1];
  const detailWeekly = open
    ? trapWeeklySeries(open.id, detailLast?.threshold ?? 1, levelFor(detailLast?.count ?? 0, detailLast?.threshold ?? 1) !== "below")
    : [];

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.5rem]">Pest traps</h1>
          <p className="text-[0.875rem] text-ink-2">
            Trap counts against the economic threshold level (ETL), by field and village.
          </p>
        </div>
        <Updated minutes={48} />
      </header>

      <div className="grid gap-2 border border-line bg-surface p-3 sm:grid-cols-4">
        <Select
          label="District"
          value={districtId}
          onChange={(e) => setDistrictId(e.target.value)}
          options={[{ value: "", label: "All districts" }, ...DISTRICTS.map((d) => ({ value: d.id, label: d.name }))]}
        />
        <Select
          label="Species"
          value={pestId}
          onChange={(e) => setPestId(e.target.value)}
          options={[{ value: "", label: "All species" }, ...PESTS.map((p) => ({ value: p.id, label: p.name }))]}
        />
        <div className="flex items-end">
          <Checkbox label="Over threshold only" checked={overOnly} onChange={(e) => setOverOnly(e.currentTarget.checked)} />
        </div>
        <div className="flex flex-col justify-end">
          <p className="text-caption">Above economic threshold</p>
          <p className="num text-[1.25rem]">
            {overThreshold} of {rows.length} traps
          </p>
        </div>
      </div>

      <Panel title="Flagged hotspots" meta="top villages, crossed threshold in the last 7 days">
        {trapsQ.loading || readingsQ.loading ? (
          <div className="space-y-2 p-3">
            <Skeleton className="h-10 w-full" />
          </div>
        ) : hotspots.length === 0 ? (
          <p className="p-4 text-[0.875rem] text-ink-2">No village cluster has crossed threshold in the last 7 days.</p>
        ) : (
          <ul className="divide-y divide-line">
            {hotspots.map((h) => (
              <li key={`${h.district}-${h.village}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <div>
                  <p className="text-[0.9375rem] font-semibold">{h.village}</p>
                  <p className="text-[0.8125rem] text-ink-2">{h.district}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="num text-[0.9375rem] font-semibold text-alert">{h.count} {h.count === 1 ? "trap" : "traps"} over ETL</span>
                  <Link to="/app/map" className="text-[0.8125rem] underline underline-offset-2 hover:text-ink">
                    View on surveillance map
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Trap network" meta={`${rows.length} traps`} bodyClassName="overflow-x-auto">
        {trapsQ.loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-3">
            <EmptyState title="No traps match these filters" body="Clear a filter to see more of the trap network." />
          </div>
        ) : (
          <table className="w-full min-w-[760px] border-collapse text-[0.875rem]">
            <caption className="sr-only">
              Installed pest traps with current catch count, economic threshold and week-over-week trend
            </caption>
            <thead className="bg-surface-2">
              <tr>
                {["Trap ID", "Village", "Species", "Count", "ETL", "Status", "Trend"].map((h) => (
                  <th key={h} scope="col" className="text-caption px-3 py-2 text-left">
                    {h}
                  </th>
                ))}
                <th scope="col" className="text-caption px-3 py-2 text-left">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td
                    className={cx("px-3 py-2 align-middle", r.level === "above" && "border-l-[3px]")}
                    style={r.level === "above" ? { borderLeftColor: "var(--alert)" } : undefined}
                  >
                    <button
                      type="button"
                      onClick={() => setOpen(r.raw)}
                      className="num text-left text-[0.8125rem] underline-offset-2 hover:underline"
                    >
                      {r.id}
                    </button>
                    <span className="sr-only">
                      {r.species} · count {r.count} · ETL {r.etl} · {LEVEL[r.level].label.toUpperCase()} · {r.wow > 0 ? "up" : "down"}{" "}
                      {Math.abs(r.wow)}% vs last week
                    </span>
                  </td>
                  <td className="px-3 py-2 align-middle">{r.village}</td>
                  <td className="px-3 py-2 align-middle">{r.species}</td>
                  <td className="num px-3 py-2 align-middle text-[1.0625rem] font-semibold">{r.count}</td>
                  <td className="num px-3 py-2 align-middle text-ink-2">{r.etl}</td>
                  <td className="px-3 py-2 align-middle">
                    <TrapLevelChip level={r.level} />
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <Trend pct={r.wow} />
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <button
                      type="button"
                      onClick={() => setOpen(r.raw)}
                      className="min-h-[36px] border border-line px-3 text-[0.8125rem] hover:bg-surface-2"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Drawer
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title={open ? `${open.id} — ${threatName(open.pestId)}` : ""}
      >
        {open ? (
          <div className="flex flex-col gap-4 text-[0.875rem]">
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 border border-line p-2">
              <div>
                <dt className="text-caption">Field</dt>
                <dd>
                  {detailFarm ? (
                    <Link to="/app/farms/$id" params={{ id: detailFarm.id }} className="underline underline-offset-2 hover:text-ink">
                      {detailFarm.name}
                    </Link>
                  ) : (
                    open.farmId
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-caption">Village</dt>
                <dd>{detailFarm?.village ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-caption">District</dt>
                <dd>{districtName(open.districtId)}</dd>
              </div>
              <div>
                <dt className="text-caption">Trap type</dt>
                <dd className="capitalize">{open.type}</dd>
              </div>
              <div>
                <dt className="text-caption">Lure / servicing</dt>
                <dd className="capitalize">{open.status.replace(/_/g, " ")}</dd>
              </div>
              <div>
                <dt className="text-caption">Installed</dt>
                <dd className="num">{open.installedOn}</dd>
              </div>
            </dl>

            <section>
              <p className="text-caption mb-1">Seven-week catch vs economic threshold</p>
              {readingsQ.loading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart data={detailWeekly} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid stroke="var(--line)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} stroke="var(--ink-2)" />
                      <YAxis tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} stroke="var(--ink-2)" allowDecimals={false} />
                      <RTooltip
                        contentStyle={{ border: "1px solid var(--line)", borderRadius: 3, fontSize: 12 }}
                        formatter={(v: number, key: string) => [v, key === "count" ? "Catch" : key]}
                      />
                      <ReferenceLine
                        y={detailLast?.threshold ?? 0}
                        stroke="var(--ink)"
                        strokeDasharray="4 3"
                        label={{ value: "ETL", position: "right", fontSize: 11, fill: "var(--ink-2)" }}
                      />
                      <Bar dataKey="count" radius={[1, 1, 0, 0]}>
                        {detailWeekly.map((d, i) => (
                          <Cell key={i} fill={d.count >= d.etl ? "var(--alert)" : "var(--leaf)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <p className="mt-1 text-[0.75rem] text-ink-2">Dashed line marks the economic threshold level for this trap.</p>
            </section>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
