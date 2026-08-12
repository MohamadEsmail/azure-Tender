import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { signOut } from "./actions";
import { Button } from "@/components/ui/button";

/**
 * Authenticated shell. Guards every /(app) route (redirects to sign-in when
 * there is no session) and frames the product in RTL with a top bar.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border print:hidden">
        <div className="container flex h-14 items-center justify-between">
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold">
              أزور الإبداعية
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              المشاريع
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {profile.full_name ?? profile.email}
            </span>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                خروج
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
}
