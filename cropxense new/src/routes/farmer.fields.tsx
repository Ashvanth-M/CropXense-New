import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Sprout,
  ScanLine,
  Search,
  Filter,
  Layers,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  FileText,
  Thermometer,
  Droplets,
  Plus,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Card";
import { StatusChip, StatusShape, type Status } from "@/components/ui/Status";
import { useAsync } from "@/hooks/useAsync";
import { addFarm, CROPS, DISTRICTS, getFarms, subscribe, cropName, districtName, STAGE_LABEL } from "@/services";
import type { Farm, CropStage } from "@/types";
import { cx } from "@/lib/cx";

export const Route = createFileRoute("/farmer/fields")({
  head: () => ({
    meta: [
      { title: "My Fields — CropXense Farmer" },
      {
        name: "description",
        content: "Registered agricultural parcels, soil and moisture conditions, crop stages, and disease surveillance history.",
      },
      { property: "og:title", content: "My Fields — CropXense Farmer" },
      {
        property: "og:description",
        content: "Registered agricultural parcels, soil and moisture conditions, crop stages, and disease surveillance history.",
      },
    ],
  }),
  component: FarmerFieldsPage,
});

const HEALTH_TO_STATUS: Record<string, Status> = {
  healthy: "healthy",
  at_risk: "watch",
  affected: "critical",
};

