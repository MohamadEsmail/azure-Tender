"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";

export interface SignInState {
  error?: string;
}

/**
 * Email + password sign-in. Access is invite-only — there is no sign-up action;
 * accounts are provisioned by an admin. A generic error message avoids leaking
 * whether an email exists.
 */
export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "يرجى إدخال البريد وكلمة المرور." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "بيانات الدخول غير صحيحة." };
  }

  redirect("/dashboard");
}
