import Link from "next/link";
import { notFound } from "next/navigation";
import { getBriefState } from "@/lib/data/brief";
import { UploadBrief } from "@/components/brief/upload-brief";
import { ExtractionStatus } from "@/components/brief/extraction-status";
import { ExtractionReview } from "@/components/brief/extraction-review";

export default async function BriefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const state = await getBriefState(id);
  if (!state) notFound();

  const jobRunning =
    state.job?.status === "queued" || state.job?.status === "running";
  const jobFailed = state.job?.status === "failed";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">البريف والاستخراج</h1>
        <Link
          href={`/projects/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← نظرة عامة
        </Link>
      </div>

      {state.extraction ? (
        <ExtractionReview
          projectId={id}
          files={state.files}
          extraction={state.extraction}
          status={state.status}
        />
      ) : jobRunning ? (
        <ExtractionStatus running error={null} />
      ) : jobFailed ? (
        <div className="space-y-4">
          <ExtractionStatus running={false} error={state.job?.error ?? null} />
          <UploadBrief projectId={id} />
        </div>
      ) : (
        <UploadBrief projectId={id} />
      )}
    </div>
  );
}
