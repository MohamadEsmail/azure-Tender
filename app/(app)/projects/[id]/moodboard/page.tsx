import Link from "next/link";
import { notFound } from "next/navigation";
import { getMoodboardState } from "@/lib/data/moodboard";
import { GenerateMoodboard } from "@/components/moodboard/generate-moodboard";
import { MoodboardGallery } from "@/components/moodboard/moodboard-gallery";
import { Card, CardContent } from "@/components/ui/card";

export default async function MoodboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const state = await getMoodboardState(id);
  if (!state) notFound();

  const running =
    state.job?.status === "queued" || state.job?.status === "running";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">الموودبورد</h1>
          <p className="text-sm text-muted-foreground">
            صور مرجعية تُرسّخ الحمض البصري للفعالية قبل تصميم المساحات.
          </p>
        </div>
        <Link
          href={`/projects/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← نظرة عامة
        </Link>
      </div>

      {!state.strategyApproved ? (
        <Card className="mx-auto max-w-xl">
          <CardContent className="space-y-3 p-6 text-center text-sm text-muted-foreground">
            <p>لتوليد الموودبورد، يجب اعتماد الاستراتيجية الإبداعية أولًا.</p>
            <Link
              href={`/projects/${id}/strategy`}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              الذهاب إلى الاستراتيجية
            </Link>
          </CardContent>
        </Card>
      ) : state.items.length > 0 ? (
        <MoodboardGallery
          projectId={id}
          items={state.items}
          approved={state.moodboardStatus === "approved"}
        />
      ) : (
        <GenerateMoodboard
          projectId={id}
          running={running}
          error={state.job?.status === "failed" ? state.job.error : null}
        />
      )}
    </div>
  );
}
