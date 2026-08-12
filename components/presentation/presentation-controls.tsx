"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  generatePresentation,
  approvePresentation,
} from "@/app/(app)/projects/[id]/presentation/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function GeneratePresentation({
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
          <p className="font-medium">جارٍ تجهيز العرض التقديمي…</p>
          <p className="text-sm text-muted-foreground">
            يجمّع العرض كل ما تم اعتماده في بنية عرض احترافية.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="space-y-4 p-6 text-center">
        <div className="space-y-1">
          <p className="font-medium">توليد العرض التقديمي</p>
          <p className="text-sm text-muted-foreground">
            سيجمّع الذكاء فهم البريف والاستراتيجية والهوية والمساحات والتصورات في
            عرض مقترح متكامل.
          </p>
        </div>
        {error ? (
          <p className="text-sm text-[hsl(var(--confidence-red))]">{error}</p>
        ) : null}
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await generatePresentation(projectId);
              router.refresh();
            })
          }
        >
          {pending ? "…" : "توليد العرض"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function PresentationToolbar({
  projectId,
  approved,
}: {
  projectId: string;
  approved: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4 print:hidden">
      <span className="text-sm text-muted-foreground">
        راجع العرض، صدّره PDF، واعتمده كنسخة نهائية.
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          تصدير PDF / طباعة
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await generatePresentation(projectId);
              router.refresh();
            })
          }
        >
          إعادة التوليد
        </Button>
        {approved ? (
          <span className="rounded-full bg-[hsl(var(--confidence-green))]/15 px-3 py-1 text-xs font-medium text-[hsl(var(--confidence-green))]">
            العرض معتمد
          </span>
        ) : (
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await approvePresentation(projectId);
                router.refresh();
              })
            }
          >
            اعتماد نهائي
          </Button>
        )}
      </div>
    </div>
  );
}
