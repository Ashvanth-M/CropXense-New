import { useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Farm, Outbreak, PestTrap, Sensor } from "@/types";
import { DISTRICTS, cropName, STAGE_LABEL } from "@/services";

export type LayerKey =
  | "boundaries"
  | "disease"
  | "pest"
  | "sensors"
  | "traps"
  | "weather"
  | "risk"
  | "confirmed";

const HEALTH_FILL: Record<Farm["health"], string> = {
  healthy: "var(--leaf)",
  at_risk: "var(--amber)",
  affected: "var(--alert)",
};

const RISK_FILL: Record<string, string> = {
  high: "#a6331e",
  moderate: "#b8820c",
  low: "#2e6b3e",
};

function shapeIcon(kind: "square" | "triangle" | "circle", color: string, active: boolean) {
  const body =
    kind === "square"
      ? `<rect x="2.5" y="2.5" width="9" height="9" fill="${active ? color : "none"}" stroke="${color}" stroke-width="1.5"/>`
      : kind === "triangle"
        ? `<path d="M7 2 L12.5 12 L1.5 12 Z" fill="${active ? color : "none"}" stroke="${color}" stroke-width="1.5"/>`
        : `<circle cx="7" cy="7" r="4.6" fill="none" stroke="${color}" stroke-width="1.5"/>`;
  return L.divIcon({
    className: "cx-marker",
    html: `<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">${body}</svg>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function ZoomReadout({ onChange }: { onChange: (v: { lat: number; lon: number; zoom: number }) => void }) {
  const map = useMapEvents({
    mousemove: (e) => onChange({ lat: e.latlng.lat, lon: e.latlng.lng, zoom: map.getZoom() }),
    zoomend: () => onChange({ lat: map.getCenter().lat, lon: map.getCenter().lng, zoom: map.getZoom() }),
  });
  return null;
}

function ZoomWatcher({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) });
  return null;
}

export default function SurveillanceMap({
  farms,
  outbreaks,
  sensors,
  traps,
  layers,
  onSelectOutbreak,
}: {
  farms: Farm[];
  outbreaks: Outbreak[];
  sensors: Sensor[];
  traps: PestTrap[];
  layers: Record<LayerKey, boolean>;
  onSelectOutbreak: (o: Outbreak) => void;
}) {
  const [zoom, setZoom] = useState(5);
  const [cursor, setCursor] = useState({ lat: 22.5, lon: 80.0, zoom: 5 });
  const clustered = zoom < 9;

  const clusters = useMemo(() => {
    return DISTRICTS.map((d) => ({
      district: d,
      count: farms.filter((f) => f.districtId === d.id).length,
    })).filter((c) => c.count > 0);
  }, [farms]);

  const maxAffected = Math.max(1, ...outbreaks.map((o) => o.affectedFields));

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[22.5, 80.0]}
        zoom={5}
        minZoom={4}
        maxZoom={13}
        scrollWheelZoom
        className="h-full w-full bg-paper"
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="cx-tiles opacity-85"
        />
        <ZoomWatcher onZoom={setZoom} />
        <ZoomReadout onChange={setCursor} />

        {layers.risk &&
          DISTRICTS.map((d) => {
            const ob = outbreaks.find((o) => o.districtId === d.id);
            const tone = RISK_FILL[ob?.risk ?? "low"] ?? "#2e6b3e";
            return (
              <Polygon
                key={`risk-${d.id}`}
                positions={d.bounds}
                pathOptions={{ color: tone, weight: 1, fillColor: tone, fillOpacity: 0.08, dashArray: "4 3" }}
              />
            );
          })}

        {layers.boundaries &&
          farms.map((f) => (
            <Polygon
              key={f.id}
              positions={f.parcel}
              pathOptions={{
                color: HEALTH_FILL[f.health],
                weight: 1.5,
                fillColor: HEALTH_FILL[f.health],
                fillOpacity: 0.25,
              }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <span className="font-bold text-forest block text-[0.875rem]">{f.name}</span>
                  <span className="block text-ink font-semibold">Farmer: {f.ownerName}</span>
                  <span className="block text-ink-2">Location: {f.village}, {f.districtId}</span>
                  <span className="block text-ink-2">Crop: {cropName(f.cropId)} ({STAGE_LABEL[f.stage] || f.stage})</span>
                  <span className="block text-ink-2">Area: {f.areaHa} ha</span>
                  <span className="mt-1 inline-block uppercase font-bold text-caption px-1.5 py-0.5 border border-line bg-surface">
                    Status: {f.health}
                  </span>
                </div>
              </Popup>
            </Polygon>
          ))}

        {clustered &&
          layers.boundaries &&
          clusters.map((c) => (
            <CircleMarker
              key={`cl-${c.district.id}`}
              center={[c.district.lat, c.district.lon]}
              radius={9 + Math.sqrt(c.count) * 1.6}
              pathOptions={{ color: "var(--forest)", weight: 1, fillColor: "var(--surface)", fillOpacity: 0.9 }}
            >
              <Popup>
                <div className="p-1 text-xs font-semibold">
                  {c.district.name} District: {c.count} registered farms
                </div>
              </Popup>
            </CircleMarker>
          ))}

        {outbreaks
          .filter((o) => (o.threatName.length > 0 && layers.disease) || layers.pest)
          .map((o) => (
            <CircleMarker
              key={o.id}
              center={[o.lat, o.lon]}
              radius={7 + (o.affectedFields / maxAffected) * 16}
              className={o.newest ? "cx-pulse" : undefined}
              pathOptions={{
                color: o.risk === "high" ? "#a6331e" : "#b8820c",
                weight: 1.5,
                fillColor: o.risk === "high" ? "#a6331e" : "#b8820c",
                fillOpacity: 0.22,
              }}
              eventHandlers={{ click: () => onSelectOutbreak(o) }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <span className="font-bold text-alert block text-[0.875rem]">{o.threatName}</span>
                  <span className="block text-ink font-semibold">Risk: {o.risk.toUpperCase()}</span>
                  <span className="block text-ink-2">Affected fields: {o.affectedFields}</span>
                </div>
              </Popup>
            </CircleMarker>
          ))}

        {layers.sensors &&
          !clustered &&
          sensors.map((s) => (
            <Marker
              key={s.id}
              position={[s.lat, s.lon]}
              icon={shapeIcon("square", s.status === "online" ? "#1d5b78" : "#5a6155", s.status === "online")}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <span className="font-bold block">Canopy Sensor: {s.id}</span>
                  <span>Type: {s.type} · Status: {s.status}</span>
                </div>
              </Popup>
            </Marker>
          ))}

        {layers.traps &&
          !clustered &&
          traps.map((t) => (
            <Marker
              key={t.id}
              position={[t.lat, t.lon]}
              icon={shapeIcon("triangle", t.status === "active" ? "#6b4a2f" : "#5a6155", t.status === "active")}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <span className="font-bold block">Pest Trap: {t.id}</span>
                  <span>Type: {t.type} · Status: {t.status}</span>
                </div>
              </Popup>
            </Marker>
          ))}

        {layers.weather &&
          DISTRICTS.map((d) => (
            <Marker key={`w-${d.id}`} position={[d.lat + 0.12, d.lon - 0.12]} icon={shapeIcon("circle", "#1d5b78", false)} />
          ))}
      </MapContainer>

      {/* cartographic furniture */}
      <div className="pointer-events-none absolute bottom-2 left-2 z-[500] border border-line bg-surface/90 px-2 py-1">
        <span className="num text-[0.75rem] text-ink-2">
          {cursor.lat.toFixed(3)}°N {cursor.lon.toFixed(3)}°E · z{cursor.zoom}
        </span>
      </div>
      <div className="pointer-events-none absolute right-2 top-2 z-[500] flex items-end gap-3 border border-line bg-surface/90 px-2 py-1">
        <svg width="72" height="22" viewBox="0 0 72 22" aria-label="Scale bar, 50 kilometres">
          <path d="M4 14 H64" stroke="var(--ink)" strokeWidth="1" />
          <path d="M4 10 V18 M34 11 V17 M64 10 V18" stroke="var(--ink)" strokeWidth="1" />
          <text x="4" y="8" fontSize="7" fill="var(--ink-2)" fontFamily="IBM Plex Mono">
            0
          </text>
          <text x="52" y="8" fontSize="7" fill="var(--ink-2)" fontFamily="IBM Plex Mono">
            50 km
          </text>
        </svg>
        <svg width="20" height="26" viewBox="0 0 20 26" aria-label="North arrow">
          <path d="M10 3 L15 20 L10 16 L5 20 Z" fill="none" stroke="var(--ink)" strokeWidth="1" />
          <text x="7" y="26" fontSize="7" fill="var(--ink-2)" fontFamily="IBM Plex Mono">
            N
          </text>
        </svg>
      </div>
    </div>
  );
}
