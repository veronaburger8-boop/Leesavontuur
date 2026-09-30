import Link from "next/link";
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
  },
  en: {
    level: "Level",
    start: "Start today's lesson",
    waiting: (next: number) => `We're still waiting for Mom or Dad's answer about Level ${next}.`,
    challenge: (next: number) => `Your next lesson is a challenge lesson from Level ${next}!`,
    declined: (level: number) => `Let's keep practising at Level ${level} for now.`,
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
      return { language, learner, request, declined: Boolean(declined?.length) };
    }),
  );

  return (
    <main>
      <section className="panel" style={{ textAlign: "center" }}>
        <h1>{learners[0].name}</h1>
        <div className="cards" style={{ marginTop: 18 }}>
          {cards.map(({ language, learner, request, declined }) => {
            const t = text[language];
            return (
              <Link key={language} href={`/learn/${learnerId}/${language}`} className="card" lang={language} style={{ textDecoration: "none" }}>
                <h2>{language === "af" ? "Afrikaans" : "English"}</h2>
                <p className="sub">
                  {t.level} {learner.level}
                </p>
                {request?.status === "pending" && <p className="message info">{t.waiting(request.toLevel)}</p>}
                {request?.status === "approved" && <p className="message ok">{t.challenge(request.toLevel)}</p>}
                {declined && !request && <p className="message info">{t.declined(learner.level)}</p>}
                <span className="button primary">{t.start}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
