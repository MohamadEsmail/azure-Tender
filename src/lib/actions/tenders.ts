"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fixtureData, seedFlags, seedInputFlags, requiredInputs } from "@/lib/fixture";

const BUCKET = "tender-files";
const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB per file — see SPEC §8.

function safeName(name: string): string {
  return name.replace(/[^\w.\-]+/g, "_").slice(-120);
}

/**
 * Creates a tender, uploads its source files to private Storage, and — because
 * Phase 1 has no extraction job — seeds the extracted record from the fixture
 * plus its confidence flags and the missing-data task list. This seed is the
 * stand-in the extractor will later replace.
 */
export async function createTender(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const client = String(formData.get("client") ?? "").trim() || null;
  const deadline = String(formData.get("deadline") ?? "").trim() || null;
  if (!title) throw new Error("Title is required");

  const contractNo =
    (fixtureData.meta as Record<string, unknown> | undefined)?.contract_no != null
      ? String((fixtureData.meta as Record<string, unknown>).contract_no)
      : null;

  // 1. Create the tender row (RLS: only admin/lead may insert).
  const { data: tender, error: tErr } = await supabase
    .from("tenders")
    .insert({
      title,
      client,
      deadline,
      contract_no: contractNo,
      owner_id: user.id,
      status: "draft",
    })
    .select("id")
    .single();
  if (tErr || !tender) throw tErr ?? new Error("Failed to create tender");

  // 2. Record owner membership explicitly.
  await supabase
    .from("tender_members")
    .insert({ tender_id: tender.id, user_id: user.id });

  // 3. Upload source files to the private bucket, keyed under the tender id.
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      throw new Error(`File ${file.name} exceeds the 50 MB limit`);
    }
    const path = `${tender.id}/${Date.now()}_${safeName(file.name)}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (upErr) throw upErr;

    await supabase.from("tender_files").insert({
      tender_id: tender.id,
      path,
      kind: file.name.split(".").pop()?.toLowerCase() ?? null,
      size_bytes: file.size,
      uploaded_by: user.id,
    });
  }

  // 4. Seed the extracted record (fixture) — Phase 1 stand-in for extraction.
  await supabase.from("tender_data").insert({
    tender_id: tender.id,
    data: fixtureData,
    version: 1,
    updated_by: user.id,
  });

  // 5. Seed confidence flags: green/amber for mapped fields, red for the
  //    required inputs the tender cannot supply.
  const flags = [...seedFlags(), ...seedInputFlags()].map((f) => ({
    ...f,
    tender_id: tender.id,
  }));
  await supabase.from("field_flags").insert(flags);

  // 6. Seed the missing-data task list from the tender's required inputs.
  const inputs = requiredInputs().map((_, i) => ({
    tender_id: tender.id,
    field_path: `inputs_required_from_azure[${i}]`,
  }));
  if (inputs.length) await supabase.from("assignments").insert(inputs);

  // 7. Data is present but needs human confirmation → awaiting_data.
  await supabase.from("tenders").update({ status: "awaiting_data" }).eq("id", tender.id);

  revalidatePath("/tenders");
  redirect(`/tenders/${tender.id}/review`);
}
