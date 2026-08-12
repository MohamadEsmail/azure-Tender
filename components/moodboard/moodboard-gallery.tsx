"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveMoodboard } from "@/app/(app)/projects/[id]/moodboard/actions";
import { GenerateMoodboard } from "@/components/moodboard/generate-moodboard";
import { Button } from "@/components/ui/button";
import type { MoodboardItemView } from "@/lib/data/moodboard";

export function MoodboardGallery({
  projectId,
  items,
  approved,
}: {
  projectId: string;
  items: MoodboardItemView[];
  approved: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
        <span className="text-sm text-muted-foreground">
          {items.length} صورة مرجعية · هذه اللغة البصرية تُغذّي الهوية البصرية.
        </span>
        <div className="flex items-center gap-2">
          {!approved ? (
            <GenerateMoodboard
              projectId={projectId}
              running={false}
              error={null}
              regenerate
            />
          ) : null}
          {approved ? (
            <span className="rounded-full bg-[hsl(var(--confidence-green))]/15 px-3 py-1 text-xs font-medium text-[hsl(var(--confidence-green))]">
              الموودبورد معتمد
            </span>
          ) : (
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await approveMoodboard(projectId);
                  router.refresh();
                })
              }
            >
              اعتماد الموودبورد
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <figure
            key={i}
            className="overflow-hidden rounded-lg border border-border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.category}
              className="aspect-video w-full object-cover"
            />
            <figcaption className="p-2 text-center text-xs text-muted-foreground">
              {item.category}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
