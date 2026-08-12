import Link from "next/link";
import { listProjects } from "@/lib/data/projects";
import { Card } from "@/components/ui/card";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
  statusTone,
} from "@/lib/labels";

export default async function DashboardPage() {
  const projects = await listProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المشاريع</h1>
          <p className="text-sm text-muted-foreground">
            كل مشروع يبدأ من بريف ويمرّ عبر مراحل الاعتماد حتى العرض النهائي.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          مشروع جديد
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          لا توجد مشاريع بعد. ابدأ بإنشاء مشروع جديد ورفع البريف.
        </Card>
      ) : (
        <div className="grid gap-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="flex items-center justify-between p-4 transition-colors hover:bg-muted/40">
                <div className="space-y-1">
                  <div className="font-medium">{p.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {p.client ?? "—"} · {PROJECT_TYPE_LABELS[p.project_type]}
                    {p.deadline ? ` · مهلة ${p.deadline}` : ""}
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone(
                    p.status,
                  )}`}
                >
                  {PROJECT_STATUS_LABELS[p.status]}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
