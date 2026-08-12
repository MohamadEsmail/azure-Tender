"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  generateSpaceRender,
  reviseSpaceRender,
} from "@/app/(app)/projects/[id]/spaces/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SpaceView } from "@/lib/data/spaces";

export function SpaceCard({
  projectId,
  space,
}: {
  projectId: string;
  space: SpaceView;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [instruction, setInstruction] = useState("");

  const latest = space.renders[space.renders.length - 1];

  function generate() {
    startTransition(async () => {
      await generateSpaceRender(projectId, space.id);
      router.refresh();
    });
  }

  function revise() {
    if (!latest || !instruction.trim()) return;
    const text = instruction;
    setInstruction("");
    startTransition(async () => {
      await reviseSpaceRender(projectId, latest.id, text);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>{space.name_ar ?? space.name_en}</CardTitle>
            <p className="text-xs text-muted-foreground" dir="ltr">
              {space.name_en}
            </p>
          </div>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {space.renders.length
              ? `V${latest?.version.toString().padStart(2, "0")}`
              : "بدون تصور"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{space.requirements}</p>

        {space.renders.length === 0 ? (
          <Button size="sm" disabled={pending} onClick={generate}>
            {pending ? "…" : "توليد تصور"}
          </Button>
        ) : (
          <>
            {latest?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={latest.url}
                alt={space.name_en ?? ""}
                className="aspect-video w-full rounded-lg border border-border object-cover"
              />
            ) : null}

            {/* Version chain */}
            {space.renders.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {space.renders.map((r) => (
                  <a
                    key={r.id}
                    href={r.url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    V{r.version.toString().padStart(2, "0")}
                  </a>
                ))}
              </div>
            ) : null}

            {/* Revision instruction */}
            <div className="flex gap-2">
              <input
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="تعديل: مثال — كبّر الشاشة، خامة خشب دافئ…"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={pending || !instruction.trim()}
                onClick={revise}
              >
                {pending ? "…" : "تعديل"}
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={generate}
            >
              توليد بديل جديد
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
