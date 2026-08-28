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

const TIMELINE = [
  { day: 0, label: "Day 0", text: "Infection begins" },
  { day: 6, label: "Day 6", text: "First visible symptom" },
  { day: 9, label: "Day 9", text: "Farmer notices" },
  { day: 14, label: "Day 14", text: "Advice reaches farmer" },
];

function ProblemTimeline() {
  const span = 16;
  const pct = (d: number) => (d / span) * 100;
  return (
    <div className="border border-line bg-surface p-4">
      <p className="text-caption">Typical delay between infection and advice</p>
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
        {TIMELINE.map((t) => (
          <div
            key={t.day}
            className="absolute top-0 w-[132px] -translate-x-1/2 text-center"
            style={{ left: `${Math.min(Math.max(pct(t.day), 6), 94)}%` }}
          >
            <p className="num text-[0.75rem] font-semibold">{t.label}</p>
            <div className="mx-auto mt-1 h-[14px] w-px bg-ink" />
            <p className="mt-1 text-[0.75rem] leading-tight text-ink-2">{t.text}</p>
          </div>
        ))}
        <p
          className="absolute bottom-0 text-[0.75rem] font-semibold text-amber"
          style={{ left: "1%" }}
        >
          The window CropXense targets
        </p>
      </div>
    </div>
  );
}

const PROBLEMS = [
  {
    label: "Visibility",
    body: "Damage becomes visible only after the pathogen or pest has already spread through part of the field. By the time a farmer can see it, the cheapest response window has closed.",
  },
  {
    label: "Reach",
    body: "Extension staff cover large areas with limited field days. Laboratory diagnosis is accurate but not immediate, and a sample sent today may return a result after the decision was needed.",
  },
  {
    label: "Fragmentation",
    body: "Weather, crop stage, variety, soil condition and local pest history all carry risk signal. They sit in separate systems and are never combined at the level of an individual farm.",
  },
];

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

const STEPS = [
  ["Detect", "A field image, a sensor reading or a trap count is turned into a candidate finding with a confidence value and marked evidence regions."],
  ["Predict", "Weather, crop stage and local case history are combined into a 7-day infection-risk curve for that specific parcel."],
  ["Act", "The farmer receives an advisory in Marathi, Hindi or English — cultural and biological measures first, chemical only with an extension officer's approval."],
  ["Verify", "A plant-protection officer reviews the evidence and confirms, corrects or rejects the finding. The case status changes only after that review."],
  ["Learn", "Every confirmed correction returns to the model as labelled training signal, and the district risk baseline is updated."],
];

/* ---------- 4. signal fusion ---------- */

type SignalRow = {
  signal: string;
  source: string;
  refresh: string;
  tells: string;
  scope: string;
};

const SIGNALS: SignalRow[] = [
  { signal: "Field image", source: "Farmer or officer upload", refresh: "On demand", tells: "Lesion type, severity, affected area", scope: "Parcel" },
  { signal: "Sensor", source: "In-field node", refresh: "15 min", tells: "Leaf wetness, soil moisture, relative humidity", scope: "Parcel" },
  { signal: "Weather", source: "IMD grid + station", refresh: "Hourly", tells: "Infection-favourable conditions", scope: "Block" },
  { signal: "Pest trap", source: "Pheromone / light trap count", refresh: "Weekly", tells: "Population against economic threshold", scope: "Village" },
  { signal: "History", source: "Confirmed case archive", refresh: "Continuous", tells: "Local recurrence risk", scope: "District" },
];

/* ---------- 8. lifecycle ---------- */

const LIFECYCLE = [
  ["AI detected", "Candidate finding with confidence and marked evidence."],
  ["Awaiting validation", "Queued to a plant-protection officer. Nothing is published as fact yet."],
  ["Expert confirmed", "Officer confirms or corrects the finding on the evidence shown."],
  ["Field confirmed", "Ground check records what was actually found in the plot."],
  ["Resolved", "Outcome recorded and returned to the model and the district baseline."],
];

