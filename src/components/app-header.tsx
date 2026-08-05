import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/types";

const ROLE_LABELS: Record<string, string> = {
  admin: "مسؤول",
  lead: "قائد فريق",
  member: "عضو",
  approver: "معتمِد",
  viewer: "مشاهد",
};

export function AppHeader({ profile }: { profile: Profile | null }) {
  return (
    <header className="border-b bg-card">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/tenders" className="font-semibold">
          نظام ملفات المناقصات
        </Link>
        <div className="flex items-center gap-4">
          {profile && (
            <span className="text-sm text-muted-foreground">
              {profile.full_name || profile.email}
              {" · "}
              {ROLE_LABELS[profile.role] ?? profile.role}
            </span>
          )}
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              خروج
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
