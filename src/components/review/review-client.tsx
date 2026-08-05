"use client";

import { useState, useTransition } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { PdfPane } from "@/components/review/pdf-pane";
import { TABS, type FieldDef, type SectionRenderer } from "@/lib/field-map";
import { getPath, setPath } from "@/lib/path";
import { confirmField, saveField } from "@/lib/actions/review";
import { cn } from "@/lib/utils";
import type { Confidence, FlagStatus, TenderData } from "@/lib/types";

interface FlagState {
  confidence: Confidence;
  source_page: number | null;
  status: FlagStatus;
}
type Flags = Record<string, FlagState>;

export function ReviewClient({
  tenderId,
  initialData,
  initialFlags,
  signedUrl,
}: {
  tenderId: string;
  initialData: TenderData;
  initialFlags: Flags;
  signedUrl: string | null;
}) {
  const [data, setData] = useState<TenderData>(initialData);
  const [flags, setFlags] = useState<Flags>(initialFlags);
  const [activePage, setActivePage] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  function jump(page: number | null) {
    if (page != null) setActivePage(page);
  }

  function onSave(args: {
    flagPath: string;
    dataPath?: string;
    value: string;
    type?: FieldDef["type"];
    isInput?: boolean;
  }) {
    const { flagPath, dataPath = flagPath, value, type = "text", isInput } = args;
    const filled = value !== "";
    // Optimistic: update value + flag colour immediately.
    setData((d) =>
      setPath(
        d,
        dataPath,
        value === "" ? null : type === "number" ? Number(value) : value,
      ),
    );
    setFlags((f) => ({
      ...f,
      [flagPath]: {
        ...f[flagPath],
        confidence: filled ? "green" : "red",
        status: filled ? "confirmed" : "missing",
      },
    }));
    startTransition(() =>
      saveField({ tenderId, flagPath, dataPath, value, type, isInput }),
    );
  }

  function onConfirm(flagPath: string) {
    setFlags((f) => ({
      ...f,
      [flagPath]: { ...f[flagPath], confidence: "green", status: "confirmed" },
    }));
    startTransition(() => confirmField(tenderId, flagPath));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="lg:sticky lg:top-4 lg:self-start">
        <PdfPane signedUrl={signedUrl} page={activePage} />
      </div>

      <div>
        <Tabs defaultValue={TABS[0].key}>
          <TabsList className="flex w-full flex-wrap justify-start gap-1 h-auto">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key}>
                {tab.label_ar}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map((tab) => (
            <TabsContent key={tab.key} value={tab.key} className="space-y-3">
              {(tab.fields ?? []).map((field) => (
                <FieldRow
                  key={field.path}
                  field={field}
                  value={getPath(data, field.path)}
                  flag={flags[field.path]}
                  onSave={onSave}
                  onConfirm={onConfirm}
                  onJump={jump}
                />
              ))}
              {(tab.sections ?? []).map((s) => (
                <Section
                  key={s}
                  kind={s}
                  data={data}
                  flags={flags}
                  onSave={onSave}
                  onJump={jump}
                />
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Editable scalar field                                                      */
/* -------------------------------------------------------------------------- */

function FieldRow({
  field,
  value,
  flag,
  onSave,
  onConfirm,
  onJump,
}: {
  field: FieldDef;
  value: unknown;
  flag: FlagState | undefined;
  onSave: (a: { flagPath: string; value: string; type?: FieldDef["type"] }) => void;
  onConfirm: (path: string) => void;
  onJump: (page: number | null) => void;
}) {
  const confidence = flag?.confidence ?? "red";
  const current = value == null ? "" : String(value);

  return (
    <div className={cn("rounded-lg border p-3", confidence === "red" && "border-confidence-red/40")}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{field.label_ar}</span>
          <span className="text-xs text-muted-foreground" dir="ltr">
            {field.label_en}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {flag?.source_page != null && (
            <button
              type="button"
              onClick={() => onJump(flag.source_page)}
              className="text-xs text-primary hover:underline"
            >
              صفحة {flag.source_page}
            </button>
          )}
          <ConfidenceBadge confidence={confidence} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Input
          defaultValue={current}
          type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
          dir={field.type === "text" ? "auto" : "ltr"}
          onBlur={(e) => {
            if (e.target.value !== current) {
              onSave({ flagPath: field.path, value: e.target.value, type: field.type });
            }
          }}
        />
        {confidence === "amber" && (
          <Button type="button" variant="outline" size="sm" onClick={() => onConfirm(field.path)}>
            تأكيد
          </Button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Array-backed sections                                                      */
/* -------------------------------------------------------------------------- */

function Section({
  kind,
  data,
  flags,
  onSave,
  onJump,
}: {
  kind: SectionRenderer;
  data: TenderData;
  flags: Flags;
  onSave: (a: {
    flagPath: string;
    dataPath?: string;
    value: string;
    type?: FieldDef["type"];
    isInput?: boolean;
  }) => void;
  onJump: (page: number | null) => void;
}) {
  switch (kind) {
    case "scoring":
      return <ScoringTable rows={(data.scoring as ScoringRow[]) ?? []} />;
    case "events":
      return <EventsTable rows={(data.events as EventRow[]) ?? []} />;
    case "sites":
      return <SitesList rows={(data.sites as SiteRow[]) ?? []} />;
    case "gates":
      return <GatesTable rows={(data.gates as GateRow[]) ?? []} />;
    case "permits":
      return <SimpleList title="التصاريح" items={(data.permits as string[]) ?? []} />;
    case "penalties":
      return <PenaltiesTable rows={(data.penalties as PenaltyRow[]) ?? []} />;
    case "compliance":
      return <SimpleList title="متطلبات الامتثال" items={(data.compliance as string[]) ?? []} />;
    case "inputs":
      return <InputsList data={data} flags={flags} onSave={onSave} />;
    default:
      return null;
  }
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border">
      <div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">{title}</div>
      <div className="p-3">{children}</div>
    </div>
  );
}

interface ScoringRow {
  criterion_ar?: string;
  criterion_en?: string;
  weight?: number;
  sub?: Array<{ ar?: string; weight?: number }>;
}
function ScoringTable({ rows }: { rows: ScoringRow[] }) {
  return (
    <SectionCard title="معايير التقييم">
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="rounded-md border p-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{r.criterion_ar}</span>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary tabular-nums">
                {r.weight}%
              </span>
            </div>
            {r.criterion_en && (
              <span className="text-xs text-muted-foreground" dir="ltr">
                {r.criterion_en}
              </span>
            )}
            {r.sub && r.sub.length > 0 && (
              <ul className="mt-2 space-y-1 border-t pt-2 text-sm text-muted-foreground">
                {r.sub.map((s, j) => (
                  <li key={j} className="flex justify-between gap-2">
                    <span>{s.ar}</span>
                    <span className="tabular-nums">{s.weight}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

interface EventRow {
  id?: string;
  scale?: string;
  list?: string;
  name_ar?: string;
  name_en?: string;
  center?: string;
  year?: number;
  days?: number;
  attendance?: { min?: number; max?: number };
}
function EventsTable({ rows }: { rows: EventRow[] }) {
  return (
    <SectionCard title={`الفعاليات (${rows.length})`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-right text-xs text-muted-foreground">
            <tr className="border-b">
              <th className="p-2 font-medium">#</th>
              <th className="p-2 font-medium">الفعالية</th>
              <th className="p-2 font-medium">المركز</th>
              <th className="p-2 font-medium">الحجم</th>
              <th className="p-2 font-medium">السنة</th>
              <th className="p-2 font-medium">الحضور</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e, i) => (
              <tr key={e.id ?? i} className="border-b last:border-0">
                <td className="p-2 tabular-nums text-muted-foreground" dir="ltr">
                  {e.id}
                </td>
                <td className="p-2">
                  <span className="block font-medium">{e.name_ar}</span>
                  <span className="text-xs text-muted-foreground" dir="ltr">
                    {e.name_en}
                  </span>
                </td>
                <td className="p-2">{e.center}</td>
                <td className="p-2">{e.scale}</td>
                <td className="p-2 tabular-nums" dir="ltr">
                  {e.year}
                </td>
                <td className="p-2 tabular-nums" dir="ltr">
                  {e.attendance?.min}–{e.attendance?.max}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

interface SiteRow {
  center?: string;
  areas?: string[];
}
function SitesList({ rows }: { rows: SiteRow[] }) {
  return (
    <SectionCard title="المواقع">
      <div className="space-y-2">
        {rows.map((s, i) => (
          <div key={i} className="rounded-md border p-2">
            <span className="font-medium">{s.center}</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {(s.areas ?? []).map((a, j) => (
                <span key={j} className="rounded bg-muted px-2 py-0.5 text-xs">
                  {a}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

interface GateRow {
  id?: string;
  ar?: string;
  owner?: string;
  offset_days?: number;
  offset_hours?: number;
  timing?: string;
  from?: string;
  unit?: string;
}
function GatesTable({ rows }: { rows: GateRow[] }) {
  function timing(g: GateRow): string {
    if (g.timing) return g.timing;
    if (g.offset_days != null) return `${g.offset_days} يوم${g.from ? ` من ${g.from}` : ""}`;
    if (g.offset_hours != null) return `${g.offset_hours} ساعة${g.from ? ` من ${g.from}` : ""}`;
    return "—";
  }
  return (
    <SectionCard title="البوابات الزمنية">
      <div className="space-y-2">
        {rows.map((g, i) => (
          <div key={g.id ?? i} className="flex items-start justify-between gap-3 rounded-md border p-2">
            <div>
              <span className="text-xs text-muted-foreground" dir="ltr">
                {g.id}
              </span>
              <p className="text-sm">{g.ar}</p>
            </div>
            <div className="shrink-0 text-left">
              <span className="block text-xs tabular-nums text-primary">{timing(g)}</span>
              <span className="block text-xs text-muted-foreground">{g.owner}</span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

interface PenaltyRow {
  ar?: string;
  amount_pct_of_work_order?: number;
  amount_aed?: number;
  unit?: string;
  cap_pct?: number;
  basis?: string;
  plus?: string;
  consequence?: string;
}
function PenaltiesTable({ rows }: { rows: PenaltyRow[] }) {
  function amount(p: PenaltyRow): string {
    if (p.amount_aed != null) return `${p.amount_aed} درهم / ${p.unit ?? ""}`.trim();
    if (p.amount_pct_of_work_order != null) return `${p.amount_pct_of_work_order}% من أمر العمل`;
    if (p.cap_pct != null) return `حتى ${p.cap_pct}%`;
    if (p.consequence) return p.consequence;
    return "—";
  }
  return (
    <SectionCard title="الغرامات">
      <div className="space-y-2">
        {rows.map((p, i) => (
          <div key={i} className="flex items-start justify-between gap-3 rounded-md border p-2">
            <p className="text-sm">{p.ar}</p>
            <span className="shrink-0 text-left text-xs font-medium text-destructive">
              {amount(p)}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function SimpleList({ title, items }: { title: string; items: string[] }) {
  return (
    <SectionCard title={`${title} (${items.length})`}>
      <ul className="list-inside list-disc space-y-1 text-sm">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </SectionCard>
  );
}

/* Required inputs — the genuine red items a human must supply. Editable. */
function InputsList({
  data,
  flags,
  onSave,
}: {
  data: TenderData;
  flags: Flags;
  onSave: (a: {
    flagPath: string;
    dataPath?: string;
    value: string;
    isInput?: boolean;
  }) => void;
}) {
  const items = (data.inputs_required_from_azure as string[]) ?? [];
  const provided = (data.inputs_provided as Record<string, string>) ?? {};
  return (
    <SectionCard title={`مطلوب من الشركة (${items.length})`}>
      <div className="space-y-2">
        {items.map((label, i) => {
          const flagPath = `inputs_required_from_azure[${i}]`;
          const confidence = flags[flagPath]?.confidence ?? "red";
          const current = provided[i] ?? "";
          return (
            <div
              key={i}
              className={cn(
                "rounded-md border p-2",
                confidence === "red" ? "border-confidence-red/40" : "border-confidence-green/40",
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm">{label}</span>
                <ConfidenceBadge confidence={confidence} />
              </div>
              <Input
                defaultValue={current}
                placeholder="أدخل القيمة أو المرجع…"
                onBlur={(e) => {
                  if (e.target.value !== current) {
                    onSave({
                      flagPath,
                      dataPath: `inputs_provided.${i}`,
                      value: e.target.value,
                      isInput: true,
                    });
                  }
                }}
              />
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
