/**
 * /expert/knowledge — National Crop Disease Knowledge Base & Diagnostic Reference.
 *
 * Scientific encyclopedia of regional pathogens, lesion morphology markers,
 * host crop vulnerabilities, lookalike differential diagnosis, and IPM controls.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  BookOpen,
  Search,
  FlaskConical,
  Sprout,
  ShieldAlert,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  Microscope,
  Layers,
  Leaf,
  Bug,
  Filter,
} from "lucide-react";
import { DISEASES, CROPS, PESTS } from "@/data/reference";
import { cropName } from "@/services";
import { getPathologySpecimen, PATHOLOGY_SPECIMENS } from "@/data/pathologySpecimens";
import { SpecimenViewer } from "@/components/expert/SpecimenViewer";
import { cx } from "@/lib/cx";

export const Route = createFileRoute("/expert/knowledge")({
  head: () => ({
    meta: [
      { title: "Disease Knowledge Base & Pathology Reference — Expert Validation" },
      {
        name: "description",
        content: "Reference diagnostic manual of Indian crop pathogens, fungal leaf spots, differential taxonomy, and IPM protocols.",
      },
    ],
  }),
  component: ExpertKnowledgePage,
});

export type ThreatItem = {
  id: string;
  name: string;
  category: "disease" | "pest";
  scientificName: string;
  cropIds: string[];
  favourable?: string;
  cultural?: string[];
  biological?: string[];
  chemical?: string[];
  etl?: string;
};

const ALL_TAXA: ThreatItem[] = [
  ...DISEASES.map((d) => ({
    id: d.id,
    name: d.name,
    category: "disease" as const,
    scientificName: d.pathogen,
    cropIds: d.cropIds,
    favourable: d.favourable,
    cultural: d.cultural,
    biological: d.biological,
    chemical: d.chemical,
  })),
  ...PESTS.map((p) => ({
    id: p.id,
    name: p.name,
    category: "pest" as const,
    scientificName: p.scientific,
    cropIds: p.cropIds,
    etl: p.etl,
    cultural: p.cultural,
    biological: p.biological,
    chemical: p.chemical,
  })),
];

function ExpertKnowledgePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "disease" | "pest">("all");
  const [cropFilter, setCropFilter] = useState<string>("");
  const [selectedThreatId, setSelectedThreatId] = useState<string>("bacterial_blight");
  const [activeTab, setActiveTab] = useState<"overview" | "differential" | "ipm" | "microscope">("overview");

  const filteredThreats = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return ALL_TAXA.filter((t) => {
      const matchCat = categoryFilter === "all" || t.category === categoryFilter;
      const matchCrop = !cropFilter || t.cropIds.includes(cropFilter);
      const matchSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.scientificName.toLowerCase().includes(q) ||
        t.cropIds.some((c) => cropName(c).toLowerCase().includes(q));

      return matchCat && matchCrop && matchSearch;
    });
  }, [searchQuery, categoryFilter, cropFilter]);

  const selectedThreat = useMemo(() => {
    return ALL_TAXA.find((t) => t.id === selectedThreatId) || filteredThreats[0] || ALL_TAXA[0]!;
  }, [selectedThreatId, filteredThreats]);

  const specimen = getPathologySpecimen(selectedThreat?.id ?? "bacterial_blight");

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border border-line bg-surface p-5 md:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="text-caption text-forest">National Plant Pathology Reference</span>
            <h1 className="mt-1 font-expanded text-[1.5rem] md:text-[1.875rem]">
              Disease Knowledge Base & Diagnostic Reference
            </h1>
            <p className="mt-1 text-[0.875rem] text-ink-2">
              Comprehensive diagnostic taxonomy, lesion symptom signatures, lookalike differentials, and certified IPM chemical guidelines for crops across India.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1 text-[0.8125rem] font-semibold text-forest">
              <BookOpen className="size-3.5" />
              <span>{ALL_TAXA.length} Registered Pathogens & Pests</span>
            </span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-2" />
            <input
              type="text"
              placeholder="Search pathogen, scientific name, crop…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-line bg-paper py-2 pl-9 pr-3 text-[0.8125rem] text-ink outline-none focus:border-forest"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="w-full border border-line bg-paper py-2 px-3 text-[0.8125rem] text-ink outline-none focus:border-forest"
            >
              <option value="all">All Pathogen Classes (Diseases & Pests)</option>
              <option value="disease">Fungal, Bacterial & Viral Diseases</option>
              <option value="pest">Insect Pests & Vector Complexes</option>
            </select>
          </div>

          {/* Crop Filter */}
          <div>
            <select
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              className="w-full border border-line bg-paper py-2 px-3 text-[0.8125rem] text-ink outline-none focus:border-forest"
            >
              <option value="">All Host Crops ({CROPS.length})</option>
              {CROPS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main 2-Column Knowledge Browser */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Pathogen Directory (35%) */}
        <div className="space-y-2 lg:col-span-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-[1rem] font-semibold text-ink">
              Pathogen Catalog ({filteredThreats.length})
            </h2>
          </div>

          <div className="space-y-2 max-h-[760px] overflow-y-auto pr-1">
            {filteredThreats.map((d) => {
              const isSelected = selectedThreat?.id === d.id;
              const cropsList = d.cropIds.map((c) => cropName(c)).join(", ");

              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedThreatId(d.id)}
                  className={cx(
                    "w-full text-left rounded-[var(--r)] border p-3 transition-all",
                    isSelected
                      ? "border-forest bg-surface ring-2 ring-forest shadow-md"
                      : "border-line bg-surface hover:bg-surface-2",
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Real Crop Photo Thumbnail */}
                    <div className="size-14 shrink-0 rounded overflow-hidden border border-line bg-[#0c120e]">
                      <img
                        src={`/crops/${d.id}.jpg`}
                        alt={d.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/crops/bacterial_blight.jpg";
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-display text-[0.875rem] font-bold text-ink truncate">
                          {d.name}
                        </span>
                        <span
                          className={cx(
                            "inline-flex items-center px-1.5 py-0.2 text-[0.625rem] font-semibold uppercase border rounded shrink-0",
                            d.category === "disease"
                              ? "border-alert/30 bg-alert/10 text-alert"
                              : "border-amber/30 bg-amber/10 text-amber",
                          )}
                        >
                          {d.category}
                        </span>
                      </div>

                      <p className="font-mono text-[0.6875rem] italic text-ink-2 truncate">
                        {d.scientificName}
                      </p>

                      <div className="mt-1 flex items-center justify-between text-[0.6875rem] text-ink-2 border-t border-line/40 pt-1">
                        <span className="truncate">Host: <strong className="text-ink">{cropsList}</strong></span>
                        <ChevronRight className="size-3.5 text-forest shrink-0" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Scientific Pathological Dossier (65%) */}
        <div className="space-y-5 lg:col-span-8">
          {selectedThreat ? (
            <div className="border border-line bg-surface p-5 md:p-6 space-y-6">
              {/* Pathogen Title & Taxonomy */}
              <div className="border-b border-line pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 text-[0.75rem] font-bold border border-forest bg-forest text-surface rounded uppercase">
                    {specimen.pathogenType}
                  </span>
                  <span className="text-[0.8125rem] text-ink-2">
                    Host Crops: <strong className="text-ink">{selectedThreat.cropIds.map((c) => cropName(c)).join(", ")}</strong>
                  </span>
                </div>

                <h2 className="mt-2 font-expanded text-[1.75rem] font-bold text-ink">
                  {selectedThreat.name}
                </h2>
                <p className="font-mono text-[0.9375rem] italic text-forest font-semibold">
                  {selectedThreat.scientificName}
                </p>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-line pb-2">
                {[
                  { id: "overview", label: "Diagnostic Overview & Visual Specimen" },
                  { id: "differential", label: "Differential Diagnosis (Lookalikes)" },
                  { id: "ipm", label: "Standardized IPM Control Protocols" },
                  { id: "microscope", label: "Microscopic Markers" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id as any)}
                    className={cx(
                      "px-3 py-1.5 text-[0.8125rem] font-semibold transition-colors rounded-[var(--r)]",
                      activeTab === t.id
                        ? "bg-forest text-surface"
                        : "border border-line bg-paper text-ink hover:bg-surface-2",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: DIAGNOSTIC OVERVIEW & SPECIMEN */}
              {activeTab === "overview" && (
                <div className="space-y-5">
                  {/* Visual Specimen Viewer */}
                  <div>
                    <span className="text-caption text-forest mb-1.5 block">
                      Authentic Lesion Morphology Plate
                    </span>
                    <SpecimenViewer
                      threatId={selectedThreat.id}
                      threatName={selectedThreat.name}
                      cropName={selectedThreat.cropIds.map((c) => cropName(c)).join(", ")}
                      confidence={94}
                    />
                  </div>

                  {/* Diagnostic Signature */}
                  <div className="border border-line bg-paper p-4 space-y-1.5">
                    <span className="text-caption text-forest font-semibold flex items-center gap-1">
                      <CheckCircle2 className="size-3.5" />
                      <span>Definitive Field Symptom Signature</span>
                    </span>
                    <p className="text-[0.875rem] text-ink leading-relaxed font-medium">
                      {specimen.diagnosticSignature}
                    </p>
                  </div>

                  {/* Environmental Window */}
                  {selectedThreat.favourable && (
                    <div className="border border-line bg-paper p-4 space-y-1.5">
                      <span className="text-caption text-water font-semibold flex items-center gap-1">
                        <FlaskConical className="size-3.5" />
                        <span>Favourable Environmental Window</span>
                      </span>
                      <p className="text-[0.875rem] text-ink leading-relaxed">
                        {selectedThreat.favourable}
                      </p>
                    </div>
                  )}

                  {/* Economic Threshold Level (ETL) */}
                  {selectedThreat.etl && (
                    <div className="border border-line bg-paper p-4 space-y-1.5">
                      <span className="text-caption text-amber font-semibold flex items-center gap-1">
                        <AlertTriangle className="size-3.5" />
                        <span>Economic Threshold Level (ETL)</span>
                      </span>
                      <p className="text-[0.875rem] text-ink font-semibold">
                        {selectedThreat.etl}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DIFFERENTIAL DIAGNOSIS */}
              {activeTab === "differential" && (
                <div className="space-y-4">
                  <div className="border border-line bg-paper p-4">
                    <h3 className="font-display font-semibold text-ink text-[1rem]">
                      Differential Diagnosis & Lookalike Disambiguation Matrix
                    </h3>
                    <p className="text-[0.8125rem] text-ink-2 mt-1">
                      Key diagnostic criteria to separate {selectedThreat.name} from similar abiotic stresses, nutrient deficiencies, or secondary pathogens.
                    </p>
                  </div>

                  <div className="overflow-x-auto border border-line">
                    <table className="w-full text-left text-[0.8125rem]">
                      <thead>
                        <tr className="border-b border-line bg-surface-2 text-caption text-ink-2">
                          <th className="p-3 font-semibold">Candidate Condition</th>
                          <th className="p-3 font-semibold">Distinguishing Foliar Features</th>
                          <th className="p-3 font-semibold">Microscopic / Chemical Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line bg-surface">
                        <tr>
                          <td className="p-3 font-bold text-forest">{selectedThreat.name} (True Finding)</td>
                          <td className="p-3 text-ink">{specimen.diagnosticSignature}</td>
                          <td className="p-3 text-ink-2 font-mono text-xs">{specimen.microscopeFeatures[0]}</td>
                        </tr>
                        <tr className="bg-surface-2/40">
                          <td className="p-3 font-semibold text-ink">Abiotic Leaf Scorch / Heat Stress</td>
                          <td className="p-3 text-ink-2">Marginal yellowing without necrotic water-soaked halos; uniform across sun-exposed upper canopy.</td>
                          <td className="p-3 text-ink-2 font-mono text-xs">No bacterial streaming or fungal conidia present under 400× magnification.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-ink">Nutrient Deficiency (Fe / Mg Chlorosis)</td>
                          <td className="p-3 text-ink-2">Interveinal yellowing with prominent green veins; symmetrical across leaf pairs; no necrotic spots initially.</td>
                          <td className="p-3 text-ink-2 font-mono text-xs">Rapid foliar response (3-5 days) to micronutrient sulfate spray.</td>
                        </tr>
                        <tr className="bg-surface-2/40">
                          <td className="p-3 font-semibold text-ink">Secondary Fungal Leaf Spot</td>
                          <td className="p-3 text-ink-2">Circular brown spots without vein-boundary limitations; concentric dark rings absent or irregular.</td>
                          <td className="p-3 text-ink-2 font-mono text-xs">Distinct spore morphology on potato dextrose agar (PDA) culture.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: STANDARDIZED IPM PROTOCOLS */}
              {activeTab === "ipm" && (
                <div className="space-y-4">
                  {/* Cultural Controls */}
                  <div className="border border-line bg-paper p-4 space-y-2">
                    <span className="text-caption text-forest font-semibold flex items-center gap-1.5">
                      <Sprout className="size-4" />
                      <span>1. Cultural & Sanitary Management Practices</span>
                    </span>
                    <ul className="space-y-1.5 text-[0.8125rem] text-ink pl-4 list-disc">
                      {(selectedThreat.cultural ?? ["Crop rotation with non-host crops", "Field sanitation and destruction of infected stubble", "Proper spacing to ensure aeration"]).map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Biological Controls */}
                  <div className="border border-line bg-paper p-4 space-y-2">
                    <span className="text-caption text-leaf font-semibold flex items-center gap-1.5">
                      <Leaf className="size-4" />
                      <span>2. Biological & Biocontrol Formulations</span>
                    </span>
                    <ul className="space-y-1.5 text-[0.8125rem] text-ink pl-4 list-disc">
                      {(selectedThreat.biological ?? ["Seed treatment with biocontrol agents", "Installation of pheromone / sticky traps at recommended density", "Conservation of natural predators"]).map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Chemical Formulations */}
                  <div className="border border-line bg-paper p-4 space-y-2">
                    <span className="text-caption text-alert font-semibold flex items-center gap-1.5">
                      <FlaskConical className="size-4" />
                      <span>3. Approved Chemical Formulations & Dose Guidelines</span>
                    </span>
                    <ul className="space-y-1.5 text-[0.8125rem] text-ink pl-4 list-disc">
                      {(selectedThreat.chemical ?? ["Use registered chemical formulation on expert advice", "Ensure rotation of chemical modes of action (FRAC/IRAC)", "Observe strict Pre-Harvest Intervals (PHI)"]).map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 4: MICROSCOPIC MARKERS */}
              {activeTab === "microscope" && (
                <div className="space-y-4">
                  <div className="border border-line bg-paper p-4">
                    <h3 className="font-display font-semibold text-ink text-[1rem] flex items-center gap-2">
                      <Microscope className="size-4 text-forest" />
                      <span>Laboratory & Microscopy Diagnostic Markers</span>
                    </h3>
                    <p className="text-[0.8125rem] text-ink-2 mt-1">
                      Cellular structures, sporulation characteristics, and diagnostic assays for lab validation.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {specimen.microscopeFeatures.map((feat, idx) => (
                      <div key={idx} className="border border-line bg-paper p-3.5 space-y-1">
                        <span className="text-caption text-forest font-mono">Marker #{idx + 1}</span>
                        <p className="text-[0.8125rem] font-semibold text-ink">{feat}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
