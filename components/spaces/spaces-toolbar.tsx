"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveSpacePlan,
  approveVisuals,
  generateSpacePlan,
} from "@/app/(app)/projects/[id]/spaces/actions";
import { Button } from "@/components/ui/button";

export function SpacesToolbar({
  projectId,
  spacePlanApproved,
  hasRenders,
}: {
  projectId: string;
  spacePlanApproved: boolean;
  hasRenders: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
      <span className="text-sm text-muted-foreground">
        {spacePlanApproved
          ? "ولّد تصورًا لكل مساحة، ثم اعتمد التصورات."
          : "راجع المساحات واعتمد الخطة، ثم ابدأ التصور."}
      </span>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => generateSpacePlan(projectId))}
        >
          إعادة تحديد المساحات
        </Button>
        {!spacePlanApproved ? (
          <Button
            size="sm"
            disabled={pending}
            onClick={() => run(() => approveSpacePlan(projectId))}
          >
            اعتماد خطة المساحات
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={pending || !hasRenders}
            onClick={() => run(() => approveVisuals(projectId))}
          >
            اعتماد التصورات
          </Button>
        )}
      </div>
    </div>
  );
}
