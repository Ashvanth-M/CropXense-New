import { createFileRoute } from "@tanstack/react-router";
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
import { DISTRICTS, farmById, getSensors, latestWeather } from "@/services";
import type { Sensor } from "@/types";
import { cx } from "@/lib/cx";
import { useT } from "@/i18n";

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

const STATE: Record<NodeState, { labelKey: string; tone: string; glyph: string }> = {
  online: { labelKey: "status.healthy", tone: "var(--leaf)", glyph: "●" },
  warning: { labelKey: "status.watch", tone: "var(--amber)", glyph: "■" },
  offline: { labelKey: "status.critical", tone: "var(--alert)", glyph: "▲" },
};

function nodeState(s: Sensor): NodeState {
  if (s.status === "offline") return "offline";
  if (s.status === "calibration") return "warning";
  return "online";
}

function StateDot({ state }: { state: NodeState }) {
  const { t } = useT();
  const s = STATE[state];
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold" style={{ color: s.tone }}>
      <span aria-hidden style={{ color: s.tone }}>
        {s.glyph}
      </span>
      {t(s.labelKey as any)}
    </span>
  );
}

function hoursAgo(iso: string) {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 3.6e6));
}

function SensorsPage() {
  const { toast } = useToast();
  const { t, tDistrict } = useT();
  const [districtId, setDistrictId] = useState("");
  const [status, setStatus] = useState<"" | NodeState>("");
  const [open, setOpen] = useState<Sensor | null>(null);
  const [actionBusy, setActionBusy] = useState<"flag" | "recal" | null>(null);

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
          <h1 className="text-[1.5rem]">{t("nav.canopySensors")}</h1>
          <p className="text-[0.875rem] text-ink-2">
            {t("landing.sigSensorTells")}
          </p>
        </div>
        <Updated minutes={12} />
      </header>

      <div className="grid grid-cols-2 border border-line bg-surface md:grid-cols-5">
        {[
          { label: t("common.total"), value: sensors.length },
          { label: t("status.healthy"), value: online },
          { label: t("status.watch"), value: warning },
          { label: t("status.critical"), value: offline },
          { label: `${t("pests.trend")} < 25%`, value: lowBattery },
        ].map((m) => (
          <div key={m.label} className="border-b border-r border-line p-3 last:border-r-0">
            <p className="text-caption">{m.label}</p>
            <p className="num text-[1.5rem] leading-tight">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-2 border border-line bg-surface p-3 sm:grid-cols-2">
        <Select
          label={t("field.district")}
          value={districtId}
          onChange={(e) => setDistrictId(e.target.value)}
          options={[{ value: "", label: t("common.all") }, ...DISTRICTS.map((d) => ({ value: d.id, label: tDistrict(d.id) }))]}
        />
        <Select
          label={t("field.health")}
          value={status}
          onChange={(e) => setStatus(e.target.value as "" | NodeState)}
          options={[
            { value: "", label: t("common.all") },
            { value: "online", label: t("status.healthy") },
            { value: "warning", label: t("status.watch") },
            { value: "offline", label: t("status.critical") },
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
        <EmptyState title={t("empty.noCases")} body={t("empty.body")} />
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
                    <p className="text-[0.8125rem] text-ink-2">{farm?.village}, {tDistrict(s.districtId)}</p>
                  </div>

                  {isOffline ? (
                    <div className="text-ink-2">
                      <p className="num text-[0.75rem]">{hoursAgo(s.lastSeen)} {t("common.hr")} {t("common.ago")}</p>
                      <dl className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1 text-[0.75rem] opacity-60">
                        <div><dt className="inline">{t("weather.rh")} </dt><dd className="num inline">{live?.soilMoisture ?? "—"} %vwc</dd></div>
                        <div><dt className="inline">{t("farmer.temperature")} </dt><dd className="num inline">{live?.tempC ?? "—"} °C</dd></div>
                        <div><dt className="inline">{t("farmer.humidity")} </dt><dd className="num inline">{live?.rhPct ?? "—"} %</dd></div>
                        <div><dt className="inline">Battery </dt><dd className="num inline">{s.battery}%</dd></div>
                      </dl>
                    </div>
                  ) : (
                    <div>
                      <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-[0.8125rem]">
                        <div><dt className="text-ink-2 inline">{t("farmer.humidity")} </dt><dd className="num inline font-semibold">{live?.soilMoisture ?? "—"}%</dd></div>
                        <div><dt className="text-ink-2 inline">{t("farmer.temperature")} </dt><dd className="num inline font-semibold">{live?.tempC ?? "—"}°C</dd></div>
                        <div><dt className="text-ink-2 inline">RH </dt><dd className="num inline font-semibold">{live?.rhPct ?? "—"}%</dd></div>
                        <div><dt className="text-ink-2 inline">Battery </dt><dd className="num inline font-semibold">{s.battery}%</dd></div>
                      </dl>
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Drawer open={Boolean(open)} onClose={() => setOpen(null)} title={open ? `Sensor ${open.id}` : ""}>
        {open ? (
          <div className="space-y-4 text-[0.875rem]">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <p className="font-semibold text-ink">{openFarm?.name ?? open.farmId}</p>
                <p className="text-[0.8125rem] text-ink-2">{openFarm?.village}, {tDistrict(open.districtId)}</p>
              </div>
              <StateDot state={openState} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={actionBusy !== null}
                onClick={async () => {
                  setActionBusy("recal");
                  await new Promise((r) => setTimeout(r, 600));
                  toast(t("toast.saved"), "healthy");
                  setActionBusy(null);
                }}
              >
                {actionBusy === "recal" ? t("common.loading") : t("action.refresh")}
              </Button>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
