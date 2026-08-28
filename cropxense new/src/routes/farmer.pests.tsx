/**
 * /farmer/pests — Pest Surveillance & Trap Counts.
 *
 * Shows pheromone and light trap data from the service layer for the farmer's
 * district, comparing counts against Economic Threshold Levels (ETL).
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bug,
  ShieldAlert,
  ScanLine,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Card";
import { Sparkline } from "@/components/app/Sparkline";
import { useAsync } from "@/hooks/useAsync";
import {
  getTraps,
  getTrapReadings,
  districtName,
  farmById,
} from "@/services";
import { useAuth } from "@/auth/AuthContext";
import type { PestTrap, TrapReading } from "@/types";

export const Route = createFileRoute("/farmer/pests")({
  head: () => ({
    meta: [
      { title: "Pest Activity & Traps — CropXense Farmer" },
      {
        name: "description",
        content: "Village-level pheromone and light trap counts compared against economic threshold levels.",
      },
    ],
  }),
  component: FarmerPestsPage,
});

function trapStatus(count: number, threshold: number): "above" | "watch" | "safe" {
  if (count >= threshold) return "above";
  if (count >= threshold * 0.7) return "watch";
  return "safe";
}

function statusLabel(s: "above" | "watch" | "safe") {
  return s === "above" ? "Above ETL" : s === "watch" ? "Watch ETL" : "Controlled";
}

function statusClasses(s: "above" | "watch" | "safe") {
  return s === "above"
    ? "bg-alert/15 text-alert border border-alert/30"
    : s === "watch"
      ? "bg-amber/15 text-amber border border-amber/30"
      : "bg-leaf/15 text-leaf border border-leaf/30";
}

function trendLabel(readings: TrapReading[]): string {
  if (readings.length < 2) return "Insufficient data";
  const recent = readings.slice(-3).reduce((s, r) => s + r.count, 0) / 3;
  const older = readings.slice(-6, -3).reduce((s, r) => s + r.count, 0) / 3;
  if (!older) return "New monitoring";
  const pct = Math.round(((recent - older) / older) * 100);
  return pct >= 0 ? `+${pct}% this week` : `${pct}% this week`;
}

function FarmerPestsPage() {
  const { user } = useAuth();
  const district = user?.district?.toLowerCase() ?? "akola";

  const trapsQ = useAsync(() => getTraps(district), [district]);
  const readingsQ = useAsync(() => getTrapReadings(), []);

  const [selectedTrapId, setSelectedTrapId] = useState<string | null>(null);

  const traps = trapsQ.data ?? [];
  const allReadings = readingsQ.data ?? [];

  const trapItems = useMemo(() => {
    return traps.map((trap) => {
      const readings = allReadings.filter((r) => r.trapId === trap.id);
      const latest = readings[readings.length - 1];
      const count = latest?.count ?? 0;
      const threshold = latest?.threshold ?? 10;
      const status = trapStatus(count, threshold);
      return { trap, readings, count, threshold, status, trend: trendLabel(readings) };
    });
  }, [traps, allReadings]);

  const selectedItem = trapItems.find((t) => t.trap.id === selectedTrapId) ?? trapItems[0];

  const aboveCount = trapItems.filter((t) => t.status === "above").length;
  const watchCount = trapItems.filter((t) => t.status === "watch").length;

  const loading = trapsQ.loading || readingsQ.loading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-line bg-surface p-5 md:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="text-caption text-forest">Village Surveillance Network</span>
            <h1 className="mt-1 font-expanded text-[1.5rem] md:text-[1.875rem]">Pest Trap Activity</h1>
            <p className="mt-1 text-[0.875rem] text-ink-2">
              Pheromone and light trap counts for {districtName(district)} district, compared against Economic Threshold Levels (ETL).
            </p>
          </div>
          <Link
            to="/farmer/scan"
            className="inline-flex min-h-[44px] items-center gap-2 border border-forest bg-forest px-4 text-[0.875rem] font-semibold text-surface hover:bg-[#0e2b20]"
          >
            <ScanLine className="size-4" />
            <span>Scan Leaf for Pests</span>
          </Link>
        </div>

        {!loading && (
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4">
            <div className="border-r border-line pr-3">
              <span className="text-caption">Active Traps</span>
              <p className="num mt-1 text-[1.25rem] font-bold text-ink">{traps.length}</p>
            </div>
            <div className="border-r border-line pr-3">
              <span className="text-caption">Above Threshold</span>
              <p className="num mt-1 text-[1.25rem] font-bold text-alert">{aboveCount}</p>
            </div>
            <div className="border-r border-line pr-3">
              <span className="text-caption">Approaching Threshold</span>
              <p className="num mt-1 text-[1.25rem] font-bold text-amber">{watchCount}</p>
            </div>
            <div>
              <span className="text-caption">Controlled</span>
              <p className="num mt-1 text-[1.25rem] font-bold text-leaf">
                {trapItems.filter((t) => t.status === "safe").length}
              </p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : traps.length === 0 ? (
        <div className="border border-line bg-surface p-8 text-center">
          <CheckCircle2 className="mx-auto size-10 text-leaf mb-3" />
          <p className="font-semibold text-ink">No traps recorded in your district</p>
          <p className="mt-1 text-[0.875rem] text-ink-2">
            Contact your extension officer to set up pheromone or light traps.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left: Trap list */}
          <div className="space-y-3 lg:col-span-7">
            <h2 className="font-display text-[1.0625rem] font-semibold">Monitored Traps</h2>
            {trapItems.map(({ trap, readings, count, threshold, status, trend }) => {
              const isSelected = (selectedItem?.trap.id ?? trapItems[0]?.trap.id) === trap.id;
              const farm = farmById(trap.farmId);
              const pct = Math.min(Math.round((count / threshold) * 100), 100);
              return (
                <button
                  key={trap.id}
                  type="button"
                  onClick={() => setSelectedTrapId(trap.id)}
                  className={`w-full text-left rounded-[var(--r)] border p-4 transition-all ${
                    isSelected
                      ? "border-forest bg-surface ring-2 ring-forest shadow-panel"
                      : "border-line bg-surface hover:bg-surface-2"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="num font-bold text-ink">{trap.id}</span>
                        <span className="text-[0.8125rem] text-ink-2">{trap.type} trap</span>
                      </div>
                      <p className="mt-0.5 text-[0.8125rem] text-ink-2">
                        {farm ? `${farm.name} · ${farm.village}` : trap.farmId}
                      </p>
                    </div>
                    <span className={`rounded-[var(--r)] px-2 py-0.5 text-[0.6875rem] font-bold uppercase ${statusClasses(status)}`}>
                      {statusLabel(status)}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="num flex items-baseline justify-between text-[0.8125rem]">
                      <span>Count: <strong className="text-ink">{count}</strong></span>
                      <span className="text-ink-2">Threshold: {threshold}</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${status === "above" ? "bg-alert" : status === "watch" ? "bg-amber" : "bg-leaf"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-[0.75rem] text-ink-2">
                    {readings.length > 0 && (
                      <Sparkline
                        values={readings.map((r) => r.count)}
                        tone={status === "above" ? "var(--alert)" : status === "watch" ? "var(--amber)" : "var(--leaf)"}
                        label={`Trap counts for ${trap.id}`}
                      />
                    )}
                    <span className="num font-semibold text-amber ml-auto">{trend}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Detail panel */}
          {selectedItem && (
            <div className="space-y-5 lg:col-span-5">
              <div className="border border-line bg-surface p-5">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div>
                    <span className="text-caption text-forest">Trap Details</span>
                    <h3 className="font-display text-[1.125rem] font-bold text-ink">
                      {selectedItem.trap.id}
                    </h3>
                    <p className="text-[0.8125rem] text-ink-2">{selectedItem.trap.type}</p>
                  </div>
                  <Bug className="size-6 text-forest" />
                </div>

                <div className="mt-4 space-y-4 text-[0.875rem]">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-line bg-paper p-3">
                      <span className="text-caption">Current Count</span>
                      <p className="num text-[1.25rem] font-bold text-alert">{selectedItem.count}</p>
                    </div>
                    <div className="border border-line bg-paper p-3">
                      <span className="text-caption">ETL Threshold</span>
                      <p className="num text-[1.25rem] font-bold">{selectedItem.threshold}</p>
                    </div>
                  </div>

                  <div className="border border-forest/30 bg-surface-2 p-4">
                    <h4 className="font-semibold text-forest flex items-center gap-1.5">
                      <ShieldAlert className="size-4" />
                      <span>Recommended Action</span>
                    </h4>
                    <p className="mt-2 text-[0.875rem] leading-snug text-ink">
                      {selectedItem.status === "above"
                        ? "Count exceeds ETL. Apply biological controls immediately and notify your extension officer."
                        : selectedItem.status === "watch"
                          ? "Approaching threshold. Increase monitoring frequency and prepare biocontrol materials."
                          : "Population is under control. Continue weekly monitoring."}
                    </p>
                  </div>

                  <div className="border border-line bg-paper p-3 text-[0.8125rem] space-y-1.5">
                    {[
                      ["Trap ID", selectedItem.trap.id],
                      ["Type", selectedItem.trap.type],
                      ["Field", farmById(selectedItem.trap.farmId)?.name ?? selectedItem.trap.farmId],
                      ["District", districtName(selectedItem.trap.districtId)],
                      ["Readings recorded", String(selectedItem.readings.length)],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-ink-2">{k}:</span>
                        <strong className="text-ink">{v}</strong>
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/farmer/advisories"
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 border border-forest bg-forest text-[0.875rem] font-semibold text-surface hover:bg-[#0e2b20]"
                  >
                    <span>View Advisory Guidelines</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
