"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateMoodboard } from "@/app/(app)/projects/[id]/moodboard/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function GenerateMoodboard({
  projectId,
  running,
  error,
  regenerate = false,
}: {
  projectId: string;
  running: boolean;
  error: string | null;
  regenerate?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(t);
  }, [running, router]);

  if (running) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="space-y-2 p-6 text-center">
          <p className="font-medium">جارٍ توليد الموودبورد…</p>
          <p className="text-sm text-muted-foreground">
            يولّد المحرّك صورًا مرجعية للغة البصرية عبر عدّة محاور. قد يستغرق
            دقائق. تُحدَّث الصفحة تلقائيًا.
          </p>
        </CardContent>
      </Card>
    );
  }

  const trigger = (
    <Button
      disabled={pending}
      variant={regenerate ? "outline" : "primary"}
      size={regenerate ? "sm" : "md"}
      onClick={() =>
        startTransition(async () => {
          await generateMoodboard(projectId);
          router.refresh();
        })
      }
    >
      {pending ? "…" : regenerate ? "إعادة التوليد" : "توليد الموودبورد"}
    </Button>
  );

  if (regenerate) return trigger;

  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="space-y-4 p-6 text-center">
        <div className="space-y-1">
          <p className="font-medium">توليد الموودبورد البصري</p>
          <p className="text-sm text-muted-foreground">
            سيولّد المحرّك صورًا مرجعية من اللغة البصرية للاستراتيجية المعتمدة —
            العمارة، الخامات، الإضاءة، الألوان، الأجواء، والتقنية.
          </p>
        </div>
        {error ? (
          <p className="text-sm text-[hsl(var(--confidence-red))]">{error}</p>
        ) : null}
        {trigger}
      </CardContent>
    </Card>
  );
}
