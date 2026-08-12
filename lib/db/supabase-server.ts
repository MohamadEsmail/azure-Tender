import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";
import type { Database } from "@/lib/db/database.types";

/**
 * Request-scoped Supabase client bound to the signed-in user's cookies.
 * All queries run under Row Level Security as that user — this is the ONLY
 * client that should serve user-facing reads and writes.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    serverEnv.supabaseUrl(),
    serverEnv.supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component where cookies are read-only.
            // Session refresh is handled in middleware instead.
          }
        },
      },
    },
  );
}

/**
 * Service-role client that BYPASSES Row Level Security. Use only inside
 * background jobs / the worker, never in response to a raw user request.
 * It carries no user identity, so every call must scope its own access.
 */
export function createSupabaseServiceClient() {
  return createClient<Database>(
    serverEnv.supabaseUrl(),
    serverEnv.supabaseServiceRoleKey(),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
