import { cn } from "@/lib/utils";
import type { TenderStatus } from "@/lib/types";

const LABELS: Record<TenderStatus, string> = {
  draft: "مسودة",
  extracting: "جاري الاستخراج",
  awaiting_data: "بانتظار البيانات",
  ready: "جاهزة",
  generating: "جاري التوليد",
  in_review: "قيد المراجعة",
  approved: "معتمدة",
  submitted: "مُقدَّمة",
};

const STYLES: Record<TenderStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  extracting: "bg-blue-100 text-blue-700",
  awaiting_data: "bg-confidence-amber/15 text-confidence-amber",
  ready: "bg-confidence-green/15 text-confidence-green",
  generating: "bg-blue-100 text-blue-700",
  in_review: "bg-purple-100 text-purple-700",
  approved: "bg-confidence-green/15 text-confidence-green",
  submitted: "bg-primary/10 text-primary",
};

export function StatusBadge({ status }: { status: TenderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STYLES[status],
      )}
    >
      {LABELS[status]}
    </span>
  );
}
