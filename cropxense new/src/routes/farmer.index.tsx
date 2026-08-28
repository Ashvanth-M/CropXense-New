/**
 * /farmer/ — Farmer Overview & Farm Health Dashboard.
 *
 * Responsive, desktop-first agricultural intelligence view for farmers.
 * Shows high-level farm health status, registered fields, weather risk index,
 * active pest alerts, and latest actionable IPM advisories.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ScanLine,
  Sprout,
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  Droplets,
  Thermometer,
  Wind,
  Bug,
  Phone,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Card";
import { StatusShape, StatusChip, type Status } from "@/components/ui/Status";
import { useAsync } from "@/hooks/useAsync";
import { getAdvisories, getAssessments, latestWeather, cropName, getTraps, getTrapReadings } from "@/services";
import { getDemoFarms, DEMO_OFFICER } from "@/data/farmerDemo";
import { useAuth } from "@/auth/AuthContext";
import { cx } from "@/lib/cx";

export const Route = createFileRoute("/farmer/")({
  head: () => ({
    meta: [
      { title: "Field Overview — CropXense Farmer" },
      {
        name: "description",
        content: "Farm health summary, field statuses, active pest alerts, weather risk, and IPM advisories.",
      },
      { property: "og:title", content: "Field Overview — CropXense Farmer" },
      {
        property: "og:description",
        content: "Farm health summary, field statuses, active pest alerts, weather risk, and IPM advisories.",
      },
    ],
  }),
  component: FarmerHome,
});

const HEALTH_TO_STATUS: Record<string, Status> = {
  healthy: "healthy",
  at_risk: "watch",
  affected: "critical",
};

function FarmerHome() {
  const { user } = useAuth();
  const { data: farms, loading: farmsLoading } = useAsync(() => getDemoFarms(), []);
  const primaryFarm = farms?.[0];

  const { data: assessments, loading: assessLoading } = useAsync(
    () => (primaryFarm ? getAssessments({ farmId: primaryFarm.id }) : Promise.resolve([])),
    [primaryFarm?.id],
  );

  const { data: advisories, loading: advLoading } = useAsync(
    () => (primaryFarm ? getAdvisories(primaryFarm.id) : Promise.resolve([])),
    [primaryFarm?.id],
  );

  const districtId = primaryFarm?.districtId || user?.district || "akola";
  const weather = latestWeather(districtId);

  const { data: traps } = useAsync(() => getTraps(districtId), [districtId]);
  const { data: trapReadings } = useAsync(() => getTrapReadings(), []);

  // Build live top-2 trap summary from real data
  const topTraps = useMemo(() => {
    if (!traps || !trapReadings) return [];
    return traps
      .map((t) => {
        const readings = trapReadings.filter((r) => r.trapId === t.id);
        const latest = readings[readings.length - 1];
        return { trap: t, count: latest?.count ?? 0, threshold: latest?.threshold ?? 10 };
      })
      .filter((t) => t.count > 0)
      .sort((a, b) => (b.count / b.threshold) - (a.count / a.threshold))
      .slice(0, 2);
  }, [traps, trapReadings]);

  const openAlerts = (assessments ?? []).filter((a) => !["resolved", "rejected"].includes(a.status));
  const activeAdvisory = advisories?.[0];

  const totalArea = (farms ?? []).reduce((acc, f) => acc + f.areaHa, 0).toFixed(1);
  const healthyCount = (farms ?? []).filter((f) => f.health === "healthy").length;
  const attentionCount = (farms ?? []).filter((f) => f.health !== "healthy").length;

  const farmerName = user?.name || "Ramesh Kumar";

  return (
    <div className="space-y-6">
      {/* =========================================================================
          GREETING & PRIMARY HEALTH BANNER
      ========================================================================= */}
      <div className="border border-line bg-surface p-5 md:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="text-caption text-forest">CropXense Field Health</span>
            <h1 className="mt-1 font-expanded text-[1.625rem] md:text-[2rem] leading-tight">
              Good morning, {farmerName.split(" ")[0]}
            </h1>
            <p className="mt-1 text-[0.875rem] text-ink-2 capitalize">
              {districtId} district · field health summary
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/farmer/scan"
              className="inline-flex min-h-[44px] items-center gap-2 border border-forest bg-forest px-4 text-[0.9375rem] font-semibold text-surface transition-colors hover:bg-[#0e2b20]"
            >
              <ScanLine className="size-4" aria-hidden />
              <span>Scan a Crop Leaf</span>
            </Link>
            <Link
              to="/farmer/fields"
              className="inline-flex min-h-[44px] items-center gap-2 border border-line bg-surface px-4 text-[0.9375rem] font-semibold text-ink transition-colors hover:bg-surface-2"
            >
              <Sprout className="size-4" aria-hidden />
              <span>Manage Fields</span>
            </Link>
          </div>
        </div>

        {/* Primary Health Strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-line pt-5 sm:grid-cols-4 lg:grid-cols-5">
          <div className="border-r border-line pr-3 last:border-r-0">
            <span className="text-caption">Overall Farm Risk</span>
            <div className="mt-1.5 flex items-center gap-2">
              <StatusShape status={attentionCount > 0 ? "watch" : "healthy"} size={10} />
              <span className="font-display text-[1.125rem] font-bold text-amber">Moderate Risk</span>
            </div>
          </div>

          <div className="border-r border-line pr-3 last:border-r-0">
            <span className="text-caption">Fields Monitored</span>
            <p className="num mt-1 font-display text-[1.25rem] font-bold text-ink">
              {farmsLoading ? "…" : `${farms?.length || 3}`} <span className="text-[0.875rem] font-normal text-ink-2">({totalArea} ha)</span>
            </p>
          </div>

          <div className="border-r border-line pr-3 last:border-r-0">
            <span className="text-caption">Healthy Parcels</span>
            <p className="num mt-1 font-display text-[1.25rem] font-bold text-leaf">
              {farmsLoading ? "…" : healthyCount}
            </p>
          </div>

          <div className="border-r border-line pr-3 last:border-r-0">
            <span className="text-caption">Needs Attention</span>
            <p className="num mt-1 font-display text-[1.25rem] font-bold text-alert">
              {farmsLoading ? "…" : attentionCount}
            </p>
          </div>

          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <span className="text-caption">Active Alerts</span>
            <p className="num mt-1 font-display text-[1.25rem] font-bold text-amber">
              {assessLoading ? "…" : openAlerts.length}
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MAIN 2-COLUMN DASHBOARD GRID
      ========================================================================= */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN (65% on Desktop) */}
        <div className="space-y-6 lg:col-span-8">
          {/* Registered Fields Table / Grid */}
          <section className="border border-line bg-surface p-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="font-display text-[1.125rem] font-semibold">My Registered Fields</h2>
                <p className="text-[0.8125rem] text-ink-2">Parcel health and latest observation status</p>
              </div>
              <Link to="/farmer/fields" className="text-[0.8125rem] font-semibold text-forest hover:underline">
                View all fields →
              </Link>
            </div>

            {farmsLoading ? (
              <div className="mt-4 space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-[0.875rem]">
                  <thead>
                    <tr className="border-b border-line text-caption text-ink-2">
                      <th className="pb-2 font-semibold">Field Name</th>
                      <th className="pb-2 font-semibold">Crop & Variety</th>
                      <th className="pb-2 font-semibold">Area</th>
                      <th className="pb-2 font-semibold">Stage</th>
                      <th className="pb-2 font-semibold">Health Status</th>
                      <th className="pb-2 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {farms?.map((f) => (
                      <tr key={f.id} className="group transition-colors hover:bg-surface-2">
                        <td className="py-3 font-semibold text-ink">
                          <div>
                            <span>{f.name}</span>
                            <span className="block text-[0.75rem] font-normal text-ink-2">{f.village}</span>
                          </div>
                        </td>
                        <td className="py-3 text-ink">{cropName(f.cropId)}</td>
                        <td className="num py-3">{f.areaHa} ha</td>
                        <td className="py-3 capitalize text-ink-2">{f.stage.replace("_", " ")}</td>
                        <td className="py-3">
                          <StatusChip status={HEALTH_TO_STATUS[f.health] || "healthy"} />
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            to="/farmer/scan"
                            className="inline-flex min-h-[34px] items-center gap-1 rounded-[var(--r)] border border-line bg-paper px-2.5 text-[0.75rem] font-semibold text-forest hover:bg-forest hover:text-surface"
                          >
                            <ScanLine className="size-3" />
                            <span>Scan</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Active Alerts & Disease Detections */}
          <section className="border border-line bg-surface p-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="font-display text-[1.125rem] font-semibold">Active Field Alerts & Threat Signals</h2>
                <p className="text-[0.8125rem] text-ink-2">Candidate detections requiring observation</p>
              </div>
              <Link to="/farmer/advisories" className="text-[0.8125rem] font-semibold text-forest hover:underline">
                All Advisories →
              </Link>
            </div>

            {assessLoading ? (
              <Skeleton className="mt-4 h-28 w-full" />
            ) : openAlerts.length === 0 ? (
              <div className="mt-4 flex items-center gap-3 border border-leaf/30 bg-leaf/5 p-4 text-[0.875rem] text-leaf">
                <CheckCircle2 className="size-5 shrink-0" />
                <span>No active critical pest or disease outbreaks detected in your parcels today.</span>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {openAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex flex-col justify-between gap-4 border border-line bg-paper p-4 md:flex-row md:items-center"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="num text-[0.75rem] text-ink-2">{alert.id}</span>
                        <StatusChip status={alert.severity >= 4 ? "critical" : "watch"} />
                        <span className="text-[0.75rem] text-ink-2 font-medium">Confidence: {alert.confidence}%</span>
                      </div>
                      <h3 className="font-display text-[1rem] font-semibold text-ink">
                        {alert.suspected}
                      </h3>
                      <p className="text-[0.8125rem] text-ink-2">
                        Detected via {alert.detectedVia.join(" + ")} · Affected area approx. {alert.affectedAreaHa} ha
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        to="/farmer/advisories"
                        className="inline-flex min-h-[40px] items-center gap-1 border border-forest bg-forest px-3 text-[0.8125rem] font-semibold text-surface hover:bg-[#0e2b20]"
                      >
                        <span>View IPM Advisory</span>
                        <ArrowUpRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Latest IPM Advisory Snapshot */}
          {activeAdvisory && (
            <section className="border border-forest/40 bg-surface p-5">
              <div className="flex items-center gap-2 text-forest">
                <ShieldAlert className="size-5" />
                <h2 className="font-display text-[1.125rem] font-semibold">
                  Latest Extension Advisory
                </h2>
              </div>
              <p className="mt-1 font-semibold text-[0.9375rem] text-ink">{activeAdvisory.title}</p>
              <p className="text-[0.8125rem] text-ink-2">Window: {activeAdvisory.window}</p>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="border border-line bg-paper p-3">
                  <span className="text-caption text-forest">1. Cultural Action</span>
                  <p className="mt-1 text-[0.8125rem] text-ink">{activeAdvisory.cultural[0]}</p>
                </div>
                <div className="border border-line bg-paper p-3">
                  <span className="text-caption text-leaf">2. Biological Control</span>
                  <p className="mt-1 text-[0.8125rem] text-ink">{activeAdvisory.biological[0]}</p>
                </div>
                <div className="border border-line bg-paper p-3">
                  <span className="text-caption text-amber">3. Chemical Referral</span>
                  <p className="mt-1 text-[0.8125rem] text-ink">{activeAdvisory.chemical[0]}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[0.8125rem]">
                <span className="text-ink-2">Department of Agriculture, Maharashtra</span>
                <Link to="/farmer/advisories" className="font-semibold text-forest hover:underline">
                  Read complete guidance →
                </Link>
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN (35% on Desktop) */}
        <div className="space-y-6 lg:col-span-4">
          {/* Weather & Disease Risk Index */}
          <section className="border border-line bg-surface p-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="font-display text-[1.125rem] font-semibold">Today's Weather & Risk</h2>
                <p className="text-[0.8125rem] text-ink-2 capitalize">{districtId} Block</p>
              </div>
              <Link to="/farmer/forecast" className="text-[0.8125rem] font-semibold text-forest hover:underline">
                7-Day Forecast →
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-[0.8125rem]">
              <div className="flex items-center gap-2 border border-line bg-paper p-2.5">
                <Thermometer className="size-4 text-ink-2" />
                <div>
                  <span className="text-caption">Max Temp</span>
                  <p className="num font-semibold">{weather.tMaxC}°C</p>
                </div>
              </div>

              <div className="flex items-center gap-2 border border-line bg-paper p-2.5">
                <Droplets className="size-4 text-water" />
                <div>
                  <span className="text-caption">Humidity</span>
                  <p className="num font-semibold">{weather.rhPct}%</p>
                </div>
              </div>

              <div className="flex items-center gap-2 border border-line bg-paper p-2.5">
                <CloudRain className="size-4 text-water" />
                <div>
                  <span className="text-caption">Rainfall (24h)</span>
                  <p className="num font-semibold">{weather.rainfallMm} mm</p>
                </div>
              </div>

              <div className="flex items-center gap-2 border border-line bg-paper p-2.5">
                <Wind className="size-4 text-ink-2" />
                <div>
                  <span className="text-caption">Wind Speed</span>
                  <p className="num font-semibold">{weather.windKph} km/h</p>
                </div>
              </div>
            </div>

            <div className="mt-3 border border-amber/30 bg-amber/5 p-3 text-[0.8125rem]">
              <p className="font-semibold text-amber">Fungal Pathogen Risk: HIGH</p>
              <p className="mt-0.5 text-ink-2">
                High leaf wetness ({weather.leafWetnessHrs} h) combined with {weather.rhPct}% relative humidity favors spore germination in cotton and soybean.
              </p>
            </div>
          </section>

          {/* Pest Trap Surveillance */}
          <section className="border border-line bg-surface p-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="font-display text-[1.125rem] font-semibold">Pest Trap Activity</h2>
                <p className="text-[0.8125rem] text-ink-2">Village Pheromone & Light Traps</p>
              </div>
              <Link to="/farmer/pests" className="text-[0.8125rem] font-semibold text-forest hover:underline">
                Details →
              </Link>
            </div>

            <div className="mt-4 space-y-3 text-[0.8125rem]">
              {topTraps.length === 0 ? (
                <p className="text-ink-2 text-[0.8125rem]">No trap readings recorded for your district yet.</p>
              ) : (
                topTraps.map(({ trap, count, threshold }) => {
                  const pct = Math.min(Math.round((count / threshold) * 100), 100);
                  const over = count >= threshold;
                  const watch = count >= threshold * 0.7;
                  return (
                    <div key={trap.id} className="border border-line bg-paper p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink truncate">{trap.type} trap — {trap.id}</span>
                        <span className={cx(
                          "rounded-[var(--r)] px-1.5 py-0.5 text-[0.6875rem] font-bold shrink-0 ml-2",
                          over ? "bg-alert/15 text-alert" : watch ? "bg-amber/15 text-amber" : "bg-leaf/15 text-leaf",
                        )}>
                          {over ? "Above ETL" : watch ? "Watch" : "Safe"}
                        </span>
                      </div>
                      <div className="num mt-2 flex items-baseline justify-between text-ink-2">
                        <span>Count: <strong className="text-ink">{count}</strong></span>
                        <span>ETL: {threshold}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full bg-surface-2">
                        <div
                          className={over ? "h-full bg-alert" : watch ? "h-full bg-amber" : "h-full bg-leaf"}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Assigned Extension Officer */}
          <section className="border border-line bg-surface p-5">
            <h2 className="font-display text-[1.125rem] font-semibold">Assigned Plant Protection Officer</h2>
            <p className="text-[0.8125rem] text-ink-2">Department of Agriculture, Akola Subdivision</p>

            <div className="mt-4 flex items-center gap-3 border border-line bg-paper p-3">
              <div className="flex size-10 items-center justify-center rounded-[var(--r)] bg-forest text-surface font-bold">
                AD
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[0.875rem] text-ink">{DEMO_OFFICER.name}</p>
                <p className="text-[0.75rem] text-ink-2">Senior Agriculture Officer</p>
                <a
                  href={`tel:${DEMO_OFFICER.phone}`}
                  className="mt-1 inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-forest hover:underline"
                >
                  <Phone className="size-3" />
                  <span className="num">{DEMO_OFFICER.phone}</span>
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
