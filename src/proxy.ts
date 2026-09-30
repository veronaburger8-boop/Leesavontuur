import { type NextRequest, NextResponse } from "next/server";
import { CHILD_COOKIE, isChildPath, isParentPath } from "@/lib/child-mode";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // In child mode the parent area is locked until the parent enters the PIN.
  if (request.cookies.get(CHILD_COOKIE)?.value === "1" && isParentPath(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/unlock";
    url.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  const response = await updateSession(request);
  // Starting to read switches this device to child mode. Background
  // pre-loading of a link (prefetch) doesn't count: only really opening it.
  // Set it once, on opening a page (GET): a cookie sent back with a saved
  // lesson (a POST) would make the page reload and lose the lesson's report.
  const alreadyChild = request.cookies.get(CHILD_COOKIE)?.value === "1";
  const prefetch =
    request.headers.has("next-router-prefetch") ||
    request.headers.get("purpose") === "prefetch" ||
    (request.headers.get("sec-purpose") ?? "").includes("prefetch");
  if (isChildPath(path) && request.method === "GET" && !alreadyChild && !prefetch)
    response.cookies.set(CHILD_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  return response;
}

export const config = {
  // Every page except static files and images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"],
};
