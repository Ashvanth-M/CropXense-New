/**
 * /expert/knowledge — Maharashtra Crop Disease Knowledge Base & Diagnostic Reference.
 *
 * Scientific encyclopedia of regional pathogens, lesion morphology markers,
 * host crop vulnerabilities, and state-approved IPM chemistries.
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
} from "lucide-react";
import { DISEASES, CROPS, PESTS } from "@/data/reference";
import { cropName } from "@/services";

export const Route = createFileRoute("/expert/knowledge")({
  head: () => ({
    meta: [
      { title: "Disease Knowledge Base — Expert Validation" },
      {
        name: "description",
        content: "Reference diagnostic manual of Maharashtra crop pathogens, fungal leaf spots, and IPM controls.",
      },
    ],
  }),
  component: ExpertKnowledgePage,
});

function ExpertKnowledgePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string>(DISEASES[0]?.id || "bacterial_blight");

  const filteredDiseases = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return DISEASES;
    return DISEASES.filter((d) => {
      const matchName = d.name.toLowerCase().includes(q);
      const matchPathogen = (d.pathogen || "").toLowerCase().includes(q);
      const matchCrops = (d.cropIds || []).some((c) => cropName(c).toLowerCase().includes(q));
      return matchName || matchPathogen || matchCrops;
    });
  }, [searchQuery]);

  const selectedDisease = useMemo(() => {
    return DISEASES.find((d) => d.id === selectedDiseaseId) || filteredDiseases[0] || DISEASES[0]!;
  }, [selectedDiseaseId, filteredDiseases]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-line bg-surface p-5 md:p-6">
        <span className="text-caption text-forest">Pathology Reference Library</span>
        <h1 className="mt-1 font-expanded text-[1.5rem] md:text-[1.875rem]">Disease Knowledge Base</h1>
        <p className="mt-1 text-[0.875rem] text-ink-2">
          Diagnostic taxonomy, lesion symptom signatures, and IPM chemical guidelines for Maharashtra crops.
        </p>

        {/* Search Input */}
        <div className="mt-4 relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-2" />
          <input
            type="text"
            placeholder="Search pathogen, scientific name, crop…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-line bg-paper py-2 pl-9 pr-3 text-[0.8125rem] text-ink outline-none focus:border-forest"
          />
        </div>
      </div>

      {/* Main 2-Column Knowledge Browser */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Disease List (35%) */}
        <div className="space-y-2 lg:col-span-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-[1rem] font-semibold text-ink">
              Registered Pathogens ({filteredDiseases.length})
            </h2>
          </div>

          <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
            {filteredDiseases.map((d) => {
              const isSelected = selectedDisease?.id === d.id;
              const cropsList = (d.cropIds || []).map((c) => cropName(c)).join(", ");

              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDiseaseId(d.id)}
                  className={`w-full text-left rounded-[var(--r)] border p-3.5 transition-all ${
                    isSelected
                      ? "border-forest bg-surface ring-2 ring-forest shadow-panel"
                      : "border-line bg-surface hover:bg-surface-2"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[0.9375rem] font-bold text-ink">{d.name}</span>
                    <span className="num rounded-[var(--r)] bg-surface-2 px-2 py-0.5 text-[0.6875rem] font-bold text-forest">
                      {d.id}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[0.75rem] italic text-ink-2">{d.pathogen}</p>
                  <p className="mt-1 text-[0.75rem] text-ink-2">
                    Host Crops: <strong className="text-ink">{cropsList || "Multi-crop"}</strong>
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Pathogen Monograph & Guidelines (65%) */}
        <div className="space-y-5 lg:col-span-8">
          {selectedDisease ? (
            <div className="border border-line bg-surface p-5 md:p-6 space-y-5">
              <div className="border-b border-line pb-4">
                <div className="flex items-center gap-2">
                  <span className="num text-[0.75rem] font-bold text-forest">{selectedDisease.id}</span>
                  <span className="rounded-[var(--r)] bg-forest/10 px-2 py-0.5 text-[0.6875rem] font-bold uppercase text-forest">
                    Pathogen Monograph
                  </span>
                </div>
                <h2 className="mt-1 font-expanded text-[1.5rem] text-ink">{selectedDisease.name}</h2>
                <p className="text-[0.875rem] italic text-ink-2">{selectedDisease.pathogen}</p>
              </div>

              {/* Diagnostic Marker Info */}
              <div className="grid gap-4 sm:grid-cols-2 text-[0.875rem]">
                <div className="border border-line bg-paper p-3.5">
                  <span className="text-caption text-forest">Host Crops</span>
                  <p className="mt-1 font-semibold text-ink">
                    {(selectedDisease.cropIds || []).map((c) => cropName(c)).join(", ")}
                  </p>
                </div>

                <div className="border border-line bg-paper p-3.5">
                  <span className="text-caption text-forest">Favourable Microclimate</span>
                  <p className="mt-1 text-[0.8125rem] text-ink">
                    {selectedDisease.favourable || "High relative humidity with warm canopy temperatures."}
                  </p>
                </div>
              </div>

              {/* IPM Protocols */}
              <div className="border border-forest/30 bg-surface-2 p-5 space-y-4">
                <h3 className="font-display text-[1rem] font-bold text-forest flex items-center gap-2">
                  <ShieldAlert className="size-4" />
                  <span>Standardized Maharashtra IPM Control Protocols</span>
                </h3>

                <div className="space-y-3 text-[0.8125rem]">
                  {/* Cultural */}
                  {selectedDisease.cultural && selectedDisease.cultural.length > 0 && (
                    <div className="border border-line bg-paper p-3">
                      <strong className="block font-semibold text-forest">1. Cultural & Mechanical Sanitation</strong>
                      <ul className="mt-1 space-y-1 text-ink">
                        {selectedDisease.cultural.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-forest font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Biological */}
                  {selectedDisease.biological && selectedDisease.biological.length > 0 && (
                    <div className="border border-line bg-paper p-3">
                      <strong className="block font-semibold text-leaf">2. Biological & Organic Measures</strong>
                      <ul className="mt-1 space-y-1 text-ink">
                        {selectedDisease.biological.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-leaf font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Chemical */}
                  {selectedDisease.chemical && selectedDisease.chemical.length > 0 && (
                    <div className="border border-line bg-paper p-3">
                      <strong className="block font-semibold text-amber">3. Chemical Referral (Upon Verification)</strong>
                      <ul className="mt-1 space-y-1 text-ink">
                        {selectedDisease.chemical.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-line bg-surface p-12 text-center text-ink-2">
              Select a disease from the directory to inspect its diagnostic monograph.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
