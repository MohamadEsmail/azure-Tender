import { cn } from "@/lib/utils";
import type { Confidence } from "@/lib/types";

const LABELS: Record<Confidence, string> = {
  green: "مؤكد",
  amber: "بحاجة لتأكيد",
  red: "مفقود",
};

const STYLES: Record<Confidence, string> = {
  green: "bg-confidence-green/15 text-confidence-green ring-confidence-green/30",
  amber: "bg-confidence-amber/15 text-confidence-amber ring-confidence-amber/30",
  red: "bg-confidence-red/15 text-confidence-red ring-confidence-red/30",
};

export function ConfidenceDot({ confidence }: { confidence: Confidence }) {
  return (
    <span
      className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", {
        "bg-confidence-green": confidence === "green",
        "bg-confidence-amber": confidence === "amber",
        "bg-confidence-red": confidence === "red",
      })}
      aria-hidden
    />
  );
}

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        STYLES[confidence],
      )}
    >
      <ConfidenceDot confidence={confidence} />
      {LABELS[confidence]}
    </span>
  );
}
