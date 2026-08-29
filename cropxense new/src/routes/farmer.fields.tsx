/**
 * /farmer/fields — Registered Fields Management, Health Records & Field Timeline.
 *
 * Professional desktop-first data table and field inspection console.
 * Filter by crop, health status, and growth stage. Allows viewing parcel details,
 * field history timeline, and initiating instant leaf scans for specific plots.
 *
 * Fully localized with useT().
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Sprout,
  ScanLine,
  Search,
  MapPin,
  X,
  FileText,
  Clock,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Layers,
  Calendar,
  Compass,
  Thermometer,
  Droplets,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Card";
import { StatusChip, type Status } from "@/components/ui/Status";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/auth/AuthContext";
import {
  getFarmerFarms,
  createFarm,
  updateFarm,
  deleteFarm,
  getFieldTimeline,
  subscribe,
  CROPS,
  DISTRICTS,
  STAGE_LABEL,
  districtName,
  cropName,
} from "@/services";
import type { Farm, CropStage } from "@/types";
import { useT } from "@/i18n";
import { cx } from "@/lib/cx";

export const Route = createFileRoute("/farmer/fields")({
  head: () => ({
    meta: [
      { title: "My Fields — CropXense Farmer" },
      {
        name: "description",
        content: "Registered agricultural parcels, crop stages, field timeline, and disease surveillance history.",
      },
      { property: "og:title", content: "My Fields — CropXense Farmer" },
      {
        property: "og:description",
        content: "Registered agricultural parcels, crop stages, field timeline, and disease surveillance history.",
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

const GROWTH_STAGES: CropStage[] = [
  "sowing",
  "vegetative",
  "tillering",
  "flowering",
  "boll_formation",
  "pod_fill",
  "fruiting",
  "bulbing",
  "grand_growth",
  "harvest",
];

function FarmerFieldsPage() {
  const { t, tCrop, tStage, tDistrict } = useT();
  const { user } = useAuth();
  const { toast } = useToast();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterHealth, setFilterHealth] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedField, setSelectedField] = useState<Farm | null>(null);

  // CRUD Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingField, setEditingField] = useState<Farm | null>(null);
  const [deletingField, setDeletingField] = useState<Farm | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    village: "",
    districtId: "akola",
    state: "Maharashtra",
    areaHa: "4.5",
    cropId: "cotton",
    variety: "",
    stage: "vegetative" as CropStage,
    sowingDate: new Date().toISOString().slice(0, 10),
    lat: "20.7002",
    lon: "77.0082",
    notes: "",
  });

  const loadFarms = async () => {
    try {
      const data = await getFarmerFarms(user);
      setFarms(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarms();
    const unsub = subscribe(() => {
      loadFarms();
    });
    return () => {
      unsub();
    };
  }, [user]);

  const resetForm = () => {
    setFormData({
      name: "",
      village: user?.district ? `${user.district} Rural` : "Nandgaon Peth",
      districtId: user?.district?.toLowerCase() || "akola",
      state: "Maharashtra",
      areaHa: "5.0",
      cropId: "cotton",
      variety: "",
      stage: "vegetative",
      sowingDate: new Date().toISOString().slice(0, 10),
      lat: "20.7002",
      lon: "77.0082",
      notes: "",
    });
  };

  const openAddModal = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const openEditModal = (farm: Farm) => {
    setEditingField(farm);
    setFormData({
      name: farm.name,
      village: farm.village,
      districtId: farm.districtId,
      state: farm.state || "Maharashtra",
      areaHa: String(farm.areaHa),
      cropId: farm.cropId,
      variety: farm.variety || "",
      stage: farm.stage,
      sowingDate: farm.sowingDate,
      lat: String(farm.lat || "20.7002"),
      lon: String(farm.lon || "77.0082"),
      notes: farm.notes || "",
    });
  };

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.village.trim()) {
      toast("Please enter a farm name and village.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createFarm({
        name: formData.name.trim(),
        village: formData.village.trim(),
        districtId: formData.districtId,
        state: formData.state,
        areaHa: parseFloat(formData.areaHa) || 1.0,
        cropId: formData.cropId,
        variety: formData.variety.trim() || undefined,
        stage: formData.stage,
        sowingDate: formData.sowingDate,
        lat: parseFloat(formData.lat) || 20.7,
        lon: parseFloat(formData.lon) || 77.0,
        notes: formData.notes.trim() || undefined,
        ownerId: user?.id || user?.email || "demo-farmer-ramesh",
        ownerName: user?.name || "Ramesh Kumar",
      });

      toast(`${created.name} was added successfully.`);
      setIsAddOpen(false);
      resetForm();
      loadFarms();
    } catch (err: any) {
      toast(err.message || "Failed to add field.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingField) return;
    if (!formData.name.trim() || !formData.village.trim()) {
      toast("Please enter a farm name and village.");
      return;
    }

    setSubmitting(true);
    try {
      await updateFarm(editingField.id, {
        name: formData.name.trim(),
        village: formData.village.trim(),
        districtId: formData.districtId,
        state: formData.state,
        areaHa: parseFloat(formData.areaHa) || editingField.areaHa,
        cropId: formData.cropId,
        variety: formData.variety.trim() || undefined,
        stage: formData.stage,
        sowingDate: formData.sowingDate,
        lat: parseFloat(formData.lat) || editingField.lat,
        lon: parseFloat(formData.lon) || editingField.lon,
        notes: formData.notes.trim() || undefined,
      });

      toast(`${formData.name} updated successfully.`);
      setEditingField(null);
      loadFarms();
    } catch (err: any) {
      toast(err.message || "Failed to update field.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFarm = async () => {
    if (!deletingField) return;
    setSubmitting(true);
    try {
      await deleteFarm(deletingField.id);
      toast(`${deletingField.name} archived. Historical cases preserved in surveillance log.`);
      setDeletingField(null);
      if (selectedField?.id === deletingField.id) setSelectedField(null);
      loadFarms();
    } catch (err: any) {
      toast(err.message || "Failed to delete field.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered List
  const filteredFarms = useMemo(() => {
    return (farms ?? []).filter((f) => {
      const matchHealth = filterHealth === "all" || f.health === filterHealth;
      const matchQuery =
        !searchQuery ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tCrop(f.cropId).toLowerCase().includes(searchQuery.toLowerCase());
      return matchHealth && matchQuery;
    });
  }, [farms, filterHealth, searchQuery, tCrop]);

  const totalArea = (farms ?? []).reduce((acc, f) => acc + f.areaHa, 0).toFixed(1);

  const fieldTimeline = useMemo(() => {
    if (!selectedField) return [];
    return getFieldTimeline(selectedField.id);
  }, [selectedField]);

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="border border-line bg-surface p-5 md:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="text-caption text-forest">{t("nav.fields")}</span>
            <h1 className="mt-1 font-expanded text-[1.5rem] md:text-[1.875rem]">{t("farmer.manageFields")}</h1>
            <p className="mt-1 text-[0.875rem] text-ink-2">
              {farms.length} Registered Parcels ({totalArea} ha Total) · Central Farm Register
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex min-h-[44px] items-center gap-2 border border-forest bg-forest px-4 text-[0.875rem] font-semibold text-surface transition-colors hover:bg-[#0e2b20] shadow-sm"
            >
              <Plus className="size-4" />
              <span>+ {t("fields.addField")}</span>
            </button>
            <Link
              to="/farmer/scan"
              className="inline-flex min-h-[44px] items-center gap-2 border border-line bg-paper px-4 text-[0.875rem] font-semibold text-ink transition-colors hover:bg-surface-2"
            >
              <ScanLine className="size-4 text-forest" />
              <span>{t("farmer.scanLeaf")}</span>
            </Link>
          </div>
        </div>

        {/* Quick Parcel Metrics */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4">
          <div className="border-r border-line pr-3">
            <span className="text-caption">{t("field.area")}</span>
            <p className="num mt-1 text-[1.25rem] font-bold">{totalArea} ha</p>
          </div>
          <div className="border-r border-line pr-3">
            <span className="text-caption">{t("nav.fields")}</span>
            <p className="num mt-1 text-[1.25rem] font-bold">{farms?.length || 0}</p>
          </div>
          <div className="border-r border-line pr-3">
            <span className="text-caption">{t("status.healthy")}</span>
            <p className="num mt-1 text-[1.25rem] font-bold text-leaf">
              {(farms ?? []).filter((f) => f.health === "healthy").length}
            </p>
          </div>
          <div>
            <span className="text-caption">{t("status.watch")}</span>
            <p className="num mt-1 text-[1.25rem] font-bold text-amber">
              {(farms ?? []).filter((f) => f.health !== "healthy").length}
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Health Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 border border-line bg-surface p-1">
          {[
            { id: "all", label: "All Active Fields" },
            { id: "healthy", label: t("status.healthy") },
            { id: "at_risk", label: t("status.watch") },
            { id: "affected", label: t("status.critical") },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterHealth(tab.id)}
              className={cx(
                "px-3 py-1.5 text-[0.8125rem] font-semibold transition-colors rounded-[var(--r)]",
                filterHealth === tab.id
                  ? "bg-forest text-surface"
                  : "text-ink-2 hover:bg-surface-2 hover:text-ink",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-2" />
          <input
            type="text"
            placeholder="Search field, crop, village..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-line bg-surface py-1.5 pl-9 pr-3 text-[0.8125rem] text-ink placeholder:text-ink-2 outline-none focus:border-forest"
          />
        </div>
      </div>

      {/* Fields Data Table */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : filteredFarms.length === 0 ? (
        <div className="border border-line bg-surface p-12 text-center">
          <Sprout className="mx-auto size-10 text-ink-2 mb-2" />
          <p className="font-semibold text-ink">{t("empty.title")}</p>
          <p className="text-[0.8125rem] text-ink-2 mt-1">
            {farms.length === 0
              ? "You have not registered any fields yet. Click '+ Add New Field' to create your first parcel."
              : "No fields match your search or filter criteria."}
          </p>
          {farms.length === 0 && (
            <button
              type="button"
              onClick={openAddModal}
              className="mt-4 inline-flex min-h-[38px] items-center gap-1.5 border border-forest bg-forest px-4 text-[0.8125rem] font-semibold text-surface hover:bg-[#0e2b20]"
            >
              <Plus className="size-4" />
              <span>Register Your First Field</span>
            </button>
          )}
        </div>
      ) : (
        <div className="border border-line bg-surface overflow-x-auto">
          <table className="w-full text-left text-[0.875rem]">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-caption text-ink-2">
                <th className="p-3.5 font-semibold">Case ID & Name</th>
                <th className="p-3.5 font-semibold">{t("field.district")}</th>
                <th className="p-3.5 font-semibold">{t("field.crop")} & Growth Stage</th>
                <th className="p-3.5 font-semibold">{t("field.area")}</th>
                <th className="p-3.5 font-semibold">{t("nav.surveillance")}</th>
                <th className="p-3.5 font-semibold">Sowing Date</th>
                <th className="p-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredFarms.map((farm) => (
                <tr key={farm.id} className="group transition-colors hover:bg-surface-2">
                  <td className="p-3.5 font-semibold text-ink">
                    <div>
                      <span className="text-[0.9375rem]">{farm.name}</span>
                      <span className="block num text-[0.75rem] font-normal text-ink-2">{farm.id}</span>
                    </div>
                  </td>
                  <td className="p-3.5 text-ink">
                    <div>
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3 text-ink-2" />
                        <span>{farm.village}</span>
                      </span>
                      <span className="block text-[0.75rem] text-ink-2 capitalize">{tDistrict(farm.districtId)}</span>
                    </div>
                  </td>
                  <td className="p-3.5 text-ink">
                    <div>
                      <span className="font-medium">{tCrop(farm.cropId)}</span>
                      {farm.variety && (
                        <span className="ml-1 text-[0.75rem] text-ink-2">({farm.variety})</span>
                      )}
                      <span className="block text-[0.75rem] text-ink-2">{tStage(farm.stage)}</span>
                    </div>
                  </td>
                  <td className="num p-3.5 font-semibold">{farm.areaHa} ha</td>
                  <td className="p-3.5">
                    <StatusChip status={HEALTH_TO_STATUS[farm.health] || "healthy"} />
                  </td>
                  <td className="num p-3.5 text-ink-2">{farm.sowingDate}</td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to="/farmer/scan"
                        search={{ fieldId: farm.id, cropId: farm.cropId } as any}
                        className="inline-flex min-h-[32px] items-center gap-1 rounded-[var(--r)] border border-line bg-paper px-2.5 text-[0.75rem] font-semibold text-forest hover:bg-forest hover:text-surface transition-colors"
                      >
                        <ScanLine className="size-3" />
                        <span>Scan Crop</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setSelectedField(farm)}
                        className="inline-flex min-h-[32px] items-center gap-1 rounded-[var(--r)] border border-line bg-paper px-2.5 text-[0.75rem] font-semibold text-ink hover:bg-surface-2"
                      >
                        <FileText className="size-3" />
                        <span>History</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(farm)}
                        aria-label={`Edit ${farm.name}`}
                        className="size-8 inline-flex items-center justify-center rounded-[var(--r)] border border-line bg-paper text-ink hover:bg-surface-2"
                      >
                        <Edit2 className="size-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingField(farm)}
                        aria-label={`Delete ${farm.name}`}
                        className="size-8 inline-flex items-center justify-center rounded-[var(--r)] border border-line bg-paper text-alert hover:bg-alert/10"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Field Inspection & Timeline Drawer */}
      {selectedField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-line bg-surface p-6 shadow-panel">
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div>
                <span className="text-caption text-forest">{t("nav.fields")}</span>
                <h2 className="font-display text-[1.375rem] font-semibold text-ink">
                  {selectedField.name}
                </h2>
                <p className="text-[0.8125rem] text-ink-2">
                  {selectedField.village}, {tDistrict(selectedField.districtId)} · <span className="num font-semibold">{selectedField.areaHa} ha</span>
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

            <div className="mt-5 space-y-5 text-[0.875rem]">
              {/* Core Parameters */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="border border-line bg-paper p-3">
                  <span className="text-caption">{t("field.crop")}</span>
                  <p className="mt-1 font-semibold">{tCrop(selectedField.cropId)}</p>
                </div>
                <div className="border border-line bg-paper p-3">
                  <span className="text-caption">{t("field.growthStage")}</span>
                  <p className="mt-1 font-semibold">{tStage(selectedField.stage)}</p>
                </div>
                <div className="border border-line bg-paper p-3">
                  <span className="text-caption">{t("nav.surveillance")}</span>
                  <div className="mt-1">
                    <StatusChip status={HEALTH_TO_STATUS[selectedField.health] || "healthy"} />
                  </div>
                </div>
                <div className="border border-line bg-paper p-3">
                  <span className="text-caption">Sowing Date</span>
                  <p className="num mt-1 font-semibold">{selectedField.sowingDate}</p>
                </div>
              </div>

              {/* Geographical Outline Coordinates */}
              <div className="border border-line bg-paper p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Compass className="size-4 text-forest" />
                  <h3 className="font-semibold text-ink">GPS Location & Boundary</h3>
                </div>
                <p className="text-[0.8125rem] text-ink-2">
                  Coordinates: <span className="num">{selectedField.lat.toFixed(4)}° N, {selectedField.lon.toFixed(4)}° E</span>
                </p>
                {selectedField.notes && (
                  <p className="mt-2 text-[0.8125rem] text-ink bg-surface p-2 border border-line">
                    <span className="font-semibold">Notes:</span> {selectedField.notes}
                  </p>
                )}
              </div>

              {/* Field History Timeline */}
              <div>
                <h3 className="font-display text-[1rem] font-semibold border-b border-line pb-2 mb-3">
                  Field Surveillance History
                </h3>
                {fieldTimeline.length === 0 ? (
                  <p className="text-[0.8125rem] text-ink-2">No historical observations or alerts recorded yet.</p>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-line">
                    {fieldTimeline.map((ev, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-6 top-1 size-2.5 rounded-full bg-forest border-2 border-surface" />
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-semibold text-ink">{ev.title}</span>
                          <span className="num text-[0.75rem] text-ink-2">{ev.date}</span>
                        </div>
                        {ev.detail && (
                          <p className="text-[0.8125rem] text-ink-2 mt-0.5">{ev.detail}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Strip */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setSelectedField(null)}
                  className="px-4 py-2 border border-line bg-paper font-semibold hover:bg-surface-2"
                >
                  Close
                </button>
                <Link
                  to="/farmer/scan"
                  search={{ fieldId: selectedField.id, cropId: selectedField.cropId } as any}
                  className="inline-flex min-h-[38px] items-center gap-1.5 border border-forest bg-forest px-4 text-[0.875rem] font-semibold text-surface hover:bg-[#0e2b20]"
                >
                  <ScanLine className="size-4" />
                  <span>Scan This Field</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD NEW FIELD MODAL
      ========================================================================= */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto border border-line bg-surface p-6 shadow-panel">
            <div className="flex items-start justify-between border-b border-line pb-3">
              <div>
                <h2 className="font-display text-[1.25rem] font-bold text-ink">
                  + Add New Field
                </h2>
                <p className="text-[0.8125rem] text-ink-2">
                  Register a new parcel under your farm profile
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="size-8 inline-flex items-center justify-center rounded-[var(--r)] border border-line text-ink-2 hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFarm} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-caption mb-1">Farm / Field Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Green Valley Plot 2"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-line bg-paper p-2.5 text-[0.875rem] outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block text-caption mb-1">Village *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Borgaon"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    className="w-full border border-line bg-paper p-2.5 text-[0.875rem] outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block text-caption mb-1">District *</label>
                  <select
                    value={formData.districtId}
                    onChange={(e) => setFormData({ ...formData, districtId: e.target.value })}
                    className="w-full border border-line bg-paper p-2.5 text-[0.875rem] outline-none focus:border-forest capitalize"
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {tDistrict(d.id)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-caption mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full border border-line bg-paper p-2.5 text-[0.875rem] outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block text-caption mb-1">Crop *</label>
                  <select
                    value={formData.cropId}
                    onChange={(e) => setFormData({ ...formData, cropId: e.target.value })}
                    className="w-full border border-line bg-paper p-2.5 text-[0.875rem] outline-none focus:border-forest capitalize"
                  >
                    {CROPS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {tCrop(c.id)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-caption mb-1">Variety (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. JS-335 / Bt Cotton"
                    value={formData.variety}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    className="w-full border border-line bg-paper p-2.5 text-[0.875rem] outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block text-caption mb-1">Area in Hectares *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={formData.areaHa}
                    onChange={(e) => setFormData({ ...formData, areaHa: e.target.value })}
                    className="w-full border border-line bg-paper p-2.5 text-[0.875rem] outline-none focus:border-forest num"
                  />
                </div>

                <div>
                  <label className="block text-caption mb-1">Current Growth Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as CropStage })}
                    className="w-full border border-line bg-paper p-2.5 text-[0.875rem] outline-none focus:border-forest capitalize"
                  >
                    {GROWTH_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {tStage(s)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-caption mb-1">Sowing Date</label>
                  <input
                    type="date"
                    required
                    value={formData.sowingDate}
                    onChange={(e) => setFormData({ ...formData, sowingDate: e.target.value })}
                    className="w-full border border-line bg-paper p-2.5 text-[0.875rem] outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block text-caption mb-1">Location Coordinates (GPS)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Lat"
                      value={formData.lat}
                      onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                      className="border border-line bg-paper p-2.5 text-[0.875rem] outline-none focus:border-forest num"
                    />
                    <input
                      type="text"
                      placeholder="Lon"
                      value={formData.lon}
                      onChange={(e) => setFormData({ ...formData, lon: e.target.value })}
                      className="border border-line bg-paper p-2.5 text-[0.875rem] outline-none focus:border-forest num"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-caption mb-1">Agronomic Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Soil type, irrigation method, previous crop rotation..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-line bg-paper p-2.5 text-[0.875rem] outline-none focus:border-forest"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-line bg-paper font-semibold hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 border border-forest bg-forest font-semibold text-surface hover:bg-[#0e2b20]"
                >
                  {submitting ? "Saving…" : "Save Field"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          EDIT FIELD MODAL
      ========================================================================= */}
      {editingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto border border-line bg-surface p-6 shadow-panel">
            <div className="flex items-start justify-between border-b border-line pb-3">
              <div>
                <h2 className="font-display text-[1.25rem] font-bold text-ink">
                  Edit Field: {editingField.name}
                </h2>
                <p className="text-[0.8125rem] text-ink-2">Parcel ID: {editingField.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingField(null)}
                className="size-8 inline-flex items-center justify-center rounded-[var(--r)] border border-line text-ink-2 hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateFarm} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-caption mb-1">Farm / Field Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-line bg-paper p-2.5 text-[0.875rem] outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block text-caption mb-1">Village *</label>
                  <input
                    type="text"
                    required
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    className="w-full border border-line bg-paper p-2.5 text-[0.875rem] outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block text-caption mb-1">District *</label>
                  <select
                    value={formData.districtId}
                    onChange={(e) => setFormData({ ...formData, districtId: e.target.value })}
                    className="w-full border border-line bg-paper p-2.5 text-[0.875rem] outline-none focus:border-forest capitalize"
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {tDistrict(d.id)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-caption mb-1">Crop *</label>
                  <select
                    value={formData.cropId}
                    onChange={(e) => setFormData({ ...formData, cropId: e.target.value })}
                    className="w-full border border-line bg-paper p-2.5 text-[0.875rem] outline-none focus:border-forest capitalize"
                  >
                    {CROPS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {tCrop(c.id)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-caption mb-1">Variety</label>
                  <input
                    type="text"
                    value={formData.variety}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    className="w-full border border-line bg-paper p-2.5 text-[0.875rem] outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block text-caption mb-1">Area in Hectares *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={formData.areaHa}
                    onChange={(e) => setFormData({ ...formData, areaHa: e.target.value })}
                    className="w-full border border-line bg-paper p-2.5 text-[0.875rem] outline-none focus:border-forest num"
                  />
                </div>

                <div>
                  <label className="block text-caption mb-1">Growth Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as CropStage })}
                    className="w-full border border-line bg-paper p-2.5 text-[0.875rem] outline-none focus:border-forest capitalize"
                  >
                    {GROWTH_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {tStage(s)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-caption mb-1">Sowing Date</label>
                  <input
                    type="date"
                    required
                    value={formData.sowingDate}
                    onChange={(e) => setFormData({ ...formData, sowingDate: e.target.value })}
                    className="w-full border border-line bg-paper p-2.5 text-[0.875rem] outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div>
                <label className="block text-caption mb-1">Agronomic Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-line bg-paper p-2.5 text-[0.875rem] outline-none focus:border-forest"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setEditingField(null)}
                  className="px-4 py-2 border border-line bg-paper font-semibold hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 border border-forest bg-forest font-semibold text-surface hover:bg-[#0e2b20]"
                >
                  {submitting ? "Updating…" : "Update Field"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE FIELD CONFIRMATION MODAL
      ========================================================================= */}
      {deletingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative max-h-[90vh] w-full max-w-md border border-line bg-surface p-6 shadow-panel">
            <div className="flex items-center gap-3 text-alert mb-3">
              <AlertTriangle className="size-6 shrink-0" />
              <h2 className="font-display text-[1.125rem] font-bold text-ink">
                Archive Field: {deletingField.name}?
              </h2>
            </div>
            <p className="text-[0.875rem] text-ink-2 leading-relaxed">
              This will remove <span className="font-semibold text-ink">{deletingField.name}</span> from your active farm register. All historical leaf scans, pest observations, and validated advisories will remain preserved in the surveillance archive for seasonal audit.
            </p>

            <div className="mt-5 flex justify-end gap-3 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setDeletingField(null)}
                className="px-4 py-2 border border-line bg-paper font-semibold hover:bg-surface-2 text-[0.875rem]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteFarm}
                className="px-5 py-2 border border-alert bg-alert font-semibold text-surface hover:bg-[#b02a24] text-[0.875rem]"
              >
                {submitting ? "Archiving…" : "Archive Field"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
