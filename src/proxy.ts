import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // Lets the language switch return to the page it was pressed on.
  request.headers.set("x-pathname", request.nextUrl.pathname + request.nextUrl.search);
  return updateSession(request);
}

export const config = {
  // Every page except static files and images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"],
};
