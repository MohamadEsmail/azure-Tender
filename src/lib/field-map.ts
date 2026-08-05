// The field map: a declarative description of how the extraction-review screen
// renders tender_data.data. Per CLAUDE.md the UI renders FROM this map rather
// than from fixed columns, so new tender shapes need map entries, not schema
// changes.

export type FieldType = "text" | "number" | "date" | "boolean";

export interface FieldDef {
  /** Path into tender_data.data — see lib/path.ts */
  path: string;
  label_ar: string;
  label_en: string;
  type: FieldType;
}

/** Array-backed sections get a bespoke renderer keyed by this tag. */
export type SectionRenderer =
  | "scoring"
  | "events"
  | "sites"
  | "gates"
  | "permits"
  | "penalties"
  | "compliance"
  | "inputs";

export interface TabDef {
  key: string;
  label_ar: string;
  label_en: string;
  /** Editable scalar fields shown as rows. */
  fields?: FieldDef[];
  /** Array sections rendered as tables/lists below the scalar fields. */
  sections?: SectionRenderer[];
}

export const TABS: TabDef[] = [
  {
    key: "meta",
    label_ar: "بيانات المناقصة",
    label_en: "Meta",
    fields: [
      { path: "meta.contract_no", label_ar: "رقم العقد", label_en: "Contract No.", type: "text" },
      { path: "meta.rfq_no", label_ar: "رقم طلب عرض السعر", label_en: "RFQ No.", type: "text" },
      { path: "meta.title_ar", label_ar: "عنوان المناقصة", label_en: "Title", type: "text" },
      { path: "meta.client_ar", label_ar: "الجهة (عربي)", label_en: "Client (AR)", type: "text" },
      { path: "meta.client_en", label_ar: "الجهة (إنجليزي)", label_en: "Client (EN)", type: "text" },
      { path: "meta.form_ref", label_ar: "مرجع النموذج", label_en: "Form Ref.", type: "text" },
      { path: "meta.governing_language", label_ar: "لغة العقد", label_en: "Governing Language", type: "text" },
      { path: "meta.contract_model", label_ar: "نموذج التعاقد", label_en: "Contract Model", type: "text" },
      { path: "meta.contract_end", label_ar: "نهاية العقد", label_en: "Contract End", type: "date" },
      { path: "meta.start_trigger", label_ar: "بداية العمل", label_en: "Start Trigger", type: "text" },
      { path: "meta.subcontract_cap_pct", label_ar: "حد المقاولة من الباطن %", label_en: "Subcontract Cap %", type: "number" },
    ],
  },
  {
    key: "scoring",
    label_ar: "معايير التقييم",
    label_en: "Scoring",
    fields: [
      { path: "technical_exclusion_below_pct", label_ar: "حد الاستبعاد الفني %", label_en: "Technical Exclusion Below %", type: "number" },
    ],
    sections: ["scoring"],
  },
  {
    key: "scope",
    label_ar: "النطاق والفعاليات",
    label_en: "Scope & Events",
    fields: [
      { path: "scope_summary.events_total", label_ar: "إجمالي الفعاليات", label_en: "Events Total", type: "number" },
      { path: "scope_summary.medium_events", label_ar: "فعاليات متوسطة", label_en: "Medium Events", type: "number" },
      { path: "scope_summary.small_events", label_ar: "فعاليات صغيرة", label_en: "Small Events", type: "number" },
      { path: "scope_summary.duration_days_each", label_ar: "مدة كل فعالية (أيام)", label_en: "Duration Days Each", type: "number" },
      { path: "scope_summary.national_initiative", label_ar: "المبادرة الوطنية", label_en: "National Initiative", type: "text" },
    ],
    sections: ["events", "sites"],
  },
  {
    key: "gates",
    label_ar: "البوابات الزمنية",
    label_en: "Gates",
    sections: ["gates"],
  },
  {
    key: "permits",
    label_ar: "التصاريح",
    label_en: "Permits",
    sections: ["permits"],
  },
  {
    key: "penalties",
    label_ar: "الغرامات",
    label_en: "Penalties",
    sections: ["penalties"],
  },
  {
    key: "compliance",
    label_ar: "الامتثال",
    label_en: "Compliance",
    sections: ["compliance", "inputs"],
  },
];

/** All scalar field paths across every tab — used to seed field flags. */
export function allFieldPaths(): string[] {
  return TABS.flatMap((t) => (t.fields ?? []).map((f) => f.path));
}
