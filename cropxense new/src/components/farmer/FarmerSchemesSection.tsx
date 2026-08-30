/**
 * FarmerSchemesSection — Government Agricultural Schemes & Benefits
 *
 * Browse verified schemes, check eligibility with simple questions.
 */

import { useState, useCallback } from "react";
import { FileText, ExternalLink, CheckCircle2, HelpCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { FARMER_SCHEMES, SCHEME_CATEGORIES, checkSchemeEligibility } from "@/data/schemesData";
import { cx } from "@/lib/cx";
import type { SchemeInfo, Farm } from "@/types";

interface Props {
  farms: Farm[];
  compact?: boolean;
}

export function FarmerSchemesSection({ farms, compact = false }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedScheme, setExpandedScheme] = useState<string | null>(null);
  const [eligibilityScheme, setEligibilityScheme] = useState<string | null>(null);
  const [eligInput, setEligInput] = useState({ crop: farms[0]?.cropId || "", landSizeHa: farms[0]?.areaHa || 0, district: farms[0]?.districtId || "", farmerCategory: "", hasIrrigation: undefined as boolean | undefined });
  const [eligResult, setEligResult] = useState<{ status: string; reason: string } | null>(null);

  const filteredSchemes = selectedCategory === "all"
    ? FARMER_SCHEMES
    : FARMER_SCHEMES.filter((s) => s.category === selectedCategory);

  const displaySchemes = compact ? filteredSchemes.slice(0, 3) : filteredSchemes;

  const handleCheckEligibility = useCallback((schemeId: string) => {
    const result = checkSchemeEligibility(schemeId, {
      ...(eligInput.crop ? { crop: eligInput.crop } : {}),
      ...(eligInput.landSizeHa ? { landSizeHa: eligInput.landSizeHa } : {}),
      ...(eligInput.district ? { district: eligInput.district } : {}),
      ...(eligInput.farmerCategory ? { farmerCategory: eligInput.farmerCategory } : {}),
      ...(eligInput.hasIrrigation !== undefined ? { hasIrrigation: eligInput.hasIrrigation } : {}),
    });
    setEligResult(result);
  }, [eligInput]);

  return (
    <section className="border border-line bg-surface p-5 md:p-6 shadow-panel">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex size-10 items-center justify-center bg-forest/10 shrink-0">
          <FileText className="size-5 text-forest" />
        </div>
        <div>
          <h3 className="font-expanded text-lg font-bold text-ink">Farmer Schemes & Benefits</h3>
          <p className="text-sm text-ink-2 mt-0.5">Discover government agricultural schemes and check your eligibility.</p>
        </div>
      </div>

      {/* Category Filter */}
      {!compact && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedCategory("all")}
            className={cx(
              "px-3 py-1.5 text-xs font-semibold border transition-colors",
              selectedCategory === "all" ? "border-forest bg-forest text-surface" : "border-line bg-surface text-ink hover:bg-surface-2"
            )}
          >
            All Schemes
          </button>
          {SCHEME_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cx(
                "px-3 py-1.5 text-xs font-semibold border transition-colors",
                selectedCategory === cat.id ? "border-forest bg-forest text-surface" : "border-line bg-surface text-ink hover:bg-surface-2"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Scheme Cards */}
      <div className="space-y-3">
        {displaySchemes.map((scheme) => (
          <SchemeCard
            key={scheme.id}
            scheme={scheme}
            expanded={expandedScheme === scheme.id}
            onToggle={() => setExpandedScheme(expandedScheme === scheme.id ? null : scheme.id)}
            showEligibility={eligibilityScheme === scheme.id}
            onCheckEligibility={() => {
              setEligibilityScheme(eligibilityScheme === scheme.id ? null : scheme.id);
              setEligResult(null);
            }}
            eligInput={eligInput}
            setEligInput={setEligInput}
            eligResult={eligResult}
            onSubmitEligibility={() => handleCheckEligibility(scheme.id)}
          />
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-4 border-t border-line pt-3">
        <p className="text-xs text-ink-2 italic">
          ℹ️ Information reference — verify eligibility with the official agriculture department. Scheme details may change. Last verified: August 2026.
        </p>
      </div>
    </section>
  );
}

function SchemeCard({
  scheme,
  expanded,
  onToggle,
  showEligibility,
  onCheckEligibility,
  eligInput,
  setEligInput,
  eligResult,
  onSubmitEligibility,
}: {
  scheme: SchemeInfo;
  expanded: boolean;
  onToggle: () => void;
  showEligibility: boolean;
  onCheckEligibility: () => void;
  eligInput: { crop: string; landSizeHa: number; district: string; farmerCategory: string; hasIrrigation: boolean | undefined };
  setEligInput: (v: any) => void;
  eligResult: { status: string; reason: string } | null;
  onSubmitEligibility: () => void;
}) {
  const categoryLabel = SCHEME_CATEGORIES.find((c) => c.id === scheme.category)?.label || scheme.category;

  return (
    <div className="border border-line bg-surface">
      {/* Header */}
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface-2 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[0.65rem] font-bold uppercase tracking-wider text-forest bg-forest/10 px-2 py-0.5">{categoryLabel}</span>
          </div>
          <h4 className="font-semibold text-sm text-ink mt-1 truncate">{scheme.name}</h4>
          <p className="text-xs text-ink-2 mt-0.5 line-clamp-1">{scheme.description}</p>
        </div>
        {expanded ? <ChevronUp className="size-4 text-ink-2 shrink-0 ml-2" /> : <ChevronDown className="size-4 text-ink-2 shrink-0 ml-2" />}
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-line pt-3 space-y-3 text-sm">
          <div><span className="font-semibold text-ink">Who can benefit:</span> <span className="text-ink-2">{scheme.eligibility}</span></div>
          <div><span className="font-semibold text-ink">Benefits:</span> <span className="text-ink-2">{scheme.benefits}</span></div>
          <div><span className="font-semibold text-ink">Required documents:</span> <span className="text-ink-2">{scheme.documents}</span></div>
          <div><span className="font-semibold text-ink">How to apply:</span> <span className="text-ink-2">{scheme.applicationMethod}</span></div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onCheckEligibility}
              className="inline-flex items-center gap-1.5 border border-forest bg-forest/5 px-3 py-2 text-xs font-semibold text-forest hover:bg-forest/10 transition-colors"
            >
              <HelpCircle className="size-3.5" />
              {showEligibility ? "Hide" : "Check Eligibility"}
            </button>
            <a
              href={scheme.officialSource}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:underline"
            >
              <ExternalLink className="size-3" />
              Official Website
            </a>
          </div>

          {/* Eligibility Checker */}
          {showEligibility && (
            <div className="border border-forest/20 bg-forest/5 p-3 mt-2 space-y-2">
              <p className="text-xs font-semibold text-forest">Quick Eligibility Check</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={eligInput.crop}
                  onChange={(e) => setEligInput({ ...eligInput, crop: e.target.value })}
                  placeholder="Crop"
                  className="border border-line px-2 py-1.5 text-xs text-ink bg-surface focus:border-forest focus:outline-none"
                />
                <input
                  type="number"
                  value={eligInput.landSizeHa || ""}
                  onChange={(e) => setEligInput({ ...eligInput, landSizeHa: Number(e.target.value) })}
                  placeholder="Land size (ha)"
                  className="border border-line px-2 py-1.5 text-xs text-ink bg-surface focus:border-forest focus:outline-none"
                />
                <input
                  value={eligInput.district}
                  onChange={(e) => setEligInput({ ...eligInput, district: e.target.value })}
                  placeholder="Location / District"
                  className="border border-line px-2 py-1.5 text-xs text-ink bg-surface focus:border-forest focus:outline-none"
                />
                <select
                  value={eligInput.hasIrrigation === undefined ? "" : eligInput.hasIrrigation ? "yes" : "no"}
                  onChange={(e) => setEligInput({ ...eligInput, hasIrrigation: e.target.value === "" ? undefined : e.target.value === "yes" })}
                  className="border border-line px-2 py-1.5 text-xs text-ink bg-surface focus:border-forest focus:outline-none"
                >
                  <option value="">Irrigation?</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <button
                onClick={onSubmitEligibility}
                className="inline-flex items-center gap-1.5 bg-forest px-3 py-1.5 text-xs font-semibold text-surface hover:bg-[#0e2b20] transition-colors"
              >
                Check
              </button>

              {eligResult && (
                <div className={cx(
                  "border px-3 py-2 mt-2 text-xs",
                  eligResult.status === "likely_eligible" ? "border-leaf/30 bg-leaf/10 text-leaf" :
                  eligResult.status === "needs_verification" ? "border-amber/30 bg-amber/10 text-amber" :
                  "border-line bg-surface-2 text-ink-2"
                )}>
                  <span className="font-bold uppercase">
                    {eligResult.status === "likely_eligible" ? "✅ Likely Eligible" :
                     eligResult.status === "needs_verification" ? "⚠️ Needs Verification" :
                     "ℹ️ Not Enough Information"}
                  </span>
                  <p className="mt-1">{eligResult.reason}</p>
                  <p className="mt-1 italic text-ink-2">⚠️ This is not a guarantee. Verify with your agriculture department.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
