"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateStrategy } from "@/app/(app)/projects/[id]/strategy/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function GenerateStrategy({
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
          <p className="font-medium">جارٍ تطوير الاستراتيجية الإبداعية…</p>
          <p className="text-sm text-muted-foreground">
            يقرأ الاستراتيجي البريف المعتمد ويبني الفكرة الكبرى والسرد ورحلة
            الضيف. تُحدَّث الصفحة تلقائيًا.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="space-y-4 p-6 text-center">
        <div className="space-y-1">
          <p className="font-medium">توليد الاستراتيجية الإبداعية</p>
          <p className="text-sm text-muted-foreground">
            سيقرأ الذكاء البريف المعتمد ويطوّر المفهوم والسرد ومبادئ التصميم
            واللغة البصرية — مع تبرير كل قرار وربطه بالبريف.
          </p>
        </div>
        {error ? (
          <p className="text-sm text-[hsl(var(--confidence-red))]">{error}</p>
        ) : null}
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await generateStrategy(projectId);
              router.refresh();
            })
          }
        >
          {pending ? "…" : "توليد الاستراتيجية"}
        </Button>
      </CardContent>
    </Card>
  );
}
