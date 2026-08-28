import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Filter, Search } from "lucide-react";
import { useT } from "@/i18n";
import { Button, IconButton } from "@/components/ui/Button";
import { Checkbox, DateRange, Input, Radio, Select, Toggle } from "@/components/ui/Field";
import { Breadcrumb, Card, EmptyState, Skeleton, Timeline, Tooltip } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Alert } from "@/components/ui/Alert";
import { Modal, Drawer } from "@/components/ui/Overlay";
import { useToast } from "@/components/ui/Toast";
import { DataTable, type Column } from "@/components/ui/DataTable";
import {
  Badge,
  ConfidenceBar,
  SeverityMeter,
  StatusChip,
  StatusDot,
  type Status,
} from "@/components/ui/Status";
import { LogoHorizontal, LogoMark, LogoStacked } from "@/components/Logo";
import { SignalWeave } from "@/components/SignalWeave";

export const Route = createFileRoute("/styleguide")({
  head: () => ({
    meta: [
      { title: "Design system — CropXense" },
      {
        name: "description",
        content:
          "CropXense design tokens, UI primitives and interaction states for the Maharashtra crop surveillance platform.",
      },
      { property: "og:title", content: "Design system — CropXense" },
      {
        property: "og:description",
        content: "Tokens, primitives and states used across CropXense.",
      },
    ],
  }),
  component: Styleguide,
});

const TOKENS = [
  ["--paper", "#F2EFE6", "page background"],
  ["--surface", "#FBFAF6", "cards, panels"],
  ["--surface-2", "#E9E5D8", "inset rows, table headers"],
  ["--ink", "#1B1F1A", "primary text"],
  ["--ink-2", "#5A6155", "secondary text"],
  ["--line", "#D5CFBE", "hairline borders"],
  ["--forest", "#14382A", "brand / primary"],
  ["--leaf", "#2E6B3E", "status: healthy"],
  ["--amber", "#B8820C", "status: watch"],
  ["--alert", "#A6331E", "status: critical"],
  ["--water", "#1D5B78", "weather, moisture"],
  ["--soil", "#6B4A2F", "soil, parcels"],
];

const STATUSES: Status[] = ["healthy", "watch", "critical", "unconfirmed", "resolved"];

