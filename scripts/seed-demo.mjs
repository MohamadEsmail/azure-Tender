// Seed a demo tender from the sample fixture, owned by the given admin, so the
// review screen has data to show without going through the upload flow. This is
// the same seed the (future) extraction job will produce — see src/lib/fixture.ts.
//
//   node scripts/seed-demo.mjs [owner-email]
//
// Default owner: admin@azure-tender.local

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";

function loadEnvLocal() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. in .env.local).");
  process.exit(1);
}

const ownerEmail = process.argv[2] ?? "admin@azure-tender.local";
const fixture = JSON.parse(readFileSync("samples/alain-g242026.json", "utf8"));
const admin = createClient(url, key, { auth: { persistSession: false } });

// Mirror of src/lib/field-map.ts scalar paths + the amber (needs-confirm) set.
const paths = [
  "meta.contract_no", "meta.rfq_no", "meta.title_ar", "meta.client_ar", "meta.client_en",
  "meta.form_ref", "meta.governing_language", "meta.contract_model", "meta.contract_end",
  "meta.start_trigger", "meta.subcontract_cap_pct", "technical_exclusion_below_pct",
  "scope_summary.events_total", "scope_summary.medium_events", "scope_summary.small_events",
  "scope_summary.duration_days_each", "scope_summary.national_initiative",
];
const amber = new Set([
  "meta.contract_model", "meta.start_trigger", "meta.subcontract_cap_pct",
  "scope_summary.national_initiative", "technical_exclusion_below_pct",
]);

const { data: prof, error: profErr } = await admin
  .from("profiles").select("id").eq("email", ownerEmail).single();
if (profErr || !prof) {
  console.error(`No profile for ${ownerEmail}. Run scripts/create-admin.mjs first.`);
  process.exit(1);
}
const owner = prof.id;

const { data: tender, error: tErr } = await admin.from("tenders").insert({
  title: "تنظيم فعاليات التواجد البلدي 2026-2027",
  client: "بلدية مدينة العين",
  contract_no: fixture.meta?.contract_no ?? null,
  deadline: "2027-03-31",
  owner_id: owner,
  status: "awaiting_data",
}).select("id").single();
if (tErr) throw tErr;
const id = tender.id;

await admin.from("tender_members").insert({ tender_id: id, user_id: owner });
await admin.from("tender_data").insert({ tender_id: id, data: fixture, version: 1, updated_by: owner });

const flags = paths.map((p, i) => ({
  tender_id: id, field_path: p,
  confidence: amber.has(p) ? "amber" : "green",
  source_page: (i % 8) + 1,
  status: amber.has(p) ? "unconfirmed" : "confirmed",
}));
const inputs = (fixture.inputs_required_from_azure ?? []).map((_, i) => ({
  tender_id: id, field_path: `inputs_required_from_azure[${i}]`,
  confidence: "red", source_page: null, status: "missing",
}));
await admin.from("field_flags").insert([...flags, ...inputs]);
await admin.from("assignments").insert(inputs.map((f) => ({ tender_id: id, field_path: f.field_path })));

console.log(`Seeded demo tender ${id} for ${ownerEmail}. Open /tenders/${id}/review`);
