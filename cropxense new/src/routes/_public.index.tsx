import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { Languages } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { SignalWeave } from "@/components/SignalWeave";
import { LeafAnalysisCard } from "@/components/landing/LeafAnalysis";
import { RiskForecast } from "@/components/landing/RiskForecast";
import { DistrictMap, DistrictRanking } from "@/components/landing/DistrictMap";
import { LogoHorizontal } from "@/components/Logo";
import { LANGS, useT } from "@/i18n";

export const Route = createFileRoute("/_public/")({
  head: () => ({
    meta: [
      { title: "CropXense — Crop threat detection for Maharashtra" },
      {
        name: "description",
        content:
          "CropXense combines field images, sensor signals, weather and local outbreak history so farmers and agriculture teams can act while a crop problem is still small.",
      },
      { property: "og:title", content: "CropXense — Crop threat detection for Maharashtra" },
      {
        property: "og:description",
        content:
          "Field images, sensors, weather and outbreak history combined into early crop threat detection, with expert validation built in.",
      },
    ],
  }),
  component: Landing,
});

function Section({
  n,
  title,
  lead,
  children,
  id,
}: {
  n: string;
  title: string;
  lead?: string;
  children: ReactNode;
  id: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-h`}
      className="border-t border-line py-[96px] lg:py-[128px]"
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <p className="text-caption num">{n}</p>
        <h2 id={`${id}-h`} className="mt-2 max-w-3xl font-expanded text-[1.75rem]">
          {title}
        </h2>
        {lead ? <p className="mt-2 max-w-2xl text-[1rem] text-ink-2">{lead}</p> : null}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

/* ---------- 2. problem ---------- */

function ProblemTimeline() {
  const { t } = useT();
  const span = 16;
  const pct = (d: number) => (d / span) * 100;

  const timeline = [
    { day: 0, label: t("landing.day0"), text: t("landing.infectionBegins") },
    { day: 6, label: t("landing.day6"), text: t("landing.firstSymptom") },
    { day: 9, label: t("landing.day9"), text: t("landing.farmerNotices") },
    { day: 14, label: t("landing.day14"), text: t("landing.adviceReaches") },
  ];

  return (
    <div className="border border-line bg-surface p-4">
      <p className="text-caption">{t("landing.problemTimeline")}</p>
      <div className="relative mt-6 h-[76px]">
        <div
          className="absolute inset-y-0"
          style={{
            left: `${pct(0)}%`,
            width: `${pct(9)}%`,
            background: "color-mix(in srgb, var(--amber) 12%, transparent)",
            borderInline: "1px solid var(--amber)",
          }}
        />
        <div className="absolute inset-x-0 top-[26px] h-px bg-line" />
        {timeline.map((tItem) => (
          <div
            key={tItem.day}
            className="absolute top-0 w-[132px] -translate-x-1/2 text-center"
            style={{ left: `${Math.min(Math.max(pct(tItem.day), 6), 94)}%` }}
          >
            <p className="num text-[0.75rem] font-semibold">{tItem.label}</p>
            <div className="mx-auto mt-1 h-[14px] w-px bg-ink" />
            <p className="mt-1 text-[0.75rem] leading-tight text-ink-2">{tItem.text}</p>
          </div>
        ))}
        <p
          className="absolute bottom-0 text-[0.75rem] font-semibold text-amber"
          style={{ left: "1%" }}
        >
          {t("landing.windowTarget")}
        </p>
      </div>
    </div>
  );
}

/* ---------- 3. how it works ---------- */

function StepDiagram({ i }: { i: number }) {
  const common = { fill: "none", stroke: "var(--ink-2)", strokeWidth: 1 } as const;
  return (
    <svg viewBox="0 0 120 48" className="h-12 w-[120px]" aria-hidden>
      {i === 0 && (
        <>
          <rect x="4" y="8" width="32" height="32" {...common} />
          <path d="M40 24 H74" {...common} />
          <path d="M68 19 L74 24 L68 29" {...common} />
          <rect x="78" y="14" width="20" height="20" stroke="var(--alert)" fill="none" />
          <circle cx="88" cy="24" r="3" fill="var(--alert)" />
        </>
      )}
      {i === 1 && (
        <>
          <path d="M4 40 H116" {...common} />
          <path d="M4 36 C30 34 44 20 60 14 C78 8 98 12 116 10" stroke="var(--amber)" fill="none" />
          <path d="M60 14 V40" stroke="var(--line)" fill="none" />
        </>
      )}
      {i === 2 && (
        <>
          <rect x="4" y="10" width="46" height="28" {...common} />
          <path d="M12 20 H42 M12 26 H36 M12 32 H30" {...common} />
          <path d="M54 24 H86" {...common} />
          <path d="M80 19 L86 24 L80 29" {...common} />
          <circle cx="102" cy="24" r="12" stroke="var(--leaf)" fill="none" />
          <path d="M96 24 L100 28 L108 20" stroke="var(--leaf)" fill="none" />
        </>
      )}
      {i === 3 && (
        <>
          <circle cx="22" cy="24" r="12" {...common} />
          <path d="M16 24 L20 28 L28 20" stroke="var(--water)" fill="none" />
          <path d="M38 24 H62" {...common} />
          <rect x="66" y="10" width="50" height="28" stroke="var(--water)" fill="none" />
          <path d="M74 20 H108 M74 28 H96" {...common} />
        </>
      )}
      {i === 4 && (
        <>
          <path d="M20 34 A22 22 0 1 1 44 34" stroke="var(--forest)" fill="none" />
          <path d="M44 26 L44 36 L34 36" stroke="var(--forest)" fill="none" />
          <path d="M70 34 H116 M70 34 V14 H116" {...common} />
          <circle cx="70" cy="34" r="2.5" fill="var(--forest)" />
        </>
      )}
    </svg>
  );
}

/* ---------- 4. signal fusion ---------- */

type SignalRow = {
  signal: string;
  source: string;
  refresh: string;
  tells: string;
  scope: string;
};

function Landing() {
  const [district, setDistrict] = useState<string | null>("akola");
  const { t } = useT();

  const problems = [
    {
      label: t("landing.visibility"),
      body: t("landing.visibilityText"),
    },
    {
      label: t("landing.reach"),
      body: t("landing.reachText"),
    },
    {
      label: t("landing.fragmentation"),
      body: t("landing.fragmentationText"),
    },
  ];

  const steps = [
    [t("landing.detect"), t("landing.detectText")],
    [t("landing.predict"), t("landing.predictText")],
    [t("landing.act"), t("landing.actText")],
    [t("landing.verify"), t("landing.verifyText")],
    [t("landing.learn"), t("landing.learnText")],
  ];

  const signals: SignalRow[] = [
    { signal: t("landing.sigFieldImage"), source: t("landing.sigFieldImageSrc"), refresh: t("landing.sigFieldImageRefresh"), tells: t("landing.sigFieldImageTells"), scope: t("landing.sigFieldImageScope") },
    { signal: t("landing.sigSensor"), source: t("landing.sigSensorSrc"), refresh: t("landing.sigSensorRefresh"), tells: t("landing.sigSensorTells"), scope: t("landing.sigSensorScope") },
    { signal: t("landing.sigWeather"), source: t("landing.sigWeatherSrc"), refresh: t("landing.sigWeatherRefresh"), tells: t("landing.sigWeatherTells"), scope: t("landing.sigWeatherScope") },
    { signal: t("landing.sigTrap"), source: t("landing.sigTrapSrc"), refresh: t("landing.sigTrapRefresh"), tells: t("landing.sigTrapTells"), scope: t("landing.sigTrapScope") },
    { signal: t("landing.sigHistory"), source: t("landing.sigHistorySrc"), refresh: t("landing.sigHistoryRefresh"), tells: t("landing.sigHistoryTells"), scope: t("landing.sigHistoryScope") },
  ];

  const lifecycle = [
    [t("landing.lcDetected"), t("landing.lcDetectedText")],
    [t("landing.lcAwaiting"), t("landing.lcAwaitingText")],
    [t("landing.lcConfirmed"), t("landing.lcConfirmedText")],
    [t("landing.lcField"), t("landing.lcFieldText")],
    [t("landing.lcResolved"), t("landing.lcResolvedText")],
  ];

  const signalCols: Column<SignalRow>[] = [
    { key: "signal", header: t("landing.colSignal"), width: "16%" },
    { key: "source", header: t("landing.colSource"), width: "22%" },
    { key: "refresh", header: t("landing.colRefresh"), width: "12%" },
    { key: "tells", header: t("landing.colTells"), width: "34%" },
    { key: "scope", header: t("landing.colScope"), width: "12%" },
  ];

  return (
    <div className="bg-paper">
      {/* 1. HERO */}
      <section aria-labelledby="hero-h" className="py-[96px] lg:py-[112px]">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-caption">
              {t("landing.govLabel")}
            </p>
            <h1 id="hero-h" className="mt-4 font-expanded text-[2.5rem] leading-[1.08]">
              {t("landing.heroTitle")}
            </h1>
            <p className="mt-4 max-w-lg text-[1rem] text-ink-2">
              {t("landing.heroSubtitle")}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                to="/signup"
                className="inline-flex min-h-[44px] items-center justify-center border border-forest bg-forest px-4 text-[0.9375rem] font-semibold text-surface transition-colors hover:bg-[#0e2b20]"
              >
                {t("action.getStarted")}
              </Link>
              <Link
                to="/login"
                className="inline-flex min-h-[44px] items-center justify-center border border-ink/70 bg-surface px-4 text-[0.9375rem] font-semibold transition-colors hover:bg-surface-2"
              >
                {t("action.signIn")}
              </Link>
              <a
                href="#surveillance"
                className="inline-flex min-h-[44px] items-center justify-center border border-transparent px-4 text-[0.9375rem] font-semibold transition-colors hover:bg-surface-2"
              >
                {t("action.exploreSurveillance")}
              </a>
            </div>
          </div>
          <div className="lg:col-span-7">
            <SignalWeave variant="hero" />
          </div>
        </div>
      </section>

      {/* 2. PROBLEM */}
      <Section
        id="problem"
        n={t("landing.problemNum")}
        title={t("landing.problemTitle")}
        lead={t("landing.problemLead")}
      >
        <ProblemTimeline />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {problems.map((p) => (
            <div key={p.label} className="border border-line bg-surface p-4">
              <p className="text-caption">{p.label}</p>
              <p className="mt-2 text-[0.9375rem] text-ink-2">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 3. HOW IT WORKS */}
      <Section
        id="how"
        n={t("landing.howNum")}
        title={t("landing.howTitle")}
      >
        <ol className="border border-line bg-surface">
          {steps.map(([name, text], i) => (
            <li
              key={name}
              className="grid items-center gap-4 border-b border-line p-4 last:border-b-0 md:grid-cols-[48px_1fr_140px]"
            >
              <p className="num text-[1.25rem] text-ink-2">{String(i + 1).padStart(2, "0")}</p>
              <div>
                <h3 className="text-[1.25rem]">{name}</h3>
                <p className="mt-1 max-w-2xl text-[0.9375rem] text-ink-2">{text}</p>
              </div>
              <div className="justify-self-start md:justify-self-end">
                <StepDiagram i={i} />
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* 4. SIGNAL FUSION */}
      <Section
        id="signals"
        n={t("landing.signalsNum")}
        title={t("landing.signalsTitle")}
        lead={t("landing.signalsLead")}
      >
        <SignalWeave variant="band" />
        <div className="mt-6">
          <DataTable
            caption={t("landing.signalCaption")}
            columns={signalCols}
            rows={signals}
            rowKey={(r) => r.signal}
          />
        </div>
      </Section>

      {/* 5. DETECTION */}
      <Section
        id="detection"
        n={t("landing.detectionNum")}
        title={t("landing.detectionTitle")}
        lead={t("landing.detectionLead")}
      >
        <LeafAnalysisCard />
      </Section>

      {/* 6. FORECAST */}
      <Section
        id="forecast"
        n={t("landing.forecastNum")}
        title={t("landing.forecastTitle")}
        lead={t("landing.forecastLead")}
      >
        <RiskForecast />
      </Section>

      {/* 7. GIS + COMMAND CENTRE */}
      <Section
        id="surveillance"
        n={t("landing.survNum")}
        title={t("landing.survTitle")}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <DistrictMap selected={district} onSelect={setDistrict} />
          <DistrictRanking selected={district} onSelect={setDistrict} />
        </div>
        <p className="mt-3 text-[0.875rem] text-ink-2">
          {t("landing.survCaption")}
        </p>
      </Section>

      {/* 8. EXPERT VALIDATION */}
      <Section
        id="validation"
        n={t("landing.validationNum")}
        title={t("landing.validationTitle")}
      >
        <ol className="grid gap-0 border border-line bg-surface md:grid-cols-5">
          {lifecycle.map(([name, text], i) => (
            <li
              key={name}
              className="relative border-b border-line p-4 last:border-b-0 md:border-b-0 md:border-e md:last:border-e-0"
            >
              <p className="num text-[0.75rem] text-ink-2">
                {String(i + 1).padStart(2, "0")}
                {i < lifecycle.length - 1 ? " →" : ""}
              </p>
              <p className="mt-1 text-[0.9375rem] font-semibold">{name}</p>
              <p className="mt-1 text-[0.875rem] text-ink-2">{text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 max-w-3xl">
          <h3 className="text-[1.25rem]">{t("landing.noAloneDiag")}</h3>
          <p className="mt-2 text-[0.9375rem] text-ink-2">
            {t("landing.noAloneDiagText")}
          </p>
        </div>
      </Section>

      {/* 9. FINAL CTA */}
      <Section id="start" n={t("landing.ctaNum")} title={t("landing.ctaTitle")}>
        <div className="flex flex-col items-start gap-4 border border-line bg-surface p-6 sm:flex-row sm:items-center">
          <p className="max-w-xl text-[0.9375rem] text-ink-2">
            {t("landing.ctaText")}
          </p>
          <div className="flex flex-wrap gap-2 sm:ms-auto">
            <Link
              to="/signup"
              className="inline-flex min-h-[44px] items-center justify-center border border-forest bg-forest px-4 text-[0.9375rem] font-semibold text-surface transition-colors hover:bg-[#0e2b20]"
            >
              {t("action.signUp")}
            </Link>
            <Link
              to="/login"
              className="inline-flex min-h-[44px] items-center justify-center border border-ink/70 bg-surface px-4 text-[0.9375rem] font-semibold transition-colors hover:bg-surface-2"
            >
              {t("action.signIn")}
            </Link>
          </div>
        </div>
      </Section>

      <footer className="border-t border-line py-10">
        <div className="mx-auto grid max-w-[1200px] gap-6 px-4 md:grid-cols-[1fr_auto]">
          <div>
            <LogoHorizontal />
            <p className="mt-3 max-w-md text-[0.875rem] text-ink-2">
              {t("landing.footerDescription")}
            </p>
            <p className="mt-3 max-w-md text-[0.875rem] text-ink-2">
              {t("landing.footerDemo")}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <FooterLanguageSwitcher />
            <Link to="/styleguide" className="text-[0.875rem] underline underline-offset-2">
              {t("nav.styleguide")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterLanguageSwitcher() {
  const { lang, cycle, t } = useT();
  const current = LANGS.find((l) => l.code === lang);
  const next = LANGS[(LANGS.findIndex((l) => l.code === lang) + 1) % LANGS.length];
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`${t("nav.language")}: ${current?.label}. Switch to ${next?.label}`}
      className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap border border-line px-3 text-[0.875rem] font-semibold text-ink transition-colors hover:bg-surface-2"
    >
      <Languages className="size-4 shrink-0" aria-hidden />
      <span>{current?.label}</span>
    </button>
  );
}
