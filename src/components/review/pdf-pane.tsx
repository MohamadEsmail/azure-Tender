"use client";

import { FileText } from "lucide-react";

/**
 * Left pane: the source document. Clicking a field on the right sets `page`, and
 * the Chromium PDF viewer jumps there via the #page anchor. In Phase 1 the
 * uploaded file may not match the fixture, but the traceability wiring is real.
 */
export function PdfPane({
  signedUrl,
  page,
}: {
  signedUrl: string | null;
  page: number | null;
}) {
  if (!signedUrl) {
    return (
      <div className="flex h-full min-h-[70vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-muted-foreground">
        <FileText className="h-10 w-10" />
        <p className="text-sm">لا يوجد مستند مصدر مرفوع لهذه المناقصة.</p>
        {page != null && (
          <p className="text-xs">الحقل المحدد مصدره صفحة {page}</p>
        )}
      </div>
    );
  }

  const src = page != null ? `${signedUrl}#page=${page}` : signedUrl;
  return (
    <div className="h-full min-h-[70vh] overflow-hidden rounded-lg border">
      {/* key forces a reload so the #page anchor re-applies on each jump. */}
      <iframe
        key={page ?? "start"}
        src={src}
        className="h-full min-h-[70vh] w-full"
        title="المستند المصدر"
      />
    </div>
  );
}
