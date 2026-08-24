import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Excludes /api: Route Handlers can set their own cookies (unlike Server
  // Components) and each already calls auth.getUser() itself, so running
  // the proxy for them would just be a second Auth-server round trip on
  // every action — the exact request path where that latency matters most.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
