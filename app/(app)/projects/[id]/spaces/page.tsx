import Link from "next/link";
import { notFound } from "next/navigation";
import { getSpacesState } from "@/lib/data/spaces";
import {
  GenerateSpaces,
  RenderPoller,
} from "@/components/spaces/generate-spaces";
import { SpaceCard } from "@/components/spaces/space-card";
import { SpacesToolbar } from "@/components/spaces/spaces-toolbar";
import { Card, CardContent } from "@/components/ui/card";

export default async function SpacesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const state = await getSpacesState(id);
  if (!state) notFound();

  const planRunning =
    state.spacePlanJob?.status === "queued" ||
    state.spacePlanJob?.status === "running";
  const hasRenders = state.spaces.some((s) => s.renders.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">المساحات والتصور ثلاثي الأبعاد</h1>
          <p className="text-sm text-muted-foreground">
            تصميم كل زون بصورة مبذورة من الهوية البصرية المُقفلة لضمان الاتساق.
          </p>
        </div>
        <Link
          href={`/projects/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← نظرة عامة
        </Link>
      </div>

      {!state.visualDnaLocked ? (
        <Card className="mx-auto max-w-xl">
          <CardContent className="space-y-3 p-6 text-center text-sm text-muted-foreground">
            <p>لبدء تصميم المساحات، يجب اعتماد وقفل الهوية البصرية أولًا.</p>
            <Link
              href={`/projects/${id}/visual-dna`}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              الذهاب إلى الهوية البصرية
            </Link>
          </CardContent>
        </Card>
      ) : state.spaces.length === 0 ? (
        <GenerateSpaces
          projectId={id}
          running={planRunning}
          error={
            state.spacePlanJob?.status === "failed"
              ? state.spacePlanJob.error
              : null
          }
        />
      ) : (
        <div className="space-y-4">
          <RenderPoller active={state.rendersRunning} />
          <SpacesToolbar
            projectId={id}
            spacePlanApproved={state.spacePlanApproved}
            hasRenders={hasRenders}
          />
          {state.rendersRunning ? (
            <p className="text-center text-sm text-muted-foreground">
              جارٍ توليد تصور… تُحدَّث الصفحة تلقائيًا.
            </p>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            {state.spaces.map((space) => (
              <SpaceCard key={space.id} projectId={id} space={space} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
