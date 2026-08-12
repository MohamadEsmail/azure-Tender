"use client";

import { useActionState } from "react";
import { uploadBriefFiles, type UploadState } from "@/app/(app)/projects/[id]/brief/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initial: UploadState = {};

export function UploadBrief({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState(uploadBriefFiles, initial);

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>رفع البريف</CardTitle>
        <p className="text-sm text-muted-foreground">
          ارفع مستند البريف أو المناقصة. المدعوم حاليًا: PDF، صور، ونص. لملفات
          Word/PowerPoint حوّلها إلى PDF أولًا.
        </p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="project_id" value={projectId} />
          <input
            type="file"
            name="files"
            multiple
            accept=".pdf,image/*,.txt,.md,text/plain"
            required
            className="block w-full text-sm file:me-3 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
          />
          {state.error ? (
            <p className="text-sm text-[hsl(var(--confidence-red))]">{state.error}</p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "جارٍ الرفع…" : "رفع وبدء الاستخراج"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
