<<<<<<< HEAD
/**
 * /farmer/fields — Registered Fields Management, Health Records & Field Timeline.
 *
 * Professional desktop-first data table and field inspection console.
 * Filter by crop, health status, and growth stage. Allows viewing parcel details,
 * field history timeline, and initiating instant leaf scans for specific plots.
 *
 * Fully localized with useT().
 */

=======
>>>>>>> origin/anirudh
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Sprout,
  ScanLine,
  Search,
  MapPin,
  X,
  FileText,
<<<<<<< HEAD
  Clock,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Layers,
  Calendar,
  Compass,
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
} from "@/services";
import type { Farm, CropStage } from "@/types";
import { useT } from "@/i18n";
=======
  Thermometer,
  Droplets,
  Plus,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Card";
import { StatusChip, StatusShape, type Status } from "@/components/ui/Status";
import { useAsync } from "@/hooks/useAsync";
import { addFarm, CROPS, DISTRICTS, getFarms, subscribe, cropName, districtName, STAGE_LABEL } from "@/services";
import type { Farm, CropStage } from "@/types";
>>>>>>> origin/anirudh
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
<<<<<<< HEAD
  const { t, tCrop, tStage, tDistrict } = useT();
  const { user } = useAuth();
  const { toast } = useToast();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
=======
  const { data: farms, loading, reload } = useAsync(() => getFarms(), []);
>>>>>>> origin/anirudh
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
      const updated = await updateFarm(editingField.id, {
        name: formData.name.trim(),
        village: formData.village.trim(),
        districtId: formData.districtId,
        state: formData.state,
        areaHa: parseFloat(formData.areaHa) || 1.0,
        cropId: formData.cropId,
        variety: formData.variety.trim() || undefined,
        stage: formData.stage,
        sowingDate: formData.sowingDate,
        lat: parseFloat(formData.lat) || editingField.lat,
        lon: parseFloat(formData.lon) || editingField.lon,
        notes: formData.notes.trim() || undefined,
      });

      toast(`${updated.name} was updated successfully.`);
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
      toast(`${deletingField.name} was removed from your active field list.`);
      setDeletingField(null);
      loadFarms();
    } catch (err: any) {
      toast(err.message || "Failed to remove field.");
    } finally {
      setSubmitting(false);
    }
  };

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
<<<<<<< HEAD
              onClick={openAddModal}
              className="inline-flex min-h-[44px] items-center gap-2 border border-forest bg-forest px-4 text-[0.875rem] font-semibold text-surface transition-colors hover:bg-[#0e2b20] shadow-sm"
            >
              <Plus className="size-4" />
              <span>Add New Field</span>
            </button>

=======
              onClick={() => setIsRegistering(true)}
              className="inline-flex min-h-[44px] items-center gap-2 border border-line bg-paper px-4 text-[0.875rem] font-semibold text-ink transition-colors hover:bg-surface-2"
            >
              <Plus className="size-4 text-forest" />
              <span>Register New Field</span>
            </button>
