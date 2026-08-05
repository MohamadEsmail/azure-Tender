// Bootstrap a confirmed admin user (sign-up is invite-only, so the first admin
// is seeded here). Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// from the environment or .env.local.
//
//   node scripts/create-admin.mjs [email] [password]
//
// Defaults: admin@azure-tender.local / Passw0rd!123

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

const email = process.argv[2] ?? "admin@azure-tender.local";
const password = process.argv[3] ?? "Passw0rd!123";

const admin = createClient(url, key, { auth: { persistSession: false } });
const { error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: "Admin", role: "admin" },
});
if (error && !/already been registered/i.test(error.message)) throw error;

const { error: pErr } = await admin.from("profiles").update({ role: "admin" }).eq("email", email);
if (pErr) throw pErr;

console.log(`Admin ready — sign in with ${email} / ${password}`);
