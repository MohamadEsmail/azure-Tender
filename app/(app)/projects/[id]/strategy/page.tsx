import Link from "next/link";
import { notFound } from "next/navigation";
import { getStrategyState } from "@/lib/data/strategy";
import { GenerateStrategy } from "@/components/strategy/generate-strategy";
import { StrategyActions } from "@/components/strategy/strategy-actions";
import { StrategyView } from "@/components/strategy/strategy-view";
import { Card, CardContent } from "@/components/ui/card";

export default async function StrategyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const state = await getStrategyState(id);
  if (!state) notFound();

  const running =
    state.job?.status === "queued" || state.job?.status === "running";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">الاستراتيجية الإبداعية</h1>
          <p className="text-sm text-muted-foreground">
            الفكرة الكبرى والمفهوم والسرد ورحلة الضيف واللغة البصرية.
          </p>
        </div>
        <Link
          href={`/projects/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← نظرة عامة
        </Link>
      </div>

      {!state.briefApproved ? (
        <Card className="mx-auto max-w-xl">
          <CardContent className="space-y-3 p-6 text-center text-sm text-muted-foreground">
            <p>
              لتطوير الاستراتيجية، يجب اعتماد فهم البريف أولًا (البوابة الأولى).
            </p>
            <Link
              href={`/projects/${id}/brief`}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              الذهاب إلى البريف
            </Link>
          </CardContent>
        </Card>
      ) : state.strategy ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <span className="text-sm text-muted-foreground">
              راجع الاستراتيجية واعتمدها للانتقال إلى الموودبورد.
            </span>
            <StrategyActions
              projectId={id}
              approved={state.strategyStatus === "approved"}
            />
          </div>
          <StrategyView strategy={state.strategy} />
        </div>
      ) : (
        <GenerateStrategy
          projectId={id}
          running={running}
          error={state.job?.status === "failed" ? state.job.error : null}
        />
      )}
    </div>
  );
}
