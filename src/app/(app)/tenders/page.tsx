import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { cn, formatDate } from "@/lib/utils";
import type { Tender } from "@/lib/types";

export const dynamic = "force-dynamic";

function Completeness({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-confidence-green"
          style={{ inlineSize: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  );
}

export default async function TendersPage() {
  const supabase = createClient();

  const { data: tenders } = await supabase
    .from("tenders")
    .select("id, title, client, contract_no, deadline, status, owner_id, created_at")
    .order("created_at", { ascending: false });

  // Data-completeness = confirmed flags / total flags, aggregated per tender.
  const { data: flags } = await supabase
    .from("field_flags")
    .select("tender_id, status");

  const completeness = new Map<string, number>();
  const totals = new Map<string, { done: number; all: number }>();
  for (const f of flags ?? []) {
    const t = totals.get(f.tender_id) ?? { done: 0, all: 0 };
    t.all += 1;
    if (f.status === "confirmed") t.done += 1;
    totals.set(f.tender_id, t);
  }
  for (const [id, t] of totals) {
    completeness.set(id, t.all ? Math.round((t.done / t.all) * 100) : 0);
  }

  const rows = (tenders ?? []) as Tender[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">المناقصات</h1>
          <p className="text-sm text-muted-foreground">
            مصدر واحد لكل مناقصة — لا مزيد من الملفات المتناثرة.
          </p>
        </div>
        <Link href="/tenders/new" className={buttonVariants()}>
          مناقصة جديدة
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">لا توجد مناقصات بعد.</p>
          <Link href="/tenders/new" className={cn(buttonVariants(), "mt-4")}>
            أنشئ أول مناقصة
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-right">
              <tr>
                <th className="p-3 font-medium">العنوان</th>
                <th className="p-3 font-medium">الجهة</th>
                <th className="p-3 font-medium">الموعد النهائي</th>
                <th className="p-3 font-medium">الحالة</th>
                <th className="p-3 font-medium">اكتمال البيانات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    <Link
                      href={`/tenders/${t.id}/review`}
                      className="font-medium text-primary hover:underline"
                    >
                      {t.title}
                    </Link>
                    {t.contract_no && (
                      <span className="block text-xs text-muted-foreground" dir="ltr">
                        {t.contract_no}
                      </span>
                    )}
                  </td>
                  <td className="p-3">{t.client ?? "—"}</td>
                  <td className="p-3 tabular-nums" dir="ltr">
                    {formatDate(t.deadline)}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="p-3">
                    <Completeness pct={completeness.get(t.id) ?? null} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
