import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Where the links in confirmation and password-reset emails land. Supports
 * both link styles Supabase can send: ?token_hash=…&type=… and ?code=….
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeNext(params.get("next"));
  const supabase = await createClient();

  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const code = params.get("code");

  let ok = false;
  if (tokenHash && type) ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  else if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;

  const target = request.nextUrl.clone();
  target.search = "";
  target.pathname = ok ? next : "/login";
  if (!ok) target.searchParams.set("error", "link");
  return NextResponse.redirect(target);
}
