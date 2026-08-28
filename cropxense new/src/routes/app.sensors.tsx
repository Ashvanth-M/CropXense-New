import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Drawer } from "@/components/ui/Overlay";
import { Skeleton, EmptyState } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { Updated } from "@/components/app/bits";
import { useAsync } from "@/hooks/useAsync";
import { sensorBatterySeries, sensorDaySeries } from "@/data/instrumentSeries";
import { DISTRICTS, districtName, farmById, getSensors, latestWeather } from "@/services";
import type { Sensor } from "@/types";
import { cx } from "@/lib/cx";

export const Route = createFileRoute("/app/sensors")({
  head: () => ({
    meta: [
      { title: "Sensors — CropXense field instrument network" },
      {
        name: "description",
        content:
          "Soil moisture, temperature, humidity, leaf wetness and battery status for every field node in the network.",
      },
      { property: "og:title", content: "Sensors — CropXense" },
      {
        property: "og:description",
        content: "Node-by-node instrument health, 24-hour readings and maintenance actions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SensorsPage,
});

type NodeState = "online" | "warning" | "offline";

const STATE: Record<NodeState, { label: string; tone: string; glyph: string }> = {
  online: { label: "Online", tone: "var(--leaf)", glyph: "●" },
  warning: { label: "Warning", tone: "var(--amber)", glyph: "■" },
  offline: { label: "Offline", tone: "var(--alert)", glyph: "▲" },
};

function nodeState(s: Sensor): NodeState {
  if (s.status === "offline") return "offline";
  if (s.status === "calibration") return "warning";
  return "online";
}

function StateDot({ state }: { state: NodeState }) {
  const s = STATE[state];
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold" style={{ color: s.tone }}>
      <span aria-hidden style={{ color: s.tone }}>
        {s.glyph}
      </span>
      {s.label}
    </span>
  );
}

function hoursAgo(iso: string) {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 3.6e6));
}

function minutesAgo(iso: string) {
  return Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

function SensorsPage() {
  const { toast } = useToast();
  const [districtId, setDistrictId] = useState("");
  const [status, setStatus] = useState<"" | NodeState>("");
  const [open, setOpen] = useState<Sensor | null>(null);
  const [actionBusy, setActionBusy] = useState<"flag" | "recal" | null>(null);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  const sensorsQ = useAsync(() => getSensors(districtId || undefined), [districtId]);
  const sensors = sensorsQ.data ?? [];

  const rows = useMemo(
    () => sensors.filter((s) => !status || nodeState(s) === status),
    [sensors, status],
  );

  const online = sensors.filter((s) => nodeState(s) === "online").length;
  const warning = sensors.filter((s) => nodeState(s) === "warning").length;
  const offline = sensors.filter((s) => nodeState(s) === "offline").length;
  const lowBattery = sensors.filter((s) => s.battery < 25).length;

  const openWeather = open ? latestWeather(open.districtId) : undefined;
  const openSeries = open && openWeather ? sensorDaySeries(open.id, openWeather) : [];
  const openBattery = open ? sensorBatterySeries(open.id, open.battery) : [];
  const openFarm = open ? farmById(open.farmId) : undefined;
  const openState = open ? nodeState(open) : "online";

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.5rem]">Sensors</h1>
          <p className="text-[0.875rem] text-ink-2">
            Field instrument nodes reporting soil, canopy and battery readings across the network.
          </p>
        </div>
        <Updated minutes={12} />
      </header>

      <div className="grid grid-cols-2 border border-line bg-surface md:grid-cols-5">
        {[
          { label: "Deployed", value: sensors.length },
          { label: "Online", value: online },
          { label: "Warning", value: warning },
          { label: "Offline", value: offline },
          { label: "Battery below 25%", value: lowBattery },
        ].map((m) => (
          <div key={m.label} className="border-b border-r border-line p-3 last:border-r-0">
            <p className="text-caption">{m.label}</p>
            <p className="num text-[1.5rem] leading-tight">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-2 border border-line bg-surface p-3 sm:grid-cols-2">
        <Select
          label="District"
          value={districtId}
          onChange={(e) => setDistrictId(e.target.value)}
          options={[{ value: "", label: "All districts" }, ...DISTRICTS.map((d) => ({ value: d.id, label: d.name }))]}
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as "" | NodeState)}
          options={[
            { value: "", label: "All statuses" },
            { value: "online", label: "Online" },
            { value: "warning", label: "Warning" },
            { value: "offline", label: "Offline" },
          ]}
        />
      </div>

      {sensorsQ.loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title="No nodes match these filters" body="Clear a filter to see more of the sensor network." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((s) => {
            const state = nodeState(s);
            const farm = farmById(s.farmId);
            const w = latestWeather(s.districtId);
            const isOffline = state === "offline";
            const live = isOffline ? sensorDaySeries(s.id, w)[Math.max(0, 23 - hoursAgo(s.lastSeen) % 24)] : sensorDaySeries(s.id, w)[23];
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setOpen(s)}
                  className={cx(
                    "flex w-full flex-col gap-2 border border-line bg-surface p-3 text-left transition-colors hover:bg-surface-2",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                  )}
                  style={{ outlineColor: "var(--focus)" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="num text-[0.9375rem] font-semibold">{s.id}</span>
                    <StateDot state={state} />
                  </div>
                  <div>
                    <p className="text-[0.875rem] font-semibold">{farm?.name ?? s.farmId}</p>
                    <p className="text-[0.8125rem] text-ink-2">{farm?.village}, {districtName(s.districtId)}</p>
                  </div>

                  {isOffline ? (
                    <div className="text-ink-2">
                      <p className="num text-[0.75rem]">Last reading {hoursAgo(s.lastSeen)} h ago</p>
                      <dl className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1 text-[0.75rem] opacity-60">
                        <div><dt className="inline">Soil </dt><dd className="num inline">{live?.soilMoisture ?? "—"} %vwc</dd></div>
                        <div><dt className="inline">Temp </dt><dd className="num inline">{live?.tempC ?? "—"} °C</dd></div>
                        <div><dt className="inline">RH </dt><dd className="num inline">{live?.rhPct ?? "—"} %</dd></div>
                        <div><dt className="inline">Battery </dt><dd className="num inline">{s.battery}%</dd></div>
                      </dl>
                    </div>
                  ) : (
                    <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-[0.8125rem]">
                      <div>
                        <dt className="text-caption inline">Soil </dt>
                        <dd className="num inline">{live?.soilMoisture} %vwc</dd>
                      </div>
                      <div>
                        <dt className="text-caption inline">Temp </dt>
                        <dd className="num inline">{live?.tempC} °C</dd>
                      </div>
                      <div>
                        <dt className="text-caption inline">RH </dt>
                        <dd className="num inline">{live?.rhPct} %</dd>
                      </div>
                      <div>
                        <dt className="text-caption inline">Leaf wet </dt>
                        <dd className="num inline">{live?.leafWetnessHrs} h</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-caption inline">Battery </dt>
                        <dd
                          className="num inline"
                          style={{ color: s.battery < 25 ? "var(--alert)" : s.battery < 50 ? "var(--amber)" : "var(--ink)" }}
                        >
                          {s.battery}%
                        </dd>
                      </div>
                    </dl>
                  )}

                  <Updated minutes={minutesAgo(s.lastSeen)} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Drawer
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title={open ? `${open.id} — ${farmById(open.farmId)?.name ?? open.farmId}` : ""}
        footer={
          <>
            <Button
              variant="secondary"
              disabled={actionBusy === "flag" || (open ? flaggedIds.has(open.id) : false)}
              onClick={async () => {
                if (!open) return;
                setActionBusy("flag");
                await new Promise((r) => setTimeout(r, 500));
                setFlaggedIds((s) => new Set([...s, open.id]));
                setActionBusy(null);
                toast(`Node ${open.id} flagged for servicing — maintenance team notified`, "healthy");
              }}
            >
              {open && flaggedIds.has(open.id) ? "Already flagged" : actionBusy === "flag" ? "Flagging…" : "Flag for servicing"}
            </Button>
            <Button
              disabled={actionBusy === "recal"}
              onClick={async () => {
                if (!open) return;
                setActionBusy("recal");
                await new Promise((r) => setTimeout(r, 600));
                setActionBusy(null);
                toast(`Recalibration request sent for ${open.id}`, "healthy");
              }}
            >
              {actionBusy === "recal" ? "Sending…" : "Recalibrate"}
            </Button>
          </>
        }
      >
        {open ? (
          <div className="flex flex-col gap-4 text-[0.875rem]">
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 border border-line p-2">
              <div>
                <dt className="text-caption">Field</dt>
                <dd>
                  {openFarm ? (
                    <Link to="/app/farms/$id" params={{ id: openFarm.id }} className="underline underline-offset-2 hover:text-ink">
                      {openFarm.name}
                    </Link>
                  ) : (
                    open.farmId
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-caption">Village</dt>
                <dd>{openFarm?.village ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-caption">Status</dt>
                <dd>
                  <StateDot state={openState} />
                </dd>
              </div>
              <div>
                <dt className="text-caption">Battery</dt>
                <dd className="num">{open.battery}%</dd>
              </div>
              <div>
                <dt className="text-caption">Last seen</dt>
                <dd className="num">{open.lastSeen.replace("T", " ").slice(0, 16)}</dd>
              </div>
              <div>
                <dt className="text-caption">Coordinates</dt>
                <dd className="num">
                  {open.lat.toFixed(4)}, {open.lon.toFixed(4)}
                </dd>
              </div>
            </dl>

            {openState === "offline" ? (
              <p className="border border-line bg-surface-2 p-3 text-ink-2">
                This node has not reported in {hoursAgo(open.lastSeen)} hours. No live series is available; the panel below
                shows the last known reading only.
              </p>
            ) : null}

            <section>
              <p className="text-caption mb-1">Last 24 hours</p>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={openSeries} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke="var(--line)" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }} stroke="var(--ink-2)" interval={3} />
                    <YAxis tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }} stroke="var(--ink-2)" />
                    <RTooltip contentStyle={{ border: "1px solid var(--line)", borderRadius: 3, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="soilMoisture" name="Soil moisture (%vwc)" stroke="var(--soil)" dot={false} strokeWidth={1.5} />
                    <Line type="monotone" dataKey="tempC" name="Temp (°C)" stroke="var(--alert)" dot={false} strokeWidth={1.5} />
                    <Line type="monotone" dataKey="rhPct" name="RH (%)" stroke="var(--water)" dot={false} strokeWidth={1.5} />
                    <Line type="monotone" dataKey="leafWetnessHrs" name="Leaf wetness (h)" stroke="var(--leaf)" dot={false} strokeWidth={1.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section>
              <p className="text-caption mb-1">Battery — last 24 hours</p>
              <div style={{ width: "100%", height: 120 }}>
                <ResponsiveContainer>
                  <LineChart data={openBattery} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke="var(--line)" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }} stroke="var(--ink-2)" interval={5} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }} stroke="var(--ink-2)" />
                    <RTooltip contentStyle={{ border: "1px solid var(--line)", borderRadius: 3, fontSize: 12 }} />
                    <Line type="monotone" dataKey="battery" name="Battery (%)" stroke="var(--ink)" dot={false} strokeWidth={1.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
