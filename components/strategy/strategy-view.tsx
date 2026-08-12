import type { CreativeStrategy } from "@/lib/agents/creative-strategist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Presentational render of the creative strategy. Server component. */
export function StrategyView({ strategy }: { strategy: CreativeStrategy }) {
  return (
    <div className="space-y-6">
      {/* Big Idea hero */}
      <Card className="border-primary/30 bg-muted/40">
        <CardContent className="space-y-2 p-6">
          <div className="text-xs font-medium text-muted-foreground">
            الفكرة الكبرى
          </div>
          <h2 className="text-2xl font-bold">{strategy.big_idea.title}</h2>
          <p className="leading-relaxed">{strategy.big_idea.statement}</p>
          <Rationale text={strategy.big_idea.rationale} />
        </CardContent>
      </Card>

      <PointCard title="مفهوم الفعالية" point={strategy.event_concept} />

      <TextCard title="السرد الإبداعي" text={strategy.creative_narrative} />
      {strategy.storytelling_direction ? (
        <TextCard title="اتجاه السرد" text={strategy.storytelling_direction} />
      ) : null}

      {strategy.guest_journey?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>رحلة الضيف</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {strategy.guest_journey.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-medium">{s.stage}</div>
                    <p className="text-sm text-muted-foreground">
                      {s.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}

      {strategy.experience_philosophy ? (
        <TextCard title="فلسفة التجربة" text={strategy.experience_philosophy} />
      ) : null}

      {strategy.design_principles?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>مبادئ التصميم</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {strategy.design_principles.map((p, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <div className="font-medium">{p.name}</div>
                <p className="text-sm text-muted-foreground">{p.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Visual language — the seed for Moodboard + Visual DNA later */}
      <Card>
        <CardHeader>
          <CardTitle>اللغة البصرية</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="المزاج" value={strategy.visual_language.mood} />
          <Field label="الأجواء" value={strategy.visual_language.atmosphere} />
          <Field label="الخامات" value={strategy.visual_language.materials} />
          <Field
            label="اتجاه الإضاءة"
            value={strategy.visual_language.lighting_direction}
          />
          <Field
            label="اتجاه الألوان"
            value={strategy.visual_language.color_direction}
          />
          {strategy.visual_language.keywords?.length ? (
            <div className="sm:col-span-2">
              <div className="mb-1 text-xs text-muted-foreground">كلمات مفتاحية</div>
              <div className="flex flex-wrap gap-2">
                {strategy.visual_language.keywords.map((k, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-muted px-2 py-0.5 text-xs"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {strategy.technology_integration ? (
          <TextCard title="دمج التقنية" text={strategy.technology_integration} />
        ) : null}
        {strategy.cultural_references ? (
          <TextCard title="مرجعيات ثقافية" text={strategy.cultural_references} />
        ) : null}
        {strategy.sustainability ? (
          <TextCard title="الاستدامة" text={strategy.sustainability} />
        ) : null}
        {strategy.innovation ? (
          <TextCard title="الابتكار" text={strategy.innovation} />
        ) : null}
      </div>
    </div>
  );
}

function Rationale({ text }: { text: string }) {
  return (
    <p className="border-s-2 border-primary/40 ps-3 text-sm text-muted-foreground">
      <span className="font-medium">لماذا: </span>
      {text}
    </p>
  );
}

function PointCard({ title, point }: { title: string; point: { statement: string; rationale: string } }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="leading-relaxed">{point.statement}</p>
        <Rationale text={point.rationale} />
      </CardContent>
    </Card>
  );
}

function TextCard({ title, text }: { title: string; text: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="leading-relaxed text-sm">{text}</p>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <p className="text-sm">{value}</p>
    </div>
  );
}
