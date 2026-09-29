import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listLearners } from "../data";

/** Everything the site stores about the signed-in parent's family, as a JSON file (POPIA). */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { supabase, user, profile } = session;
  const learners = await listLearners(supabase);
  const body = {
    exportedAt: new Date().toISOString(),
    account: {
      email: user.email,
      name: profile.display_name,
      language: profile.locale,
      createdAt: user.created_at,
      privacyPolicyAccepted: { version: profile.privacy_version, at: profile.privacy_accepted_at },
    },
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
