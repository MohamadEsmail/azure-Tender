import { redirect } from "next/navigation";

/**
 * Entry point. Middleware already gates access: an unauthenticated visitor is
 * redirected to /sign-in before reaching here, so this simply forwards into the
 * app.
 */
export default function HomePage() {
  redirect("/dashboard");
}
