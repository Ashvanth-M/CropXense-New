import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Select, Input, Textarea, Checkbox } from "@/components/ui/Field";
import { Drawer } from "@/components/ui/Overlay";
import { Skeleton, EmptyState } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { Panel, Updated } from "@/components/app/bits";
import { VoiceAssistant } from "@/components/app/VoiceAssistant";
import { useAsync } from "@/hooks/useAsync";
import {
  acknowledgeAdvisory,
  districtName,
  farmById,
  getAdvisories,
  getAssessments,
  issueAdvisory,
} from "@/services";
import {
  ADVISORY_CONTENT,
  ADVISORY_TEMPLATES,
  CHANNEL_LABEL,
  LANG3,
  READ_LABEL,
  SEVERITY_LABEL,
  SEVERITY_TONE,
  deriveAdvisoryMeta,
  type AdvisoryLangBlock,
  type Lang3,
} from "@/data/advisoryContent";
import type { Advisory } from "@/types";

export const Route = createFileRoute("/app/advisories")({
  head: () => ({
    meta: [
      { title: "Advisories — CropXense IPM guidance register" },
      {
        name: "description",
        content:
          "Integrated pest management advisories issued to farms: cultural and biological measures first, chemical options only with extension officer consultation.",
      },
      { property: "og:title", content: "Advisories — CropXense" },
      {
        property: "og:description",
        content: "IPM-first advisories issued to farms, with trilingual text and acknowledgement tracking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdvisoriesPage,
});

type Row = {
  id: string;
  title: string;
  field: string;
  district: string;
  window: string;
  issued: string;
  state: string;
  raw: Advisory;
  severity: ReturnType<typeof deriveAdvisoryMeta>;
};

function blockFor(a: Advisory, lang: Lang3): AdvisoryLangBlock {
  const t = ADVISORY_CONTENT[a.id];
  if (t) return t[lang];
  return {
    title: a.title,
    situation: `Guidance issued for ${a.window}.`,
    cultural: a.cultural,
    biological: a.biological,
    chemical: a.chemical,
  };
}

function SeverityHeader({ sev }: { sev: keyof typeof SEVERITY_LABEL }) {
  const shape = sev === "critical" ? "▲" : sev === "high" ? "◆" : sev === "moderate" ? "■" : "●";
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap border px-1.5 py-0.5 text-[0.75rem] font-semibold"
      style={{ color: SEVERITY_TONE[sev], borderColor: SEVERITY_TONE[sev] }}
    >
      <span aria-hidden>{shape}</span>
      {SEVERITY_LABEL[sev]}
    </span>
  );
}

function IpmBlocks({ block }: { block: AdvisoryLangBlock }) {
  const groups = [
    { heading: "1. Cultural measures", items: block.cultural, note: "Start here — no input cost." },
    { heading: "2. Biological measures", items: block.biological, note: "Apply in the evening." },
    {
      heading: "3. Chemical measures",
      items: block.chemical,
      note: "Only if the first two steps do not hold the population. Confirm the product and dose with your extension officer before spraying.",
    },
  ];
  return (
    <>
      {groups.map((g) => (
        <section key={g.heading} className="border border-line">
          <header className="border-b border-line px-3 py-2">
            <h3 className="text-caption">{g.heading}</h3>
          </header>
          <div className="p-3">
            <ol className="flex list-decimal flex-col gap-1 pl-4 text-[0.875rem]">
              {g.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
              {g.items.length === 0 ? <li className="list-none pl-0 text-ink-2">Not required at this stage.</li> : null}
            </ol>
            <p className="mt-2 text-[0.75rem] text-ink-2">{g.note}</p>
          </div>
        </section>
      ))}
    </>
  );
}

function LangTabs({ lang, onChange }: { lang: Lang3; onChange: (l: Lang3) => void }) {
  return (
    <div className="flex border border-line" role="tablist" aria-label="Advisory language">
      {LANG3.map((l) => (
        <button
          key={l.code}
          type="button"
          role="tab"
          aria-selected={lang === l.code}
          onClick={() => onChange(l.code)}
          className="min-h-11 flex-1 border-r border-line px-3 text-[0.875rem] font-semibold last:border-r-0"
          style={
            lang === l.code
              ? { background: "var(--forest)", color: "var(--paper)" }
              : { background: "transparent" }
          }
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

function AdvisoriesPage() {
  const { toast } = useToast();
  const [state, setState] = useState("");
  const [open, setOpen] = useState<Advisory | null>(null);
  const [lang, setLang] = useState<Lang3>("en");
  const [busy, setBusy] = useState(false);
  const [issueBusy, setIssueBusy] = useState(false);

  // composer
  const [tplId, setTplId] = useState(ADVISORY_TEMPLATES[0]!.id);
  const [target, setTarget] = useState("");
  const [window_, setWindow] = useState("Within 48 hours");
  const [composeLang, setComposeLang] = useState<Lang3>("en");
  const [channels, setChannels] = useState({ sms: true, app: true, voice: false });
  const [note, setNote] = useState("");

  const advisoriesQ = useAsync(() => getAdvisories(), []);
  const casesQ = useAsync(() => getAssessments(), []);

  const advisories = advisoriesQ.data ?? [];

  const rows: Row[] = useMemo(() => {
    const cases = casesQ.data ?? [];
    return advisories
      .filter((a) =>
        state === "" ? true : state === "acknowledged" ? a.acknowledged : !a.acknowledged,
      )
      .map((a) => {
        const farm = farmById(a.farmId);
        const c = cases.find((x) => x.id === a.assessmentId);
        return {
          id: a.id,
          title: blockFor(a, "en").title,
          field: farm?.name ?? a.farmId,
          district: districtName(farm?.districtId ?? c?.districtId ?? ""),
          window: a.window,
          issued: a.issuedAt.replace("T", " ").slice(0, 16),
          state: a.acknowledged ? "Acknowledged" : "Awaiting acknowledgement",
          raw: a,
          severity: deriveAdvisoryMeta(a.id, c?.severity ?? 3, a.issuedAt),
        };
      });
  }, [advisories, casesQ.data, state]);

  const pending = advisories.filter((a) => !a.acknowledged).length;

  const columns: Column<Row>[] = [
    { key: "id", header: "Advisory", width: "110px", render: (r) => <span className="num text-[0.8125rem]">{r.id}</span> },
    {
      key: "severity",
      header: "Severity",
      width: "130px",
      render: (r) => <SeverityHeader sev={r.severity.severity} />,
    },
    { key: "title", header: "Guidance", sortable: true },
    { key: "field", header: "Field", sortable: true },
    { key: "district", header: "District", sortable: true },
    { key: "window", header: "Action window" },
    {
      key: "issued",
      header: "Issued",
      sortable: true,
      render: (r) => <span className="num text-[0.8125rem]">{r.issued}</span>,
    },
    {
      key: "state",
      header: "Delivery",
      render: (r) => (
        <span className="flex flex-col gap-0.5 text-[0.75rem]">
          <span className="font-semibold" style={{ color: r.raw.acknowledged ? "var(--leaf)" : "var(--amber)" }}>
            <span aria-hidden>{r.raw.acknowledged ? "✓ " : "◧ "}</span>
            {r.state}
          </span>
          <span className="text-ink-2">
            {CHANNEL_LABEL[r.severity.channel]} · {READ_LABEL[r.severity.readState]}
          </span>
        </span>
      ),
    },
    {
      key: "raw",
      header: "",
      width: "108px",
      render: (r) => (
        <Button size="sm" variant="secondary" onClick={() => { setLang("en"); setOpen(r.raw); }}>
          Open
        </Button>
      ),
    },
  ];

  async function acknowledge(a: Advisory) {
    setBusy(true);
    await acknowledgeAdvisory(a.id);
    setBusy(false);
    setOpen(null);
    toast("Advisory marked as acknowledged by the farmer");
  }

  const tpl = ADVISORY_TEMPLATES.find((t) => t.id === tplId)!;
  const preview = tpl.content[composeLang];
  const openMeta = open
    ? deriveAdvisoryMeta(
        open.id,
        (casesQ.data ?? []).find((c) => c.id === open.assessmentId)?.severity ?? 3,
        open.issuedAt,
      )
    : null;

  return (
    <div className="flex flex-col gap-3" data-demo="advisories">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.5rem]">Advisories</h1>
          <p className="text-[0.875rem] text-ink-2">
            Guidance issued against validated cases. Cultural and biological measures are listed before
            chemical options; dosage is set by your extension officer, not by this system.
          </p>
        </div>
        <Updated minutes={8} />
      </header>

      <div className="grid grid-cols-2 border border-line bg-surface md:grid-cols-3">
        {[
          { label: "Advisories issued", value: advisories.length, note: "current season" },
          { label: "Awaiting acknowledgement", value: pending, note: "follow up by phone" },
          {
            label: "Acknowledged",
            value: advisories.length - pending,
            note: "farmer confirmed receipt",
          },
        ].map((m) => (
          <div key={m.label} className="border-b border-r border-line p-3 last:border-r-0">
            <p className="text-caption">{m.label}</p>
            <p className="num text-[1.5rem] leading-tight">{m.value}</p>
            <p className="text-[0.75rem] text-ink-2">{m.note}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.7fr_1fr]">
        <Panel title="Advisory register" meta={`${rows.length} records`} bodyClassName="p-3 flex flex-col gap-3">
          <div className="max-w-xs">
            <Select
              label="Status"
              value={state}
              onChange={(e) => setState(e.currentTarget.value)}
              options={[
                { value: "", label: "All advisories" },
                { value: "pending", label: "Awaiting acknowledgement" },
                { value: "acknowledged", label: "Acknowledged" },
              ]}
            />
          </div>
          {advisoriesQ.loading ? (
            <Skeleton className="h-64 w-full" />
          ) : rows.length ? (
            <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} caption="Advisory register" />
          ) : (
            <EmptyState
              title="No advisories match this filter"
              body="Change the status filter to see the rest of the register."
            />
          )}
        </Panel>

        <Panel title="Compose advisory" meta="IPM-first template" bodyClassName="p-3 flex flex-col gap-3">
          <Select
            label="Template"
            value={tplId}
            onChange={(e) => setTplId(e.currentTarget.value)}
            options={ADVISORY_TEMPLATES.map((t) => ({ value: t.id, label: t.label }))}
          />
          <Input
            label="Send to"
            placeholder="Field ID, village or district"
            value={target}
            onChange={(e) => setTarget(e.currentTarget.value)}
          />
          <Select
            label="Action window"
            value={window_}
            onChange={(e) => setWindow(e.currentTarget.value)}
            options={[
              { value: "Within 24 hours", label: "Within 24 hours" },
              { value: "Within 48 hours", label: "Within 48 hours" },
              { value: "Within 5 days", label: "Within 5 days" },
            ]}
          />
          <Textarea
            label="Officer note (optional)"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.currentTarget.value)}
            placeholder="Add a local instruction, e.g. collect at the village centre on Thursday"
          />
          <fieldset className="border border-line p-3">
            <legend className="text-caption px-1">Delivery channels</legend>
            <div className="flex flex-col gap-1">
              {(["sms", "app", "voice"] as const).map((c) => (
                <Checkbox
                  key={c}
                  label={CHANNEL_LABEL[c]}
                  checked={channels[c]}
                  onChange={(e) =>
                    setChannels((s) => ({ ...s, [c]: (e.currentTarget as HTMLInputElement).checked }))
                  }
                />
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <p className="text-caption">Preview</p>
            <LangTabs lang={composeLang} onChange={setComposeLang} />
            <div className="border border-line p-3">
              <h3 className="text-[0.9375rem] font-semibold">{preview.title || "Untitled advisory"}</h3>
              <p className="mt-1 text-[0.875rem] text-ink-2">
                {preview.situation || "Add the situation summary before issuing."}
              </p>
              <ol className="mt-2 flex list-decimal flex-col gap-1 pl-4 text-[0.8125rem]">
                {[...preview.cultural, ...preview.biological, ...preview.chemical].map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ol>
              {note ? <p className="mt-2 border-t border-line pt-2 text-[0.8125rem]">{note}</p> : null}
            </div>
          </div>

          <Button
            disabled={!target || !preview.title || issueBusy}
            onClick={async () => {
              setIssueBusy(true);
              try {
                // Find the most recent unadvised assessment matching the target
                const allCases = casesQ.data ?? [];
                const match = allCases.find(
                  (c) =>
                    !["resolved", "rejected"].includes(c.status) &&
                    (c.farmId.toLowerCase().includes(target.toLowerCase()) ||
                      c.districtId.toLowerCase().includes(target.toLowerCase())),
                );
                if (match) {
                  await issueAdvisory(match.id);
                  const list = (Object.keys(channels) as (keyof typeof channels)[]).filter((c) => channels[c]);
                  toast(
                    `Advisory issued for ${target} via ${list.map((c) => CHANNEL_LABEL[c]).join(", ") || "no channel"}`,
                    "healthy",
                  );
                  advisoriesQ.reload?.();
                } else {
                  toast(`No open case found matching "${target}" — advisory template saved`);
                }
              } catch {
                toast("Could not issue advisory — please try again");
              } finally {
                setIssueBusy(false);
              }
            }}
          >
            {issueBusy ? "Issuing…" : "Issue advisory"}
          </Button>
          <p className="text-[0.75rem] text-ink-2">
            Chemical options carry no dosage. The extension officer confirms product and rate before any
            spray is recommended to a farmer.
          </p>
        </Panel>
      </div>

      <Drawer
        open={!!open}
        onClose={() => setOpen(null)}
        title={open ? blockFor(open, lang).title : ""}
        footer={
          open ? (
            <div className="flex flex-wrap items-center justify-between w-full gap-2">
              <VoiceAssistant
                textToSpeak={`${blockFor(open, lang).title}. ${blockFor(open, lang).situation}. Cultural: ${blockFor(open, lang).cultural.join(". ")}`}
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    window.print();
                  }}
                >
                  Print / Export PDF
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const farm = farmById(open.farmId);
                    const phone = farm ? "" : "";
                    const smsBody = encodeURIComponent(
                      `CropXense Advisory ${open.id}: ${blockFor(open, "en").title}. Action window: ${open.window}.`,
                    );
                    window.open(`sms:?body=${smsBody}`);
                    toast(`SMS draft opened for advisory ${open.id}`);
                  }}
                >
                  Resend SMS
                </Button>
                <Button loading={busy} disabled={open.acknowledged} onClick={() => acknowledge(open)}>
                  {open.acknowledged ? "Acknowledged" : "Acknowledge"}
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {open && openMeta ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityHeader sev={openMeta.severity} />
              <span className="text-[0.75rem] text-ink-2">
                Issued by {openMeta.officer} · {CHANNEL_LABEL[openMeta.channel]} ·{" "}
                {READ_LABEL[openMeta.readState]}
              </span>
            </div>

            <LangTabs lang={lang} onChange={setLang} />

            <p className="text-[0.875rem]">{blockFor(open, lang).situation}</p>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[0.875rem]">
              <div>
                <dt className="text-caption">Advisory ID</dt>
                <dd className="num">{open.id}</dd>
              </div>
              <div>
                <dt className="text-caption">Case</dt>
                <dd className="num">{open.assessmentId}</dd>
              </div>
              <div>
                <dt className="text-caption">Field</dt>
                <dd>{farmById(open.farmId)?.name ?? open.farmId}</dd>
              </div>
              <div>
                <dt className="text-caption">Action window</dt>
                <dd>{open.window}</dd>
              </div>
            </dl>

            <IpmBlocks block={blockFor(open, lang)} />
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
