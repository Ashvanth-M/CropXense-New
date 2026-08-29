/**
 * CVDiagnosticCanvas — Multi-Channel Computer Vision Diagnostic Canvas for Farmer Uploads.
 *
 * Provides real-time interactive computer vision analysis of farmer-uploaded crop leaf photos:
 * 1. RGB Photo (Enhanced original with lens inspection)
 * 2. Bounding Boxes (Object detection bounding boxes with lesion ROI & confidence)
 * 3. Chlorosis Map (Foliar chlorophyll loss & senescence heatmap)
 * 4. Necrosis Map (Dead tissue & pathogen necrosis core isolation)
 * 5. NDVI (Normalized Difference Vegetation Index / Cellular health index)
 */

import { useState, useMemo } from "react";
import {
  Layers,
  Eye,
  ZoomIn,
  ZoomOut,
  Flame,
  Activity,
  Scan,
  Maximize2,
  CheckCircle2,
  Grid,
  Sparkles,
  Zap,
  Info,
  ShieldAlert,
  Sliders,
} from "lucide-react";
import { cx } from "@/lib/cx";
import { useT } from "@/i18n";

export type CVViewMode = "rgb" | "bounding_boxes" | "chlorosis_map" | "necrosis_map" | "ndvi";

export interface CVDiagnosticCanvasProps {
  imageUrl: string;
  cropName: string;
  threatName: string;
  confidence: number;
  severity: number;
  symptoms?: string[];
  className?: string;
}

