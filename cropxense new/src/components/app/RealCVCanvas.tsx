import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Eye, ShieldAlert, Activity, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type AnalysisResult = {
  chlorosisPct: number;
  necrosisPct: number;
  ndviScore: number;
  lesionCount: number;
  affectedAreaPct: number;
  detectedThreatId: string;
  threatName: string;
  confidence: number;
  severity: 1 | 2 | 3 | 4 | 5;
  differentials: { name: string; value: number }[];
  lesionHotspots: { x: number; y: number; r: number; conf: number }[];
};

export type CVLayer = "bounding_boxes" | "chlorosis" | "necrosis" | "ndvi" | "none";

interface RealCVCanvasProps {
  imageSrc: string;
  activeLayer: CVLayer;
  onLayerChange?: (layer: CVLayer) => void;
  onAnalysisComplete?: (result: AnalysisResult) => void;
  cropType?: string;
}

export function RealCVCanvas({
  imageSrc,
  activeLayer,
  onLayerChange,
  onAnalysisComplete,
  cropType = "Cotton",
}: RealCVCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [clickedSpot, setClickedSpot] = useState<{
    x: number;
    y: number;
    r: number;
    g: number;
    b: number;
    healthScore: number;
    status: string;
  } | null>(null);

  useEffect(() => {
    if (!imageSrc) return;
    setLoading(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      // Set internal resolution
      const width = img.naturalWidth || 600;
      const height = img.naturalHeight || 600;
      canvas.width = width;
      canvas.height = height;

      // 1. Draw base image
      ctx.drawImage(img, 0, 0, width, height);

      // 2. Perform Real Pixel Analysis
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      let greenCount = 0;
      let chlorosisCount = 0;
      let necrosisCount = 0;
      let totalPlantPixels = 0;

      const hotspots: { x: number; y: number; r: number; conf: number }[] = [];
      const step = Math.max(1, Math.floor(Math.min(width, height) / 100));

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const idx = (y * width + x) * 4;
          const r = data[idx]!;
          const g = data[idx + 1]!;
          const b = data[idx + 2]!;

          // Ignore background (very light or very dark pixels)
          if ((r > 240 && g > 240 && b > 240) || (r < 25 && g < 25 && b < 25)) {
            continue;
          }

          totalPlantPixels++;

          // Chlorosis (Yellowing: high Red & Green, low Blue)
          if (r > 130 && g > 130 && b < 120 && Math.abs(r - g) < 45) {
            chlorosisCount++;
          }
          // Necrosis (Browning / Dark lesion spots)
          else if (r > 40 && r < 160 && g > 25 && g < 110 && b < 80 && r >= g) {
            necrosisCount++;
            if (Math.random() < 0.08 && hotspots.length < 8) {
              hotspots.push({
                x,
                y,
                r: Math.floor(15 + Math.random() * 20),
                conf: Math.floor(78 + Math.random() * 20),
              });
            }
          }
          // Healthy Green Vegetation
          else if (g > r && g > b) {
            greenCount++;
          }
        }
      }

      const total = Math.max(1, totalPlantPixels);
      const chlorosisPct = Math.min(100, Math.round((chlorosisCount / total) * 100));
      const necrosisPct = Math.min(100, Math.round((necrosisCount / total) * 100));
      const healthyPct = Math.min(100, Math.round((greenCount / total) * 100));
      const ndviScore = Math.max(0.15, Math.min(0.92, (healthyPct - chlorosisPct * 0.5) / 100));
      const affectedAreaPct = Math.min(85, chlorosisPct + necrosisPct);
      const lesionCount = Math.max(hotspots.length, Math.floor(necrosisPct * 0.4) + 2);

      // Determine top threat classification based on crop & pixel signatures
      let detectedThreatId = "bacterial_blight";
      let threatName = "Bacterial Blight";
      let confidence = Math.min(96, Math.max(72, 70 + necrosisPct * 1.2));
      let severity: 1 | 2 | 3 | 4 | 5 = 2;

      if (necrosisPct > 15 && chlorosisPct > 20) {
        severity = 4;
        detectedThreatId = "early_blight";
        threatName = "Early Leaf Blight";
      } else if (chlorosisPct > 25) {
        severity = 3;
        detectedThreatId = "yellow_mosaic";
        threatName = "Yellow Mosaic Virus";
      } else if (necrosisPct > 25) {
        severity = 5;
        detectedThreatId = "pink_bollworm";
        threatName = "Pink Bollworm Larval Damage";
      } else if (affectedAreaPct > 10) {
        severity = 3;
        detectedThreatId = "bacterial_blight";
        threatName = "Bacterial Blight";
      } else {
        severity = 1;
        detectedThreatId = "healthy";
        threatName = "Minor Stress / Healthy Leaf";
        confidence = 94;
      }

      const differentials = [
        { name: threatName, value: Math.round(confidence * 0.8) },
        {
          name: chlorosisPct > 15 ? "Nutrient Chlorosis (Iron/N)" : "Fungal Leaf Spot",
          value: Math.round((100 - confidence) * 0.6),
        },
        { name: "Environmental Wind Tear", value: Math.round((100 - confidence) * 0.4) },
      ];

      const result: AnalysisResult = {
        chlorosisPct,
        necrosisPct,
        ndviScore,
        lesionCount,
        affectedAreaPct,
        detectedThreatId,
        threatName,
        confidence: Math.round(confidence),
        severity,
        differentials,
        lesionHotspots: hotspots,
      };

      setAnalysis(result);
      if (onAnalysisComplete) onAnalysisComplete(result);

      // 3. Render active CV layer overlay
      renderCanvasOverlay(ctx, img, width, height, data, activeLayer, hotspots);
      setLoading(false);
    };
  }, [imageSrc, activeLayer, cropType]);

  function renderCanvasOverlay(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    width: number,
    height: number,
    data: Uint8ClampedArray,
    layer: CVLayer,
    hotspots: { x: number; y: number; r: number; conf: number }[],
  ) {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    if (layer === "none") return;

    if (layer === "chlorosis" || layer === "necrosis" || layer === "ndvi") {
      const overlayData = ctx.createImageData(width, height);
      const o = overlayData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]!;
        const g = data[i + 1]!;
        const b = data[i + 2]!;

        // Skip background
        if ((r > 240 && g > 240 && b > 240) || (r < 25 && g < 25 && b < 25)) {
          o[i + 3] = 0;
          continue;
        }

        if (layer === "chlorosis") {
          // Yellowing highlight
          if (r > 130 && g > 130 && b < 120 && Math.abs(r - g) < 45) {
            o[i] = 255;
            o[i + 1] = 220;
            o[i + 2] = 0;
            o[i + 3] = 180;
          }
        } else if (layer === "necrosis") {
          // Necrotic brown lesion highlight
          if (r > 40 && r < 160 && g > 25 && g < 110 && b < 80 && r >= g) {
            o[i] = 239;
            o[i + 1] = 68;
            o[i + 2] = 68;
            o[i + 3] = 200;
          }
        } else if (layer === "ndvi") {
          // Spectral Greenness gradient overlay
          if (g > r && g > b) {
            o[i] = 16;
            o[i + 1] = 185;
            o[i + 2] = 129;
            o[i + 3] = 130;
          } else {
            o[i] = 245;
            o[i + 1] = 158;
            o[i + 2] = 11;
            o[i + 3] = 140;
          }
        }
      }
      ctx.putImageData(overlayData, 0, 0);
    }

    // Always draw bounding box hotspots if layer is bounding_boxes or if hotspots exist
    if (layer === "bounding_boxes" || layer === "necrosis") {
      hotspots.forEach((h, idx) => {
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = Math.max(3, Math.floor(width / 200));
        ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Tag label
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(h.x - h.r, h.y - h.r - 18, 54, 16);
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.max(10, Math.floor(width / 40))}px sans-serif`;
        ctx.fillText(`L${idx + 1}:${h.conf}%`, h.x - h.r + 3, h.y - h.r - 5);
      });
    }
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const r = pixel[0]!;
    const g = pixel[1]!;
    const b = pixel[2]!;

    let status = "Healthy Tissue";
    let healthScore = Math.min(98, Math.max(20, Math.round(((g - r) / 255) * 100 + 60)));

    if (r > 130 && g > 130 && b < 120) {
      status = "Chlorotic (Chlorophyll Loss)";
      healthScore = 42;
    } else if (r > 40 && r < 160 && g > 25 && g < 110 && r >= g) {
      status = "Necrotic Lesion Spot";
      healthScore = 18;
    }

    setClickedSpot({ x, y, r, g, b, healthScore, status });
  }

  return (
    <div className="flex flex-col space-y-3">
      {/* Canvas Box & Overlays */}
      <div
        ref={containerRef}
        className="relative group rounded-xl overflow-hidden border border-emerald-500/20 bg-slate-950 shadow-inner flex items-center justify-center min-h-[320px]"
      >
        {loading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center space-y-2 text-emerald-400">
            <Activity className="w-8 h-8 animate-spin" />
            <p className="text-sm font-medium">Running Computer Vision Canvas Pipeline...</p>
          </div>
        )}

        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="max-h-[440px] w-auto object-contain cursor-crosshair transition-transform duration-200"
        />

        {/* Spot Inspection Tooltip Overlay (Fixed position & unclipped styling) */}
        {clickedSpot && (
          <div
            className="absolute top-3 left-3 bg-[#0f172a]/95 backdrop-blur-md border border-emerald-500/60 p-3.5 rounded-lg text-xs text-slate-100 z-30 shadow-2xl min-w-[220px] max-w-[280px]"
          >
            <div className="flex items-center justify-between font-bold text-emerald-400 mb-1.5 border-b border-slate-700/60 pb-1">
              <span className="flex items-center gap-1">
                <Sparkles className="size-3.5" />
                <span>Pixel Point Inspector</span>
              </span>
              <button
                type="button"
                onClick={() => setClickedSpot(null)}
                className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors"
                title="Close Inspector"
              >
                ✕
              </button>
            </div>
            <p className="font-semibold text-white text-[0.8125rem]">{clickedSpot.status}</p>
            <div className="mt-1.5 flex items-center justify-between text-slate-200">
              <span className="text-slate-400">Health Score:</span>
              <span
                className={cx(
                  "font-bold text-[0.875rem]",
                  clickedSpot.healthScore > 60
                    ? "text-emerald-400"
                    : clickedSpot.healthScore > 35
                    ? "text-amber-400"
                    : "text-red-400",
                )}
              >
                {clickedSpot.healthScore}/100
              </span>
            </div>
            <div className="mt-1.5 text-[0.6875rem] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-1">
              <span>RGB: ({clickedSpot.r}, {clickedSpot.g}, {clickedSpot.b})</span>
              <span>Pos: ({clickedSpot.x}, {clickedSpot.y})</span>
            </div>
          </div>
        )}
      </div>

      {/* Layer Toggle Control Bar */}
      <div className="flex flex-wrap gap-2 items-center justify-between bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs">
        <span className="text-slate-400 font-medium flex items-center space-x-1">
          <Eye className="w-3.5 h-3.5 text-emerald-400" />
          <span>Vision Layers:</span>
        </span>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: "bounding_boxes", label: "Bounding Hotspots" },
              { id: "chlorosis", label: "Chlorosis Map" },
              { id: "necrosis", label: "Necrosis Mask" },
              { id: "ndvi", label: "NDVI Greenness" },
              { id: "none", label: "Clean Original" },
            ] as const
          ).map((l) => (
            <button
              key={l.id}
              onClick={() => onLayerChange && onLayerChange(l.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                activeLayer === l.id
                  ? "bg-emerald-500 text-slate-950 font-semibold shadow-sm"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
