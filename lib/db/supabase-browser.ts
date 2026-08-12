"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/lib/db/database.types";

/**
 * Browser Supabase client. Uses the public anon key, which is safe to ship —
 * every table is protected by Row Level Security, so the anon key alone grants
 * nothing without a valid authenticated session.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
  );
}
