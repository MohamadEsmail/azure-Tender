import Link from "next/link";
import { notFound } from "next/navigation";
import { getVisualDnaState } from "@/lib/data/visual-dna";
import { GenerateVisualDna } from "@/components/visual-dna/generate-visual-dna";
import { DnaActions } from "@/components/visual-dna/dna-actions";
import { VisualDnaView } from "@/components/visual-dna/visual-dna-view";
import { Card, CardContent } from "@/components/ui/card";

export default async function VisualDnaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const state = await getVisualDnaState(id);
  if (!state) notFound();

  const running =
    state.job?.status === "queued" || state.job?.status === "running";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">الهوية البصرية</h1>
          <p className="text-sm text-muted-foreground">
            نظام التصميم الموحّد الذي تلتزم به كل مساحات الفعالية.
          </p>
        </div>
        <Link
          href={`/projects/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← نظرة عامة
        </Link>
      </div>

      {!state.moodboardApproved ? (
        <Card className="mx-auto max-w-xl">
          <CardContent className="space-y-3 p-6 text-center text-sm text-muted-foreground">
            <p>لبناء الهوية البصرية، يجب اعتماد الموودبورد أولًا.</p>
            <Link
              href={`/projects/${id}/moodboard`}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              الذهاب إلى الموودبورد
            </Link>
          </CardContent>
        </Card>
      ) : state.dna ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
            <span className="text-sm text-muted-foreground">
              اعتمد وأقفل الهوية البصرية — بعدها كل تصور للمساحات يرجع لها.
            </span>
            <DnaActions projectId={id} locked={state.status === "approved"} />
          </div>
          <VisualDnaView dna={state.dna} referenceUrls={state.referenceUrls} />
        </div>
      ) : (
        <GenerateVisualDna
          projectId={id}
          running={running}
          error={state.job?.status === "failed" ? state.job.error : null}
        />
      )}
    </div>
  );
}
