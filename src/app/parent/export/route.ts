import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { listLearners } from "../data";

/** Everything the site stores about the signed-in parent's family, as a JSON file (POPIA). */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { supabase, user, profile } = session;
  const [learners, { data: subscription }, { data: payments }] = await Promise.all([
    listLearners(supabase),
    supabase.from("subscriptions").select("status, pilot, paid_until, started_at, cancelled_at").eq("parent_id", user.id).maybeSingle(),
    // Parents can't read the payment log directly, so it is fetched for them here (their own rows only).
    createAdminClient().from("payment_events").select("payment_status, amount_cents, received_at").eq("parent_id", user.id).order("received_at"),
  ]);
  const body = {
    exportedAt: new Date().toISOString(),
    account: {
      email: user.email,
      name: profile.display_name,
      language: profile.locale,
      createdAt: user.created_at,
      privacyPolicyAccepted: { version: profile.privacy_version, at: profile.privacy_accepted_at },
    },
    subscription: subscription ?? null,
    payments: (payments ?? []).map((p) => ({ status: p.payment_status, amountRand: p.amount_cents === null ? null : p.amount_cents / 100, at: p.received_at })),
    children: learners.map((l) => ({
      name: l.name,
      grade: l.grade,
      addedAt: l.created_at,
      languages: l.learner_languages.map((x) => ({ language: x.language, level: x.level, readingWordsPerMinute: x.reading_wpm })),
    })),
  };
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": 'attachment; filename="leesavontuur-data.json"',
      "cache-control": "private, no-store",
    },
  });
}
