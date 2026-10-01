import Link from "next/link";
import { Meerkat } from "@/components/art/meerkat";
import { notFound } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import type { Language } from "@/lib/content/types";
import { getLearner, getOpenRequest } from "@/lib/lesson/next";

export const metadata = { title: "Lees" };

const text = {
  af: {
    level: "Vlak",
    start: "Begin vandag se les",
    waiting: (next: number) => `Ons wag nog vir Ma of Pa se antwoord oor Vlak ${next}.`,
    challenge: (next: number) => `Jou volgende les is 'n uitdagingsles van Vlak ${next}!`,
    declined: (level: number) => `Kom ons oefen nog 'n bietjie op Vlak ${level}.`,
    progress: (done: number, total: number) => `${done} van ${total} lesse gelees`,
  },
  en: {
    level: "Level",
    start: "Start today's lesson",
    waiting: (next: number) => `We're still waiting for Mom or Dad's answer about Level ${next}.`,
    challenge: (next: number) => `Your next lesson is a challenge lesson from Level ${next}!`,
    declined: (level: number) => `Let's keep practising at Level ${level} for now.`,
    progress: (done: number, total: number) => `${done} of ${total} lessons read`,
  },
};

/** The child's home: one big button per language, each in its own language. */
export default async function LearnerHome({ params }: PageProps<"/learn/[learnerId]">) {
  const { learnerId } = await params;
  const { supabase } = await requireAccount(`/learn/${learnerId}`);
  const languages: Language[] = ["af", "en"];
  const learners = await Promise.all(languages.map((l) => getLearner(supabase, learnerId, l)));
  if (!learners[0] || !learners[1]) notFound();

  const cards = await Promise.all(
    languages.map(async (language, i) => {
      const learner = learners[i]!;
      const request = await getOpenRequest(supabase, learnerId, language);
      // A kind message once, after the parent said "not yet".
      const { data: declined } = await supabase
        .from("level_requests")
        .select("id")
        .eq("learner_id", learnerId)
        .eq("language", language)
        .eq("status", "declined")
        .eq("child_informed", false)
        .limit(1);
      if (declined?.length) await supabase.from("level_requests").update({ child_informed: true }).eq("id", declined[0].id);
      // Progress at the current level: which published lessons have been read.
      const [{ data: lessons }, { data: read }] = await Promise.all([
        supabase.from("content_items").select("id").eq("type", "lesson").eq("language", language).eq("level", learner.level).eq("status", "published"),
        supabase.from("lesson_results").select("content_id").eq("learner_id", learnerId).eq("language", language).eq("level", learner.level).eq("content_type", "lesson"),
      ]);
      const readIds = new Set((read ?? []).map((r) => r.content_id));
      const total = lessons?.length ?? 0;
      const done = (lessons ?? []).filter((x) => readIds.has(x.id)).length;
      return { language, learner, request, declined: Boolean(declined?.length), done, total };
    }),
  );

  return (
    <main>
      <section className="panel" style={{ textAlign: "center" }}>
        <Meerkat size={90} className="child-mascot" />
        <h1>{learners[0].name}</h1>
        <div className="card games-banner" style={{ marginTop: 18 }}>
          <h2>🎲 Speletjies · Games</h2>
          <p className="sub" style={{ margin: "0 0 10px" }}>
            🎈 Galgie · ✨ Vuurvliegie · 🔍 Soek-en-vind · 🦘 Spring-woorde
          </p>
          <Link className="button primary" href={`/learn/${learnerId}/games`}>
            Speel · Play
          </Link>
        </div>
        <div className="cards" style={{ marginTop: 18 }}>
          {cards.map(({ language, learner, request, declined, done, total }) => {
            const t = text[language];
            return (
              <Link key={language} href={`/learn/${learnerId}/${language}`} className="card" lang={language} style={{ textDecoration: "none" }}>
                <h2>{language === "af" ? "Afrikaans" : "English"}</h2>
                <p className="sub">
                  {t.level} {learner.level}
                </p>
                <div className="path" aria-label={t.progress(done, total)}>
                  {Array.from({ length: total }, (_, i) => (
                    <div key={i} className={`stone${i < done ? " done" : i === done ? " now" : ""}`} aria-hidden="true">
                      {i + 1}
                    </div>
                  ))}
                  <div className="path-label">{t.progress(done, total)}</div>
                </div>
                {request?.status === "pending" && <p className="message info">{t.waiting(request.toLevel)}</p>}
                {request?.status === "approved" && <p className="message ok">{t.challenge(request.toLevel)}</p>}
                {declined && !request && <p className="message info">{t.declined(learner.level)}</p>}
                <span className="button primary">{t.start}</span>
              </Link>
            );
          })}
        </div>
        <p style={{ marginTop: 18 }}>
          <Link className="button" href={`/learn/${learnerId}/topics`}>
            ⭐ My onderwerpe · My topics
          </Link>
        </p>
      </section>
    </main>
  );
}
