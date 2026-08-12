import type { SlideView } from "@/lib/data/presentation";

/** Renders the proposal deck as a stack of 16:9 slides (print-friendly). */
export function PresentationDeck({ slides }: { slides: SlideView[] }) {
  return (
    <div className="deck space-y-6">
      {slides.map((slide, i) => (
        <Slide key={i} slide={slide} index={i} total={slides.length} />
      ))}
    </div>
  );
}

function Slide({
  slide,
  index,
  total,
}: {
  slide: SlideView;
  index: number;
  total: number;
}) {
  const c = slide.content as Record<string, string | undefined> & {
    steps?: { stage: string; description: string }[];
    colors?: { name: string; hex: string }[];
    keywords?: string[];
    materials?: string[];
  };
  const layout = c.layout ?? "text";

  return (
    <div className="slide relative flex aspect-video w-full flex-col justify-center overflow-hidden rounded-xl border border-border bg-background p-10">
      {layout === "cover" ? (
        <div className="space-y-3 text-center">
          <div className="text-sm text-muted-foreground">{c.client}</div>
          <h2 className="text-4xl font-bold">{c.title}</h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {c.subtitle}
          </p>
        </div>
      ) : null}

      {layout === "text" ? (
        <div className="space-y-3">
          <h3 className="text-2xl font-bold">{c.heading}</h3>
          {c.subheading ? (
            <div className="text-lg font-medium text-primary">{c.subheading}</div>
          ) : null}
          <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
            {c.body}
          </p>
        </div>
      ) : null}

      {layout === "journey" ? (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold">{c.heading}</h3>
          <ol className="grid grid-cols-2 gap-3">
            {(c.steps ?? []).map((s, i) => (
              <li key={i} className="rounded-lg border border-border p-3">
                <div className="text-sm font-semibold">{s.stage}</div>
                <div className="text-sm text-muted-foreground">
                  {s.description}
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {layout === "visual" ? (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold">{c.heading}</h3>
          <div className="flex flex-wrap gap-2">
            {(c.colors ?? []).map((col, i) => (
              <div key={i} className="text-center">
                <div
                  className="h-12 w-12 rounded-md border border-border"
                  style={{ backgroundColor: col.hex }}
                />
                <div className="text-[10px]">{col.name}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {[...(c.keywords ?? []), ...(c.materials ?? [])].map((k, i) => (
              <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                {k}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {layout === "gallery" ? (
        <div className="absolute inset-0">
          {slide.imageUrls[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slide.imageUrls[0]}
              alt={c.heading ?? ""}
              className="h-full w-full object-cover"
            />
          ) : null}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
            <div className="text-xl font-bold">{c.heading}</div>
            {c.caption ? <div className="text-sm opacity-90">{c.caption}</div> : null}
          </div>
        </div>
      ) : null}

      {layout === "closing" ? (
        <div className="space-y-3 text-center">
          <h3 className="text-3xl font-bold">{c.heading}</h3>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {c.body}
          </p>
        </div>
      ) : null}

      <div className="absolute bottom-3 left-4 text-[10px] text-muted-foreground">
        {index + 1} / {total}
      </div>
    </div>
  );
}
