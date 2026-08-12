"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  lockVisualDna,
  generateVisualDna,
} from "@/app/(app)/projects/[id]/visual-dna/actions";
import { Button } from "@/components/ui/button";

export function DnaActions({
  projectId,
  locked,
}: {
  projectId: string;
  locked: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (locked) {
    return (
      <span className="rounded-full bg-[hsl(var(--confidence-green))]/15 px-3 py-1 text-xs font-medium text-[hsl(var(--confidence-green))]">
        🔒 الهوية البصرية مقفلة
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
            await generateVisualDna(projectId);
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
            await lockVisualDna(projectId);
            router.refresh();
          })
        }
      >
        اعتماد وقفل الهوية
      </Button>
    </div>
  );
}
