import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/data/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
  statusTone,
} from "@/lib/labels";

const TRACK_LABELS: Record<string, string> = {
  proposal: "العرض / الامتثال",
  creative: "الإبداعي",
};

// The project workspace tabs, per ARCHITECTURE.md §17. A tab links out once its
// module lands; the rest are inert until built.
const TABS: { label: string; href?: (id: string) => string }[] = [
  { label: "نظرة عامة", href: (id) => `/projects/${id}` },
  { label: "البريف", href: (id) => `/projects/${id}/brief` },
  { label: "الاستراتيجية", href: (id) => `/projects/${id}/strategy` },
  { label: "الموودبورد", href: (id) => `/projects/${id}/moodboard` },
  { label: "الهوية البصرية", href: (id) => `/projects/${id}/visual-dna` },
  { label: "المساحات" },
  { label: "التصورات ثلاثية الأبعاد" },
  { label: "التعديلات" },
  { label: "العرض التقديمي" },
];

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-sm text-muted-foreground">
            {project.client ?? "—"} · {PROJECT_TYPE_LABELS[project.project_type]}
            {project.contract_no ? ` · ${project.contract_no}` : ""}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusTone(
            project.status,
          )}`}
        >
          {PROJECT_STATUS_LABELS[project.status]}
        </span>
      </div>

      {/* Tab strip — navigation wires up as each module ships. */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2 text-sm">
        {TABS.map((tab, i) =>
          tab.href ? (
            <Link
              key={tab.label}
              href={tab.href(project.id)}
              className={
                i === 0
                  ? "rounded-md bg-muted px-3 py-1 font-medium"
                  : "px-3 py-1 text-muted-foreground hover:text-foreground"
              }
            >
              {tab.label}
            </Link>
          ) : (
            <span key={tab.label} className="px-3 py-1 text-muted-foreground/50">
              {tab.label}
            </span>
          ),
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>الخطوة التالية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              ارفع بريف العميل (PDF / صور / نص) ليبدأ الاستخراج وبناء تقرير ذكاء
              البريف مع درجات الثقة ومصادر الصفحات.
            </p>
            <Link
              href={`/projects/${project.id}/brief`}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              رفع البريف والاستخراج
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>التفاصيل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">المهلة</span>
              <span dir="ltr">{project.deadline ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">المسارات</span>
              <span>
                {project.tracks
                  .map((t) => TRACK_LABELS[t] ?? t)
                  .join("، ")}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">الفريق</span>
              <ul className="mt-1 space-y-1">
                {project.members.map((m, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{m.full_name ?? m.email}</span>
                    <span className="text-xs text-muted-foreground">
                      {m.role}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
