"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateSpacePlan } from "@/app/(app)/projects/[id]/spaces/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function GenerateSpaces({
  projectId,
  running,
  error,
}: {
  projectId: string;
  running: boolean;
  error: string | null;
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
          <p className="font-medium">جارٍ تحديد مساحات الفعالية…</p>
          <p className="text-sm text-muted-foreground">
            يقرأ مهندس الفعالية البريف والاستراتيجية ويحدّد الزون المطلوب تصميمها.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="space-y-4 p-6 text-center">
        <div className="space-y-1">
          <p className="font-medium">تحديد المساحات المطلوب تصميمها</p>
          <p className="text-sm text-muted-foreground">
            سيحدّد الذكاء المساحات المناسبة لهذه الفعالية فقط (المسرح، التسجيل،
            الاستقبال، المعرض، مناطق التفعيل…) مع تبرير كل مساحة.
          </p>
        </div>
        {error ? (
          <p className="text-sm text-[hsl(var(--confidence-red))]">{error}</p>
        ) : null}
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await generateSpacePlan(projectId);
              router.refresh();
            })
          }
        >
          {pending ? "…" : "تحديد المساحات"}
        </Button>
      </CardContent>
    </Card>
  );
}

/** Refreshes server data while any render job is in flight. */
export function RenderPoller({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(t);
  }, [active, router]);
  return null;
}
