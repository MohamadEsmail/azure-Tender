"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateVisualDna } from "@/app/(app)/projects/[id]/visual-dna/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function GenerateVisualDna({
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
    const t = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(t);
  }, [running, router]);

  if (running) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="space-y-2 p-6 text-center">
          <p className="font-medium">جارٍ بناء الهوية البصرية…</p>
          <p className="text-sm text-muted-foreground">
            يقطّر المدير الفني الاستراتيجية والموودبورد إلى نظام تصميم موحّد.
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
          await generateVisualDna(projectId);
          router.refresh();
        })
      }
    >
      {pending ? "…" : regenerate ? "إعادة التوليد" : "توليد الهوية البصرية"}
    </Button>
  );

  if (regenerate) return trigger;

  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="space-y-4 p-6 text-center">
        <div className="space-y-1">
          <p className="font-medium">بناء الهوية البصرية (Visual DNA)</p>
          <p className="text-sm text-muted-foreground">
            نظام التصميم الموحّد الذي تلتزم به كل مساحات الفعالية — الهندسة،
            الخامات، الألوان، الإضاءة، والأنماط الممنوعة. هذا محرّك الاتساق.
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
