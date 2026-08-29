import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Select, Checkbox } from "@/components/ui/Field";
import { Drawer } from "@/components/ui/Overlay";
import { Skeleton, EmptyState } from "@/components/ui/Card";
import { Panel, Updated } from "@/components/app/bits";
import { useAsync } from "@/hooks/useAsync";
import { trapWeeklySeries, weekOverWeekChange } from "@/data/instrumentSeries";
import { DISTRICTS, PESTS, farmById, getTrapReadings, getTraps, threatName } from "@/services";
import type { PestTrap } from "@/types";
import { cx } from "@/lib/cx";
import { useT } from "@/i18n";

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

const LEVEL: Record<Level, { labelKey: string; tone: string; glyph: string }> = {
  below: { labelKey: "pests.belowThreshold", tone: "var(--leaf)", glyph: "●" },
  approaching: { labelKey: "risk.moderate", tone: "var(--amber)", glyph: "■" },
  above: { labelKey: "pests.aboveThreshold", tone: "var(--alert)", glyph: "▲" },
};

function TrapLevelChip({ level }: { level: Level }) {
  const { t } = useT();
  const s = LEVEL[level];
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap border px-1.5 py-0.5 text-[0.75rem] font-semibold uppercase tracking-wide"
      style={{ color: s.tone, borderColor: s.tone }}
    >
      <span aria-hidden>{s.glyph}</span>
      {t(s.labelKey as any)}
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
      {pct}%
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
  const { t, tDistrict } = useT();
  const [districtId, setDistrictId] = useState("");
  const [pestId, setPestId] = useState("");
  const [overOnly, setOverOnly] = useState(false);
  const [open, setOpen] = useState<PestTrap | null>(null);

  const trapsQ = useAsync(() => getTraps(districtId || undefined), [districtId]);
  const readingsQ = useAsync(() => getTrapReadings(), []);

  const rows: Row[] = useMemo(() => {
    const readings = readingsQ.data ?? [];
    return (trapsQ.data ?? [])
      .filter((tItem) => !pestId || tItem.pestId === pestId)
      .map((tItem) => {
        const series = readings.filter((r) => r.trapId === tItem.id);
        const last = series[series.length - 1];
        const count = last?.count ?? 0;
        const etl = last?.threshold ?? 1;
        const level = levelFor(count, etl);
        const weekly = trapWeeklySeries(tItem.id, etl, level !== "below");
        const farm = farmById(tItem.farmId);
        return {
          id: tItem.id,
          village: farm?.village ?? "—",
          districtId: tItem.districtId,
          species: threatName(tItem.pestId),
          count,
          etl,
          level,
          wow: weekOverWeekChange(weekly),
          raw: tItem,
        };
      })
      .filter((r) => !overOnly || r.level === "above");
  }, [trapsQ.data, readingsQ.data, pestId, overOnly]);

  const hotspots = useMemo(() => {
    const above = rows.filter((r) => r.level === "above");
    const groups = new Map<string, { village: string; district: string; count: number }>();
    for (const r of above) {
      const key = `${r.districtId}-${r.village}`;
      const g = groups.get(key) ?? { village: r.village, district: tDistrict(r.districtId), count: 0 };
      g.count += 1;
      groups.set(key, g);
    }
    return [...groups.values()].sort((a, b) => b.count - a.count).slice(0, 6);
  }, [rows, tDistrict]);

  const overThreshold = rows.filter((r) => r.level === "above").length;

  const detailFarm = open ? farmById(open.farmId) : undefined;
  const detailReadings = readingsQ.data?.filter((r) => r.trapId === open?.id) ?? [];
  const detailLast = detailReadings[detailReadings.length - 1];

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.5rem]">{t("nav.pestTraps")}</h1>
          <p className="text-[0.875rem] text-ink-2">
            {t("landing.sigTrapTells")}
          </p>
        </div>
        <Updated minutes={48} />
      </header>

      <div className="grid gap-2 border border-line bg-surface p-3 sm:grid-cols-4">
        <Select
          label={t("field.district")}
          value={districtId}
          onChange={(e) => setDistrictId(e.target.value)}
          options={[{ value: "", label: t("common.all") }, ...DISTRICTS.map((d) => ({ value: d.id, label: tDistrict(d.id) }))]}
        />
        <Select
          label={t("risk.pest")}
          value={pestId}
          onChange={(e) => setPestId(e.target.value)}
          options={[{ value: "", label: t("common.all") }, ...PESTS.map((p) => ({ value: p.id, label: p.name }))]}
        />
        <div className="flex items-end">
          <Checkbox label={t("pests.aboveThreshold")} checked={overOnly} onChange={(e) => setOverOnly(e.currentTarget.checked)} />
        </div>
        <div className="flex flex-col justify-end">
          <p className="text-caption">{t("pests.aboveThreshold")}</p>
          <p className="num text-[1.25rem]">
            {overThreshold} {t("common.of")} {rows.length}
          </p>
        </div>
      </div>

      <Panel title={t("officer.emergingHotspots")} meta={t("common.thisWeek")}>
        {trapsQ.loading || readingsQ.loading ? (
          <div className="space-y-2 p-3">
            <Skeleton className="h-10 w-full" />
          </div>
        ) : hotspots.length === 0 ? (
          <p className="p-4 text-[0.875rem] text-ink-2">{t("empty.noCases")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {hotspots.map((h) => (
              <li key={`${h.district}-${h.village}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <div>
                  <p className="text-[0.9375rem] font-semibold">{h.village}</p>
                  <p className="text-[0.8125rem] text-ink-2">{h.district}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="num text-[0.9375rem] font-semibold text-alert">{h.count} {t("pests.aboveThreshold")}</span>
                  <Link to="/app/map" className="text-[0.8125rem] underline underline-offset-2 hover:text-ink">
                    {t("nav.survMap")}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title={t("nav.pestTraps")} meta={`${rows.length} traps`} bodyClassName="overflow-x-auto">
        {trapsQ.loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-3">
            <EmptyState title={t("empty.noCases")} body={t("empty.body")} />
          </div>
        ) : (
          <table className="w-full min-w-[760px] border-collapse text-[0.875rem]">
            <thead className="bg-surface-2">
              <tr>
                {[t("field.caseId"), t("field.village"), t("risk.pest"), t("pests.currentCount"), "ETL", t("field.health"), t("pests.trend")].map((h) => (
                  <th key={h} scope="col" className="text-caption px-3 py-2 text-left">
                    {h}
                  </th>
                ))}
                <th scope="col" className="text-caption px-3 py-2 text-left">
                  <span className="sr-only">{t("action.viewDetails")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="num px-3 py-2 font-semibold">{r.id}</td>
                  <td className="px-3 py-2">{r.village}</td>
                  <td className="px-3 py-2">{r.species}</td>
                  <td className="num px-3 py-2">{r.count}</td>
                  <td className="num px-3 py-2">{r.etl}</td>
                  <td className="px-3 py-2"><TrapLevelChip level={r.level} /></td>
                  <td className="px-3 py-2"><Trend pct={r.wow} /></td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setOpen(r.raw)}
                      className="text-[0.8125rem] font-semibold text-forest hover:underline"
                    >
                      {t("action.viewDetails")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Drawer open={Boolean(open)} onClose={() => setOpen(null)} title={open ? `Trap ${open.id}` : ""}>
        {open ? (
          <div className="space-y-4 text-[0.875rem]">
            <p className="text-ink-2">
              {detailFarm?.name ?? open.farmId} · {detailFarm?.village ?? tDistrict(open.districtId)}, {tDistrict(open.districtId)}
            </p>
            <p className="font-semibold text-ink">{threatName(open.pestId)}</p>
            <div className="border border-line p-3">
              <span className="text-caption">{t("pests.currentCount")}</span>
              <p className="num text-[1.5rem] font-bold">{detailLast?.count ?? 0}</p>
              <p className="text-[0.75rem] text-ink-2">ETL threshold: {detailLast?.threshold ?? 1}</p>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
