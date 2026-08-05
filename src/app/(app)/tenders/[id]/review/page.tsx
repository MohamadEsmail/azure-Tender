import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ReviewClient } from "@/components/review/review-client";
import { StatusBadge } from "@/components/status-badge";
import { fixtureData, seedFlags, seedInputFlags } from "@/lib/fixture";
import type { Confidence, FlagStatus, Tender, TenderData } from "@/lib/types";

export const dynamic = "force-dynamic";

export interface FlagState {
  confidence: Confidence;
  source_page: number | null;
  status: FlagStatus;
}

export default async function ReviewPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: tender } = await supabase
    .from("tenders")
    .select("id, title, client, contract_no, deadline, status, owner_id, created_at")
    .eq("id", params.id)
    .single();
  if (!tender) notFound();

  const { data: dataRow } = await supabase
    .from("tender_data")
    .select("data")
    .eq("tender_id", params.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: flagRows } = await supabase
    .from("field_flags")
    .select("field_path, confidence, source_page, status")
    .eq("tender_id", params.id);

  // Signed, time-limited URL for the first uploaded document (private bucket).
  const { data: fileRow } = await supabase
    .from("tender_files")
    .select("path")
    .eq("tender_id", params.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let signedUrl: string | null = null;
  if (fileRow?.path) {
    const { data: signed } = await supabase.storage
      .from("tender-files")
      .createSignedUrl(fileRow.path, 60 * 60);
    signedUrl = signed?.signedUrl ?? null;
  }

  // Fall back to the fixture so the screen renders even before any seeding.
  const data = (dataRow?.data as TenderData | undefined) ?? fixtureData;
  const flags: Record<string, FlagState> = {};
  const source =
    flagRows && flagRows.length
      ? flagRows
      : [...seedFlags(), ...seedInputFlags()];
  for (const f of source) {
    flags[f.field_path] = {
      confidence: f.confidence as Confidence,
      source_page: f.source_page,
      status: f.status as FlagStatus,
    };
  }

  const t = tender as Tender;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/tenders" className="text-sm text-muted-foreground hover:underline">
            ← كل المناقصات
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-xl font-semibold">{t.title}</h1>
            <StatusBadge status={t.status} />
          </div>
          {t.client && <p className="text-sm text-muted-foreground">{t.client}</p>}
        </div>
      </div>

      <ReviewClient
        tenderId={t.id}
        initialData={data}
        initialFlags={flags}
        signedUrl={signedUrl}
      />
    </div>
  );
}
