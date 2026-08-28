import React, { useState, useMemo } from "react";
import { Sliders, ShieldCheck, Thermometer, Droplets, Wind, Sparkles, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function MicroclimateSimulator() {
  const [temp, setTemp] = useState(32);
  const [humidity, setHumidity] = useState(82);
  const [soilMoisture, setSoilMoisture] = useState(65);
  const [sporeDensity, setSporeDensity] = useState(140);
  const [selectedIPM, setSelectedIPM] = useState<"none" | "bio" | "chem" | "neem" | "water">("none");

  // Dynamic Risk Formula & IPM Impact Calculation
  const simulation = useMemo(() => {
    // Risk score 0-100 base formula
    const tempFactor = temp >= 24 && temp <= 34 ? 1.3 : 0.8;
    const rhFactor = humidity > 75 ? (humidity - 70) * 2.2 : 5;
    const moistureFactor = soilMoisture > 60 ? 15 : 5;
    const sporeFactor = (sporeDensity / 500) * 35;

    let rawRisk = Math.min(100, Math.round((rhFactor + moistureFactor + sporeFactor) * tempFactor));

    // IPM Interventions drop risk
    let ipmReductionPct = 0;
    let ipmName = "No Intervention";
    if (selectedIPM === "bio") {
      ipmReductionPct = 62;
      ipmName = "Biocontrol (Trichoderma viride)";
    } else if (selectedIPM === "chem") {
      ipmReductionPct = 84;
      ipmName = "Chemical Spray (Azoxystrobin)";
    } else if (selectedIPM === "neem") {
      ipmReductionPct = 45;
      ipmName = "Botanical Neem Extract (10,000 PPM)";
    } else if (selectedIPM === "water") {
      ipmReductionPct = 30;
      ipmName = "Irrigation Schedule Modification";
    }

    const postIPMRisk = Math.max(5, Math.round(rawRisk * (1 - ipmReductionPct / 100)));
    const yieldProtectionPct = Math.round(100 - postIPMRisk * 0.45);

    // 7-day disease risk projection data
    const projectedDays = [1, 2, 3, 4, 5, 6, 7].map((day) => {
      const growthFactor = Math.pow(1.18, day - 1);
      const baselineRisk = Math.min(100, Math.round(rawRisk * growthFactor * 0.7));
      const mitigatedRisk = Math.min(100, Math.round(postIPMRisk * Math.pow(1.08, day - 1)));
      return {
        day: `Day ${day}`,
        "Baseline Risk": baselineRisk,
        "IPM Mitigated Risk": mitigatedRisk,
      };
    });

    return {
      rawRisk,
      postIPMRisk,
      ipmReductionPct,
      ipmName,
      yieldProtectionPct,
      projectedDays,
    };
  }, [temp, humidity, soilMoisture, sporeDensity, selectedIPM]);

  const riskLevel =
    simulation.postIPMRisk > 75
      ? { label: "CRITICAL RISK", color: "bg-red-500/20 text-red-400 border-red-500/40" }
      : simulation.postIPMRisk > 50
      ? { label: "HIGH OUTBREAK RISK", color: "bg-amber-500/20 text-amber-400 border-amber-500/40" }
      : simulation.postIPMRisk > 25
      ? { label: "MODERATE WATCH", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40" }
      : { label: "LOW RISK", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" };

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-slate-900/90 backdrop-blur-md p-5 text-slate-100 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-1.5">
              <span>Microclimate Digital Twin Simulator</span>
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            </h3>
            <p className="text-xs text-slate-400">
              Simulate microclimate changes & test IPM treatment outcomes in real-time
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${riskLevel.color}`}>
          {riskLevel.label} ({simulation.postIPMRisk}%)
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sliders Control Panel */}
        <div className="lg:col-span-5 space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Microclimate Factors
          </h4>

          {/* Temp */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" /> Temperature
              </span>
              <span className="font-bold text-amber-400">{temp}°C</span>
            </div>
            <input
              type="range"
              min="15"
              max="45"
              value={temp}
              onChange={(e) => setTemp(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* RH */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Relative Humidity
              </span>
              <span className="font-bold text-cyan-400">{humidity}%</span>
            </div>
            <input
              type="range"
              min="30"
              max="100"
              value={humidity}
              onChange={(e) => setHumidity(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Soil Moisture */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-blue-400" /> Soil Moisture
              </span>
              <span className="font-bold text-blue-400">{soilMoisture}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              value={soilMoisture}
              onChange={(e) => setSoilMoisture(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-400"
            />
          </div>

          {/* Spore Density */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-purple-400" /> Airborne Spore Density
              </span>
              <span className="font-bold text-purple-400">{sporeDensity} spores/m³</span>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              value={sporeDensity}
              onChange={(e) => setSporeDensity(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
          </div>

          {/* IPM Selector Buttons */}
          <div className="pt-2">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Simulated IPM Action:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "none", label: "No Action" },
                { id: "bio", label: "Biocontrol Spray" },
                { id: "chem", label: "Fungicide Dose" },
                { id: "neem", label: "Neem Botanical" },
              ].map((ipm) => (
                <button
                  key={ipm.id}
                  onClick={() => setSelectedIPM(ipm.id as any)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-all ${
                    selectedIPM === ipm.id
                      ? "bg-emerald-500 text-slate-950 font-bold shadow-md"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {ipm.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Chart & Impact Results */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block">IPM Risk Reduction</span>
              <span className="text-xl font-extrabold text-emerald-400">
                -{simulation.ipmReductionPct}%
              </span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Est. Yield Protection</span>
              <span className="text-xl font-extrabold text-cyan-400">
                {simulation.yieldProtectionPct}%
              </span>
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-slate-300 block mb-2">
              Projected 7-Day Disease Risk Trajectory
            </span>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simulation.projectedDays}>
                  <defs>
                    <linearGradient id="baselineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="mitigatedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }}
                    labelStyle={{ color: "#f8fafc" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Baseline Risk"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#baselineGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="IPM Mitigated Risk"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#mitigatedGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