>>>>>>> origin/anirudh
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

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col gap-3 border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
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
        ) : farms.length === 0 ? (
          <div className="p-12 text-center">
            <Sprout className="mx-auto size-12 text-forest/40 mb-3" />
            <h3 className="font-display text-[1.25rem] font-bold text-ink">No fields registered yet</h3>
            <p className="mt-1 text-[0.875rem] text-ink-2 max-w-md mx-auto">
              Register your first agricultural parcel to enable automated disease surveillance, personalized spray windows, and extension officer support.
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="mt-5 inline-flex min-h-[44px] items-center gap-2 border border-forest bg-forest px-5 text-[0.875rem] font-semibold text-surface hover:bg-[#0e2b20]"
            >
              <Plus className="size-4" />
              <span>+ Register Your First Field</span>
            </button>
          </div>
        ) : filteredFarms.length === 0 ? (
          <div className="p-8 text-center text-[0.9375rem] text-ink-2">
            No fields match your search or filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[0.875rem]">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-caption text-ink-2">
                  <th className="p-3.5 font-semibold">{t("field.caseId")} & Name</th>
                  <th className="p-3.5 font-semibold">{t("field.district")}</th>
                  <th className="p-3.5 font-semibold">{t("field.crop")} & {t("field.growthStage")}</th>
                  <th className="p-3.5 font-semibold">{t("field.area")}</th>
                  <th className="p-3.5 font-semibold">{t("nav.surveillance")}</th>
                  <th className="p-3.5 font-semibold">{t("field.sowingDate")}</th>
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
                      <span className="text-[0.75rem] capitalize text-ink-2">{tDistrict(f.districtId)}</span>
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-ink">
                        {tCrop(f.cropId)} {f.variety ? <span className="text-[0.75rem] font-normal text-ink-2">({f.variety})</span> : null}
                      </p>
                      <p className="text-[0.75rem] text-ink-2">
                        {tStage(f.stage)}
                      </p>
                    </td>
                    <td className="num p-3.5 font-semibold text-ink">{f.areaHa} ha</td>
                    <td className="p-3.5">
                      <StatusChip status={HEALTH_TO_STATUS[f.health] || "healthy"} />
                    </td>
                    <td className="num p-3.5 text-ink-2">{f.sowingDate}</td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to="/farmer/scan"
                          search={{ fieldId: f.id, cropId: f.cropId } as any}
                          className="inline-flex min-h-[34px] items-center gap-1 border border-forest bg-forest px-2.5 text-[0.75rem] font-semibold text-surface transition-colors hover:bg-[#0e2b20]"
                          title="Scan this field"
                        >
                          <ScanLine className="size-3.5" />
                          <span>{t("nav.scan")}</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => setSelectedField(f)}
                          className="inline-flex min-h-[34px] items-center gap-1 border border-line bg-paper px-2.5 text-[0.75rem] font-semibold text-ink transition-colors hover:bg-surface-2"
                          title="View Case & Timeline"
                        >
                          <FileText className="size-3.5 text-ink-2" />
                          <span>History</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(f)}
                          className="inline-flex min-h-[34px] items-center justify-center border border-line bg-paper p-1.5 text-ink transition-colors hover:bg-surface-2"
                          title="Edit Field"
                        >
                          <Edit2 className="size-3.5 text-ink-2" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingField(f)}
                          className="inline-flex min-h-[34px] items-center justify-center border border-line bg-paper p-1.5 text-alert transition-colors hover:bg-alert/10"
                          title="Delete / Archive Field"
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
      </div>

      {/* Add / Edit Field Modal */}
      {(isAddOpen || editingField) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
          <div
            className="fixed inset-0 bg-ink/50 backdrop-blur-xs"
            onClick={() => {
              if (!submitting) {
                setIsAddOpen(false);
                setEditingField(null);
              }
            }}
          />

          <div className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto border border-line bg-surface p-6 shadow-panel">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="text-caption text-forest font-bold">
                  {editingField ? "Edit Agricultural Parcel" : "New Agricultural Parcel"}
                </span>
                <h2 className="mt-0.5 font-display text-[1.25rem] font-bold text-ink">
                  {editingField ? `Update ${editingField.name}` : "Register New Field"}
                </h2>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingField(null);
                }}
                className="rounded p-1 text-ink-2 hover:bg-surface-2"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={editingField ? handleUpdateFarm : handleCreateFarm} className="mt-4 space-y-4 text-[0.875rem]">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-caption font-semibold text-ink mb-1">
                    Field / Farm Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vitthal Farm, Green Valley"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block text-caption font-semibold text-ink mb-1">
                    Village / Locality *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nandgaon Peth, Wadgaon"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    className="w-full border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-caption font-semibold text-ink mb-1">
                    District *
                  </label>
                  <select
                    value={formData.districtId}
                    onChange={(e) => setFormData({ ...formData, districtId: e.target.value })}
                    className="w-full border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-forest capitalize"
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-caption font-semibold text-ink mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block text-caption font-semibold text-ink mb-1">
                    Area (Hectares) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    placeholder="e.g. 5.5"
                    value={formData.areaHa}
                    onChange={(e) => setFormData({ ...formData, areaHa: e.target.value })}
                    className="w-full border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-forest num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-caption font-semibold text-ink mb-1">
                    Crop Cultivated *
                  </label>
                  <select
                    value={formData.cropId}
                    onChange={(e) => setFormData({ ...formData, cropId: e.target.value })}
                    className="w-full border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-forest capitalize"
                  >
                    {CROPS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-caption font-semibold text-ink mb-1">
                    Variety (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ajit-155, JS-335"
                    value={formData.variety}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    className="w-full border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block text-caption font-semibold text-ink mb-1">
                    Current Stage *
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as CropStage })}
                    className="w-full border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-forest"
                  >
                    {GROWTH_STAGES.map((st) => (
                      <option key={st} value={st}>
                        {STAGE_LABEL[st] || st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-caption font-semibold text-ink mb-1">
                    Sowing Date
                  </label>
                  <input
                    type="date"
                    value={formData.sowingDate}
                    onChange={(e) => setFormData({ ...formData, sowingDate: e.target.value })}
                    className="w-full border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-forest num"
                  />
                </div>

                <div>
                  <label className="block text-caption font-semibold text-ink mb-1">
                    Agronomic Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Drip irrigated, BBF raised beds"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingField(null);
                  }}
                  className="inline-flex min-h-[40px] items-center border border-line bg-paper px-4 text-[0.8125rem] font-semibold text-ink hover:bg-surface-2"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-[40px] items-center gap-2 border border-forest bg-forest px-5 text-[0.8125rem] font-semibold text-surface hover:bg-[#0e2b20]"
                >
                  {submitting ? "Saving..." : editingField ? "Save Changes" : "Save Field"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Archive Confirmation Dialog */}
      {deletingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
          <div className="fixed inset-0 bg-ink/50 backdrop-blur-xs" onClick={() => !submitting && setDeletingField(null)} />
          <div className="relative z-10 w-full max-w-md border border-line bg-surface p-6 shadow-panel">
            <div className="flex items-center gap-3 text-alert">
              <AlertTriangle className="size-6" />
              <h3 className="font-display text-[1.125rem] font-bold text-ink">
                Delete {deletingField.name}?
              </h3>
            </div>

            <p className="mt-3 text-[0.875rem] text-ink-2 leading-relaxed">
              This will remove the field from your active farm list. Existing historical observations, scans, and expert validations will be retained where required for audit and seasonal history.
            </p>

            <div className="mt-5 flex items-center justify-end gap-3 border-t border-line pt-4">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setDeletingField(null)}
                className="inline-flex min-h-[38px] items-center border border-line bg-paper px-4 text-[0.8125rem] font-semibold text-ink hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteFarm}
                className="inline-flex min-h-[38px] items-center border border-alert bg-alert px-4 text-[0.8125rem] font-semibold text-surface hover:bg-alert/90"
              >
                {submitting ? "Removing..." : "Delete Field"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Field Health Record Modal / Detail Drawer */}
      {selectedField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
          <div className="fixed inset-0 bg-ink/50 backdrop-blur-xs" onClick={() => setSelectedField(null)} />
          <div className="relative w-full max-w-2xl border border-line bg-surface p-6 shadow-overlay max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div>
                <span className="text-caption text-forest">{t("nav.fields")}</span>
                <h2 className="font-display text-[1.375rem] font-semibold text-ink">
                  {selectedField.name}
                </h2>
                <p className="text-[0.8125rem] text-ink-2">
<<<<<<< HEAD
                  {selectedField.village}, {tDistrict(selectedField.districtId)} · <span className="num font-semibold">{selectedField.areaHa} ha</span>
=======
                  {selectedField.village}, {districtName(selectedField.districtId)} · <span className="num font-semibold">{selectedField.areaHa} ha</span>
>>>>>>> origin/anirudh
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
                  <span className="text-caption">{t("field.sowingDate")}</span>
                  <p className="num mt-1 font-semibold">{selectedField.sowingDate}</p>
                </div>
              </div>

              {/* Geographic Bounds */}
              <div className="border border-line bg-paper p-4 text-[0.8125rem]">
                <h3 className="font-semibold text-ink">{t("field.district")} & Coordinates</h3>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-ink-2">Latitude / Longitude:</span>
                    <p className="num font-semibold">{selectedField.lat.toFixed(4)}, {selectedField.lon.toFixed(4)}</p>
                  </div>
                  <div>
                    <span className="text-ink-2">{t("field.area")}:</span>
                    <p className="num font-semibold">{selectedField.areaHa} Hectares</p>
                  </div>
                </div>
              </div>

              {/* Field History Timeline */}
              <div className="border border-line bg-surface p-4">
                <h3 className="font-display text-[1rem] font-semibold text-ink flex items-center gap-2 mb-3">
                  <Clock className="size-4 text-forest" />
                  <span>Field History & Timeline</span>
                </h3>

                {fieldTimeline.length === 0 ? (
                  <p className="text-[0.8125rem] text-ink-2">{t("empty.title")}</p>
                ) : (
                  <ol className="relative space-y-3 pl-5 border-l border-line text-[0.8125rem]">
                    {fieldTimeline.map((ev, idx) => (
                      <li key={idx} className="relative">
                        <span className={cx(
                          "absolute -left-[25px] top-1 size-2.5 rounded-full",
                          ev.type === "detection" ? "bg-alert" : ev.type === "advisory" ? "bg-amber" : "bg-leaf"
                        )} />
                        <div className="flex items-center gap-2">
                          <span className="num text-[0.75rem] font-semibold text-ink-2">{ev.date}</span>
                          <span className="font-semibold text-ink">{ev.title}</span>
                        </div>
                        {ev.detail && <p className="text-[0.75rem] text-ink-2 mt-0.5">{ev.detail}</p>}
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedField(null)}
                  className="min-h-[40px] border border-line bg-paper px-4 font-semibold text-ink hover:bg-surface-2"
                >
                  {t("action.close")}
                </button>
                <Link
                  to="/farmer/scan"
                  search={{ fieldId: selectedField.id, cropId: selectedField.cropId } as any}
                  className="min-h-[40px] inline-flex items-center gap-2 border border-forest bg-forest px-4 font-semibold text-surface hover:bg-[#0e2b20]"
                >
                  <ScanLine className="size-4" />
                  <span>{t("nav.scan")}</span>
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
