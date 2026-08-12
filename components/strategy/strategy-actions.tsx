"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveStrategy,
  generateStrategy,
} from "@/app/(app)/projects/[id]/strategy/actions";
import { Button } from "@/components/ui/button";

export function StrategyActions({
  projectId,
  approved,
}: {
  projectId: string;
  approved: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (approved) {
    return (
      <span className="rounded-full bg-[hsl(var(--confidence-green))]/15 px-3 py-1 text-xs font-medium text-[hsl(var(--confidence-green))]">
        الاستراتيجية معتمدة
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await generateStrategy(projectId);
            router.refresh();
          })
        }
      >
        إعادة التوليد
      </Button>
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await approveStrategy(projectId);
            router.refresh();
          })
        }
      >
        اعتماد الاستراتيجية
      </Button>
    </div>
  );
}