type Row = { id: string; trap: string; count: number };
const ROWS: Row[] = [
  { id: "TRP-001", trap: "Pheromone A", count: 14 },
  { id: "TRP-002", trap: "Light trap B", count: 3 },
  { id: "TRP-003", trap: "Sticky C", count: 27 },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-[1.75rem]">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Styleguide() {
  const { t } = useT();
  const { toast } = useToast();
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [toggle, setToggle] = useState(true);
  const [range, setRange] = useState({ from: "2026-08-01", to: "2026-08-25" });

  const cols: Column<Row>[] = [
    { key: "id", header: "Case ID", sortable: true },
    { key: "trap", header: "Trap", sortable: true },
    { key: "count", header: "Count", numeric: true, sortable: true },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-4">
      <Breadcrumb items={[{ label: t("nav.overview"), href: "/" }, { label: t("nav.styleguide") }]} />
      <h1 className="font-expanded mt-2 text-[2.5rem]">{t("page.styleguide.title")}</h1>
      <p className="text-ink-2">{t("page.styleguide.sub")}</p>

      <Section title="SignalWeave">
        <SignalWeave variant="hero" />
        <div className="mt-4">
          <p className="text-caption mb-1">variant=&quot;band&quot;</p>
          <SignalWeave variant="band" />
        </div>
        <div className="mt-4">
          <p className="text-caption mb-1">variant=&quot;static&quot;</p>
          <SignalWeave variant="static" />
        </div>
      </Section>

      <Section title="Logo">
        <div className="flex flex-wrap items-end gap-8 border border-line bg-surface p-4">
          <LogoMark size={48} />
          <LogoHorizontal size={28} />
          <LogoStacked size={44} />
          <span className="bg-forest p-3 text-paper">
            <LogoHorizontal size={24} />
          </span>
          <LogoMark size={16} />
        </div>
      </Section>

      <Section title="Color">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TOKENS.map(([name, hex, job]) => (
            <div key={name} className="flex items-center gap-3 border border-line bg-surface p-2">
              <span
                className="size-10 shrink-0 border border-line"
                style={{ background: `var(${name})` }}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="num text-[0.875rem]">
                  {name} {hex}
                </p>
                <p className="text-[0.75rem] text-ink-2">{job}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type">
        <div className="space-y-2 border border-line bg-surface p-4">
          <p className="font-expanded text-[3.5rem] leading-none">Display 3.5</p>
          <h3 className="font-expanded text-[2.5rem]">Heading 1 · जिल्हा सर्वेक्षण</h3>
          <h4 className="text-[1.75rem]">Heading 2 · निगरानी</h4>
          <p className="text-[1.25rem] font-display font-semibold">Heading 3</p>
          <p>Body 1rem — Public Sans, line-height 1.55, मराठी मिश्र मजकूर.</p>
          <p className="text-[0.875rem] text-ink-2">Small 0.875rem</p>
          <p className="text-caption">Caption / field label</p>
          <p className="num text-[1.25rem]">0123456789 · 88% · 21.0077, 75.5626 · 12.4 ha</p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="space-y-3 border border-line bg-surface p-4">
          {(["primary", "secondary", "ghost", "danger"] as const).map((v) => (
            <div key={v} className="flex flex-wrap items-center gap-2">
              <Button variant={v}>Default</Button>
              <Button variant={v} icon={<Download className="size-4" aria-hidden />}>
                With icon
              </Button>
              <Button variant={v} loading>
                Loading
              </Button>
              <Button variant={v} disabled>
                Disabled
              </Button>
              <Button variant={v} size="sm">
                Small
              </Button>
              <span className="text-caption">{v}</span>
            </div>
          ))}
          <div className="flex gap-2">
            <IconButton label="Search">
              <Search className="size-4" aria-hidden />
            </IconButton>
            <IconButton label="Filter" variant="secondary">
              <Filter className="size-4" aria-hidden />
            </IconButton>
          </div>
        </div>
      </Section>

      <Section title="Form controls">
        <div className="grid gap-3 border border-line bg-surface p-4 md:grid-cols-2">
          <Input label="Village" placeholder="Enter village name" />
          <Input label="Trap count" mono defaultValue="27" hint="Numeric fields use mono." />
          <Input label="Case ID" error="Case ID not found" defaultValue="MH-XXX" />
          <Input label="Disabled" disabled placeholder="Not editable" />
          <Select
            label={t("field.district")}
            options={[
              { value: "jal", label: "Jalgaon" },
              { value: "nas", label: "Nashik" },
              { value: "pun", label: "Pune" },
            ]}
          />
          <DateRange from={range.from} to={range.to} onChange={setRange} />
          <div className="flex flex-wrap gap-4">
            <Checkbox label="Confirmed by officer" defaultChecked />
            <Checkbox label="Disabled" disabled />
            <Radio name="sg-radio" label="Field visit" defaultChecked />
            <Radio name="sg-radio" label="Remote" />
            <Toggle label="Show unconfirmed" checked={toggle} onChange={setToggle} />
          </div>
        </div>
      </Section>

      <Section title="Status system">
        <div className="space-y-3 border border-line bg-surface p-4">
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <StatusChip key={s} status={s} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {STATUSES.map((s) => (
              <StatusDot key={s} status={s} />
            ))}
            <Badge>Neutral</Badge>
            <Badge tone="leaf">Healthy</Badge>
            <Badge tone="amber">Above threshold</Badge>
            <Badge tone="alert">Outbreak</Badge>
            <Badge tone="water">Rainfall</Badge>
            <Badge tone="soil">Soil</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <SeverityMeter level={1} />
            <SeverityMeter level={3} />
            <SeverityMeter level={5} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <ConfidenceBar value={91} />
            <ConfidenceBar value={64} />
            <ConfidenceBar value={38} />
          </div>
        </div>
      </Section>

      <Section title="Cards, table, tabs">
        <div className="grid gap-3 md:grid-cols-2">
          <Card title="Panel header" action={<Badge>7 d</Badge>}>
            <p className="text-[0.875rem]">Hairline border, caption header bar in surface-2.</p>
          </Card>
          <Card>
            <p className="text-[0.875rem]">Card without a header bar.</p>
          </Card>
          <div className="md:col-span-2">
            <DataTable caption="Trap counts" columns={cols} rows={ROWS} rowKey={(r) => r.id} />
          </div>
          <div className="md:col-span-2">
            <Tabs
              tabs={[
                { label: "Evidence", content: <p className="text-[0.875rem]">Photo evidence and metadata.</p> },
                { label: "Guidance", content: <p className="text-[0.875rem]">Cultural and biological controls first; chemical only after consulting your extension officer.</p> },
                { label: "History", content: <Timeline items={[
                  { time: "2026-08-24 09:12", title: "Report submitted", by: "Field worker, Jalgaon" },
                  { time: "2026-08-24 11:40", title: "Assessment generated", body: "Confidence 88%" },
                  { time: "2026-08-25 08:02", title: "Sent for expert review" },
                ]} /> },
              ]}
            />
          </div>
        </div>
      </Section>

      <Section title="Feedback">
        <div className="space-y-3">
          <Alert tone="info" title="Weather advisory">Rainfall above 40 mm expected in the next 24 hours.</Alert>
          <Alert tone="watch" title="Above threshold">Trap counts exceeded the economic threshold in 2 villages.</Alert>
          <Alert tone="critical" title="Outbreak declared">Pink bollworm confirmed across 12.4 ha in Jalgaon.</Alert>
          <Alert tone="success" title="Case resolved">Officer confirmed control measures were applied.</Alert>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => toast(t("action.reviewDone"), "healthy")}>
              Show toast
            </Button>
            <Button variant="secondary" onClick={() => setModal(true)}>
              Open modal
            </Button>
            <Button variant="secondary" onClick={() => setDrawer(true)}>
              Open case drawer
            </Button>
            <Tooltip label="Counts are recorded twice weekly">
              <span className="text-[0.875rem] underline decoration-dotted">Trap count</span>
            </Tooltip>
          </div>
          <EmptyState title={t("empty.title")} body={t("empty.body")} action={<Button variant="secondary">Reset filters</Button>} />
          <div className="space-y-2 border border-line bg-surface p-4">
            <Skeleton className="w-1/3" />
            <Skeleton className="w-2/3" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </Section>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Confirm expert review"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>
              {t("action.cancel")}
            </Button>
            <Button
              onClick={() => {
                setModal(false);
                toast(t("action.reviewDone"), "healthy");
              }}
            >
              {t("action.review")}
            </Button>
          </>
        }
      >
        <p className="text-[0.875rem]">{t("note.humanCheck")}</p>
      </Modal>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Case MH-JAL-24118">
        <ConfidenceBar value={88} />
        <p className="mt-3 text-[0.875rem]">
          Evidence: 4 photos, 2 trap readings, 1 field note. Assessment is provisional.
        </p>
      </Drawer>
    </div>
  );
}
