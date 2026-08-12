"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Shown while an extraction job is queued/running. The browser never generates —
 * it just polls the job's status by refreshing server data every few seconds.
 */
export function ExtractionStatus({
  running,
  error,
}: {
  running: boolean;
  error: string | null;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(t);
  }, [running, router]);

  if (error) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="space-y-2 p-6">
          <p className="font-medium text-[hsl(var(--confidence-red))]">
            تعذّر الاستخراج
          </p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground">
            راجع الملفات المرفوعة وأعد المحاولة، أو حوّل الملف إلى PDF.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="space-y-2 p-6 text-center">
        <p className="font-medium">جارٍ تحليل البريف…</p>
        <p className="text-sm text-muted-foreground">
          يقرأ الذكاء المستند ويبني تقرير ذكاء البريف مع درجات الثقة ومصادر
          الصفحات. يستغرق هذا دقائق. تُحدَّث الصفحة تلقائيًا.
        </p>
      </CardContent>
    </Card>
  );
}
