import React, { useState, useMemo } from "react";
import { Sliders, ShieldCheck, Thermometer, Droplets, Wind, Sparkles } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { cx } from "@/lib/cx";

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
      ? { label: "CRITICAL RISK", color: "bg-critical/10 text-critical border-critical/30" }
      : simulation.postIPMRisk > 50
      ? { label: "HIGH OUTBREAK RISK", color: "bg-amber/10 text-amber border-amber/30" }
      : simulation.postIPMRisk > 25
      ? { label: "MODERATE WATCH", color: "bg-amber/10 text-ink-2 border-line" }
      : { label: "LOW RISK", color: "bg-leaf/10 text-leaf border-leaf/30" };

  return (
    <div className="border border-line bg-surface p-5 text-ink shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 border border-line bg-paper text-forest">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-expanded text-[1rem] font-bold text-ink flex items-center gap-1.5">
              <span>Microclimate Digital Twin Simulator</span>
              <Sparkles className="w-4 h-4 text-forest animate-pulse" />
            </h3>
            <p className="text-[0.8125rem] text-ink-2">
              Simulate microclimate changes & test IPM treatment outcomes in real-time
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 text-caption font-bold border ${riskLevel.color}`}>
          {riskLevel.label} ({simulation.postIPMRisk}%)
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sliders Control Panel */}
        <div className="lg:col-span-5 space-y-4 bg-paper p-4 border border-line">
          <h4 className="text-caption text-forest uppercase font-bold tracking-wider mb-2">
            Microclimate Factors
          </h4>

          {/* Temp */}
          <div className="space-y-1">
            <div className="flex justify-between text-[0.8125rem]">
              <span className="text-ink flex items-center gap-1.5 font-medium">
                <Thermometer className="w-3.5 h-3.5 text-amber" /> Temperature
              </span>
              <span className="font-bold text-amber num">{temp}°C</span>
            </div>
            <input
              type="range"
              min="15"
              max="45"
              value={temp}
              onChange={(e) => setTemp(Number(e.target.value))}
              className="w-full h-1.5 bg-surface border border-line appearance-none cursor-pointer accent-forest"
            />
          </div>

          {/* RH */}
          <div className="space-y-1">
            <div className="flex justify-between text-[0.8125rem]">
              <span className="text-ink flex items-center gap-1.5 font-medium">
                <Droplets className="w-3.5 h-3.5 text-water" /> Relative Humidity
              </span>
              <span className="font-bold text-water num">{humidity}%</span>
            </div>
            <input
              type="range"
              min="30"
              max="100"
              value={humidity}
              onChange={(e) => setHumidity(Number(e.target.value))}
              className="w-full h-1.5 bg-surface border border-line appearance-none cursor-pointer accent-forest"
            />
          </div>

          {/* Soil Moisture */}
          <div className="space-y-1">
            <div className="flex justify-between text-[0.8125rem]">
              <span className="text-ink flex items-center gap-1.5 font-medium">
                <Droplets className="w-3.5 h-3.5 text-leaf" /> Soil Moisture
              </span>
              <span className="font-bold text-leaf num">{soilMoisture}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              value={soilMoisture}
              onChange={(e) => setSoilMoisture(Number(e.target.value))}
              className="w-full h-1.5 bg-surface border border-line appearance-none cursor-pointer accent-forest"
            />
          </div>

          {/* Spore Density */}
          <div className="space-y-1">
            <div className="flex justify-between text-[0.8125rem]">
              <span className="text-ink flex items-center gap-1.5 font-medium">
                <Wind className="w-3.5 h-3.5 text-ink-2" /> Airborne Spore Density
              </span>
              <span className="font-bold text-ink num">{sporeDensity} spores/m³</span>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              value={sporeDensity}
              onChange={(e) => setSporeDensity(Number(e.target.value))}
              className="w-full h-1.5 bg-surface border border-line appearance-none cursor-pointer accent-forest"
            />
          </div>

          {/* IPM Selector Buttons */}
          <div className="pt-2">
            <label className="text-caption text-ink-2 block mb-1.5 font-semibold">
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
                  type="button"
                  onClick={() => setSelectedIPM(ipm.id as any)}
                  className={cx(
                    "px-2.5 py-1.5 text-[0.75rem] font-semibold text-left transition-colors border",
                    selectedIPM === ipm.id
                      ? "bg-forest text-surface border-forest"
                      : "bg-surface text-ink border-line hover:bg-surface-2",
                  )}
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
            <div className="bg-paper p-3 border border-line">
              <span className="text-caption text-ink-2 block">IPM Risk Reduction</span>
              <span className="num text-xl font-bold text-leaf">
                -{simulation.ipmReductionPct}%
              </span>
            </div>
            <div className="bg-paper p-3 border border-line">
              <span className="text-caption text-ink-2 block">Est. Yield Protection</span>
              <span className="num text-xl font-bold text-forest">
                {simulation.yieldProtectionPct}%
              </span>
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="bg-paper p-3 border border-line">
            <span className="text-caption font-bold text-ink block mb-2">
              Projected 7-Day Disease Risk Trajectory
            </span>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simulation.projectedDays}>
                  <defs>
                    <linearGradient id="baselineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c2410c" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#c2410c" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="mitigatedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2e5a44" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2e5a44" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#666" fontSize={11} />
                  <YAxis stroke="#666" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fdfbf7", borderColor: "#e5dec9", color: "#1c2826" }}
                    labelStyle={{ color: "#1c2826", fontWeight: "bold" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Baseline Risk"
                    stroke="#c2410c"
                    fillOpacity={1}
                    fill="url(#baselineGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="IPM Mitigated Risk"
                    stroke="#2e5a44"
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

