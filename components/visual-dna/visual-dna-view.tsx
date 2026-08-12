import type { VisualDNA } from "@/lib/agents/art-director";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Presentational render of the Visual DNA (design system). Server component. */
export function VisualDnaView({
  dna,
  referenceUrls,
}: {
  dna: VisualDNA;
  referenceUrls: string[];
}) {
  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-muted/40">
        <CardContent className="space-y-1 p-6">
          <div className="text-xs font-medium text-muted-foreground">
            المفهوم البصري الرئيسي
          </div>
          <p className="text-lg font-semibold leading-relaxed">
            {dna.master_concept}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>الهندسة والبنية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="الهندسة الأساسية" value={dna.primary_geometry} />
            <Row label="الهندسة الثانوية" value={dna.secondary_geometry} />
            <Row label="الشكل المميّز" value={dna.signature_shape} />
            <Row label="اللغة الإنشائية" value={dna.structural_language} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الإضاءة والأنماط</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="لغة الإضاءة" value={dna.lighting_language} />
            <Row label="نظام الأنماط" value={dna.pattern_system} />
            <Row label="الجرافيك البيئي" value={dna.environmental_graphics} />
          </CardContent>
        </Card>
      </div>

      {/* Colour palette */}
      {dna.color_palette?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>لوحة الألوان</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {dna.color_palette.map((c, i) => (
              <div key={i} className="text-center">
                <div
                  className="h-14 w-14 rounded-lg border border-border"
                  style={{ backgroundColor: c.hex }}
                />
                <div className="mt-1 text-xs">{c.name}</div>
                <div dir="ltr" className="text-[10px] text-muted-foreground">
                  {c.hex}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Materials */}
      {dna.material_palette?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>لوحة الخامات</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {dna.material_palette.map((m, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <div className="font-medium">{m.name}</div>
                {m.description ? (
                  <p className="text-sm text-muted-foreground">{m.description}</p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {dna.architectural_keywords?.length ? (
          <Chips
            title="كلمات معمارية (لتوليد الصور)"
            items={dna.architectural_keywords}
            tone="muted"
          />
        ) : null}
        {dna.forbidden_styles?.length ? (
          <Chips
            title="أنماط ممنوعة"
            items={dna.forbidden_styles}
            tone="red"
          />
        ) : null}
      </div>

      {dna.brand_rules?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>قواعد العلامة</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 ps-5 text-sm">
              {dna.brand_rules.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {/* Locked reference images — the seeds later renders inherit from */}
      {referenceUrls.length ? (
        <Card>
          <CardHeader>
            <CardTitle>الصور المرجعية المعتمدة</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {referenceUrls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt={`reference ${i + 1}`}
                className="aspect-video w-full rounded-lg border border-border object-cover"
              />
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span>{value}</span>
    </div>
  );
}

function Chips({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "muted" | "red";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {items.map((it, i) => (
          <span
            key={i}
            dir="auto"
            className={
              tone === "red"
                ? "rounded-full bg-[hsl(var(--confidence-red))]/12 px-2 py-0.5 text-xs text-[hsl(var(--confidence-red))]"
                : "rounded-full bg-muted px-2 py-0.5 text-xs"
            }
          >
            {it}
          </span>
        ))}
      </CardContent>
    </Card>
  );
}
