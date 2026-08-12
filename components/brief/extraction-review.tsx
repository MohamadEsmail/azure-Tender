"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BriefExtraction, BriefField } from "@/lib/agents/brief-analyst";
import {
  updateField,
  approveBriefUnderstanding,
} from "@/app/(app)/projects/[id]/brief/actions";
import { BRIEF_SECTION_LABELS, CONFIDENCE_LABELS } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import type { BriefFileView } from "@/lib/data/brief";

const SECTION_ORDER = Object.keys(BRIEF_SECTION_LABELS);

const PILL: Record<string, string> = {
  green: "bg-[hsl(var(--confidence-green))]/15 text-[hsl(var(--confidence-green))]",
  amber: "bg-[hsl(var(--confidence-amber))]/15 text-[hsl(var(--confidence-amber))]",
  red: "bg-[hsl(var(--confidence-red))]/15 text-[hsl(var(--confidence-red))]",
};

function ConfidencePill({ level }: { level: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PILL[level] ?? ""}`}>
      {CONFIDENCE_LABELS[level] ?? level}
    </span>
  );
}

export function ExtractionReview({
  projectId,
  files,
  extraction,
  status,
}: {
  projectId: string;
  files: BriefFileView[];
  extraction: BriefExtraction;
  status: string;
}) {
  const primary = useMemo(
    () =>
      files.find((f) => f.mime === "application/pdf") ??
      files.find((f) => f.mime?.startsWith("image/")) ??
      files[0] ??
      null,
    [files],
  );

  const [page, setPage] = useState<number | null>(null);
  const redCount = extraction.fields.filter((f) => f.confidence === "red").length;

  const grouped = useMemo(() => {
    const map: Record<string, BriefField[]> = {};
    for (const f of extraction.fields) {
      (map[f.section] ??= []).push(f);
    }
    return map;
  }, [extraction.fields]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Left: the source document. */}
      <div className="lg:sticky lg:top-4 lg:h-[calc(100dvh-8rem)]">
        <DocumentViewer file={primary} page={page} />
      </div>

      {/* Right: the extracted report. */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
          <div className="text-sm">
            <div className="font-medium">تقرير ذكاء البريف</div>
            <div className="text-muted-foreground">
              {extraction.fields.length} حقل · {redCount} ناقص يحتاج إدخال
            </div>
          </div>
          {status !== "brief_approved" ? (
            <ApproveButton projectId={projectId} redCount={redCount} />
          ) : (
            <span className="rounded-full bg-[hsl(var(--confidence-green))]/15 px-3 py-1 text-xs font-medium text-[hsl(var(--confidence-green))]">
              البريف معتمد
            </span>
          )}
        </div>

        {extraction.summary_ar ? (
          <p className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed">
            {extraction.summary_ar}
          </p>
        ) : null}

        {SECTION_ORDER.filter((s) => grouped[s]?.length).map((section) => (
          <section key={section} className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {BRIEF_SECTION_LABELS[section]}
            </h3>
            <div className="space-y-2">
              {grouped[section].map((field) => (
                <FieldRow
                  key={field.field_path}
                  projectId={projectId}
                  field={field}
                  onJump={() => field.source_page && setPage(field.source_page)}
                />
              ))}
            </div>
          </section>
        ))}

        <AnalysisPanels extraction={extraction} />
      </div>
    </div>
  );
}

function DocumentViewer({
  file,
  page,
}: {
  file: BriefFileView | null;
  page: number | null;
}) {
  if (!file) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-border text-sm text-muted-foreground">
        لا يوجد مستند للعرض
      </div>
    );
  }
  if (file.mime === "application/pdf") {
    return (
      <iframe
        key={page ?? 0}
        src={`${file.url}#page=${page ?? 1}`}
        className="h-full min-h-[70dvh] w-full rounded-lg border border-border"
        title={file.name}
      />
    );
  }
  if (file.mime?.startsWith("image/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={file.url}
        alt={file.name}
        className="max-h-full w-full rounded-lg border border-border object-contain"
      />
    );
  }
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-border p-4 text-sm">
      <a href={file.url} target="_blank" rel="noreferrer" className="underline">
        فتح {file.name}
      </a>
    </div>
  );
}

function FieldRow({
  projectId,
  field,
  onJump,
}: {
  projectId: string;
  field: BriefField;
  onJump: () => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState(field.value);
  const [pending, startTransition] = useTransition();

  function save() {
    const fd = new FormData();
    fd.set("project_id", projectId);
    fd.set("field_path", field.field_path);
    fd.set("value", value);
    startTransition(async () => {
      await updateField(fd);
      router.refresh();
    });
  }

  const dirty = value !== field.value;

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{field.label_ar}</span>
        <div className="flex items-center gap-2">
          {field.source_page ? (
            <button
              type="button"
              onClick={onJump}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              صفحة {field.source_page}
            </button>
          ) : null}
          <ConfidencePill level={field.confidence} />
        </div>
      </div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={field.confidence === "red" ? "أدخل القيمة الناقصة" : ""}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
        <Button
          type="button"
          size="sm"
          variant={dirty ? "primary" : "outline"}
          onClick={save}
          disabled={pending}
        >
          {pending ? "…" : field.confidence === "red" ? "حفظ" : "تأكيد"}
        </Button>
      </div>
      {field.note ? (
        <p className="mt-1 text-xs text-muted-foreground">{field.note}</p>
      ) : null}
    </div>
  );
}

function AnalysisPanels({ extraction }: { extraction: BriefExtraction }) {
  const { missing_information, contradictions, assumptions, recommendations } =
    extraction;
  return (
    <div className="space-y-4">
      {contradictions?.length ? (
        <Panel title="تناقضات" tone="amber">
          <ul className="list-disc space-y-1 ps-5 text-sm">
            {contradictions.map((c, i) => (
              <li key={i}>
                {c.a} ↔ {c.b}
                {c.note ? ` — ${c.note}` : ""}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {missing_information?.length ? (
        <Panel title="معلومات ناقصة" tone="red">
          <ul className="list-disc space-y-1 ps-5 text-sm">
            {missing_information.map((m, i) => (
              <li key={i}>
                <span className="font-medium">{m.label_ar}</span>
                {m.why_needed ? ` — ${m.why_needed}` : ""}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {assumptions?.length ? (
        <Panel title="افتراضات موثّقة" tone="muted">
          <ul className="list-disc space-y-1 ps-5 text-sm">
            {assumptions.map((a, i) => (
              <li key={i}>
                {a.statement}
                {a.basis ? ` — (${a.basis})` : ""}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {recommendations?.length ? (
        <Panel title="توصيات الذكاء" tone="muted">
          <ul className="list-disc space-y-1 ps-5 text-sm">
            {recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}

function Panel({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "amber" | "red" | "muted";
  children: React.ReactNode;
}) {
  const border =
    tone === "red"
      ? "border-[hsl(var(--confidence-red))]/40"
      : tone === "amber"
        ? "border-[hsl(var(--confidence-amber))]/40"
        : "border-border";
  return (
    <div className={`rounded-lg border ${border} p-4`}>
      <div className="mb-2 text-sm font-semibold">{title}</div>
      {children}
    </div>
  );
}

function ApproveButton({
  projectId,
  redCount,
}: {
  projectId: string;
  redCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await approveBriefUnderstanding(projectId);
          router.refresh();
        })
      }
      title={redCount > 0 ? `${redCount} حقل ناقص` : undefined}
    >
      {pending ? "…" : "اعتماد فهم البريف"}
    </Button>
  );
}