function Landing() {
  const [district, setDistrict] = useState<string | null>("akola");

  const signalCols: Column<SignalRow>[] = [
    { key: "signal", header: "Signal", width: "16%" },
    { key: "source", header: "Source", width: "22%" },
    { key: "refresh", header: "Refresh", width: "12%" },
    { key: "tells", header: "What it tells us", width: "34%" },
    { key: "scope", header: "Scope", width: "12%" },
  ];

  return (
    <div className="bg-paper">
      {/* 1. HERO */}
      <section aria-labelledby="hero-h" className="py-[96px] lg:py-[112px]">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-caption">
              Government of Maharashtra · Smart India Hackathon 2026 · PS 26131
            </p>
            <h1 id="hero-h" className="mt-4 font-expanded text-[2.5rem] leading-[1.08]">
              Detect crop threats before they become crop losses.
            </h1>
            <p className="mt-4 max-w-lg text-[1rem] text-ink-2">
              CropXense combines field images, sensor signals, weather patterns and local outbreak
              intelligence so farmers and agriculture teams can act while a problem is still small.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                to="/signup"
                className="inline-flex min-h-[44px] items-center justify-center border border-forest bg-forest px-4 text-[0.9375rem] font-semibold text-surface transition-colors hover:bg-[#0e2b20]"
              >
                Get started
              </Link>
              <Link
                to="/login"
                className="inline-flex min-h-[44px] items-center justify-center border border-ink/70 bg-surface px-4 text-[0.9375rem] font-semibold transition-colors hover:bg-surface-2"
              >
                Sign in
              </Link>
              <a
                href="#surveillance"
                className="inline-flex min-h-[44px] items-center justify-center border border-transparent px-4 text-[0.9375rem] font-semibold transition-colors hover:bg-surface-2"
              >
                Explore surveillance
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
        n="01"
        title="The loss happens in the gap between infection and advice."
        lead="Nothing in that gap is missing information — the information exists, just not in one place and not in time."
      >
        <ProblemTimeline />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PROBLEMS.map((p) => (
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
        n="02"
        title="Five ordered stages, each with a human checkpoint."
      >
        <ol className="border border-line bg-surface">
          {STEPS.map(([name, text], i) => (
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
        n="03"
        title="Five inputs, one parcel-level verdict."
        lead="Each input is weak on its own. Combined against the same parcel and the same week, they become a decision."
      >
        <SignalWeave variant="band" />
        <div className="mt-6">
          <DataTable
            caption="Signal inputs, their sources, refresh rate and what each contributes"
            columns={signalCols}
            rows={SIGNALS}
            rowKey={(r) => r.signal}
          />
        </div>
      </Section>

      {/* 5. DETECTION */}
      <Section
        id="detection"
        n="04"
        title="Crop health detection, with its reasoning exposed."
        lead="A live example. Switch between the submitted sample and the analysis overlay, and open the evidence panel to see what the assessment rests on."
      >
        <LeafAnalysisCard />
      </Section>

      {/* 6. FORECAST */}
      <Section
        id="forecast"
        n="05"
        title="Risk forecasting for the week ahead."
        lead="Select a day to see the conditions driving that day's infection risk."
      >
        <RiskForecast />
      </Section>

      {/* 7. GIS + COMMAND CENTRE */}
      <Section
        id="surveillance"
        n="06"
        title="District surveillance and field-visit prioritisation."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <DistrictMap selected={district} onSelect={setDistrict} />
          <DistrictRanking selected={district} onSelect={setDistrict} />
        </div>
        <p className="mt-3 text-[0.875rem] text-ink-2">
          Officer view — district-level surveillance and field-visit prioritisation.
        </p>
      </Section>

      {/* 8. EXPERT VALIDATION */}
      <Section
        id="validation"
        n="07"
        title="Every case carries a human checkpoint."
      >
        <ol className="grid gap-0 border border-line bg-surface md:grid-cols-5">
          {LIFECYCLE.map(([name, text], i) => (
            <li
              key={name}
              className="relative border-b border-line p-4 last:border-b-0 md:border-b-0 md:border-e md:last:border-e-0"
            >
              <p className="num text-[0.75rem] text-ink-2">
                {String(i + 1).padStart(2, "0")}
                {i < LIFECYCLE.length - 1 ? " →" : ""}
              </p>
              <p className="mt-1 text-[0.9375rem] font-semibold">{name}</p>
              <p className="mt-1 text-[0.875rem] text-ink-2">{text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 max-w-3xl">
          <h3 className="text-[1.25rem]">The system does not diagnose alone</h3>
          <p className="mt-2 text-[0.9375rem] text-ink-2">
            Every detection is published with its confidence value and the evidence it rests on —
            image regions, sensor readings, weather window, and nearby confirmed cases. No advisory
            reaches a farmer as a settled diagnosis: each one routes to a plant-protection officer
            who can confirm, correct or reject it. Treatment guidance follows an IPM ladder —
            cultural and biological measures first, chemical control only with an extension
            officer's referral. Every correction is stored as labelled training signal and
            returned to the model.
          </p>
        </div>
      </Section>

      {/* 9. FINAL CTA */}
      <Section id="start" n="08" title="Start with a district, or with a single leaf.">
        <div className="flex flex-col items-start gap-4 border border-line bg-surface p-6 sm:flex-row sm:items-center">
          <p className="max-w-xl text-[0.9375rem] text-ink-2">
            The officer dashboard opens on live district reports. The farmer flow starts with one
            photograph of an affected plant.
          </p>
          <div className="flex flex-wrap gap-2 sm:ms-auto">
            <Link
              to="/signup"
              className="inline-flex min-h-[44px] items-center justify-center border border-forest bg-forest px-4 text-[0.9375rem] font-semibold text-surface transition-colors hover:bg-[#0e2b20]"
            >
              Create your account
            </Link>
            <Link
              to="/login"
              className="inline-flex min-h-[44px] items-center justify-center border border-ink/70 bg-surface px-4 text-[0.9375rem] font-semibold transition-colors hover:bg-surface-2"
            >
              Sign in
            </Link>
          </div>
        </div>
      </Section>

      <footer className="border-t border-line py-10">
        <div className="mx-auto grid max-w-[1200px] gap-6 px-4 md:grid-cols-[1fr_auto]">
          <div>
            <LogoHorizontal />
            <p className="mt-3 max-w-md text-[0.875rem] text-ink-2">
              Crop disease and pest surveillance for the Department of Agriculture, Government of
              Maharashtra. Smart India Hackathon 2026 · Problem Statement 26131.
            </p>
            <p className="mt-3 max-w-md text-[0.875rem] text-ink-2">
              Demo data: all figures, cases, districts and readings shown on this page are
              representative demonstration data, not operational records.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <FooterLanguageSwitcher />
            <Link to="/styleguide" className="text-[0.875rem] underline underline-offset-2">
              Style guide
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

