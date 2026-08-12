import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import type { AppRole } from "@/lib/db/database.types";

export interface SessionProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
}

/** The signed-in auth user, or null. */
export async function getUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Require a signed-in user; redirect to sign-in otherwise. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/sign-in");
  return user;
}

/** Require a user and load their profile (role, name). */
export async function requireProfile(): Promise<SessionProfile> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .single();

  if (!data) {
    // Authenticated but no profile row — provisioning is incomplete.
    redirect("/sign-in");
  }
  return data as unknown as SessionProfile;
}

/** Require the signed-in user to hold one of the given global roles. */
export async function requireRole(roles: AppRole[]): Promise<SessionProfile> {
  const profile = await requireProfile();
  if (!roles.includes(profile.role)) {
    redirect("/dashboard");
  }
  return profile;
}