function FarmerFieldsPage() {
  const { data: farms, loading, reload } = useAsync(() => getFarms(), []);
  const [filterHealth, setFilterHealth] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedField, setSelectedField] = useState<Farm | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // New Farm form state
  const [farmName, setFarmName] = useState("");
  const [ownerName, setOwnerName] = useState("Ramesh Pawar");
  const [village, setVillage] = useState("Wadgaon");
  const [districtId, setDistrictId] = useState("amravati");
  const [cropId, setCropId] = useState("cotton");
  const [areaHa, setAreaHa] = useState("2.5");
  const [sowingDate, setSowingDate] = useState("2026-06-15");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return subscribe(() => {
      reload();
    });
  }, [reload]);

  async function handleRegisterFarm(e: React.FormEvent) {
    e.preventDefault();
    if (!farmName.trim() || submitting) return;
    setSubmitting(true);
    try {
      const dist = DISTRICTS.find((d) => d.id === districtId) ?? DISTRICTS[0]!;
      await addFarm({
        name: farmName.trim(),
        ownerName: ownerName.trim(),
        village: village.trim(),
        districtId,
        areaHa: parseFloat(areaHa) || 1.5,
        cropId,
        stage: "vegetative" as CropStage,
        lat: dist.lat + (Math.random() - 0.5) * 0.05,
        lon: dist.lon + (Math.random() - 0.5) * 0.05,
        parcel: [
          [dist.lat, dist.lon],
          [dist.lat + 0.002, dist.lon + 0.002],
          [dist.lat + 0.002, dist.lon],
        ],
        health: "healthy",
        sowingDate: sowingDate || "2026-06-15",
      });
      setFarmName("");
      setIsRegistering(false);
      reload();
    } finally {
      setSubmitting(false);
    }
  }

  const filteredFarms = useMemo(() => {
    return (farms ?? []).filter((f) => {
      const matchHealth = filterHealth === "all" || f.health === filterHealth;
      const matchQuery =
        !searchQuery ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cropName(f.cropId).toLowerCase().includes(searchQuery.toLowerCase());
      return matchHealth && matchQuery;
    });
  }, [farms, filterHealth, searchQuery]);

  const totalArea = (farms ?? []).reduce((acc, f) => acc + f.areaHa, 0).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="border border-line bg-surface p-5 md:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="text-caption text-forest">Parcel Inventory</span>
            <h1 className="mt-1 font-expanded text-[1.5rem] md:text-[1.875rem]">My Registered Fields</h1>
            <p className="mt-1 text-[0.875rem] text-ink-2">
              Manage your agricultural parcels, view crop growth stages, and track disease surveillance records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsRegistering(true)}
              className="inline-flex min-h-[44px] items-center gap-2 border border-line bg-paper px-4 text-[0.875rem] font-semibold text-ink transition-colors hover:bg-surface-2"
            >
              <Plus className="size-4 text-forest" />
              <span>Register New Field</span>
            </button>
            <Link
              to="/farmer/scan"
              className="inline-flex min-h-[44px] items-center gap-2 border border-forest bg-forest px-4 text-[0.875rem] font-semibold text-surface transition-colors hover:bg-[#0e2b20]"
            >
              <ScanLine className="size-4" />
              <span>Scan Crop Health</span>
            </Link>
          </div>
        </div>

        {/* Quick Parcel Metrics */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4">
          <div className="border-r border-line pr-3">
            <span className="text-caption">Total Holdings</span>
            <p className="num mt-1 text-[1.25rem] font-bold">{totalArea} ha</p>
          </div>
          <div className="border-r border-line pr-3">
            <span className="text-caption">Registered Plots</span>
            <p className="num mt-1 text-[1.25rem] font-bold">{farms?.length || 0}</p>
          </div>
          <div className="border-r border-line pr-3">
            <span className="text-caption">Healthy Plots</span>
            <p className="num mt-1 text-[1.25rem] font-bold text-leaf">
              {(farms ?? []).filter((f) => f.health === "healthy").length}
            </p>
          </div>
          <div>
            <span className="text-caption">Under Observation</span>
            <p className="num mt-1 text-[1.25rem] font-bold text-amber">
              {(farms ?? []).filter((f) => f.health !== "healthy").length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col gap-3 border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "All Fields" },
            { id: "healthy", label: "Healthy" },
            { id: "at_risk", label: "At Risk" },
            { id: "affected", label: "Critical" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterHealth(tab.id)}
              className={cx(
                "inline-flex min-h-[38px] items-center rounded-[var(--r)] px-3 text-[0.8125rem] font-semibold transition-colors",
                filterHealth === tab.id
                  ? "bg-forest text-surface"
                  : "border border-line bg-paper text-ink hover:bg-surface-2",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-2" />
          <input
            type="text"
            placeholder="Search field, crop, village…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-line bg-paper py-2 pl-9 pr-3 text-[0.8125rem] text-ink outline-none transition-colors focus:border-forest"
          />
        </div>
      </div>

      {/* Structured Fields Table */}
      <div className="border border-line bg-surface">
        {loading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : filteredFarms.length === 0 ? (
          <div className="p-8 text-center text-[0.9375rem] text-ink-2">
            No registered fields match your selected filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[0.875rem]">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-caption text-ink-2">
                  <th className="p-3.5 font-semibold">Field ID & Name</th>
                  <th className="p-3.5 font-semibold">Location</th>
                  <th className="p-3.5 font-semibold">Crop & Stage</th>
                  <th className="p-3.5 font-semibold">Area</th>
                  <th className="p-3.5 font-semibold">Health Status</th>
                  <th className="p-3.5 font-semibold">Sowing Date</th>
                  <th className="p-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredFarms.map((f) => (
                  <tr key={f.id} className="group transition-colors hover:bg-surface-2">
                    <td className="p-3.5">
                      <p className="font-semibold text-ink">{f.name}</p>
                      <p className="num text-[0.75rem] text-ink-2">{f.id}</p>
                    </td>
                    <td className="p-3.5">
                      <span className="flex items-center gap-1.5 text-ink">
                        <MapPin className="size-3.5 text-ink-2" />
                        <span>{f.village}</span>
                      </span>
                      <span className="text-[0.75rem] capitalize text-ink-2">{f.districtId}</span>
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-ink">{cropName(f.cropId)}</p>
                      <p className="text-[0.75rem] text-ink-2">
                        {STAGE_LABEL[f.stage] || f.stage}
                      </p>
                    </td>
                    <td className="num p-3.5 font-semibold text-ink">{f.areaHa} ha</td>
                    <td className="p-3.5">
                      <StatusChip status={HEALTH_TO_STATUS[f.health] || "healthy"} />
                    </td>
                    <td className="num p-3.5 text-ink-2">{f.sowingDate}</td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedField(f)}
                          className="inline-flex min-h-[36px] items-center gap-1 border border-line bg-paper px-3 text-[0.75rem] font-semibold text-ink transition-colors hover:bg-surface-2"
                        >
                          <FileText className="size-3.5 text-ink-2" />
                          <span>Record</span>
                        </button>
                        <Link
                          to="/farmer/scan"
                          className="inline-flex min-h-[36px] items-center gap-1 border border-forest bg-forest px-3 text-[0.75rem] font-semibold text-surface transition-colors hover:bg-[#0e2b20]"
                        >
                          <ScanLine className="size-3.5" />
                          <span>Scan</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Field Health Record Modal / Detail Drawer */}
      {selectedField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
          <div className="fixed inset-0 bg-ink/50 backdrop-blur-xs" onClick={() => setSelectedField(null)} />
          <div className="relative w-full max-w-2xl border border-line bg-surface p-6 shadow-overlay">
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div>
                <span className="text-caption text-forest">Field Record</span>
                <h2 className="font-display text-[1.375rem] font-semibold text-ink">
                  {selectedField.name}
                </h2>
                <p className="text-[0.8125rem] text-ink-2">
                  {selectedField.village}, {districtName(selectedField.districtId)} · <span className="num font-semibold">{selectedField.areaHa} ha</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedField(null)}
                aria-label="Close dialog"
                className="size-8 inline-flex items-center justify-center rounded-[var(--r)] border border-line text-ink-2 hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-[0.875rem]">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="border border-line bg-paper p-3">
                  <span className="text-caption">Crop</span>
                  <p className="mt-1 font-semibold">{cropName(selectedField.cropId)}</p>
                </div>
                <div className="border border-line bg-paper p-3">
                  <span className="text-caption">Growth Stage</span>
                  <p className="mt-1 font-semibold">{STAGE_LABEL[selectedField.stage] || selectedField.stage}</p>
                </div>
                <div className="border border-line bg-paper p-3">
                  <span className="text-caption">Current Status</span>
                  <div className="mt-1">
                    <StatusChip status={HEALTH_TO_STATUS[selectedField.health] || "healthy"} />
                  </div>
                </div>
                <div className="border border-line bg-paper p-3">
                  <span className="text-caption">Sowing Date</span>
                  <p className="num mt-1 font-semibold">{selectedField.sowingDate}</p>
                </div>
              </div>

              {/* Coordinates and Soil */}
              <div className="border border-line bg-paper p-4">
                <h3 className="font-semibold text-ink">Parcel Location & In-Field Soil Telemetry</h3>
                <div className="mt-2 grid grid-cols-2 gap-4 text-[0.8125rem] sm:grid-cols-3">
                  <div>
                    <span className="text-ink-2">Latitude/Longitude:</span>
                    <p className="num font-semibold">{selectedField.lat.toFixed(4)}, {selectedField.lon.toFixed(4)}</p>
                  </div>
                  <div>
                    <span className="text-ink-2">Estimated Soil Moisture:</span>
                    <p className="num font-semibold text-water">64% (Optimal)</p>
                  </div>
                  <div>
                    <span className="text-ink-2">pH Level:</span>
                    <p className="num font-semibold">7.1 (Neutral)</p>
                  </div>
                </div>
              </div>

              {/* Action Recommendations */}
              <div className="border border-amber/30 bg-amber/5 p-4 text-[0.8125rem]">
                <p className="font-semibold text-amber">Active Recommendation</p>
                <p className="mt-1 text-ink">
                  Perform visual leaf inspection on 15 representative plants within the next 24 hours. Check lower leaf undersides for aphid/whitefly nymphs.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedField(null)}
                  className="min-h-[40px] border border-line bg-paper px-4 font-semibold text-ink hover:bg-surface-2"
                >
                  Close
                </button>
                <Link
                  to="/farmer/scan"
                  className="min-h-[40px] inline-flex items-center gap-2 border border-forest bg-forest px-4 font-semibold text-surface hover:bg-[#0e2b20]"
                >
                  <ScanLine className="size-4" />
                  <span>Scan this Field</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register New Field Modal */}
      {isRegistering && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
          <div className="fixed inset-0 bg-ink/50 backdrop-blur-xs" onClick={() => setIsRegistering(false)} />
          <div className="relative w-full max-w-lg border border-line bg-surface p-6 shadow-overlay">
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div>
                <span className="text-caption text-forest">Parcel Registration</span>
                <h2 className="font-display text-[1.25rem] font-semibold text-ink">Register New Farm</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsRegistering(false)}
                className="size-8 inline-flex items-center justify-center rounded border border-line text-ink-2 hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterFarm} className="mt-4 space-y-4 text-[0.875rem]">
              <div>
                <label className="block text-caption mb-1">Farm / Plot Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Krushi Vikas Sheti"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="w-full border border-line bg-paper p-2.5 outline-none focus:border-forest"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-caption mb-1">Cultivator Name</label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full border border-line bg-paper p-2.5 outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label className="block text-caption mb-1">Village</label>
                  <input
                    type="text"
                    required
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full border border-line bg-paper p-2.5 outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-caption mb-1">District</label>
                  <select
                    value={districtId}
                    onChange={(e) => setDistrictId(e.target.value)}
                    className="w-full border border-line bg-paper p-2.5 outline-none focus:border-forest"
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-caption mb-1">Crop</label>
                  <select
                    value={cropId}
                    onChange={(e) => setCropId(e.target.value)}
                    className="w-full border border-line bg-paper p-2.5 outline-none focus:border-forest"
                  >
                    {CROPS.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-caption mb-1">Area (Hectares)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={areaHa}
                    onChange={(e) => setAreaHa(e.target.value)}
                    className="w-full border border-line bg-paper p-2.5 outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label className="block text-caption mb-1">Sowing Date</label>
                  <input
                    type="date"
                    required
                    value={sowingDate}
                    onChange={(e) => setSowingDate(e.target.value)}
                    className="w-full border border-line bg-paper p-2.5 outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="px-4 py-2 border border-line bg-paper font-semibold hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 border border-forest bg-forest font-semibold text-surface hover:bg-[#0e2b20]"
                >
                  {submitting ? "Registering…" : "Register Field"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
