import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/auth/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on all routes except Next internals, static assets, and the worker
  // endpoint (which authenticates itself, not via a user session).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/worker|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
