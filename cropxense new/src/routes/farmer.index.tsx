/**
 * /farmer/ — Simplified, Farmer-First Overview Command Center.
 *
 * Designed for SIH 2026 jury clarity:
 * 1. Top Farm Health Summary (Overall Risk, Fields, Area, Active Alerts)
 * 2. Today's Actions (Top 3 prioritized actions or clean caught-up state)
 * 3. My Fields (Top 3 prioritized parcels + link to full field list)
 * 4. Today's Weather & Risk (Temp, RH%, Rainfall + simple disease risk explanation)
 * 5. Latest Crop Health Alert (Single most important active detection + direct action)
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  ScanLine,
  Sprout,
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  Droplets,
  Thermometer,
  ArrowRight,
  ShieldCheck,
  Activity,
  Plus,
  AlertCircle,
  Eye,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Card";
import { StatusChip, type Status } from "@/components/ui/Status";
import {
  getFarmerFarms,
  getAdvisories,
  getAssessments,
  getFollowUps,
  latestWeather,
  getTodayActions,
  subscribe,
} from "@/services";
import { useAuth } from "@/auth/AuthContext";
import { useT } from "@/i18n";
import { ArduinoStatusCard } from "@/components/app/ArduinoStatusCard";
import { cx } from "@/lib/cx";
import type { Farm, CropHealthAssessment, Advisory, FollowUp } from "@/types";

export const Route = createFileRoute("/farmer/")({
  head: () => ({
    meta: [
      { title: "Farmer Overview — CropXense" },
      {
        name: "description",
        content: "Concise agricultural command center: farm health summary, today's actions, top fields, weather risk, and latest crop alert.",
      },
      { property: "og:title", content: "Farmer Overview — CropXense" },
      {
        property: "og:description",
        content: "Concise agricultural command center: farm health summary, today's actions, top fields, weather risk, and latest crop alert.",
      },
    ],
  }),
  component: FarmerOverviewPage,
});

const HEALTH_TO_STATUS: Record<string, Status> = {
  healthy: "healthy",
  at_risk: "watch",
  affected: "critical",
};

function FarmerOverviewPage() {
  const { user } = useAuth();
  const { t, tCrop, tStage, tDistrict, tRisk } = useT();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [assessments, setAssessments] = useState<CropHealthAssessment[]>([]);
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [f, a, adv, fu] = await Promise.all([
        getFarmerFarms(user),
        getAssessments(),
        getAdvisories(),
        getFollowUps(),
      ]);
      setFarms(f);
      setAssessments(a);
      setAdvisories(adv);
      setFollowUps(fu);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribe(() => {
      loadData();
    });
    return () => {
      unsub();
    };
  }, [user]);

  const farmList = farms;
  const farmIds = useMemo(() => new Set(farmList.map((f) => f.id)), [farmList]);

  // Derived cases strictly for this farmer's registered fields
  const myAssessments = useMemo(
    () => assessments.filter((a) => farmIds.has(a.farmId)),
    [assessments, farmIds],
  );

  const openCases = useMemo(
    () => myAssessments.filter((a) => !["resolved", "rejected"].includes(a.status)),
    [myAssessments],
  );

  const myAdvisories = useMemo(
    () => advisories.filter((a) => farmIds.has(a.farmId)),
    [advisories, farmIds],
  );

  const unacknowledgedAdvisories = useMemo(
    () => myAdvisories.filter((a) => !a.acknowledged),
    [myAdvisories],
  );

  // Computed metrics (All deterministic from live store)
  const totalArea = useMemo(
    () => farmList.reduce((sum, f) => sum + f.areaHa, 0).toFixed(1),
    [farmList],
  );

  const activeAlertsCount = openCases.length + unacknowledgedAdvisories.length;

  // Primary district & Hyperlocal weather
  const primaryFarm = farmList[0];
  const districtId = primaryFarm?.districtId || user?.district?.toLowerCase() || "amravati";
  const weather = latestWeather(districtId);

  // Overall Farm Risk Label & Styling
  const overallRisk: "low" | "moderate" | "high" = useMemo(() => {
    if (farmList.length === 0) return "low";
    if (openCases.some((c) => c.severity >= 4)) return "high";
    if (openCases.length > 0 || farmList.some((f) => f.health === "at_risk")) return "moderate";
    return "low";
  }, [farmList, openCases]);

  // 1. Today's Actions (Maximum 3 prioritized actions)
  const todayActions = useMemo(() => {
    return getTodayActions(farmList).slice(0, 3);
  }, [farmList]);

  // 2. Top 3 Relevant Fields (Prioritize at_risk/affected first, then healthy)
  const topFields = useMemo(() => {
    const healthWeight = { affected: 0, at_risk: 1, healthy: 2 };
    return [...farmList]
      .sort((a, b) => (healthWeight[a.health] ?? 3) - (healthWeight[b.health] ?? 3))
      .slice(0, 3);
  }, [farmList]);

  // 3. Single Most Important Crop Health Alert
  const latestAlert = useMemo(() => {
    if (openCases.length === 0) return null;
    return [...openCases].sort((a, b) => b.severity - a.severity || new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())[0];
  }, [openCases]);

  const latestAlertFarm = useMemo(() => {
    if (!latestAlert) return null;
    return farmList.find((f) => f.id === latestAlert.farmId);
  }, [latestAlert, farmList]);

  const farmerFirstName = (user?.name || "Ramesh Kumar").split(" ")[0];

  return (
    <div className="space-y-6 pb-8">
      {/* =========================================================================
          1. TOP FARM HEALTH SUMMARY
          "How is my farm?"
      ========================================================================= */}
      <section className="border border-line bg-surface p-5 md:p-6 shadow-panel">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="text-caption text-forest font-bold uppercase tracking-wider">
              {t("app.name")} · {t("role.fieldHealth")}
            </span>
            <h1 className="mt-1 font-expanded text-[1.625rem] md:text-[2rem] font-bold leading-tight text-ink">
              {t("farmer.greeting")}, {farmerFirstName}
            </h1>
            <p className="mt-1 text-[0.875rem] text-ink-2 capitalize">
              {tDistrict(districtId)} {t("field.district")} · {t("farmer.fieldPulse")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/farmer/scan"
              className="inline-flex min-h-[44px] items-center gap-2 border border-forest bg-forest px-4 text-[0.9375rem] font-semibold text-surface transition-colors hover:bg-[#0e2b20] shadow-sm"
            >
              <ScanLine className="size-4" aria-hidden />
              <span>{t("farmer.scanLeaf")}</span>
            </Link>
            <Link
              to="/farmer/crop-care"
              className="inline-flex min-h-[44px] items-center gap-2 border border-line bg-surface px-4 text-[0.9375rem] font-semibold text-ink transition-colors hover:bg-surface-2"
            >
              <ShieldCheck className="size-4 text-forest" aria-hidden />
              <span>{t("farmer.cropCareHub")}</span>
            </Link>
          </div>
        </div>

        {/* 4 Clean Metric Cards */}
        {loading ? (
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-4">
            {/* OVERALL FARM RISK */}
            <div className="border-r border-line pr-3 last:border-r-0">
              <span className="text-caption">{t("risk.overall")}</span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span
                  className={cx(
                    "font-expanded text-[1.5rem] md:text-[1.75rem] font-bold uppercase",
                    overallRisk === "high"
                      ? "text-alert"
                      : overallRisk === "moderate"
                        ? "text-amber"
                        : "text-leaf",
                  )}
                >
                  {tRisk(overallRisk)}
                </span>
              </div>
              <p className="text-[0.75rem] text-ink-2 truncate">
                {openCases.length > 0
                  ? `${openCases.length} ${t("common.cases")}`
                  : t("farmer.allHealthy")}
              </p>
            </div>

            {/* FIELDS */}
            <div className="border-r border-line pr-3 last:border-r-0">
              <span className="text-caption">{t("nav.fields")}</span>
              <p className="num mt-1.5 font-display text-[1.5rem] md:text-[1.75rem] font-bold text-ink">
                {farmList.length}
              </p>
              <p className="text-[0.75rem] text-ink-2">{t("profile.registeredFields")}</p>
            </div>

            {/* AREA */}
            <div className="border-r border-line pr-3 last:border-r-0">
              <span className="text-caption">{t("farmer.totalArea")}</span>
              <p className="num mt-1.5 font-display text-[1.5rem] md:text-[1.75rem] font-bold text-ink">
                {totalArea} <span className="text-[1rem] font-normal text-ink-2">ha</span>
              </p>
              <p className="text-[0.75rem] text-ink-2">{t("field.areaHectares")}</p>
            </div>

            {/* ACTIVE ALERTS */}
            <div>
              <span className="text-caption">{t("farmer.activeAlerts")}</span>
              <p
                className={cx(
                  "num mt-1.5 font-display text-[1.5rem] md:text-[1.75rem] font-bold",
                  activeAlertsCount > 0 ? "text-amber" : "text-leaf",
                )}
              >
                {activeAlertsCount}
              </p>
              <p className="text-[0.75rem] text-ink-2">
                {activeAlertsCount > 0 ? t("farmer.fieldsAtRisk") : t("farmer.noAlerts")}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          NEW USER ONBOARDING BANNER (Zero-state when no fields registered)
      ========================================================================= */}
      {!loading && farmList.length === 0 && (
        <section className="border border-forest/40 bg-surface p-6 md:p-8 text-center shadow-panel">
          <div className="mx-auto max-w-lg">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-forest/10 text-forest mb-4">
              <Sprout className="size-8" />
            </div>
            <span className="text-caption text-forest font-bold uppercase">{t("app.name")}</span>
            <h2 className="mt-1 font-expanded text-[1.5rem] font-bold text-ink">
              {t("empty.noFields")}
            </h2>
            <p className="mt-2 text-[0.875rem] text-ink-2 leading-relaxed">
              {t("empty.noFieldsBody")}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/farmer/fields"
                className="inline-flex min-h-[44px] items-center gap-2 border border-forest bg-forest px-6 text-[0.9375rem] font-semibold text-surface shadow-sm hover:bg-[#0e2b20]"
              >
                <Plus className="size-4" />
                <span>+ {t("fields.addField")}</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* When the user has registered fields, show the 4 remaining core areas */}
      {farmList.length > 0 && (
        <>
          {/* =====================================================================
              2. TODAY'S ACTIONS
              "What should I do today?"
          ===================================================================== */}
          <section className="border border-line bg-surface p-5 shadow-panel">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-forest" />
                  <h2 className="font-display text-[1.125rem] font-bold text-ink">
                    {t("farmer.todayActions")}
                  </h2>
                </div>
                <p className="text-[0.8125rem] text-ink-2 mt-0.5">
                  {t("advisory.windowLabel")}
                </p>
              </div>

              <Link
                to="/farmer/crop-care"
                className="inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-forest hover:underline"
              >
                <span>{t("action.readMore")}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : todayActions.length === 0 ? (
              <div className="mt-4 flex items-center gap-3 border border-leaf/30 bg-leaf/5 p-4 text-leaf">
                <CheckCircle2 className="size-5 shrink-0" />
                <div>
                  <p className="font-semibold text-[0.9375rem]">{t("farmer.noActions")}</p>
                  <p className="text-[0.8125rem] text-ink-2 mt-0.5">
                    {t("farmer.allHealthy")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {todayActions.map((act, i) => (
                  <div
                    key={i}
                    className="border border-line bg-paper p-4 flex flex-col justify-between hover:border-forest/50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={cx(
                            "text-[0.6875rem] font-bold uppercase rounded-[var(--r)] px-1.5 py-0.5",
                            act.priority === "high"
                              ? "bg-alert/15 text-alert"
                              : act.priority === "medium"
                                ? "bg-amber/15 text-amber"
                                : "bg-leaf/15 text-leaf",
                          )}
                        >
                          {tRisk(act.priority)}
                        </span>
                        <span className="text-[0.75rem] text-ink-2 capitalize">{act.type}</span>
                      </div>
                      <h3 className="font-semibold text-ink text-[0.9375rem] line-clamp-1">
                        {act.title}
                      </h3>
                      <p className="text-[0.8125rem] text-ink-2 mt-1 line-clamp-2">
                        {act.detail}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-line">
                      <Link
                        to={act.link || "/farmer/crop-care"}
                        className="inline-flex min-h-[32px] items-center gap-1 text-[0.8125rem] font-semibold text-forest hover:underline"
                      >
                        <span>
                          {act.type === "scan"
                            ? t("action.scanCrop")
                            : act.type === "followup"
                              ? t("followup.action")
                              : t("action.viewDetails")}
                        </span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* =====================================================================
              3. MY FIELDS (Top 3 Relevant Fields)
              "Which field needs attention?"
          ===================================================================== */}
          <section className="border border-line bg-surface p-5 shadow-panel">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sprout className="size-4 text-forest" />
                  <h2 className="font-display text-[1.125rem] font-bold text-ink">
                    {t("farmer.myFields")}
                  </h2>
                </div>
                <p className="text-[0.8125rem] text-ink-2 mt-0.5">
                  {t("farmer.topFields")} · {totalArea} ha {t("common.total")}
                </p>
              </div>

              <Link
                to="/farmer/fields"
                className="inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-forest hover:underline"
              >
                <span>{t("farmer.viewAllFields")} ({farmList.length})</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="mt-4 space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {topFields.map((f) => (
                  <div
                    key={f.id}
                    className="border border-line bg-paper p-4 flex flex-col justify-between hover:border-forest/50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="num text-[0.75rem] text-ink-2">{f.id}</span>
                        <StatusChip status={HEALTH_TO_STATUS[f.health] || "healthy"} />
                      </div>
                      <h3 className="font-bold text-ink text-[1rem]">{f.name}</h3>
                      <p className="text-[0.8125rem] text-ink-2 mt-0.5">
                        {tCrop(f.cropId)} · {f.areaHa} ha
                      </p>
                      <p className="text-[0.75rem] text-ink-2 mt-0.5">
                        {f.village} · {tStage(f.stage)}
                      </p>
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-line flex items-center justify-between">
                      <Link
                        to="/farmer/scan"
                        search={{ fieldId: f.id, cropId: f.cropId } as any}
                        className="inline-flex min-h-[30px] items-center gap-1 rounded-[var(--r)] border border-line bg-surface px-2.5 text-[0.75rem] font-semibold text-forest hover:bg-forest hover:text-surface transition-colors"
                      >
                        <ScanLine className="size-3" />
                        <span>{t("action.scanCrop")}</span>
                      </Link>
                      <Link
                        to="/farmer/fields"
                        className="text-[0.75rem] text-ink-2 hover:text-forest hover:underline"
                      >
                        {t("action.viewDetails")} →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* =====================================================================
              MICROCLIMATE HARDWARE INTEGRATION NODE
          ===================================================================== */}
          <section>
            <ArduinoStatusCard />
          </section>

          {/* =====================================================================
              4. TODAY'S WEATHER & RISK
              "What could affect my crop?"
          ===================================================================== */}
          <section className="border border-line bg-surface p-5 shadow-panel">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <CloudRain className="size-4 text-forest" />
                  <h2 className="font-display text-[1.125rem] font-bold text-ink">
                    {t("farmer.weatherRisk")}
                  </h2>
                </div>
                <p className="text-[0.8125rem] text-ink-2 mt-0.5">
                  {tDistrict(districtId)}
                </p>
              </div>

              <Link
                to="/farmer/forecast"
                className="inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-forest hover:underline"
              >
                <span>{t("forecast.sevenDay")}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-12">
              {/* Weather Stats Strip */}
              <div className="grid grid-cols-3 gap-3 lg:col-span-6">
                <div className="border border-line bg-paper p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-ink-2 mb-1">
                    <Thermometer className="size-4" />
                    <span className="text-caption">{t("farmer.temperature")}</span>
                  </div>
                  <p className="num text-[1.25rem] font-bold text-ink">{weather.tMaxC}°C</p>
                  <p className="text-[0.7rem] text-ink-2">{weather.tMinC}°C</p>
                </div>

                <div className="border border-line bg-paper p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-ink-2 mb-1">
                    <Droplets className="size-4" />
                    <span className="text-caption">{t("farmer.humidity")}</span>
                  </div>
                  <p className="num text-[1.25rem] font-bold text-water">{weather.rhPct}%</p>
                  <p className="text-[0.7rem] text-ink-2">
                    {weather.rhPct >= 80 ? t("risk.high") : t("status.healthy")}
                  </p>
                </div>

                <div className="border border-line bg-paper p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-ink-2 mb-1">
                    <CloudRain className="size-4" />
                    <span className="text-caption">{t("farmer.rainfall")}</span>
                  </div>
                  <p className="num text-[1.25rem] font-bold text-forest">{weather.rainfallMm} mm</p>
                  <p className="text-[0.7rem] text-ink-2">24h</p>
                </div>
              </div>

              {/* Simple Risk Conclusion Box */}
              <div className="border border-line bg-surface-2 p-4 lg:col-span-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cx(
                        "text-[0.6875rem] font-bold uppercase rounded-[var(--r)] px-1.5 py-0.5",
                        weather.rhPct >= 75 || weather.rainfallMm > 20
                          ? "bg-amber/15 text-amber"
                          : "bg-leaf/15 text-leaf",
                      )}
                    >
                      {weather.rhPct >= 75 || weather.rainfallMm > 20 ? t("risk.high") : t("risk.low")}
                    </span>
                    <span className="text-[0.875rem] font-bold text-ink">
                      {t("farmer.diseasePressure")}
                    </span>
                  </div>
                  <p className="text-[0.8125rem] text-ink-2 mt-2 leading-relaxed">
                    {weather.rhPct >= 75 || weather.rainfallMm > 20
                      ? `${t("farmer.humidity")} (${weather.rhPct}%) ${t("farmer.rainfall")} (${weather.rainfallMm} mm)`
                      : t("farmer.allHealthy")}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-line flex items-center justify-between">
                  <span className="text-[0.75rem] text-ink-2">
                    {t("scan.uploadHint")}
                  </span>
                  <Link
                    to="/farmer/forecast"
                    className="text-[0.75rem] font-semibold text-forest hover:underline"
                  >
                    {t("action.viewDetails")} →
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================================
              5. LATEST CROP HEALTH ALERT
              "What problem should I know about?"
          ===================================================================== */}
          <section className="border border-line bg-surface p-5 shadow-panel">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber" />
                  <h2 className="font-display text-[1.125rem] font-bold text-ink">
                    {t("farmer.cropAlert")}
                  </h2>
                </div>
                <p className="text-[0.8125rem] text-ink-2 mt-0.5">
                  {t("farmer.fieldPulse")}
                </p>
              </div>

              <Link
                to="/farmer/crop-care"
                className="inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-forest hover:underline"
              >
                <span>{t("farmer.cropCareHub")}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {loading ? (
              <Skeleton className="mt-4 h-32 w-full" />
            ) : !latestAlert ? (
              <div className="mt-4 flex items-center gap-3 border border-leaf/30 bg-leaf/5 p-4 text-leaf">
                <CheckCircle2 className="size-5 shrink-0" />
                <div>
                  <p className="font-semibold text-[0.9375rem]">{t("farmer.noAlerts")}</p>
                  <p className="text-[0.8125rem] text-ink-2 mt-0.5">
                    {t("farmer.allHealthy")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 border border-amber/30 bg-amber/5 p-4 md:p-5">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[0.6875rem] font-bold uppercase rounded-[var(--r)] bg-alert/15 text-alert px-1.5 py-0.5">
                        {tRisk(latestAlert.riskAssessment?.overallRisk || "high")}
                      </span>
                      <span className="num text-[0.75rem] text-ink-2">{t("field.caseId")}: {latestAlert.id}</span>
                    </div>

                    <h3 className="font-bold text-ink text-[1.125rem] flex items-center gap-2">
                      <AlertCircle className="size-4 text-alert" />
                      <span>{latestAlert.suspected}</span>
                    </h3>

                    <p className="text-[0.875rem] text-ink-2 mt-0.5">
                      {tCrop(latestAlert.cropId)} · {latestAlertFarm?.name || latestAlert.farmId} (
                      {latestAlertFarm?.village || tDistrict("amravati")})
                    </p>
                  </div>

                  {/* AI Assessment Badges */}
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <div className="border border-line bg-surface px-3 py-1.5 text-right">
                      <span className="text-caption">{t("field.confidence")}</span>
                      <p className="num font-bold text-ink text-[0.9375rem]">
                        {latestAlert.confidence}%
                      </p>
                    </div>
                    <div className="border border-line bg-surface px-3 py-1.5 text-right">
                      <span className="text-caption">{t("field.growthStage")}</span>
                      <p className="font-bold text-ink text-[0.9375rem] capitalize">
                        {tStage(latestAlertFarm?.stage || "pod_fill")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reason Explanation */}
                <div className="mt-3.5 border-t border-amber/20 pt-3">
                  <p className="text-[0.8125rem] text-ink leading-relaxed">
                    <span className="font-semibold text-ink">{t("scan.whyResult")}: </span>
                    {latestAlert.evidence?.map((e) => e.label).join(", ") || t("scan.notFinal")}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link
                    to="/farmer/crop-care"
                    className="inline-flex min-h-[38px] items-center gap-1.5 border border-forest bg-forest px-4 text-[0.8125rem] font-semibold text-surface hover:bg-[#0e2b20] shadow-sm transition-colors"
                  >
                    <Eye className="size-3.5" />
                    <span>{t("fields.viewAdvisory")}</span>
                  </Link>

                  <Link
                    to="/farmer/scan"
                    search={{ fieldId: latestAlert.farmId, cropId: latestAlert.cropId } as any}
                    className="inline-flex min-h-[38px] items-center gap-1.5 border border-line bg-surface px-4 text-[0.8125rem] font-semibold text-ink hover:bg-surface-2 transition-colors"
                  >
                    <ScanLine className="size-3.5 text-forest" />
                    <span>{t("action.scanCrop")}</span>
                  </Link>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
