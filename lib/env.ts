import "server-only";

/**
 * Server-side environment access. Centralising this keeps secret keys off the
 * client: importing this module from a client component is a build error
 * (`server-only`). Each getter throws a clear message if a required secret is
 * missing, so misconfiguration fails loudly at first use rather than silently.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example.`,
    );
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const serverEnv = {
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),

  anthropicApiKey: () => required("ANTHROPIC_API_KEY"),
  higgsfieldCredentials: () => required("HF_CREDENTIALS"),

  defaultImageProvider: () => optional("DEFAULT_IMAGE_PROVIDER", "higgsfield"),
  appUrl: () => optional("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
};

/** Public config that is safe to expose to the browser (RLS-gated). */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};