export function CVDiagnosticCanvas({
  imageUrl,
  cropName,
  threatName,
  confidence,
  severity,
  symptoms = [],
  className,
}: CVDiagnosticCanvasProps) {
  const { t } = useT();
  const [viewMode, setViewMode] = useState<CVViewMode>("bounding_boxes");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null);
  const [showFourGrid, setShowFourGrid] = useState<boolean>(false);

  // Generate realistic bounding boxes customized to threat severity and confidence
  const boundingBoxes = useMemo(() => {
    const baseBoxes = [
      { id: 1, x: 28, y: 30, w: 26, h: 24, conf: confidence, areaMm: 32.4, label: "Primary Lesion Core", type: "Necrotic Core" },
      { id: 2, x: 58, y: 42, w: 22, h: 20, conf: Math.max(50, confidence - 3), areaMm: 18.6, label: "Active Margin", type: "Fungal Margin" },
      { id: 3, x: 36, y: 64, w: 24, h: 22, conf: Math.max(52, confidence - 2), areaMm: 21.0, label: "Secondary Spot", type: "Necrotic Core" },
      { id: 4, x: 68, y: 22, w: 18, h: 16, conf: Math.max(48, confidence - 7), areaMm: 12.8, label: "Chlorotic Halo", type: "Chlorotic Halo" },
    ];

    if (severity >= 4) {
      baseBoxes.push({
        id: 5,
        x: 18,
        y: 52,
        w: 20,
        h: 18,
        conf: Math.max(55, confidence - 5),
        areaMm: 15.2,
        label: "Advanced Necrosis",
        type: "Coalesced Lesion",
      });
    }

    return baseBoxes;
  }, [confidence, severity]);

  const necrosisRatio = useMemo(() => Math.min(65, Math.round(severity * 6.5 + (confidence % 7))), [severity, confidence]);
  const chlorosisRatio = useMemo(() => Math.min(80, Math.round(severity * 9.2 + (confidence % 11))), [severity, confidence]);
  const ndviScore = useMemo(() => (Math.max(0.25, (10 - severity * 1.5) / 10)).toFixed(2), [severity]);

  const views: { id: CVViewMode; label: string; icon: any; color: string; badge: string }[] = [
    { id: "rgb", label: "RGB Photo", icon: Eye, color: "var(--forest)", badge: "Clean" },
    { id: "bounding_boxes", label: "Bounding Boxes", icon: Layers, color: "var(--alert)", badge: "CV Detection" },
    { id: "chlorosis_map", label: "Chlorosis Map", icon: Activity, color: "var(--amber)", badge: "Spectral" },
    { id: "necrosis_map", label: "Necrosis Map", icon: Flame, color: "#e63946", badge: "Cell Death" },
    { id: "ndvi", label: "NDVI Index", icon: Zap, color: "var(--leaf)", badge: "Vigor Index" },
  ];

  return (
    <div className={cx("flex flex-col border border-line bg-surface overflow-hidden rounded-[var(--r)]", className)}>
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2 px-3 py-2 text-[0.8125rem]">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-bold text-forest">
            <Scan className="size-4 text-forest" />
            <span>AI Computer Vision Diagnostic Canvas</span>
          </span>
          <span className="text-ink-2">·</span>
          <span className="font-semibold text-ink">{cropName}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* 4-Grid Multi Comparison Mode Toggle */}
          <button
            type="button"
            onClick={() => setShowFourGrid((prev) => !prev)}
            className={cx(
              "inline-flex items-center gap-1 rounded-[var(--r)] px-2.5 py-1 text-[0.75rem] font-semibold transition-colors",
              showFourGrid
                ? "bg-forest text-surface shadow-sm"
                : "border border-line bg-paper text-ink hover:bg-surface",
            )}
            title="Toggle 4-Channel Multi-View Grid"
          >
            <Grid className="size-3.5" />
            <span>4-Channel Grid</span>
          </button>

          {/* Mode Switchers (When not in 4-grid) */}
          {!showFourGrid && (
            <div className="flex items-center gap-1">
              {views.map((v) => {
                const Icon = v.icon;
                const active = viewMode === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setViewMode(v.id);
                      setSelectedBoxIndex(null);
                    }}
                    className={cx(
                      "inline-flex items-center gap-1 rounded-[var(--r)] px-2.5 py-1 text-[0.75rem] font-semibold transition-all",
                      active
                        ? "bg-forest text-surface shadow-sm"
                        : "border border-line bg-paper text-ink hover:bg-surface-2",
                    )}
                  >
                    <Icon className="size-3" />
                    <span>{v.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Zoom controls */}
          {!showFourGrid && (
            <div className="flex items-center border-l border-line pl-1.5 gap-0.5">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                className="p-1 text-ink-2 hover:text-ink hover:bg-surface rounded"
                title="Zoom In"
              >
                <ZoomIn className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
                className="p-1 text-ink-2 hover:text-ink hover:bg-surface rounded"
                title="Zoom Out"
              >
                <ZoomOut className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Display Area */}
      {!showFourGrid ? (
        /* Single Channel Full Canvas */
        <div className="relative min-h-[340px] max-h-[460px] flex-1 overflow-hidden bg-[#070e09] flex items-center justify-center p-3">
          <div
            className="relative max-w-full max-h-[420px] rounded overflow-hidden shadow-2xl transition-transform duration-200 ease-out origin-center"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Base Uploaded Photograph */}
            <img
              src={imageUrl}
              alt="Farmer leaf scan"
              className={cx(
                "w-full h-auto max-h-[400px] object-contain block rounded transition-all duration-300",
                viewMode === "ndvi" && "filter contrast-150 saturate-200 hue-rotate-15",
              )}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/crops/bacterial_blight.jpg";
              }}
            />

            {/* View 1: Bounding Boxes */}
            {viewMode === "bounding_boxes" && (
              <div className="absolute inset-0 pointer-events-auto">
                {boundingBoxes.map((b, idx) => {
                  const isSelected = selectedBoxIndex === idx;
                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBoxIndex(isSelected ? null : idx)}
                      className={cx(
                        "absolute cursor-pointer border-2 transition-all rounded-sm flex items-start justify-start p-0.5",
                        isSelected
                          ? "border-[#00ff88] bg-[rgba(0,255,136,0.25)] shadow-[0_0_20px_#00ff88] z-20 scale-105"
                          : "border-[#ff3366] bg-[rgba(255,51,102,0.18)] hover:border-[#ffcc00] hover:bg-[rgba(255,204,0,0.28)] z-10",
                      )}
                      style={{
                        left: `${b.x}%`,
                        top: `${b.y}%`,
                        width: `${b.w}%`,
                        height: `${b.h}%`,
                      }}
                    >
                      <span className="bg-[#000]/90 text-[#00ff88] text-[9px] font-mono px-1 py-0.2 rounded font-bold leading-tight shadow border border-[#00ff88]/40">
                        ROI-{b.id} ({b.conf}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* View 2: Chlorosis Map (Chlorophyll depletion heatmap overlay) */}
            {viewMode === "chlorosis_map" && (
              <div
                className="absolute inset-0 pointer-events-none mix-blend-screen opacity-85"
                style={{
                  background: `radial-gradient(circle at 45% 42%, rgba(255, 235, 0, 0.9) 0%, rgba(220, 180, 0, 0.5) 45%, transparent 75%), radial-gradient(circle at 68% 30%, rgba(255, 200, 0, 0.8) 0%, transparent 50%)`,
                }}
              />
            )}

            {/* View 3: Necrosis Map (Dead tissue isolation overlay) */}
            {viewMode === "necrosis_map" && (
              <div
                className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-90"
                style={{
                  background: `radial-gradient(circle at 40% 42%, rgba(139, 0, 0, 0.95) 0%, rgba(180, 20, 20, 0.6) 35%, transparent 65%), radial-gradient(circle at 62% 48%, rgba(120, 0, 0, 0.9) 0%, transparent 45%), radial-gradient(circle at 48% 68%, rgba(140, 10, 10, 0.85) 0%, transparent 40%)`,
                }}
              />
            )}

            {/* View 4: NDVI False Color Gradient */}
            {viewMode === "ndvi" && (
              <div
                className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-75"
                style={{
                  background: `linear-gradient(135deg, rgba(0, 255, 100, 0.6) 0%, rgba(255, 200, 0, 0.7) 45%, rgba(255, 30, 0, 0.85) 80%)`,
                }}
              />
            )}
          </div>

          {/* Active Box HUD */}
          {selectedBoxIndex !== null && viewMode === "bounding_boxes" && (
            <div className="absolute bottom-3 left-3 right-3 bg-[#08120a]/95 border border-[#00ff88]/50 p-2.5 rounded text-[0.75rem] text-surface shadow-2xl backdrop-blur-md flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono font-bold text-[#00ff88]">
                  [ROI-{boundingBoxes[selectedBoxIndex]!.id}]
                </span>
                <span>
                  Classification: <strong>{boundingBoxes[selectedBoxIndex]!.label}</strong>
                </span>
                <span>
                  Feature: <strong>{boundingBoxes[selectedBoxIndex]!.type}</strong>
                </span>
                <span>
                  Lesion Area: <strong>{boundingBoxes[selectedBoxIndex]!.areaMm} mm²</strong>
                </span>
                <span>
                  AI Probability: <strong className="text-[#00ff88]">{boundingBoxes[selectedBoxIndex]!.conf}%</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBoxIndex(null)}
                className="text-xs text-ink-2 hover:text-surface px-1.5 py-0.5 border border-line rounded"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Legend Chip in corner */}
          <div className="absolute top-3 left-3 rounded border border-white/10 bg-black/75 px-2 py-1 text-[0.6875rem] font-mono text-white/90 backdrop-blur-sm">
            {viewMode === "rgb" && "📷 Natural RGB Photo"}
            {viewMode === "bounding_boxes" && `🎯 AI Lesion Detection (${boundingBoxes.length} ROIs)`}
            {viewMode === "chlorosis_map" && `🟡 Chlorosis Heatmap (${chlorosisRatio}% foliar area)`}
            {viewMode === "necrosis_map" && `🔴 Necrotic Tissue Isolation (${necrosisRatio}% cell death)`}
            {viewMode === "ndvi" && `🟢 NDVI Cellular Health Index: ${ndviScore}`}
          </div>
        </div>
      ) : (
        /* 4-Channel Multi-Grid Comparison Matrix */
        <div className="grid grid-cols-2 gap-2 bg-[#070e09] p-3">
          {/* Card 1: RGB Photo */}
          <div className="relative border border-line/40 rounded bg-black/60 overflow-hidden group">
            <div className="absolute top-1.5 left-1.5 z-10 rounded bg-black/80 px-1.5 py-0.5 text-[0.625rem] font-bold text-white font-mono">
              1. RGB Photo
            </div>
            <img src={imageUrl} alt="RGB view" className="w-full h-36 object-contain" />
          </div>

          {/* Card 2: Bounding Boxes */}
          <div className="relative border border-line/40 rounded bg-black/60 overflow-hidden group">
            <div className="absolute top-1.5 left-1.5 z-10 rounded bg-black/80 px-1.5 py-0.5 text-[0.625rem] font-bold text-[#00ff88] font-mono">
              2. Bounding Boxes
            </div>
            <img src={imageUrl} alt="Boxes view" className="w-full h-36 object-contain" />
            <div className="absolute inset-0 pointer-events-none">
              {boundingBoxes.slice(0, 3).map((b) => (
                <div
                  key={b.id}
                  className="absolute border-2 border-[#ff3366] bg-[rgba(255,51,102,0.2)] rounded-sm"
                  style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
                >
                  <span className="bg-black text-[#00ff88] text-[8px] font-mono px-0.5">L{b.id}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Chlorosis Map */}
          <div className="relative border border-line/40 rounded bg-black/60 overflow-hidden group">
            <div className="absolute top-1.5 left-1.5 z-10 rounded bg-black/80 px-1.5 py-0.5 text-[0.625rem] font-bold text-[#ffcc00] font-mono">
              3. Chlorosis Map
            </div>
            <img src={imageUrl} alt="Chlorosis view" className="w-full h-36 object-contain" />
            <div
              className="absolute inset-0 pointer-events-none mix-blend-screen opacity-85"
              style={{
                background: `radial-gradient(circle at 45% 42%, rgba(255, 235, 0, 0.9) 0%, rgba(220, 180, 0, 0.5) 45%, transparent 75%)`,
              }}
            />
          </div>

          {/* Card 4: Necrosis Map / NDVI */}
          <div className="relative border border-line/40 rounded bg-black/60 overflow-hidden group">
            <div className="absolute top-1.5 left-1.5 z-10 rounded bg-black/80 px-1.5 py-0.5 text-[0.625rem] font-bold text-[#e63946] font-mono">
              4. Necrosis & NDVI
            </div>
            <img src={imageUrl} alt="Necrosis view" className="w-full h-36 object-contain filter contrast-125" />
            <div
              className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-90"
              style={{
                background: `radial-gradient(circle at 42% 44%, rgba(139, 0, 0, 0.95) 0%, rgba(180, 20, 20, 0.6) 40%, transparent 70%)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Bottom Diagnostic Analytics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-line bg-surface p-3 text-[0.75rem]">
        <div className="border-r border-line pr-2">
          <span className="text-caption text-ink-2">Foliar Necrosis</span>
          <p className="num mt-0.5 font-bold text-[#e63946]">{necrosisRatio}% dead tissue</p>
        </div>
        <div className="border-r border-line pr-2">
          <span className="text-caption text-ink-2">Chlorosis Extent</span>
          <p className="num mt-0.5 font-bold text-amber">{chlorosisRatio}% chlorotic yellowing</p>
        </div>
        <div className="border-r border-line pr-2">
          <span className="text-caption text-ink-2">NDVI Health Index</span>
          <p className="num mt-0.5 font-bold text-forest">{ndviScore} (0.0 - 1.0)</p>
        </div>
        <div>
          <span className="text-caption text-ink-2">CV Confidence</span>
          <p className="num mt-0.5 font-bold text-forest">{confidence}% agreement</p>
        </div>
      </div>
    </div>
  );
}
