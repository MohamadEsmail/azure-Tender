"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { setPath } from "@/lib/path";
import type { Confidence, FlagStatus, TenderData } from "@/lib/types";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

async function setFlag(
  supabase: ReturnType<typeof createClient>,
  tenderId: string,
  fieldPath: string,
  confidence: Confidence,
  status: FlagStatus,
) {
  await supabase
    .from("field_flags")
    .update({ confidence, status, updated_at: new Date().toISOString() })
    .eq("tender_id", tenderId)
    .eq("field_path", fieldPath);
}

/**
 * Confirm an amber field without changing its value: a one-click "this is
 * correct" that turns the field green.
 */
export async function confirmField(tenderId: string, fieldPath: string) {
  const { supabase } = await requireUser();
  await setFlag(supabase, tenderId, fieldPath, "green", "confirmed");
  revalidatePath(`/tenders/${tenderId}/review`);
  revalidatePath("/tenders");
}

/**
 * Edit a field's value. Writes into tender_data.data at `dataPath` and marks the
 * field green/confirmed. For required inputs, `flagPath` differs from `dataPath`
 * (the flag tracks the red item; the value is stored under inputs_provided).
 */
export async function saveField(args: {
  tenderId: string;
  flagPath: string;
  dataPath?: string;
  value: string;
  type?: "text" | "number" | "date" | "boolean";
  isInput?: boolean;
}) {
  const { supabase, user } = await requireUser();
  const { tenderId, flagPath, value, type = "text", isInput = false } = args;
  const dataPath = args.dataPath ?? flagPath;

  // Coerce to the field's type; empty stays null so red fields don't go green
  // on an empty save.
  let coerced: unknown = value;
  if (value === "") coerced = null;
  else if (type === "number") coerced = Number(value);
  else if (type === "boolean") coerced = value === "true";

  const { data: row } = await supabase
    .from("tender_data")
    .select("id, data")
    .eq("tender_id", tenderId)
    .order("version", { ascending: false })
    .limit(1)
    .single();
  if (!row) throw new Error("No tender data");

  const next = setPath((row.data ?? {}) as TenderData, dataPath, coerced);
  await supabase
    .from("tender_data")
    .update({ data: next, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("id", row.id);

  const filled = coerced != null && coerced !== "";
  await setFlag(
    supabase,
    tenderId,
    flagPath,
    filled ? "green" : "red",
    filled ? "confirmed" : "missing",
  );

  if (isInput) {
    await supabase
      .from("assignments")
      .update({ done: filled })
      .eq("tender_id", tenderId)
      .eq("field_path", flagPath);
  }

  revalidatePath(`/tenders/${tenderId}/review`);
  revalidatePath("/tenders");
}
