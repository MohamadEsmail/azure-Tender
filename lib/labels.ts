import type { ProjectStatus, ProjectType } from "@/lib/db/database.types";

/** Arabic labels for the product UI. Users are Arabic-speaking designers/PMs. */

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "مسودة",
  extracting: "جارٍ الاستخراج",
  awaiting_data: "بانتظار بيانات",
  brief_approved: "البريف معتمد",
  in_strategy: "قيد الاستراتيجية",
  in_outline: "قيد المخطط",
  in_moodboard: "قيد الموودبورد",
  in_visual_dna: "قيد الهوية البصرية",
  in_spatial: "قيد التصميم المكاني",
  in_visualization: "قيد التصوّر ثلاثي الأبعاد",
  in_review: "قيد المراجعة",
  in_revision: "قيد التعديل",
  approved: "معتمد",
  presentation_ready: "العرض جاهز",
  delivered: "تم التسليم",
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  tender: "مناقصة",
  pitch: "عرض تقديمي",
  hybrid: "مختلط",
};

/** Brief Intelligence section labels (Arabic). Client-safe (no server-only). */
export const BRIEF_SECTION_LABELS: Record<string, string> = {
  event_information: "معلومات الفعالية",
  objectives: "الأهداف",
  audience: "الجمهور المستهدف",
  venue: "الموقع",
  experience_requirements: "متطلبات التجربة",
  spatial_requirements: "المتطلبات المكانية",
  content_requirements: "متطلبات المحتوى",
  branding_requirements: "متطلبات الهوية",
  technical_requirements: "المتطلبات التقنية",
  production_requirements: "متطلبات الإنتاج",
  deliverables: "المخرجات المطلوبة",
  constraints: "القيود",
};

export const CONFIDENCE_LABELS: Record<string, string> = {
  green: "مؤكد",
  amber: "بحاجة تأكيد",
  red: "ناقص",
};

/** Colour class for a status pill, keyed loosely by phase. */
export function statusTone(status: ProjectStatus): string {
  if (status === "delivered" || status === "approved")
    return "bg-[hsl(var(--confidence-green))]/12 text-[hsl(var(--confidence-green))]";
  if (status === "awaiting_data")
    return "bg-[hsl(var(--confidence-amber))]/12 text-[hsl(var(--confidence-amber))]";
  return "bg-muted text-muted-foreground";
}
