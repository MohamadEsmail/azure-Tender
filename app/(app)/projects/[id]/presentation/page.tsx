import Link from "next/link";
import { notFound } from "next/navigation";
import { getPresentationState } from "@/lib/data/presentation";
import {
  GeneratePresentation,
  PresentationToolbar,
} from "@/components/presentation/presentation-controls";
import { PresentationDeck } from "@/components/presentation/presentation-deck";
import { Card, CardContent } from "@/components/ui/card";

export default async function PresentationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const state = await getPresentationState(id);
  if (!state) notFound();

  const running =
    state.job?.status === "queued" || state.job?.status === "running";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-bold">العرض التقديمي</h1>
          <p className="text-sm text-muted-foreground">
            العرض المقترح النهائي — مجمّعًا من كل ما تم اعتماده.
          </p>
        </div>
        <Link
          href={`/projects/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← نظرة عامة
        </Link>
      </div>

      {!state.visualsApproved ? (
        <Card className="mx-auto max-w-xl">
          <CardContent className="space-y-3 p-6 text-center text-sm text-muted-foreground">
            <p>لتوليد العرض، يجب اعتماد التصورات أولًا (بوابة G6B).</p>
            <Link
              href={`/projects/${id}/spaces`}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              الذهاب إلى المساحات
            </Link>
          </CardContent>
        </Card>
      ) : state.slides.length > 0 ? (
        <div className="space-y-4">
          <PresentationToolbar projectId={id} approved={state.approved} />
          <PresentationDeck slides={state.slides} />
        </div>
      ) : (
        <GeneratePresentation
          projectId={id}
          running={running}
          error={state.job?.status === "failed" ? state.job.error : null}
        />
      )}
    </div>
  );
}
