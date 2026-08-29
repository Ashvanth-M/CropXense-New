/**
 * /expert/epidemiology — Regional Outbreak Epidemiology & Pathogen Spread Intelligence.
 *
 * Provides plant protection directors and epidemiologists with pan-India pathogen spread
 * trajectories, economic threshold breach alerts, vector migration tracking,
 * fungicide resistance heatmaps, and quarantine zone dispatchers.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  Flame,
  Wind,
  Bug,
  ShieldAlert,
  Send,
  MapPin,
  Calendar,
  Layers,
  Download,
  Filter,
  CheckCircle2,
  TrendingUp,
  Radio,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { DISTRICTS, CROPS, DISEASES, PESTS } from "@/data/reference";
import { cropName, districtName, threatName, getOutbreaks } from "@/services";
import { useAsync } from "@/hooks/useAsync";
import { RankBar } from "@/components/app/Sparkline";
import type { Outbreak } from "@/types";
import { cx } from "@/lib/cx";

export const Route = createFileRoute("/expert/epidemiology")({
  head: () => ({
    meta: [
      { title: "Epidemiological Surveillance & Spread Intelligence — Expert Validation" },
      {
        name: "description",
        content: "Pan-India crop disease epidemiological modeling, vector dispersal tracking, and quarantine dispatch.",
      },
    ],
  }),
  component: ExpertEpidemiologyPage,
});

function ExpertEpidemiologyPage() {
  const { toast } = useToast();
  const outbreaksQ = useAsync(() => getOutbreaks(), []);
  const [selectedThreat, setSelectedThreat] = useState<string>("all");
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>("all");
  const [quarantineModalOpen, setQuarantineModalOpen] = useState<boolean>(false);
  const [targetDistrict, setTargetDistrict] = useState<string>("amravati");

  const outbreaks: Outbreak[] = useMemo(() => {
    return (outbreaksQ.data ?? []).filter((o) => {
      const matchThreat = selectedThreat === "all" || o.threatId === selectedThreat;
      const matchRisk = selectedRiskFilter === "all" || o.risk === selectedRiskFilter;
      return matchThreat && matchRisk;
    });
  }, [outbreaksQ.data, selectedThreat, selectedRiskFilter]);

  const highRiskCount = outbreaks.filter((o) => o.risk === "high").length;
  const totalAffectedFields = outbreaks.reduce((acc, o) => acc + o.affectedFields, 0);

  const resistanceHotspots = [
    { pathogen: "Yellow Mosaic Virus", crop: "Soybean", district: "Amravati", resistanceGroup: "Neonicotinoid IRAC 4A", status: "High Tolerance" },
    { pathogen: "Rice Blast", crop: "Rice", district: "Thanjavur", resistanceGroup: "QoI Strobilurin FRAC 11", status: "Emerging Shift" },
    { pathogen: "Pink Bollworm", crop: "Cotton", district: "Akola", resistanceGroup: "Cry1Ac / Cry2Ab Bt-toxin", status: "Field Survival" },
    { pathogen: "Early Blight", crop: "Tomato", district: "Nashik", resistanceGroup: "Dicarboximide FRAC 2", status: "Moderate Shift" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border border-line bg-surface p-5 md:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="text-caption text-forest">Epidemiological Intelligence Suite</span>
            <h1 className="mt-1 font-expanded text-[1.5rem] md:text-[1.875rem]">
              Regional Outbreak & Pathogen Spread Intelligence
            </h1>
            <p className="mt-1 text-[0.875rem] text-ink-2">
              Pan-India spatial transmission modeling, vector wind-dispersal trajectories, chemical resistance tracking, and emergency quarantine dispatch.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setQuarantineModalOpen(true)}
              className="inline-flex min-h-[40px] items-center gap-2 border border-alert bg-alert px-4 text-[0.875rem] font-semibold text-surface transition-colors hover:bg-[#8b2b1a] shadow-sm"
            >
              <ShieldAlert className="size-4" />
              <span>Issue Emergency Red Alert</span>
            </button>
          </div>
        </div>

        {/* Spatial Intelligence Summary Cards */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4">
          <div className="border-r border-line pr-3">
            <span className="text-caption">Active Outbreak Clusters</span>
            <p className="num mt-1 text-[1.375rem] font-bold text-ink">{outbreaks.length} Clusters</p>
            <p className="text-[0.75rem] text-ink-2">across monitored zones</p>
          </div>
          <div className="border-r border-line pr-3">
            <span className="text-caption">Severe Red Zones</span>
            <p className="num mt-1 text-[1.375rem] font-bold text-alert">{highRiskCount} Districts</p>
            <p className="text-[0.75rem] text-ink-2">exceeding threshold</p>
          </div>
          <div className="border-r border-line pr-3">
            <span className="text-caption">Total Contagion Perimeter</span>
            <p className="num mt-1 text-[1.375rem] font-bold text-amber">{totalAffectedFields} Fields</p>
            <p className="text-[0.75rem] text-ink-2">under active quarantine</p>
          </div>
          <div>
            <span className="text-caption">Vector Dispersal Vector</span>
            <p className="num mt-1 text-[1.375rem] font-bold text-water">ENE @ 18 km/h</p>
            <p className="text-[0.75rem] text-ink-2">monsoon plume vector</p>
          </div>
        </div>
      </div>

      {/* Main Epidemiological Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Active Outbreak Cluster Register (60%) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="border border-line bg-surface p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="font-display text-[1.125rem] font-bold text-ink flex items-center gap-2">
                <Flame className="size-4 text-alert" />
                <span>Active Regional Outbreak Hotspots</span>
              </h2>
              <span className="text-caption text-ink-2">{outbreaks.length} active hot zones</span>
            </div>

            {/* Outbreaks Table */}
            <div className="overflow-x-auto border border-line">
              <table className="w-full text-left text-[0.8125rem]">
                <thead>
                  <tr className="border-b border-line bg-surface-2 text-caption text-ink-2">
                    <th className="p-3 font-semibold">Cluster ID</th>
                    <th className="p-3 font-semibold">Pathogen / Threat</th>
                    <th className="p-3 font-semibold">District</th>
                    <th className="p-3 font-semibold">Risk Level</th>
                    <th className="p-3 num font-semibold text-right">Affected Fields</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-surface">
                  {outbreaks.map((o) => (
                    <tr key={o.id} className="hover:bg-surface-2 transition-colors">
                      <td className="p-3 font-mono font-bold text-ink">{o.id}</td>
                      <td className="p-3">
                        <span className="font-semibold text-ink">{o.threatName}</span>
                        <span className="block text-[0.75rem] text-ink-2">Host: {cropName(o.cropId)}</span>
                      </td>
                      <td className="p-3 font-medium">{districtName(o.districtId)}</td>
                      <td className="p-3">
                        <span
                          className={cx(
                            "inline-flex items-center px-2 py-0.5 text-[0.6875rem] font-bold uppercase rounded",
                            o.risk === "high"
                              ? "bg-alert/15 text-alert border border-alert/30"
                              : o.risk === "moderate"
                              ? "bg-amber/15 text-amber border border-amber/30"
                              : "bg-forest/15 text-forest border border-forest/30",
                          )}
                        >
                          {o.risk}
                        </span>
                      </td>
                      <td className="p-3 num font-bold text-right text-ink">{o.affectedFields}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vector Wind-Dispersal Simulation Panel */}
          <div className="border border-line bg-surface p-5 space-y-3">
            <h3 className="font-display font-semibold text-ink text-[1rem] flex items-center gap-2">
              <Wind className="size-4 text-water" />
              <span>Airborne Inoculum & Vector Plume Trajectory Model</span>
            </h3>
            <p className="text-[0.8125rem] text-ink-2 leading-relaxed">
              Atmospheric boundary layer modeling indicates elevated risk of downwind fungal spore dispersal (Puccinia / Magnaporthe) from Vidarbha north-eastward into Madhya Pradesh over the next 72 hours due to prevailing monsoon currents.
            </p>

            <div className="grid grid-cols-3 gap-3 border-t border-line pt-3 text-[0.75rem]">
              <div className="border border-line bg-paper p-2.5 rounded">
                <span className="text-caption text-ink-2">Wind Velocity</span>
                <p className="num font-bold text-ink mt-0.5">18.4 km/h ENE</p>
              </div>
              <div className="border border-line bg-paper p-2.5 rounded">
                <span className="text-caption text-ink-2">Atmospheric RH</span>
                <p className="num font-bold text-water mt-0.5">88% (Conducive)</p>
              </div>
              <div className="border border-line bg-paper p-2.5 rounded">
                <span className="text-caption text-ink-2">Spore Longevity</span>
                <p className="num font-bold text-alert mt-0.5">~14 hrs airborne</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Chemical Resistance & Quarantine Management (40%) */}
        <div className="space-y-4 lg:col-span-5">
          {/* Chemical Resistance Monitoring */}
          <div className="border border-line bg-surface p-5 space-y-3">
            <h3 className="font-display font-semibold text-ink text-[1rem] flex items-center gap-2">
              <ShieldAlert className="size-4 text-amber" />
              <span>Fungicide & Insecticide Resistance Watch</span>
            </h3>
            <p className="text-[0.8125rem] text-ink-2">
              Field bioassays tracking chemical efficacy decline and target-site mutation signals.
            </p>

            <div className="space-y-2.5">
              {resistanceHotspots.map((r, idx) => (
                <div key={idx} className="border border-line bg-paper p-3 rounded space-y-1">
                  <div className="flex items-center justify-between text-[0.8125rem]">
                    <span className="font-semibold text-ink">{r.pathogen}</span>
                    <span className="text-xs font-bold text-alert px-1.5 py-0.5 bg-alert/10 border border-alert/20 rounded">
                      {r.status}
                    </span>
                  </div>
                  <p className="text-[0.75rem] text-ink-2">
                    Crop: <strong>{r.crop}</strong> · Zone: <strong>{r.district}</strong>
                  </p>
                  <p className="text-[0.6875rem] text-forest font-mono">
                    MOA Group: {r.resistanceGroup}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Quarantine Dispatcher Card */}
          <div className="border-2 border-alert/30 bg-alert/5 p-5 rounded space-y-3">
            <span className="text-caption text-alert font-bold flex items-center gap-1.5">
              <Radio className="size-4" />
              <span>Emergency Containment Dispatcher</span>
            </span>
            <p className="text-[0.8125rem] text-ink leading-relaxed">
              Broadcast mandatory spray suspension or containment protocols directly to district agricultural officers in affected blocks.
            </p>

            <div className="space-y-2">
              <label className="block text-caption text-ink-2">Target District Zone</label>
              <select
                value={targetDistrict}
                onChange={(e) => setTargetDistrict(e.target.value)}
                className="w-full border border-line bg-paper p-2 text-[0.8125rem] text-ink outline-none focus:border-forest"
              >
                {DISTRICTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.region})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  toast(`Emergency Quarantine Advisory broadcast to ${districtName(targetDistrict)} extension network!`, "healthy");
                }}
                className="w-full min-h-[38px] inline-flex items-center justify-center gap-2 border border-alert bg-alert text-surface font-semibold text-[0.8125rem] rounded transition-colors hover:bg-[#8b2b1a] mt-2"
              >
                <Send className="size-3.5" />
                <span>Broadcast Quarantine Directive</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
